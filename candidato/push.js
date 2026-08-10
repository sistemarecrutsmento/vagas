// Notificações Web Push do candidato — opt-in explícito.
(() => {
  const API_PUSH = 'https://recrutamento-api-novo.onrender.com';
  const VAPID = 'BJsc3ojVVChumAPPpxW-r6ylSc6nLfal3evNUhlUTWL0kZw51XMgC5Fz4wlUTyNNuemHzOzW363v8yyDsjgD6po';
  function b64(s){return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
  async function ativar(){
    if(!('serviceWorker' in navigator)||!('PushManager' in window)) throw Error('Este navegador não oferece notificações push.');
    const token=localStorage.getItem('candidato_token'); if(!token) throw Error('Faça login para ativar notificações.');
    const reg=await navigator.serviceWorker.ready; const perm=await Notification.requestPermission();
    if(perm!=='granted') throw Error('Permissão para notificações não concedida.');
    let sub=await reg.pushManager.getSubscription(); if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(VAPID)});
    const r=await fetch(API_PUSH+'/api/candidato/push/subscribe',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({subscription:sub.toJSON(),dispositivo:navigator.userAgent.slice(0,180)})});
    if(!r.ok) throw Error('Não foi possível ativar as notificações.');
    localStorage.setItem('candidato_push_ativo','1'); return true;
  }
  async function desativar(){const token=localStorage.getItem('candidato_token'); const reg=await navigator.serviceWorker.ready; const sub=await reg.pushManager.getSubscription(); if(token&&sub) await fetch(API_PUSH+'/api/candidato/push/subscribe',{method:'DELETE',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({endpoint:sub.endpoint})}); if(sub) await sub.unsubscribe(); localStorage.removeItem('candidato_push_ativo');}
  window.candidatoPush={ativar,desativar};
  const iniciarUI=()=>{if(!document.querySelector('[data-ativar-push]')){const x=document.createElement('button');x.dataset.ativarPush='1';x.textContent='🔔 Ativar notificações';x.style='position:fixed;bottom:18px;right:18px;z-index:9999;padding:12px 16px;border:0;border-radius:10px;background:#722F37;color:#fff;font-weight:700;box-shadow:0 3px 12px #0004';document.body.appendChild(x);}const b=document.querySelector('[data-ativar-push]'); b.addEventListener('click',async()=>{b.disabled=true;try{await ativar();b.textContent='Notificações ativadas';}catch(e){alert(e.message);b.disabled=false;}});}; if(document.readyState==='loading') window.addEventListener('DOMContentLoaded',iniciarUI); else iniciarUI();
})();
