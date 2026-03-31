const pwaScript = document.currentScript;
const swUrl = new URL(
  pwaScript?.dataset.sw || "service-worker.js",
  pwaScript?.src || window.location.href,
).href;

let deferredInstallPrompt = null;

const isStandaloneMode =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const injectInstallUi = () => {
  if (document.querySelector(".pwa-install-button") || isStandaloneMode) {
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .pwa-install-button {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 1200;
      display: none;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border: none;
      border-radius: 999px;
      background: linear-gradient(135deg, #16365c, #2f7de1);
      color: #fff;
      font: 700 0.95rem/1 "Nunito", "Segoe UI", Arial, sans-serif;
      box-shadow: 0 18px 30px rgba(20, 55, 98, 0.24);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
    }

    .pwa-install-button.is-visible {
      display: inline-flex;
    }

    .pwa-install-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 22px 34px rgba(20, 55, 98, 0.3);
      filter: brightness(1.03);
    }

    .pwa-install-button__dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #9fd3ff;
      box-shadow: 0 0 0 0 rgba(159, 211, 255, 0.45);
      animation: pwa-install-pulse 1.8s ease-out infinite;
    }

    @keyframes pwa-install-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(159, 211, 255, 0.45);
      }

      70% {
        box-shadow: 0 0 0 10px rgba(159, 211, 255, 0);
      }

      100% {
        box-shadow: 0 0 0 0 rgba(159, 211, 255, 0);
      }
    }

    @media (max-width: 640px) {
      .pwa-install-button {
        right: 14px;
        bottom: 14px;
        padding: 11px 14px;
        font-size: 0.9rem;
      }
    }
  `;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "pwa-install-button";
  button.setAttribute("aria-label", "Install Bethany Tour app");
  button.innerHTML = `
    <span class="pwa-install-button__dot" aria-hidden="true"></span>
    <span>Install App</span>
  `;

  button.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      button.classList.remove("is-visible");
    }

    deferredInstallPrompt = null;
  });

  document.head.appendChild(style);
  document.body.appendChild(button);
};

const showInstallButton = () => {
  const button = document.querySelector(".pwa-install-button");
  if (button && deferredInstallPrompt) {
    button.classList.add("is-visible");
  }
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  injectInstallUi();
  showInstallButton();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  document.querySelector(".pwa-install-button")?.classList.remove("is-visible");
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectInstallUi, { once: true });
} else {
  injectInstallUi();
}
