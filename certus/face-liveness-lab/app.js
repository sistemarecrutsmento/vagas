(function () {
  'use strict';

  const core = window.CertusFaceLivenessCore;
  const video = document.getElementById('camera');
  const status = document.getElementById('status');
  const stateTitle = document.getElementById('state-title');
  const stateIcon = document.getElementById('state-icon');
  const resultBox = document.getElementById('result-box');
  const camLabel = document.getElementById('cam-label');
  const live = document.getElementById('live-indicator');
  const liveText = document.getElementById('live-text');
  const consent = document.getElementById('consent');
  const startButton = document.getElementById('start');
  const stopButton = document.getElementById('stop');
  const stepsEl = document.getElementById('steps');
  const metrics = {
    face: document.getElementById('m-face'), frame: document.getElementById('m-frame'),
    left: document.getElementById('m-blink-left'), right: document.getElementById('m-blink-right'),
    turn: document.getElementById('m-turn'), expression: document.getElementById('m-expression'), engine: document.getElementById('m-engine'),
    selftest: document.getElementById('m-selftest')
  };
  const softwareChecks = core.runSelfTests();
  const softwareChecksPassed = softwareChecks.every(check => check.pass);
  metrics.selftest.textContent = softwareChecks.filter(check => check.pass).length + '/' + softwareChecks.length + (softwareChecksPassed ? ' OK' : ' falhou');
  metrics.selftest.style.color = softwareChecksPassed ? 'var(--ok)' : 'var(--bad)';

  let stream = null;
  let landmarker = null;
  let visionModule = null;
  let running = false;
  let generation = 0;
  let lastVideoTime = -1;

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  function setStatus(title, text, tone) {
    stateTitle.textContent = title;
    status.textContent = text;
    stateIcon.textContent = tone === 'ok' ? '✓' : tone === 'error' ? '!' : 'i';
    resultBox.dataset.tone = tone || '';
  }

  function setCameraLabel(text) { camLabel.textContent = text; }

  function releaseCamera() {
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    live.classList.remove('active');
    liveText.textContent = 'Câmera desligada';
  }

  function renderSteps(sequence, stage, complete) {
    stepsEl.replaceChildren();
    sequence.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'step' + (complete || index < stage ? ' done' : index === stage ? ' active' : '');
      const number = document.createElement('span');
      number.className = 'num';
      number.textContent = complete || index < stage ? '✓' : String(index + 1);
      const label = document.createElement('span');
      const labels = { blink: 'Fechar e reabrir os olhos', turn: 'Virar e voltar ao centro', mouth: 'Abrir e fechar a boca', smile: 'Sorrir e relaxar o rosto' };
      label.textContent = labels[item.type] || 'Movimento facial';
      row.append(number, label);
      stepsEl.append(row);
    });
  }

  async function createDetector() {
    metrics.engine.textContent = 'Carregando…';
    if (!visionModule) {
      visionModule = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/vision_bundle.mjs');
    }
    const FilesetResolver = visionModule.FilesetResolver;
    const FaceLandmarker = visionModule.FaceLandmarker;
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm');
    let lastError = null;
    for (const delegate of ['GPU', 'CPU']) {
      try {
        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-tasks/face_landmarker/face_landmarker_v2_with_blendshapes.task',
            delegate
          },
          runningMode: 'VIDEO', numFaces: 2, outputFaceBlendshapes: true,
          minFaceDetectionConfidence: 0.55, minFacePresenceConfidence: 0.5, minTrackingConfidence: 0.5
        });
        metrics.engine.textContent = delegate + ' pronto';
        return landmarker;
      } catch (error) {
        lastError = error;
        if (landmarker) {
          try { landmarker.close(); } catch (_) {}
          landmarker = null;
        }
      }
    }
    throw lastError || new Error('Não foi possível carregar o detector.');
  }

  function closeDetector() {
    if (landmarker) {
      try { landmarker.close(); } catch (_) {}
      landmarker = null;
    }
    metrics.engine.textContent = 'Encerrado';
  }

  function stop(message) {
    running = false;
    generation++;
    releaseCamera();
    closeDetector();
    startButton.disabled = !consent.checked;
    stopButton.disabled = true;
    setCameraLabel('Câmera desligada');
    setStatus('Sessão encerrada', message || 'Teste interrompido. Câmera encerrada.');
  }

  function resetMetrics() {
    ['face', 'frame', 'left', 'right', 'turn', 'expression'].forEach(key => { metrics[key].textContent = '—'; });
  }

  function formatPercent(value) {
    return Number.isFinite(value) ? Math.round(value * 100) + '%' : '—';
  }

  async function start() {
    if (!consent.checked || running) return;
    if (!softwareChecksPassed) {
      setStatus('Autochecagem falhou', 'Esta versão não passou nos testes internos de lógica. A câmera não será iniciada.', 'error');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('Câmera indisponível', 'Abra esta página em um navegador com HTTPS e permissão de câmera.', 'error');
      return;
    }

    startButton.disabled = true;
    stopButton.disabled = false;
    running = true;
    const token = ++generation;
    lastVideoTime = -1;
    resetMetrics();
    setStatus('Preparando detector', 'Baixando o motor e o modelo de análise facial para este aparelho.');
    setCameraLabel('Carregando modelo de teste…');
    liveText.textContent = 'Preparando';

    try {
      await createDetector();
      if (!running || token !== generation) return;
      setStatus('Aguardando câmera', 'O modelo está pronto. Agora o navegador pedirá acesso à câmera.');
      const requested = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' }, width: { ideal: 720 }, height: { ideal: 1280 } }, audio: false
      });
      if (!running || token !== generation) {
        requested.getTracks().forEach(track => track.stop());
        return;
      }
      stream = requested;
      video.srcObject = stream;
      await video.play();
      if (video.readyState < 2) {
        await new Promise(resolve => video.addEventListener('loadeddata', resolve, { once: true }));
      }
      if (!running || token !== generation) return;
      live.classList.add('active');
      liveText.textContent = 'Análise local ativa';
      setCameraLabel('Centralize o rosto no contorno');
      setStatus('Ajuste o enquadramento', 'Olhe para a câmera, mantenha o rosto inteiro dentro do oval e aguarde a detecção.');
      await runChallenge(token);
    } catch (error) {
      if (token !== generation) return;
      running = false;
      generation++;
      releaseCamera();
      closeDetector();
      startButton.disabled = !consent.checked;
      stopButton.disabled = true;
      let text = 'Não consegui iniciar. Verifique a conexão para baixar o modelo e tente novamente.';
      if (error && error.name === 'NotAllowedError') text = 'O acesso à câmera foi negado. Nenhum teste foi executado.';
      if (error && error.name === 'NotFoundError') text = 'Este aparelho não disponibilizou uma câmera.';
      setCameraLabel('Não foi possível iniciar');
      setStatus('Falha ao iniciar', text, 'error');
    }
  }

  async function runChallenge(token) {
    const sequence = core.createChallengeSequence();
    renderSteps(sequence, -1, false);
    const startAt = Date.now();
    let stage = 0;
    let faceState = 'nenhum rosto detectado';
    let active = false;
    let neutral = [];
    let turnBaseline = null;
    let turned = false;
    let turnFrames = 0;
    let centerFrames = 0;
    let blinkLeftSamples = [];
    let blinkRightSamples = [];
    let blinkBaseline = null;
    let closedFrames = 0;
    let closedAt = 0;
    let expressionSamples = [];
    let expressionBaseline = null;
    let expressionActiveFrames = 0;
    let expressionSeen = false;
    let expressionRelaxFrames = 0;
    let frameCount = 0;
    let fpsAt = Date.now();

    while (running && generation === token && stage < sequence.length && Date.now() - startAt < 80000) {
      if (video.readyState < 2 || video.currentTime === lastVideoTime) {
        await delay(35);
        continue;
      }
      lastVideoTime = video.currentTime;

      let result;
      try {
        result = landmarker.detectForVideo(video, performance.now());
      } catch (_) {
        faceState = 'falha ao processar imagem';
        setCameraLabel('Falha ao processar — encerre e tente de novo');
        setStatus('Erro de processamento', 'O navegador não conseguiu analisar este quadro. Encerre a câmera e tente novamente.', 'error');
        await delay(120);
        continue;
      }

      frameCount++;
      const now = Date.now();
      if (now - fpsAt >= 1000) {
        const engineName = metrics.engine.textContent.split(' · ')[0];
        metrics.engine.textContent = engineName + ' · ' + frameCount + ' q/s';
        frameCount = 0;
        fpsAt = now;
      }

      const faces = result && result.faceLandmarks ? result.faceLandmarks : [];
      metrics.face.textContent = faces.length === 1 ? '1 rosto' : faces.length ? faces.length + ' rostos' : 'não localizado';
      if (faces.length !== 1) {
        faceState = faces.length > 1 ? 'mais de um rosto' : 'nenhum rosto detectado';
        metrics.frame.textContent = '—';
        setCameraLabel(faces.length > 1 ? 'Deixe apenas um rosto visível' : 'Aproxime-se e melhore a iluminação');
        setStatus('Aguardando um rosto', faces.length > 1 ? 'Deixe somente uma pessoa visível.' : 'Aproxime o telefone e deixe todo o rosto dentro do contorno.');
        await delay(35);
        continue;
      }

      const points = faces[0];
      const wellFramed = core.isFaceWellFramed(points);
      faceState = 'rosto localizado';
      metrics.frame.textContent = wellFramed ? 'adequado' : 'ajustar';
      if (!wellFramed) {
        setCameraLabel('Ajuste o rosto dentro do contorno');
        setStatus('Ajuste o enquadramento', 'Afaste ou aproxime um pouco o telefone e centralize o rosto.');
        await delay(35);
        continue;
      }

      setCameraLabel('Rosto localizado · análise no aparelho');
      const item = sequence[stage];
      if (!active) {
        active = true;
        neutral = [];
        turnBaseline = null;
        turned = false;
        turnFrames = 0;
        centerFrames = 0;
        blinkLeftSamples = [];
        blinkRightSamples = [];
        blinkBaseline = null;
        closedFrames = 0;
        closedAt = 0;
        expressionSamples = [];
        expressionBaseline = null;
        expressionActiveFrames = 0;
        expressionSeen = false;
        expressionRelaxFrames = 0;
        renderSteps(sequence, stage, false);
      }

      if (item.type === 'blink') {
        const blendshapes = result.faceBlendshapes && result.faceBlendshapes[0] && result.faceBlendshapes[0].categories || [];
        const scores = core.eyeBlinkScores(blendshapes);
        metrics.left.textContent = formatPercent(scores.left);
        metrics.right.textContent = formatPercent(scores.right);

        if (blinkBaseline === null) {
          if (Number.isFinite(scores.left) && Number.isFinite(scores.right) && scores.left < 0.55 && scores.right < 0.55) {
            blinkLeftSamples.push(scores.left);
            blinkRightSamples.push(scores.right);
          }
          setCameraLabel('Calibrando olhos ' + blinkLeftSamples.length + '/18');
          setStatus('Calibrando os olhos', 'Olhe para a câmera e mantenha os olhos abertos. ' + blinkLeftSamples.length + ' de 18 amostras.');
          if (blinkLeftSamples.length >= 18) {
            blinkBaseline = { left: core.median(blinkLeftSamples), right: core.median(blinkRightSamples) };
            setCameraLabel('Calibrado · faça o movimento solicitado');
            setStatus('Agora feche e abra os olhos', 'Feche os dois olhos por um instante e reabra. A leitura aparece nos indicadores.');
          }
          await delay(45);
          continue;
        }

        const closed = core.isBlinkClosed(scores, blinkBaseline);
        const reopened = core.isEyesReopened(scores, blinkBaseline);
        if (closed) {
          closedFrames++;
          if (closedFrames >= 2 && !closedAt) {
            closedAt = now;
            setCameraLabel('Fechamento dos olhos detectado');
            setStatus('Fechamento detectado', 'Agora reabra os olhos para concluir esta etapa.');
          }
        } else if (closedAt) {
          const elapsed = now - closedAt;
          if (reopened && elapsed >= 80 && elapsed < 3500) {
            stage++;
            active = false;
            renderSteps(sequence, stage, false);
            setStatus('Movimento observado', 'Fechamento e reabertura foram observados.');
            await delay(250);
            continue;
          }
          if (elapsed >= 3500) {
            closedAt = 0;
            closedFrames = 0;
            setStatus('Tente mais uma vez', 'Não consegui confirmar a reabertura. Feche e reabra os olhos naturalmente.', 'warn');
          }
        } else {
          closedFrames = 0;
          setStatus('Aguardando o movimento', 'Indicadores: esquerdo ' + formatPercent(scores.left) + ' · direito ' + formatPercent(scores.right) + '. Feche e reabra os olhos.');
          if (Math.max(scores.left || 0, scores.right || 0) > 0.3) setCameraLabel('Detectando movimento dos olhos…');
        }
      } else if (item.type === 'turn') {
        const offset = core.noseOffset(points);
        metrics.turn.textContent = Number.isFinite(offset) ? (offset >= 0 ? '+' : '') + offset.toFixed(3) : '—';
        if (!Number.isFinite(offset)) {
          await delay(40);
          continue;
        }
        if (turnBaseline === null) {
          neutral.push(offset);
          setCameraLabel('Calibrando posição central ' + neutral.length + '/12');
          setStatus('Calibrando posição central', 'Olhe reto para a câmera e mantenha a cabeça estável.');
          if (neutral.length >= 12) {
            turnBaseline = core.median(neutral);
            setStatus('Vire um pouco a cabeça', 'Vire para qualquer lado e depois volte a olhar reto.');
            setCameraLabel('Pronto · vire para qualquer lado');
          }
          await delay(45);
          continue;
        }
        if (!turned) {
          turnFrames = core.hasTurnedFrom(offset, turnBaseline, 0.065) ? turnFrames + 1 : 0;
          if (turnFrames >= 2) {
            turned = true;
            centerFrames = 0;
            setCameraLabel('Virada detectada · volte ao centro');
            setStatus('Virada detectada', 'Agora volte a olhar reto para a câmera.');
          }
        } else {
          centerFrames = core.hasReturnedTo(offset, turnBaseline, 0.075) ? centerFrames + 1 : 0;
          if (centerFrames >= 2) {
            stage++;
            active = false;
            renderSteps(sequence, stage, false);
            setStatus('Movimento observado', 'Virada e retorno foram observados.');
            await delay(250);
            continue;
          }
        }
        if (!turned) setStatus('Aguardando a virada', 'Vire um pouco para qualquer lado; volte ao centro depois.');
      } else {
        const blendshapes = result.faceBlendshapes && result.faceBlendshapes[0] && result.faceBlendshapes[0].categories || [];
        const scores = core.expressionScores(blendshapes);
        const score = item.type === 'mouth' ? scores.jawOpen : (Number.isFinite(scores.smileLeft) && Number.isFinite(scores.smileRight) ? (scores.smileLeft + scores.smileRight) / 2 : NaN);
        metrics.expression.textContent = formatPercent(score);
        if (expressionBaseline === null) {
          const neutralMouth = Number.isFinite(scores.jawOpen) && scores.jawOpen < 0.5;
          const neutralSmile = Number.isFinite(scores.smileLeft) && Number.isFinite(scores.smileRight) && scores.smileLeft < 0.6 && scores.smileRight < 0.6;
          if (neutralMouth && neutralSmile) expressionSamples.push(scores);
          setCameraLabel('Calibrando expressão ' + expressionSamples.length + '/12');
          setStatus('Calibrando expressão neutra', 'Relaxe o rosto e olhe para a câmera. ' + expressionSamples.length + ' de 12 amostras.');
          if (expressionSamples.length >= 12) {
            expressionBaseline = {
              jawOpen: core.median(expressionSamples.map(sample => sample.jawOpen)),
              smileLeft: core.median(expressionSamples.map(sample => sample.smileLeft)),
              smileRight: core.median(expressionSamples.map(sample => sample.smileRight))
            };
            const prompt = item.type === 'mouth' ? 'Agora abra a boca e depois feche.' : 'Agora sorria e depois relaxe o rosto.';
            setCameraLabel('Calibrado · faça o gesto solicitado');
            setStatus(item.type === 'mouth' ? 'Abra e feche a boca' : 'Sorria e relaxe', prompt + ' Faça o movimento naturalmente.');
          }
          await delay(45);
          continue;
        }
        const activeGesture = core.isExpressionActive(scores, expressionBaseline, item.type);
        const relaxed = core.isExpressionRelaxed(scores, expressionBaseline, item.type);
        if (!expressionSeen) {
          expressionActiveFrames = activeGesture ? expressionActiveFrames + 1 : 0;
          if (expressionActiveFrames >= 2) {
            expressionSeen = true;
            expressionRelaxFrames = 0;
            setCameraLabel(item.type === 'mouth' ? 'Abertura detectada · feche a boca' : 'Sorriso detectado · relaxe o rosto');
            setStatus('Gesto detectado', item.type === 'mouth' ? 'Agora feche a boca para concluir.' : 'Agora relaxe o rosto para concluir.');
          } else {
            setCameraLabel('Aguardando expressão solicitada');
            setStatus('Aguardando o gesto', item.type === 'mouth' ? 'Abra a boca naturalmente.' : 'Sorria naturalmente.');
          }
        } else {
          expressionRelaxFrames = relaxed ? expressionRelaxFrames + 1 : 0;
          if (expressionRelaxFrames >= 2) {
            stage++;
            active = false;
            renderSteps(sequence, stage, false);
            setStatus('Movimento observado', item.type === 'mouth' ? 'Abertura e fechamento da boca foram observados.' : 'Sorriso e relaxamento foram observados.');
            await delay(250);
            continue;
          }
        }
      }
      await delay(35);
    }

    if (!running || generation !== token) return;
    if (stage === sequence.length) {
      renderSteps(sequence, stage, true);
      releaseCamera();
      closeDetector();
      running = false;
      startButton.disabled = !consent.checked;
      stopButton.disabled = true;
      setCameraLabel('Movimentos observados · câmera encerrada');
      setStatus('Teste de movimentos concluído', 'O navegador observou os movimentos pedidos. Isto não comprova prova de vida, identidade ou presença.', 'ok');
      return;
    }
    if (Date.now() - startAt >= 80000) {
      const reason = faceState !== 'rosto localizado' ? 'Diagnóstico: ' + faceState + '.' : 'O desafio não foi concluído dentro do tempo.';
      releaseCamera();
      closeDetector();
      running = false;
      startButton.disabled = !consent.checked;
      stopButton.disabled = true;
      setCameraLabel('Tempo esgotado · câmera encerrada');
      setStatus('Teste não concluído', reason + ' Veja os indicadores do detector, melhore a luz e tente novamente.', 'error');
    }
  }

  consent.addEventListener('change', function () {
    startButton.disabled = !consent.checked || running;
    if (!consent.checked && !running) setStatus('Aguardando início', 'Marque o consentimento para habilitar o teste.');
    else if (consent.checked && !running) setStatus('Pronto para iniciar', 'O detector só será baixado depois que você tocar em iniciar.');
  });
  startButton.addEventListener('click', start);
  stopButton.addEventListener('click', function () { stop(); });
  window.addEventListener('pagehide', function () {
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (landmarker) { try { landmarker.close(); } catch (_) {} }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && running) stop('A página saiu de foco. A câmera foi encerrada.');
  });
})();
