import { Assistant } from "./assistant";
import { AvatarVideo } from "./avatar-video";
import { getTenantPublicConfig } from "./tenant-config";

const criticalMiaStyles = `
  html,body{margin:0;background:#020609;color:#f7fbff;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}
  *{box-sizing:border-box}
  .mia-home{--neon:#43f4ee;--violet:#7c6dff;position:relative;width:min(430px,100%);height:100dvh;min-height:100dvh;margin:0 auto;display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(0,72dvh) minmax(0,28dvh)!important;overflow:hidden;background:radial-gradient(circle at 10% 35%,rgba(67,244,238,.17),transparent 32%),radial-gradient(circle at 92% 18%,rgba(124,109,255,.18),transparent 30%),linear-gradient(180deg,#07131a 0%,#03090d 55%,#010305 100%);isolation:isolate}
  .mia-home:before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.17;background-image:linear-gradient(rgba(67,244,238,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(67,244,238,.12) 1px,transparent 1px);background-size:34px 34px;mask-image:linear-gradient(to bottom,#000,transparent 72%)}
  .mia-home .aurora{position:absolute;z-index:0;width:230px;height:230px;border-radius:50%;filter:blur(58px);opacity:.32;pointer-events:none}.mia-home .aurora--coral{top:18%;left:-125px;background:#20d9b5}.mia-home .aurora--cyan{top:4%;right:-115px;background:#695cff}
  .mia-home .avatar-stage{position:relative;z-index:1;width:100%;height:auto;min-height:0;padding:10px 10px 6px;display:block!important}
  .mia-home .avatar-frame{position:relative;width:100%;height:100%;min-height:0;overflow:hidden;border:1px solid rgba(92,245,239,.28);border-radius:28px;background:#020609;box-shadow:0 0 0 1px rgba(124,109,255,.08),0 20px 60px rgba(0,0,0,.48),0 0 42px rgba(49,223,217,.09);isolation:isolate}
  .mia-home .avatar-frame:before{content:"";position:absolute;z-index:8;inset:10px;pointer-events:none;border:1px solid rgba(102,247,241,.2);border-radius:20px;clip-path:polygon(0 0,22px 0,22px 1px,1px 1px,1px 22px,0 22px,0 0,100% 0,100% 22px,99% 22px,99% 1px,calc(100% - 22px) 1px,calc(100% - 22px) 0,100% 0,100% 100%,calc(100% - 22px) 100%,calc(100% - 22px) 99%,99% 99%,99% calc(100% - 22px),100% calc(100% - 22px),100% 100%,0 100%,0 calc(100% - 22px),1px calc(100% - 22px),1px 99%,22px 99%,22px 100%,0 100%)}
  .mia-home .avatar-frame:after{content:"";position:absolute;z-index:4;inset:auto 0 0;height:32%;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(2,8,12,.82))}
  .mia-home .avatar-frame video,.mia-home .avatar-frame img{position:absolute;inset:0;width:100%!important;height:100%!important;display:block;object-fit:cover!important;object-position:center 35%!important;filter:saturate(1.06) contrast(1.04)}
  .mia-home .mia-name-mark{position:absolute!important;z-index:20!important;top:44px!important;left:50%!important;display:block!important;transform:translateX(-50%)!important;pointer-events:none}.mia-home .mia-name-mark span{display:block;color:#fff!important;background:none!important;-webkit-text-fill-color:#fff!important;font-size:clamp(44px,15vw,68px)!important;font-weight:900!important;line-height:.9!important;letter-spacing:.06em!important;text-shadow:0 0 18px rgba(67,244,238,.28),0 12px 32px rgba(0,0,0,.72)!important}
  .mia-home .mia-commercial-badge{position:absolute;z-index:22;top:14px;left:14px;min-height:30px;display:flex;align-items:center;gap:7px;padding:0 11px;border:1px solid rgba(92,245,239,.28);border-radius:999px;background:rgba(2,11,15,.68);color:#dffefa;font-size:11px;font-weight:800;letter-spacing:.02em;backdrop-filter:blur(14px)}
  .mia-home .mia-commercial-dot{width:7px;height:7px;border-radius:50%;background:#49f49a;box-shadow:0 0 0 4px rgba(73,244,154,.12),0 0 13px #49f49a}
  .mia-home .assistant-workspace{position:relative;z-index:2;width:100%;height:auto;min-height:0;padding:4px 10px max(8px,env(safe-area-inset-bottom));display:block!important;overflow:hidden}
  .mia-home .assistant-panel{width:100%;height:100%;min-height:0;display:grid!important;grid-template-rows:auto minmax(0,1fr) auto auto!important;overflow:hidden;border:1px solid rgba(92,245,239,.2);border-radius:24px;background:linear-gradient(145deg,rgba(8,22,29,.9),rgba(3,9,14,.86));box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 -8px 42px rgba(42,227,218,.06);backdrop-filter:blur(22px)}
  .mia-home .assistant-header{min-height:42px;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center;gap:9px;padding:7px 13px 4px;border:0;background:transparent}.mia-home .assistant-title strong,.mia-home .assistant-title span{display:block}.mia-home .assistant-title strong{color:#f5ffff;font-size:14px;line-height:1.15}.mia-home .assistant-title span{display:none}.mia-home .assistant-status{grid-column:auto!important;padding:6px 9px;border:1px solid rgba(67,244,238,.18);border-radius:999px;background:rgba(67,244,238,.09);color:#71f7f1;font-size:9px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
  .mia-home .messages{min-height:0;overflow-y:auto;padding:4px 12px 8px;scrollbar-width:none}.mia-home .messages::-webkit-scrollbar{display:none}.mia-home .message-list{min-height:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:8px}.mia-home .message{max-width:84%;padding:10px 12px;border-radius:16px;font-size:clamp(14px,3.8vw,16px);line-height:1.32;white-space:pre-wrap}.mia-home .message--assistant{position:relative;align-self:flex-start;margin-left:38px;border:1px solid rgba(98,241,235,.13);border-bottom-left-radius:5px;background:linear-gradient(145deg,#faffff,#eaf4f6);color:#11191e;box-shadow:0 10px 28px rgba(0,0,0,.18)}.mia-home .message--assistant:before{content:"";position:absolute;left:-38px;top:1px;width:30px;height:30px;border:1px solid rgba(67,244,238,.3);border-radius:50%;background:radial-gradient(circle,var(--neon) 0 14%,transparent 16%),rgba(6,20,26,.88);box-shadow:0 0 16px rgba(67,244,238,.14)}.mia-home .message--user{align-self:flex-end;border:1px solid rgba(255,255,255,.1);border-bottom-right-radius:5px;background:linear-gradient(135deg,#6c5cf6,#1ebbc2);color:#fff;box-shadow:0 9px 22px rgba(75,96,238,.2)}.mia-home .suggestions{display:none!important}
  .mia-home .action-dock{display:grid!important;grid-template-columns:minmax(0,1fr) 52px!important;gap:8px;align-items:center;padding:7px 10px 0}.mia-home .composer{position:relative;display:grid!important;grid-template-columns:48px minmax(0,1fr) 44px!important;gap:5px;align-items:center;padding:3px;border:1px solid rgba(88,241,235,.36);border-radius:18px;background:rgba(247,253,255,.97);box-shadow:0 0 24px rgba(67,244,238,.1),0 12px 28px rgba(0,0,0,.2)}.mia-home .composer:before{content:none!important}.mia-home .composer input{grid-column:2!important;grid-row:1!important;width:100%;height:46px!important;min-height:46px!important;padding:0 4px!important;border:0!important;border-radius:0!important;background:transparent!important;color:#10181e!important;font:500 15px/1.2 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;outline:0;box-shadow:none!important}.mia-home .composer input::placeholder{color:#68757e}.mia-home .icon-button{position:relative!important;z-index:2;grid-column:1!important;grid-row:1!important;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;margin:0!important;display:grid!important;place-items:center;border:0;border-radius:14px!important;background:linear-gradient(145deg,#24d8cc,#197896)!important;color:#fff!important;box-shadow:0 7px 18px rgba(25,147,154,.3)!important}.mia-home .mic-symbol{position:relative;width:11px!important;height:17px!important;display:block;border:2px solid currentColor!important;border-radius:9px}.mia-home .mic-symbol:before{content:"";position:absolute;left:50%;bottom:-8px;width:2px;height:7px;background:currentColor;transform:translateX(-50%)}.mia-home .mic-symbol:after{content:"";position:absolute;left:50%;bottom:-10px;width:17px;height:9px;border:2px solid currentColor;border-top:0;border-radius:0 0 12px 12px;transform:translateX(-50%)}.mia-home .voice-label,.mia-home .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.mia-home .send-button{position:relative;z-index:2;grid-column:3!important;grid-row:1!important;width:40px!important;height:40px!important;display:grid;place-items:center;border:0;border-radius:13px!important;background:linear-gradient(145deg,#171e28,#070c12)!important;color:#63f4ee!important;font-size:18px!important;font-weight:900;box-shadow:none}.mia-home button:disabled{opacity:.38}.mia-home .whatsapp-link{position:relative;width:52px!important;height:52px!important;min-height:52px!important;display:grid!important;place-items:center;border:1px solid rgba(255,255,255,.18)!important;border-radius:17px!important;background:linear-gradient(145deg,#2ee777,#18b858)!important;color:transparent!important;font-size:0!important;box-shadow:0 8px 22px rgba(37,211,102,.24)!important}.mia-home .whatsapp-link:before{content:"W";position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:22px;font-weight:900}.mia-home .whatsapp-icon{display:none!important}
  .mia-home .order-bar{display:none!important}
  html[data-mia-avatar-state="listening"] .mia-home .avatar-frame{box-shadow:0 0 0 1px rgba(67,244,238,.25),0 0 46px rgba(67,244,238,.2)}html[data-mia-avatar-state="speaking"] .mia-home .avatar-frame{box-shadow:0 0 0 1px rgba(124,109,255,.3),0 0 52px rgba(124,109,255,.22)}
  @media(max-width:370px),(max-height:680px){.mia-home{grid-template-rows:minmax(0,68dvh) minmax(0,32dvh)!important}.mia-home .mia-name-mark span{font-size:clamp(38px,13vw,54px)!important}.mia-home .assistant-header{min-height:38px;padding-block:5px 3px}.mia-home .message{padding:8px 10px;font-size:13px}}
`;

export default function Home() {
  const tenant = getTenantPublicConfig();

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: criticalMiaStyles }} />
    <main className="mobile-chat-shell mia-home" style={tenant.theme}>
      <div className="aurora aurora--coral" />
      <div className="aurora aurora--cyan" />
      <section className="avatar-stage" aria-label={tenant.assistantName}>
        <div className="avatar-frame" aria-label={`Avatar ${tenant.spokenAssistantName}`}>
          <AvatarVideo
            label={`Avatar video ${tenant.spokenAssistantName}`}
            poster={tenant.avatarPoster}
            src={tenant.avatarVideo}
          />
          <div className="mia-name-mark" aria-hidden="true">
            <span>{tenant.brandMark}</span>
          </div>
          <div className="mia-commercial-badge" aria-label="Mia è online">
            <span className="mia-commercial-dot" aria-hidden="true" />
            MIA · ASSISTENTE AI ONLINE
          </div>
        </div>
      </section>

      <section className="assistant-workspace" aria-label={`Chat con ${tenant.assistantName}`}>
        <Assistant tenant={tenant} />
      </section>
    </main>
    </>
  );
}
