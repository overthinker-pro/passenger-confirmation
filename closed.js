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
const ADMIN_ID = "NOEL";
const ADMIN_PASSWORD = "BETH2026";

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
