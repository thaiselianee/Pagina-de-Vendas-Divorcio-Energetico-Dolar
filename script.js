const CONFIG = {
  checkoutUrl: "https://pay.hotmart.com/Y108408135W?off=1pz8cclf",
};

/* =========================================
   ELEMENTOS
========================================= */

const videoFrame = document.querySelector("#videoFrame");

const lockedContent = document.querySelector("#lockedContent");
const miniPlayer = document.querySelector("#miniPlayer");
const miniPlay = document.querySelector("#miniPlay");
const restoreVideo = document.querySelector("#restoreVideo");
const unlockMessage = document.querySelector("#unlockMessage");

/* RODAPÉ */

const footerCopyright = document.querySelector("#footer-copyright");
const footerInitialSlot = document.querySelector("#footer-initial-slot");
const footerFinalSlot = document.querySelector("#footer-final-slot");

const checkoutButtons = document.querySelectorAll(".checkout-button");
const year = document.querySelector(".footer .year");

/* =========================================
   YOUTUBE PLAYER
========================================= */

let player = null;
let playerReady = false;

let progressCheckTimer = null;

let lastAllowedTime = 0;
let lastPlaybackTime = 0;

/* =========================================
   ESTADO GERAL
========================================= */

let contentUnlocked = false;
let miniPlayerDismissed = false;

let threeMomentsAnimation = null;
let threeMomentsInitialized = false;
let resizeTimer = null;

/* =========================================
   ANO DO RODAPÉ
========================================= */

if (year) {
  year.textContent = new Date().getFullYear();
}

/* =========================================
   VERIFICAR REPRODUÇÃO DO YOUTUBE
========================================= */

function isVideoPlaying() {

  return (
    playerReady &&
    player &&
    player.getPlayerState() === YT.PlayerState.PLAYING
  );

}

/* =========================================
   LIBERAR CONTEÚDO
========================================= */

function unlockPage() {

  if (contentUnlocked || !lockedContent) return;

  contentUnlocked = true;

  lockedContent.classList.add("unlocked");
  lockedContent.setAttribute("aria-hidden", "false");

  /* MOVE O RODAPÉ PARA O FINAL DO CONTEÚDO */

  if (footerCopyright && footerFinalSlot) {
    footerFinalSlot.appendChild(footerCopyright);
  }

  /* ATIVA MINI PLAYER SE O VÍDEO ESTIVER TOCANDO */

  if (
    miniPlayer &&
    !miniPlayerDismissed &&
    isVideoPlaying()
  ) {
    miniPlayer.classList.add("active");
  }

  /* MENSAGEM DE LIBERAÇÃO */

  if (unlockMessage) {

    unlockMessage.classList.add("show");

    window.setTimeout(() => {
      unlockMessage.classList.remove("show");
    }, 6500);

  }

  /* INICIALIZA AS ANIMAÇÕES APÓS LIBERAR O CONTEÚDO */

  initializeScrollReveal();

}

/* =========================================
   ATUALIZAR BOTÕES DO MINI PLAYER
========================================= */

function updatePlayButtons() {

  if (!playerReady || !miniPlay) return;

  miniPlay.textContent =
    isVideoPlaying() ? "Ⅱ" : "▶";

}

/* =========================================
   CONTROLE DE AVANÇO DO VÍDEO
========================================= */

function checkVideoProgress() {

  if (!playerReady || !isVideoPlaying()) return;

  const currentTime = player.getCurrentTime();

  const difference = currentTime - lastPlaybackTime;

  /*
    Detecta saltos bruscos para frente.
    Se a pessoa tentar avançar, volta
    para a última posição permitida.
  */

  if (difference > 2.5) {

    player.seekTo(lastAllowedTime, true);

    lastPlaybackTime = lastAllowedTime;

    return;

  }

  /*
    Atualiza a última posição assistida.
  */

  if (difference >= 0 && currentTime > lastAllowedTime) {

    lastAllowedTime = currentTime;

  }

  lastPlaybackTime = currentTime;

}

/* =========================================
   ESTADO DO VÍDEO E MINI PLAYER
========================================= */

function updateVideoState() {

  if (!playerReady) return;

  if (
    contentUnlocked &&
    miniPlayer &&
    videoFrame &&
    isVideoPlaying() &&
    !miniPlayerDismissed
  ) {

    const frameRect = videoFrame.getBoundingClientRect();

    if (frameRect.bottom < 0 || frameRect.top < 0) {

      miniPlayer.classList.add("active");

    } else {

      miniPlayer.classList.remove("active");

    }

  } else if (miniPlayer && !isVideoPlaying()) {

    miniPlayer.classList.remove("active");

  }

  updatePlayButtons();

}

/* =========================================
   YOUTUBE - PLAYER PRONTO
========================================= */


function onYouTubePlayerReady(event) {

  playerReady = true;

  lastAllowedTime = 0;
  lastPlaybackTime = 0;

  // INICIA O VÍDEO AUTOMATICAMENTE SEM SOM

  player.mute();

  player.playVideo();

  updatePlayButtons();

  console.log("Player do YouTube carregado com sucesso.");

}


/* =========================================
   YOUTUBE - MUDANÇA DE ESTADO
========================================= */

function onYouTubePlayerStateChange(event) {

  /* VÍDEO COMEÇOU A REPRODUZIR */

  if (event.data === YT.PlayerState.PLAYING) {

    lastPlaybackTime = player.getCurrentTime();

    clearInterval(progressCheckTimer);

    progressCheckTimer = setInterval(() => {

      checkVideoProgress();

    }, 500);

  }

  /* VÍDEO PAUSADO */

  if (event.data === YT.PlayerState.PAUSED) {

    clearInterval(progressCheckTimer);

    lastPlaybackTime = player.getCurrentTime();

  }

  /* VÍDEO FINALIZADO */

  if (event.data === YT.PlayerState.ENDED) {

    clearInterval(progressCheckTimer);

    lastPlaybackTime = player.getDuration();
    lastAllowedTime = player.getDuration();

    /*
      LIBERA TODAS AS PRÓXIMAS SEÇÕES
      SOMENTE QUANDO O YOUTUBE FINALIZAR
    */

    unlockPage();

    if (miniPlayer) {
      miniPlayer.classList.remove("active");
    }

  }

  /* VÍDEO ENTROU EM BUFFERING */

  if (event.data === YT.PlayerState.BUFFERING) {

    clearInterval(progressCheckTimer);

  }

  updateVideoState();

}

/* =========================================
   INICIALIZAR PLAYER DO YOUTUBE
========================================= */

function initializeYouTubePlayer() {

  if (
    player ||
    !document.querySelector("#vslVideo")
  ) {
    return;
  }

  player = new YT.Player("vslVideo", {

    events: {

      onReady: onYouTubePlayerReady,

      onStateChange: onYouTubePlayerStateChange

    }

  });

}

/* =========================================
   CARREGAR YOUTUBE IFRAME API
========================================= */

window.onYouTubeIframeAPIReady = function () {

  initializeYouTubePlayer();

};

/* VERIFICA SE A API JÁ ESTÁ CARREGADA */

if (window.YT && window.YT.Player) {

  initializeYouTubePlayer();

} else {

  if (!document.querySelector("#youtube-iframe-api")) {

    const youtubeScript = document.createElement("script");

    youtubeScript.id = "youtube-iframe-api";

    youtubeScript.src =
      "https://www.youtube.com/iframe_api";

    document.head.appendChild(youtubeScript);

  }

}

/* =========================================
   MINI PLAYER
========================================= */

if (miniPlay) {

  miniPlay.addEventListener("click", () => {

    if (!playerReady) return;

    if (isVideoPlaying()) {

      player.pauseVideo();

    } else {

      player.playVideo();

    }

    updatePlayButtons();

  });

}

/* =========================================
   RESTAURAR VÍDEO ORIGINAL
========================================= */

if (restoreVideo && videoFrame && miniPlayer) {

  restoreVideo.addEventListener("click", () => {

    miniPlayerDismissed = true;

    miniPlayer.classList.remove("active");

    videoFrame.scrollIntoView({

      behavior: "smooth",

      block: "center"

    });

    window.setTimeout(() => {

      miniPlayerDismissed = false;

      updateVideoState();

    }, 900);

  });

}

/* =========================================
   ROLAGEM NORMAL DA PÁGINA
========================================= */

window.addEventListener("scroll", () => {

  updateVideoState();

}, {
  passive: true
});

/* =========================================
   BOTÕES DE COMPRA
========================================= */

checkoutButtons.forEach((button) => {

  button.addEventListener("click", (event) => {

    if (!CONFIG.checkoutUrl) {

      event.preventDefault();

      alert(
        "O link de pagamento ainda não foi configurado. " +
        "Coloque a URL em CONFIG.checkoutUrl no arquivo script.js."
      );

      return;

    }

    event.preventDefault();

    window.open(
      CONFIG.checkoutUrl,
      "_blank",
      "noopener,noreferrer"
    );

  });

});

/* =========================================
   PROTEÇÃO CONTRA ATALHOS
========================================= */

if (videoFrame) {

  videoFrame.addEventListener("contextmenu", (event) => {

    event.preventDefault();

  });

  videoFrame.addEventListener("keydown", (event) => {

    if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight" ||
      event.key === "Home" ||
      event.key === "End"
    ) {

      event.preventDefault();

    }

  });

}

/* =========================================
   ANIMAÇÃO DOS ELEMENTOS AO ROLAR A PÁGINA
========================================= */

function initializeScrollReveal() {

  const revealSelectors = [

    ".postvideo-identification .identification-copy",
    ".postvideo-identification .identification-highlight",
    ".postvideo-identification .identification-closing",

    ".postvideo-experience .experience-heading",
    ".postvideo-experience .experience-card",

    ".postvideo-ritual .ritual-copy",
    ".postvideo-ritual .ritual-visual",

    ".receive-heading",
    ".receive-item",
    ".receive-footer",

    ".offer-header",
    ".offer-card",

    ".bonus-section .section-heading",
    ".bonus-card",

    ".guarantee-seal",
    ".guarantee-content",

    ".closing-content",

    ".faq-section .section-heading",
    ".faq-list details",

  ];

  const elements = document.querySelectorAll(

    revealSelectors
      .map(selector => `#lockedContent ${selector}`)
      .join(",")

  );

  elements.forEach((element, index) => {

    element.classList.add("scroll-reveal");

    const delay = (index % 4) * 120;

    element.style.setProperty(
      "--reveal-delay",
      `${delay}ms`
    );

  });

  const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {

        entry.target.classList.add("is-visible");

        observer.unobserve(entry.target);

      }

    });

  }, {

    threshold: 0.12,
    rootMargin: "0px 0px -45px 0px"

  });

  elements.forEach(element => {

    observer.observe(element);

  });

  /* INICIALIZA OS TRÊS MOMENTOS */

  if (!threeMomentsInitialized) {

    threeMomentsInitialized = true;

    window.setTimeout(() => {

      initializeThreeMoments();

    }, 500);

  }

}

/* =========================================
   13. TRÊS MOMENTOS — HORIZONTAL COM PIN
========================================= */

function initializeThreeMoments() {

  const section = document.querySelector("#tres-momentos");

  const track = section?.querySelector(".three-moments-track");

  if (!section || !track) return;

  if (
    typeof gsap === "undefined" ||
    typeof ScrollTrigger === "undefined"
  ) {

    console.error("GSAP ou ScrollTrigger não foi carregado.");

    return;

  }

  gsap.registerPlugin(ScrollTrigger);

  /* REMOVE ANIMAÇÃO ANTERIOR, SE EXISTIR */

  if (threeMomentsAnimation) {

    threeMomentsAnimation.scrollTrigger?.kill();

    threeMomentsAnimation.kill();

    threeMomentsAnimation = null;

  }

  /* REINICIA A POSIÇÃO DOS CARDS */

  gsap.set(track, {

    x: 0

  });

  /* CALCULA A DISTÂNCIA REAL DO MOVIMENTO */

  function getDistance() {

    return Math.max(

      0,

      track.scrollWidth - section.clientWidth

    );

  }

  if (getDistance() <= 0) {

    console.warn(

      "Os cards não possuem largura horizontal suficiente.",

      {

        larguraDosCards: track.scrollWidth,

        larguraDaSecao: section.clientWidth

      }

    );

    return;

  }

  /* CRIA A ANIMAÇÃO HORIZONTAL */

  threeMomentsAnimation = gsap.to(track, {

    x: () => -getDistance(),

    ease: "none",

    scrollTrigger: {

      trigger: section,

      start: "top top",

      end: () => `+=${getDistance() * 0.20}`,

      pin: section,

      pinSpacing: true,

      scrub: 0.5,

      anticipatePin: 1,

      invalidateOnRefresh: true

    }

  });

  /* ATUALIZA OS CÁLCULOS */

  requestAnimationFrame(() => {

    ScrollTrigger.refresh();

  });

}

/* =========================================
   RECÁLCULO RESPONSIVO
========================================= */

window.addEventListener("resize", () => {

  if (!contentUnlocked || !threeMomentsInitialized) return;

  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {

    initializeThreeMoments();

  }, 250);

});

/* =========================================
   INICIALIZAÇÃO
========================================= */

updatePlayButtons();
