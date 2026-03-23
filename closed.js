const routeStops = [
  {
    type: "Departure Window",
    title: "Bethany Aramana",
    teaser: "The day begins with a short departure window before the breakfast drive.",
    arrival: "5:30 AM",
    stay: "15 min window",
    departure: "5:45 AM",
    detail: "Departure prep before the first drive of the day.",
    connector: "Next drive: 2 hr 15 min",
  },
  {
    type: "Meal Break",
    title: "Breakfast Stop",
    teaser: "A refresh stop before the longer drive to Arappally.",
    arrival: "~7:45 AM",
    stay: "1 hr",
    departure: "8:45 AM",
    detail: "Based on the gap before the next departure.",
    connector: "From Bethany Aramana: 2 hr 15 min",
  },
  {
    type: "Heritage Visit",
    title: "Thiruvithamcode Arappally",
    teaser: "The route's main spiritual and heritage stop.",
    arrival: "~11:30 AM",
    stay: "1 hr 30 min",
    departure: "1:00 PM",
    detail: "Prayer, visit, and group movement.",
    connector: "From breakfast stop: 2 hr 30 min",
  },
  {
    type: "Meal Break",
    title: "Lunch Stop",
    teaser: "A short lunch pause before the palace visit.",
    arrival: "~1:10 PM",
    stay: "50 min",
    departure: "2:00 PM",
    detail: "A quick meal stop to keep the afternoon on track.",
    connector: "From Arappally: 10 min",
  },
  {
    type: "Cultural Visit",
    title: "Padmanabhapuram Palace",
    teaser: "A longer heritage and architecture segment in the afternoon.",
    arrival: "~2:10 PM",
    stay: "1 hr 35 min",
    departure: "3:45 PM",
    detail: "Longer afternoon visit block.",
    connector: "From lunch stop: 10 min",
  },
  {
    type: "Evening Leisure",
    title: "Kovalam Beach",
    teaser: "A relaxed coastal stop before dinner.",
    arrival: "~5:30 PM",
    stay: "1 hr",
    departure: "6:30 PM",
    detail: "Evening beach break before dinner.",
    connector: "From palace: 1 hr 30 min",
  },
  {
    type: "Dinner Break",
    title: "Dinner Stop",
    teaser: "The final halt before returning to Bethany Aramana.",
    arrival: "~7:20 PM",
    stay: "1 hr 10 min",
    departure: "8:30 PM",
    detail: "Final meal break before the long return drive.",
    connector: "From Kovalam Beach: 50 min",
  },
  {
    type: "Journey Complete",
    title: "Return to Bethany Aramana",
    teaser: "The route closes with the late-night return.",
    arrival: "~11:45 PM",
    stay: "End of route",
    departure: "Trip complete",
    detail: "The journey concludes back at the starting point.",
    connector: "From dinner stop: 3 hr 15 min",
  },
];

const routeStopsContainer = document.getElementById("route-stops");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileRouteAccordion = window.matchMedia("(max-width: 759px)");

function updatePinButtonText(button, isOpen) {
  const pinText = button.querySelector(".pin-text");
  if (pinText) {
    pinText.textContent = isOpen ? "Close schedule" : "Open schedule";
  }
}

function closeRouteCard(card) {
  const button = card.querySelector(".pin-button");
  const detailPanel = card.querySelector(".detail-panel");

  if (!button || !detailPanel || !card.classList.contains("is-open")) {
    return;
  }

  card.classList.remove("is-open");
  button.setAttribute("aria-expanded", "false");
  updatePinButtonText(button, false);
  setPanelOpenState(detailPanel, false);
}

function setPanelOpenState(detailPanel, shouldOpen) {
  if (prefersReducedMotion.matches) {
    detailPanel.hidden = !shouldOpen;
    detailPanel.classList.toggle("is-collapsed", !shouldOpen);
    detailPanel.style.height = shouldOpen ? "auto" : "";
    return;
  }

  detailPanel.style.transition = "none";

  if (shouldOpen) {
    detailPanel.hidden = false;
    detailPanel.classList.remove("is-collapsed");
    detailPanel.style.height = "0px";

    requestAnimationFrame(() => {
      const fullHeight = `${detailPanel.scrollHeight}px`;
      detailPanel.style.transition = "";
      detailPanel.style.height = fullHeight;
    });

    const handleOpenEnd = (event) => {
      if (event.propertyName !== "height") {
        return;
      }

      detailPanel.style.height = "auto";
      detailPanel.removeEventListener("transitionend", handleOpenEnd);
    };

    detailPanel.addEventListener("transitionend", handleOpenEnd);
    return;
  }

  detailPanel.style.height = `${detailPanel.scrollHeight}px`;
  detailPanel.classList.add("is-collapsed");

  requestAnimationFrame(() => {
    detailPanel.style.transition = "";
    detailPanel.style.height = "0px";
  });

  const handleCloseEnd = (event) => {
    if (event.propertyName !== "height") {
      return;
    }

    detailPanel.hidden = true;
    detailPanel.style.height = "";
    detailPanel.removeEventListener("transitionend", handleCloseEnd);
  };

  detailPanel.addEventListener("transitionend", handleCloseEnd);
}

function createRouteStop(stop, index) {
  const row = document.createElement("article");
  row.className = `stop-row ${index % 2 === 0 ? "stop-left" : "stop-right"}`;

  const card = document.createElement("div");
  card.className = "stop-card";
  card.innerHTML = `
    <p class="stop-type">${stop.type}</p>
    <h3>${stop.title}</h3>
    <p class="stop-teaser">${stop.teaser}</p>
  `;

  const button = document.createElement("button");
  button.className = "pin-button";
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", `detail-panel-${index}`);
  button.innerHTML = `
    <span class="pin-icon" aria-hidden="true"></span>
    <span class="pin-text">Open schedule</span>
  `;

  const detailPanel = document.createElement("div");
  detailPanel.className = "detail-panel";
  detailPanel.id = `detail-panel-${index}`;
  detailPanel.hidden = true;
  detailPanel.classList.add("is-collapsed");
  detailPanel.innerHTML = `
    <div class="detail-grid">
      <article>
        <span>Approx. Arrival</span>
        <strong>${stop.arrival}</strong>
        <p>${stop.connector}</p>
      </article>
      <article>
        <span>Time To Be Spent</span>
        <strong>${stop.stay}</strong>
        <p>${stop.detail}</p>
      </article>
      <article>
        <span>Approx. Departure</span>
        <strong>${stop.departure}</strong>
        <p>${stop.teaser}</p>
      </article>
    </div>
  `;

  button.addEventListener("click", () => {
    const shouldOpen = !card.classList.contains("is-open");

    if (shouldOpen && mobileRouteAccordion.matches && routeStopsContainer) {
      routeStopsContainer.querySelectorAll(".stop-card.is-open").forEach((openCard) => {
        if (openCard !== card) {
          closeRouteCard(openCard);
        }
      });
    }

    const isOpen = card.classList.toggle("is-open", shouldOpen);
    button.setAttribute("aria-expanded", String(isOpen));
    setPanelOpenState(detailPanel, isOpen);
    updatePinButtonText(button, isOpen);
  });

  card.append(button, detailPanel);
  row.appendChild(card);
  return row;
}

function renderRouteStops() {
  if (!routeStopsContainer) {
    return;
  }

  routeStopsContainer.innerHTML = "";
  routeStops.forEach((stop, index) => {
    routeStopsContainer.appendChild(createRouteStop(stop, index));
  });
}

renderRouteStops();
