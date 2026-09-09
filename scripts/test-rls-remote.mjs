import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { isPublicSupabaseKey } from "../src/lib/env.ts";
import { dashboardMetrics, eventFinance } from "../src/lib/finance.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key)
  throw new Error("Configura la URL y la clave pública en .env.local.");
assert.ok(
  isPublicSupabaseKey(key),
  "Las pruebas RLS requieren una clave pública; se rechazan claves privilegiadas.",
);
assert.equal(
  new URL(url).pathname,
  "/",
  "Usa la URL base de Supabase, sin /rest/v1/.",
);
const required = [
  "RLS_TEST_EMAIL_A",
  "RLS_TEST_PASSWORD_A",
  "RLS_TEST_EMAIL_B",
  "RLS_TEST_PASSWORD_B",
];
if (required.some((k) => !process.env[k]))
  throw new Error(
    "Configura dos cuentas de prueba confirmadas en las variables RLS_TEST_* del README.",
  );
const api = () =>
  createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
const actors = [];
async function insert(actor, table, values) {
  const id = randomUUID();
  actor.created.push({ table, id });
  const { data, error } = await actor.api
    .from(table)
    .insert({ ...values, id, business_id: actor.businessId })
    .select()
    .single();
  assert.ifError(error);
  return data;
}
async function denied(result) {
  if (result.error)
    assert.equal(
      result.error.code,
      "42501",
      "Solo un rechazo de permisos prueba aislamiento; un fallo de red/esquema no cuenta.",
    );
  else
    assert.deepEqual(
      result.data,
      [],
      "La petición no autorizada devolvió datos.",
    );
}
function rejected(result, codes = ["42501", "23503", "23514"]) {
  assert.ok(
    result.error && codes.includes(result.error.code),
    "La escritura debe ser rechazada por permisos, RLS o integridad referencial.",
  );
}
function storageRejected(result) {
  assert.ok(
    result.error &&
      ["400", "403", "404"].includes(String(result.error.statusCode)),
    "Storage debe rechazar el acceso; los fallos de red no cuentan.",
  );
}
async function read(actor, table, id) {
  const result = await actor.api.from(table).select().eq("id", id).single();
  assert.ifError(result.error);
  return result.data;
}
async function update(actor, table, id, values) {
  const result = await actor.api
    .from(table)
    .update(values)
    .eq("id", id)
    .select()
    .single();
  assert.ifError(result.error);
  return result.data;
}
const logoBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1kAAAAASUVORK5CYII=",
  "base64",
);
try {
  for (const suffix of ["A", "B"]) {
    const client = api();
    const { data, error } = await client.auth.signInWithPassword({
      email: process.env[`RLS_TEST_EMAIL_${suffix}`],
      password: process.env[`RLS_TEST_PASSWORD_${suffix}`],
    });
    assert.ifError(error);
    const profile = await client
      .from("profiles")
      .select()
      .eq("id", data.user.id)
      .single();
    assert.ifError(profile.error);
    assert.equal(
      profile.data.role,
      "owner",
      "Usa dos propietarios de negocios distintos.",
    );
    actors.push({
      api: client,
      suffix,
      userId: data.user.id,
      businessId: profile.data.business_id,
      created: [],
    });
  }
  const [a, b] = actors;
  assert.notEqual(
    a.businessId,
    b.businessId,
    "Las cuentas deben pertenecer a empresas diferentes.",
  );
  for (const actor of actors) {
    const marker = `Prueba RLS ${randomUUID()}`;
    actor.client = await insert(actor, "clients", {
      name: marker,
      phone: "5500000000",
    });
    actor.event = await insert(actor, "events", {
      client_id: actor.client.id,
      title: marker,
      event_type: "Prueba",
      event_date: "2026-09-17",
      total_amount: 100,
      status: "reserved",
    });
    actor.payment = await insert(actor, "payments", {
      event_id: actor.event.id,
      amount: 25,
      payment_type: "deposit",
      payment_date: "2026-09-02",
    });
    actor.expense = await insert(actor, "expenses", {
      event_id: actor.event.id,
      description: marker,
      amount: 10,
      expense_date: "2026-09-02",
    });
    actor.package = await insert(actor, "service_packages", {
      name: marker,
      base_price: 100,
      active: true,
    });
    actor.originalBusiness = await read(actor, "businesses", actor.businessId);
    actor.client = await update(actor, "clients", actor.client.id, {
      name: `${marker} editado`,
      notes: "Persistencia real",
    });
    actor.event = await update(actor, "events", actor.event.id, {
      title: `${marker} editado`,
      guest_count: 40,
    });
    actor.secondPayment = await insert(actor, "payments", {
      event_id: actor.event.id,
      amount: 15,
      payment_type: "partial",
      payment_date: "2026-09-03",
    });
    actor.generalExpense = await insert(actor, "expenses", {
      description: marker,
      amount: 5,
      expense_date: "2026-09-03",
    });
    assert.deepEqual(
      eventFinance(
        actor.event,
        [actor.payment, actor.secondPayment],
        [actor.expense, actor.generalExpense],
      ),
      { paid: 40, spent: 10, balance: 60, profit: 90 },
    );
    assert.deepEqual(
      dashboardMetrics(
        [actor.event],
        [actor.payment, actor.secondPayment],
        [actor.expense, actor.generalExpense],
        "2026-09",
      ),
      { sales: 100, eventCount: 1, outstanding: 60, spent: 15, profit: 85 },
    );
    actor.package = await update(actor, "service_packages", actor.package.id, {
      name: `${marker} editado`,
      base_price: 120,
      active: false,
    });
    assert.equal(actor.package.active, false);
    assert.equal(
      (
        await update(actor, "service_packages", actor.package.id, {
          active: true,
        })
      ).active,
      true,
    );
    await update(actor, "businesses", actor.businessId, { name: marker });
    const bucket = actor.api.storage.from("business-logos");
    const existing = await bucket.list(actor.businessId);
    assert.ifError(existing.error);
    assert.equal(
      existing.data.length,
      0,
      "Usa cuentas de prueba sin logo: nunca se reemplaza un archivo existente.",
    );
    actor.logoPath = `${actor.businessId}/logo`;
    const uploaded = await bucket.upload(actor.logoPath, logoBytes, {
      contentType: "image/png",
      upsert: false,
    });
    assert.ifError(uploaded.error);
    assert.ifError(
      (
        await bucket.upload(actor.logoPath, logoBytes, {
          contentType: "image/png",
          upsert: true,
        })
      ).error,
    );
    const downloaded = await bucket.download(actor.logoPath);
    assert.ifError(downloaded.error);
    assert.deepEqual(
      Buffer.from(await downloaded.data.arrayBuffer()),
      logoBytes,
    );
    const signed = await bucket.createSignedUrl(actor.logoPath, 60);
    assert.ifError(signed.error);
    assert.equal((await fetch(signed.data.signedUrl)).status, 200);
    const publicResponse = await fetch(
      bucket.getPublicUrl(actor.logoPath).data.publicUrl,
    );
    assert.ok(
      [400, 401, 403, 404].includes(publicResponse.status),
      "El logo no debe ser público.",
    );
    await update(actor, "businesses", actor.businessId, {
      logo_url: actor.logoPath,
    });
    assert.ifError((await actor.api.auth.refreshSession()).error);
    assert.equal(
      (await read(actor, "clients", actor.client.id)).notes,
      "Persistencia real",
    );
    assert.ifError((await actor.api.auth.signOut({ scope: "local" })).error);
    assert.ifError(
      (
        await actor.api.auth.signInWithPassword({
          email: process.env[`RLS_TEST_EMAIL_${actor.suffix}`],
          password: process.env[`RLS_TEST_PASSWORD_${actor.suffix}`],
        })
      ).error,
    );
    assert.equal((await read(actor, "events", actor.event.id)).guest_count, 40);
    console.log(
      "PASS: CRUD, pagos múltiples, gastos, cálculos, paquetes, configuración, logo privado, renovación y nuevo login.",
    );
  }
  for (const [viewer, other] of [
    [a, b],
    [b, a],
  ]) {
    const tables = [
      ["clients", other.client, "name"],
      ["events", other.event, "title"],
      ["payments", other.payment, "notes"],
      ["expenses", other.expense, "description"],
      ["service_packages", other.package, "name"],
    ];
    for (const [table, record, column] of tables) {
      const listing = await viewer.api.from(table).select("id,business_id");
      assert.ifError(listing.error);
      assert.ok(
        listing.data.every((row) => row.business_id === viewer.businessId),
        `${table}: listado filtró datos ajenos`,
      );
      await denied(await viewer.api.from(table).select().eq("id", record.id));
      await denied(
        await viewer.api
          .from(table)
          .update({ [column]: "Forbidden" })
          .eq("id", record.id)
          .select(),
      );
      await denied(
        await viewer.api.from(table).delete().eq("id", record.id).select(),
      );
      const { id, created_at, updated_at, ...payload } = record;
      void id;
      void created_at;
      void updated_at;
      const forgedId = randomUUID();
      other.created.push({ table, id: forgedId });
      const forged = await viewer.api
        .from(table)
        .insert({ ...payload, id: forgedId })
        .select();
      rejected(forged);
      assert.equal(
        (await read(other, table, record.id))[column],
        record[column],
        `${table}: la fila ajena fue modificada`,
      );
    }
    await denied(
      await viewer.api.from("businesses").select().eq("id", other.businessId),
    );
    await denied(
      await viewer.api.from("profiles").select().eq("id", other.userId),
    );
    await denied(
      await viewer.api
        .from("businesses")
        .update({ name: "Forbidden" })
        .eq("id", other.businessId)
        .select(),
    );
    await denied(
      await viewer.api
        .from("profiles")
        .update({ full_name: "Forbidden" })
        .eq("id", other.userId)
        .select(),
    );
    rejected(
      await viewer.api
        .from("events")
        .update({ client_id: other.client.id })
        .eq("id", viewer.event.id)
        .select(),
    );
    rejected(
      await viewer.api
        .from("expenses")
        .update({ event_id: other.event.id })
        .eq("id", viewer.expense.id)
        .select(),
    );
    for (const [table, record] of [
      ["clients", viewer.client],
      ["events", viewer.event],
      ["payments", viewer.payment],
      ["expenses", viewer.expense],
      ["service_packages", viewer.package],
    ])
      rejected(
        await viewer.api
          .from(table)
          .update({ business_id: other.businessId })
          .eq("id", record.id)
          .select(),
      );
    const storage = viewer.api.storage.from("business-logos");
    const foreignList = await storage.list(other.businessId);
    assert.ifError(foreignList.error);
    assert.deepEqual(foreignList.data, []);
    const signedForeign = await storage.createSignedUrl(other.logoPath, 60);
    assert.ok(
      signedForeign.error &&
        ["400", "403", "404"].includes(String(signedForeign.error.statusCode)),
      "No debe poder firmar el logo ajeno.",
    );
    storageRejected(await storage.download(other.logoPath));
    storageRejected(
      await storage.upload(other.logoPath, logoBytes, {
        contentType: "image/png",
        upsert: true,
      }),
    );
    const removed = await storage.remove([other.logoPath]);
    if (removed.error) storageRejected(removed);
    else
      assert.deepEqual(
        removed.data,
        [],
        "No debe poder eliminar el logo ajeno.",
      );
    const intact = await other.api.storage
      .from("business-logos")
      .download(other.logoPath);
    assert.ifError(intact.error);
    assert.deepEqual(Buffer.from(await intact.data.arrayBuffer()), logoBytes);
    rejected(
      await viewer.api
        .from("profiles")
        .update({ business_id: other.businessId })
        .eq("id", viewer.userId),
    );
    rejected(
      await viewer.api
        .from("profiles")
        .update({ role: "member" })
        .eq("id", viewer.userId),
    );
    const crossEventId = randomUUID();
    viewer.created.push({ table: "events", id: crossEventId });
    rejected(
      await viewer.api.from("events").insert({
        id: crossEventId,
        business_id: viewer.businessId,
        client_id: other.client.id,
        title: "Cross tenant",
        event_type: "Prueba",
        event_date: "2026-09-17",
        total_amount: 1,
      }),
    );
    const crossPaymentId = randomUUID();
    viewer.created.push({ table: "payments", id: crossPaymentId });
    rejected(
      await viewer.api.from("payments").insert({
        id: crossPaymentId,
        business_id: viewer.businessId,
        event_id: other.event.id,
        amount: 1,
        payment_type: "partial",
        payment_date: "2026-09-02",
      }),
    );
    const crossExpenseId = randomUUID();
    viewer.created.push({ table: "expenses", id: crossExpenseId });
    rejected(
      await viewer.api.from("expenses").insert({
        id: crossExpenseId,
        business_id: viewer.businessId,
        event_id: other.event.id,
        description: "Cross tenant",
        amount: 1,
        expense_date: "2026-09-02",
      }),
    );
    console.log(
      "PASS: lectura, escritura, referencias y perfil aislados para una empresa.",
    );
  }
  // Two requests compete for a balance of 60: only one payment of 60 may succeed.
  const concurrent = await Promise.all(
    [1, 2].map(() => {
      const id = randomUUID();
      a.created.push({ table: "payments", id });
      return a.api
        .from("payments")
        .insert({
          id,
          business_id: a.businessId,
          event_id: a.event.id,
          amount: 60,
          payment_type: "partial",
          payment_date: "2026-09-02",
        })
        .select()
        .single();
    }),
  );
  assert.equal(
    concurrent.filter((r) => !r.error).length,
    1,
    "Falló la protección contra sobrepago concurrente.",
  );
  for (const result of concurrent.filter((result) => result.error)) {
    rejected(result, ["23514"]);
    assert.match(result.error.message, /payment_exceeds_balance/);
  }
  const anonymous = api();
  for (const table of [
    "businesses",
    "profiles",
    "clients",
    "events",
    "payments",
    "expenses",
    "service_packages",
  ])
    await denied(await anonymous.from(table).select());
  console.log("PASS: concurrencia de pagos y denegación de acceso anónimo.");
} finally {
  let cleanupFailed = false;
  for (const actor of actors) {
    if (actor.logoPath) {
      const result = await actor.api.storage
        .from("business-logos")
        .remove([actor.logoPath]);
      const remaining = await actor.api.storage
        .from("business-logos")
        .list(actor.businessId);
      if (
        result.error ||
        remaining.error ||
        remaining.data.some((file) => file.name === "logo")
      )
        cleanupFailed = true;
    }
    if (actor.originalBusiness) {
      const original = actor.originalBusiness;
      const result = await actor.api
        .from("businesses")
        .update({
          name: original.name,
          phone: original.phone,
          logo_url: original.logo_url,
        })
        .eq("id", actor.businessId)
        .select("id");
      if (result.error || result.data.length !== 1) cleanupFailed = true;
    }
    for (const table of [
      "payments",
      "expenses",
      "events",
      "service_packages",
      "clients",
    ]) {
      const ids = actor.created
        .filter((r) => r.table === table)
        .map((r) => r.id);
      if (ids.length) {
        const { error } = await actor.api.from(table).delete().in("id", ids);
        const remaining = await actor.api
          .from(table)
          .select("id")
          .in("id", ids);
        if (error || remaining.error || remaining.data.length) {
          cleanupFailed = true;
          console.error(
            `Revisa la limpieza de registros de prueba en ${table}.`,
          );
        }
      }
    }
    await actor.api.auth.signOut({ scope: "local" });
  }
  if (cleanupFailed) process.exitCode = 1;
}
if (!process.exitCode)
  console.log(
    "RLS remoto y flujo API verificados; datos temporales limpiados. Registro por correo y cookies del navegador requieren validación adicional.",
  );
