import { defaultTenantSlug, getTenant } from "../tenant-config";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const KNOWLEDGE_BUCKET = "knowledge-documents";
export const AVATAR_MEDIA_BUCKET = "avatar-media";
export const DEFAULT_TENANT_SLUG = defaultTenantSlug;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

function getHeaders(extra = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...extra
  };
}

function getSupabaseUrl(path) {
  return `${supabaseUrl.replace(/\/$/, "")}${path}`;
}

async function supabaseFetch(path, options = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const response = await fetch(getSupabaseUrl(path), {
    ...options,
    headers: {
      ...getHeaders(options.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function listAvatarClients() {
  if (!isSupabaseConfigured()) return [];

  return supabaseFetch(
    "/rest/v1/avatar_clients?select=id,slug,company_name,category,status,website,whatsapp_phone,avatar_name,spoken_avatar_name,avatar_video_url,voice_provider,voice_label,brand_mark,features,created_at,updated_at&order=created_at.asc"
  );
}

export async function getAvatarClientBySlug(slug = DEFAULT_TENANT_SLUG) {
  if (!isSupabaseConfigured()) return null;
  const safeSlug = encodeURIComponent(slug);
  const rows = await supabaseFetch(
    `/rest/v1/avatar_clients?slug=eq.${safeSlug}&select=id,slug,company_name,category,status,website,whatsapp_phone,avatar_name,spoken_avatar_name,avatar_poster_url,avatar_video_url,media_mode,voice_provider,voice_id,voice_label,liveavatar_avatar_id,brand_mark,welcome_message,input_placeholder,suggestions,theme,personality,notes,features,created_at,updated_at&limit=1`
  );
  return rows?.[0] || null;
}

export async function upsertAvatarClient(avatar) {
  const rows = await supabaseFetch("/rest/v1/avatar_clients?on_conflict=slug", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(avatar)
  });
  return rows?.[0] || null;
}

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], buffer: Buffer.from(match[2], "base64") };
}

export async function uploadAvatarMedia({ dataUrl, fileName, slug, kind }) {
  const decoded = decodeDataUrl(dataUrl);
  if (!decoded) return "";
  const extension = decoded.mimeType.split("/")[1]?.replace("jpeg", "jpg") || (kind === "video" ? "mp4" : "jpg");
  const safeName = String(fileName || `${kind}.${extension}`).replace(/[^a-zA-Z0-9_.-]+/g, "-").toLowerCase();
  const storagePath = `${slug}/${kind}-${Date.now()}-${safeName}`;
  const response = await fetch(getSupabaseUrl(`/storage/v1/object/${AVATAR_MEDIA_BUCKET}/${storagePath}`), {
    method: "POST",
    headers: getHeaders({ "Content-Type": decoded.mimeType, "x-upsert": "true" }),
    body: decoded.buffer
  });
  if (!response.ok) throw new Error(`Caricamento ${kind} non riuscito.`);
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${AVATAR_MEDIA_BUCKET}/${storagePath}`;
}

export async function listAvatarDocuments(clientId) {
  if (!isSupabaseConfigured() || !clientId) return [];
  return supabaseFetch(
    `/rest/v1/avatar_documents?client_id=eq.${clientId}&select=id,title,file_name,file_type,file_url,storage_path,status,metadata,created_at,updated_at&order=created_at.desc&limit=100`
  );
}

export async function insertAvatarDocument({
  clientId,
  title,
  fileName,
  fileType,
  fileUrl,
  storagePath,
  extractedText,
  status = "ready",
  metadata = {}
}) {
  const rows = await supabaseFetch("/rest/v1/avatar_documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      client_id: clientId,
      title,
      file_name: fileName,
      file_type: fileType,
      file_url: fileUrl,
      storage_path: storagePath,
      extracted_text: extractedText,
      status,
      metadata
    })
  });

  return rows?.[0];
}

export async function insertAvatarKnowledgeSource({
  clientId,
  sourceType,
  title,
  sourceUrl,
  content,
  status = "active",
  metadata = {}
}) {
  const rows = await supabaseFetch("/rest/v1/avatar_client_knowledge_sources", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      client_id: clientId,
      source_type: sourceType,
      title,
      source_url: sourceUrl,
      content,
      status,
      metadata
    })
  });

  return rows?.[0];
}

export function chunkText(text, maxLength = 1200) {
  const cleanText = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleanText) return [];

  const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    const next = `${current} ${sentence}`.trim();
    if (next.length > maxLength && current) {
      chunks.push(current);
      current = sentence.trim();
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

export async function ensureDefaultVenue(tenantSlug = DEFAULT_TENANT_SLUG) {
  const tenant = getTenant(tenantSlug);
  const existingVenues = await supabaseFetch(
    `/rest/v1/venues?slug=eq.${tenant.slug}&select=id&limit=1`
  );
  if (existingVenues?.[0]?.id) return existingVenues[0].id;

  const organizations = await supabaseFetch("/rest/v1/organizations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      name: tenant.name,
      owner_name: tenant.ownerName
    })
  });

  const organizationId = organizations?.[0]?.id;
  if (!organizationId) throw new Error("Unable to create organization");

  const venues = await supabaseFetch("/rest/v1/venues", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      organization_id: organizationId,
      slug: tenant.slug,
      name: tenant.name,
      vertical: "agency",
      whatsapp_order_phone: tenant.whatsappPhone,
      website_url: tenant.website,
      status: "active"
    })
  });

  const venueId = venues?.[0]?.id;
  if (!venueId) throw new Error("Unable to create venue");
  return venueId;
}

export async function uploadKnowledgeFile({
  fileName,
  mimeType,
  buffer,
  tenantSlug = DEFAULT_TENANT_SLUG
}) {
  const tenant = getTenant(tenantSlug);
  const safeName = fileName.replace(/[^a-zA-Z0-9_.-]+/g, "-").toLowerCase();
  const storagePath = `${tenant.slug}/${Date.now()}-${safeName}`;
  const response = await fetch(
    getSupabaseUrl(`/storage/v1/object/${KNOWLEDGE_BUCKET}/${storagePath}`),
    {
      method: "POST",
      headers: getHeaders({
        "Content-Type": mimeType || "application/pdf",
        "x-upsert": "false"
      }),
      body: buffer
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase storage upload failed: ${response.status} ${body}`);
  }

  return storagePath;
}

export async function insertKnowledgeSource({
  venueId,
  title,
  sourceType = "document",
  sourceUrl,
  storagePath,
  extractedText
}) {
  const rows = await supabaseFetch("/rest/v1/knowledge_sources", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      venue_id: venueId,
      source_type: sourceType,
      title,
      source_url: sourceUrl,
      storage_path: storagePath,
      status: "ready",
      extracted_text: extractedText
    })
  });

  const source = rows?.[0];
  if (!source?.id) throw new Error("Unable to create knowledge source");
  return source;
}

export async function insertKnowledgeChunks({ sourceId, chunks }) {
  if (!chunks.length) return [];

  return supabaseFetch("/rest/v1/knowledge_chunks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(
      chunks.map((content, index) => ({
        source_id: sourceId,
        chunk_index: index,
        content
      }))
    )
  });
}

export async function listKnowledgeSources(tenantSlug = DEFAULT_TENANT_SLUG) {
  const venueId = await ensureDefaultVenue(tenantSlug);
  return supabaseFetch(
    `/rest/v1/knowledge_sources?venue_id=eq.${venueId}&select=id,title,source_type,source_url,status,storage_path,created_at&order=created_at.desc&limit=30`
  );
}

export async function deleteKnowledgeSource(sourceId, tenantSlug = DEFAULT_TENANT_SLUG) {
  const venueId = await ensureDefaultVenue(tenantSlug);
  await supabaseFetch(
    `/rest/v1/knowledge_sources?id=eq.${sourceId}&venue_id=eq.${venueId}`,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal"
      }
    }
  );
}

export async function findRelevantKnowledge(question, tenantSlug = DEFAULT_TENANT_SLUG) {
  if (!isSupabaseConfigured()) return "";

  try {
    const venueId = await ensureDefaultVenue(tenantSlug);
    const terms = String(question || "")
      .toLowerCase()
      .replace(/[^a-z0-9àèéìòùç\s]/gi, " ")
      .split(/\s+/)
      .filter((term) => term.length > 4)
      .slice(0, 6);

    if (!terms.length) return "";

    const sources = await supabaseFetch(
      `/rest/v1/knowledge_sources?venue_id=eq.${venueId}&status=eq.ready&select=id&limit=20`
    );
    const sourceIds = sources.map((source) => source.id);
    if (!sourceIds.length) return "";

    const chunks = await supabaseFetch(
      `/rest/v1/knowledge_chunks?source_id=in.(${sourceIds.join(",")})&select=content,source_id&limit=80`
    );

    const scored = chunks
      .map((chunk) => {
        const content = chunk.content || "";
        const lower = content.toLowerCase();
        const score = terms.reduce(
          (total, term) => total + (lower.includes(term) ? 1 : 0),
          0
        );
        return { ...chunk, score };
      })
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return scored.map((chunk) => `- ${chunk.content}`).join("\n");
  } catch {
    return "";
  }
}
