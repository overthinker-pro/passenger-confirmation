const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzXeEA2TxprwUiwWkdZzp-yGDxdsjvZK9bJbbccw5av50gptw46aQjM-gfcOwOYM43l/exec";
const REFRESH_INTERVAL_MS = 5000;
const AUTH_ID = "REALME2005";
const AUTH_CODE = "807837";
const CLOSED_PAGE_URL = "closed.html";

const resultCards = document.querySelectorAll(".result-card");
const totalVotes = document.getElementById("total-votes");
const leadingOption = document.getElementById("leading-option");
const lastUpdated = document.getElementById("last-updated");
const resultsStatus = document.getElementById("results-status");
const resultsLoader = document.getElementById("results-loader");
const adminAccessTrigger = document.getElementById("admin-access-trigger");
const authModal = document.getElementById("auth-modal");
const authForm = document.getElementById("auth-form");
const authStatus = document.getElementById("auth-status");
const authCloseButton = document.getElementById("auth-close-button");
const authIdInput = document.getElementById("auth-id");
const authCodeInput = document.getElementById("auth-code");
let hasCompletedInitialLoad = false;

function openAuthModal() {
  if (!authModal || !authIdInput) {
    return;
  }

  authModal.hidden = false;
  authModal.setAttribute("aria-hidden", "false");

  if (authStatus) {
    authStatus.dataset.state = "";
    authStatus.textContent = "";
  }

  window.setTimeout(() => {
    authIdInput.focus();
  }, 0);
}

function closeAuthModal() {
  if (!authModal || !authForm) {
    return;
  }

  authModal.hidden = true;
  authModal.setAttribute("aria-hidden", "true");
  authForm.reset();

  if (authStatus) {
    authStatus.dataset.state = "";
    authStatus.textContent = "";
  }
}

function formatTimestamp(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function updateResultsView(summary, total) {
  let leaderChoice = "Awaiting votes";
  let leaderCount = 0;
  const leaderChoices = [];

  resultCards.forEach((card) => {
    const choice = card.dataset.choice;
    const count = Number(summary[choice] || 0);
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    const countNode = card.querySelector("[data-count]");
    const fillNode = card.querySelector("[data-fill]");
    const percentNode = card.querySelector("[data-percent]");

    countNode.textContent = `${count} vote${count === 1 ? "" : "s"}`;
    fillNode.style.width = `${percent}%`;
    percentNode.textContent = `${percent}%`;
    card.classList.remove("is-leading");

    if (count > leaderCount) {
      leaderChoice = choice;
      leaderCount = count;
      leaderChoices.length = 0;
      leaderChoices.push(choice);
    } else if (count > 0 && count === leaderCount) {
      leaderChoices.push(choice);
    }
  });

  if (leaderCount > 0) {
    leaderChoices.forEach((choice) => {
      const leaderCard = document.querySelector(
        `.result-card[data-choice="${choice}"]`
      );

      if (leaderCard) {
        leaderCard.classList.add("is-leading");
      }
    });

    if (leaderChoices.length > 1) {
      leaderChoice = `${leaderChoices.length} options tied`;
    }
  }

  totalVotes.textContent = String(total);
  leadingOption.textContent = leaderChoice;
  lastUpdated.textContent = formatTimestamp(new Date());
}

async function fetchResults() {
  if (
    !resultCards.length ||
    !totalVotes ||
    !leadingOption ||
    !lastUpdated ||
    !resultsStatus ||
    !resultsLoader
  ) {
    return;
  }

  if (!hasCompletedInitialLoad) {
    resultsLoader.classList.add("is-visible");
  }

  resultsStatus.dataset.state = "";
  resultsStatus.textContent = "";

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "GET",
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error("Unable to load results");
    }

    const rawResponse = await response.text();
    let result;

    try {
      result = JSON.parse(rawResponse);
    } catch (parseError) {
      throw new Error(rawResponse || "Unexpected response from server");
    }

    if (!result.success) {
      throw new Error(result.error || "Unable to load results");
    }

    updateResultsView(result.summary || {}, Number(result.total || 0));
    resultsStatus.dataset.state = "success";
    resultsStatus.textContent = "Results are live🚨";
    hasCompletedInitialLoad = true;
  } catch (error) {
    resultsStatus.dataset.state = "error";
    resultsStatus.textContent = error.message || "Unable to load results right now.";
  } finally {
    if (!hasCompletedInitialLoad || resultsStatus.dataset.state === "success") {
      resultsLoader.classList.remove("is-visible");
    }
  }
}

fetchResults();
window.setInterval(fetchResults, REFRESH_INTERVAL_MS);

adminAccessTrigger?.addEventListener("click", () => {
  openAuthModal();
});

authCloseButton?.addEventListener("click", () => {
  closeAuthModal();
});

authModal?.addEventListener("click", (event) => {
  const target = event.target;

  if (target instanceof HTMLElement && target.hasAttribute("data-auth-close")) {
    closeAuthModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && authModal && !authModal.hidden) {
    closeAuthModal();
  }
});

authForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!authIdInput || !authCodeInput || !authStatus) {
    return;
  }

  const enteredId = authIdInput.value.trim();
  const enteredCode = authCodeInput.value.trim();

  if (enteredId === AUTH_ID && enteredCode === AUTH_CODE) {
    authStatus.dataset.state = "success";
    authStatus.textContent = "Authorization successful.";
    window.location.href = CLOSED_PAGE_URL;
    return;
  }

  authStatus.dataset.state = "error";
  authStatus.textContent = "Invalid authentication ID or code.";
});
