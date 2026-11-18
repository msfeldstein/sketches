// Gallery manifest. To add a sketch, drop a self-contained page at
// sketches/<round-id>/<entry-id>/index.html and add an entry below.
// To add a round, append a new object to `rounds`.
window.GALLERY_MANIFEST = {
  title: "Model Sketchbook",
  subtitle:
    "Live generative canvas sketches from different AI models, given the same prompts.",
  notes: [
    "Gemini 4 Carbon was also part of this test but failed every run, so it has no entries.",
  ],
  rounds: [
    {
      id: "r1-sand-iris",
      title: "Round 1 · Sand-particle iris",
      prompt:
        "A particle system that renders grains of sand in an eyeball iris pattern. Just the iris, in 2D, realistic, particles only.",
      entries: [
        { id: "opus-5-5", model: "Opus 5.5", detail: "Cursor" },
        { id: "astra-6-2-high", model: "Astra 6.2", detail: "High reasoning · Codex" },
        { id: "astra-6-2-none", model: "Astra 6.2", detail: "No reasoning · Codex" },
      ],
    },
    {
      id: "r2-sand-iris-grayscale",
      title: "Round 2 · Stylized grayscale iris",
      prompt: "Follow-up: make it a bit more stylized, grayscale, more dramatic.",
      entries: [
        { id: "opus-5-5", model: "Opus 5.5", detail: "Cursor" },
        { id: "astra-6-2-high", model: "Astra 6.2", detail: "High reasoning · Codex" },
        { id: "astra-6-2-none", model: "Astra 6.2", detail: "No reasoning · Codex" },
      ],
    },
    {
      id: "r3-glowing-tree",
      title: "Round 3 · Glowing tree",
      prompt: "A glowing tree, bright blue under a large full moon with shooting stars.",
      entries: [
        { id: "opus-5-5-a", model: "Opus 5.5", detail: "Take A · Cursor" },
        { id: "opus-5-5-b", model: "Opus 5.5", detail: "Take B · Cursor" },
        { id: "astra-6-2-high", model: "Astra 6.2", detail: "High reasoning · Codex" },
      ],
    },
  ],
};
