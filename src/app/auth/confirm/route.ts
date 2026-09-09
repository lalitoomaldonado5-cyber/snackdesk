import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig, siteUrl } from "@/lib/env";
export async function GET(request: NextRequest) {
  if (!hasSupabaseConfig()) return NextResponse.redirect(`${siteUrl()}/setup`);
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const code = params.get("code");
  const supabase = await createClient();
  if (tokenHash && params.get("type") === "email") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "email",
    });
    if (!error) return NextResponse.redirect(`${siteUrl()}/dashboard`);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${siteUrl()}/dashboard`);
  }
  return NextResponse.redirect(`${siteUrl()}/login?confirmation=error`);
}
