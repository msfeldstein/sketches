# AGENTS.md

## Cursor Cloud specific instructions

This is a creative coding / generative art sketch collection using [canvas-sketch](https://github.com/mattdesl/canvas-sketch). Each `.js` file at the repo root and in `sketches/` is a standalone browser-based visual sketch.

### Running sketches

Run any sketch with the `canvas-sketch` CLI dev server:

```
canvas-sketch <sketch-file.js> --port 9966 --no-open
```

This starts a local Browserify-based dev server with hot reloading. The server serves the sketch at `http://127.0.0.1:9966/`.

- **2D canvas sketches** (e.g. `fire.js`, `joydivision.js`) use the `canvas-sketch` module pattern.
- **3D WebGL sketches** (e.g. `three-template.js`, `stormshard.js`) use Three.js and require a WebGL-capable browser.
- **Standalone sketches** (e.g. `circles.js`, `joydivision.js`) create their own canvas element directly (no `canvas-sketch` wrapper).

### Dependencies

- `canvas-sketch-cli` must be installed globally: `npm install -g canvas-sketch-cli`
- Project dependencies: `npm install` (uses `package-lock.json`)

### Known caveats

- The `xdg-user-dir` warning on startup is harmless — it just means the sketch output (exported frames) defaults to the current working directory instead of `~/Downloads`.
- `@tensorflow/tfjs-node` may fail to compile native bindings — this only affects the body-pix ML sketches and is not required for most sketches.
- There is no linter, test suite, or build command configured in `package.json`. The project is a collection of standalone creative coding experiments.
- Both `package-lock.json` and `yarn.lock` exist; prefer `npm install` to match the lockfile used by the update script.
