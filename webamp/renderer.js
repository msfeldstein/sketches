const WebampModule = require("webamp");

const Webamp = WebampModule.default || WebampModule;

const statusMessage = document.getElementById("status-message");
const replaceButton = document.getElementById("replace-button");
const appendButton = document.getElementById("append-button");
const replaceInput = document.getElementById("replace-input");
const appendInput = document.getElementById("append-input");
const host = document.getElementById("webamp-host");

const supportedAudioExtensions = /\.(aac|aiff?|alac|flac|m4a|mp3|ogg|opus|wav|webm)$/i;

const webamp = new Webamp({
  enableHotkeys: true,
});

let playerReady = false;
let hasLoadedTracks = false;

function setStatus(message, tone = "info") {
  statusMessage.textContent = message;
  statusMessage.dataset.tone = tone;
}

function setButtonsDisabled(disabled) {
  replaceButton.disabled = disabled;
  appendButton.disabled = disabled;
}

function toTrack(file) {
  return {
    blob: file,
    defaultName: file.name.replace(/\.[^.]+$/, "") || file.name,
  };
}

function getAudioFiles(fileList) {
  return Array.from(fileList).filter((file) => {
    return file.type.startsWith("audio/") || supportedAudioExtensions.test(file.name);
  });
}

async function importFiles(fileList, mode) {
  if (!playerReady) {
    setStatus("Webamp is still starting. Try again in a moment.", "warning");
    return;
  }

  const files = getAudioFiles(fileList);

  if (files.length === 0) {
    setStatus("No supported audio files were selected.", "warning");
    return;
  }

  const tracks = files.map(toTrack);
  const action = mode === "append" && hasLoadedTracks ? "append" : "replace";

  try {
    if (action === "append") {
      await webamp.appendTracks(tracks);
      setStatus(`Queued ${tracks.length} more track${tracks.length === 1 ? "" : "s"}.`, "success");
    } else {
      await webamp.setTracksToPlay(tracks);
      hasLoadedTracks = true;
      setStatus(`Loaded ${tracks.length} track${tracks.length === 1 ? "" : "s"} into Webamp.`, "success");
      return;
    }

    hasLoadedTracks = true;
  } catch (error) {
    console.error("Unable to import tracks into Webamp", error);
    setStatus("Webamp could not load those files. Check the terminal for details.", "error");
  }
}

function bindFilePicker(button, input, mode) {
  button.addEventListener("click", () => {
    input.click();
  });

  input.addEventListener("change", async (event) => {
    const { files } = event.target;

    if (!files || files.length === 0) {
      return;
    }

    await importFiles(files, mode);
    input.value = "";
  });
}

async function boot() {
  setButtonsDisabled(true);
  setStatus("Starting Webamp…");

  try {
    await webamp.renderWhenReady(host);
    playerReady = true;
    setButtonsDisabled(false);
    setStatus("Webamp is ready. Open songs from the desktop VM to start listening.", "success");
  } catch (error) {
    console.error("Unable to render Webamp", error);
    setStatus("Webamp failed to render. Check the terminal for details.", "error");
  }
}

bindFilePicker(replaceButton, replaceInput, "replace");
bindFilePicker(appendButton, appendInput, "append");
boot();
