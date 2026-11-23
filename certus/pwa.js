(()=>{'use strict';
const errors=window.__certusBootErrors||(window.__certusBootErrors=[]);
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./service-worker.js').catch(e=>errors.push('Não foi possível ativar o modo offline: '+String(e?.message||e)));
window.addEventListener('error',e=>errors.push(e.message||e.target?.src||'erro no script'));
window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason?.stack||e.reason||'promise rejeitada')));
setTimeout(()=>{
 const app=document.querySelector('#app');
 if(!app||!app.innerText.includes('Carregando Certus'))return;
 const msg=errors.filter(Boolean).slice(-4).join('\n')||'O portal não concluiu sua inicialização. A página carregou, mas não foi possível abrir o formulário de acesso.';
 app.innerHTML='<main class="login"><section class="card login-card"><div class="brand"><img class="brand-logo" src="./certus-logo-color.png" alt="Certus by VagasIO"></div><h1>Não foi possível abrir o portal</h1><p class="message bad" role="alert"></p><button id="certus-reload" class="primary" type="button">Tentar novamente</button></section></main>';
 app.querySelector('[role=alert]').textContent=msg;
 app.querySelector('#certus-reload').onclick=()=>location.reload();
},7000);
let deferred=null;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;let btn=document.querySelector('#certus-install-app');if(!btn){btn=document.createElement('button');btn.id='certus-install-app';btn.type='button';btn.textContent='Instalar Certus';btn.setAttribute('aria-label','Instalar Certus no dispositivo');btn.style.cssText='position:fixed;right:16px;bottom:16px;z-index:9999;padding:11px 15px;border:0;border-radius:999px;background:#50001f;color:white;font:600 14px system-ui;box-shadow:0 4px 16px #18000a33;cursor:pointer';document.body.append(btn);btn.addEventListener('click',async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;btn.remove()})}});
window.addEventListener('appinstalled',()=>document.querySelector('#certus-install-app')?.remove());
})();
