const canvasSketch = require("canvas-sketch");
const THREE = require("three");

const settings = {
  dimensions: [1024, 1024],
  context: "webgl",
  animate: true,
};

const reticle = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgb(200,200,200)";
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 30;
  ctx.arc(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 4,
    0,
    2 * Math.PI
  );

  ctx.fill();
  const dataUrl = canvas.toDataURL();
  return dataUrl;
};

const sketch = ({ canvas }) => {
  canvas.style.cursor = `url("${reticle()}") 64 64, auto`;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    preserveDrawingBuffer: true,
    antialias: true,
  });
  renderer.autoClear = false;

  const paintScene = new THREE.Scene();
  const renderScene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(
    -canvas.width / 2,
    canvas.width / 2,
    canvas.height / 2,
    -canvas.height / 2,
    0.1,
    10
  );
  camera.position.set(0, 0, 1);
  camera.lookAt(new THREE.Vector3());

  const target = new THREE.WebGLRenderTarget(canvas.width, canvas.height);
  const plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(canvas.width, canvas.height),
    new THREE.MeshBasicMaterial({ map: target.texture })
  );

  const cursorSprite = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(128, 128),
    new THREE.MeshBasicMaterial({ color: "blue" })
  );

  canvas.addEventListener("mousemove", (e) => {
    console.log(e.clientX);
    cursorSprite.position.set(
      -canvas.width / 2 + e.clientX,
      canvas.height / 2 - e.clientY,
      0
    );
  });

  paintScene.add(cursorSprite);
  renderScene.add(plane);

  console.log(`url("${reticle()}")`);

  return ({ context, width, height }) => {
    renderer.setRenderTarget(target);
    renderer.render(paintScene, camera);
    renderer.setRenderTarget(null);
    renderer.render(renderScene, camera);
  };
};

canvasSketch(sketch, settings);
