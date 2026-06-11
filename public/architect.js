// The Architect — client-side chat controller.
// Vanilla JS, no framework. Loaded sitewide via <script src="/architect.js" defer>.

(function () {
  "use strict";

  const SESSION_COOKIE = "psse_arch_sid";
  const SESSION_DAYS = 30;
  const ENDPOINT_CHAT = "/api/architect/chat";
  const ENDPOINT_IDENTIFY = "/api/architect/identify";

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

  function getVisitor() {
    try {
      const raw = localStorage.getItem("psse_arch_visitor");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  function setVisitor(v) {
    try {
      localStorage.setItem("psse_arch_visitor", JSON.stringify(v));
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
  const gateForm = document.getElementById("architect-gate-form");
  const gateDismiss = document.getElementById("architect-gate-dismiss");

  if (!launcher || !drawer || !thread || !composer || !input) return;

  const sessionId = getOrCreateSessionId();
  const messages = []; // {role, content}
  let visitor = getVisitor();
  let waiting = false;
  let softGateDismissed = false;

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
      (m) => '<a href="' + m + '" class="underline text-signal-400 hover:text-signal" target="_self">' + m + "</a>"
    );
  }

  function showGate(kind) {
    gate.classList.remove("hidden");
    gate.dataset.kind = kind;
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
          visitorName: visitor && visitor.name,
          visitorEmail: visitor && visitor.email,
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
        // hard gate — show gate, do NOT add assistant message
        appendAssistantMessage(data.message);
        showGate("hard");
        return;
      }

      if (data.message) {
        messages.push({ role: "assistant", content: data.message });
        appendAssistantMessage(data.message);
      }

      if (data.gate === "soft" && !visitor && !softGateDismissed) {
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

  async function submitGate(name, email) {
    try {
      const r = await fetch(ENDPOINT_IDENTIFY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          name: name,
          email: email,
          transcript: messages,
          source: "the-architect-companion-" + location.pathname,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        visitor = { name: name, email: email };
        setVisitor(visitor);
        hideGate();
        appendAssistantMessage(
          (data && data.message) ||
            "Thanks — your conversation is saved. Where were we? Keep going."
        );
      } else {
        appendAssistantMessage((data && data.error) || "Couldn't save that — try again?");
      }
    } catch {
      appendAssistantMessage("Couldn't save that right now. Try again in a moment.");
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

  if (gateForm) {
    gateForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(gateForm);
      const name = (fd.get("name") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      if (!name || !email) return;
      submitGate(name, email);
    });
  }
  if (gateDismiss) {
    gateDismiss.addEventListener("click", () => {
      softGateDismissed = true;
      hideGate();
      input.focus();
    });
  }

  // --- mobile launcher (always visible on mobile via different style) ---
  // launcher uses "hidden sm:flex" — show on mobile via a smaller variant
  const mobileLauncher = document.createElement("button");
  mobileLauncher.type = "button";
  mobileLauncher.setAttribute("aria-label", "Ask The Architect");
  mobileLauncher.className =
    "fixed bottom-4 right-4 z-40 sm:hidden inline-flex items-center justify-center h-14 w-14 rounded-full bg-ink hover:bg-ink-700 text-paper-100 shadow-elevated transition-colors";
  mobileLauncher.innerHTML =
    '<span class="font-display text-lg font-medium text-paper-100">A</span>';
  mobileLauncher.addEventListener("click", openDrawer);
  document.body.appendChild(mobileLauncher);

  // Optional: deep-link via #architect to auto-open on page load
  if (location.hash === "#architect") {
    setTimeout(openDrawer, 200);
  }
})();
