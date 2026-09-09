import { AuthForm } from "@/components/auth-form";
import { hasSupabaseConfig } from "@/lib/env";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string }>;
}) {
  return (
    <AuthForm
      mode="login"
      configured={hasSupabaseConfig()}
      confirmationError={(await searchParams).confirmation === "error"}
    />
  );
}
