/* VagasIO Splash Screen — uma entrada por visita à Home */
(function () {
  'use strict';

  var splash = document.querySelector('.vagasio-splash');
  if (!splash) return;

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var exitDelay = reducedMotion ? 1200 : 3200;
  var exitDuration = reducedMotion ? 220 : 880;
  var redirected = false;

  function enterSite() {
    if (redirected) return;
    redirected = true;
    splash.classList.add('is-leaving');
    window.setTimeout(function () {
      window.location.replace('vendas.html');
    }, exitDuration);
  }

  window.setTimeout(enterSite, exitDelay);
})();
