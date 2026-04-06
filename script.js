const DATA = [
  {
    eyebrow: "FORME / Intention",
    name: ["DESIGNER", ""],
    sub: "// FORME — Intention",
    dotLabel: "FORME",
    details: {
      Tools: "Figma, After Effects",
      Role: "UI / Product Designer",
      Style: "Minimal",
      Influence: "Bauhaus"
    },
    inspo: [
      {
        text:
          "The absence of ornament is itself an ornament — a reduction to pure form, where only gesture remains.",
        attr: "— Atelier Notes"
      },
      {
        text:
          "She does not dress to be seen. She dresses to disappear into the architecture of the room.",
        attr: "— Collection Brief"
      },
      {
        text:
          "Vide. Empty. And in that emptiness, everything that truly matters.",
        attr: "— Creative Director"
      }
    ]
  },
  {
    eyebrow: "LOGIC / Precision",
    name: ["DESIGNER", ""],
    sub: "// LOGIC — Precision",
    dotLabel: "LOGIC",
    details: {
      Tools: "React, Node.js, Three.js",
      Role: "Frontend Developer",
      Style: "Structured",
      Influence: "Brutalism"
    },
    inspo: [
      {
        text:
          "A seam is a scar. A dart is a decision. Every line on the body tells us where the body ends and the idea begins.",
        attr: "— Atelier Notes"
      },
      {
        text:
          "The jacket is not clothing. It is a theory of the shoulder, a hypothesis about power.",
        attr: "— Collection Brief"
      },
      {
        text: "We cut and cut until what remains feels inevitable.",
        attr: "— Pattern Maker"
      }
    ]
  },
  {
    eyebrow: "TEMPO / Motion",
    name: ["DESIGNER", ""],
    sub: "// TEMPO — Motion",
    dotLabel: "TEMPO",
    details: {
      Tools: "Premiere, After Effects",
      Role: "Motion Designer",
      Style: "Cinematic",
      Influence: "Glitch"
    },
    inspo: [
      {
        text:
          "Dusk is the only hour when colour is honest — neither the harshness of noon nor the lies of electric light.",
        attr: "— Colour Direction"
      },
      {
        text:
          "She moves and the fabric remembers. It holds the shape of her motion like amber.",
        attr: "— Collection Brief"
      },
      {
        text: "Ombre: to shade. All fashion is the art of selective shadow.",
        attr: "— Creative Director"
      }
    ]
  },
  {
    eyebrow: "VOID / Instinct",
    name: ["DESIGNER", ""],
    sub: "// VOID — Instinct",
    dotLabel: "VOID",
    details: {
      Tools: "Three.js, p5.js, TouchDesigner",
      Role: "Creative Technologist",
      Style: "Chaotic",
      Influence: "Wabi-sabi"
    },
    inspo: [
      {
        text:
          "Ma — the concept of negative space — is not absence, but the pause that gives meaning to all that surrounds it.",
        attr: "— Design Philosophy"
      },
      {
        text:
          "The eye follows what is revealed. But the mind follows what is withheld.",
        attr: "— Atelier Notes"
      },
      {
        text:
          "To dress is to choose what to leave uncovered. The honest garment knows its own edges.",
        attr: "— Creative Director"
      }
    ]
  }
];

let current = 0,
  animating = false;
const DURATION = 5500;
let autoTimer,
  progTimer,
  progVal = 0;

const domSlides = document.querySelectorAll(".slide");
const domThumbs = document.querySelectorAll(".film-thumb");
const domFades = document.querySelectorAll(".fade-el");
const progressLine = document.getElementById("progressLine");
const counterNum = document.getElementById("counterNum");
const masterCount = document.getElementById("masterCount");
const prEyebrow = document.getElementById("prEyebrow");
const prHeadline = document.getElementById("prHeadline");
const prSub = document.getElementById("prSub");
const inspoArea = document.getElementById("inspoArea");
const dotList = document.getElementById("dotList");
const detMap = {
  Tools: "dFabric",
  Role: "dSilhouette",
  Style: "dMood",
  Influence: "dOrigin"
};

// Build dots
DATA.forEach((d, i) => {
  const row = document.createElement("div");
  row.className = "sl-dot-row" + (i === 0 ? " active" : "");
  row.dataset.idx = i;
  row.innerHTML = `<div class="sl-dot-track"></div><span class="sl-dot-label">${d.dotLabel}</span>`;
  row.addEventListener("click", () => {
    goTo(i);
    resetAuto();
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
  }, 270);

  resetProgress();
}

function renderContent() {
  const d = DATA[current];
  const n = String(current + 1).padStart(2, "0");
  counterNum.textContent = n;
  masterCount.textContent = `${n} / 04`;
  prEyebrow.textContent = d.eyebrow;
  prHeadline.innerHTML = `${d.name[0]}<em>${d.name[1]}</em>`;
  prSub.textContent = d.sub;
  Object.entries(detMap).forEach(([key, id]) => {
    document.getElementById(id).textContent = d.details[key] || "—";
  });
  inspoArea.innerHTML = d.inspo
    .map(
      (q, i) => `
      <div class="inspo-item">
        <div class="inspo-num">0${i + 1}</div>
        <div class="inspo-text">${q.text}</div>
        <div class="inspo-attr">${q.attr}</div>
      </div>
    `
    )
    .join("");
}

function resetProgress() {
  clearInterval(progTimer);
  progVal = 0;
  progressLine.style.transition = "none";
  progressLine.style.width = "0%";
  requestAnimationFrame(() => {
    progressLine.style.transition = "width 0.1s linear";
    const step = 100 / (DURATION / 100);
    progTimer = setInterval(() => {
      progVal = Math.min(progVal + step, 100);
      progressLine.style.width = progVal + "%";
    }, 100);
  });
}

function resetAuto() {
  clearInterval(autoTimer);
  startAuto();
}
function startAuto() {
  autoTimer = setInterval(() => goTo(current + 1), DURATION);
}

document.getElementById("nextBtn").addEventListener("click", () => {
  goTo(current + 1);
  resetAuto();
});
document.getElementById("prevBtn").addEventListener("click", () => {
  goTo(current - 1);
  resetAuto();
});
document.getElementById("zoneRight").addEventListener("click", () => {
  goTo(current + 1);
  resetAuto();
});
document.getElementById("zoneLeft").addEventListener("click", () => {
  goTo(current - 1);
  resetAuto();
});
domThumbs.forEach((t) =>
  t.addEventListener("click", () => {
    goTo(parseInt(t.dataset.idx));
    resetAuto();
  })
);

document.addEventListener("keydown", (e) => {
  if (["ArrowRight", "ArrowDown"].includes(e.key)) {
    goTo(current + 1);
    resetAuto();
  }
  if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
    goTo(current - 1);
    resetAuto();
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
    resetAuto();
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
  ox += (mx - ox) * 0.13;
  oy += (my - oy) * 0.13;
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

/* INIT */
renderContent();
resetProgress();
startAuto();
