// Gallery manifest.
//
// Each prompt has an ordered list of stages (the original prompt, then any
// follow-ups) and a list of model entries. A sketch lives at:
//   sketches/<prompt id>/stage-<n>/<entry id>/index.html   (n is 1-based)
// To add a follow-up, append a stage and drop each model's page in stage-<n>/.
// If a model has no sketch for some stages, list the ones it has in `stages`.
// `stageNotes` ({ <n>: "text" }) adds a note to that model's card on stage n.
window.GALLERY_MANIFEST = {
  title: "Model Sketchbook",
  subtitle:
    "Live generative canvas sketches from different AI models, given the same prompts.",
  notes: [
    "Gemini 4 Carbon on high reasoning failed or hung on every run, so its entries use medium reasoning.",
  ],
  prompts: [
    {
      id: "sand-iris",
      title: "Sand-particle iris",
      stages: [
        {
          label: "Original",
          prompt:
            "A particle system that renders grains of sand in an eyeball iris pattern. Just the iris, in 2D, realistic, particles only.",
        },
        {
          label: "Grayscale",
          prompt: "Make it a bit more stylized, grayscale, more dramatic.",
        },
        {
          label: "Animated",
          prompt: "Animate it slowly.",
        },
        {
          label: "Evolving",
          prompt: "Have the iris slowly animate all of its noise functions across a time dimension.",
        },
      ],
      entries: [
        { id: "opus-5-5", model: "Opus 5.5", detail: "Cursor" },
        {
          id: "astra-6-2-high", model: "Astra 6.2", detail: "High reasoning · Codex",
          stageNotes: { 4: "Revised after feedback that the motion was invisible" },
        },
        {
          id: "astra-6-2-none", model: "Astra 6.2", detail: "No reasoning · Codex",
          stageNotes: { 4: "Revised after feedback that the motion was invisible" },
        },
      ],
    },
    {
      id: "glowing-tree",
      title: "Glowing tree",
      stages: [
        {
          label: "Original",
          prompt: "A glowing tree, bright blue under a large full moon with shooting stars.",
        },
      ],
      entries: [
        { id: "opus-5-5-a", model: "Opus 5.5", detail: "Take A · Cursor" },
        { id: "opus-5-5-b", model: "Opus 5.5", detail: "Take B · Cursor" },
        { id: "astra-6-2-high", model: "Astra 6.2", detail: "High reasoning · Codex" },
        { id: "gemini-4-carbon-medium", model: "Gemini 4 Carbon (medium)" },
      ],
    },
  ],
};
