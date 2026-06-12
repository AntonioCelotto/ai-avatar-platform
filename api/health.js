module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      ok: true,
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      openaiModel: process.env.OPENAI_MODEL || null,
      whatsappConfigured: Boolean(process.env.WHATSAPP_ORDER_PHONE)
    })
  );
};
