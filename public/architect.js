// The Architect — client-side chat controller.
// Vanilla JS, no framework. Loaded sitewide via <script src="/architect.js" defer>.
// The gate routes visitors straight to the TMP CRM scheduling form — CRM owns the lead.

(function () {
  "use strict";

  const SESSION_COOKIE = "psse_arch_sid";
  const BOOKED_KEY = "psse_arch_booked";
  const SESSION_DAYS = 30;
  const ENDPOINT_CHAT = "/api/architect/chat";

  // --- session helpers ---
  function getOrCreateSessionId() {
    const m = document.cookie.match(new RegExp("(?:^|; )" + SESSION_COOKIE + "=([^;]+)"));
    if (m) return decodeURIComponent(m[1]);
    const id = "arch_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    const exp = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie =
      SESSION_COOKIE + "=" + encodeURIComponent(id) + "; expires=" + exp + "; path=/; SameSite=Lax";
    return id;
  }
  function hasBooked() {
    try {
      return localStorage.getItem(BOOKED_KEY) === "1";
    } catch {
      return false;
    }
  }
  function markBooked() {
    try {
      localStorage.setItem(BOOKED_KEY, "1");
    } catch {
      /* noop */
    }
  }

  // --- elements ---
  const launcher = document.getElementById("architect-launcher");
  const drawer = document.getElementById("architect-drawer");
  const backdrop = document.getElementById("architect-backdrop");
  const closeBtn = document.getElementById("architect-close");
  const thread = document.getElementById("architect-thread");
  const composer = document.getElementById("architect-composer");
  const input = document.getElementById("architect-input");
  const sendBtn = document.getElementById("architect-send");
  const gate = document.getElementById("architect-gate");
  const gateLabel = document.getElementById("architect-gate-label");
  const gateCopy = document.getElementById("architect-gate-copy");
  const gateCta = document.getElementById("architect-gate-cta");
  const gateDismiss = document.getElementById("architect-gate-dismiss");

  if (!launcher || !drawer || !thread || !composer || !input || !gateCta) return;

  const sessionId = getOrCreateSessionId();
  const messages = []; // {role, content}
  let waiting = false;
  let softGateDismissed = false;
  let booked = hasBooked();

  // --- ui helpers ---
  function openDrawer() {
    drawer.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    launcher.setAttribute("aria-expanded", "true");
    setTimeout(() => input.focus(), 50);
  }
  function closeDrawer() {
    drawer.classList.add("hidden");
    document.body.style.overflow = "";
    launcher.setAttribute("aria-expanded", "false");
  }

  function autoResize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 128) + "px";
  }

  function appendUserMessage(text) {
    const div = document.createElement("div");
    div.className = "flex gap-3 justify-end";
    div.dataset.role = "user";
    div.innerHTML =
      '<div class="max-w-[85%]">' +
      '<div class="bg-bronze/20 text-paper-100 rounded-soft px-3 py-2 text-small leading-relaxed">' +
      escapeHtml(text) +
      "</div>" +
      "</div>";
    thread.appendChild(div);
    thread.scrollTop = thread.scrollHeight;
  }

  function appendAssistantMessage(text) {
    const div = document.createElement("div");
    div.className = "flex gap-3";
    div.dataset.role = "assistant";
    div.innerHTML =
      '<span class="inline-flex items-center justify-center h-7 w-7 rounded-sharp bg-signal/15 text-signal font-display text-[0.8125rem] font-medium shrink-0 mt-0.5">A</span>' +
      '<div class="flex-1 min-w-0">' +
      '<div class="font-mono text-[0.8125rem] tracking-[0.18em] uppercase text-signal mb-1">THE ARCHITECT</div>' +
      '<div class="text-small text-paper-100 leading-relaxed whitespace-pre-wrap">' +
      linkify(escapeHtml(text)) +
      "</div>" +
      "</div>";
    thread.appendChild(div);
    thread.scrollTop = thread.scrollHeight;
  }

  function appendTyping() {
    const div = document.createElement("div");
    div.className = "flex gap-3";
    div.id = "architect-typing";
    div.innerHTML =
      '<span class="inline-flex items-center justify-center h-7 w-7 rounded-sharp bg-signal/15 text-signal font-display text-[0.8125rem] font-medium shrink-0 mt-0.5">A</span>' +
      '<div class="flex-1 min-w-0">' +
      '<div class="font-mono text-[0.8125rem] tracking-[0.18em] uppercase text-signal mb-1">THE ARCHITECT</div>' +
      '<div class="text-small text-paper-200/70 italic">typing…</div>' +
      "</div>";
    thread.appendChild(div);
    thread.scrollTop = thread.scrollHeight;
  }
  function removeTyping() {
    const t = document.getElementById("architect-typing");
    if (t) t.remove();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function linkify(html) {
    return html.replace(
      /(\/(?:journey|services|resources|who-we-help)\/[a-z0-9-]+\/?|https?:\/\/[^\s<]+)/g,
      (m) =>
        '<a href="' +
        m +
        '" class="underline text-signal-400 hover:text-signal" target="_self">' +
        m +
        "</a>"
    );
  }

  // --- gate: route to CRM scheduling form with intent context ---
  function deriveIntentTags() {
    const allUser = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content.toLowerCase())
      .join(" ");
    const hits = [];
    if (/credential|cms|855|caqh|payer|in.network/.test(allUser)) hits.push("credentialing");
    if (/cost|budget|capital|loan|financ|expensive|price/.test(allUser)) hits.push("costs");
    if (/np|nurse practitioner|pa\b|physician assistant/.test(allUser)) hits.push("non-physician");
    if (/behavioral|therap|psych/.test(allUser)) hits.push("behavioral-health");
    if (/start|launch|new practice|open/.test(allUser)) hits.push("phase-01-02");
    if (/website|seo|marketing|patients|grow/.test(allUser)) hits.push("phase-06");
    if (/ehr|emr|billing|hipaa|infrastructure/.test(allUser)) hits.push("phase-05");
    return hits.join(",") || "general-inquiry";
  }

  function buildCrmUrl() {
    const base = gateCta.dataset.baseUrl || gateCta.getAttribute("href") || "/";
    // If the base is still the template token, just send to /#architect — no useful CRM yet.
    if (base.indexOf("{{") === 0 || base.indexOf("{{") >= 0) {
      return base;
    }
    try {
      const u = new URL(base, location.origin);
      u.searchParams.set("source", "architect-companion");
      u.searchParams.set("session_id", sessionId);
      u.searchParams.set("intent", deriveIntentTags());
      u.searchParams.set("page", location.pathname);
      return u.toString();
    } catch {
      return base;
    }
  }

  function showGate(kind) {
    if (booked) return; // visitor has already booked — never re-gate
    if (kind === "hard") {
      gateLabel.textContent = "Time to talk to a human";
      gateCopy.textContent =
        "This is where talking to a human will get you further than I can. Schedule a free consultation — the team will pick up exactly where we left off.";
      gateDismiss.classList.add("hidden");
    } else {
      gateLabel.textContent = "Want to keep going?";
      gateCopy.textContent =
        "We can keep chatting, or — if you're ready for a real plan — schedule a free consultation. The team will pick up exactly where we left off.";
      gateDismiss.classList.remove("hidden");
    }
    // Capture the base URL once so we don't double-mutate it
    if (!gateCta.dataset.baseUrl) {
      gateCta.dataset.baseUrl = gateCta.getAttribute("href") || "";
    }
    gateCta.setAttribute("href", buildCrmUrl());
    gate.classList.remove("hidden");
    thread.scrollTop = thread.scrollHeight;
  }
  function hideGate() {
    gate.classList.add("hidden");
  }

  async function sendMessage(text) {
    if (waiting) return;
    if (!text || !text.trim()) return;
    waiting = true;
    sendBtn.disabled = true;

    const userMsg = { role: "user", content: text.trim() };
    messages.push(userMsg);
    appendUserMessage(userMsg.content);
    input.value = "";
    autoResize();
    appendTyping();

    try {
      const r = await fetch(ENDPOINT_CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          messages: messages,
          hasBookedConsultation: booked,
        }),
      });

      removeTyping();

      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        appendAssistantMessage(
          (errBody && errBody.error) || "Something went wrong. Try again in a moment."
        );
        return;
      }

      const data = await r.json();

      if (data.gate === "hard") {
        appendAssistantMessage(data.message);
        showGate("hard");
        return;
      }

      if (data.message) {
        messages.push({ role: "assistant", content: data.message });
        appendAssistantMessage(data.message);
      }

      if (data.gate === "soft" && !booked && !softGateDismissed) {
        showGate("soft");
      }
    } catch (e) {
      removeTyping();
      appendAssistantMessage("The Architect is briefly offline. Try again.");
    } finally {
      waiting = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // --- event wiring ---
  launcher.addEventListener("click", openDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !drawer.classList.contains("hidden")) closeDrawer();
  });

  input.addEventListener("input", autoResize);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });

  composer.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(input.value);
  });

  thread.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest(".architect-suggestion");
    if (t) sendMessage(t.dataset.prompt || t.textContent);
  });

  // CRM CTA: when clicked, mark visitor as booked so we don't keep gating them
  gateCta.addEventListener("click", () => {
    booked = true;
    markBooked();
    // Update the CTA href one more time with current intent context (in case more turns happened)
    gateCta.setAttribute("href", buildCrmUrl());
    // Close the gate after they click out
    setTimeout(() => hideGate(), 200);
  });

  if (gateDismiss) {
    gateDismiss.addEventListener("click", () => {
      softGateDismissed = true;
      hideGate();
      input.focus();
    });
  }

  // --- mobile launcher ---
  const mobileLauncher = document.createElement("button");
  mobileLauncher.type = "button";
  mobileLauncher.setAttribute("aria-label", "Ask The Architect");
  mobileLauncher.className =
    "fixed bottom-4 right-4 z-40 sm:hidden inline-flex items-center justify-center h-14 w-14 rounded-full bg-ink hover:bg-ink-700 text-paper-100 shadow-elevated transition-colors";
  mobileLauncher.innerHTML = '<span class="font-display text-lg font-medium text-paper-100">A</span>';
  mobileLauncher.addEventListener("click", openDrawer);
  document.body.appendChild(mobileLauncher);

  // Deep-link via #architect to auto-open on page load
  if (location.hash === "#architect") {
    setTimeout(openDrawer, 200);
  }
})();
