import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { planets, modelPosition } from "./planets";

export type SolarState = {
  days: number;
  selected: string;
  orbits: boolean;
  labels: boolean;
};
/** Demand-rendered educational scene; the React clock is the sole source of time. */
export function createSolar(
  container: HTMLElement,
  onSelect: (slug: string) => void,
  onLost: () => void,
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { antialias: true });
  if (!context) throw new Error("WebGL unavailable");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x050d17);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 300);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.minDistance = 2;
  controls.maxDistance = 200;
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0xffdc8c }),
  );
  scene.add(sun, new THREE.AmbientLight(0xffffff, 1.5));
  scene.add(new THREE.PointLight(0xffe4bd, 100, 0, 1));
  const bodies: THREE.Mesh[] = [],
    paths: THREE.LineLoop[] = [],
    labels: HTMLSpanElement[] = [];
  const sunLabel = document.createElement("span");
  sunLabel.className = "solar-label";
  sunLabel.textContent = "Sun";
  container.append(sunLabel);
  for (const [index, planet] of planets.entries()) {
    const size = 0.22 + Math.sqrt(planet.diameter / 142984) * 0.85;
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(size, 32, 24),
      new THREE.MeshStandardMaterial({ color: planet.color, roughness: 0.85 }),
    );
    body.userData.slug = planet.slug;
    scene.add(body);
    bodies.push(body);
    if (planet.rings) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(
          size * 1.3,
          size * (planet.slug === "saturn" ? 2 : 1.6),
          64,
        ),
        new THREE.MeshBasicMaterial({
          color: planet.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: planet.slug === "saturn" ? 0.65 : 0.22,
        }),
      );
      ring.rotation.x = Math.PI / 2.5;
      body.add(ring);
    }
    const radius = 3.5 + index * 2.5;
    const points = Array.from(
      { length: 160 },
      (_, i) =>
        new THREE.Vector3(
          Math.cos((i / 160) * Math.PI * 2) * radius,
          0,
          Math.sin((i / 160) * Math.PI * 2) * radius,
        ),
    );
    const path = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 0x324957 }),
    );
    scene.add(path);
    paths.push(path);
    const label = document.createElement("span");
    label.className = "solar-label";
    label.textContent = planet.name;
    container.append(label);
    labels.push(label);
  }
  canvas.tabIndex = 0;
  canvas.dataset.testid = "solar-canvas";
  canvas.setAttribute(
    "aria-label",
    "Solar System model. Drag to rotate, scroll to zoom. Use the planet selectors and camera buttons for keyboard access.",
  );
  canvas.setAttribute("role", "img");
  container.prepend(canvas);
  let state: SolarState = {
    days: 0,
    selected: "earth",
    orbits: true,
    labels: true,
  };
  let disposed = false;
  let overview = true;
  function fitOverview() {
    const halfAngle = Math.atan(
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
        Math.min(camera.aspect, 1),
    );
    // Fit a sphere enclosing every orbit, with room for planet labels.
    const distance = (24 / Math.sin(halfAngle)) * 1.06;
    controls.target.set(0, 0, 0);
    camera.position.set(0, 0.66, 0.75).normalize().multiplyScalar(distance);
    controls.update();
  }
  const leaveOverview = () => {
    overview = false;
  };
  function render() {
    if (disposed) return;
    bodies.forEach((body, i) => {
      const p = modelPosition(i, state.days);
      body.position.set(p.x, 0, p.z);
    });
    paths.forEach((path) => {
      path.visible = state.orbits;
    });
    renderer.render(scene, camera);
    const sunPosition = sun.position.clone().project(camera);
    sunLabel.hidden = !state.labels || sunPosition.z > 1 || sunPosition.z < -1;
    sunLabel.style.left = `${(sunPosition.x + 1) * 50}%`;
    sunLabel.style.top = `${(1 - sunPosition.y) * 50 + 5}%`;
    canvas.dataset.camera = camera.position
      .toArray()
      .map((value) => value.toFixed(3))
      .join(",");
    canvas.dataset.modelDay = String(state.days);
    bodies.forEach((body, i) => {
      const projected = body.position.clone().project(camera);
      labels[i].hidden = !state.labels || projected.z > 1 || projected.z < -1;
      labels[i].style.left = `${(projected.x + 1) * 50}%`;
      labels[i].style.top = `${(1 - projected.y) * 50 + 5}%`;
    });
  }
  function resize() {
    const w = container.clientWidth,
      h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (overview) fitOverview();
    render();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  controls.addEventListener("change", render);
  controls.addEventListener("start", leaveOverview);
  const ray = new THREE.Raycaster();
  let down = { x: 0, y: 0 };
  const pointerDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY };
  };
  const pointerUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
    const rect = canvas.getBoundingClientRect();
    ray.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = ray.intersectObjects(bodies, false)[0];
    if (hit) onSelect(String(hit.object.userData.slug));
  };
  const lost = (e: Event) => {
    e.preventDefault();
    onLost();
  };
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("webglcontextlost", lost);
  resize();
  return {
    update(next: SolarState) {
      state = next;
      render();
    },
    focus() {
      overview = false;
      const index = planets.findIndex((p) => p.slug === state.selected);
      const body = bodies[index];
      if (!body) return;
      controls.target.copy(body.position);
      camera.position.copy(body.position).add(new THREE.Vector3(0, 4, 6));
      controls.update();
      render();
    },
    reset() {
      overview = true;
      fitOverview();
      render();
    },
    zoom(factor: number) {
      overview = false;
      camera.position
        .sub(controls.target)
        .multiplyScalar(factor)
        .add(controls.target);
      controls.update();
      render();
    },
    rotate() {
      overview = false;
      const delta = camera.position.clone().sub(controls.target);
      delta.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 8);
      camera.position.copy(controls.target).add(delta);
      controls.update();
      render();
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      controls.removeEventListener("change", render);
      controls.removeEventListener("start", leaveOverview);
      controls.dispose();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("webglcontextlost", lost);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      labels.forEach((label) => label.remove());
      sunLabel.remove();
    },
  };
}
export type SolarController = ReturnType<typeof createSolar>;
