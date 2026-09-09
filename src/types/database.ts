import type {
  Business,
  Profile,
  Client,
  Event,
  Payment,
  Expense,
  ServicePackage,
} from "./domain";
type Generated = "id" | "created_at" | "updated_at";
type Table<Row> = {
  Row: Row;
  Insert: Omit<Row, Extract<keyof Row, Generated>> &
    Partial<Pick<Row, Extract<keyof Row, Generated>>>;
  Update: Partial<Row>;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      businesses: Table<Business>;
      profiles: Table<Profile>;
      clients: Table<Client>;
      events: Table<Event>;
      payments: Table<Payment>;
      expenses: Table<Expense>;
      service_packages: Table<ServicePackage>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
