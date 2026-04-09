const { ipcRenderer } = window.require("electron");

const host = document.getElementById("webamp-host");

const INTERACTION_POLL_MS = 120;
const DESKTOP_OFFSET_X = 32;
const DESKTOP_OFFSET_Y = 32;

let ignoreMouseEvents = false;
let interactionIntervalId = null;

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
        closed: false,
      },
      playlist: {
        position: { top: 232, left: 0 },
        closed: false,
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

function pinWebampCluster() {
  const centeringLayer =
    document.getElementById("webamp")?.firstElementChild?.firstElementChild
      ?.firstElementChild;

  if (!centeringLayer) {
    return;
  }

  centeringLayer.style.transform = `translate(${DESKTOP_OFFSET_X}px, ${DESKTOP_OFFSET_Y}px)`;
}

function getInteractiveRects() {
  const selectors = ["#webamp .window", "#webamp-context-menu", ".context-menu"];
  const interactiveElements = document.querySelectorAll(selectors.join(", "));

  return Array.from(interactiveElements)
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return {
        rect,
        style,
      };
    })
    .filter(({ rect, style }) => {
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0"
      );
    })
    .map(({ rect }) => rect);
}

async function syncMousePassthrough() {
  const windowBounds = await ipcRenderer.invoke("get-bounds");

  if (!windowBounds) {
    return;
  }

  const cursorPoint = await ipcRenderer.invoke("get-cursor-screen-point");
  const cursorWithinWindow =
    cursorPoint.x >= windowBounds.x &&
    cursorPoint.x <= windowBounds.x + windowBounds.width &&
    cursorPoint.y >= windowBounds.y &&
    cursorPoint.y <= windowBounds.y + windowBounds.height;

  if (!cursorWithinWindow) {
    return;
  }

  const localPoint = {
    x: cursorPoint.x - windowBounds.x,
    y: cursorPoint.y - windowBounds.y,
  };

  const overInteractiveRegion = getInteractiveRects().some((rect) => {
    return (
      localPoint.x >= rect.left &&
      localPoint.x <= rect.right &&
      localPoint.y >= rect.top &&
      localPoint.y <= rect.bottom
    );
  });

  if (overInteractiveRegion && ignoreMouseEvents) {
    ipcRenderer.send("set-ignore-mouse-events", false);
    ignoreMouseEvents = false;
  } else if (!overInteractiveRegion && !ignoreMouseEvents) {
    ipcRenderer.send("set-ignore-mouse-events", true);
    ignoreMouseEvents = true;
  }
}

function startDesktopOverlayInteractionLoop() {
  window.clearInterval(interactionIntervalId);
  interactionIntervalId = window.setInterval(() => {
    syncMousePassthrough().catch((error) => {
      console.error("Unable to update desktop overlay interaction mask", error);
    });
  }, INTERACTION_POLL_MS);
}

function setupShellLifecycle(webamp) {
  const unsubscribeOnMinimize = webamp.onMinimize(() => {
    ipcRenderer.send("minimize-shell");
  });

  const unsubscribeOnClose = webamp.onClose(() => {
    ipcRenderer.send("close-shell");
    unsubscribeOnMinimize();
    unsubscribeOnClose();
  });
}

async function boot() {
  try {
    const Webamp = await loadWebamp();
    const webamp = createWebamp(Webamp);

    await webamp.renderWhenReady(host);
    pinWebampCluster();
    setupShellLifecycle(webamp);
    startDesktopOverlayInteractionLoop();
    await syncMousePassthrough();
  } catch (error) {
    console.error("Unable to render desktop-overlay Webamp", error);
  }
}

boot();
