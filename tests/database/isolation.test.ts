import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// PostgreSQL engine, not a mocked query layer. Only Supabase-managed auth/storage
// schemas are minimally reproduced; all production migrations run unchanged.
test("PostgreSQL: tenant isolation and financial integrity", async (t) => {
  const db = new PGlite();
  const userA = "10000000-0000-4000-8000-000000000001";
  const userB = "10000000-0000-4000-8000-000000000002";
  const member = "10000000-0000-4000-8000-000000000003";
  const clientA = "20000000-0000-4000-8000-000000000001";
  const clientB = "20000000-0000-4000-8000-000000000002";
  const eventA = "30000000-0000-4000-8000-000000000001";
  const eventB = "30000000-0000-4000-8000-000000000002";
  const paymentA = "40000000-0000-4000-8000-000000000001";
  const paymentB = "40000000-0000-4000-8000-000000000002";
  try {
    await db.exec(`
      create role anon nologin; create role authenticated nologin;
      create schema auth; create schema storage;
      create table auth.users (id uuid primary key, raw_user_meta_data jsonb, email text);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
      create table storage.buckets (id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),name text, unique(bucket_id,name));
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated,anon;
      grant select,insert,update,delete on storage.objects to authenticated,anon;
    `);
    for (const name of (await readdir("supabase/migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(`supabase/migrations/${name}`, "utf8"));
    await t.test(
      "failed business/profile creation rolls back the entire Auth insert",
      async () => {
        for (const target of ["businesses", "profiles"]) {
          await db.exec(`create function private.fail_test_signup() returns trigger language plpgsql as $$ begin raise exception 'test_signup_failure'; end; $$;
          create trigger test_signup_failure before insert on public.${target} for each row execute function private.fail_test_signup();`);
          await assert.rejects(
            db.query(
              "insert into auth.users(id,raw_user_meta_data) values ($1,$2)",
              [userA, { business_name: "Failed signup", full_name: "Test" }],
            ),
          );
          for (const table of [
            "auth.users",
            "public.businesses",
            "public.profiles",
          ])
            assert.equal(
              (await db.query(`select * from ${table}`)).rows.length,
              0,
            );
          await db.exec(
            `drop trigger test_signup_failure on public.${target}; drop function private.fail_test_signup();`,
          );
        }
      },
    );
    await db.query(
      "insert into auth.users(id,raw_user_meta_data) values ($1, $2),($3,$4),($5,$6)",
      [
        userA,
        {
          full_name: "Ana",
          business_name: "A",
          role: "member",
          business_id: "forged",
        },
        userB,
        { full_name: "Bea", business_name: "B" },
        member,
        { full_name: "Member", business_name: "Temporary" },
      ],
    );
    const profiles = (
      await db.query<{ id: string; business_id: string; role: string }>(
        "select * from public.profiles",
      )
    ).rows;
    const businessA = profiles.find((p) => p.id === userA)!.business_id;
    const businessB = profiles.find((p) => p.id === userB)!.business_id;
    await db.query(
      "update public.profiles set business_id=$1,role='member' where id=$2",
      [businessA, member],
    );
    const asUser = async (id: string) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      await db.exec("set role authenticated");
    };
    await t.test(
      "registration atomically creates separate businesses and owner profiles",
      () => {
        assert.notEqual(businessA, businessB);
        assert.equal(profiles.find((p) => p.id === userA)?.role, "owner");
        assert.notEqual(businessA, "forged");
      },
    );
    for (const [user, business, client, event, payment] of [
      [userA, businessA, clientA, eventA, paymentA],
      [userB, businessB, clientB, eventB, paymentB],
    ]) {
      await asUser(user);
      await db.query(
        "insert into public.clients(id,business_id,name,phone) values($1,$2,'Cliente','5512345678')",
        [client, business],
      );
      await db.query(
        "insert into public.events(id,business_id,client_id,title,event_type,event_date,total_amount,status) values($1,$2,$3,'Evento','Cumpleaños','2026-09-17',100,'reserved')",
        [event, business, client],
      );
      await db.query(
        "insert into public.payments(id,business_id,event_id,amount,payment_type,payment_date) values($1,$2,$3,25,'deposit','2026-09-02')",
        [payment, business, event],
      );
      await db.query(
        "insert into public.expenses(business_id,event_id,description,amount,expense_date) values($1,$2,'Snacks',10,'2026-09-02')",
        [business, event],
      );
      await db.query(
        "insert into public.service_packages(business_id,name,base_price) values($1,'Básico',100)",
        [business],
      );
      await db.query(
        "insert into storage.objects(bucket_id,name) values('business-logos',$1)",
        [`${business}/logo`],
      );
    }
    for (const [user, ownBusiness, otherBusiness] of [
      [userA, businessA, businessB],
      [userB, businessB, businessA],
    ]) {
      await asUser(user);
      await t.test(
        `JWT ${user.slice(-1)} cannot read, update or delete another business`,
        async () => {
          for (const [table, column] of [
            ["clients", "name"],
            ["events", "title"],
            ["payments", "notes"],
            ["expenses", "description"],
            ["service_packages", "name"],
          ]) {
            assert.equal(
              (
                await db.query(
                  `select * from public.${table} where business_id=$1`,
                  [otherBusiness],
                )
              ).rows.length,
              0,
              table,
            );
            assert.equal(
              (
                await db.query(
                  `update public.${table} set ${column}='hacked' where business_id=$1 returning id`,
                  [otherBusiness],
                )
              ).rows.length,
              0,
              table,
            );
            assert.equal(
              (
                await db.query(
                  `delete from public.${table} where business_id=$1 returning id`,
                  [otherBusiness],
                )
              ).rows.length,
              0,
              table,
            );
            assert.equal(
              (
                await db.query(
                  `select * from public.${table} where business_id=$1`,
                  [ownBusiness],
                )
              ).rows.length,
              1,
              table,
            );
          }
          assert.equal(
            (
              await db.query("select * from public.businesses where id=$1", [
                otherBusiness,
              ])
            ).rows.length,
            0,
          );
          assert.equal(
            (
              await db.query(
                "select * from public.profiles where business_id=$1",
                [otherBusiness],
              )
            ).rows.length,
            0,
          );
        },
      );
    }
    await asUser(userA);
    await t.test(
      "forged business_id inserts are denied on all operational tables",
      async () => {
        await assert.rejects(
          db.query(
            "insert into public.clients(business_id,name,phone) values($1,'Attack','5512345678')",
            [businessB],
          ),
        );
        await assert.rejects(
          db.query(
            "insert into public.events(business_id,client_id,title,event_type,event_date,total_amount) values($1,$2,'Attack','Otro','2026-09-02',100)",
            [businessB, clientB],
          ),
        );
        await assert.rejects(
          db.query(
            "insert into public.payments(business_id,event_id,amount,payment_type,payment_date) values($1,$2,1,'partial','2026-09-02')",
            [businessB, eventB],
          ),
        );
        await assert.rejects(
          db.query(
            "insert into public.expenses(business_id,description,amount,expense_date) values($1,'Attack',1,'2026-09-02')",
            [businessB],
          ),
        );
        await assert.rejects(
          db.query(
            "insert into public.service_packages(business_id,name,base_price) values($1,'Attack',1)",
            [businessB],
          ),
        );
      },
    );
    await t.test(
      "composite foreign keys reject cross-tenant client/event references",
      async () => {
        await assert.rejects(
          db.query(
            "insert into public.events(business_id,client_id,title,event_type,event_date,total_amount) values($1,$2,'Attack','Otro','2026-09-02',100)",
            [businessA, clientB],
          ),
        );
        await assert.rejects(
          db.query(
            "insert into public.payments(business_id,event_id,amount,payment_type,payment_date) values($1,$2,1,'partial','2026-09-02')",
            [businessA, eventB],
          ),
        );
        await assert.rejects(
          db.query(
            "insert into public.expenses(business_id,event_id,description,amount,expense_date) values($1,$2,'Attack',1,'2026-09-02')",
            [businessA, eventB],
          ),
        );
      },
    );
    await t.test(
      "users cannot reassign rows, roles, profiles or business IDs",
      async () => {
        for (const table of [
          "clients",
          "events",
          "payments",
          "expenses",
          "service_packages",
        ])
          await assert.rejects(
            db.query(
              `update public.${table} set business_id=$1 where business_id=$2`,
              [businessB, businessA],
            ),
          );
        await assert.rejects(
          db.query("update public.profiles set business_id=$1 where id=$2", [
            businessB,
            userA,
          ]),
        );
        await assert.rejects(
          db.query("update public.profiles set role='member' where id=$1", [
            userA,
          ]),
        );
        await assert.rejects(
          db.query("update public.businesses set id=$1 where id=$2", [
            businessB,
            businessA,
          ]),
        );
        await assert.rejects(
          db.query("insert into public.businesses(name) values('Extra')"),
        );
        await assert.rejects(
          db.query("delete from public.profiles where id=$1", [userA]),
        );
      },
    );
    await t.test(
      "logo storage is isolated for reads, inserts, updates and deletes",
      async () => {
        assert.equal(
          (await db.query("select * from storage.objects")).rows.length,
          1,
        );
        await assert.rejects(
          db.query(
            "insert into storage.objects(bucket_id,name) values('business-logos',$1)",
            [`${businessB}/other`],
          ),
        );
        assert.equal(
          (
            await db.query(
              "update storage.objects set name='hacked' where name=$1 returning id",
              [`${businessB}/logo`],
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              "delete from storage.objects where name=$1 returning id",
              [`${businessB}/logo`],
            )
          ).rows.length,
          0,
        );
        await assert.rejects(
          db.query("update storage.objects set name=$1 where name=$2", [
            `${businessB}/logo`,
            `${businessA}/logo`,
          ]),
        );
      },
    );
    await t.test(
      "payments recalculate state and prevent overpayment or undercutting total",
      async () => {
        await assert.rejects(
          db.query("update public.events set total_amount=20 where id=$1", [
            eventA,
          ]),
        );
        await assert.rejects(
          db.query("update public.events set status='paid' where id=$1", [
            eventA,
          ]),
        );
        await assert.rejects(
          db.query(
            "insert into public.payments(business_id,event_id,amount,payment_type,payment_date) values($1,$2,76,'final','2026-09-02')",
            [businessA, eventA],
          ),
        );
        const final = (
          await db.query<{ id: string }>(
            "insert into public.payments(business_id,event_id,amount,payment_type,payment_date) values($1,$2,75,'final','2026-09-02') returning id",
            [businessA, eventA],
          )
        ).rows[0];
        assert.equal(
          (
            await db.query<{ status: string }>(
              "select status from public.events where id=$1",
              [eventA],
            )
          ).rows[0].status,
          "paid",
        );
        await db.query("delete from public.payments where id=$1", [final.id]);
        assert.equal(
          (
            await db.query<{ status: string }>(
              "select status from public.events where id=$1",
              [eventA],
            )
          ).rows[0].status,
          "reserved",
        );
        await assert.rejects(
          db.query("delete from public.events where id=$1", [eventA]),
        );
        await assert.rejects(
          db.query("delete from public.clients where id=$1", [clientA]),
        );
        await db.query(
          "update public.events set status='cancelled' where id=$1",
          [eventA],
        );
        await assert.rejects(
          db.query(
            "insert into public.payments(business_id,event_id,amount,payment_type,payment_date) values($1,$2,1,'partial','2026-09-02')",
            [businessA, eventA],
          ),
        );
        await db.query(
          "update public.events set status='reserved' where id=$1",
          [eventA],
        );
      },
    );
    await t.test(
      "member can operate but cannot edit settings, packages or elevate role",
      async () => {
        await asUser(member);
        assert.equal(
          (await db.query("select * from public.clients")).rows.length,
          1,
        );
        assert.equal(
          (
            await db.query(
              "update public.clients set notes='Member edit' where id=$1 returning id",
              [clientA],
            )
          ).rows.length,
          1,
        );
        assert.equal(
          (
            await db.query(
              "update public.businesses set name='Attack' returning id",
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              "update public.service_packages set name='Attack' returning id",
            )
          ).rows.length,
          0,
        );
        await assert.rejects(
          db.query("update public.profiles set role='owner' where id=$1", [
            member,
          ]),
        );
        await assert.rejects(
          db.query(
            "insert into storage.objects(bucket_id,name) values('business-logos',$1)",
            [`${businessA}/logo`],
          ),
        );
      },
    );
    await t.test(
      "optional seed creates the requested demo without duplicating data",
      async () => {
        await db.exec("reset role");
        const demoUser = "10000000-0000-4000-8000-000000000004";
        await db.query(
          "insert into auth.users(id,raw_user_meta_data,email) values($1,$2,'demo@example.com')",
          [demoUser, { full_name: "Demo", business_name: "Demo" }],
        );
        const seed = await readFile("supabase/seed_demo.sql", "utf8");
        await db.exec(seed);
        await asUser(demoUser);
        assert.equal(
          (await db.query("select * from public.clients")).rows.length,
          3,
        );
        assert.equal(
          (await db.query("select * from public.events")).rows.length,
          3,
        );
        assert.equal(
          (
            await db.query<{ status: string }>(
              "select status from public.events where title='Boda Mar & Luis'",
            )
          ).rows[0].status,
          "paid",
        );
        assert.equal(
          Number(
            (
              await db.query<{ sales: string }>(
                "select sum(total_amount) sales from public.events where status in ('reserved','paid','completed')",
              )
            ).rows[0].sales,
          ),
          12700,
        );
        await db.exec("reset role");
        await assert.rejects(db.exec(seed));
        await db.exec("rollback");
        await asUser(demoUser);
        assert.equal(
          (await db.query("select * from public.clients")).rows.length,
          3,
        );
      },
    );
    await t.test(
      "anonymous users cannot access application records or logos",
      async () => {
        await db.exec("reset role; set role anon");
        for (const table of [
          "businesses",
          "profiles",
          "clients",
          "events",
          "payments",
          "expenses",
          "service_packages",
        ])
          await assert.rejects(db.query(`select * from public.${table}`));
        assert.equal(
          (await db.query("select * from storage.objects")).rows.length,
          0,
        );
      },
    );
  } finally {
    await db.close();
  }
});
