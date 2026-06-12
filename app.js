const tenant = {
  slug: "trattoria-demo",
  name: "Trattoria Demo",
  whatsappPhone: "393457980259"
};

const messageList = document.querySelector("#messageList");
const composer = document.querySelector("#composer");
const input = document.querySelector("#messageInput");
const whatsappLink = document.querySelector("#whatsappLink");
const orderStatus = document.querySelector("#orderStatus");
const suggestions = document.querySelectorAll(".suggestions button");

const messages = [
  {
    role: "assistant",
    content:
      "Ciao, sono Mia. Posso aiutarti a scegliere dal menu di Trattoria Demo, controllare allergeni e preparare l'ordine per WhatsApp."
  }
];

function addMessage(role, content) {
  messages.push({ role, content });

  const element = document.createElement("div");
  element.className = `message message--${role}`;
  element.textContent = content;
  messageList.appendChild(element);
  messageList.parentElement.scrollTop = messageList.parentElement.scrollHeight;
}

function setLoading(isLoading) {
  const existing = document.querySelector("#loadingMessage");
  if (existing) existing.remove();

  if (isLoading) {
    const element = document.createElement("div");
    element.id = "loadingMessage";
    element.className = "message message--assistant";
    element.textContent = "Sto controllando il menu...";
    messageList.appendChild(element);
  }
}

function updateWhatsapp(orderDraft) {
  const text =
    orderDraft ||
    `Ciao, vorrei informazioni o ordinare da ${tenant.name}.`;
  whatsappLink.href = `https://wa.me/${tenant.whatsappPhone}?text=${encodeURIComponent(text)}`;

  if (orderDraft) {
    orderStatus.textContent = "Ordine pronto da inviare";
  }
}

async function sendMessage(content) {
  const cleanContent = content.trim();
  if (!cleanContent) return;

  addMessage("user", cleanContent);
  input.value = "";
  setLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tenantSlug: tenant.slug,
        messages
      })
    });

    if (!response.ok) throw new Error("Chat request failed");

    const data = await response.json();
    setLoading(false);
    addMessage("assistant", data.reply);
    updateWhatsapp(data.orderDraft);
  } catch {
    setLoading(false);
    addMessage(
      "assistant",
      "Non riesco a rispondere in questo momento. Puoi comunque inviare una richiesta al ristorante su WhatsApp."
    );
  }
}

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

suggestions.forEach((button) => {
  button.addEventListener("click", () => {
    sendMessage(button.textContent || "");
  });
});
