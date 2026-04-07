const PROJECTS = [
  {
    id: "01",
    name: "Queeraani",
    desc: "A celebration of queer identity through design.",
    link: "https://canva.link/queeraani",
    color: "#E8E0D5",
    image: "./images/project images/queeraani/1.png"
  },
  {
    id: "02",
    name: "GitRoast",
    desc: "AI-powered repository feedback and critiques.",
    link: "https://www.gitroast.in/",
    color: "#DDE8E0",
    image: "./images/proto.gif"
  },
  {
    id: "03",
    name: "Causality",
    desc: "Visualizing complex systems and relationships.",
    link: "#",
    color: "#E0DDE8",
    image: "./images/project images/project 1/main 1.png"
  },
  {
    id: "04",
    name: "LES",
    desc: "The architecture of minimalist brand identity.",
    link: "#",
    color: "#F2E8D5",
    image: "./images/project images/project 1/main 1.png"
  }
];

const ROLE_IMAGES = ["./images/main 1.png", "./images/main 2.png", "./images/main 3.png", "./images/main 4.png"];

const DATA = [
  {
    eyebrow: "DESIGN / Systems",
    name: ["DESIGNER", "/ Systems"],
    sub: "// Product — Design Systems",
    dotLabel: "SYSTEMS",
  },
  {
    eyebrow: "DESIGN / Identity",
    name: ["DESIGNER", "/ Identity"],
    sub: "// Visual — Identity & Brand",
    dotLabel: "IDENTITY",
  },
  {
    eyebrow: "DESIGN / Motion",
    name: ["DESIGNER", "/ Motion"],
    sub: "// Digital — Motion Design",
    dotLabel: "MOTION",
  },
  {
    eyebrow: "DESIGN / Editorial",
    name: ["DESIGNER", "/ Editorial"],
    sub: "// Print — Editorial Design",
    dotLabel: "EDITORIAL",
  }
];

let current = 0,
  animating = false,
  projectMode = false,
  activeProjIdx = -1,
  projSlideIdx = 0;

const DURATION = 2000;
let autoTimer,
  progTimer,
  progVal = 0;

const domSlides = document.querySelectorAll(".slide");
const domThumbs = document.querySelectorAll(".film-thumb");
const domFades = document.querySelectorAll(".fade-el");
const progressLine = document.getElementById("progressLine");
const prEyebrow = document.getElementById("prEyebrow");
const prHeadline = document.getElementById("prHeadline");
const prSub = document.getElementById("prSub");
const inspoArea = document.getElementById("inspoArea");
const dotList = document.getElementById("dotList");

// Build dots
DATA.forEach((d, i) => {
  const row = document.createElement("div");
  row.className = "sl-dot-row" + (i === 0 ? " active" : "");
  row.dataset.idx = i;
  row.innerHTML = `<div class="sl-dot-track"></div><span class="sl-dot-label">${d.dotLabel}</span>`;
  row.addEventListener("click", () => {
    goTo(i);
  });
  dotList.appendChild(row);
});

function goTo(idx) {
  if (idx === current || animating) return;
  animating = true;
  const prev = current;
  current = ((idx % DATA.length) + DATA.length) % DATA.length;

  domSlides[prev].classList.remove("active");
  domSlides[current].classList.add("active");
  domThumbs[prev].classList.remove("active");
  domThumbs[current].classList.add("active");
  dotList.querySelectorAll(".sl-dot-row")[prev].classList.remove("active");
  dotList.querySelectorAll(".sl-dot-row")[current].classList.add("active");

  domFades.forEach((el) => el.classList.add("out"));
  setTimeout(() => {
    renderContent();
    domFades.forEach((el) => el.classList.remove("out"));
    animating = false;
  }, 750);

  resetProgress();
}

function renderContent() {
  const d = DATA[current];
  prEyebrow.textContent = d.eyebrow;
  const n = String(current + 1).padStart(2, "0");
  const masterCount = document.getElementById("masterCount");
  if (masterCount) masterCount.textContent = `${n} / 04`;
  prHeadline.innerHTML = `${d.name[0]}<em>${d.name[1]}</em>`;
  prSub.textContent = d.sub;
}

function renderProjects() {
  // Render Projects list statically
  inspoArea.innerHTML = PROJECTS
    .map(
      (p, i) => `
      <div class="project-row ${activeProjIdx === i ? 'active' : ''}" style="background-color: ${p.color}" data-pidx="${i}">
        <div class="proj-num">${p.id}</div>
        <div class="proj-info">
          <span class="proj-name">${p.name}</span>
          <span class="proj-desc">— ${p.desc}</span>
        </div>
        <a href="${p.link}" class="proj-link" target="_blank" onclick="event.stopPropagation()">link</a>
      </div>
    `
    )
    .join("");

  // Re-attach listeners
  inspoArea.querySelectorAll(".project-row").forEach((row) => {
    row.addEventListener("click", () => {
      toggleProject(parseInt(row.dataset.pidx));
    });
  });
}

function updateProjectRowState() {
  inspoArea.querySelectorAll(".project-row").forEach((row, i) => {
    if (i === activeProjIdx) row.classList.add("active");
    else row.classList.remove("active");
  });
}

function toggleProject(idx) {
  if (idx === -1 || activeProjIdx === idx) {
    projectMode = false;
    activeProjIdx = -1;
    projSlideIdx = 0;
    startAuto(); // Resume timer
  } else {
    projectMode = true;
    activeProjIdx = idx;
    projSlideIdx = 0;
    resetAuto(); // This clears existing and doesn't start if we change startAuto below
    // Actually, we want to STOP it.
    clearInterval(autoTimer);
    resetProgress();
  }
  updateImageStage();
  updateProjectRowState();
}

function updateImageStage() {
  const activeSlide = domSlides[current];
  const imgEl = activeSlide.querySelector("img");

  if (projectMode && activeProjIdx !== -1) {
    const p = PROJECTS[activeProjIdx];
    imgEl.src = p.image;
    activeSlide.querySelector(".slide-ghost").textContent = `P${activeProjIdx + 1}`;
  } else {
    imgEl.src = ROLE_IMAGES[current];
    activeSlide.querySelector(".slide-ghost").textContent = String(current + 1).padStart(2, "0");
  }

  // Filmstrip always shows Roles now as per simplified navigation
  domThumbs.forEach((thumb, i) => {
    const thumbImg = thumb.querySelector("img");
    const thumbNum = thumb.querySelector(".film-num");
    if (thumbImg) thumbImg.src = ROLE_IMAGES[i];
    if (thumbNum) thumbNum.innerText = String(i + 1).padStart(3, "0");

    // Highlight thumb based on mode
    // If project mode is on, we don't highlight any thumb? Or keep the current role thumb?
    // Let's keep the current role thumb highlighted since roles are always behind projects.
    if (i === current) thumb.classList.add("active");
    else thumb.classList.remove("active");
  });
}

function resetProgress() {
  clearInterval(progTimer);
  progVal = 0;
  progressLine.style.transition = "none";
  progressLine.style.width = "0%";

  if (!projectMode) {
    requestAnimationFrame(() => {
      progressLine.style.transition = "width 0.1s linear";
      const step = 100 / (DURATION / 100);
      progTimer = setInterval(() => {
        progVal = Math.min(progVal + step, 100);
        progressLine.style.width = progVal + "%";
      }, 100);
    });
  }
}

function resetAuto() {
  clearInterval(autoTimer);
  startAuto();
}
function startAuto() {
  if (projectMode) return;
  clearInterval(autoTimer);
  autoTimer = setInterval(() => goTo(current + 1), DURATION);
}

function nextSlide() {
  if (projectMode) {
    toggleProject(-1); // Exit if user clicks next while viewing a project
  } else {
    goTo(current + 1);
  }
}

function prevSlide() {
  if (projectMode) {
    toggleProject(-1);
  } else {
    goTo(current - 1);
  }
}

document.getElementById("nextBtn").addEventListener("click", () => {
  nextSlide();
});
document.getElementById("prevBtn").addEventListener("click", () => {
  prevSlide();
});
document.getElementById("zoneRight").addEventListener("click", () => {
  nextSlide();
});
document.getElementById("zoneLeft").addEventListener("click", () => {
  prevSlide();
});
domThumbs.forEach((t) =>
  t.addEventListener("click", () => {
    if (projectMode) toggleProject(-1);
    goTo(parseInt(t.dataset.idx));
    resetAuto();
  })
);

document.addEventListener("keydown", (e) => {
  if (["ArrowRight", "ArrowDown"].includes(e.key)) {
    goTo(current + 1);
  }
  if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
    goTo(current - 1);
  }
});

let tx = 0;
document.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), {
  passive: true
});
document.addEventListener("touchend", (e) => {
  const dx = tx - e.changedTouches[0].clientX;
  if (Math.abs(dx) > 40) {
    goTo(dx > 0 ? current + 1 : current - 1);
  }
});

/* ── CUSTOM CURSOR ── */
const cOuter = document.getElementById("cursor-outer");
const cInner = document.getElementById("cursor-inner");
const cLabel = document.getElementById("cursor-label");
let mx = -200,
  my = -200,
  ox = -200,
  oy = -200;

document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
  cInner.style.left = mx + "px";
  cInner.style.top = my + "px";
});

(function lerpCursor() {
  ox += (mx - ox) * 0.08;
  oy += (my - oy) * 0.08;
  cOuter.style.left = ox + "px";
  cOuter.style.top = oy + "px";
  cLabel.style.left = ox + "px";
  cLabel.style.top = oy + "px";
  requestAnimationFrame(lerpCursor);
})();

document
  .querySelectorAll(".sl-arrow, .sl-dot-row, .film-thumb, .sl-arrow")
  .forEach((el) => {
    el.addEventListener("mouseenter", () =>
      document.body.classList.add("cursor-hover")
    );
    el.addEventListener("mouseleave", () =>
      document.body.classList.remove("cursor-hover")
    );
  });

document.getElementById("zoneRight").addEventListener("mouseenter", () => {
  document.body.classList.add("cursor-hover", "show-label");
  cLabel.textContent = "NEXT →";
});
document.getElementById("zoneRight").addEventListener("mouseleave", () => {
  document.body.classList.remove("cursor-hover", "show-label");
});
document.getElementById("zoneLeft").addEventListener("mouseenter", () => {
  document.body.classList.add("cursor-hover", "show-label");
  cLabel.textContent = "← PREV";
});
document.getElementById("zoneLeft").addEventListener("mouseleave", () => {
  document.body.classList.remove("cursor-hover", "show-label");
});

/* STATUS CLOCK */
function updateStatusClock() {
  const options = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  const dateOptions = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  };
  
  const now = new Date();
  const timeStr = new Intl.DateTimeFormat('en-GB', options).format(now);
  const dateStr = new Intl.DateTimeFormat('en-GB', dateOptions).format(now);
  
  // Format: "dd Month yyyy" -> "07 april 2026"
  const dateParts = dateStr.split(' ');
  const formattedDate = `${dateParts[0]} ${dateParts[1]} ${dateParts[2]}`.toLowerCase();
  
  const slTime = document.getElementById('slTime');
  const footerDate = document.getElementById('footerDate');
  if (slTime) slTime.textContent = timeStr;
  if (footerDate) footerDate.textContent = formattedDate;
}
setInterval(updateStatusClock, 1000);
updateStatusClock();

/* INIT */
renderContent();
renderProjects();
resetProgress();
startAuto();
