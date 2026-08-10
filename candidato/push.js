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
  const iniciarUI=()=>{ if(!localStorage.getItem('candidato_token')){setTimeout(iniciarUI,1000);return;} if(Notification.permission==='default') setTimeout(()=>ativar().catch(()=>{}),300); }; if(document.readyState==='loading') window.addEventListener('DOMContentLoaded',iniciarUI); else iniciarUI();
})();
