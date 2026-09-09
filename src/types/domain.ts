export type Role = "owner" | "member";
export type EventStatus =
  "quoted" | "reserved" | "paid" | "completed" | "cancelled";
export type PaymentType = "deposit" | "partial" | "final";
type Timestamps = { created_at: string; updated_at: string };
type TenantRow = { id: string; business_id: string; created_at: string };
export type Business = Timestamps & {
  id: string;
  name: string;
  phone: string | null;
  logo_url: string | null;
};
export type Profile = TenantRow & {
  full_name: string;
  role: Role;
  updated_at: string;
};
export type Client = TenantRow & {
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  updated_at: string;
};
export type Event = TenantRow & {
  client_id: string;
  title: string;
  event_type: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  guest_count: number | null;
  total_amount: number;
  status: EventStatus;
  notes: string | null;
  updated_at: string;
};
export type Payment = TenantRow & {
  event_id: string;
  amount: number;
  payment_type: PaymentType;
  payment_date: string;
  notes: string | null;
};
export type Expense = TenantRow & {
  event_id: string | null;
  description: string;
  category: string | null;
  amount: number;
  expense_date: string;
  notes: string | null;
};
export type ServicePackage = TenantRow & {
  name: string;
  description: string | null;
  base_price: number;
  active: boolean;
  updated_at: string;
};
export type Workspace = {
  business: Business;
  profile: Profile;
  email: string;
  logoSrc: string | null;
  clients: Client[];
  events: Event[];
  payments: Payment[];
  expenses: Expense[];
  packages: ServicePackage[];
};
export type ActionState = { error?: string; success?: string };
export const statuses: Record<EventStatus, string> = {
  quoted: "Cotizado",
  reserved: "Apartado",
  paid: "Pagado",
  completed: "Completado",
  cancelled: "Cancelado",
};
export const paymentTypes: Record<PaymentType, string> = {
  deposit: "Anticipo",
  partial: "Pago parcial",
  final: "Liquidación",
};
