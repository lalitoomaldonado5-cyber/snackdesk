import type { Event, Payment, Expense } from "../types/domain.ts";
export function cents(value: number) {
  return Math.round(Number(value) * 100);
}
export function sumMoney(values: number[]) {
  return values.reduce((sum, value) => sum + cents(value), 0) / 100;
}
export function eventFinance(
  event: Event,
  payments: Payment[],
  expenses: Expense[],
) {
  const paid = sumMoney(
    payments.filter((p) => p.event_id === event.id).map((p) => p.amount),
  );
  const spent = sumMoney(
    expenses.filter((e) => e.event_id === event.id).map((e) => e.amount),
  );
  return {
    paid,
    spent,
    balance: (cents(event.total_amount) - cents(paid)) / 100,
    profit: (cents(event.total_amount) - cents(spent)) / 100,
  };
}
export function isConfirmed(event: Event) {
  return event.status !== "quoted" && event.status !== "cancelled";
}
export function dashboardMetrics(
  events: Event[],
  payments: Payment[],
  expenses: Expense[],
  month: string,
) {
  const monthEvents = events.filter(
    (e) => e.event_date.startsWith(month) && e.status !== "cancelled",
  );
  const sales = sumMoney(
    monthEvents.filter(isConfirmed).map((e) => e.total_amount),
  );
  const spent = sumMoney(
    expenses
      .filter((e) => e.expense_date.startsWith(month))
      .map((e) => e.amount),
  );
  const outstanding = sumMoney(
    events
      .filter(isConfirmed)
      .map((e) => eventFinance(e, payments, expenses).balance),
  );
  return {
    sales,
    eventCount: monthEvents.length,
    outstanding,
    spent,
    profit: (cents(sales) - cents(spent)) / 100,
  };
}
