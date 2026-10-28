import { isAdminRequest } from "../../../lib/admin-auth";

const SAMPLE = "Ciao, sono l'assistente virtuale AvatarOne. Ora posso parlare con te in tempo reale.";

export async function POST(request) {
  if (!isAdminRequest(request)) return Response.json({error:"Accesso amministratore richiesto."},{status:401});
  const key=process.env.ELEVENLABS_API_KEY;
  if (!key) return Response.json({error:"ElevenLabs non configurato."},{status:503});
  const voiceId=process.env.LIVEAVATAR_TEST_VOICE_ID || "snfKOCZz89h09mK7ExIr";
  try {
    const response=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+encodeURIComponent(voiceId)+"?output_format=pcm_24000",{
      method:"POST",headers:{"xi-api-key":key,"Content-Type":"application/json","Accept":"audio/pcm"},
      body:JSON.stringify({text:SAMPLE,model_id:"eleven_multilingual_v2"}),cache:"no-store"
    });
    if (!response.ok) return Response.json({error:"ElevenLabs non ha restituito audio PCM.",upstreamStatus:response.status},{status:502});
    return new Response(response.body,{headers:{"Content-Type":"application/octet-stream","Cache-Control":"no-store"}});
  } catch {return Response.json({error:"Servizio voce temporaneamente non raggiungibile."},{status:502});}
}
