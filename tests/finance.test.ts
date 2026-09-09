import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dashboardMetrics,
  eventFinance,
  sumMoney,
} from "../src/lib/finance.ts";
import type { Event, Payment, Expense } from "../src/types/domain.ts";
const base: Event = {
  id: "event",
  business_id: "a",
  client_id: "c",
  title: "Evento",
  event_type: "Boda",
  event_date: "2026-09-17",
  event_time: null,
  location: null,
  guest_count: 80,
  total_amount: 3800,
  status: "reserved",
  notes: null,
  created_at: "",
  updated_at: "",
};
const payment: Payment = {
  id: "p",
  business_id: "a",
  event_id: "event",
  amount: 1500,
  payment_type: "deposit",
  payment_date: "2026-08-31",
  notes: null,
  created_at: "",
};
const expense: Expense = {
  id: "e",
  business_id: "a",
  event_id: "event",
  amount: 650,
  description: "Insumos",
  category: null,
  expense_date: "2026-09-02",
  notes: null,
  created_at: "",
};
test("decimal amounts sum in cents without floating-point drift", () =>
  assert.equal(sumMoney([0.1, 0.2, 0.3]), 0.6));
test("event balance includes all payments regardless of their month", () =>
  assert.deepEqual(eventFinance(base, [payment], [expense]), {
    paid: 1500,
    spent: 650,
    balance: 2300,
    profit: 3150,
  }));
test("dashboard excludes quoted/cancelled sales and includes general monthly expenses", () => {
  const events: Event[] = [
    base,
    { ...base, id: "q", status: "quoted", total_amount: 6800 },
    { ...base, id: "x", status: "cancelled", total_amount: 9999 },
    {
      ...base,
      id: "past",
      event_date: "2026-08-01",
      total_amount: 100,
      status: "completed",
    },
  ];
  const expenses = [
    expense,
    { ...expense, id: "general", event_id: null, amount: 100 },
    { ...expense, id: "old", expense_date: "2026-08-31", amount: 400 },
  ];
  assert.deepEqual(dashboardMetrics(events, [payment], expenses, "2026-09"), {
    sales: 3800,
    eventCount: 2,
    outstanding: 2400,
    spent: 750,
    profit: 3050,
  });
});
test("empty business yields zero KPIs", () =>
  assert.deepEqual(dashboardMetrics([], [], [], "2026-09"), {
    sales: 0,
    eventCount: 0,
    outstanding: 0,
    spent: 0,
    profit: 0,
  }));
test("only related expenses affect an event's estimated profit", () =>
  assert.equal(
    eventFinance(base, [], [{ ...expense, event_id: null }]).profit,
    3800,
  ));
test("multiple payments and expenses across months keep event totals and monthly KPIs distinct", () => {
  const payments = [
    payment,
    { ...payment, id: "p2", amount: 1000, payment_date: "2026-09-17" },
  ];
  const expenses = [
    expense,
    { ...expense, id: "e2", amount: 200, expense_date: "2026-08-10" },
    { ...expense, id: "general", event_id: null, amount: 50 },
  ];
  assert.deepEqual(eventFinance(base, payments, expenses), {
    paid: 2500,
    spent: 850,
    balance: 1300,
    profit: 2950,
  });
  assert.deepEqual(dashboardMetrics([base], payments, expenses, "2026-08"), {
    sales: 0,
    eventCount: 0,
    outstanding: 1300,
    spent: 200,
    profit: -200,
  });
  assert.deepEqual(dashboardMetrics([base], payments, expenses, "2026-09"), {
    sales: 3800,
    eventCount: 1,
    outstanding: 1300,
    spent: 700,
    profit: 3100,
  });
});
test("cancelled and zero-valued events do not inflate sales or receivables", () => {
  const events: Event[] = [
    { ...base, status: "cancelled" },
    { ...base, id: "free", total_amount: 0, status: "paid" },
  ];
  assert.deepEqual(dashboardMetrics(events, [payment], [expense], "2026-09"), {
    sales: 0,
    eventCount: 1,
    outstanding: 0,
    spent: 650,
    profit: -650,
  });
});
