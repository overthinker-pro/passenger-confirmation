const fetchLoader = document.getElementById("fetch-loader");
const fetchStatus = document.getElementById("fetch-status");
const adultList = document.getElementById("adult-list");
const studentList = document.getElementById("student-list");
const adultTotal = document.getElementById("adult-total");
const studentTotal = document.getElementById("student-total");
const REGISTRANTS_URL =
  "https://script.google.com/macros/s/AKfycby-Ce9VosopaqR8WT1fF4w7FL5sNOZGACp0WYETihAfYE3pss4ZAIjv9VIMo8eIuLWU/exec";
const CACHE_KEY = "bethany-tour-registrants-cache";
const FETCH_TIMEOUT_MS = 8000;

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
  if (!fetchLoader) {
    return;
  }

  fetchLoader.hidden = !isLoading;
  fetchLoader.setAttribute("aria-hidden", String(!isLoading));
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

function renderRegistrants(registrants) {
  renderNameList(
    adultList,
    registrants.adults,
    "No adult names were returned.",
  );
  renderNameList(
    studentList,
    registrants.students,
    "No student names were returned.",
  );
  updateSummary(registrants.adults, registrants.students);
}

function readCachedRegistrants() {
  try {
    const cached = window.localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);
    if (
      !parsed ||
      !Array.isArray(parsed.adults) ||
      !Array.isArray(parsed.students)
    ) {
      return null;
    }

    return {
      adults: parsed.adults.map(normalizeNameEntry).filter(Boolean),
      students: parsed.students.map(normalizeNameEntry).filter(Boolean),
    };
  } catch (error) {
    return null;
  }
}

function writeCachedRegistrants(registrants) {
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        adults: registrants.adults,
        students: registrants.students,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    // Storage can be unavailable in private browsing; fetching still works.
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

function collectPossibleNames(values) {
  return values
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());
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

    const rowAdults = collectPossibleNames([
      row.adultName,
      row.adult,
      row.adults,
      row.Adult,
      row.Adults,
    ]);

    const rowStudents = collectPossibleNames([
      row.studentName,
      row.student,
      row.students,
      row.Student,
      row.Students,
    ]);

    if (rowAdults.length || rowStudents.length) {
      adults.push(...rowAdults);
      students.push(...rowStudents);
      return;
    }

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

  const objectAdults = collectPossibleNames([
    payload.adultName,
    payload.adult,
    payload.Adult,
  ]);
  const objectStudents = collectPossibleNames([
    payload.studentName,
    payload.student,
    payload.Student,
  ]);

  if (
    directAdults.length ||
    directStudents.length ||
    objectAdults.length ||
    objectStudents.length
  ) {
    return {
      adults: [...directAdults, ...objectAdults],
      students: [...directStudents, ...objectStudents],
    };
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

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      cache: "reload",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "The member list is taking too long to respond. Please refresh and try again.",
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchRegistrants(url) {
  const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);

  if (!response.ok) {
    throw new Error("The member list could not be loaded right now.");
  }

  const responseText = await response.text();

  if (responseText.includes("Script function not found: doGet")) {
    throw new Error(
      "The member list is not available right now. Please try again later.",
    );
  }

  try {
    return parseRegistrants(JSON.parse(responseText));
  } catch (error) {
    throw new Error(
      "The member list is not available in the expected format yet.",
    );
  }
}

async function fetchRegistrantsWithRetry(url) {
  try {
    return await fetchRegistrants(url);
  } catch (firstError) {
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    return fetchRegistrants(url);
  }
}

async function loadRegisteredNames() {
  const cachedRegistrants = readCachedRegistrants();

  if (cachedRegistrants) {
    renderRegistrants(cachedRegistrants);
    setLoadingState(false);
  } else {
    setLoadingState(true);
  }

  setStatus("");

  try {
    const registrants = await fetchRegistrantsWithRetry(REGISTRANTS_URL);

    renderRegistrants(registrants);
    writeCachedRegistrants(registrants);
    setStatus("");
  } catch (error) {
    if (cachedRegistrants) {
      return;
    }

    renderNameList(adultList, [], "No adult names loaded yet.");
    renderNameList(studentList, [], "No student names loaded yet.");
    updateSummary([], []);
    setStatus(
      error instanceof Error
        ? error.message
        : "The member list could not be loaded right now.",
      "is-error",
    );
  } finally {
    setLoadingState(false);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void loadRegisteredNames();
  });
} else {
  void loadRegisteredNames();
}
