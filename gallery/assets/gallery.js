(function () {
  "use strict";

  var manifest = window.GALLERY_MANIFEST;
  var roundsEl = document.getElementById("rounds");
  var pauseAll = document.getElementById("pause-all");
  var toastEl = document.getElementById("toast");
  // Offscreen tiles are torn down after this delay so quick scroll-bys don't thrash.
  var UNLOAD_DELAY_MS = 800;
  var tiles = [];

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

  function sketchPath(round, entry) {
    return "sketches/" + round.id + "/" + entry.id + "/";
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

  function Tile(round, entry) {
    var self = this;
    var path = sketchPath(round, entry);
    var url = absoluteUrl(path);
    var label = entry.model + (entry.detail ? " — " + entry.detail : "");
    var title = round.title + " · " + label;

    this.path = path;
    this.title = title;
    this.visible = false;
    this.iframe = null;
    this.unloadTimer = null;

    this.stage = el("div", { className: "stage" }, [
      el("div", { className: "stage-placeholder", text: "Paused" }),
    ]);

    var fullLink = el("a", {
      className: "btn", href: path, target: "_blank", rel: "noopener",
      title: "Open full-screen in a new tab", text: "Full screen ↗",
    });
    var reloadBtn = el("button", { className: "btn", type: "button", title: "Restart this sketch", text: "Restart" });
    reloadBtn.addEventListener("click", function () { self.unload(); self.maybeLoad(); });

    var snippet = embedSnippet(url, title);
    var input = el("input", { className: "embed-input", type: "text", readonly: "", value: snippet, "aria-label": "Embed code for " + label });
    input.addEventListener("focus", function () { input.select(); });
    var copyBtn = el("button", { className: "btn btn-primary", type: "button", text: "Copy embed" });
    copyBtn.addEventListener("click", function () { copyText(snippet, input); });

    this.node = el("article", { className: "tile" }, [
      el("a", { className: "stage-link", href: path, target: "_blank", rel: "noopener", "aria-label": "Open " + label + " full screen" }, [this.stage]),
      el("div", { className: "tile-body" }, [
        el("div", { className: "tile-head" }, [
          el("h3", { className: "model", text: entry.model }),
          entry.detail ? el("span", { className: "detail", text: entry.detail }) : null,
        ]),
        el("div", { className: "actions" }, [fullLink, reloadBtn, copyBtn]),
        input,
      ]),
    ]);
  }

  Tile.prototype.maybeLoad = function () {
    clearTimeout(this.unloadTimer);
    if (this.iframe || !this.visible || pauseAll.checked) return;
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

  function render() {
    document.title = manifest.title;
    document.getElementById("site-title").textContent = manifest.title;
    document.getElementById("site-subtitle").textContent = manifest.subtitle || "";
    var notesEl = document.getElementById("site-notes");
    (manifest.notes || []).forEach(function (n) { notesEl.appendChild(el("li", { text: n })); });

    var nav = el("nav", { className: "round-nav", "aria-label": "Rounds" });
    manifest.rounds.forEach(function (round) {
      nav.appendChild(el("a", { href: "#" + round.id, text: round.title }));
    });
    roundsEl.appendChild(nav);

    manifest.rounds.forEach(function (round) {
      var grid = el("div", { className: "grid" });
      round.entries.forEach(function (entry) {
        var tile = new Tile(round, entry);
        tile.node.__tile = tile;
        tiles.push(tile);
        grid.appendChild(tile.node);
      });
      roundsEl.appendChild(el("section", { className: "round", id: round.id }, [
        el("div", { className: "round-head" }, [
          el("h2", { text: round.title }),
          round.prompt ? el("p", { className: "prompt" }, [el("span", { className: "prompt-label", text: "Prompt" }), document.createTextNode(round.prompt)]) : null,
        ]),
        grid,
      ]));
    });
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
