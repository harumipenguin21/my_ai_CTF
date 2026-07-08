const portalStorageKey = "securityStudyPortalProgress";
const trackedSteps = ["pretest", "ctf", "posttest", "survey"];
const stepAliases = {
  groupA: "ctf",
  groupB: "ctf"
};

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(portalStorageKey) || "{}");
    return typeof saved === "object" && saved !== null ? saved : {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(portalStorageKey, JSON.stringify(progress));
}

function normalizeStep(step) {
  return stepAliases[step] || step;
}

function isStepComplete(progress, step) {
  const normalized = normalizeStep(step);
  if (normalized === "ctf") return Boolean(progress.ctf || progress.groupA || progress.groupB);
  return Boolean(progress[normalized]);
}

function normalizeProgress(progress) {
  if (progress.groupA || progress.groupB) progress.ctf = true;
  return progress;
}

function updateProgressUI() {
  const progress = normalizeProgress(loadProgress());
  saveProgress(progress);
  const completeCount = trackedSteps.filter((step) => isStepComplete(progress, step)).length;
  const count = document.querySelector("#progress-count");
  const bar = document.querySelector("#progress-bar-fill");

  if (count) count.textContent = completeCount + " / " + trackedSteps.length + " 完了";
  if (bar) bar.style.width = (completeCount / trackedSteps.length) * 100 + "%";

  document.querySelectorAll("[data-step-card]").forEach((card) => {
    const step = card.dataset.stepCard;
    card.classList.toggle("is-complete", isStepComplete(progress, step));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".step-link[data-step]").forEach((link) => {
    link.addEventListener("click", () => {
      const progress = normalizeProgress(loadProgress());
      const step = link.dataset.step;
      progress[step] = true;
      progress[normalizeStep(step)] = true;
      saveProgress(progress);
      updateProgressUI();
    });
  });

  const reset = document.querySelector("#reset-progress");
  if (reset) {
    reset.addEventListener("click", () => {
      localStorage.removeItem(portalStorageKey);
      updateProgressUI();
    });
  }

  updateProgressUI();
});
