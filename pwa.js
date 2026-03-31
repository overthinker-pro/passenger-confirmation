const pwaScript = document.currentScript;
const swUrl = new URL(
  pwaScript?.dataset.sw || "service-worker.js",
  pwaScript?.src || window.location.href,
).href;

let deferredInstallPrompt = null;

const isStandaloneMode =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const buildFloatingInstallButton = () => {
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
      display: inline-flex;
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

    .pwa-install-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 22px 34px rgba(20, 55, 98, 0.3);
      filter: brightness(1.03);
    }

    .pwa-install-button.is-disabled {
      opacity: 0.84;
      box-shadow: none;
      cursor: default;
    }

    .pwa-install-button.is-disabled:hover {
      transform: none;
      filter: none;
      box-shadow: none;
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

  document.head.appendChild(style);
  document.body.appendChild(button);
};

const ensureInstallUi = () => {
  if (!document.querySelector(".pwa-install-button")) {
    buildFloatingInstallButton();
  }
};

const updateInstallUi = () => {
  const button = document.querySelector(".pwa-install-button");
  const helper = document.querySelector(".install-helper");

  if (!button) {
    return;
  }

  const label = button.querySelector("span:last-child");

  if (isStandaloneMode) {
    button.classList.add("is-disabled");
    if (label) {
      label.textContent = "App Installed";
    }
    if (helper) {
      helper.textContent =
        "Bethany Tour is already available in app mode on this device.";
    }
    return;
  }

  if (deferredInstallPrompt) {
    button.classList.remove("is-disabled");
    if (label) {
      label.textContent = "Install App";
    }
    if (helper) {
      helper.textContent =
        "Tap install to add Bethany Tour to your home screen or desktop.";
    }
    return;
  }

  button.classList.add("is-disabled");
  if (label) {
    label.textContent = "Install Unavailable";
  }
  if (helper) {
    helper.textContent =
      "Install works only in supported browsers and usually needs HTTPS or a local server.";
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
  ensureInstallUi();
  updateInstallUi();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateInstallUi();
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest(".pwa-install-button");

  if (!button) {
    return;
  }

  if (!deferredInstallPrompt) {
    updateInstallUi();
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  updateInstallUi();
});

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      ensureInstallUi();
      updateInstallUi();
    },
    { once: true },
  );
} else {
  ensureInstallUi();
  updateInstallUi();
}
