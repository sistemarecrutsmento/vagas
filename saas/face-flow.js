/* Master SaaS face gate: camera stays in browser; API receives landmarks only. */
(function (window) {
  'use strict';
  const API = window.VAGASIO_API_BASE || 'https://vagasio-api-staging.onrender.com';
  const DEBUG = /staging|localhost|127\.0\.0\.1/i.test(location.hostname) || location.search.includes('faceDebug=1') || localStorage.getItem('FACE_DEBUG_LOGS') === 'true';
  const log = (...a) => DEBUG && console.debug('[FACE-STAGING]', ...a);
  let visionPromise;
  function token() { const t = SaaSAuthStore.getAccess(); log('auth token', t ? 'present' : 'missing'); return t; }
  async function request(path, opts = {}) {
    log('API request', path, opts.method || 'GET');
    const r = await fetch(API + path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token(), ...(opts.headers || {}) } });
    const d = await r.json().catch(() => ({}));
    log('API response', path, r.status);
    if (!r.ok) throw new Error(d.erro || 'Não foi possível concluir a verificação.');
    return d;
  }
  async function vision() {
    if (!visionPromise) visionPromise = (async () => {
      log('MediaPipe import start');
      const m = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/+esm');
      log('WASM load start');
      const fileset = await m.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm');
      log('model load start');
      const model = await m.FaceLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', delegate: 'GPU' }, runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: false });
      log('model load ok'); return model;
    })().catch(e => { visionPromise = null; log('MediaPipe/model failure', e.name, e.message); throw e; });
    return visionPromise;
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function metrics(p) {
    const faceW = Math.max(dist(p[33], p[263]), .001);
    const eyeMid = { x: (p[33].x + p[263].x) / 2, y: (p[33].y + p[263].y) / 2 };
    return {
      eyeOpen: ((Math.abs(p[159].y - p[145].y) + Math.abs(p[386].y - p[374].y)) / 2) / faceW,
      mouthOpen: Math.abs(p[13].y - p[14].y) / Math.max(dist(p[61], p[291]), .001),
      yaw: (p[1].x - eyeMid.x) / faceW,
      nod: (p[1].y - eyeMid.y) / faceW
    };
  }
  function commandDetector(command, first) {
    let openSeen = false, closedFrames = 0, reopenedFrames = 0;
    let targetFrames = 0, downFrames = 0, returnFrames = 0, downSeen = false;
    return function (m) {
      if (command === 'blink') {
        if (!openSeen && m.eyeOpen > Math.max(first.eyeOpen * .82, .18)) openSeen = true;
        if (openSeen && m.eyeOpen < first.eyeOpen * .58) { closedFrames++; reopenedFrames = 0; }
        else if (closedFrames >= 2 && m.eyeOpen > Math.max(first.eyeOpen * .78, .17)) { reopenedFrames++; }
        else if (closedFrames < 2) closedFrames = 0;
        return closedFrames >= 2 && reopenedFrames >= 2;
      }
      if (command === 'open_mouth') {
        if (m.mouthOpen > Math.max(first.mouthOpen * 1.65, .42)) targetFrames++; else if (targetFrames < 4) targetFrames = 0;
        return targetFrames >= 4;
      }
      if (command === 'turn_left' || command === 'turn_right') {
        const reached = command === 'turn_left' ? m.yaw < first.yaw - .28 : m.yaw > first.yaw + .28;
        if (reached) targetFrames++; else targetFrames = 0;
        return targetFrames >= 4;
      }
      if (command === 'nod') {
        if (!downSeen) { if (m.nod > first.nod + .10) downFrames++; else if (downFrames < 3) downFrames = 0; if (downFrames >= 3) downSeen = true; }
        else if (Math.abs(m.nod - first.nod) < .045) returnFrames++; else returnFrames = 0;
        return downSeen && returnFrames >= 3;
      }
      return false;
    };
  }
  async function capture(command) {
    log('capture start', { command });
    const video = document.createElement('video'); video.playsInline = true; video.muted = true;
    let stream;
    try {
      log('camera request');
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      log('camera ok'); video.srcObject = stream; await video.play(); const lm = await vision();
      const started = performance.now(), frames = [], initial = [];
      let first, detector, commandCompleted = false, lastLog = 0;
      while (performance.now() - started < 15000) {
        const result = lm.detectForVideo(video, performance.now());
        const faces = result.faceLandmarks || [];
        if (faces.length === 1) {
          const p = faces[0], m = metrics(p); frames.push(p);
          if (!first) {
            initial.push(m);
            if (initial.length >= 10) {
              const spread = k => Math.max(...initial.map(x => x[k])) - Math.min(...initial.map(x => x[k]));
              if (spread('yaw') < .08 && spread('nod') < .06) { first = initial[Math.floor(initial.length / 2)]; detector = commandDetector(command, first); log('neutral position stable', first); }
              else initial.shift();
            }
          } else {
            commandCompleted = detector(m);
            if (performance.now() - lastLog > 1000) { log('one face; command state', { command, commandCompleted }); lastLog = performance.now(); }
          }
        } else if (faces.length !== 1) {
          if (performance.now() - lastLog > 1000) { log('requires exactly one face', { detected: faces.length }); lastLog = performance.now(); }
        }
        if (commandCompleted && frames.length > 12) break;
        await new Promise(requestAnimationFrame);
      }
      log('capture end', { command, commandCompleted, frames: frames.length });
      if (!commandCompleted) throw new Error('Comando não detectado dentro do tempo.');
      const p = frames[Math.floor(frames.length / 2)];
      const descriptor = p.flatMap(x => [Number(x.x.toFixed(5)), Number(x.y.toFixed(5)), Number(x.z.toFixed(5))]);
      log('descriptor generated', descriptor.length);
      return { descriptor, liveness_passed: true, commandCompleted: true, command };
    } catch (e) { log('capture failure', e.name, e.message); throw e; }
    finally { if (stream) stream.getTracks().forEach(t => t.stop()); log('camera stopped'); }
  }
  window.MasterFaceFlow = Object.freeze({ request, capture, token });
})(window);
