// Supabase error codes are mapped to safe, actionable messages. Never return
// raw provider responses, which can include account or infrastructure details.
export function registrationError(code?: string) {
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit"
  )
    return "No pudimos enviar la confirmación porque se alcanzó el límite de intentos. Espera unos minutos y vuelve a intentar.";
  if (code === "email_address_invalid")
    return "Escribe una dirección de correo válida para recibir la confirmación.";
  if (code === "email_address_not_authorized")
    return "El envío de confirmaciones aún no está habilitado para este correo. Contacta al administrador del sitio.";
  return "No pudimos crear la cuenta. Intenta de nuevo más tarde o inicia sesión si ya te registraste.";
}
