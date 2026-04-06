const page = document.querySelector(".single-page");
const adultCountElement = document.getElementById("adult-count");
const studentCountElement = document.getElementById("student-count");
const totalCountElement = document.getElementById("total-count");
const statusTextElement = document.getElementById("status-text");

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
      statusTextElement.textContent = "Current registration count loaded.";
    }
  }, 850);
}

loadCounts();
