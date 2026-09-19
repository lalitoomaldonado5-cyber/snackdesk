import { PageHeader } from "@/components/ui";
import { QuoteForm } from "@/components/forms/quote-form";
import { getWorkspace } from "@/services/workspace";
import { today } from "@/lib/format";

export default async function Page() {
  const data = await getWorkspace();
  return (
    <>
      <PageHeader
        title="Nueva cotización"
        description="Tu propuesta, con el sello de tu negocio."
        back="/dashboard"
      />
      <QuoteForm
        business={data.business}
        logoSrc={data.logoSrc}
        clients={data.clients}
        events={data.events}
        packages={data.packages}
        date={today()}
      />
    </>
  );
}
