import { test } from "node:test";
import assert from "node:assert/strict";
import { isPublicSupabaseKey, isSupabaseUrl } from "../src/lib/env.ts";
import { registrationError } from "../src/lib/auth-errors.ts";
import {
  date,
  clientSchema,
  paymentSchema,
  registerSchema,
} from "../src/lib/validation.ts";
test("calendar validation rejects nonexistent dates", () => {
  assert.equal(date.safeParse("2026-02-30").success, false);
  assert.equal(date.safeParse("2028-02-29").success, true);
  assert.equal(date.safeParse("2026-13-01").success, false);
});
test("payment input rejects negatives, zero, exponent notation and extra decimals", () => {
  for (const amount of ["-1", "0", "1e3", "10.001", ""])
    assert.equal(
      paymentSchema.safeParse({
        event_id: "10000000-0000-4000-8000-000000000001",
        amount,
        payment_type: "deposit",
        payment_date: "2026-09-02",
        notes: "",
      }).success,
      false,
    );
});
test("business_id and role supplied by the browser are stripped", () => {
  const result = clientSchema.parse({
    name: " Ana ",
    phone: "5512345678",
    email: "",
    notes: "",
    business_id: "other",
    role: "owner",
  });
  assert.equal(result.name, "Ana");
  assert.equal("business_id" in result, false);
  assert.equal("role" in result, false);
});
test("registration rejects short passwords and missing business name", () => {
  assert.equal(
    registerSchema.safeParse({
      email: "a@example.com",
      password: "short",
      full_name: "Ana",
      business_name: "",
    }).success,
    false,
  );
});

test("privileged Supabase keys are rejected by application configuration", () => {
  const token = (role: string) =>
    "header." +
    Buffer.from(JSON.stringify({ role })).toString("base64url") +
    ".signature";
  assert.equal(isPublicSupabaseKey("sb_secret_private"), false);
  assert.equal(isPublicSupabaseKey(token("service_role")), false);
  assert.equal(isPublicSupabaseKey(token("anon")), true);
  assert.equal(isPublicSupabaseKey("sb_publishable_example"), true);
  assert.equal(isPublicSupabaseKey("malformed"), false);
});
test("Supabase configuration rejects API paths, unsafe protocols and credentials in URLs", () => {
  assert.equal(isSupabaseUrl("https://project.supabase.co"), true);
  assert.equal(isSupabaseUrl("http://127.0.0.1:54321"), true);
  for (const url of [
    "https://project.supabase.co/rest/v1/",
    "http://project.supabase.co",
    "https://user:pass@project.supabase.co",
    "not-a-url",
    "https://project.supabase.co?key=value",
  ])
    assert.equal(isSupabaseUrl(url), false);
});
test("registration distinguishes email delivery limits without disclosing account existence", () => {
  assert.match(registrationError("over_email_send_rate_limit"), /límite/);
  assert.match(
    registrationError("email_address_not_authorized"),
    /administrador/,
  );
  assert.equal(
    registrationError("user_already_exists"),
    registrationError("unexpected_failure"),
  );
});
