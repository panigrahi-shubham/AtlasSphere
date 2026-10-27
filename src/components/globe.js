import * as THREE from 'three';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { weatherCondition } from '../utils/weatherCodes.js';

export function createGlobe({ container, features }) {
  // Test capability before constructing the renderer: no uncaught WebGL errors.
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
  if (!context) throw new Error('WebGL 2 unavailable');
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  canvas.dataset.testid = 'globe-renderer'; canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Interactive Earth globe. Arrow keys rotate, plus and minus zoom.');
  container.replaceChildren(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50); camera.position.z = 3.7;
  const root = new THREE.Group(); scene.add(root);
  // A bundled vector atlas becomes the texture; no external image requests.
  const textureCanvas = document.createElement('canvas'); textureCanvas.width = 2048; textureCanvas.height = 1024;
  const ctx = textureCanvas.getContext('2d');
  ctx.fillStyle = '#102f49'; ctx.fillRect(0, 0, 2048, 1024);
  const projection = geoEquirectangular().translate([1024, 512]).scale(2048 / (2 * Math.PI));
  const draw = geoPath(projection, ctx);
  features.forEach(f => { ctx.beginPath(); draw(f); ctx.fillStyle = '#39756e'; ctx.fill(); ctx.strokeStyle = '#86b9a2'; ctx.lineWidth = 0.7; ctx.stroke(); });
  // Graticule makes rotation and hemispheres easy to inspect.
  ctx.strokeStyle = '#79bbc02b'; ctx.lineWidth = 1;
  for (let x = 0; x < 2048; x += 2048 / 12) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke(); }
  for (let y = 0; y < 1024; y += 1024 / 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2048, y); ctx.stroke(); }
  const texture = new THREE.CanvasTexture(textureCanvas); texture.colorSpace = THREE.SRGBColorSpace;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshBasicMaterial({ map: texture })); root.add(earth);
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.025, 64, 32), new THREE.MeshBasicMaterial({ color: '#73cce1', transparent: true, opacity: 0.07, side: THREE.BackSide })); root.add(atmosphere);
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffce7c' })); marker.visible = false; root.add(marker);
  const clouds = new THREE.Group(); clouds.visible = false; root.add(clouds);
  for (const [x, y, radius] of [[-0.055, 0, 0.04], [0, 0.02, 0.055], [0.06, 0, 0.035]]) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), new THREE.MeshBasicMaterial({ color: '#dae9f0', transparent: true, opacity: 0.82 }));
    puff.position.set(x, y, 0.13); clouds.add(puff);
  }
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(90 * 3);
  // Deterministic positions: visual motion never influences application data.
  for (let i = 0; i < 90; i++) { positions[i * 3] = Math.sin(i * 2.4) * 0.1; positions[i * 3 + 1] = Math.cos(i * 1.7) * 0.1; positions[i * 3 + 2] = (i % 15) / 100; }
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: '#a7deff', size: 0.013, transparent: true, opacity: 0.9 })); particles.visible = false; root.add(particles);
  let rotating = false, dragging, animation, visible = true, lost = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const label = document.querySelector('#globe-weather');
  function render() { if (!lost) renderer.render(scene, camera); }
  let last = 0;
  function tick(time) {
    animation = requestAnimationFrame(tick);
    if (!visible || document.hidden || lost) { last = time; return; }
    const dt = Math.min((time - last) / 1000 || 0, 0.05); last = time;
    if (rotating && !reduced.matches) root.rotation.y += dt * 0.12;
    if (particles.visible && !reduced.matches) {
      for (let i = 2; i < positions.length; i += 3) { positions[i] -= dt * 0.13; if (positions[i] < 0) positions[i] = 0.15; }
      particleGeometry.attributes.position.needsUpdate = true;
    }
    if ((rotating || particles.visible) && !reduced.matches) render();
  }
  const observer = new ResizeObserver(() => { const width = container.clientWidth || 640; const height = Math.max(280, Math.min(width * 0.62, 480)); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); render(); }); observer.observe(container);
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) render(); }); intersection.observe(container);
  function zoom(delta) { camera.position.z = Math.max(2, Math.min(6, camera.position.z + delta)); render(); }
  canvas.addEventListener('pointerdown', e => { dragging = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!dragging) return; root.rotation.y += (e.clientX - dragging.x) * 0.008; root.rotation.x = Math.max(-1.4, Math.min(1.4, root.rotation.x + (e.clientY - dragging.y) * 0.008)); dragging = { x: e.clientX, y: e.clientY }; render(); });
  canvas.addEventListener('pointerup', () => { dragging = null; }); canvas.addEventListener('pointercancel', () => { dragging = null; });
  canvas.addEventListener('keydown', e => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'].includes(e.key)) e.preventDefault();
    if (e.key === 'ArrowLeft') root.rotation.y -= 0.15;
    if (e.key === 'ArrowRight') root.rotation.y += 0.15;
    if (e.key === 'ArrowUp') root.rotation.x -= 0.15;
    if (e.key === 'ArrowDown') root.rotation.x += 0.15;
    if (e.key === '+' || e.key === '=') zoom(-0.3);
    if (e.key === '-') zoom(0.3);
    render();
  });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; document.querySelector('#globe-status').textContent = 'Graphics context lost. Reload the page to restore 3D; the world map is still available.'; });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; render(); document.querySelector('#globe-status').textContent = '3D graphics restored.'; });
  animation = requestAnimationFrame(tick);
  function reset() { rotating = false; root.rotation.set(0.12, -0.35, 0); camera.position.z = 3.7; render(); }
  reset();
  const dispose = () => { cancelAnimationFrame(animation); observer.disconnect(); intersection.disconnect(); scene.traverse(object => { object.geometry?.dispose(); if (object.material) object.material.dispose(); }); texture.dispose(); renderer.dispose(); };
  window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { once: true });
  return {
    zoom, reset,
    toggleRotation() { rotating = !rotating; return rotating; },
    select(city, data) {
      if (!city) { marker.visible = false; particles.visible = false; clouds.visible = false; label.textContent = 'Select a city or landmark to place a weather marker.'; render(); return; }
      const lat = THREE.MathUtils.degToRad(city.latitude), lon = THREE.MathUtils.degToRad(city.longitude);
      const normal = new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
      marker.position.copy(normal.clone().multiplyScalar(1.025)); marker.visible = true;
      particles.position.copy(normal.clone().multiplyScalar(1.04)); particles.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      clouds.position.copy(particles.position); clouds.quaternion.copy(particles.quaternion);
      const snowy = [71, 73, 75, 77, 85, 86].includes(data?.code);
      const wet = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(data?.code);
      particles.visible = snowy || wet;
      clouds.visible = data !== null && data !== undefined && (snowy || wet || [1, 2, 3, 45, 48].includes(data.code));
      particles.material.color.set(snowy ? '#ffffff' : '#91ccff'); particles.material.size = snowy ? 0.021 : 0.012;
      const condition = data ? weatherCondition(data.code, data.isDay) : null;
      marker.material.color.set(wet ? '#91ccff' : snowy ? '#ffffff' : '#ffce7c');
      label.textContent = `${city.name}: ${condition ? `${condition.icon} ${condition.description}. ${snowy ? 'Snow' : wet ? 'Rain' : 'Location'} visualization` : 'weather unavailable or not loaded'}. Effects are illustrative, localized to the marker, and are not a global weather layer.`;
      // Bring the selected point toward the viewer rather than leaving it behind Earth.
      root.rotation.set(lat, -lon - Math.PI / 2, 0); render();
    }
  };
}
