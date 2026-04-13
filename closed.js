const page = document.querySelector(".single-page");
const adultCountElement = document.getElementById("adult-count");
const studentCountElement = document.getElementById("student-count");
const totalCountElement = document.getElementById("total-count");
const statusTextElement = document.getElementById("status-text");
const adminAccessButton = document.getElementById("admin-access");
const authModal = document.getElementById("auth-modal");
const authCloseButton = document.getElementById("auth-close");
const authForm = document.getElementById("auth-form");
const authIdInput = document.getElementById("auth-id");
const authPasswordInput = document.getElementById("auth-password");
const authErrorElement = document.getElementById("auth-error");
const datePollForm = document.getElementById("date-poll-form");
const pollStatusElement = document.getElementById("poll-status");
const pollSubmitButton = document.getElementById("poll-submit");
const pollSubmitLabel = pollSubmitButton?.querySelector(".poll-submit__label");
const ADMIN_ID = "NOEL";
const ADMIN_PASSWORD = "BETH2026";
const DATES_URL =
  "https://script.google.com/macros/s/AKfycbzXeEA2TxprwUiwWkdZzp-yGDxdsjvZK9bJbbccw5av50gptw46aQjM-gfcOwOYM43l/exec";

/**
 * Sends poll data to Apps Script using no-cors mode.
 * @param {{sheetName: string, timeStamp: string, selectedDate: string, deviceID: string}} payload
 * @returns {Promise<void>}
 */
async function submitDatePreference(payload) {
  const requestBody = new URLSearchParams(payload).toString();
  
  await fetch(DATES_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: requestBody,
    
    
  });
  
}

function updateCounts(adults, students) {
  if (adultCountElement) {
    adultCountElement.textContent = String(adults);
  }

  if (studentCountElement) {
    studentCountElement.textContent = String(students);
  }

  if (totalCountElement) {
    totalCountElement.textContent = String(adults + students);
  }
}

function loadCounts() {
  if (!page) {
    return;
  }

  const adults = Number.parseInt(page.dataset.adults || "0", 10);
  const students = Number.parseInt(page.dataset.students || "0", 10);
  const safeAdults = Number.isNaN(adults) ? 0 : adults;
  const safeStudents = Number.isNaN(students) ? 0 : students;

  updateCounts(0, 0);

  window.setTimeout(() => {
    updateCounts(safeAdults, safeStudents);

    if (statusTextElement) {
      statusTextElement.textContent = `Total number of registrations:`;
    }
  }, 850);
}

function setAuthError(message) {
  if (authErrorElement) {
    authErrorElement.textContent = message;
  }
}

function setPollStatus(message, tone = "") {
  if (!pollStatusElement) {
    return;
  }

  pollStatusElement.textContent = message;
  pollStatusElement.classList.remove("is-success", "is-error");

  if (tone) {
    pollStatusElement.classList.add(tone);
  }
}

function getDeviceId() {
  const storageKey = "bethany-tour-device-id";

  try {
    let deviceId = window.localStorage.getItem(storageKey);
    if (!deviceId) {
      deviceId =
        window.crypto && typeof window.crypto.randomUUID === "function"
          ? window.crypto.randomUUID()
          : `device-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
      window.localStorage.setItem(storageKey, deviceId);
    }
    return deviceId;
  } catch (error) {
    return `device-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }
}

function openAuthModal() {
  if (!authModal) {
    return;
  }

  authModal.hidden = false;
  document.body.style.overflow = "hidden";
  setAuthError("");

  window.setTimeout(() => {
    authIdInput?.focus();
  }, 20);
}

function closeAuthModal() {
  if (!authModal) {
    return;
  }

  authModal.hidden = true;
  document.body.style.overflow = "";
  authForm?.reset();
  setAuthError("");
}

loadCounts();

if (adminAccessButton) {
  adminAccessButton.addEventListener("click", openAuthModal);
}

if (authCloseButton) {
  authCloseButton.addEventListener("click", closeAuthModal);
}

if (authModal) {
  authModal.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.closeAuth === "true") {
      closeAuthModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && authModal && !authModal.hidden) {
    closeAuthModal();
  }
});

if (authForm) {
  authForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const enteredId = authIdInput?.value.trim() || "";
    const enteredPassword = authPasswordInput?.value || "";

    if (enteredId === ADMIN_ID && enteredPassword === ADMIN_PASSWORD) {
      window.location.href = "registrants/registrants.html";
      return;
    }

    setAuthError("Incorrect ID or password.");
  });
}

if (datePollForm) {
  datePollForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const selectedInput = datePollForm.querySelector(
      'input[name="selectedDate"]:checked',
    );

    if (!(selectedInput instanceof HTMLInputElement)) {
      setPollStatus("Please choose a date option first.", "is-error");
      return;
    }

    const payload = {
      sheetName: "Date",
      timeStamp: new Date().toISOString(),
      selectedDate: selectedInput.value,
      deviceID: getDeviceId(),
    };

    if (pollSubmitButton instanceof HTMLButtonElement) {
      pollSubmitButton.classList.add("is-loading");
      pollSubmitButton.disabled = true;
      if (pollSubmitLabel) {
        pollSubmitLabel.textContent = "Submitting...";
      }
    }
    setPollStatus("Submitting your preference...");

    try {
      await submitDatePreference(payload);
      datePollForm.reset();
      setPollStatus("Thank you. Your date preference was recorded.", "is-success");
    } catch (error) {
      setPollStatus(
        error instanceof Error
          ? error.message
          : "Could not save the date preference right now. Please check the Google Apps Script deployment.",
        "is-error",
      );
    } finally {
      if (pollSubmitButton instanceof HTMLButtonElement) {
        pollSubmitButton.classList.remove("is-loading");
        pollSubmitButton.disabled = false;
        if (pollSubmitLabel) {
          pollSubmitLabel.textContent = "Submit Date Preference";
        }
      }
    }
  });
}