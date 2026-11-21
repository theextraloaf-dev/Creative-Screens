import {
  CanvasTexture, EquirectangularReflectionMapping, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry,
  PMREMGenerator, Scene, SRGBColorSpace, TextureLoader, Vector3, VideoTexture, WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import cfg from '../../data/diorama.json';
import { followCamera, lerpCamera, postFor, toGl, vanPose } from '../../lib/diorama-timeline.ts';
import {
  addSway, bakedMaterial, fillMaterial, litMaterial, mapFade, mapFadeMaterial, routeMaterial, shared, waterMaterial,
} from './materials.js';
import { createPost } from './post.js';

/* The diorama scene: the Oman map (km) and the Muscat street (m), exported from Blender with diffuse light baked in.
   While the map shows, the street follows the map's muscat_anchor at street_scale; once the dive ends the street sits
   at the scene root at scale 1 and the map is hidden (perspective does not care about scale, so the swap is invisible).
   Scroll position drives everything through apply(state, progress); a render loop runs only while the scene is in
   view and adds what lives on its own: water, swaying palms, waving flags, the van idling, the LED screen's loop. */

const WHEEL_R = 0.38;

/** Blender camera key (eye/target in Blender coords, lens mm) -> the same key in glTF/Three coords */
const glKey = (k) => ({ eye: toGl(k.eye), target: toGl(k.target), lens: k.lens });

function overviewKey() {
  const o = cfg.overview;
  const el = (o.elevationDeg * Math.PI) / 180, az = (o.azimuthDeg * Math.PI) / 180;
  const t = o.target;
  const eye = [t[0] - Math.sin(az) * Math.cos(el) * o.distance, t[1] - Math.cos(az) * Math.cos(el) * o.distance, t[2] + Math.sin(el) * o.distance];
  return glKey({ eye, target: t, lens: o.lens });
}

/** Blender lens (36 mm sensor across the width) -> Three's vertical fov. The horizontal view is kept on any screen
    shape, so the street keeps its width on phones; the vertical fov is capped so portrait does not turn fisheye. */
function fovFor(lens, aspect) {
  const h = 2 * Math.atan(18 / lens);
  const v = 2 * Math.atan(Math.tan(h / 2) / aspect);
  return Math.min((v * 180) / Math.PI, 78);
}

/** A soft contact shadow: a flat disc with a radial falloff, laid under a moving object (the van, the pin tokens). */
let shadowTex = null;
function contactShadow(w, d, opacity = 0.42) {
  if (!shadowTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(0.55, 'rgba(0,0,0,0.45)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    shadowTex = new CanvasTexture(c);
  }
  const m = new Mesh(new PlaneGeometry(w, d), new MeshBasicMaterial({ map: shadowTex, transparent: true, opacity, depthWrite: false, color: 0x1a1208 }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 1;
  return m;
}

/** The van's path across Oman (Blender coords from build_map.py), measured by arc length. */
function routePath() {
  const pts = (cfg.route?.points ?? []).map((p) => new Vector3(...toGl(p)));
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = acc[acc.length - 1] || 1;
  return {
    at(t, out = new Vector3()) {
      const d = Math.min(1, Math.max(0, t)) * total;
      let i = 1; while (i < acc.length - 1 && acc[i] < d) i++;
      const f = (d - acc[i - 1]) / Math.max(1e-6, acc[i] - acc[i - 1]);
      return out.copy(pts[i - 1]).lerp(pts[i], f);
    },
    heading(t) {
      const a = this.at(Math.max(0, t - 0.004)), b = this.at(Math.min(1, t + 0.004));
      return Math.atan2(-(b.z - a.z), b.x - a.x);         // GL: Blender +Y is -Z; the van model faces +X
    },
    /** nose up/down with the road's grade (radians), over about the van's length */
    pitch(t) {
      const a = this.at(Math.max(0, t - 0.003)), b = this.at(Math.min(1, t + 0.003));
      return Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z) || 1e-6);
    },
  };
}

const artUrl = (name, n, service) => {
  const part = name.slice(`canvas_${n}_${service}`.length).replace(/^_/, '');
  return `/diorama/art/stop-${n}${part ? `-${part}` : ''}.webp`;
};

export async function createDiorama({ host, labelsRoot, dir, tier, onLost, onProgress }) {
  const post = postFor(tier);
  const canvas = document.createElement('canvas');
  canvas.className = 'diorama__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); running = false; onLost?.(); });

  // ---------------------------------------------------------------- load (progress feeds the loader outline)
  const draco = new DRACOLoader().setDecoderPath('/draco/');
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const suffix = tier === 'low' ? '-low' : '';
  const got = { map: 0, street: 0 };
  const report = () => onProgress?.((got.map + got.street) / 2);
  const track = (key) => (e) => { if (e.total) { got[key] = e.loaded / e.total; report(); } };
  const texLoader = new TextureLoader();
  const [map, street, envTex] = await Promise.all([
    loader.loadAsync(`/models/oman-map${suffix}.glb`, track('map')),
    loader.loadAsync(`/models/muscat-street${suffix}.glb`, track('street')),
    texLoader.loadAsync('/diorama/env.webp').catch(() => null),
  ]);
  got.map = got.street = 1; report();
  draco.dispose();

  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 16 / 9, 0.01, 10000);
  let env = null;
  if (envTex) {
    envTex.mapping = EquirectangularReflectionMapping; envTex.colorSpace = SRGBColorSpace;
    const pmrem = new PMREMGenerator(renderer);
    env = pmrem.fromEquirectangular(envTex).texture;           // prefiltered, so rough surfaces reflect softly
    envTex.dispose(); pmrem.dispose();
  }

  const mapRoot = map.scene;
  const streetRoot = street.scene;
  const anchor = mapRoot.getObjectByName('muscat_anchor');
  if (!anchor) throw new Error('map has no muscat_anchor');
  const s = anchor.userData?.street_scale ?? cfg.map.streetScale;

  // ---------------------------------------------------------------- materials
  const named = (o) => { let p = o; while (p && !p.name) p = p.parent; return p?.name ?? ''; };
  const surface = (m) => ({ normal: m.normalMap, orm: m.roughnessMap, env });
  const canvases = [];
  let route = null;
  mapRoot.traverse((o) => {
    if (!o.isMesh) return;
    const n = named(o); const m = o.material;
    if (n === 'route_line') { o.material = routeMaterial(); route = o.material; o.renderOrder = 2; return; }
    const grid = n === 'static_sea' || n === 'static_terrain' || n === 'static_neighbours';
    o.material = n.startsWith('static_') ? mapFadeMaterial(m.map, surface(m), n === 'static_sea', grid, n === 'static_landmarks') : bakedMaterial(m.map);
  });
  streetRoot.traverse((o) => {
    if (!o.isMesh) return;
    let node = o; while (node && !node.name.startsWith('canvas_') && node !== streetRoot) node = node.parent;
    const m = o.material;
    if (node && node.name.startsWith('canvas_')) {
      const { canvas: n, service } = node.userData;
      const art = texLoader.load(artUrl(node.name, n, service));
      art.colorSpace = SRGBColorSpace;
      const wave = node.name.includes('_flag_') ? 0.09 : node.name.endsWith('_banner') ? 0.03 : 0;
      o.material = fillMaterial({ light: m.map, art, dir, wave });
      canvases.push({ mesh: o, n, art, name: node.name });
      return;
    }
    const n = named(o);
    if (n === 'sea') o.material = waterMaterial({ baked: m.map, ...surface(m) });
    else if (n === 'static_palms') o.material = addSway(litMaterial({ baked: m.map, ...surface(m) }), { amp: 0.14 });
    else if (n === 'van_body') o.material = litMaterial({ baked: m.map, ...surface(m), kind: 'paint' });
    else if (n.startsWith('static_')) o.material = litMaterial({ baked: m.map, ...surface(m) });
    else o.material = bakedMaterial(m.map);
  });

  // the LED screen plays its loop once it is installed (stop 3 filled)
  const led = canvases.find((c) => c.n === 3);
  let video = null, videoTex = null;
  function ledPlaying(on) {
    if (!led) return;
    if (on && !video) {
      video = Object.assign(document.createElement('video'), { src: '/diorama/led-loop.mp4', muted: true, loop: true, playsInline: true });
      videoTex = new VideoTexture(video); videoTex.colorSpace = SRGBColorSpace;
    }
    if (!video) return;
    if (on) { video.play().catch(() => {}); led.mesh.material.uniforms.uArt.value = videoTex; }
    else { video.pause(); led.mesh.material.uniforms.uArt.value = led.art; }
  }

  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };
  const van = streetRoot.getObjectByName('van');
  if (van) { const vs = contactShadow(7.2, 3.4, 0.45); vs.position.y = 0.03; van.add(vs); }
  const wheels = ['van_wheel_fl', 'van_wheel_rl', 'van_wheel_fr', 'van_wheel_rr'].map((n) => streetRoot.getObjectByName(n)).filter(Boolean);

  // ---------------------------------------------------------------- the two worlds
  scene.add(mapRoot);
  scene.add(streetRoot);
  const anchorPos = new Vector3();
  /* relief: x15 over the whole map, relaxing toward true height as the camera comes down to Muscat, so the dive ends
     over the coast instead of inside giant mountains. The street is not parented to the anchor (it would be squashed
     too); it follows the anchor's position at street_scale while the map shows. */
  function placeMap(relief) {
    mapRoot.scale.set(1, relief, 1);
    mapRoot.updateMatrixWorld(true);
    anchor.getWorldPosition(anchorPos);
    mapFade.uCenter.value.copy(anchorPos);
  }
  function placeStreet(onStreet) {
    mapRoot.visible = !onStreet;
    if (onStreet) { streetRoot.position.set(0, 0, 0); streetRoot.scale.setScalar(1); }
    else { streetRoot.position.copy(anchorPos); streetRoot.scale.setScalar(s); }
  }
  placeMap(1);
  placeStreet(false);

  // ---------------------------------------------------------------- v3: the van drives the route across the map
  const path = routePath();
  const MAP_VAN = 2.2;                                      // toy scale: map units are km, so the 5.6 m van is ~9 km long
  const mapVan = van ? van.clone(true) : null;
  if (mapVan) {
    mapVan.scale.setScalar(MAP_VAN);                       // the street van's contact shadow comes with the clone
    mapRoot.add(mapVan);
  }
  const tokens = (cfg.route?.stops ?? []).map((st, k) => {
    const obj = mapRoot.getObjectByName(`pin3d_${st.slug}`);
    if (!obj) return null;
    const sh = contactShadow(9, 5, 0.38); sh.position.set(2.5, 0.05, 1.5); mapRoot.add(sh);
    return { obj, k, base: obj.scale.clone().multiplyScalar(0.7), shadow: sh, at: obj.position.clone() };
  }).filter(Boolean);
  for (const t of tokens) t.shadow.position.add(t.at);
  const followMap = (t) => {
    const v = path.at(t);
    return { eye: [v.x - 48, v.y + 74, v.z + 62], target: [v.x - 4, v.y + 2, v.z - 4], lens: 45 };
  };

  const mapKey = glKey(cfg.map.camera);
  const overview = overviewKey();
  const inMap = (k) => ({
    eye: k.eye.map((v, i) => anchorPos.getComponent(i) + v * s),
    target: k.target.map((v, i) => anchorPos.getComponent(i) + v * s),
    lens: k.lens,
  });

  // ---------------------------------------------------------------- labels
  const labels = [...labelsRoot.querySelectorAll('[data-label]')].map((el) => {
    el.style.left = '0px'; el.style.top = '0px';       // screen projections are physical coordinates
    return { el, node: mapRoot.getObjectByName(`label_${el.dataset.label}`) };
  }).filter((l) => l.node);
  const tmp = new Vector3();

  // ---------------------------------------------------------------- camera
  let width = 1, height = 1, last = null, lastProgress = 0, parallax = { x: 0, y: 0 };

  /* While the headline is over the map, frame the map on the other side of the screen (end side in landscape, lower
     half in portrait); `shift` 1 -> 0 eases it back to centre during the dive. */
  function frameShift(shift) {
    if (shift <= 0 && !parallax.x && !parallax.y) { camera.clearViewOffset(); return; }
    const landscape = width >= height;
    const x = (landscape ? -dir * 0.17 * width * shift : 0) + parallax.x * width * 0.012;
    const y = (landscape ? 0 : -0.16 * height * shift) + parallax.y * height * 0.012;
    camera.setViewOffset(width, height, x, y, width, height);
  }

  function setCamera(k, shift = 0) {
    camera.position.set(...k.eye);
    const target = new Vector3(...k.target);
    camera.lookAt(target);
    camera.updateMatrixWorld();                 // project() below must use this frame's camera, not the last render's
    const dist = camera.position.distanceTo(target);
    camera.near = Math.max(dist * 0.005, 0.001); camera.far = dist * 60;
    camera.aspect = width / height;
    camera.fov = fovFor(k.lens, camera.aspect);
    frameShift(shift);
    camera.updateProjectionMatrix();
  }

  /** screen position of an object (optionally `up` scene units above it): { x, y } in CSS px, visible when in front */
  function toScreen(obj, up = 0) {
    obj.updateWorldMatrix(true, false);         // the street may have just moved/scaled (map -> street swap)
    obj.getWorldPosition(tmp); tmp.y += up; tmp.project(camera);
    return { x: ((tmp.x + 1) / 2) * width, y: ((1 - tmp.y) / 2) * height, visible: tmp.z < 1 && tmp.z > -1 };
  }

  let focus = { y: 0.45, amount: 1 };
  function apply(state, progress = lastProgress) {
    last = state; lastProgress = progress;
    const onStreet = state.phase === 'street' || state.phase === 'outro';
    if (!onStreet) placeMap(1);
    placeStreet(onStreet);
    if (!onStreet) {
      const back = Math.min(1, state.dive / 0.5);
      // map: the overview (headline beside it); route: ease into a close chase behind the van; dive: from the van at
      // Muscat down into the street
      const rIn = smooth((progress - cfg.phases.route[0]) / ((cfg.phases.route[1] - cfg.phases.route[0]) * 0.12));
      const chase = followMap(state.routeT);
      const key = state.phase === 'map' ? mapKey : state.phase === 'route' ? lerpCamera(mapKey, chase, rIn)
        : lerpCamera(followMap(1), inMap(overview), state.dive);
      setCamera(key, state.phase === 'map' ? 1 : state.phase === 'route' ? 1 - rIn : 0);
      if (mapVan) {
        const v = path.at(state.routeT);
        mapVan.position.set(v.x, v.y, v.z);
        mapVan.rotation.set(0, path.heading(state.routeT), path.pitch(state.routeT));   // XYZ: pitch about its own axis, then yaw
        mapVan.visible = state.phase !== 'dive' || state.dive < 0.4;
      }
      for (const t of tokens) {
        const live = state.city === t.k;
        t.obj.scale.copy(t.base).multiplyScalar(live ? 1.25 : 1);
        t.obj.rotation.set(0, Math.atan2(camera.position.x - t.at.x, camera.position.z - t.at.z), 0);   // face the camera
        t.obj.visible = t.shadow.visible = state.phase !== 'dive' || state.dive < 0.15;
      }
      // the map clears outward-in around Muscat, keeping about what the camera can see, and is gone before the swap
      const camDist = camera.position.distanceTo(anchorPos);
      const close = smooth((state.dive - 0.6) / 0.25);
      mapFade.uRadius.value = state.phase !== 'dive' ? 1e6 : camDist * mix(1.2, 0.5, smooth((state.dive - 0.3) / 0.4)) * (1 - close);
      mapFade.uEdge.value = Math.max(0.5, mapFade.uRadius.value * 0.08);
      mapFade.uHole.value = state.phase === 'dive' ? 18 * smooth(state.dive / 0.25) : 0;
      if (route) route.uniforms.uReveal.value = state.phase === 'map' ? smooth(progress / cfg.phases.map[1]) : 1;
      const fobj = state.phase === 'route' && mapVan ? mapVan : anchor;
      const a = toScreen(fobj); focus = { y: 1 - a.y / height, amount: state.phase === 'map' ? 0.6 : state.phase === 'route' ? 1.2 : 1 - state.dive };
    } else {
      const f = followCamera(state.vanX, dir);
      setCamera(lerpCamera(overview, glKey(f), Math.min(1, state.street * 8)));
    }
    // van: position, heading (rotated, never mirrored), wheels rolling with the distance travelled
    const pose = vanPose(state, dir);
    if (van) {
      const [x, y, z] = toGl([pose.x, pose.y, 0]);
      van.position.set(x, y, z);
      van.rotation.set(0, pose.yaw, 0);
      for (const w of wheels) w.rotation.set(0, 0, -(dir * state.vanX) / WHEEL_R);
      if (onStreet) { van.updateMatrixWorld(); const v = toScreen(van); focus = { y: 1 - v.y / height, amount: 1 }; }
    }
    for (const c of canvases) c.mesh.material.uniforms.uProgress.value = state.fills[c.n - 1];
    ledPlaying(onStreet && state.fills[2] >= 1);
    // labels only over the map
    const showLabels = state.phase === 'map' || (state.phase === 'dive' && state.dive < 0.3);
    for (const l of labels) {
      const p = toScreen(l.node);
      const on = showLabels && p.visible;
      l.el.classList.toggle('is-on', on);
      if (on) l.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
  }

  // ---------------------------------------------------------------- render loop (only while in view)
  const fx = createPost(renderer, scene, camera, tier);
  let running = true, inView = true, raf = 0;
  const t0 = performance.now();
  function frame(now) {
    raf = 0;
    if (!running || !inView || document.hidden) return;
    const t = (now - t0) / 1000;
    shared.uTime.value = t;
    if (van && last && (last.phase === 'street' || last.phase === 'outro')) {
      van.position.y = Math.sin(t * Math.PI * 2 * 1.3) * 0.01;                 // idling: a centimetre of bob
    }
    fx.setFocus(focus.y, focus.amount);
    fx.render(t);
    raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!raf && running && inView && !document.hidden) raf = requestAnimationFrame(frame); };
  const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; wake(); });
  io.observe(host);
  document.addEventListener('visibilitychange', wake);

  function resize() {
    width = Math.max(1, host.clientWidth); height = Math.max(1, host.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, post.maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    fx.resize(width, height, dpr);
    if (last) apply(last);
    wake();
  }

  host.appendChild(canvas);
  resize();

  return {
    apply(state, progress) { apply(state, progress); wake(); },
    resize,
    toScreen,
    object: (name) => streetRoot.getObjectByName(name) || mapRoot.getObjectByName(name),
    setParallax(x, y) { parallax = { x, y }; if (last && last.phase === 'map') apply(last); },
    setFocusOn(obj) { if (obj) { const p = toScreen(obj); focus = { y: 1 - p.y / height, amount: 1.4 }; } },
    destroy() {
      running = false; io.disconnect(); document.removeEventListener('visibilitychange', wake);
      if (raf) cancelAnimationFrame(raf);
      video?.pause(); fx.dispose(); renderer.dispose(); canvas.remove();
    },
  };
}
