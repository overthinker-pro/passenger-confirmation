const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzXeEA2TxprwUiwWkdZzp-yGDxdsjvZK9bJbbccw5av50gptw46aQjM-gfcOwOYM43l/exec";
const REFRESH_INTERVAL_MS = 7000;

const ROUTE_DETAILS = {
  "The Highlands Pilgrimage": {
    optionLabel: "Option 01",
    theme: "sunrise",
    description:
      "A spiritual trail through dayaras and the seminary, ending with a Vagamon hill adventure.",
    overview:
      "This route blends worship, church heritage, and a scenic hill experience into one balanced day trip.",
    routeStops: [
      "Mar Baselios Dayara, Njaliakuzhy",
      "Pampady Dayara",
      "Kottayam Pazhaya Seminary",
      "Vagamon Adventure Park",
    ],
    travelTime: "~6 hours",
    distance: "218 km",
    highlights: [
      "Begins with a deeply spiritual church-and-dayara sequence.",
      "Includes a historic seminary stop for heritage value.",
      "Ends with an energetic outdoor finish at Vagamon Adventure Park.",
    ],
  },
  "Coastal Heritage Trail": {
    optionLabel: "Option 02",
    theme: "green",
    description:
      "Tracing the footsteps of early Christianity, this journey explores sacred sites rich in faith, history, and tradition.",
    overview:
      "This route leans strongly into church history and heritage before finishing with a coastal break at Kovalam.",
    routeStops: [
      "Thiruvithamcode Arappally",
      "Padmanabhapuram Palace",
      "Kovalam Beach",
    ],
    travelTime: "~8 hours",
    distance: "369 km",
    highlights: [
      "Features one of the most historic spiritual destinations in the shortlist.",
      "Pairs Christian heritage with a palace visit for broader cultural depth.",
      "Closes with a relaxing seaside destination at Kovalam Beach.",
    ],
  },
  "Sacred Hills & Forest Path": {
    optionLabel: "Option 03",
    theme: "sky",
    description:
      "Experience monastic heritage and the calm beauty of Kerala's forest landscapes.",
    overview:
      "This route offers a quieter rhythm, mixing sacred visits with a nature-focused finish in Thenmala.",
    routeStops: [
      "Kallada Valiapally",
      "Pathanapuram Mount Tabor Dayara",
      "Thenmala Ecotourism",
    ],
    travelTime: "~5 hr",
    distance: "203 km",
    highlights: [
      "The shortest route among the options, making it easier on travel fatigue.",
      "Connects worship spaces with a peaceful forest tourism destination.",
      "Feels calm, reflective, and nature-driven from beginning to end.",
    ],
  },
  "Kochi Exploration": {
    optionLabel: "Option 04",
    theme: "coral",
    description:
      "A meaningful journey through Orthodox heritage and church history, followed by a relaxing and enjoyable time in Kochi.",
    overview:
      "This route combines major church stops with city exploration, sanctuary time, and a beach closeout.",
    routeStops: [
      "Piravom Valiyapally",
      "Kadamattom Pally",
      "Aluva Thrikkunnath Seminary",
      "Mangalavanam Bird Sanctuary",
      "Cherai Beach",
    ],
    travelTime: "~6 hr 15 min",
    distance: "258 km",
    highlights: [
      "Covers multiple landmark church and seminary destinations in one plan.",
      "Adds variety with both city nature and beach experiences.",
      "Feels like the broadest mix of heritage, learning, and leisure.",
    ],
  },
};

const winnerCard = document.getElementById("winner-card");
const winnerDetailPanel = document.getElementById("winner-detail-panel");
const winnerSummary = document.getElementById("winner-summary");
const winnerTotalVotes = document.getElementById("winner-total-votes");
const winnerPercent = document.getElementById("winner-percent");
const winnerLastUpdated = document.getElementById("winner-last-updated");
const winnerOptionLabel = document.getElementById("winner-option-label");
const winnerBadge = document.getElementById("winner-badge");
const winnerRouteTitle = document.getElementById("winner-route-title");
const winnerVotesPill = document.getElementById("winner-votes-pill");
const winnerDistancePill = document.getElementById("winner-distance-pill");
const winnerTimePill = document.getElementById("winner-time-pill");
const winnerRouteFlow = document.getElementById("winner-route-flow");
const winnerDescription = document.getElementById("winner-description");
const winnerProgressFill = document.getElementById("winner-progress-fill");
const winnerProgressCopy = document.getElementById("winner-progress-copy");
const winnerStatus = document.getElementById("winner-status");

const detailRouteTitle = document.getElementById("detail-route-title");
const detailOverview = document.getElementById("detail-overview");
const detailHighlights = document.getElementById("detail-highlights");
const detailStops = document.getElementById("detail-stops");
const detailTime = document.getElementById("detail-time");
const detailDistance = document.getElementById("detail-distance");
const detailVotes = document.getElementById("detail-votes");
const detailShare = document.getElementById("detail-share");
const detailFinalNote = document.getElementById("detail-final-note");

let winnerCardOpen = false;

function formatTimestamp(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getLeaderData(summary) {
  let leaderCount = 0;
  const leaders = [];

  Object.entries(summary).forEach(([choice, rawCount]) => {
    const count = Number(rawCount || 0);

    if (count > leaderCount) {
      leaderCount = count;
      leaders.length = 0;
      leaders.push(choice);
    } else if (count > 0 && count === leaderCount) {
      leaders.push(choice);
    }
  });

  return { leaderCount, leaders };
}

function renderRouteFlow(stops) {
  winnerRouteFlow.innerHTML = "";

  stops.forEach((stop, index) => {
    const stopNode = document.createElement("span");
    stopNode.textContent = stop;
    winnerRouteFlow.appendChild(stopNode);

    if (index < stops.length - 1) {
      const arrowNode = document.createElement("span");
      arrowNode.className = "route-arrow";
      arrowNode.setAttribute("aria-hidden", "true");
      winnerRouteFlow.appendChild(arrowNode);
    }
  });
}

function renderList(container, items) {
  container.innerHTML = "";

  items.forEach((item) => {
    const itemNode = document.createElement("li");
    itemNode.textContent = item;
    container.appendChild(itemNode);
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

function updateWinnerView(routeName, count, percent, total, isTie) {
  const routeDetails = ROUTE_DETAILS[routeName];

  if (!routeDetails) {
    return;
  }

  winnerCard.dataset.theme = routeDetails.theme;
  winnerOptionLabel.textContent = isTie ? "Top Route" : `${routeDetails.optionLabel} Winner`;
  winnerRouteTitle.textContent = routeName;
  winnerVotesPill.textContent = `${count} vote${count === 1 ? "" : "s"}`;
  winnerDistancePill.textContent = `Approx. distance: ${routeDetails.distance}`;
  winnerTimePill.textContent = `Travel time: ${routeDetails.travelTime}`;
  winnerDescription.textContent = routeDetails.description;
  winnerPercent.textContent = `${percent}%`;
  winnerProgressFill.style.width = `${percent}%`;
  winnerProgressCopy.textContent =
    total > 0
      ? `${routeName} secured ${percent}% of the final vote.`
      : "No final percentage is available yet.";

  renderRouteFlow(routeDetails.routeStops);

  detailRouteTitle.textContent = routeName;
  detailOverview.textContent = routeDetails.overview;
  detailTime.textContent = `Travel time: ${routeDetails.travelTime}`;
  detailDistance.textContent = `Approx. distance: ${routeDetails.distance}`;
  detailVotes.textContent = `Final votes: ${count}`;
  detailShare.textContent = `Vote share: ${percent}%`;
  detailFinalNote.textContent = isTie
    ? `${routeName} is one of the tied top routes. This card is showing the first top-ranked route in the final standings.`
    : `${routeName} finished as the clear winning route for Bethany Tour 2026.`;

  renderList(detailHighlights, routeDetails.highlights);
  renderList(
    detailStops,
    routeDetails.routeStops.map((stop, index) => `Stop ${index + 1}: ${stop}`)
  );
}

async function fetchClosedResults() {
  if (
    !winnerCard ||
    !winnerDetailPanel ||
    !winnerSummary ||
    !winnerTotalVotes ||
    !winnerPercent ||
    !winnerLastUpdated ||
    !winnerStatus
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
    const { leaderCount, leaders } = getLeaderData(summary);

    winnerTotalVotes.textContent = String(total);
    winnerLastUpdated.textContent = formatTimestamp(new Date());

    if (!leaderCount || !leaders.length) {
      winnerSummary.textContent =
        "The poll is closed, but there are no recorded votes to display yet.";
      winnerStatus.dataset.state = "success";
      winnerStatus.textContent = "Final results loaded successfully.";
      return;
    }

    const winningRoute = leaders[0];
    const winningVotes = Number(summary[winningRoute] || 0);
    const winningPercent = total > 0 ? Math.round((winningVotes / total) * 100) : 0;
    const isTie = leaders.length > 1;

    winnerSummary.textContent = isTie
      ? `The final result ended in a tie. This featured card shows ${winningRoute}, one of the top-ranked routes. Tap it to view the full plan.`
      : `${winningRoute} won the final poll. Tap the card below to open the complete route breakdown from the first stop to the last.`;

    updateWinnerView(winningRoute, winningVotes, winningPercent, total, isTie);
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
