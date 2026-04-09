const { ipcRenderer } = window.require("electron");

const host = document.getElementById("webamp-host");

const WINDOW_PADDING = 0;
const FIT_DEBOUNCE_MS = 80;
const LAYOUT_POLL_MS = 400;

let fitTimer = null;
let lastRequestedSize = null;
let lastHadBounds = false;

async function loadWebamp() {
  const WebampModule = await import(
    "../node_modules/webamp/built/webamp.butterchurn-bundle.min.mjs"
  );

  return WebampModule.default || WebampModule;
}

function createWebamp(Webamp) {
  return new Webamp({
    enableHotkeys: true,
    enableDoubleSizeMode: true,
    windowLayout: {
      main: {
        position: { top: 0, left: 0 },
      },
      equalizer: {
        position: { top: 0, left: 0 },
        closed: true,
      },
      playlist: {
        position: { top: 0, left: 0 },
        closed: true,
      },
      milkdrop: {
        position: { top: 0, left: 550 },
        size: {
          extraWidth: 10,
          extraHeight: 8,
        },
        closed: false,
      },
    },
  });
}

function getVisibleRects(playerRoot) {
  const elements = [playerRoot, ...playerRoot.querySelectorAll("*")];

  return elements
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);

      return {
        rect,
        computedStyle,
      };
    })
    .filter(({ rect, computedStyle }) => {
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        computedStyle.display !== "none" &&
        computedStyle.visibility !== "hidden" &&
        computedStyle.opacity !== "0"
      );
    })
    .map(({ rect }) => rect);
}

function getPlayerBounds() {
  const playerRoot = document.getElementById("webamp");

  if (!playerRoot) {
    return null;
  }

  const candidateRects = getVisibleRects(playerRoot);

  if (candidateRects.length === 0) {
    return null;
  }

  const left = Math.min(...candidateRects.map((rect) => rect.left));
  const top = Math.min(...candidateRects.map((rect) => rect.top));
  const right = Math.max(...candidateRects.map((rect) => rect.right));
  const bottom = Math.max(...candidateRects.map((rect) => rect.bottom));

  return {
    width: Math.ceil(right - Math.min(left, 0)),
    height: Math.ceil(bottom - Math.min(top, 0)),
  };
}

async function fitWindowToPlayer() {
  const bounds = getPlayerBounds();

  if (!bounds) {
    if (lastHadBounds) {
      ipcRenderer.send("close-shell");
    }

    lastHadBounds = false;
    return;
  }

  lastHadBounds = true;

  const requestedSize = {
    width: Math.ceil(bounds.width + WINDOW_PADDING * 2),
    height: Math.ceil(bounds.height + WINDOW_PADDING * 2),
  };

  if (
    lastRequestedSize &&
    lastRequestedSize.width === requestedSize.width &&
    lastRequestedSize.height === requestedSize.height
  ) {
    return;
  }

  lastRequestedSize = requestedSize;

  host.style.width = `${requestedSize.width}px`;
  host.style.height = `${requestedSize.height}px`;

  await ipcRenderer.invoke("resize-to-player", requestedSize);
}

function scheduleFit() {
  window.clearTimeout(fitTimer);
  fitTimer = window.setTimeout(() => {
    fitWindowToPlayer().catch((error) => {
      console.error("Unable to resize the Webamp shell", error);
    });
  }, FIT_DEBOUNCE_MS);
}

function observeLayout() {
  const playerRoot = document.getElementById("webamp");

  if (!playerRoot) {
    return;
  }

  const mutationObserver = new MutationObserver(() => {
    scheduleFit();
  });

  mutationObserver.observe(playerRoot, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  const resizeObserver = new ResizeObserver(() => {
    scheduleFit();
  });

  resizeObserver.observe(playerRoot);
  resizeObserver.observe(document.body);

  window.addEventListener("resize", scheduleFit);
  window.setInterval(() => {
    scheduleFit();
  }, LAYOUT_POLL_MS);
}

async function boot() {
  try {
    const Webamp = await loadWebamp();
    const webamp = createWebamp(Webamp);

    await webamp.renderWhenReady(host);
    observeLayout();
    await fitWindowToPlayer();
    window.setTimeout(() => {
      scheduleFit();
    }, 250);
  } catch (error) {
    console.error("Unable to render Butterchurn-enabled Webamp", error);
  }
}

boot();
