const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzXeEA2TxprwUiwWkdZzp-yGDxdsjvZK9bJbbccw5av50gptw46aQjM-gfcOwOYM43l/exec";
const REFRESH_INTERVAL_MS = 7000;
const WINNING_ROUTE_NAME = "Coastal Heritage Trail";

const winnerCard = document.getElementById("winner-card");
const winnerDetailPanel = document.getElementById("winner-detail-panel");
const winnerSummary = document.getElementById("winner-summary");
const winnerTotalVotes = document.getElementById("winner-total-votes");
const winnerPercent = document.getElementById("winner-percent");
const winnerLastUpdated = document.getElementById("winner-last-updated");
const winnerBadge = document.getElementById("winner-badge");
const winnerVotesPill = document.getElementById("winner-votes-pill");
const winnerProgressFill = document.getElementById("winner-progress-fill");
const winnerProgressCopy = document.getElementById("winner-progress-copy");
const winnerStatus = document.getElementById("winner-status");

const detailVotes = document.getElementById("detail-votes");
const detailShare = document.getElementById("detail-share");

let winnerCardOpen = false;

function formatTimestamp(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function setWinnerDetailVisibility(isOpen) {
  winnerCardOpen = isOpen;
  winnerCard.classList.toggle("is-open", isOpen);
  winnerCard.setAttribute("aria-expanded", String(isOpen));
  winnerBadge.textContent = isOpen ? "Tap to collapse details" : "Tap to open full plan";

  if (isOpen) {
    winnerDetailPanel.hidden = false;
    return;
  }

  winnerDetailPanel.hidden = true;
}

function updateWinnerView(count, percent, total) {
  winnerVotesPill.textContent = `${count} vote${count === 1 ? "" : "s"}`;
  winnerPercent.textContent = `${percent}%`;
  winnerProgressFill.style.width = `${percent}%`;
  winnerProgressCopy.textContent =
    total > 0
      ? `${WINNING_ROUTE_NAME} secured ${percent}% of the final vote.`
      : "No final percentage is available yet.";
  detailVotes.textContent = `Final votes: ${count}`;
  detailShare.textContent = `Vote share: ${percent}%`;
}

async function fetchClosedResults() {
  if (
    !winnerCard ||
    !winnerDetailPanel ||
    !winnerSummary ||
    !winnerTotalVotes ||
    !winnerPercent ||
    !winnerLastUpdated ||
    !winnerStatus ||
    !detailVotes ||
    !detailShare
  ) {
    return;
  }

  winnerStatus.dataset.state = "";
  winnerStatus.textContent = "";

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "GET",
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error("Unable to load final results");
    }

    const rawResponse = await response.text();
    let result;

    try {
      result = JSON.parse(rawResponse);
    } catch (parseError) {
      throw new Error(rawResponse || "Unexpected response from server");
    }

    if (!result.success) {
      throw new Error(result.error || "Unable to load final results");
    }

    const total = Number(result.total || 0);
    const summary = result.summary || {};
    const winningVotes = Number(summary[WINNING_ROUTE_NAME] || 0);

    winnerTotalVotes.textContent = String(total);
    winnerLastUpdated.textContent = formatTimestamp(new Date());

    if (!total) {
      winnerSummary.textContent =
        "The poll is closed, but there are no recorded votes to display yet.";
      winnerStatus.dataset.state = "success";
      winnerStatus.textContent = "Final results loaded successfully.";
      updateWinnerView(0, 0, total);
      return;
    }

    const winningPercent = total > 0 ? Math.round((winningVotes / total) * 100) : 0;
    winnerSummary.textContent =
      "Coastal Heritage Trail won the final poll. Tap the card below to open the complete route breakdown from the first stop to the last.";

    updateWinnerView(winningVotes, winningPercent, total);
    winnerStatus.dataset.state = "success";
    winnerStatus.textContent = "Final results loaded successfully.";
  } catch (error) {
    winnerSummary.textContent =
      "I could not load the final winning route right now.";
    winnerStatus.dataset.state = "error";
    winnerStatus.textContent =
      error.message || "Unable to load final results right now.";
  }
}

winnerCard?.addEventListener("click", () => {
  setWinnerDetailVisibility(!winnerCardOpen);
});

setWinnerDetailVisibility(false);
fetchClosedResults();
window.setInterval(fetchClosedResults, REFRESH_INTERVAL_MS);
