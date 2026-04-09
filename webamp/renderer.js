const { ipcRenderer } = require("electron");
const WebampModule = require("webamp");

const Webamp = WebampModule.default || WebampModule;
const host = document.getElementById("webamp-host");

const WINDOW_PADDING = 12;

const webamp = new Webamp({
  enableHotkeys: true,
  enableDoubleSizeMode: true,
});

function getPlayerBounds() {
  const playerRoot = document.getElementById("webamp");

  if (!playerRoot) {
    return null;
  }

  const candidateRects = Array.from(playerRoot.querySelectorAll("*"))
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);

  if (candidateRects.length === 0) {
    const rect = playerRoot.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    return {
      width: rect.width,
      height: rect.height,
    };
  }

  const left = Math.min(...candidateRects.map((rect) => rect.left));
  const top = Math.min(...candidateRects.map((rect) => rect.top));
  const right = Math.max(...candidateRects.map((rect) => rect.right));
  const bottom = Math.max(...candidateRects.map((rect) => rect.bottom));

  return {
    width: right - left,
    height: bottom - top,
  };
}

async function fitWindowToPlayer() {
  const bounds = getPlayerBounds();

  if (!bounds) {
    return;
  }

  await ipcRenderer.invoke("resize-to-player", {
    width: Math.ceil(bounds.width + WINDOW_PADDING * 2),
    height: Math.ceil(bounds.height + WINDOW_PADDING * 2),
  });
}

async function boot() {
  try {
    await webamp.renderWhenReady(host);
    await fitWindowToPlayer();
    window.setTimeout(() => {
      fitWindowToPlayer().catch((error) => {
        console.error("Unable to resize the Webamp window", error);
      });
    }, 250);
  } catch (error) {
    console.error("Unable to render Webamp", error);
  }
}

boot();
