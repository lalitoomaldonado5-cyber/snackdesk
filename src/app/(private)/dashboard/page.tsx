import { Dashboard } from "@/components/dashboard";
import { getWorkspace } from "@/services/workspace";
import { today } from "@/lib/format";
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const data = await getWorkspace();
  const date = today();
  const value = (await searchParams).month;
  const month =
    value && /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value)
      ? value
      : date.slice(0, 7);
  return <Dashboard data={data} date={date} month={month} />;
}
