import * as THREE from "three";
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import countrySnapshot from "../../data/countries.json";
import type { Feature, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

export type EarthLocation = {
  name: string;
  latitude: number;
  longitude: number;
};
export type EarthCountry = EarthLocation & { id: string };
type CountryFeature = Feature<Geometry, { name: string }>;
type EarthOptions = {
  container: HTMLElement;
  onSelect: (place: EarthLocation) => void;
  onHover: (name: string) => void;
  onContextLost: () => void;
  onRotationChange: (rotating: boolean) => void;
};

/** Lifecycle-safe React adapter based on the existing globe's sphere, marker and controls.
 * Uses a historical NASA composite; scene lighting is illustrative, never live sunlight.
 */
export async function createEarth(options: EarthOptions) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true });
  if (!context) throw new Error("WebGL 2 is unavailable");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x071019, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  canvas.tabIndex = 0;
  canvas.dataset.testid = "home-globe-canvas";
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    "Interactive Earth. Drag or use arrow keys to rotate; plus and minus zoom. Select a country using the country chooser below.",
  );
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
  camera.position.z = 3.1;
  const root = new THREE.Group();
  scene.add(root);
  scene.add(new THREE.AmbientLight(0xffffff, 1.3));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-3, 2, 4);
  scene.add(sun);
  let texture: THREE.Texture;
  try {
    texture = await new THREE.TextureLoader().loadAsync(
      "/images/earth-space/earth-texture.webp",
    );
  } catch (error) {
    renderer.dispose();
    renderer.forceContextLoss();
    throw error;
  }
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 48),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 1,
      metalness: 0,
    }),
  );
  root.add(earth);
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.014, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0x8bcbea,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.2,
    }),
  );
  root.add(atmosphere);
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.016, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xa9f1d4 }),
  );
  marker.visible = false;
  root.add(marker);
  let outline: THREE.LineSegments | undefined;
  const topology = world as unknown as Topology<{
    countries: GeometryCollection;
  }>;
  const countries = feature(topology, topology.objects.countries)
    .features as CountryFeature[];
  const records: EarthCountry[] = countrySnapshot.countries
    .map((country) => ({
      id: country.ccn3 || country.cca3,
      name: country.name.common,
      latitude: country.latlng[0],
      longitude: country.latlng[1],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let disposed = false;
  let rotating = false;
  let visible = true;
  let animation = 0;
  let lastFrame = 0;
  let hovering = "";
  let lastHover = 0;
  let drag: {
    x: number;
    y: number;
    initialX: number;
    initialY: number;
    pointer: number;
  } | null = null;
  const cleanups: Array<() => void> = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function position(latitude: number, longitude: number, radius = 1.02) {
    const lat = THREE.MathUtils.degToRad(latitude),
      lon = THREE.MathUtils.degToRad(longitude);
    return new THREE.Vector3(
      Math.cos(lat) * Math.cos(lon),
      Math.sin(lat),
      -Math.cos(lat) * Math.sin(lon),
    ).multiplyScalar(radius);
  }
  function render() {
    if (!disposed) renderer.render(scene, camera);
  }
  function pause() {
    rotating = false;
    cancelAnimationFrame(animation);
    animation = 0;
    options.onRotationChange(false);
  }
  function tick(time: number) {
    animation = 0;
    if (disposed || !rotating || reduced.matches || !visible || document.hidden)
      return;
    const elapsed = Math.min((time - lastFrame) / 1000 || 0, 0.05);
    lastFrame = time;
    root.rotation.y += elapsed * 0.08;
    render();
    animation = requestAnimationFrame(tick);
  }
  function resumeIfVisible() {
    if (
      rotating &&
      !reduced.matches &&
      visible &&
      !document.hidden &&
      !animation
    ) {
      lastFrame = performance.now();
      animation = requestAnimationFrame(tick);
    }
  }
  function setRotation(next: boolean) {
    if (!next || reduced.matches) {
      pause();
      return;
    }
    rotating = true;
    options.onRotationChange(true);
    resumeIfVisible();
  }
  function zoom(delta: number) {
    camera.position.z = Math.max(
      2.35,
      Math.min(5.5, camera.position.z + delta),
    );
    render();
  }
  function highlight(country?: CountryFeature) {
    if (outline) {
      root.remove(outline);
      outline.geometry.dispose();
      (outline.material as THREE.Material).dispose();
      outline = undefined;
    }
    if (
      !country ||
      !["Polygon", "MultiPolygon"].includes(country.geometry.type)
    )
      return;
    const polygons =
      country.geometry.type === "Polygon"
        ? [country.geometry.coordinates]
        : country.geometry.type === "MultiPolygon"
          ? country.geometry.coordinates
          : [];
    const vertices: number[] = [];
    for (const polygon of polygons)
      for (const ring of polygon)
        for (let i = 1; i < ring.length; i++) {
          const start = position(ring[i - 1][1], ring[i - 1][0], 1.005);
          const end = position(ring[i][1], ring[i][0], 1.005);
          vertices.push(start.x, start.y, start.z, end.x, end.y, end.z);
        }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    outline = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: 0xb9ffe4 }),
    );
    root.add(outline);
  }
  function select(place: EarthLocation | null | undefined) {
    pause();
    if (!place) {
      marker.visible = false;
      render();
      return;
    }
    marker.position.copy(position(place.latitude, place.longitude));
    marker.visible = true;
    root.rotation.set(
      THREE.MathUtils.degToRad(place.latitude),
      -THREE.MathUtils.degToRad(place.longitude) - Math.PI / 2,
      0,
    );
    const record = records.find((record) => record.name === place.name);
    highlight(
      record
        ? countries.find(
            (country) => String(country.id).padStart(3, "0") === record.id,
          )
        : undefined,
    );
    render();
  }
  function hit(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const result = raycaster.intersectObject(earth)[0];
    if (!result) return null;
    const point = earth.worldToLocal(result.point.clone()).normalize();
    const latitude = THREE.MathUtils.radToDeg(Math.asin(point.y));
    const longitude = THREE.MathUtils.radToDeg(Math.atan2(-point.z, point.x));
    const country = countries.find((candidate) =>
      geoContains(candidate, [longitude, latitude]),
    );
    if (!country) return null;
    const record = records.find(
      (candidate) => candidate.id === String(country.id).padStart(3, "0"),
    );
    return {
      country,
      place: {
        name: record?.name ?? country.properties.name,
        latitude,
        longitude,
      },
    };
  }
  const down = (event: PointerEvent) => {
    if (event.button !== 0) return;
    pause();
    drag = {
      x: event.clientX,
      y: event.clientY,
      initialX: event.clientX,
      initialY: event.clientY,
      pointer: event.pointerId,
    };
    canvas.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent) => {
    if (drag && event.pointerId === drag.pointer) {
      root.rotation.y += (event.clientX - drag.x) * 0.007;
      root.rotation.x = Math.max(
        -1.5,
        Math.min(1.5, root.rotation.x + (event.clientY - drag.y) * 0.007),
      );
      drag.x = event.clientX;
      drag.y = event.clientY;
      render();
      return;
    }
    if (event.pointerType !== "mouse" || performance.now() - lastHover < 100)
      return;
    lastHover = performance.now();
    const result = hit(event);
    const name = result?.place.name ?? "";
    if (name === hovering) return;
    hovering = name;
    options.onHover(name);
    highlight(result?.country);
    render();
  };
  const up = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const clicked =
      Math.hypot(event.clientX - drag.initialX, event.clientY - drag.initialY) <
      6;
    drag = null;
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    if (clicked) {
      const result = hit(event);
      if (result) {
        select(result.place);
        options.onSelect(result.place);
      }
    }
  };
  const cancel = () => {
    drag = null;
  };
  const leave = () => {
    options.onHover("");
    hovering = "";
  };
  const keys = (event: KeyboardEvent) => {
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "+",
        "=",
        "-",
        "Home",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    pause();
    if (event.key === "ArrowLeft") root.rotation.y -= 0.15;
    if (event.key === "ArrowRight") root.rotation.y += 0.15;
    if (event.key === "ArrowUp") root.rotation.x -= 0.15;
    if (event.key === "ArrowDown") root.rotation.x += 0.15;
    if (event.key === "+" || event.key === "=") zoom(-0.25);
    if (event.key === "-") zoom(0.25);
    if (event.key === "Home") reset();
    root.rotation.x = Math.max(-1.5, Math.min(1.5, root.rotation.x));
    render();
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    pause();
    options.onContextLost();
  };
  const motionChange = () => {
    if (reduced.matches) pause();
  };
  function listen<K extends keyof HTMLElementEventMap>(
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
  ) {
    canvas.addEventListener(type, handler);
    cleanups.push(() => canvas.removeEventListener(type, handler));
  }
  listen("pointerdown", down);
  listen("pointermove", move);
  listen("pointerup", up);
  listen("pointercancel", cancel);
  listen("pointerleave", leave);
  listen("keydown", keys);
  canvas.addEventListener("webglcontextlost", contextLost);
  cleanups.push(() =>
    canvas.removeEventListener("webglcontextlost", contextLost),
  );
  reduced.addEventListener("change", motionChange);
  document.addEventListener("visibilitychange", resumeIfVisible);
  const resize = new ResizeObserver(() => {
    const width = options.container.clientWidth || 400;
    const height = options.container.clientHeight || width;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  });
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    resumeIfVisible();
  });
  options.container.replaceChildren(canvas);
  resize.observe(options.container);
  intersection.observe(options.container);
  function reset() {
    pause();
    root.rotation.set(0.12, -2.1, 0);
    camera.position.z = 3.1;
    // Reset the camera and rotation, preserving the selected geographic location.
    render();
  }
  reset();
  return {
    countries: records,
    select,
    zoom,
    reset,
    setRotation,
    dispose() {
      if (disposed) return;
      pause();
      disposed = true;
      resize.disconnect();
      intersection.disconnect();
      reduced.removeEventListener("change", motionChange);
      document.removeEventListener("visibilitychange", resumeIfVisible);
      cleanups.forEach((cleanup) => cleanup());
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.LineSegments
        ) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

export type EarthController = Awaited<ReturnType<typeof createEarth>>;
