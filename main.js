/* =========================================================
   Wonder Museum of Science — low-poly navigable map (base)
   Single-file Three.js starter:
   - character controller (keyboard + touch joystick)
   - drag-orbit follow camera
   - procedural low-poly campus + 6 exhibit buildings
   - proximity interaction -> exhibit info panels
   ========================================================= */

/* ---------- palette ---------- */
const C = {
  ground:  0xACA3DC,  // lavender base (ref image 2), deepened so paths/buildings pop
  grass:   0x84CE93,
  grassB:  0x6DC084,
  path:    0xF6F2E7,
  pathEdge:0xE8E1CF,
  cream:   0xFFF6E6,
  coral:   0xFF7A59,
  coralD:  0xE8603F,
  teal:    0x2EC4B6,
  tealD:   0x1FA396,
  gold:    0xFFC145,
  violet:  0x8C6BF2,
  violetD: 0x6E4FD6,
  ink:     0x3B3563,
  white:   0xFFFFFF,
  pink:    0xFF9EC4,
  blue:    0x5AA9E6,
  blueD:   0x3E87C4,
  green:   0x63C97B,
  trunk:   0x9A6B4F,
  water:   0x9BDCF0,
};

const mat = (color, opts={}) =>
  new THREE.MeshStandardMaterial(Object.assign({ color, flatShading:true, roughness:.9, metalness:0 }, opts));

/* ---------- renderer / scene ---------- */
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;   // rolls off highlights → daytime keeps contrast
renderer.toneMappingExposure = 1.0;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xCDE7F5);
scene.fog = new THREE.Fog(0xCDE7F5, 140, 300);   // starts past the campus rim so the map keeps its color

const camera = new THREE.PerspectiveCamera(50, innerWidth/innerHeight, .1, 400);

/* ---------- lights ---------- */
const hemi = new THREE.HemisphereLight(0xEAF6FF, 0xB7A8E0, .75);
scene.add(hemi);
const glowMats = [];   // materials that brighten at night: {m, day, night}
const sun = new THREE.DirectionalLight(0xFFF3DD, 1.05);
sun.position.set(-40, 60, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
sun.shadow.camera.top = 90;  sun.shadow.camera.bottom = -90;
sun.shadow.camera.far = 200;
sun.shadow.bias = -0.0004;
scene.add(sun);

/* ---------- helpers ---------- */
const colliders = [];           // {x, z, r}
const animated = [];            // {fn(t, dt)}
const WORLD_R = 74;             // walkable radius
const HALL_COUNT = 9;           // Discovery Gateway's nine permanent exhibits
const hallAngle = i => i * Math.PI*2/HALL_COUNT + Math.PI/HALL_COUNT;

function addCollider(x, z, r){ colliders.push({x, z, r}); }

function box(w, h, d, color, opts){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(rT, rB, h, seg, color, opts){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg), mat(color, opts));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function sph(r, color, seg=7, opts){
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(5, seg-1)), mat(color, opts));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cone(r, h, seg, color){
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(color));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* text label rendered onto a canvas -> plane */
const signRedraws = [];   // redrawn once the webfont finishes loading
function makeSign(text, bg='#3B3563', fg='#FFFFFF', w=6, h=1.7){
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = Math.round(512*h/w);
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  function draw(){
    ctx.clearRect(0, 0, cv.width, cv.height);
    const r = 46;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(r,0); ctx.lineTo(cv.width-r,0); ctx.quadraticCurveTo(cv.width,0,cv.width,r);
    ctx.lineTo(cv.width,cv.height-r); ctx.quadraticCurveTo(cv.width,cv.height,cv.width-r,cv.height);
    ctx.lineTo(r,cv.height); ctx.quadraticCurveTo(0,cv.height,0,cv.height-r);
    ctx.lineTo(0,r); ctx.quadraticCurveTo(0,0,r,0); ctx.fill();
    ctx.fillStyle = fg;
    // shrink the font until the text fits inside the pill with padding
    let size = 92;
    const maxW = cv.width - 2*r - 24;
    ctx.font = `600 ${size}px Fredoka, sans-serif`;
    const tw = ctx.measureText(text).width;
    if(tw > maxW){
      size = Math.floor(size * maxW / tw);
      ctx.font = `600 ${size}px Fredoka, sans-serif`;
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, cv.width/2, cv.height/2 + size*.07);
    tex.needsUpdate = true;
  }
  draw();
  signRedraws.push(draw);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map:tex, transparent:true })
  );
  return mesh;
}
if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=> signRedraws.forEach(f => f()));

/* full-bleed panel texture for physical signs (colored face, inset border) */
function makeSignTexture(text, bg, fg, w, h){
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = Math.round(512*h/w);
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  function draw(){
    ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
    // top-lit gradient so the panel reads as a lit surface, not a UI pill
    const gr = ctx.createLinearGradient(0, 0, 0, cv.height);
    gr.addColorStop(0, 'rgba(255,255,255,.16)');
    gr.addColorStop(1, 'rgba(0,0,0,.12)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 7;
    ctx.strokeRect(15, 15, cv.width - 30, cv.height - 30);
    ctx.fillStyle = fg;
    let size = 84;
    const maxW = cv.width - 92;
    ctx.font = `600 ${size}px Fredoka, sans-serif`;
    const tw = ctx.measureText(text).width;
    if(tw > maxW){
      size = Math.floor(size * maxW / tw);
      ctx.font = `600 ${size}px Fredoka, sans-serif`;
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, cv.width/2, cv.height/2 + size*.06);
    tex.needsUpdate = true;
  }
  draw();
  signRedraws.push(draw);
  return tex;
}

/* physical monument sign: colored panel in a wood frame on two posts */
function makeHallSign(data){
  const g = new THREE.Group();
  const W = 5.4, H = 1.55, D = .24;
  [-1, 1].forEach(s=>{
    const post = cyl(.13, .17, 2.5, 8, C.trunk);
    post.position.set(s*(W/2 - .55), 1.25, 0);
    g.add(post);
  });
  const body = box(W, H, D, C.trunk);
  body.position.y = 2.35;
  g.add(body);
  const cap = box(W + .28, .18, D + .2, C.trunk);
  cap.position.y = 2.35 + H/2 + .09;
  g.add(cap);
  const tex = makeSignTexture(data.name, data.color, '#FFFFFF', W, H);
  [1, -1].forEach(s=>{
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(W - .16, H - .16),
      new THREE.MeshStandardMaterial({ map:tex, emissive:0xFFFFFF, emissiveMap:tex, emissiveIntensity:.25, roughness:.8, metalness:0 })
    );
    face.position.set(0, 2.35, s*(D/2 + .012));
    if(s < 0) face.rotation.y = Math.PI;
    g.add(face);
    glowMats.push({ m:face.material, day:.25, night:.95 });   // reads like lit signage after dark
  });
  return g;
}

/* ---------- sound engine (all synthesized, no audio files) ---------- */
let AC = null, master = null, noiseBuf = null, rainGain = null, muted = false;
function initAudio(){
  if(AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  master = AC.createGain(); master.gain.value = .45; master.connect(AC.destination);
  noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i] = Math.random()*2 - 1;
  // looping rain bed (gain raised only when it's raining)
  const src = AC.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 850;
  rainGain = AC.createGain(); rainGain.gain.value = 0;
  src.connect(f); f.connect(rainGain); rainGain.connect(master);
  src.start();
}
function blip(freq, dur=.15, type='sine', vol=.16, slide=0, delay=0){
  if(!AC || muted) return;
  const t0 = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + .012);
  g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + .05);
}
function thud(dur=.08, vol=.12, cutoff=900, delay=0){
  if(!AC || muted) return;
  const t0 = AC.currentTime + delay;
  const s = AC.createBufferSource(); s.buffer = noiseBuf;
  s.playbackRate.value = .8 + Math.random()*.4;
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
  const g = AC.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t0); s.stop(t0 + dur + .05);
}
const sfx = {
  step:   (i)=> thud(.05, .04, 650 + i*220),
  jump:   ()=> blip(260, .28, 'sine', .18, 380),
  land:   ()=> thud(.1, .13, 420),
  pad:    ()=> { blip(740, .14, 'triangle', .11); blip(1108, .16, 'triangle', .09, 0, .07); },
  open:   ()=> { blip(520, .1, 'sine', .13); blip(784, .14, 'sine', .11, 0, .06); },
  discover:()=> [523, 659, 784, 1046].forEach((f,i)=> blip(f, .16, 'triangle', .13, 0, i*.09)),
  fanfare: ()=> { [523,659,784,1046,784,1046,1318,1568].forEach((f,i)=> blip(f, .28, 'triangle', .15, 0, i*.1)); thud(.6, .07, 5000, .3); },
  quack:  ()=> blip(330 + Math.random()*60, .12, 'square', .06, -150),
  beep:   ()=> { blip(980, .09, 'square', .07); blip(1240, .09, 'square', .07, 0, .11); },
  ui:     ()=> blip(640, .07, 'sine', .08),
  chirp:  ()=> { const f = 2100 + Math.random()*1500; blip(f, .09, 'sine', .045, 650); blip(f*1.12, .07, 'sine', .035, 550, .13); },
  cricket:()=> { for(let i=0;i<3;i++) blip(4200, .035, 'sine', .028, 0, i*.075); },
};
/* haptics (mobile) */
function buzz(pattern){
  if(navigator.vibrate){ try{ navigator.vibrate(pattern); }catch(e){} }
}

/* ---------- ground ---------- */
const ground = new THREE.Mesh(
  new THREE.CylinderGeometry(WORLD_R + 14, WORLD_R + 17, 3, 48),
  mat(C.ground)
);
ground.position.y = -1.5;
ground.receiveShadow = true;
scene.add(ground);

// under-cliff for a floating-island feel
const cliff = new THREE.Mesh(
  new THREE.CylinderGeometry(WORLD_R + 17, WORLD_R - 8, 16, 48),
  mat(0x8F86C7)
);
cliff.position.y = -11;
scene.add(cliff);

/* irregular grass patches */
function grassPatch(x, z, r, color){
  const g = new THREE.CylinderGeometry(r, r*1.03, .5, 10);
  const m = new THREE.Mesh(g, mat(color));
  m.rotation.y = Math.random()*Math.PI;
  m.position.set(x, .12, z);
  m.receiveShadow = true;
  scene.add(m);
}
// one lawn under each hall — centered on the hall's angle, just outside the loop road
for(let i=0;i<HALL_COUNT;i++){
  const a = hallAngle(i);
  grassPatch(Math.cos(a)*51, Math.sin(a)*51, 11.5, i%2 ? C.grassB : C.grass);
}

/* ---------- paths (loop + spokes) ---------- */
const pathGroup = new THREE.Group();
scene.add(pathGroup);
function pathSeg(x, z, w, d, rotY=0){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, .3, d), mat(C.path));
  m.position.set(x, .18, z);
  m.rotation.y = rotY;
  m.receiveShadow = true;
  pathGroup.add(m);
}
// central plaza
const plaza = new THREE.Mesh(new THREE.CylinderGeometry(13, 13.4, .34, 24), mat(C.path));
plaza.position.y = .18; plaza.receiveShadow = true;
pathGroup.add(plaza);
const plazaRim = new THREE.Mesh(new THREE.TorusGeometry(13, .28, 6, 40), mat(C.pathEdge));
plazaRim.rotation.x = Math.PI/2; plazaRim.position.y = .36;
pathGroup.add(plazaRim);

// one spoke per exhibit — ends at the loop road
for(let i=0;i<HALL_COUNT;i++){
  const a = hallAngle(i);
  const len = 24;
  pathSeg(Math.cos(a)*(13+len/2), Math.sin(a)*(13+len/2), len, 5.4, -a + Math.PI/2);
}
// loop road connecting the hall entrances (inside the hall ring, clear of the lawns)
for(let i=0;i<24;i++){
  const a = i/24 * Math.PI*2;
  pathSeg(Math.cos(a)*37, Math.sin(a)*37, 10.2, 5, -a + Math.PI/2);
}
// crosswalk stripes on spokes
for(let i=0;i<HALL_COUNT;i++){
  const a = hallAngle(i);
  for(let s=0;s<4;s++){
    const d = 20 + s*2.2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(.9, .05, 3.6), mat(0xFFFFFF));
    m.position.set(Math.cos(a)*d, .36, Math.sin(a)*d);
    m.rotation.y = -a;
    pathGroup.add(m);
  }
}

/* ---------- signature: atom monument ---------- */
const atom = new THREE.Group();
const pedestal = cyl(2.6, 3.4, 1.6, 8, C.cream); pedestal.position.y = .8; atom.add(pedestal);
const pedestal2 = cyl(1.6, 2.2, 1.4, 8, C.violet); pedestal2.position.y = 2.2; atom.add(pedestal2);
const nucleus = sph(1.5, C.coral, 6); nucleus.position.y = 5.4; atom.add(nucleus);
const ringMat = mat(C.ink, { roughness:.6 });
const electrons = [];
for(let i=0;i<3;i++){
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, .14, 6, 40), ringMat);
  ring.position.y = 5.4;
  ring.rotation.set(Math.PI/2.6, i*Math.PI/3, 0);
  ring.castShadow = true;
  atom.add(ring);
  const e = sph(.5, [C.teal, C.gold, C.blue][i], 6, { emissive:[C.teal, C.gold, C.blue][i], emissiveIntensity:.35 });
  atom.add(e);
  electrons.push({ mesh:e, ring, phase:i*2.1, speed:.9 + i*.25 });
}
scene.add(atom);
addCollider(0, 0, 3.6);
animated.push({ fn:(t)=>{
  nucleus.position.y = 5.4 + Math.sin(t*1.4)*.18;
  electrons.forEach(el=>{
    const a = t*el.speed + el.phase;
    const p = new THREE.Vector3(Math.cos(a)*3.4, 0, Math.sin(a)*3.4);
    p.applyEuler(el.ring.rotation);
    el.mesh.position.copy(p).add(new THREE.Vector3(0, 5.4, 0));
  });
}});

/* ---------- trees / props ---------- */
function tree(x, z, s=1){
  const g = new THREE.Group();
  const trunk = cyl(.22*s, .3*s, 1.1*s, 6, C.trunk); trunk.position.y = .55*s; g.add(trunk);
  const c1 = cone(1.15*s, 2.1*s, 7, C.green);  c1.position.y = 2.0*s; g.add(c1);
  const c2 = cone(.85*s, 1.6*s, 7, 0x54B96C);  c2.position.y = 3.1*s; g.add(c2);
  g.position.set(x, 0, z);
  g.rotation.y = Math.random()*Math.PI*2;
  scene.add(g);
  addCollider(x, z, 1.0*s);
}
function bush(x, z, s=1){
  const b = sph(.9*s, 0x6FCB84, 6);
  b.position.set(x, .6*s, z);
  b.scale.y = .8;
  scene.add(b);
  addCollider(x, z, .9*s);
}
function rock(x, z, s=1){
  const r = sph(.7*s, 0xCEC8E8, 5);
  r.position.set(x, .3*s, z);
  r.scale.set(1, .65, .8);
  r.rotation.y = Math.random()*3;
  scene.add(r);
  addCollider(x, z, .7*s);
}
function bench(x, z, rot){
  const g = new THREE.Group();
  const seat = box(2.4, .18, .7, 0xE7A15C); seat.position.y = .55; g.add(seat);
  const back = box(2.4, .6, .14, 0xE7A15C); back.position.set(0, .95, -.3); g.add(back);
  [-1, 1].forEach(sx=>{
    const leg = box(.16, .55, .6, C.ink); leg.position.set(sx, .27, 0); g.add(leg);
  });
  g.position.set(x, 0, z); g.rotation.y = rot;
  scene.add(g);
  addCollider(x, z, 1.3);
}
function lamp(x, z){
  const g = new THREE.Group();
  const pole = cyl(.09, .12, 3.4, 6, C.ink); pole.position.y = 1.7; g.add(pole);
  const head = sph(.34, C.gold, 6, { emissive:C.gold, emissiveIntensity:.25 }); head.position.y = 3.5; g.add(head);
  glowMats.push({ m:head.material, day:.25, night:1.6 });
  g.position.set(x, 0, z); scene.add(g);
  addCollider(x, z, .35);
}

/* scatter greenery — keep clear of paths */
const scatter = [
  [ 32,-45], [ 42,-26], [-30,-44], [-46,-22], [ 55, 17], [ 34, 40],
  [-30, 44], [-48, 26], [ 6,-52], [-14,-56], [ 8, 54], [-16, 58],
  [ 58,-10], [ 60, 10], [-58,-12], [-60, 12], [ 20,-56], [-22,-56],
  [ 22, 56], [-24, 54],
];
scatter.forEach(([x,z],i)=> tree(x, z, .85 + (i%3)*.25));
bush( 14,-42); bush(-18,-38, 1.2); bush( 14, 44, 1.1); bush(-18, 39);
rock( 54,-22, 1.3); rock(-52, 18); rock( 4, 60, 1.5); rock(-6,-60, 1.2);
for(let i=0;i<HALL_COUNT;i++){
  const a = i * Math.PI*2/HALL_COUNT;      // midway between spokes
  lamp(Math.cos(a)*15.5, Math.sin(a)*15.5);
  bench(Math.cos(a+.26)*17.6, Math.sin(a+.26)*17.6, -a - Math.PI/2 - .26);
}

/* pastel border fence of tiny posts */
for(let i=0;i<64;i++){
  const a = i/64*Math.PI*2;
  const p = cyl(.16,.16,.9,6,[C.coral,C.teal,C.gold,C.violet][i%4]);
  p.position.set(Math.cos(a)*(WORLD_R+9), .45, Math.sin(a)*(WORLD_R+9));
  scene.add(p);
}

/* ---------- exhibit buildings ---------- */
const exhibits = [];

/* adopt a Discovery Gateway diorama tile (12×12, from exhibits.js) as the hall model:
   strip its point light, register its emissive materials with the sun-arc so windows
   glow after dark, and seat it on the lawn */
DG.setTheme('day');
function adoptTile(g, id){
  const t = DG.createExhibit(id);
  DG.stripLights(t);
  t.traverse(o=>{
    if(o.isMesh && o.material && o.material.emissive && o.material.emissiveIntensity > 0){
      const day = o.material.emissiveIntensity;
      glowMats.push({ m:o.material, day, night: Math.min(2, day / 0.12) });   // undo the day-theme dimming after dark
    }
  });
  t.position.y = .42;
  g.add(t);
}
function glowPad(g, dist, color){
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, .3, 20),
    mat(color, { emissive:color, emissiveIntensity:.5, roughness:.4 }));
  pad.position.set(0, .35, dist);       // tall enough to sit proud of the lawn
  g.add(pad);
  glowMats.push({ m:pad.material, day:.5, night:1.4 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, .12, 6, 26),
    mat(C.white, { emissive:color, emissiveIntensity:.9 }));
  ring.rotation.x = Math.PI/2;
  ring.position.set(0, .52, dist);
  g.add(ring);
  glowMats.push({ m:ring.material, day:.9, night:2 });
  animated.push({ fn:(t)=>{ ring.scale.setScalar(1 + Math.sin(t*2.4)*.05); } });
  return pad;
}
const EXHIBIT_DATA = [
  { id:'kids-eye-view', name:'Kids Eye View', glyph:'🏙️', color:'#EF7A5A',
    build: g => adoptTile(g, 'kids-eye-view'),
    desc:'A kid-sized city where you run the show — shop the mini grocery store, fix cars in the mechanic shop, and raise the skyline in the construction zone.',
    fact:'Pretend play is real work: acting out grown-up jobs is how kids build planning, empathy, and problem-solving skills.',
    hours:'Open 10:00 – 18:00',
    events:[ {time:'10:30', name:'Stock the store: grocery scavenger hunt'}, {time:'14:00', name:'Hard-hat huddle: build a block tower'} ],
    highlights:[
      { emoji:'🛒', name:'Mini Grocery', blurb:'Grab a cart, scan the goods, and staff the checkout — the register really beeps.' },
      { emoji:'🔧', name:'Mechanic Shop', blurb:'Roll a tire, pop the hood, and give the shop car its 10,000-smile service.' },
      { emoji:'🚧', name:'Construction Zone', blurb:'Foam blocks, a kid-powered crane, and a skyline that never stays the same.' },
    ] },
  { id:'i-dig-dinos', name:'I Dig Dinos', glyph:'🦖', color:'#B98A5A',
    build: g => adoptTile(g, 'i-dig-dinos'),
    desc:'Brush away the dig pit to uncover a buried skeleton, sort fossils in the ID lab, and come nose-to-nose with a toothy skull display.',
    fact:'Utah is dinosaur country — the state fossil is the Allosaurus, and some of the world\'s richest dig sites are a day trip away.',
    hours:'Open 10:00 – 18:00',
    events:[ {time:'11:00', name:'Junior dig: tools out, brushes ready'}, {time:'15:00', name:'Fossil ID lab: what did you find?'} ],
    highlights:[
      { emoji:'🦴', name:'Dig Pit', blurb:'A half-excavated skeleton hides under the sand — grab a brush and finish the job.' },
      { emoji:'🔬', name:'Fossil ID Lab', blurb:'Match bones, teeth, and claws to the dinosaurs they came from.' },
      { emoji:'💀', name:'Skull Display', blurb:'A grinning skull cast with teeth like bananas. Brave kids may pose for photos.' },
    ] },
  { id:'stillson-river-railroad', name:'Stillson River Railroad', glyph:'🚂', color:'#4A6FA5',
    build: g => adoptTile(g, 'stillson-river-railroad'),
    desc:'All aboard at the depot! Drive the locomotive, work the signals, and top off the tank at the water tower on the Stillson River line.',
    fact:'Real freight trains can take more than a mile to stop — that\'s why crossings always give trains the right of way.',
    hours:'Open 10:00 – 18:00',
    events:[ {time:'10:00', name:'First whistle: morning departure'}, {time:'13:30', name:'Signals & switches: run the line'} ],
    highlights:[
      { emoji:'🚂', name:'Locomotive Cab', blurb:'Climb in, ring the bell, and ease the throttle forward. Gently, engineer.' },
      { emoji:'🏠', name:'Stillson Depot', blurb:'Stamp tickets and call the all-aboard from behind the station window.' },
      { emoji:'💧', name:'Water Tower', blurb:'Old steam engines were thirsty — swing the spout and fill \'er up.' },
    ] },
  { id:'the-bee-garden', name:'The Bee Garden', glyph:'🐝', color:'#FFC145',
    build: g => adoptTile(g, 'the-bee-garden'),
    desc:'Climb through a honeycomb, scale the pollinator tower, and watch thousands of real honeybees at work in the live hive.',
    fact:'One honeybee makes about 1/12 of a teaspoon of honey in her whole life — teamwork is everything.',
    hours:'Open 10:00 – 18:00',
    events:[ {time:'11:30', name:'Find the queen: live hive watch'}, {time:'14:30', name:'Waggle dance-along'} ],
    highlights:[
      { emoji:'🗼', name:'Pollinator Tower', blurb:'Climb flower to flower like a bee on her morning rounds.' },
      { emoji:'🍯', name:'Honey Climber', blurb:'A honeycomb maze of hexagon cells to scramble through.' },
      { emoji:'🐝', name:'Live Hive', blurb:'A glass-walled colony of real bees. Can you spot the queen?' },
    ] },
  { id:'sensory-story-factory', name:'Sensory Room & Story Factory', glyph:'🎭', color:'#8F7BC0',
    build: g => adoptTile(g, 'sensory-story-factory'),
    desc:'Tell your tale on the story stage, star in your own comic panels, then dial the world down in the calming glow of the sensory room.',
    fact:'Everyone\'s senses work a little differently — this space lets you turn the world up or down until it fits just right.',
    hours:'Open 10:00 – 18:00',
    events:[ {time:'10:30', name:'Story circle: once upon a morning'}, {time:'15:30', name:'Make-a-comic workshop'} ],
    highlights:[
      { emoji:'🎭', name:'Story Stage', blurb:'Costumes, props, and a spotlight — the audience is waiting.' },
      { emoji:'🗯️', name:'Comic Panels', blurb:'Pose frame by frame and turn yourself into a superhero strip.' },
      { emoji:'🔮', name:'Sensory Orbs', blurb:'Soft glowing spheres that shift color at your touch.' },
    ] },
  { id:'saving-lives', name:'Saving Lives', glyph:'🚁', color:'#E0574F',
    build: g => adoptTile(g, 'saving-lives'),
    desc:'Suit up for a rescue: fly the Life Flight helicopter from its helipad, treat patients in the emergency department, and gear up in the rescue hangar.',
    fact:'Real Life Flight crews can be off the ground just minutes after a call comes in — every second counts.',
    hours:'Open 10:00 – 18:00',
    events:[ {time:'11:00', name:'Life Flight liftoff: crew briefing'}, {time:'14:00', name:'Teddy bear triage in the ER'} ],
    highlights:[
      { emoji:'🚁', name:'Life Flight Helicopter', blurb:'A kid-sized chopper on its own helipad. Rotors up, checklist done, clear to lift.' },
      { emoji:'🏥', name:'Emergency Department', blurb:'Take a pulse, wrap a cast, and make the teddy bear all better.' },
      { emoji:'🛠️', name:'Rescue Hangar', blurb:'Flight suits, headsets, and the gear real rescue crews count on.' },
    ] },
  { id:'utah-jazz-court', name:'Utah Jazz Court', glyph:'🏀', color:'#2EC4B6',
    build: g => adoptTile(g, 'utah-jazz-court'),
    desc:'Lace up on a kid-sized Jazz court — sink hoops, run the scoreboard, and call the play-by-play from the bench.',
    fact:'A regulation NBA rim stands 10 feet high. These ones are set just right for a kid-sized slam dunk.',
    hours:'Open 10:00 – 18:00',
    events:[ {time:'12:30', name:'Free-throw challenge'}, {time:'16:00', name:'Buzzer-beater shootout'} ],
    highlights:[
      { emoji:'🏀', name:'Mini Court', blurb:'Real hardwood feel, half-pint scale, full-size crowd noise (that\'s you).' },
      { emoji:'🎯', name:'Twin Hoops', blurb:'Two heights, zero excuses. Count it!' },
      { emoji:'📟', name:'Scoreboard', blurb:'Run the clock and the score — somebody has to be the ref.' },
    ] },
  { id:'art-lab', name:'Art Lab', glyph:'🎨', color:'#FF6FB1',
    build: g => adoptTile(g, 'art-lab'),
    desc:'A working studio where the mess is the point — paint at the big easels, mix colors on the giant palette, and hang your masterpiece before you go.',
    fact:'In process art there\'s no wrong answer — experimenting with the materials is the masterpiece.',
    hours:'Open 10:00 – 18:00',
    events:[ {time:'10:00', name:'Open studio: fresh paper, big brushes'}, {time:'15:00', name:'Giant palette color-mix lab'} ],
    highlights:[
      { emoji:'🎨', name:'Giant Palette', blurb:'A table-sized palette with paint pools you can really mix.' },
      { emoji:'🖼️', name:'Easel Studio', blurb:'Side-by-side easels under the skylight glow — pick a brush, any brush.' },
      { emoji:'🖌️', name:'Gallery Wall', blurb:'Today\'s masterpieces, hung and lit. One spot is saved for yours.' },
    ] },
  { id:'steam-lab', name:'STEAM Lab', glyph:'🧪', color:'#5AA9E6',
    build: g => adoptTile(g, 'steam-lab'),
    desc:'Science, tech, engineering, art, and math collide — launch the test rocket, spin the rooftop gears, and brew a bubbling beaker experiment.',
    fact:'The A in STEAM stands for Art — because inventing something new takes an artist\'s imagination too.',
    hours:'Open 10:00 – 18:00',
    events:[ {time:'11:30', name:'Rocket countdown: 3… 2… 1…'}, {time:'14:30', name:'Gear-works engineering challenge'} ],
    highlights:[
      { emoji:'🚀', name:'Test Rocket', blurb:'A candy-striped rocket on a launch ring, always at T-minus soon.' },
      { emoji:'⚙️', name:'Roof Gear', blurb:'A crown of gears you set spinning from below.' },
      { emoji:'🧪', name:'Bubbling Beaker', blurb:'A beaker that fizzes and glows — safe science, maximum drama.' },
    ] },
]

EXHIBIT_DATA.forEach((data, i)=>{
  const a = hallAngle(i);
  const R = 46;
  const g = new THREE.Group();
  g.position.set(Math.cos(a)*R, 0, Math.sin(a)*R);
  g.rotation.y = -a - Math.PI/2;         // face the center
  data.build(g);
  // physical monument sign at the front corner of the plinth, angled toward the approach;
  // placed radially (8.7 > plinth 6.65 + panel reach) so no part of it can clip the building
  const side = i % 2 ? -1 : 1;
  const sa = .84 * side, sr = 8.7;
  const sx = Math.sin(sa) * sr, sz = Math.cos(sa) * sr;
  const sign = makeHallSign(data);
  sign.position.set(sx, 0, sz);
  sign.rotation.y = sa;
  g.add(sign);
  data.sign = sign;
  const signWorld = new THREE.Vector3(sx, 0, sz).applyEuler(g.rotation).add(g.position);
  addCollider(signWorld.x, signWorld.z, .9);
  // glowing interaction pad — a doorstep plate on the loop road, clear of the plinth (6.65)
  glowPad(g, 9.25, new THREE.Color(data.color).getHex());
  scene.add(g);
  const padWorld = new THREE.Vector3(0, 0, 9.25).applyEuler(g.rotation).add(g.position);
  data.pad = { x:padWorld.x, z:padWorld.z, r:3.1 };
  data.group = g;
  addCollider(g.position.x, g.position.z, 6.2);
  exhibits.push(data);
});


/* ---------- interior rooms (one per exhibit) ---------- */
function makeEmojiPlane(emoji, size=2.6){
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.font = '190px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 128, 140);
  const tex = new THREE.CanvasTexture(cv);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map:tex, transparent:true })
  );
}

let inside = null;          // the exhibit whose interior we're in
let doorCd = 0;             // cooldown so exiting doesn't instantly re-enter
const artifactMeshes = [];

exhibits.forEach((e, i)=>{
  // door trigger between the pad (9.25) and the wall, just past the building collider's
  // stop line (7.1) so it only fires when you press into the doorway
  e.door = new THREE.Vector3(0, 0, 7.9).applyEuler(e.group.rotation).add(e.group.position);

  const g = new THREE.Group();
  const ox = 600 + i*140;
  g.position.set(ox, 0, 0);
  const cHex = new THREE.Color(e.color).getHex();

  const floor = box(28, .6, 22, C.cream); floor.position.y = -.3; g.add(floor);
  const rug = cyl(5.2, 5.2, .12, 20, cHex); rug.position.set(0, .07, -2); g.add(rug);
  const backWall = box(28, 9, .8, cHex); backWall.position.set(0, 4.5, -11); g.add(backWall);
  const stripe = box(28.2, 1.1, .9, C.cream); stripe.position.set(0, 6.6, -11); g.add(stripe);
  [-1, 1].forEach(s=>{
    const side = box(.8, 9, 22, cHex); side.position.set(s*14, 4.5, 0); g.add(side);
    const front = box(10.5, 9, .8, cHex); front.position.set(s*8.75, 4.5, 11); g.add(front);
  });
  const lintel = box(8, 3.2, .8, cHex); lintel.position.set(0, 7.4, 11); g.add(lintel);
  // hall name on the back wall
  const wallSign = makeSign(e.name, '#FFFFFF', e.color, 8, 2);
  wallSign.position.set(0, 6.6, -10.5); g.add(wallSign);
  // hanging lights
  [-7, 0, 7].forEach(x=>{
    const wire = cyl(.05, .05, 1.6, 4, C.ink); wire.position.set(x, 8.2, -2); g.add(wire);
    const bulb = sph(.5, C.gold, 6, { emissive:C.gold, emissiveIntensity:.9 });
    bulb.position.set(x, 7.2, -2); g.add(bulb);
  });

  // three artifact pedestals from the exhibit's highlights
  e.artifacts = [];
  e.highlights.forEach((h, j)=>{
    const px = -8 + j*8;
    const ped = cyl(1.25, 1.5, 1.7, 8, C.pathEdge);
    ped.position.set(px, .85, -6); g.add(ped);
    const disc = cyl(1.1, 1.1, .16, 12, cHex);
    disc.material.emissive = new THREE.Color(cHex);
    disc.material.emissiveIntensity = .45;
    disc.position.set(px, 1.78, -6); g.add(disc);
    const icon = makeEmojiPlane(h.emoji, 2.5);
    icon.position.set(px, 3.6, -6); g.add(icon);
    const label = makeSign(h.name, '#3B3563', '#FFFFFF', 4.4, 1.15);
    label.position.set(px, 1, -4.55); g.add(label);
    const artData = { h, e };
    [ped, icon].forEach(m => { m.userData.artifact = artData; artifactMeshes.push(m); });
    e.artifacts.push({ h, icon, x:ox + px, z:-6, phase:j*2 });
    addCollider(ox + px, -6, 1.7);
  });
  animated.push({ fn:(t)=>{
    if(inside !== e) return;
    e.artifacts.forEach(a=>{
      a.icon.position.y = 3.6 + Math.sin(t*1.8 + a.phase)*.22;
      const yaw = Math.atan2(camera.position.x - a.x, camera.position.z - a.z);
      a.icon.rotation.y = yaw;
    });
  }});

  // glowing exit pad by the doorway
  const exitPad = cyl(1.8, 1.8, .14, 16, C.gold);
  exitPad.material.emissive = new THREE.Color(C.gold);
  exitPad.material.emissiveIntensity = .7;
  exitPad.position.set(0, .3, 9.2); g.add(exitPad);
  const exitSign = makeSign('EXIT', '#3B3563', '#FFC145', 3, 1);
  exitSign.position.set(0, 4.6, 10.4); g.add(exitSign);

  e.interior = {
    group: g,
    entry: new THREE.Vector3(ox, 0, 5.6),
    exitPos: new THREE.Vector3(ox, 0, 9.2),
    bounds: { minX: ox - 12.6, maxX: ox + 12.6, minZ: -9.6, maxZ: 9.9 },
  };
  scene.add(g);
});

const fadeEl = document.getElementById('fade');
function fadeTo(mid){
  fadeEl.classList.add('on');
  setTimeout(()=>{ mid(); setTimeout(()=> fadeEl.classList.remove('on'), 80); }, 370);
}
function snapCamera(){
  camera.position.copy(followGoal());
  camTarget.copy(player.position).add(new THREE.Vector3(0, 2.4, 0));
}
function enterInterior(e){
  if(inside) return;
  sfx.open(); buzz(10);
  fadeTo(()=>{
    inside = e;
    doorCd = 1.6;
    clearTarget();
    vel.set(0, 0, 0); vy = 0; airY = 0;
    player.position.copy(e.interior.entry);
    player.rotation.y = Math.PI;          // face the artifacts
    camYaw = 0;                           // camera behind, looking into the room
    snapCamera();
    showToast(e.glyph + ' Inside ' + e.name + ' — step on the gold pad to leave');
  });
}
function exitInterior(){
  if(!inside) return;
  const e = inside;
  sfx.ui(); buzz(8);
  fadeTo(()=>{
    inside = null;
    doorCd = 1.6;
    clearTarget();
    vel.set(0, 0, 0); vy = 0; airY = 0;
    const out = new THREE.Vector3().subVectors(new THREE.Vector3(0,0,0), e.group.position).setY(0).normalize();
    player.position.copy(e.door).addScaledVector(out, 1.6);
    player.rotation.y = Math.atan2(out.x, out.z);
    camYaw = Math.atan2(-out.x, -out.z);
    snapCamera();
  });
}

/* ---------- promo blimp circling the campus ---------- */
const blimp = new THREE.Group();
const hull = sph(3.6, C.coral, 8); hull.scale.set(2.3, 1, 1); blimp.add(hull);
const hullStripe = sph(3.65, C.cream, 8); hullStripe.scale.set(1.1, .96, .96); hullStripe.position.x = -2; blimp.add(hullStripe);
const finT = box(.24, 2.2, 1.6, C.cream); finT.position.set(-7.2, 1.2, 0); finT.rotation.z = .3; blimp.add(finT);
[-1, 1].forEach(s=>{
  const fin = box(.24, 1.4, 2, C.cream); fin.position.set(-7.2, 0, s*1); fin.rotation.x = s*.4; blimp.add(fin);
});
const gondola = box(2.4, 1, 1.2, C.ink); gondola.position.y = -3.6; blimp.add(gondola);
[-1, 1].forEach(s=>{
  const strut = cyl(.06, .06, 1.2, 4, C.ink); strut.position.set(s*.8, -3, 0); blimp.add(strut);
});
const banner = makeSign('DISCOVERY GATEWAY ✦ EXPLORE · CREATE · PLAY', '#3B3563', '#FFC145', 15, 2.2);
banner.material.side = THREE.DoubleSide;
banner.position.set(-16, -.5, 0);
banner.rotation.y = Math.PI/2;
blimp.add(banner);
const rope = cyl(.04, .04, 3.4, 4, C.ink);
rope.rotation.z = Math.PI/2; rope.position.set(-9.9, -.3, 0);
blimp.add(rope);
blimp.traverse(o => { o.castShadow = false; });
scene.add(blimp);
animated.push({ fn:(t)=>{
  const a = t * .05;
  blimp.position.set(Math.cos(a)*58, 33 + Math.sin(t*.5)*1.4, Math.sin(a)*58);
  blimp.rotation.y = -(a + Math.PI/2);
  blimp.rotation.z = Math.sin(t*.4)*.03;
  banner.rotation.x = Math.sin(t*.9)*.07;
}});

/* ---------- fountain at plaza edge + clouds ---------- */
const clouds = [];
for(let i=0;i<7;i++){
  const cl = new THREE.Group();
  [[0,0,0,1.6],[1.4,-.2,.3,1.1],[-1.3,-.25,-.2,1.2]].forEach(([x,y,z,s])=>{
    const p = sph(s, 0xFFFFFF, 6, { roughness:1 });
    p.castShadow = false;
    p.position.set(x,y,z); cl.add(p);
  });
  cl.position.set((Math.random()-.5)*160, 26+Math.random()*10, (Math.random()-.5)*160);
  cl.scale.setScalar(1+Math.random());
  scene.add(cl);
  clouds.push({ g:cl, v:.6+Math.random()*.8 });
}
animated.push({ fn:(t,dt)=>{
  clouds.forEach(c=>{
    c.g.position.x += c.v*dt;
    if(c.g.position.x > 110) c.g.position.x = -110;
  });
}});

/* ---------- time of day (sun arc) ---------- */
// day tuned darker/more saturated than the original so the campus reads with contrast
const SKY = {
  day:   { sky:new THREE.Color(0x9CCFEF), fog:new THREE.Color(0xA9D6F0),
           hemiSky:new THREE.Color(0xDDF0FF), hemiGround:new THREE.Color(0x6F62B0), hemiI:.28,
           sunC:new THREE.Color(0xFFEECC), sunI:1.05, ground:new THREE.Color(C.ground) },
  dusk:  { sky:new THREE.Color(0xF2A46B), fog:new THREE.Color(0xEFA075),
           hemiSky:new THREE.Color(0xFFD9A8), hemiGround:new THREE.Color(0x6D5490), hemiI:.4,
           sunC:new THREE.Color(0xFF8A4A), sunI:1.05, ground:new THREE.Color(0xC7AE9C) },
  night: { sky:new THREE.Color(0x232A52), fog:new THREE.Color(0x232A52),
           hemiSky:new THREE.Color(0x4A57A0), hemiGround:new THREE.Color(0x2E2750), hemiI:.48,
           sunC:new THREE.Color(0xA7B6FF), sunI:.22, ground:new THREE.Color(0x8B84C4) },
};
let hourCur = 10.5, hourTarget = 10.5;   // 24h clock; sun is up 6:00–18:00
let nightMix = 0;                        // derived each frame; 1 = full night

function mix3(out, a, b, c, wa, wb, wc){
  out.setRGB(a.r*wa + b.r*wb + c.r*wc,
             a.g*wa + b.g*wb + c.g*wc,
             a.b*wa + b.b*wb + c.b*wc);
  return out;
}

/* stars */
const starGeo = new THREE.BufferGeometry();
const starPos = [];
for(let i=0;i<420;i++){
  const a = Math.random()*Math.PI*2;
  const el = Math.random()*Math.PI*.46 + .08;   // keep above horizon
  const r = 175;
  starPos.push(Math.cos(a)*Math.cos(el)*r, Math.sin(el)*r, Math.sin(a)*Math.cos(el)*r);
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color:0xFFFDF2, size:1.1, transparent:true, opacity:0, fog:false, sizeAttenuation:true });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

/* moon */
const moon = new THREE.Group();
const moonBody = sph(4.5, 0xFFF6D8, 8, { emissive:0xFFF0C4, emissiveIntensity:.9 });
moonBody.castShadow = false;
moon.add(moonBody);
[[1.4,1,.9],[-1.6,-1.2,.7],[.2,-1.8,.55]].forEach(([x,y,s])=>{
  const crater = sph(s, 0xEDDDB4, 6, { emissive:0xE8D4A4, emissiveIntensity:.6 });
  crater.castShadow = false;
  crater.scale.z = .35;
  crater.position.set(x, y, 4.1);
  moon.add(crater);
});
moon.position.set(55, 48, -70);
moon.lookAt(0, 0, 0);
scene.add(moon);
moon.visible = false;

/* sun disc — arcs across the sky with the time of day */
const sunDisc = new THREE.Mesh(
  new THREE.SphereGeometry(5.5, 16, 16),
  new THREE.MeshBasicMaterial({ color:0xFFE9A0, fog:false })
);
scene.add(sunDisc);

function applySkyTime(hour){
  const sunA = (hour - 6) / 12 * Math.PI;                    // 0 at 06:00, π at 18:00
  const elev = Math.sin(sunA);                               // sun elevation, <0 at night
  const moonA = (((hour + 6) % 24) / 12) * Math.PI;          // 0 at 18:00, π at 06:00
  const moonElev = Math.sin(moonA);

  const dayW  = THREE.MathUtils.clamp(elev / .35, 0, 1);     // full day once the sun is well up
  nightMix    = THREE.MathUtils.clamp(-elev / .25, 0, 1);    // full night a bit after sundown
  const duskW = 1 - dayW - nightMix;                         // golden-hour band in between

  const d = SKY.day, k = SKY.dusk, n = SKY.night;
  mix3(scene.background, d.sky, k.sky, n.sky, dayW, duskW, nightMix);
  mix3(scene.fog.color, d.fog, k.fog, n.fog, dayW, duskW, nightMix);
  mix3(hemi.color, d.hemiSky, k.hemiSky, n.hemiSky, dayW, duskW, nightMix);
  mix3(hemi.groundColor, d.hemiGround, k.hemiGround, n.hemiGround, dayW, duskW, nightMix);
  hemi.intensity = d.hemiI*dayW + k.hemiI*duskW + n.hemiI*nightMix;
  mix3(sun.color, d.sunC, k.sunC, n.sunC, dayW, duskW, nightMix);
  sun.intensity = d.sunI*dayW + k.sunI*duskW + n.sunI*nightMix;
  mix3(ground.material.color, d.ground, k.ground, n.ground, dayW, duskW, nightMix);

  // the shadow-casting light rides the sun's arc by day and the moon's by night
  if(elev >= 0) sun.position.set(-Math.cos(sunA)*80, 12 + elev*40, 30);
  else          sun.position.set(-Math.cos(moonA)*80, 12 + Math.max(0, moonElev)*40, 30);

  sunDisc.visible = elev > .02;
  sunDisc.position.set(-Math.cos(sunA)*115, Math.sin(sunA)*88, -70);
  moon.visible = moonElev > .02 && nightMix > .01;
  moon.position.set(-Math.cos(moonA)*115, Math.max(.01, moonElev)*88, -70);
  moon.lookAt(0, 0, 0);
  moonBody.material.emissiveIntensity = .9*nightMix;

  starMat.opacity = Math.max(0, nightMix*1.15 - .15);
  stars.rotation.y += .00012;
  glowMats.forEach(g => { g.m.emissiveIntensity = g.day + (g.night - g.day)*nightMix; });
  // clouds dim at night
  clouds.forEach(c => c.g.traverse(o => { if(o.material) o.material.color.setScalar(1 - nightMix*.55); }));

  const isNight = nightMix > .5;
  if(isNight !== document.body.classList.contains('night')){
    document.body.classList.toggle('night', isNight);
    skyBtn.textContent = isNight ? '🌙' : '☀️';
  }
  updateTimePanel(hour);
}

const skyBtn = document.getElementById('skyToggle');
skyBtn.textContent = '☀️';
function toggleNight(){
  const goNight = nightMix < .5;
  hourTarget = goNight ? 0 : 12;
  sfx.ui();
  showToast(goNight ? '🌙 Night mode — the museum lights up' : '☀️ Good morning!');
}

/* ---------- weather (clear / rain / snow) ---------- */
let weatherMode = 0;                       // 0 clear, 1 rain, 2 snow
const WEATHER_N = 650;
const wGeo = new THREE.BufferGeometry();
const wArr = new Float32Array(WEATHER_N * 3);
const wSpd = new Float32Array(WEATHER_N);
for(let i=0;i<WEATHER_N;i++){
  wArr[i*3]   = (Math.random()-.5)*95;
  wArr[i*3+1] = Math.random()*30;
  wArr[i*3+2] = (Math.random()-.5)*95;
  wSpd[i] = .7 + Math.random()*.6;
}
wGeo.setAttribute('position', new THREE.Float32BufferAttribute(wArr, 3));
const wMat = new THREE.PointsMaterial({ color:0xB7D4F0, size:.34, transparent:true, opacity:.55 });
const wPoints = new THREE.Points(wGeo, wMat);
wPoints.visible = false;
wPoints.frustumCulled = false;
scene.add(wPoints);

function updateWeather(t, dt){
  if(rainGain) rainGain.gain.value += (((weatherMode===1 && !muted) ? .09 : 0) - rainGain.gain.value) * Math.min(1, dt*3);
  if(!wPoints.visible) return;
  const p = wGeo.attributes.position.array;
  const fall = weatherMode === 1 ? 30 : 3.2;
  for(let i=0;i<WEATHER_N;i++){
    p[i*3+1] -= fall * wSpd[i] * dt;
    if(weatherMode === 2) p[i*3] += Math.sin(t*1.3 + i)*dt*1.6;   // snow drift
    if(p[i*3+1] < 0){
      p[i*3]   = player.position.x + (Math.random()-.5)*95;
      p[i*3+1] = 26 + Math.random()*6;
      p[i*3+2] = player.position.z + (Math.random()-.5)*95;
    }
  }
  wGeo.attributes.position.needsUpdate = true;
}

const weatherBtn = document.getElementById('weatherToggle');
weatherBtn.addEventListener('click', ()=>{
  weatherMode = (weatherMode + 1) % 3;
  sfx.ui();
  if(weatherMode === 0){
    wPoints.visible = false;
    weatherBtn.textContent = '🌤️';
    showToast('🌤️ Clear skies');
  } else if(weatherMode === 1){
    wPoints.visible = true;
    wMat.color.setHex(0xB7D4F0); wMat.size = .34; wMat.opacity = .55;
    weatherBtn.textContent = '🌧️';
    showToast('🌧️ Rainy day at the museum');
  } else {
    wPoints.visible = true;
    wMat.color.setHex(0xFFFFFF); wMat.size = .55; wMat.opacity = .9;
    weatherBtn.textContent = '❄️';
    showToast('❄️ Let it snow!');
  }
});

/* ---------- sound toggle ---------- */
const soundBtn = document.getElementById('soundToggle');
soundBtn.addEventListener('click', ()=>{
  initAudio();
  muted = !muted;
  if(master) master.gain.value = muted ? 0 : .45;
  soundBtn.textContent = muted ? '🔇' : '🔊';
  if(!muted) sfx.ui();
});

/* ---------- player (little explorer) ---------- */
const player = new THREE.Group();
const pBody = sph(.75, C.coral, 7); pBody.scale.set(1, 1.15, .9); pBody.position.y = 1.05; player.add(pBody);
const pBelly = sph(.5, C.cream, 6); pBelly.scale.set(1,1.1,.6); pBelly.position.set(0,1,.42); player.add(pBelly);
const pHead = sph(.62, C.cream, 7); pHead.position.y = 2.15; player.add(pHead);
const pHelmet = sph(.7, C.white, 8, { transparent:true, opacity:.35, roughness:.15 });
pHelmet.position.y = 2.2; player.add(pHelmet);
[-1,1].forEach(s=>{
  const eye = sph(.09, C.ink, 5); eye.position.set(s*.22, 2.22, .52); player.add(eye);
});
const smile = new THREE.Mesh(new THREE.TorusGeometry(.14,.035,5,10,Math.PI), mat(C.ink));
smile.position.set(0,2.06,.55); smile.rotation.set(0,0,Math.PI); player.add(smile);
const pPack = box(.7,.9,.4,C.teal); pPack.position.set(0,1.25,-.55); player.add(pPack);
const pAnt = cyl(.03,.03,.5,4,C.ink); pAnt.position.set(0,2.9,-.2); player.add(pAnt);
const pDot = sph(.09, C.gold, 5, { emissive:C.gold, emissiveIntensity:1 }); pDot.position.set(0,3.18,-.2); player.add(pDot);
const feet = [];
[-1,1].forEach(s=>{
  const f = sph(.26, C.ink, 6); f.scale.set(1,.6,1.3); f.position.set(s*.34,.16,0);
  player.add(f); feet.push(f);
});
const shadowBlob = new THREE.Mesh(new THREE.CircleGeometry(.85, 16),
  new THREE.MeshBasicMaterial({ color:0x3B3563, transparent:true, opacity:.18 }));
shadowBlob.rotation.x = -Math.PI/2; shadowBlob.position.y = .05;
player.add(shadowBlob);
player.position.set(0, 0, 20);
scene.add(player);

/* ---------- reactive NPCs: ducks that scatter ---------- */
const ducks = [];
function makeDuck(x, z, color){
  const g = new THREE.Group();
  const body = sph(.48, color, 6); body.scale.set(1.25, .95, 1); body.position.y = .5; g.add(body);
  const head = sph(.3, color, 6); head.position.set(.5, 1.05, 0); g.add(head);
  const beak = cone(.13, .32, 5, 0xF2A03D);
  beak.rotation.z = -Math.PI/2; beak.position.set(.85, 1.02, 0); g.add(beak);
  [-1, 1].forEach(s=>{
    const eye = sph(.06, C.ink, 4); eye.position.set(.62, 1.18, s*.14); g.add(eye);
  });
  const tail = cone(.16, .35, 5, color);
  tail.rotation.z = Math.PI/2 + .6; tail.position.set(-.55, .68, 0); g.add(tail);
  g.position.set(x, 0, z);
  scene.add(g);
  ducks.push({
    g, home:new THREE.Vector3(x, 0, z), target:new THREE.Vector3(x, 0, z),
    wanderT:Math.random()*4, quackT:0, phase:Math.random()*9,
  });
}
makeDuck( 32, -32, 0xFFF3C9);
makeDuck( 37, -27, 0xFFD98E);
makeDuck(-34,  31, 0xFFF3C9);
makeDuck( 41,  26, 0xFFC9DD);
makeDuck(-37, -28, 0xFFD98E);

animated.push({ fn:(t, dt)=>{
  ducks.forEach(d=>{
    d.wanderT -= dt; d.quackT -= dt;
    const toPlayer = d.g.position.distanceTo(player.position);
    let speed = 1.5;
    if(toPlayer < 4.5){
      // flee!
      const away = d.g.position.clone().sub(player.position).setY(0).normalize();
      d.target.copy(d.g.position).addScaledVector(away, 7);
      const dW = Math.hypot(d.target.x, d.target.z);
      if(dW > WORLD_R - 3) d.target.multiplyScalar((WORLD_R-3)/dW);
      speed = 6;
      if(d.quackT <= 0 && toPlayer < 3.5){ sfx.quack(); d.quackT = 1 + Math.random(); }
    } else if(d.wanderT <= 0 || d.g.position.distanceTo(d.target) < .4){
      d.wanderT = 3 + Math.random()*4;
      d.target.copy(d.home).add(new THREE.Vector3((Math.random()-.5)*12, 0, (Math.random()-.5)*12));
    }
    const dir = d.target.clone().sub(d.g.position).setY(0);
    const len = dir.length();
    if(len > .25){
      dir.normalize();
      d.g.position.addScaledVector(dir, Math.min(speed, len*4) * dt);
      let want = Math.atan2(-dir.z, dir.x);   // duck model faces local +x
      let diff = want - d.g.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      d.g.rotation.y += diff * Math.min(1, dt*9);
      d.g.position.y = Math.abs(Math.sin(t*11 + d.phase)) * .09 * Math.min(1, speed/3);
    } else {
      d.g.position.y = 0;
    }
  });
}});

/* ---------- robot greeter by the plaza ---------- */
const bot = new THREE.Group();
const botBody = box(1.2, 1.5, 1, C.cream); botBody.position.y = 1.3; bot.add(botBody);
const botChest = box(.7, .5, .1, C.teal, { emissive:C.teal, emissiveIntensity:.4 });
botChest.position.set(0, 1.4, .52); bot.add(botChest);
const botTrack = box(1.4, .6, 1.2, C.ink); botTrack.position.y = .3; bot.add(botTrack);
const botHead = box(.95, .8, .85, C.cream); botHead.position.y = 2.5; bot.add(botHead);
[-1, 1].forEach(s=>{
  const eye = sph(.14, C.teal, 5, { emissive:C.teal, emissiveIntensity:1 });
  eye.position.set(s*.24, 2.55, .46); bot.add(eye);
});
const botAnt = cyl(.04, .04, .7, 4, C.ink); botAnt.position.y = 3.2; bot.add(botAnt);
const botBulb = sph(.14, C.coral, 5, { emissive:C.coral, emissiveIntensity:1 }); botBulb.position.y = 3.6; bot.add(botBulb);
[-1, 1].forEach(s=>{
  const arm = box(.22, 1, .22, C.teal); arm.position.set(s*.8, 1.4, 0); bot.add(arm);
});
bot.position.set(9, 0, -11);
scene.add(bot);
addCollider(9, -11, 1.4);
let botBeepT = 0;
animated.push({ fn:(t, dt)=>{
  botBeepT -= dt;
  const dP = bot.position.distanceTo(player.position);
  if(dP < 9){
    const want = Math.atan2(player.position.x - bot.position.x, player.position.z - bot.position.z);
    let diff = want - bot.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    bot.rotation.y += diff * Math.min(1, dt*4);
    botBulb.material.emissiveIntensity = 1 + Math.sin(t*8)*.8;
    if(dP < 5 && botBeepT <= 0){ sfx.beep(); botBeepT = 7; }
  } else {
    botBulb.material.emissiveIntensity = .8 + Math.sin(t*2)*.3;
  }
  botHead.position.y = 2.5 + Math.sin(t*1.8)*.04;
}});

/* ---------- footprint breadcrumbs ---------- */
const FOOT_N = 44;
const footGeo = new THREE.CircleGeometry(.15, 8);
const foots = [];
for(let i=0;i<FOOT_N;i++){
  const m = new THREE.Mesh(footGeo, new THREE.MeshBasicMaterial({ color:0x3B3563, transparent:true, opacity:0 }));
  m.rotation.x = -Math.PI/2;
  m.scale.set(.8, 1.25, 1);
  m.position.y = .07;
  m.visible = false;
  scene.add(m);
  foots.push({ m, life:0 });
}
let footI = 0, footAcc = 0, footSide = 1, stepTone = 0;
function dropFootprint(spd){
  footAcc += spd;
  if(footAcc < 1.15) return;
  footAcc = 0; footSide *= -1; stepTone ^= 1;
  sfx.step(stepTone);
  const f = foots[footI++ % FOOT_N];
  const sideDir = new THREE.Vector3(Math.cos(player.rotation.y), 0, -Math.sin(player.rotation.y));
  f.m.position.copy(player.position).setY(.07).addScaledVector(sideDir, footSide*.27);
  f.m.rotation.z = -player.rotation.y;
  f.m.material.color.setHex(weatherMode === 2 ? 0x6C64A8 : 0x3B3563);
  f.m.visible = true;
  f.life = weatherMode === 2 ? 10 : 4.5;   // prints linger in snow
  if(stepTone && Math.hypot(vel.x, vel.z) > 11) spawnPuff(player.position, .55);
}
animated.push({ fn:(t, dt)=>{
  foots.forEach(f=>{
    if(f.life <= 0) return;
    f.life -= dt;
    f.m.material.opacity = Math.min(.28, f.life * .09);
    if(f.life <= 0) f.m.visible = false;
  });
}});

/* ---------- ground reactions: dust puffs + rain splashes ---------- */
const PUFF_N = 16;
const puffs = [];
for(let i=0;i<PUFF_N;i++){
  const m = new THREE.Mesh(new THREE.CircleGeometry(.5, 10),
    new THREE.MeshBasicMaterial({ color:0xFFFFFF, transparent:true, opacity:0, depthWrite:false }));
  m.rotation.x = -Math.PI/2; m.visible = false;
  scene.add(m);
  puffs.push({ m, life:0 });
}
let puffI = 0;
function spawnPuff(pos, size=1){
  const p = puffs[puffI++ % PUFF_N];
  p.m.position.set(pos.x + (Math.random()-.5)*.5, .09, pos.z + (Math.random()-.5)*.5);
  p.m.scale.setScalar(size);
  p.size = size;
  p.m.visible = true;
  p.life = .42;
}
const SPLASH_N = 26;
const splashes = [];
for(let i=0;i<SPLASH_N;i++){
  const m = new THREE.Mesh(new THREE.RingGeometry(.24, .34, 12),
    new THREE.MeshBasicMaterial({ color:0xCFE4F7, transparent:true, opacity:0, depthWrite:false }));
  m.rotation.x = -Math.PI/2; m.position.y = .08; m.visible = false;
  scene.add(m);
  splashes.push({ m, life:0 });
}
let splashI = 0, splashAcc = 0;
animated.push({ fn:(t, dt)=>{
  // puffs expand and fade
  puffs.forEach(p=>{
    if(p.life <= 0) return;
    p.life -= dt;
    const k = 1 - p.life/.42;
    p.m.scale.setScalar(p.size * (0.5 + k*1.6));
    p.m.material.opacity = .38 * (1 - k);
    if(p.life <= 0) p.m.visible = false;
  });
  // rain splashes ping around the player while it rains (outside only)
  if(weatherMode === 1 && !inside){
    splashAcc += dt * 13;
    while(splashAcc > 1){
      splashAcc -= 1;
      const s = splashes[splashI++ % SPLASH_N];
      s.m.position.set(
        player.position.x + (Math.random()-.5)*44, .08,
        player.position.z + (Math.random()-.5)*44
      );
      s.m.visible = true;
      s.life = .4;
    }
  }
  splashes.forEach(s=>{
    if(s.life <= 0) return;
    s.life -= dt;
    const k = 1 - s.life/.4;
    s.m.scale.setScalar(.6 + k*2.4);
    s.m.material.opacity = .5 * (1 - k);
    if(s.life <= 0) s.m.visible = false;
  });
}});

/* ---------- confetti ---------- */
const confetti = [];
const confGeo = new THREE.BoxGeometry(.3, .05, .18);
const confMats = [C.coral, C.teal, C.gold, C.violet, C.pink, C.blue].map(c => mat(c, { roughness:.5 }));
function confettiBurst(){
  if(reducedMotion) return;
  for(let i=0;i<140;i++){
    const m = new THREE.Mesh(confGeo, confMats[i % confMats.length]);
    m.castShadow = false;
    m.position.copy(player.position).add(new THREE.Vector3((Math.random()-.5)*2, 5.5+Math.random()*2, (Math.random()-.5)*2));
    m.rotation.set(Math.random()*3, Math.random()*3, Math.random()*3);
    confetti.push({
      m,
      v:new THREE.Vector3((Math.random()-.5)*9, 3+Math.random()*7, (Math.random()-.5)*9),
      rv:new THREE.Vector3((Math.random()-.5)*10, (Math.random()-.5)*10, (Math.random()-.5)*10),
      life:3.2 + Math.random()*1.6,
    });
    scene.add(m);
  }
}
animated.push({ fn:(t, dt)=>{
  for(let i=confetti.length-1; i>=0; i--){
    const c = confetti[i];
    c.v.y -= 6.5*dt;
    c.v.multiplyScalar(1 - .55*dt);          // air drag = flutter
    c.m.position.addScaledVector(c.v, dt);
    c.m.rotation.x += c.rv.x*dt; c.m.rotation.y += c.rv.y*dt; c.m.rotation.z += c.rv.z*dt;
    if(c.m.position.y < .06){ c.m.position.y = .06; c.v.set(0, 0, 0); c.rv.multiplyScalar(.9); }
    c.life -= dt;
    if(c.life < .6) c.m.scale.setScalar(Math.max(.01, c.life/.6));
    if(c.life <= 0){ scene.remove(c.m); confetti.splice(i, 1); }
  }
}});

/* ---------- input ---------- */
const keys = {};
addEventListener('keydown', e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if(e.code==='KeyE' || e.code==='Enter') tryInteract();
  if(e.code==='Space') tryJump();
  if(e.code==='KeyN') toggleNight();
  if(e.code==='KeyR') respawn();
  if(e.code==='Escape'){
    if(passOpen) closePassport();
    else if(drawerOpen) closeDrawer();
    else if(custOpen){ custOpen = false; custEl.classList.remove('open'); }
    else if(detailOpen) closeDetail();
    else closeModal();
  }
});
addEventListener('keyup', e=> keys[e.code] = false);

/* touch joystick */
const joyEl = document.getElementById('joystick');
const stickEl = document.getElementById('stick');
const joy = { active:false, x:0, y:0, id:null };
const isTouch = matchMedia('(pointer:coarse)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if(isTouch){
  document.body.classList.add('touch');
  document.getElementById('introHint').textContent = 'Joystick to walk · double-tap to run there · drag to look around';
}
joyEl.addEventListener('pointerdown', e=>{
  joy.active = true; joy.id = e.pointerId;
  joyEl.setPointerCapture(e.pointerId);
  moveStick(e);
});
joyEl.addEventListener('pointermove', e=>{ if(joy.active && e.pointerId===joy.id) moveStick(e); });
const endJoy = e=>{
  if(e.pointerId!==joy.id) return;
  joy.active=false; joy.x=0; joy.y=0;
  stickEl.style.transform = 'translate(-50%,-50%)';
};
joyEl.addEventListener('pointerup', endJoy);
joyEl.addEventListener('pointercancel', endJoy);
function moveStick(e){
  const r = joyEl.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width/2);
  let dy = e.clientY - (r.top + r.height/2);
  const max = r.width/2 - 22;
  const len = Math.hypot(dx, dy);
  if(len > max){ dx = dx/len*max; dy = dy/len*max; }
  joy.x = dx/max; joy.y = dy/max;
  stickEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
document.getElementById('touchInteract').addEventListener('click', tryInteract);
document.getElementById('touchJump').addEventListener('pointerdown', e=>{ e.preventDefault(); tryJump(); });

/* camera drag-orbit + zoom (wheel / pinch) */
let camYaw = Math.PI, camPitch = .62, camDist = 17;
const CAM_MIN = 8, CAM_MAX = 40;
const pointers = new Map();
let pinchDist = 0;

renderer.domElement.addEventListener('pointerdown', e=>{
  pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
  if(pointers.size === 2){
    const [a, b] = [...pointers.values()];
    pinchDist = Math.hypot(a.x-b.x, a.y-b.y);
  }
});
addEventListener('pointermove', e=>{
  if(!pointers.has(e.pointerId)) return;
  const p = pointers.get(e.pointerId);
  if(pointers.size === 1){
    camYaw   -= (e.clientX - p.x) * .0045;
    camPitch += (e.clientY - p.y) * .003;
    camPitch = Math.max(.22, Math.min(1.2, camPitch));
  }
  p.x = e.clientX; p.y = e.clientY;
  if(pointers.size === 2){
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x-b.x, a.y-b.y);
    camDist = Math.max(CAM_MIN, Math.min(CAM_MAX, camDist - (d - pinchDist) * .06));
    pinchDist = d;
  }
});
const dropPointer = e=> pointers.delete(e.pointerId);
addEventListener('pointerup', dropPointer);
addEventListener('pointercancel', dropPointer);

addEventListener('wheel', e=>{
  camDist = Math.max(CAM_MIN, Math.min(CAM_MAX, camDist + e.deltaY * .022));
}, { passive:true });

/* ---------- double-click / double-tap to run there ---------- */
const ray = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let moveTarget = null, autoLastDist = Infinity, autoStall = 0;

const marker = new THREE.Group();
const mkRing = new THREE.Mesh(new THREE.TorusGeometry(1.1, .1, 6, 26),
  mat(C.gold, { emissive:C.gold, emissiveIntensity:1 }));
mkRing.rotation.x = Math.PI/2; mkRing.position.y = .25; marker.add(mkRing);
const mkRing2 = new THREE.Mesh(new THREE.TorusGeometry(.55, .07, 6, 20),
  mat(C.white, { emissive:C.gold, emissiveIntensity:.8 }));
mkRing2.rotation.x = Math.PI/2; mkRing2.position.y = .28; marker.add(mkRing2);
const mkArrow = cone(.42, .85, 6, C.gold);
mkArrow.rotation.x = Math.PI; mkArrow.position.y = 1.7; marker.add(mkArrow);
marker.visible = false;
scene.add(marker);
animated.push({ fn:(t)=>{
  if(!marker.visible) return;
  mkRing.scale.setScalar(1 + Math.sin(t*5)*.14);
  mkRing2.rotation.z = t*2;
  mkArrow.position.y = 1.6 + Math.sin(t*4.5)*.22;
  mkArrow.rotation.y = t*1.5;
}});

function clearTarget(){ moveTarget = null; pendingExhibit = null; marker.visible = false; }

let pendingExhibit = null;    // exhibit to open when the avatar arrives
const exhibitMeshes = [];
exhibits.forEach(e => e.group.traverse(o => {
  if(o.isMesh){ o.userData.exhibit = e; exhibitMeshes.push(o); }
}));

function setWorldTarget(x, z){
  const hit = new THREE.Vector3(x, 0, z);
  if(inside){
    const b = inside.interior.bounds;
    hit.x = Math.max(b.minX + .6, Math.min(b.maxX - .6, hit.x));
    hit.z = Math.max(b.minZ + .6, Math.min(b.maxZ - .6, hit.z));
  } else {
    // keep the target inside the park
    const dC = Math.hypot(hit.x, hit.z);
    if(dC > WORLD_R - .5){ hit.x *= (WORLD_R-.5)/dC; hit.z *= (WORLD_R-.5)/dC; }
  }
  // if the click landed inside a building/tree, walk to its edge instead
  for(const c of colliders){
    const dx = hit.x - c.x, dz = hit.z - c.z;
    const d = Math.hypot(dx, dz), min = c.r + .9;
    if(d < min){
      if(d < .001){ hit.x = c.x + min; }
      else { hit.x = c.x + dx/d*min; hit.z = c.z + dz/d*min; }
    }
  }
  moveTarget = hit;
  pendingExhibit = null;
  autoLastDist = Infinity; autoStall = 0;
  marker.position.set(hit.x, 0, hit.z);
  marker.visible = true;
}

function runToExhibit(e){
  const dPad = Math.hypot(player.position.x - e.pad.x, player.position.z - e.pad.z);
  if(dPad < e.pad.r){ openExhibit(e); return; }      // already there
  setWorldTarget(e.pad.x, e.pad.z);
  pendingExhibit = e;
}

function raycastExhibit(clientX, clientY){
  if(inside) return null;   // exhibits aren't clickable from inside
  const ndc = new THREE.Vector2((clientX/innerWidth)*2 - 1, -(clientY/innerHeight)*2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(exhibitMeshes, false);
  return hits.length ? hits[0].object.userData.exhibit : null;
}
function raycastArtifact(clientX, clientY){
  if(!inside) return null;
  const ndc = new THREE.Vector2((clientX/innerWidth)*2 - 1, -(clientY/innerHeight)*2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(artifactMeshes, false);
  return hits.length ? hits[0].object.userData.artifact : null;
}

function setRunTarget(clientX, clientY){
  if(!started || modalOpen || detailOpen) return;
  // clicking a building runs to its pad and opens it
  const ex = raycastExhibit(clientX, clientY);
  if(ex){ runToExhibit(ex); return; }
  const ndc = new THREE.Vector2((clientX/innerWidth)*2 - 1, -(clientY/innerHeight)*2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = new THREE.Vector3();
  if(!ray.ray.intersectPlane(groundPlane, hit)) return;
  setWorldTarget(hit.x, hit.z);
}

renderer.domElement.addEventListener('dblclick', e=> setRunTarget(e.clientX, e.clientY));

/* custom double-tap for touch (dblclick is unreliable on mobile) */
let lastTapT = 0, lastTapX = 0, lastTapY = 0, tapDownX = 0, tapDownY = 0;
renderer.domElement.addEventListener('pointerdown', e=>{ tapDownX = e.clientX; tapDownY = e.clientY; });
renderer.domElement.addEventListener('pointerup', e=>{
  if(e.pointerType !== 'touch') return;
  if(Math.hypot(e.clientX - tapDownX, e.clientY - tapDownY) > 12) return;  // that was a drag
  // single tap directly on a building = run there and open it; on an artifact = inspect
  if(started && !modalOpen && !detailOpen){
    if(inside){
      const a = raycastArtifact(e.clientX, e.clientY);
      if(a){ openArtifact({ h:a.h, e:a.e }); lastTapT = 0; return; }
    } else {
      const ex = raycastExhibit(e.clientX, e.clientY);
      if(ex){ runToExhibit(ex); lastTapT = 0; return; }
    }
  }
  const now = performance.now();
  if(now - lastTapT < 320 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 44){
    setRunTarget(e.clientX, e.clientY);
    lastTapT = 0;
  } else {
    lastTapT = now; lastTapX = e.clientX; lastTapY = e.clientY;
  }
});

/* single mouse click on a building = run there and open it; on an artifact = inspect */
renderer.domElement.addEventListener('click', e=>{
  if(!started || modalOpen || detailOpen) return;
  if(Math.hypot(e.clientX - tapDownX, e.clientY - tapDownY) > 8) return;   // camera drag, not a click
  if(inside){
    const a = raycastArtifact(e.clientX, e.clientY);
    if(a) openArtifact({ h:a.h, e:a.e });
    return;
  }
  const ex = raycastExhibit(e.clientX, e.clientY);
  if(ex) runToExhibit(ex);
});

/* pointer cursor when hovering a building or artifact */
let hoverT = 0;
renderer.domElement.addEventListener('mousemove', e=>{
  const now = performance.now();
  if(now - hoverT < 90) return;
  hoverT = now;
  if(!started || modalOpen || detailOpen){ renderer.domElement.style.cursor = ''; return; }
  const hit = inside ? raycastArtifact(e.clientX, e.clientY) : raycastExhibit(e.clientX, e.clientY);
  renderer.domElement.style.cursor = hit ? 'pointer' : '';
});

/* ---------- movement / physics ---------- */
const vel = new THREE.Vector3();
let heading = Math.PI;
let walkT = 0;
let modalOpen = false;
let started = false;
let vy = 0, airY = 0, wasAirborne = false;   // vertical hop physics
const GRAV = 42, JUMP_V = 15;

function tryJump(){
  if(modalOpen || detailOpen || !started || cine >= 0) return;
  if(airY <= .001 && vy <= 0){ vy = JUMP_V; sfx.jump(); }
}

function respawn(){
  inside = null;
  doorCd = 1.5;
  player.position.set(0, 0, 20);
  vel.set(0,0,0);
  vy = 0; airY = 0;
  clearTarget();
  camYaw = Math.PI;
}

function updatePlayer(dt, t){
  // vertical hop physics runs even while panels are open, so landings finish
  vy -= GRAV * dt;
  airY = Math.max(0, airY + vy * dt);
  if(airY === 0 && vy < 0) vy = 0;

  if(modalOpen || detailOpen || !started || cine >= 0){ vel.multiplyScalar(.85); player.position.y = airY; return; }

  let ix = 0, iz = 0;
  if(keys['KeyW']||keys['ArrowUp'])    iz -= 1;
  if(keys['KeyS']||keys['ArrowDown'])  iz += 1;
  if(keys['KeyA']||keys['ArrowLeft'])  ix -= 1;
  if(keys['KeyD']||keys['ArrowRight']) ix += 1;
  if(joy.active){ ix += joy.x; iz += joy.y; }

  const inputLen = Math.min(1, Math.hypot(ix, iz));
  if(inputLen > .01 && moveTarget) clearTarget();      // manual input takes over

  // autopilot toward the double-click target
  let auto = null;
  if(moveTarget){
    const dx = moveTarget.x - player.position.x;
    const dz = moveTarget.z - player.position.z;
    const dist = Math.hypot(dx, dz);
    if(dist < .55){
      const pe = pendingExhibit;
      clearTarget();
      if(pe) openExhibit(pe);
    } else {
      auto = { x:dx/dist, z:dz/dist, dist };
      // stall detection: if a wall keeps us from getting closer, give up gracefully
      if(dist > autoLastDist - .015) autoStall += dt; else autoStall = 0;
      autoLastDist = dist;
      if(autoStall > 1){ clearTarget(); auto = null; }
    }
  }

  const running = keys['ShiftLeft']||keys['ShiftRight'] || inputLen > .92 || !!auto;
  const speed = running ? 14 : 9;

  if(auto){
    const sp = Math.min(speed, auto.dist * 3 + 2.5);   // ease in on arrival
    vel.x += (auto.x * sp - vel.x) * Math.min(1, dt*10);
    vel.z += (auto.z * sp - vel.z) * Math.min(1, dt*10);
    heading = Math.atan2(vel.x, vel.z);
  } else if(inputLen > .01){
    // camera-relative direction
    const fwd = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const dir = new THREE.Vector3()
      .addScaledVector(fwd, -iz)
      .addScaledVector(right, ix)
      .normalize();
    vel.x += (dir.x * speed * inputLen - vel.x) * Math.min(1, dt*10);
    vel.z += (dir.z * speed * inputLen - vel.z) * Math.min(1, dt*10);
    heading = Math.atan2(vel.x, vel.z);
  } else {
    vel.x *= Math.pow(.0001, dt);
    vel.z *= Math.pow(.0001, dt);
  }

  player.position.x += vel.x * dt;
  player.position.z += vel.z * dt;

  // collide with props
  for(const c of colliders){
    const dx = player.position.x - c.x;
    const dz = player.position.z - c.z;
    const d = Math.hypot(dx, dz);
    const min = c.r + .7;
    if(d < min && d > .0001){
      player.position.x = c.x + dx/d*min;
      player.position.z = c.z + dz/d*min;
    }
  }
  // bounds + doorways
  doorCd = Math.max(0, doorCd - dt);
  if(inside){
    const b = inside.interior.bounds;
    player.position.x = Math.max(b.minX, Math.min(b.maxX, player.position.x));
    player.position.z = Math.max(b.minZ, Math.min(b.maxZ, player.position.z));
    // step on the gold pad to leave
    if(doorCd <= 0){
      const ex = inside.interior.exitPos;
      if(Math.hypot(player.position.x - ex.x, player.position.z - ex.z) < 1.5) exitInterior();
    }
  } else {
    const dC = Math.hypot(player.position.x, player.position.z);
    if(dC > WORLD_R){
      player.position.x *= WORLD_R/dC;
      player.position.z *= WORLD_R/dC;
    }
    // walk into a doorway to peek inside
    if(doorCd <= 0){
      for(const e of exhibits){
        if(Math.hypot(player.position.x - e.door.x, player.position.z - e.door.z) < 1.0){
          enterInterior(e);
          break;
        }
      }
    }
  }

  // face travel direction
  let dh = heading - player.rotation.y;
  dh = Math.atan2(Math.sin(dh), Math.cos(dh));
  player.rotation.y += dh * Math.min(1, dt*12);

  // walk animation + hop
  const spd = Math.hypot(vel.x, vel.z);
  walkT += dt * spd * 1.35;
  const grounded = airY <= .001;
  if(grounded && wasAirborne){ sfx.land(); buzz(12); spawnPuff(player.position, 1.15); }
  wasAirborne = !grounded;
  if(grounded && spd > 2.5) dropFootprint(spd * dt);
  const bob = grounded ? Math.max(0, Math.sin(walkT*2)) * Math.min(1, spd/8) * .22 : 0;
  player.position.y = bob + airY;

  // squash & stretch on the hop
  let targetSY = 1;
  if(!grounded) targetSY = 1 + Math.max(-.14, Math.min(.16, vy * .012));
  player.scale.y += (targetSY - player.scale.y) * Math.min(1, dt*14);
  player.scale.x = player.scale.z = 1 + (1 - player.scale.y) * .6;

  pBody.rotation.z = Math.sin(walkT*2) * .06 * Math.min(1, spd/8);
  if(grounded){
    feet[0].position.y = .16 + Math.max(0, Math.sin(walkT*2)) * .3 * Math.min(1, spd/8);
    feet[1].position.y = .16 + Math.max(0, Math.sin(walkT*2+Math.PI)) * .3 * Math.min(1, spd/8);
  } else {
    feet[0].position.y = feet[1].position.y = .34;   // tuck feet mid-air
  }
  shadowBlob.position.y = .05 - player.position.y;   // shadow stays on the ground
  shadowBlob.material.opacity = .18 * Math.max(.35, 1 - airY/4);
  shadowBlob.scale.setScalar(Math.max(.55, 1 - airY/7));
  pDot.material.emissiveIntensity = .7 + Math.sin(t*4)*.3;
}

/* ---------- camera: cinematic > exhibit close-up > attract > follow ---------- */
const camTarget = new THREE.Vector3();
let cine = -1;                 // 0..1 while the intro flyover plays
let attract = false;
let currentExhibit = null;     // {e, t0, baseAng} while a panel is open
const lookHead = new THREE.Vector3();

function followGoal(){
  const baseH = 2.5 + camDist * .1;
  return player.position.clone().add(new THREE.Vector3(
    Math.sin(camYaw) * Math.cos(camPitch) * camDist,
    Math.sin(camPitch) * camDist + baseH,
    Math.cos(camYaw) * Math.cos(camPitch) * camDist
  ));
}

function updateCamera(dt, t){
  // 1 — cinematic intro flyover: spiral down from above the campus
  if(cine >= 0){
    cine += dt / 4.4;
    const p = Math.min(1, cine);
    const s = p*p*(3 - 2*p);                       // smoothstep
    const ang = Math.PI*1.55 - s*1.35;
    const r = 95 - s*72;
    const spiral = new THREE.Vector3(Math.cos(ang)*r, 60 - s*47, Math.sin(ang)*r);
    camera.position.copy(spiral.lerp(followGoal(), s*s));
    lookHead.copy(player.position).add(new THREE.Vector3(0, 2.4, 0));
    camTarget.copy(new THREE.Vector3(0, 7, 0).lerp(lookHead, s));
    camera.lookAt(camTarget);
    if(cine >= 1){ cine = -1; }
    return;
  }
  // 2 — exhibit close-up: slow orbit of the building behind the open panel
  if((modalOpen || detailOpen) && currentExhibit && !inside){
    const b = currentExhibit.e.group.position;
    const ang = currentExhibit.baseAng + (t - currentExhibit.t0) * .16;
    const goal = new THREE.Vector3(b.x + Math.cos(ang)*16.5, 10, b.z + Math.sin(ang)*16.5);
    camera.position.lerp(goal, 1 - Math.pow(.002, dt));
    camTarget.lerp(new THREE.Vector3(b.x, 4.2, b.z), 1 - Math.pow(.001, dt));
    camera.lookAt(camTarget);
    return;
  }
  // 3 — idle attract mode: lazy orbit of the whole campus
  if(attract){
    const ang = t * .07;
    const goal = new THREE.Vector3(Math.cos(ang)*66, 37, Math.sin(ang)*66);
    camera.position.lerp(goal, 1 - Math.pow(.02, dt));
    camTarget.lerp(new THREE.Vector3(0, 5, 0), 1 - Math.pow(.01, dt));
    camera.lookAt(camTarget);
    return;
  }
  // 4 — normal follow camera
  const goal = followGoal();
  camera.position.lerp(goal, 1 - Math.pow(.0001, dt));
  camTarget.lerp(player.position.clone().add(new THREE.Vector3(0, 2.4, 0)), 1 - Math.pow(.00005, dt));
  camera.lookAt(camTarget);
}

/* ---------- interaction ---------- */
const promptEl = document.getElementById('prompt');
const promptText = document.getElementById('promptText');
const touchBtn = document.getElementById('touchInteract');
const modal = document.getElementById('modal');
const visited = new Set();
let nearExhibit = null;

const chipsEl = document.getElementById('chips');
EXHIBIT_DATA.forEach(e=>{
  const c = document.createElement('div');
  c.className = 'chip'; c.id = 'chip-' + e.id; c.textContent = e.glyph;
  c.title = e.name;
  chipsEl.appendChild(c);
});

let prevNear = null;
let nearArtifact = null;
function updateInteraction(){
  nearExhibit = null; nearArtifact = null;
  if(inside){
    for(const a of inside.artifacts){
      if(Math.hypot(player.position.x - a.x, player.position.z - a.z) < 2.6){ nearArtifact = a; break; }
    }
    if(nearArtifact && nearArtifact !== prevNear && !modalOpen) sfx.pad();
    prevNear = nearArtifact;
    if(nearArtifact && !modalOpen){
      promptText.textContent = 'Inspect ' + nearArtifact.h.name;
      promptEl.classList.add('show');
      touchBtn.classList.add('pulse');
    } else {
      promptEl.classList.remove('show');
      touchBtn.classList.remove('pulse');
    }
    return;
  }
  for(const e of exhibits){
    const d = Math.hypot(player.position.x - e.pad.x, player.position.z - e.pad.z);
    if(d < e.pad.r){ nearExhibit = e; break; }
  }
  if(nearExhibit && nearExhibit !== prevNear && !modalOpen){ sfx.pad(); buzz(8); }
  prevNear = nearExhibit;
  if(nearExhibit && !modalOpen){
    promptText.textContent = 'Enter ' + nearExhibit.name;
    promptEl.classList.add('show');
    touchBtn.classList.add('pulse');
  } else {
    promptEl.classList.remove('show');
    touchBtn.classList.remove('pulse');
  }
}

function openArtifact(a){
  if(modalOpen) return;
  currentExhibit = null;               // no building orbit inside
  document.getElementById('mGlyph').textContent = a.h.emoji;
  document.getElementById('mGlyph').style.background = a.e.color + '22';
  document.getElementById('mKicker').textContent = 'Artifact · ' + a.e.name;
  document.getElementById('mTitle').textContent = a.h.name;
  document.getElementById('mBody').textContent = a.h.blurb;
  document.getElementById('mFact').style.display = 'none';
  document.getElementById('mAction').style.display = 'none';
  modal.classList.add('show');
  modalOpen = true;
  sfx.open(); buzz(10);
  const key = a.e.id + ':' + a.h.name;
  if(!inspected.has(key)){ inspected.add(key); savePassport(); }
}

function openExhibit(e){
  if(modalOpen) return;
  const b = e.group.position;
  currentExhibit = {
    e,
    t0: clock.elapsedTime,
    baseAng: Math.atan2(-b.z, -b.x),      // start the orbit from the plaza side
  };
  document.getElementById('mGlyph').textContent = e.glyph;
  document.getElementById('mGlyph').style.background = e.color + '22';
  document.getElementById('mKicker').textContent = 'Exhibit hall · Zone 0' + (exhibits.indexOf(e)+1);
  document.getElementById('mTitle').textContent = e.name;
  document.getElementById('mBody').textContent = e.desc;
  document.getElementById('mFact').style.display = '';
  document.getElementById('mFact').innerHTML = '<b>Did you know?</b> ' + e.fact;
  document.getElementById('mAction').style.display = '';
  modal.classList.add('show');
  modalOpen = true;
  sfx.open();
  if(!visited.has(e.id)){
    visited.add(e.id);
    stampDates[e.id] = new Date().toLocaleDateString(undefined, { month:'short', day:'numeric' });
    savePassport();
    passDotEl.classList.add('on');
    document.getElementById('chip-'+e.id).classList.add('done');
    if(visited.size === exhibits.length){
      confettiBurst();
      sfx.fanfare();
      buzz([40, 60, 40, 60, 120]);
      showToast('🎉 You explored the whole museum!');
    } else {
      sfx.discover();
      buzz([20, 40, 20]);
      showToast(e.name + ' discovered! ' + visited.size + '/' + exhibits.length);
    }
  }
}

function tryInteract(){
  if(modalOpen || detailOpen) return;
  if(inside && nearArtifact){ openArtifact({ h:nearArtifact.h, e:inside }); return; }
  if(nearExhibit) openExhibit(nearExhibit);
}
function closeModal(){
  modal.classList.remove('show');
  modalOpen = false;
  currentExhibit = null;
}
document.getElementById('mClose').addEventListener('click', closeModal);

/* ---------- exhibit detail page ---------- */
let detailOpen = false;
const detailEl = document.getElementById('detail');
function openDetail(e){
  closeModal();
  currentExhibit = { e, t0: clock.elapsedTime, baseAng: Math.atan2(-e.group.position.z, -e.group.position.x) };
  detailOpen = true;
  document.getElementById('dHero').style.background =
    `linear-gradient(150deg, ${e.color}, ${e.color}CC 60%, #3B3563)`;
  document.getElementById('dGlyph').textContent = e.glyph;
  document.getElementById('dKicker').textContent = 'Exhibit hall · Zone 0' + (exhibits.indexOf(e)+1);
  document.getElementById('dTitle').textContent = e.name;
  document.getElementById('dHours').textContent = e.hours;
  document.getElementById('dGallery').innerHTML = e.highlights.map((h, i)=>
    `<div class="g-tile" style="background:linear-gradient(${140+i*40}deg, ${e.color}33, ${e.color}AA)">${h.emoji}<small>${h.name}</small></div>`
  ).join('');
  document.getElementById('dEvents').innerHTML = e.events.map(ev=>
    `<div class="ev"><div class="tm">${ev.time}</div><div class="en">${ev.name}</div></div>`
  ).join('');
  document.getElementById('dHighlights').innerHTML = e.highlights.map(h=>
    `<div class="hl"><div class="he">${h.emoji}</div><div><div class="hn">${h.name}</div><div class="hb">${h.blurb}</div></div></div>`
  ).join('');
  detailEl.classList.add('open');
  detailEl.dataset.id = e.id;
  history.replaceState(null, '', '#' + e.id);   // shareable deep link
  sfx.open();
}
function closeDetail(){
  detailOpen = false;
  currentExhibit = null;
  detailEl.classList.remove('open');
  history.replaceState(null, '', location.pathname + location.search);
}
document.getElementById('mAction').addEventListener('click', ()=>{
  if(currentExhibit) openDetail(currentExhibit.e);
});
document.getElementById('dClose').addEventListener('click', closeDetail);
document.getElementById('dGo').addEventListener('click', ()=>{
  const e = exhibits.find(x => x.id === detailEl.dataset.id);
  closeDetail();
  if(e && !inside) runToExhibit(e);
  else if(e && inside) showToast('Step on the gold pad to head back outside first');
});
document.getElementById('dPeek').addEventListener('click', ()=>{
  const e = exhibits.find(x => x.id === detailEl.dataset.id);
  closeDetail();
  if(e){
    if(inside === e) return;
    if(inside){ const cur = inside; inside = null; cur && (doorCd = 0); }
    enterInterior(e);
  }
});

/* ---------- exhibit list drawer ---------- */
let drawerOpen = false;
const drawerEl = document.getElementById('drawer');
const scrimEl = document.getElementById('scrim');
function buildDrawer(){
  document.getElementById('drawerList').innerHTML = exhibits.map(e=>`
    <button class="d-item" data-id="${e.id}">
      <div class="ic" style="background:${e.color}22">${e.glyph}</div>
      <div><div class="nm">${e.name}</div><div class="st">${visited.has(e.id) ? '✓ Explored' : 'Not visited yet'} · ${e.hours}</div></div>
      <div class="go">Go</div>
    </button>`).join('');
  document.querySelectorAll('.d-item').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const e = exhibits.find(x => x.id === btn.dataset.id);
      closeDrawer();
      sfx.ui();
      if(!e) return;
      if(inside){ showToast('Step on the gold pad to head back outside first'); return; }
      runToExhibit(e);
    });
  });
}
function openDrawer(){ buildDrawer(); drawerOpen = true; drawerEl.classList.add('open'); scrimEl.classList.add('on'); sfx.ui(); }
function closeDrawer(){ drawerOpen = false; drawerEl.classList.remove('open'); scrimEl.classList.remove('on'); }
document.getElementById('menuBtn').addEventListener('click', ()=> drawerOpen ? closeDrawer() : openDrawer());
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
scrimEl.addEventListener('click', closeDrawer);

/* ---------- avatar customizer ---------- */
let custOpen = false;
const custEl = document.getElementById('customizer');
const SUIT_COLORS = [C.coral, C.teal, C.violet, C.gold, C.pink, C.blue];
const PACK_COLORS = [C.teal, C.coral, C.gold, C.ink];
function swatchRow(elId, colors, apply, selIdx){
  const el = document.getElementById(elId);
  el.innerHTML = '';
  colors.forEach((col, i)=>{
    const b = document.createElement('button');
    b.className = 'sw' + (i === selIdx ? ' sel' : '');
    b.style.background = '#' + col.toString(16).padStart(6, '0');
    b.addEventListener('click', ()=>{
      el.querySelectorAll('.sw').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      apply(col);
      sfx.ui(); buzz(6);
    });
    el.appendChild(b);
  });
}
swatchRow('suitSw', SUIT_COLORS, col => pBody.material.color.setHex(col), 0);
swatchRow('packSw', PACK_COLORS, col => pPack.material.color.setHex(col), 0);
document.getElementById('helmBtn').addEventListener('click', function(){
  pHelmet.visible = !pHelmet.visible;
  this.textContent = 'Helmet: ' + (pHelmet.visible ? 'on' : 'off');
  sfx.ui();
});
document.getElementById('custBtn').addEventListener('click', ()=>{
  custOpen = !custOpen;
  custEl.classList.toggle('open', custOpen);
  if(custOpen) closeTimePanel();
  sfx.ui();
});

/* ---------- explorer passport ---------- */
const PASS_KEY = 'wm_passport_v1';
const stampDates = {};
const inspected = new Set();
const passSeen = new Set();          // stamps already viewed in the passport (no re-slam)
let passOpen = false;
const passWrap = document.getElementById('passWrap');
const passDotEl = document.getElementById('passDot');

function savePassport(){
  try{
    localStorage.setItem(PASS_KEY, JSON.stringify({
      visited: [...visited], dates: stampDates, inspected: [...inspected], seen: [...passSeen],
    }));
  }catch(e){}
}
(function restorePassport(){
  let d;
  try{ d = JSON.parse(localStorage.getItem(PASS_KEY) || '{}'); }catch(e){ return; }
  (d.visited || []).forEach(id=>{
    const chip = document.getElementById('chip-' + id);
    if(!chip) return;                // hall no longer exists
    visited.add(id);
    chip.classList.add('done');
  });
  Object.assign(stampDates, d.dates || {});
  (d.inspected || []).forEach(k=> inspected.add(k));
  (d.seen || []).forEach(k=> passSeen.add(k));
  if([...visited].some(id => !passSeen.has(id))) passDotEl.classList.add('on');
})();

function buildPassport(){
  const total = EXHIBIT_DATA.length, n = visited.size;
  document.getElementById('passCount').textContent = n + ' of ' + total + ' halls stamped';
  document.getElementById('passBar').style.width = (n / total * 100) + '%';
  document.getElementById('passGrid').innerHTML = EXHIBIT_DATA.map((e, i)=>{
    const got = visited.has(e.id);
    const fresh = got && !passSeen.has(e.id) && !reducedMotion;
    const dots = got ? (e.highlights || []).map(h=>
      `<span class="a-dot${inspected.has(e.id + ':' + h.name) ? ' on' : ''}"></span>`).join('') : '';
    return `<div class="p-slot${got ? ' stamped' : ''}${fresh ? ' fresh' : ''}"
      style="--rot:${(i % 2 ? 3 : -4) + (i % 3)}deg;--pc:${e.color};animation-delay:${i * .1}s">
      <div class="p-glyph">${got ? e.glyph : '❔'}</div>
      <div class="p-name">${got ? e.name : '???'}</div>
      <div class="p-date">${got ? (stampDates[e.id] || 'stamped') : 'not stamped'}</div>
      <div class="a-dots">${dots}</div>
    </div>`;
  }).join('');
  const done = n === total;
  document.getElementById('passSeal').classList.toggle('show', done);
  document.getElementById('passHint').textContent = done
    ? 'You explored it all — wear that badge proudly!'
    : 'Step into a hall to earn its stamp.';
}
function openPassport(){
  buildPassport();
  const fresh = [...visited].filter(id => !passSeen.has(id));
  fresh.forEach(id => passSeen.add(id));
  if(fresh.length){ savePassport(); sfx.discover(); buzz([15, 30, 15]); }
  else sfx.open();
  passOpen = true;
  passWrap.classList.add('show');
  passDotEl.classList.remove('on');
  custOpen = false; custEl.classList.remove('open');
  closeTimePanel();
}
function closePassport(){
  passOpen = false;
  passWrap.classList.remove('show');
}
document.getElementById('passBtn').addEventListener('click', ()=> passOpen ? closePassport() : openPassport());
document.getElementById('passClose').addEventListener('click', ()=>{ closePassport(); sfx.ui(); });
passWrap.addEventListener('click', e=>{ if(e.target === passWrap) closePassport(); });
document.getElementById('passReset').addEventListener('click', ()=>{
  visited.clear();
  Object.keys(stampDates).forEach(k => delete stampDates[k]);
  inspected.clear();
  passSeen.clear();
  savePassport();
  EXHIBIT_DATA.forEach(e=> document.getElementById('chip-' + e.id).classList.remove('done'));
  passDotEl.classList.remove('on');
  buildPassport();
  sfx.ui(); buzz(8);
  showToast('🎟️ Fresh passport — go explore!');
});

/* ---------- time-of-day panel (sun-arc slider) ---------- */
let timeOpen = false;
const timePanel = document.getElementById('timePanel');
const timeKnob = document.getElementById('timeKnob');
const timeKnobIcon = document.getElementById('timeKnobIcon');
const timeLabel = document.getElementById('timeLabel');
const timeArc = document.getElementById('timeArc');
const ARC_CX = 110, ARC_CY = 106, ARC_R = 90;   // matches the SVG path

let lastPanelHour = -1;
function updateTimePanel(hour){
  if(!timeOpen || Math.abs(hour - lastPanelHour) < .002) return;
  lastPanelHour = hour;
  const phi = (1 - hour/24) * Math.PI;           // 0h left (φ=π) → 24h right (φ=0)
  const x = ARC_CX + Math.cos(phi) * ARC_R;
  const y = ARC_CY - Math.sin(phi) * ARC_R;
  timeKnob.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  timeKnobIcon.textContent = (hour >= 6 && hour < 18) ? '☀️' : '🌙';
  const h = Math.floor(hour), m = Math.floor((hour - h) * 60);
  timeLabel.textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}
function closeTimePanel(){ timeOpen = false; timePanel.classList.remove('open'); }
skyBtn.addEventListener('click', ()=>{
  timeOpen = !timeOpen;
  timePanel.classList.toggle('open', timeOpen);
  if(timeOpen){ custOpen = false; custEl.classList.remove('open'); lastPanelHour = -1; updateTimePanel(hourCur); }
  sfx.ui();
});

function arcPointerHour(ev){
  const r = timeArc.getBoundingClientRect();
  const sx = 220 / r.width;                      // viewBox units per CSS px
  const x = (ev.clientX - r.left) * sx - ARC_CX;
  const y = ARC_CY - (ev.clientY - r.top) * (122 / r.height);
  let phi = Math.atan2(Math.max(0, y), x);       // clamp below-horizon drags to the ends
  phi = THREE.MathUtils.clamp(phi, 0, Math.PI);
  return (1 - phi / Math.PI) * 24;               // left end = 0h, right end = 24h
}
let timeDragging = false;
timeArc.addEventListener('pointerdown', ev=>{
  timeDragging = true;
  try{ timeArc.setPointerCapture(ev.pointerId); }catch(e){}
  hourTarget = hourCur = arcPointerHour(ev) % 24;
});
timeArc.addEventListener('pointermove', ev=>{
  if(!timeDragging) return;
  hourTarget = hourCur = arcPointerHour(ev) % 24;
});
timeArc.addEventListener('pointerup', ()=>{ timeDragging = false; sfx.ui(); });
timePanel.querySelectorAll('.t-presets button').forEach(btn=>{
  btn.addEventListener('click', ()=>{ hourTarget = parseFloat(btn.dataset.h); sfx.ui(); });
});
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 2600);
}

/* ---------- living minimap ---------- */
const mmCanvas = document.getElementById('minimap');
const mmCtx = mmCanvas.getContext('2d');
const MM_WORLD = WORLD_R + 14;
function drawMinimap(t){
  const s = mmCanvas.width, c = s/2, k = (c - 8) / MM_WORLD;
  mmCtx.clearRect(0, 0, s, s);
  if(inside){
    mmCtx.beginPath(); mmCtx.arc(c, c, c - 4, 0, Math.PI*2);
    mmCtx.fillStyle = '#3B3563';
    mmCtx.fill();
    mmCtx.fillStyle = '#FFFFFF';
    mmCtx.font = '84px serif';
    mmCtx.textAlign = 'center'; mmCtx.textBaseline = 'middle';
    mmCtx.fillText(inside.glyph, c, c - 18);
    mmCtx.font = '800 24px Nunito, sans-serif';
    mmCtx.fillText('INSIDE', c, c + 52);
    return;
  }
  // park disc
  mmCtx.beginPath(); mmCtx.arc(c, c, c - 4, 0, Math.PI*2);
  mmCtx.fillStyle = nightMix > .5 ? '#484278' : '#C9C3EC';
  mmCtx.fill();
  // ring road + spokes
  mmCtx.strokeStyle = nightMix > .5 ? '#8A83BC' : '#F6F2E7';
  mmCtx.lineWidth = 5.4 * k;
  mmCtx.beginPath(); mmCtx.arc(c, c, 37*k, 0, Math.PI*2); mmCtx.stroke();
  for(let i=0;i<HALL_COUNT;i++){
    const a = hallAngle(i);
    mmCtx.beginPath();
    mmCtx.moveTo(c + Math.cos(a)*13*k, c + Math.sin(a)*13*k);
    mmCtx.lineTo(c + Math.cos(a)*42*k, c + Math.sin(a)*42*k);
    mmCtx.stroke();
  }
  // plaza
  mmCtx.beginPath(); mmCtx.arc(c, c, 13*k, 0, Math.PI*2);
  mmCtx.fillStyle = nightMix > .5 ? '#8A83BC' : '#F6F2E7';
  mmCtx.fill();
  // exhibits
  exhibits.forEach(e=>{
    const x = c + e.group.position.x*k, y = c + e.group.position.z*k;
    mmCtx.beginPath(); mmCtx.arc(x, y, 8, 0, Math.PI*2);
    mmCtx.fillStyle = e.color;
    mmCtx.globalAlpha = visited.has(e.id) ? 1 : .55;
    mmCtx.fill();
    mmCtx.globalAlpha = 1;
    mmCtx.lineWidth = 2.5;
    mmCtx.strokeStyle = '#FFFFFF';
    mmCtx.stroke();
    if(visited.has(e.id)){
      mmCtx.fillStyle = '#FFFFFF';
      mmCtx.beginPath(); mmCtx.arc(x, y, 2.6, 0, Math.PI*2); mmCtx.fill();
    }
  });
  // run target
  if(marker.visible){
    const pulse = 5 + Math.sin(t*5)*1.6;
    mmCtx.beginPath();
    mmCtx.arc(c + marker.position.x*k, c + marker.position.z*k, pulse, 0, Math.PI*2);
    mmCtx.strokeStyle = '#FFC145'; mmCtx.lineWidth = 3; mmCtx.stroke();
  }
  // player arrow
  const px = c + player.position.x*k, py = c + player.position.z*k;
  const h = player.rotation.y;
  const dx = Math.sin(h), dy = Math.cos(h);
  mmCtx.beginPath();
  mmCtx.moveTo(px + dx*10, py + dy*10);
  mmCtx.lineTo(px - dy*5.5 - dx*4, py + dx*5.5 - dy*4);
  mmCtx.lineTo(px + dy*5.5 - dx*4, py - dx*5.5 - dy*4);
  mmCtx.closePath();
  mmCtx.fillStyle = '#FF7A59';
  mmCtx.fill();
  mmCtx.lineWidth = 2.5; mmCtx.strokeStyle = '#FFFFFF'; mmCtx.stroke();
}
mmCanvas.addEventListener('pointerdown', e=>{
  if(!started || modalOpen || detailOpen || inside) return;
  const r = mmCanvas.getBoundingClientRect();
  const s = mmCanvas.width, c = s/2, k = (c - 8) / MM_WORLD;
  const wx = ((e.clientX - r.left) * (s / r.width) - c) / k;
  const wz = ((e.clientY - r.top)  * (s / r.height) - c) / k;
  // tapping near an exhibit dot on the map runs there and opens it
  let best = null, bestD = 8;
  exhibits.forEach(ex=>{
    const d = Math.hypot(wx - ex.group.position.x, wz - ex.group.position.z);
    if(d < bestD){ best = ex; bestD = d; }
  });
  sfx.ui();
  if(best) runToExhibit(best);
  else setWorldTarget(wx, wz);
});

/* ---------- idle attract mode ---------- */
let lastInput = performance.now();
let attractToastShown = false;
function noteInput(){ lastInput = performance.now(); }
addEventListener('keydown', noteInput);
addEventListener('pointerdown', noteInput);
addEventListener('wheel', noteInput, { passive:true });
function updateAttract(){
  const idle = performance.now() - lastInput > 30000;
  const want = !reducedMotion && started && !modalOpen && !detailOpen && !drawerOpen && !passOpen && !inside && cine < 0 && idle;
  if(want && !attract){
    attract = true;
    if(!attractToastShown){ showToast('✨ Touring the campus — press anything to take over'); attractToastShown = true; }
  }
  if(!want && attract) attract = false;
}
/* ---------- deep links: #dino (etc.) opens that hall ---------- */
function hashExhibit(){
  return exhibits.find(e => '#' + e.id === location.hash) || null;
}
function goToHash(){
  const e = hashExhibit();
  if(!e) return false;
  if(inside){ showToast('Step on the gold pad to head back outside first'); return false; }
  runToExhibit(e);          // auto-run resumes once the detail page is closed
  openDetail(e);
  return true;
}
addEventListener('hashchange', ()=>{ if(started) goToHash(); });

/* ---------- intro ---------- */
document.getElementById('startBtn').addEventListener('click', ()=>{
  document.getElementById('intro').classList.add('hide');
  initAudio();                       // audio needs a user gesture
  started = true;
  camYaw = Math.PI; camPitch = .62; camDist = 17;
  // deep link or reduced motion skips the flyover
  if(!goToHash() && !reducedMotion) cine = 0;
  sfx.discover();
});

/* ---------- resize / loop ---------- */
addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
let ambTimer = 2;
function loop(){
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), .05);
  const t = clock.elapsedTime;
  updatePlayer(dt, t);
  updateAttract();
  updateCamera(dt, t);
  updateInteraction();
  updateWeather(t, dt);
  // ease toward the target hour, taking the short way around the clock
  const dHr = ((hourTarget - hourCur + 36) % 24) - 12;
  if(Math.abs(dHr) > .0005) hourCur = (hourCur + dHr * Math.min(1, dt * 2.5) + 24) % 24;
  applySkyTime(hourCur);
  animated.forEach(a => a.fn(t, dt));
  drawMinimap(t);
  // ambient birds by day, crickets by night
  ambTimer -= dt;
  if(AC && !muted && ambTimer <= 0){
    if(nightMix < .5){ sfx.chirp(); ambTimer = 2.5 + Math.random()*5; }
    else { sfx.cricket(); ambTimer = 1.4 + Math.random()*2.6; }
  }
  renderer.render(scene, camera);
}
// initial camera placement
camera.position.set(0, 30, 60);
loop();
