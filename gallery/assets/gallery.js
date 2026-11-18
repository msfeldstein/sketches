(function () {
  "use strict";

  var manifest = window.GALLERY_MANIFEST;
  var promptsEl = document.getElementById("rounds");
  var pauseAll = document.getElementById("pause-all");
  var toastEl = document.getElementById("toast");
  // Offscreen tiles are torn down after this delay so quick scroll-bys don't thrash.
  var UNLOAD_DELAY_MS = 800;
  var tiles = [];
  var params = new URLSearchParams(window.location.search);

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else if (k === "className") node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function sketchPath(prompt, stageNum, entry) {
    return "sketches/" + prompt.id + "/stage-" + stageNum + "/" + entry.id + "/";
  }

  function absoluteUrl(path) {
    return new URL(path, window.location.href).href;
  }

  function embedSnippet(url, title) {
    return '<iframe src="' + url + '" title="' + title.replace(/"/g, "&quot;") +
      '" width="800" height="600" style="border:0;background:#000" loading="lazy" allowfullscreen></iframe>';
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove("show"); }, 1600);
  }

  function copyText(text, input) {
    function fallback() {
      input.focus();
      input.select();
      try { document.execCommand("copy"); toast("Embed code copied"); }
      catch (e) { toast("Press Ctrl/Cmd+C to copy"); }
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast("Embed code copied"); }, fallback);
    } else {
      fallback();
    }
  }

  function clampStage(prompt, n) {
    n = parseInt(n, 10);
    if (!(n >= 1)) return 1;
    return Math.min(n, prompt.stages.length);
  }

  function stageName(prompt, n) {
    var s = prompt.stages[n - 1];
    return "Stage " + n + (s.label ? " · " + s.label : "");
  }

  // Stage picker used by both the per-prompt control and each tile. All pickers in a
  // prompt drive the same shared stage. onSelect(n) gets a 1-based stage number.
  function StagePicker(prompt, opts) {
    var self = this;
    this.count = prompt.stages.length;
    this.onSelect = opts.onSelect;
    this.prev = el("button", { className: "stage-step", type: "button", "aria-label": "Previous stage", text: "‹" });
    this.next = el("button", { className: "stage-step", type: "button", "aria-label": "Next stage", text: "›" });
    this.prev.addEventListener("click", function () { self.step(-1); });
    this.next.addEventListener("click", function () { self.step(1); });
    this.tabs = prompt.stages.map(function (s, i) {
      var n = i + 1;
      var tab = el("button", {
        className: "stage-tab", type: "button", role: "tab",
        title: stageName(prompt, n) + ": " + s.prompt,
      }, [
        el("span", { className: "stage-num", text: String(n) }),
        opts.compact ? null : el("span", { className: "stage-label", text: s.label || "" }),
      ]);
      tab.addEventListener("click", function () { self.onSelect(n); });
      return tab;
    });
    this.current = null;
    this.node = el("div", { className: "stage-picker" + (opts.compact ? " compact" : ""), role: "tablist", "aria-label": opts.ariaLabel },
      [this.prev].concat(this.tabs, [this.next]));
  }

  StagePicker.prototype.step = function (dir) {
    var n = (this.current || 1) + dir;
    if (n >= 1 && n <= this.count) this.onSelect(n);
  };

  StagePicker.prototype.set = function (n) {
    this.current = n;
    this.tabs.forEach(function (t, i) {
      var on = i + 1 === n;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    this.prev.disabled = !n || n <= 1;
    this.next.disabled = !n || n >= this.count;
  };

  function Tile(prompt, entry) {
    var self = this;
    this.prompt = prompt;
    this.entry = entry;
    this.label = entry.model + (entry.detail ? " — " + entry.detail : "");
    this.available = entry.stages || prompt.stages.map(function (_, i) { return i + 1; });
    this.multi = prompt.stages.length > 1;
    this.stageNum = null;
    this.visible = false;
    this.iframe = null;
    this.unloadTimer = null;

    this.placeholder = el("div", { className: "stage-placeholder", text: "Paused" });
    this.stage = el("div", { className: "stage" }, [this.placeholder]);
    this.stageLink = el("a", { className: "stage-link", target: "_blank", rel: "noopener" }, [this.stage]);

    this.fullLink = el("a", {
      className: "btn", target: "_blank", rel: "noopener",
      title: "Open full-screen in a new tab", text: "Full screen ↗",
    });
    var reloadBtn = el("button", { className: "btn", type: "button", title: "Restart this sketch", text: "Restart" });
    reloadBtn.addEventListener("click", function () { self.unload(); self.maybeLoad(); });

    this.input = el("input", { className: "embed-input", type: "text", readonly: "" });
    this.input.addEventListener("focus", function () { self.input.select(); });
    var copyBtn = this.copyBtn = el("button", { className: "btn btn-primary", type: "button", text: "Copy embed" });
    copyBtn.addEventListener("click", function () { copyText(self.input.value, self.input); });

    var stageRow = null;
    if (this.multi) {
      this.picker = new StagePicker(prompt, {
        compact: true,
        ariaLabel: "Stage for " + this.label,
        onSelect: function (n) { setPromptStage(prompt, n, true); },
      });
      this.stagePrompt = el("p", { className: "tile-stage-prompt" });
      stageRow = el("div", { className: "tile-stage" }, [
        el("div", { className: "tile-stage-head" }, [
          this.stageTitle = el("span", { className: "tile-stage-title" }),
          this.picker.node,
        ]),
        this.stagePrompt,
      ]);
    }

    this.node = el("article", { className: "tile" }, [
      this.stageLink,
      el("div", { className: "tile-body" }, [
        el("div", { className: "tile-head" }, [
          el("h3", { className: "model", text: entry.model }),
          entry.detail ? el("span", { className: "detail", text: entry.detail }) : null,
        ]),
        stageRow,
        el("div", { className: "actions" }, [this.fullLink, reloadBtn, copyBtn]),
        this.input,
      ]),
    ]);
    this.node.__tile = this;
  }

  Tile.prototype.hasStage = function (n) {
    return this.available.indexOf(n) !== -1;
  };

  Tile.prototype.setStage = function (n) {
    if (n === this.stageNum) return;
    this.stageNum = n;
    var ok = this.hasStage(n);
    var s = this.prompt.stages[n - 1];
    var title = this.prompt.title + " · " + (this.multi ? stageName(this.prompt, n) + " · " : "") + this.label;
    this.path = ok ? sketchPath(this.prompt, n, this.entry) : null;
    this.title = title;

    this.node.classList.toggle("missing", !ok);
    this.placeholder.textContent = ok ? "Paused" : "No sketch for this stage";
    [this.stageLink, this.fullLink].forEach(function (a) {
      if (ok) a.setAttribute("href", this.path); else a.removeAttribute("href");
    }, this);
    this.stageLink.setAttribute("aria-label", "Open " + title + " full screen");
    this.copyBtn.disabled = !ok;
    this.fullLink.classList.toggle("disabled", !ok);
    this.input.value = ok ? embedSnippet(absoluteUrl(this.path), title) : "";
    this.input.setAttribute("aria-label", "Embed code for " + title);

    if (this.multi) {
      this.picker.set(n);
      this.stageTitle.textContent = stageName(this.prompt, n);
      this.stagePrompt.textContent = s.prompt;
    }
    this.unload();
    this.maybeLoad();
  };

  Tile.prototype.maybeLoad = function () {
    clearTimeout(this.unloadTimer);
    if (this.iframe || !this.path || !this.visible || pauseAll.checked) return;
    // The iframe sits under a transparent link so clicking a tile opens the full sketch.
    this.iframe = el("iframe", { src: this.path, title: this.title, tabindex: "-1", allow: "fullscreen" });
    this.stage.appendChild(this.iframe);
    this.node.classList.add("live");
  };

  Tile.prototype.unload = function () {
    clearTimeout(this.unloadTimer);
    if (!this.iframe) return;
    this.iframe.remove();
    this.iframe = null;
    this.node.classList.remove("live");
  };

  Tile.prototype.scheduleUnload = function () {
    var self = this;
    clearTimeout(this.unloadTimer);
    this.unloadTimer = setTimeout(function () { self.unload(); }, UNLOAD_DELAY_MS);
  };

  var groups = {};

  function setPromptStage(prompt, n, updateUrl) {
    var g = groups[prompt.id];
    g.stage = n;
    g.tiles.forEach(function (t) { t.setStage(n); });
    g.picker.set(n);
    g.title.textContent = stageName(prompt, n);
    g.prompt.textContent = prompt.stages[n - 1].prompt;
    if (updateUrl) {
      if (n === 1) params.delete(prompt.id); else params.set(prompt.id, String(n));
      var qs = params.toString();
      history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
    }
  }

  function renderPrompt(prompt) {
    var multi = prompt.stages.length > 1;
    var grid = el("div", { className: "grid" });
    var promptTiles = prompt.entries.map(function (entry) {
      var tile = new Tile(prompt, entry);
      tiles.push(tile);
      grid.appendChild(tile.node);
      return tile;
    });

    var head = el("div", { className: "round-head" }, [
      el("div", { className: "round-title-row" }, [
        el("h2", { text: prompt.title }),
        multi ? el("span", { className: "stage-count", text: prompt.stages.length + " stages" }) : null,
      ]),
    ]);

    if (multi) {
      var g = groups[prompt.id] = { tiles: promptTiles };
      g.picker = new StagePicker(prompt, {
        ariaLabel: "Stage for " + prompt.title,
        onSelect: function (n) { setPromptStage(prompt, n, true); },
      });
      g.title = el("span", { className: "prompt-label" });
      g.prompt = el("span");
      head.appendChild(el("div", { className: "group-stage" }, [
        el("span", { className: "group-stage-caption", text: "Stage" }),
        g.picker.node,
      ]));
      head.appendChild(el("p", { className: "prompt" }, [g.title, g.prompt]));
    } else {
      head.appendChild(el("p", { className: "prompt" }, [
        el("span", { className: "prompt-label", text: "Prompt" }),
        document.createTextNode(prompt.stages[0].prompt),
      ]));
    }

    promptsEl.appendChild(el("section", { className: "round", id: prompt.id }, [head, grid]));

    if (multi) setPromptStage(prompt, clampStage(prompt, params.get(prompt.id)), false);
    else promptTiles.forEach(function (t) { t.setStage(1); });
  }

  function render() {
    document.title = manifest.title;
    document.getElementById("site-title").textContent = manifest.title;
    document.getElementById("site-subtitle").textContent = manifest.subtitle || "";
    var notesEl = document.getElementById("site-notes");
    (manifest.notes || []).forEach(function (n) { notesEl.appendChild(el("li", { text: n })); });

    var nav = el("nav", { className: "round-nav", "aria-label": "Prompts" });
    manifest.prompts.forEach(function (prompt) {
      nav.appendChild(el("a", { href: "#" + prompt.id, text: prompt.title }));
    });
    promptsEl.appendChild(nav);
    manifest.prompts.forEach(renderPrompt);
  }

  function observe() {
    if (!("IntersectionObserver" in window)) {
      tiles.forEach(function (t) { t.visible = true; t.maybeLoad(); });
      return;
    }
    var io = new IntersectionObserver(function (records) {
      records.forEach(function (r) {
        var tile = r.target.__tile;
        tile.visible = r.isIntersecting;
        if (tile.visible) tile.maybeLoad();
        else tile.scheduleUnload();
      });
    }, { rootMargin: "120px 0px" });
    tiles.forEach(function (t) { io.observe(t.node); });
  }

  pauseAll.addEventListener("change", function () {
    tiles.forEach(function (t) { if (pauseAll.checked) t.unload(); else t.maybeLoad(); });
  });

  render();
  observe();
})();
