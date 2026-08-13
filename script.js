const wrap = document.getElementById("envelopeWrap");
const seal = document.getElementById("seal");
const hint = document.getElementById("hint");
const reveal = document.getElementById("reveal");
const downloadBtn = document.getElementById("download");
const toast = document.getElementById("toast");
const stage = document.getElementById("stage");
const waitingPanel = document.getElementById("waitingPanel");
const interactionLayer = document.getElementById("interactionLayer");
const card = document.getElementById("invitationCard");

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");

let state = "closed";
let revealStarted = false;
let autoDownloadDone = false;

/* ---------- Stars ---------- */
function createStars() {
  const holder = document.getElementById("stars");

  for (let i = 0; i < 70; i++) {
    const s = document.createElement("span");
    s.className = "spark";
    s.style.left = Math.random() * 100 + "%";
    s.style.animationDuration = 5 + Math.random() * 8 + "s";
    s.style.animationDelay = Math.random() * 8 + "s";
    s.style.opacity = 0.35 + Math.random() * 0.65;
    s.style.setProperty("--float-time", (5 + Math.random() * 5) + "s");
    s.style.setProperty("--twinkle-time", (1.5 + Math.random() * 2) + "s");
    s.style.setProperty("--float-delay", (Math.random() * 5) + "s");
    s.style.setProperty("--twinkle-delay", (Math.random() * 3) + "s");
    holder.appendChild(s);
  }
}
createStars();

/* ---------- Gold dust ---------- */
function createGoldDust() {
  const holder = document.getElementById("goldDust");
  if (!holder) return;

  for (let i = 0; i < 28; i++) {
    const d = document.createElement("span");
    d.className = "dust";
    d.style.left = (5 + Math.random() * 90) + "%";
    d.style.top = (5 + Math.random() * 85) + "%";
    d.style.animationDelay = (Math.random() * 4) + "s";
    d.style.animationDuration = (3.5 + Math.random() * 3) + "s";
    d.style.width = d.style.height = (2 + Math.random() * 3) + "px";
    holder.appendChild(d);
  }
}
createGoldDust();

/* ---------- Confetti ---------- */
function confettiBurst() {
  const colors = ["#d8ae4c", "#fff7df", "#c91535", "#e8cb70"];

  for (let i = 0; i < 95; i++) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.style.left = "50%";
    c.style.top = "45%";
    c.style.background =
      colors[Math.floor(Math.random() * colors.length)];

    const angle = Math.random() * Math.PI * 2;
    const distance = 180 + Math.random() * 520;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const rotate = Math.random() * 900;
    const duration = 1000 + Math.random() * 1400;

    document.body.appendChild(c);

    c.animate(
      [
        {
          transform: "translate(-50%,-50%) rotate(0deg)",
          opacity: 1
        },
        {
          transform: `translate(${x}px,${y}px) rotate(${rotate}deg)`,
          opacity: 0
        }
      ],
      {
        duration,
        easing: "cubic-bezier(.2,.7,.25,1)"
      }
    );

    setTimeout(() => c.remove(), duration + 50);
  }
}

/* ---------- Step 1 -> Step 2 ---------- */
function openEnvelope() {
  if (state !== "closed") return;

  state = "waiting";

  step1.classList.remove("active");
  step1.classList.add("done");

  step2.classList.add("active");

  hint.textContent = "YOU ARE INVITED ✦";

  stage.classList.add("waiting");
  wrap.classList.add("open");

  /*
    The envelope opens first.
    Then we wait for the viewer's next interaction.
  */
  setTimeout(() => {
    interactionLayer.classList.add("active");
    interactionLayer.setAttribute("aria-hidden", "false");
  }, 1050);
}

/* ---------- Step 2 -> Step 3 ---------- */
function revealInvitation() {
  if (state !== "waiting" || revealStarted) return;

  revealStarted = true;
  state = "revealed";

  interactionLayer.classList.remove("active");
  interactionLayer.setAttribute("aria-hidden", "true");

  step2.classList.remove("active");
  step2.classList.add("done");

  step3.classList.add("active");

  hint.textContent = "INVITATION REVEALED";

  /*
    Compact the envelope section and immediately
    bring the supplied invitation card into view.
  */
  stage.classList.add("card-mode");
  reveal.classList.add("show");

  confettiBurst();

  setTimeout(() => {
    reveal.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, 120);

  /*
    Wait until the card has visually appeared,
    then capture it with html2canvas.
  */
  setTimeout(() => {
    downloadOriginalInvitation();
  }, 1100);
}

/* ---------- Viewer interaction ---------- */

/* Any click/tap anywhere after Step 2. */
document.addEventListener("click", (event) => {
  if (state === "waiting" && event.target !== seal) {
    revealInvitation();
  }
});

/* Any touch after Step 2. */
document.addEventListener("touchstart", () => {
  if (state === "waiting") {
    revealInvitation();
  }
}, { passive: true });

/* Any scroll/wheel after Step 2. */
window.addEventListener("wheel", () => {
  if (state === "waiting") {
    revealInvitation();
  }
}, { passive: true });

window.addEventListener("scroll", () => {
  if (state === "waiting") {
    revealInvitation();
  }
}, { passive: true });

/* Keyboard also works as an accessibility fallback. */
window.addEventListener("keydown", (event) => {
  if (state === "waiting" &&
      ["Enter", " ", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
    revealInvitation();
  }
});

seal.addEventListener("click", (event) => {
  event.stopPropagation();
  openEnvelope();
});

/* ---------- Exact original-card download ---------- */

/*
  IMPORTANT:
  The invitation card supplied by the user is already a finished PNG.
  We do NOT use html2canvas for the automatic download.

  html2canvas captures the DOM while CSS animations/transitions are
  running. That can capture the card during an opacity/transition state,
  which is why an earlier downloaded image looked faded.

  The background animations are webpage-only and are never baked into
  the downloaded invitation.
*/
async function downloadOriginalInvitation() {
  if (autoDownloadDone) return;
  autoDownloadDone = true;

  try {
    const response = await fetch(card.getAttribute("src"), {
      cache: "no-store"
    });

    if (!response.ok) throw new Error("Invitation image could not be read.");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download =
      "Supreme_Knowledge_Foundation_Teachers_Day_Invitation.png";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);

    showToast("✓ Original invitation downloaded");
  } catch (error) {
    console.error("Direct download failed:", error);

    /*
      Fallback for restrictive file:// environments.
      On hosting/Live Server the fetch/blob method above is preferred.
    */
    const link = document.createElement("a");
    link.href = card.getAttribute("src");
    link.download =
      "Supreme_Knowledge_Foundation_Teachers_Day_Invitation.png";
    document.body.appendChild(link);
    link.click();
    link.remove();

    showToast("✓ Invitation downloaded");
  }
}

/* ---------- Manual/fallback download ---------- */
function directImageDownload() {
  const link = document.createElement("a");

  link.href = card.getAttribute("src");
  link.download =
    "Supreme_Knowledge_Foundation_Teachers_Day_Invitation.png";

  document.body.appendChild(link);
  link.click();
  link.remove();

  showToast("✓ Invitation downloaded");
}

downloadBtn.addEventListener("click", downloadOriginalInvitation);


function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}
