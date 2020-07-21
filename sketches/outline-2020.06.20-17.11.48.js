const canvasSketch = require("canvas-sketch");
global.THREE = require("three");

require("three/examples/js/controls/OrbitControls");

const settings = {
  animate: true,
  context: "webgl",
  attributes: { antialias: true, stencil: true },
};

const sketch = ({ context }) => {
  const renderer = new THREE.WebGLRenderer({
    context,
    stencil: true,
  });
  const gl = renderer.getContext();
  renderer.autoClear = false;

  renderer.setClearColor("#000", 1);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());

  const controls = new THREE.OrbitControls(camera, context.canvas);
  const scene = new THREE.Scene();

  const canvasPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 1.5, 2, 2),
    new THREE.MeshPhysicalMaterial({
      color: "white",
      roughness: 0.75,
      side: THREE.DoubleSide,
      flatShading: true,
    })
  );
  scene.add(canvasPlane);

  const charcoal = new THREE.Mesh(
    new THREE.SphereBufferGeometry(0.4, 32, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0x333,
    })
  );
  scene.add(charcoal);

  const stencilCam = new THREE.OrthographicCamera(
    -1,
    1,
    -0.75,
    0.75,
    0.01,
    1000
  );
  stencilCam.position.setZ(-0.001);
  const helper = new THREE.CameraHelper(stencilCam);
  scene.add(helper);
  scene.add(new THREE.AmbientLight("#333"));

  const light = new THREE.PointLight("#fff", 2, 15.5);
  light.position.set(2, 2, -4).multiplyScalar(1.5);
  scene.add(light);

  const blitScene = new THREE.Scene();
  const blitPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      color: 0xff0000,
      depthTest: false,
      depthWrite: false,
    })
  );
  blitScene.add(blitPanel);
  blitPanel.rotateX(Math.PI / 2);
  const blitCamera = new THREE.OrthographicCamera(-0.5, 0.5, -0.5, 0.5, 0.1, 2);
  blitCamera.position.set(0, 1, 0);
  blitCamera.lookAt(new THREE.Vector3());

  const stencilRenderTarget = new THREE.WebGLRenderTarget(200, 150, {
    stencilBuffer: true,
  });

  return {
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      camera.aspect = viewportWidth / viewportHeight / 2;
      camera.updateProjectionMatrix();
    },
    render({ time, width, height }) {
      renderer.setRenderTarget(null);
      // Clear
      renderer.setViewport(0, 0, width, height);
      renderer.setScissor(0, 0, width, height);
      renderer.clear(true, true, true);

      // Update scene
      charcoal.position.setZ(Math.sin(time) - 0.5);
      controls.update();

      // 3d View Render

      gl.disable(gl.STENCIL_TEST);
      gl.stencilMask(0x00);
      renderer.setScissorTest(true);
      renderer.setViewport(0, 0, width / 2, height);
      renderer.setScissor(0, 0, width / 2, height);
      renderer.render(scene, camera);

      renderer.setViewport(width / 2, 0, width / 2, height / 2);
      renderer.setScissor(width / 2, 0, width / 2, height / 2);

      renderer.setRenderTarget(stencilRenderTarget);
      gl.enable(gl.STENCIL_TEST);
      gl.stencilMask(0xff);
      gl.clearStencil(0);
      gl.clear(gl.STENCIL_BUFFER_BIT);
      gl.stencilFunc(gl.ALWAYS, 1, 1);
      gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
      renderer.render(scene, stencilCam);

      

      gl.enable(gl.STENCIL_TEST);

      gl.stencilFunc(gl.EQUAL, 1, 0xff);
      // Since this draw should be reading, not writing, the stencil buffer, we mask it to 0 so nothing
      // gets written over
      // gl.stencilMask(0x00);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      renderer.setViewport(width / 2, height / 2, width / 2, height / 2);
      renderer.setScissor(width / 2, height / 2, width / 2, height / 2);
      renderer.render(blitScene, blitCamera);
    },

    unload() {
      controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);
