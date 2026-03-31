const instructionList = document.getElementById("instruction-list");

function toggleInstructionCard(button) {
  const card = button.closest(".instruction-card");

  if (!card) {
    return;
  }

  const shouldOpen = !card.classList.contains("is-open");

  instructionList?.querySelectorAll(".instruction-card.is-open").forEach((openCard) => {
    if (openCard !== card) {
      openCard.classList.remove("is-open");
      openCard
        .querySelector(".instruction-toggle")
        ?.setAttribute("aria-expanded", "false");
    }
  });

  card.classList.toggle("is-open", shouldOpen);
  button.setAttribute("aria-expanded", String(shouldOpen));
}

if (instructionList) {
  instructionList.addEventListener("click", (event) => {
    const button = event.target.closest(".instruction-toggle");

    if (!button) {
      return;
    }

    toggleInstructionCard(button);
  });
}
