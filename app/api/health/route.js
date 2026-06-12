export async function GET() {
  return Response.json({
    ok: true,
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    openaiModel: process.env.OPENAI_MODEL || null,
    whatsappConfigured: Boolean(process.env.WHATSAPP_ORDER_PHONE)
  });
}
