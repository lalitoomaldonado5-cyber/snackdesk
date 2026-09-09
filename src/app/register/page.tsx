import { AuthForm } from "@/components/auth-form";
import { hasSupabaseConfig } from "@/lib/env";
export default function RegisterPage() {
  return <AuthForm mode="register" configured={hasSupabaseConfig()} />;
}
