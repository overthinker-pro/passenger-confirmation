const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzXeEA2TxprwUiwWkdZzp-yGDxdsjvZK9bJbbccw5av50gptw46aQjM-gfcOwOYM43l/exec";

const closedMessageTitle = document.getElementById("closed-message-title");
const closedMessageCopy = document.getElementById("closed-message-copy");
const speechLineTotal = document.getElementById("speech-line-total");
const speechLineLeading = document.getElementById("speech-line-leading");
const speechLineSummary = document.getElementById("speech-line-summary");
const speechLines = [speechLineTotal, speechLineLeading, speechLineSummary].filter(Boolean);
const DIALOGUE_DURATION_MS = 3000;

let speechRotationTimeoutId = null;

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

function revealSpeechLines() {
  if (!speechLines.length) {
    return;
  }

  if (speechRotationTimeoutId) {
    window.clearTimeout(speechRotationTimeoutId);
  }

  speechLines.forEach((line) => {
    line.classList.remove("is-visible");
  });

  let activeIndex = 0;

  const showLine = () => {
    speechLines.forEach((line, index) => {
      line.classList.toggle("is-visible", index === activeIndex);
    });

    if (activeIndex >= speechLines.length - 1) {
      return;
    }

    activeIndex += 1;
    speechRotationTimeoutId = window.setTimeout(showLine, DIALOGUE_DURATION_MS);
  };

  showLine();
}

function updateClosedMessage(total, leaders, leaderSummary) {
  if (!total) {
    closedMessageTitle.textContent = "The poll has officially closed.";
    closedMessageCopy.textContent =
      "Thank you for being part of Bethany Tour 2026. I do not have any final votes to announce yet.";
    speechLineTotal.textContent = "No final votes have been recorded yet.";
    speechLineLeading.textContent =
      "There is no top response for me to announce right now.";
    speechLineSummary.textContent =
      "The poll is closed, and I will share the summary here once the final data is available.";
    revealSpeechLines();
    return;
  }

  if (leaders.length > 1) {
    closedMessageTitle.textContent = "The final response ended in a tie.";
    closedMessageCopy.textContent =
      `The group submitted ${total} anonymous votes, and ${leaders.length} options finished level at the top.`;
    speechLineTotal.textContent = `We received ${total} anonymous votes in total.`;
    speechLineLeading.textContent =
      `The top response is a tie between ${leaders.length} options.`;
    speechLineSummary.textContent =
      `My final snapshot says: ${leaderSummary}. Thank you for taking part in the poll.`;
    revealSpeechLines();
    return;
  }

  closedMessageTitle.textContent = `${leaders[0]} finished on top.`;
  closedMessageCopy.textContent =
    `Thank you for the ${total} anonymous votes shared by the group. Here is the final spoken summary from the poll.`;
  speechLineTotal.textContent = `We received ${total} anonymous votes in total.`;
  speechLineLeading.textContent = `The top response is ${leaders[0]}.`;
  speechLineSummary.textContent =
    `My final snapshot says: ${leaderSummary}. Thank you for making your voice heard.`;
  revealSpeechLines();
}

async function fetchClosedResults() {
  if (
    !closedMessageTitle ||
    !closedMessageCopy ||
    !speechLineTotal ||
    !speechLineLeading ||
    !speechLineSummary
  ) {
    return;
  }

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
    const leaderSummary =
      leaderCount > 0
        ? leaders.length > 1
          ? `${leaders.length} options tied`
          : leaders[0]
        : "Awaiting results";

    updateClosedMessage(total, leaders, leaderSummary);
  } catch (error) {
    closedMessageTitle.textContent = "I could not read the final results yet.";
    closedMessageCopy.textContent =
      error.message || "Unable to load final results right now.";
    speechLineTotal.textContent =
      "The final result service is not responding right now.";
    speechLineLeading.textContent =
      "I cannot announce the top response until the data is available again.";
    speechLineSummary.textContent =
      "Please try again later to hear the full final summary.";
    revealSpeechLines();
  }
}

fetchClosedResults();
