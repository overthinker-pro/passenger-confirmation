const fetchForm = document.getElementById("fetch-form");
const fetchButton = document.getElementById("fetch-button");
const fetchStatus = document.getElementById("fetch-status");
const adultList = document.getElementById("adult-list");
const studentList = document.getElementById("student-list");
const adultTotal = document.getElementById("adult-total");
const studentTotal = document.getElementById("student-total");
const dateFetchForm = document.getElementById("date-fetch-form");
const dateFetchButton = document.getElementById("date-fetch-button");
const dateFetchStatus = document.getElementById("date-fetch-status");
const dateList = document.getElementById("date-list");
const dateTotal = document.getElementById("date-total");
const dateWednesdayTotal = document.getElementById("date-wednesday-total");
const dateThursdayTotal = document.getElementById("date-thursday-total");
const dateFridayTotal = document.getElementById("date-friday-total");
const REGISTRANTS_URL =
  "https://script.google.com/macros/s/AKfycbzXeEA2TxprwUiwWkdZzp-yGDxdsjvZK9bJbbccw5av50gptw46aQjM-gfcOwOYM43l/exec";

function setStatus(message, tone = "") {
  if (!fetchStatus) {
    return;
  }

  fetchStatus.textContent = message;
  fetchStatus.classList.remove("is-error", "is-success");

  if (tone) {
    fetchStatus.classList.add(tone);
  }
}

function setLoadingState(isLoading) {
  if (!fetchButton) {
    return;
  }

  fetchButton.classList.toggle("is-loading", isLoading);
  fetchButton.disabled = isLoading;
}

function setDateStatus(message, tone = "") {
  if (!dateFetchStatus) {
    return;
  }

  dateFetchStatus.textContent = message;
  dateFetchStatus.classList.remove("is-error", "is-success");

  if (tone) {
    dateFetchStatus.classList.add(tone);
  }
}

function setDateLoadingState(isLoading) {
  if (!dateFetchButton) {
    return;
  }

  dateFetchButton.classList.toggle("is-loading", isLoading);
  dateFetchButton.disabled = isLoading;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderNameList(listElement, names, emptyMessage) {
  if (!listElement) {
    return;
  }

  if (!names.length) {
    listElement.innerHTML = `<li class="empty-state">${escapeHtml(emptyMessage)}</li>`;
    return;
  }

  listElement.innerHTML = names
    .map(
      (name, index) =>
        `<li><span class="name-list__index">${index + 1}.</span>${escapeHtml(name)}</li>`,
    )
    .join("");
}

function updateSummary(adults, students) {
  if (adultTotal) {
    adultTotal.textContent = String(adults.length);
  }

  if (studentTotal) {
    studentTotal.textContent = String(students.length);
  }
}

function updateDateSummary(rows) {
  const totals = {
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
  };

  rows.forEach((row) => {
    if (!row || typeof row !== "object") {
      return;
    }

    const rawDate = typeof row.selectedDate === "string" ? row.selectedDate.trim() : "";
    if (rawDate === "Wednesday") {
      totals.Wednesday += 1;
    } else if (rawDate === "Thursday") {
      totals.Thursday += 1;
    } else if (rawDate === "Friday") {
      totals.Friday += 1;
    }
  });

  if (dateWednesdayTotal) {
    dateWednesdayTotal.textContent = String(totals.Wednesday);
  }
  if (dateThursdayTotal) {
    dateThursdayTotal.textContent = String(totals.Thursday);
  }
  if (dateFridayTotal) {
    dateFridayTotal.textContent = String(totals.Friday);
  }
  if (dateTotal) {
    dateTotal.textContent = String(rows.length);
  }
}

function normalizeNameEntry(entry) {
  if (typeof entry === "string") {
    return entry.trim();
  }

  if (!entry || typeof entry !== "object") {
    return "";
  }

  const possibleName = [
    entry.name,
    entry.fullName,
    entry.full_name,
    entry.registrant,
    entry.person,
    entry.studentName,
    entry.adultName,
  ].find((value) => typeof value === "string" && value.trim());

  return possibleName ? possibleName.trim() : "";
}

function extractArrayPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const nestedArray = [
    payload.rows,
    payload.data,
    payload.registrants,
    payload.entries,
    payload.items,
  ].find((value) => Array.isArray(value));

  return nestedArray || [];
}

function splitStructuredRows(rows) {
  const adults = [];
  const students = [];

  rows.forEach((row) => {
    if (!row || typeof row !== "object") {
      return;
    }

    const name = normalizeNameEntry(row);
    const typeValue = [
      row.type,
      row.category,
      row.group,
      row.role,
      row.personType,
      row.person_type,
    ]
      .find((value) => typeof value === "string" && value.trim())
      ?.trim()
      .toLowerCase();

    if (!name || !typeValue) {
      return;
    }

    if (typeValue.includes("adult")) {
      adults.push(name);
      return;
    }

    if (typeValue.includes("student")) {
      students.push(name);
    }
  });

  return { adults, students };
}

function parseRegistrants(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("The member list could not be read right now.");
  }

  const directAdults = Array.isArray(payload.adults)
    ? payload.adults.map(normalizeNameEntry).filter(Boolean)
    : [];
  const directStudents = Array.isArray(payload.students)
    ? payload.students.map(normalizeNameEntry).filter(Boolean)
    : [];

  if (directAdults.length || directStudents.length) {
    return { adults: directAdults, students: directStudents };
  }

  const rows = extractArrayPayload(payload);
  const structured = splitStructuredRows(rows);

  if (structured.adults.length || structured.students.length) {
    return structured;
  }

  throw new Error(
    "The names were received, but they could not be arranged into adult and student lists.",
  );
}

function parseDateRows(payload) {
  const rows = extractArrayPayload(payload);

  if (!rows.length) {
    throw new Error("No date preferences were returned.");
  }

  const normalizedRows = rows
    .map((row) => {
      if (!row || typeof row !== "object") {
        return null;
      }

      const selectedDate =
        typeof row.selectedDate === "string"
          ? row.selectedDate.trim()
          : typeof row.date === "string"
            ? row.date.trim()
            : "";
      const timeStamp =
        typeof row.timeStamp === "string"
          ? row.timeStamp.trim()
          : typeof row.timestamp === "string"
            ? row.timestamp.trim()
            : "";
      const deviceID =
        typeof row.deviceID === "string"
          ? row.deviceID.trim()
          : typeof row.deviceId === "string"
            ? row.deviceId.trim()
            : "";

      if (!selectedDate) {
        return null;
      }

      return { selectedDate, timeStamp, deviceID };
    })
    .filter(Boolean);

  if (!normalizedRows.length) {
    throw new Error("The date responses were received, but the selected dates could not be read.");
  }

  return normalizedRows;
}

async function fetchRegistrants(url) {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("The member list could not be loaded right now.");
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const preview = await response.text();

    if (preview.includes("Script function not found: doGet")) {
      throw new Error(
        "The member list is not available right now. Please try again later.",
      );
    }

    throw new Error("The member list is not available in the expected format yet.");
  }

  const payload = await response.json();
  return parseRegistrants(payload);
}

async function fetchDatePreferences(url) {
  const response = await fetch(`${url}?sheetName=Date`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("The date preferences could not be loaded right now.");
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("The date preference list is not available in the expected format yet.");
  }

  const payload = await response.json();
  return parseDateRows(payload);
}

function renderDateList(rows) {
  if (!dateList) {
    return;
  }

  if (!rows.length) {
    dateList.innerHTML = '<li class="empty-state">No date preferences loaded yet.</li>';
    return;
  }

  dateList.innerHTML = rows
    .map((row, index) => {
      const metaParts = [row.selectedDate];
      if (row.timeStamp) {
        metaParts.push(row.timeStamp);
      }
      if (row.deviceID) {
        metaParts.push(row.deviceID);
      }

      return `<li><span class="name-list__index">${index + 1}.</span>${escapeHtml(metaParts.join(" • "))}</li>`;
    })
    .join("");
}

async function handleFetch(event) {
  event.preventDefault();

  setLoadingState(true);
  setStatus("Loading the registered names...");

  try {
    const { adults, students } = await fetchRegistrants(REGISTRANTS_URL);

    renderNameList(adultList, adults, "No adult names were returned.");
    renderNameList(studentList, students, "No student names were returned.");
    updateSummary(adults, students);
    setStatus("The registered names are ready to view.", "is-success");
  } catch (error) {
    renderNameList(adultList, [], "No adult names loaded yet.");
    renderNameList(studentList, [], "No student names loaded yet.");
    updateSummary([], []);
    setStatus(error.message, "is-error");
  } finally {
    setLoadingState(false);
  }
}

async function handleDateFetch(event) {
  event.preventDefault();

  setDateLoadingState(true);
  setDateStatus("Loading the submitted date preferences...");

  try {
    const rows = await fetchDatePreferences(REGISTRANTS_URL);
    renderDateList(rows);
    updateDateSummary(rows);
    setDateStatus("The date preferences are ready to view.", "is-success");
  } catch (error) {
    renderDateList([]);
    updateDateSummary([]);
    setDateStatus(error.message, "is-error");
  } finally {
    setDateLoadingState(false);
  }
}

if (fetchForm) {
  fetchForm.addEventListener("submit", handleFetch);
}

if (dateFetchForm) {
  dateFetchForm.addEventListener("submit", handleDateFetch);
}
