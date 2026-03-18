const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzXeEA2TxprwUiwWkdZzp-yGDxdsjvZK9bJbbccw5av50gptw46aQjM-gfcOwOYM43l/exec";
const DEFAULT_CHOICE = "";
const MAX_VOTES_PER_DEVICE = 4;
const DEVICE_ID_STORAGE_KEY = "bethany_tour_device_id";
const DEVICE_VOTE_COUNT_STORAGE_KEY = "bethany_tour_vote_count";
const NO_SELECTION_LABEL = "No option selected";
const CLOSED_PAGE_URL = "closed.html";

const optionCards = document.querySelectorAll(".option-card");
const selectedChoice = document.getElementById("selected-choice");
const choiceInput = document.getElementById("choice-input");
const voteForm = document.getElementById("vote-form");
const submitButton = voteForm.querySelector(".submit-button");
const statusText = document.getElementById("form-status");
const countdownTimer = document.getElementById("countdown-timer");
const celebrationLayer = document.getElementById("celebration-layer");
const COUNTDOWN_TARGET = new Date(2026, 2, 25, 0, 0, 0);

function hasVotingClosed() {
  return Date.now() >= COUNTDOWN_TARGET.getTime();
}

function redirectToClosedPage() {
  if (window.location.pathname.endsWith(`/${CLOSED_PAGE_URL}`) || window.location.pathname.endsWith(CLOSED_PAGE_URL)) {
    return;
  }

  window.location.replace(CLOSED_PAGE_URL);
}

function generateDeviceId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getDeviceId() {
  const existingDeviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const newDeviceId = generateDeviceId();
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, newDeviceId);
  return newDeviceId;
}

function getStoredVoteCount() {
  return Number(window.localStorage.getItem(DEVICE_VOTE_COUNT_STORAGE_KEY) || 0);
}

function setStoredVoteCount(count) {
  window.localStorage.setItem(DEVICE_VOTE_COUNT_STORAGE_KEY, String(count));
}

function updateVoteAvailability() {
  if (hasVotingClosed()) {
    redirectToClosedPage();
    return;
  }

  const remainingVotes = Math.max(0, MAX_VOTES_PER_DEVICE - getStoredVoteCount());

  submitButton.disabled = remainingVotes <= 0;

  if (remainingVotes <= 0) {
    statusText.dataset.state = "error";
    statusText.textContent = "This browser has reached the maximum votes.";
    submitButton.textContent = "Vote Limit Reached";
    return;
  }

  if (!submitButton.disabled || submitButton.textContent === "Vote Limit Reached") {
    submitButton.textContent = "Submit My Vote";
  }
}

function formatCountdown(totalMilliseconds) {
  const totalSeconds = Math.max(0, Math.floor(totalMilliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedTime = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");

  return days > 0 ? `${days}d ${paddedTime}` : paddedTime;
}

function startCountdown() {
  if (!countdownTimer) {
    return;
  }

  const updateCountdown = () => {
    const timeRemaining = COUNTDOWN_TARGET.getTime() - Date.now();

    if (timeRemaining <= 0) {
      countdownTimer.textContent = "00:00:00";
      redirectToClosedPage();
      return false;
    }

    countdownTimer.textContent = formatCountdown(timeRemaining);
    return true;
  };

  if (!updateCountdown()) {
    return;
  }

  const countdownInterval = window.setInterval(() => {
    if (!updateCountdown()) {
      window.clearInterval(countdownInterval);
    }
  }, 1000);
}

function launchCelebration() {
  if (!celebrationLayer) {
    return;
  }

  const colors = ["#d76c3d", "#f7cf9f", "#b8ddcc", "#c4d5ff", "#ffd166", "#ef476f", "#06d6a0"];

  for (let i = 0; i < 54; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.width = `${0.45 + Math.random() * 0.5}rem`;
    piece.style.height = `${0.7 + Math.random() * 0.9}rem`;
    piece.style.animationDelay = `${Math.random() * 150}ms`;
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 18}rem`);
    piece.style.setProperty("--spin", `${(Math.random() - 0.5) * 1080}deg`);
    celebrationLayer.appendChild(piece);

    window.setTimeout(() => {
      piece.remove();
    }, 1700);
  }
}

function setSelectedOption(choice) {
  optionCards.forEach((card) => {
    const input = card.querySelector('input[name="tourOption"]');
    const isSelected = Boolean(choice) && input.value === choice;

    input.checked = isSelected;
    card.classList.toggle("selected", isSelected);
  });

  selectedChoice.textContent = choice || NO_SELECTION_LABEL;
  choiceInput.value = choice || "";
}

optionCards.forEach((card) => {
  card.addEventListener("click", () => {
    setSelectedOption(card.dataset.choice);
  });
});

if (hasVotingClosed()) {
  redirectToClosedPage();
}

startCountdown();
updateVoteAvailability();

voteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  statusText.dataset.state = "";
  statusText.textContent = "";

  if (hasVotingClosed()) {
    updateVoteAvailability();
    return;
  }

  if (getStoredVoteCount() >= MAX_VOTES_PER_DEVICE) {
    updateVoteAvailability();
    return;
  }

  const payload = {
    browserId: getDeviceId(),
    choice: choiceInput.value,
    note: voteForm.note.value.trim(),
    submittedAt: new Date().toISOString(),
  };

  if (!payload.choice) {
    statusText.dataset.state = "error";
    statusText.textContent = "Please select a tour option before submitting.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const formData = new URLSearchParams(payload);

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const rawResponse = await response.text();
    let result;

    try {
      result = JSON.parse(rawResponse);
    } catch (parseError) {
      throw new Error(rawResponse || "Unexpected response from server");
    }

    if (!result.success) {
      throw new Error(result.error || "Submission was not saved");
    }

    const updatedCount =
      typeof result.deviceVoteCount === "number"
        ? result.deviceVoteCount
        : getStoredVoteCount() + 1;

    setStoredVoteCount(updatedCount);
    voteForm.reset();
    setSelectedOption(DEFAULT_CHOICE);
    launchCelebration();
    statusText.dataset.state = "success";
    statusText.textContent = "Your vote was submitted.";
  } catch (error) {
    statusText.dataset.state = "error";
    statusText.textContent = error.message || "Unable to submit your vote right now.";
  } finally {
    updateVoteAvailability();
  }
});
