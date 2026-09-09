import { AppShell } from "@/components/app-shell";
import { getWorkspace } from "@/services/workspace";
export const dynamic = "force-dynamic";
export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getWorkspace();
  return (
    <AppShell
      businessName={data.business.name}
      userName={data.profile.full_name}
      role={data.profile.role}
      logoSrc={data.logoSrc}
    >
      {children}
    </AppShell>
  );
}
