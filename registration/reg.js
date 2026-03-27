const scriptURL =
  "https://script.google.com/macros/s/AKfycbzXeEA2TxprwUiwWkdZzp-yGDxdsjvZK9bJbbccw5av50gptw46aQjM-gfcOwOYM43l/exec";

const ensurePopup = () => {
  let popup = document.querySelector(".confirmation-popup");

  if (popup) {
    return popup;
  }

  const style = document.createElement("style");
  style.textContent = `
    .confirmation-popup {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(13, 35, 66, 0.42);
      backdrop-filter: blur(6px);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.2s ease, visibility 0.2s ease;
    }

    .confirmation-popup.is-visible {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .confirmation-popup__card {
      width: min(100%, 380px);
      padding: 24px;
      border-radius: 24px;
      background: linear-gradient(180deg, rgba(255, 252, 247, 0.98), rgba(255, 249, 241, 0.96));
      box-shadow: 0 24px 60px rgba(14, 27, 48, 0.24);
      color: #17365b;
      text-align: center;
      transform: translateY(12px);
      transition: transform 0.2s ease;
    }

    .confirmation-popup.is-visible .confirmation-popup__card {
      transform: translateY(0);
    }

    .confirmation-popup__badge {
      display: inline-flex;
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #143762;
      background: rgba(20, 55, 98, 0.08);
    }

    .confirmation-popup__title {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 800;
    }

    .confirmation-popup__message {
      margin: 12px 0 0;
      color: #5c6d84;
      line-height: 1.6;
    }

    .confirmation-popup__button {
      margin-top: 18px;
      border: none;
      border-radius: 999px;
      padding: 11px 18px;
      color: #fff;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      background: linear-gradient(135deg, #2f7de1, #2a9ca0);
      box-shadow: 0 12px 22px rgba(47, 125, 225, 0.18);
    }

    .confirmation-popup__button:hover {
      filter: brightness(0.96);
    }
  `;

  popup = document.createElement("div");
  popup.className = "confirmation-popup";
  popup.innerHTML = `
    <div class="confirmation-popup__card" role="dialog" aria-modal="true" aria-live="polite">
      <div class="confirmation-popup__badge">Bethany Tour</div>
      <h2 class="confirmation-popup__title"></h2>
      <p class="confirmation-popup__message"></p>
      <button type="button" class="confirmation-popup__button">Close</button>
    </div>
  `;

  document.head.appendChild(style);
  document.body.appendChild(popup);

  popup.addEventListener("click", (event) => {
    if (event.target === popup) {
      popup.classList.remove("is-visible");
    }
  });

  popup
    .querySelector(".confirmation-popup__button")
    .addEventListener("click", () => {
      popup.classList.remove("is-visible");
    });

  return popup;
};

const showPopup = (title, message) => {
  const popup = ensurePopup();
  popup.querySelector(".confirmation-popup__title").textContent = title;
  popup.querySelector(".confirmation-popup__message").textContent = message;
  popup.classList.add("is-visible");
};

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const submitButton = form.querySelector(".submit-button");
  const defaultSubmitLabel = submitButton.textContent.trim();

  const setSubmitLoading = (isLoading) => {
    submitButton.disabled = isLoading;
    submitButton.classList.toggle("is-loading", isLoading);
    submitButton.textContent = isLoading
      ? "Submitting registration..."
      : defaultSubmitLabel;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect adults
    const adultInputs = document.querySelectorAll('input[name="adult[]"]');
    const adults = Array.from(adultInputs)
      .map((input) => input.value.trim())
      .filter((value) => value !== "");

    // Collect students
    const studentInputs = document.querySelectorAll('input[name="student[]"]');
    const students = Array.from(studentInputs)
      .map((input) => input.value.trim())
      .filter((value) => value !== "");

    // Date preference
    const datePreference = document
      .querySelector('input[name="date_range"]')
      .value.trim();

    // Validation
    if (adults.length === 0 && students.length === 0) {
      showPopup(
        "Add one participant",
        "Please enter at least one adult or student before submitting the form.",
      );
      return;
    }

    // Generate unique refId
    const refId = Date.now() + "-" + Math.random().toString(36).substring(2, 8);

    // Payload
    const payload = {
      adults,
      students,
      datePreference,
      refId,
    };

    try {
      setSubmitLoading(true);

      await fetch(scriptURL, {
        method: "POST",
        mode: "no-cors", // required for Google Apps Script
        body: JSON.stringify(payload),
      });

      showPopup(
        "Registration sent",
        "Your registration has been submitted successfully. Thank you for registering!",
      );
      form.reset();
    } catch (error) {
      showPopup(
        "Something went wrong",
        "We could not submit your registration right now. Please try again in a moment.",
      );
      console.error(error);
    } finally {
      setSubmitLoading(false);
    }
  });
});

const createParticipantInput = (name, placeholder) => {
  const input = document.createElement("input");
  input.type = "text";
  input.name = name;
  input.placeholder = placeholder;
  return input;
};

document.querySelectorAll(".add-button").forEach((button) => {
  button.addEventListener("click", () => {
    const container = document.getElementById(button.dataset.target);

    if (!container) {
      return;
    }

    const input = createParticipantInput(
      button.dataset.name,
      button.dataset.placeholder,
    );

    container.appendChild(input);
    input.focus();
  });
});
