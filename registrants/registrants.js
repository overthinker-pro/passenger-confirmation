const fetchForm = document.getElementById("fetch-form");
const fetchButton = document.getElementById("fetch-button");
const fetchStatus = document.getElementById("fetch-status");
const adultList = document.getElementById("adult-list");
const studentList = document.getElementById("student-list");
const adultTotal = document.getElementById("adult-total");
const studentTotal = document.getElementById("student-total");
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

if (fetchForm) {
  fetchForm.addEventListener("submit", handleFetch);
}
