/* Converted from the ES module in discovery-gateway-exhibits.zip to a classic
   script for this no-build project: import/export stripped, wrapped in an IIFE,
   public API exposed as window.DG. Uses the global THREE from the CDN script. */
(function(){
/* ============================================================
   DISCOVERY GATEWAY — LOW POLY EXHIBIT SET
   ES module · framework-agnostic · returns plain THREE.Groups
   ------------------------------------------------------------
   Usage:
     import { EXHIBITS, createBeeGarden, setTheme } from './exhibits.js';
     setTheme('night');                       // or 'day'
     const bee = createBeeGarden();           // THREE.Group
     bee.position.set(x, 0, z);
     scene.add(bee);

   Tile spec: every exhibit sits on a 12 x 12 diorama tile,
   origin at tile center, ground surface at y = 0 (base extends
   to y = -1.1). Safe grid spacing: >= 13 units.

   Lighting: glow comes from emissive materials plus ONE warm,
   shadowless, distance-limited THREE.PointLight per tile.
   Call stripLights(group) if your scene manages its own lights.
   For the night look, ACESFilmicToneMapping is recommended:
     renderer.toneMapping = THREE.ACESFilmicToneMapping;
     renderer.toneMappingExposure = 1.18;
   ============================================================ */


/* ------------------------------ themes ------------------------------ */
const THEMES = {
  night: {
    sand:0x352e47, sandDark:0x262038, cream:0x4a4360, white:0xd8d4e8,
    teal:0x3fbfae, tealDeep:0x2a8d80, sky:0x8fd8e8, coral:0xff7a6b,
    sun:0xffb45e, honey:0xd98f3a, grass:0x2f4238, grassDeep:0x243329,
    slate:0x3a3550, slateDark:0x28233a, red:0xe0574f, navy:0x232c48,
    purple:0x8f7bc0, pink:0xff6fb1, brown:0x5c4a56, gray:0x413c58,
    asphalt:0x2c2740, glowWarm:0xffc98a, neonPink:0xff5fa2,
    neonCyan:0x53e8dc, neonPurple:0xb48cff,
    road:0x221d33, pitRim:0x4a3c52, pitEarth:0x392e46,
    sensory:0x4a3f6e, sensoryRoof:0x3a3158,
    courtTile:0x1d2438, courtWood:0x8a6a48,
    towerHues:[0xd98f3a,0xc77f2f,0xb56f27,0xa35f1f],
    beaker:0x6fe8dc, firefly:0xd8ff8a, basketball:0xd97a35,
    glowScale:1.0
  },
  day: {
    sand:0xe6c99b, sandDark:0xd4b183, cream:0xf7f1e3, white:0xffffff,
    teal:0x3fae9f, tealDeep:0x2e857d, sky:0x86c8dd, coral:0xef7a5a,
    sun:0xf0b53f, honey:0xe8a33d, grass:0x9ec47f, grassDeep:0x7ca85f,
    slate:0x46555f, slateDark:0x333f47, red:0xd95b4a, navy:0x2f4a6b,
    purple:0x8f7bc0, pink:0xe991a8, brown:0x9a6f4b, gray:0xb9c0c4,
    asphalt:0xb9c0c4, glowWarm:0xffe9c4, neonPink:0xe991a8,
    neonCyan:0x3fae9f, neonPurple:0x8f7bc0,
    road:0x333f47, pitRim:0xc09a6b, pitEarth:0x8a6a45,
    sensory:0x8f7bc0, sensoryRoof:0x6f5da0,
    courtTile:0x2f4a6b, courtWood:0xdca55f,
    towerHues:[0xf6c452,0xefae3e,0xe8992f,0xdf8626],
    beaker:0xbfe8e3, firefly:0xf0b53f, basketball:0xd97a35,
    glowScale:0.12
  }
};

let PAL = THEMES.night;
function setTheme(name){
  if(!THEMES[name]) throw new Error(`Unknown theme "${name}". Use 'night' or 'day'.`);
  PAL = THEMES[name];
}

/* ----------------------------- helpers ------------------------------ */
function mat(c, extra){
  return new THREE.MeshStandardMaterial(Object.assign(
    { color:c, flatShading:true, roughness:.95, metalness:0 }, extra||{}));
}
function glowMat(c, i){
  return new THREE.MeshStandardMaterial({
    color:c, emissive:c,
    emissiveIntensity:(i==null?1:i)*PAL.glowScale,
    flatShading:true, roughness:.6
  });
}
function add(g, mesh, x,y,z, ry){
  mesh.position.set(x||0, y||0, z||0);
  if(ry) mesh.rotation.y = ry;
  mesh.castShadow = true; mesh.receiveShadow = true;
  g.add(mesh); return mesh;
}
function box(g,w,h,d,c,x,y,z,ry){ return add(g,new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c)),x,y,z,ry); }
function gbox(g,w,h,d,c,x,y,z,ry,i){ return add(g,new THREE.Mesh(new THREE.BoxGeometry(w,h,d),glowMat(c,i)),x,y,z,ry); }
function cyl(g,rt,rb,h,c,x,y,z,seg){ return add(g,new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||8),mat(c)),x,y,z); }
function gcyl(g,rt,rb,h,c,x,y,z,seg,i){ return add(g,new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||8),glowMat(c,i)),x,y,z); }
function cone(g,r,h,c,x,y,z,seg){ return add(g,new THREE.Mesh(new THREE.ConeGeometry(r,h,seg||6),mat(c)),x,y,z); }
function gcone(g,r,h,c,x,y,z,seg,i){ return add(g,new THREE.Mesh(new THREE.ConeGeometry(r,h,seg||6),glowMat(c,i)),x,y,z); }
function sph(g,r,c,x,y,z,glow){ return add(g,new THREE.Mesh(new THREE.SphereGeometry(r,7,6),glow?glowMat(c,.95):mat(c)),x,y,z); }
function gsphere(g,r,c,x,y,z,i){ return add(g,new THREE.Mesh(new THREE.SphereGeometry(r,6,5),glowMat(c,i)),x,y,z); }
function plight(g,c,x,y,z,int,dist){
  const L = new THREE.PointLight(c,(int==null?1:int)*PAL.glowScale,dist||10,2);
  L.position.set(x,y,z); g.add(L); return L;
}
function lamp(g,x,z,ry){
  const l = new THREE.Group();
  cyl(l,.07,.09,2.3,PAL.slateDark,0,1.15,0,6);
  box(l,.55,.08,.12,PAL.slateDark,.28,2.3,0);
  gbox(l,.26,.13,.2,PAL.glowWarm,.46,2.18,0,0,1.3);
  l.position.set(x,0,z); if(ry) l.rotation.y = ry;
  g.add(l); return l;
}
function lanterns(g,x1,z1,x2,z2,y,n){
  box(g,Math.hypot(x2-x1,z2-z1),.03,.03,PAL.slateDark,(x1+x2)/2,y,(z1+z2)/2,-Math.atan2(z2-z1,x2-x1));
  for(let i=0;i<n;i++){
    const t=(i+.5)/n, x=x1+(x2-x1)*t, z=z1+(z2-z1)*t;
    const c=[PAL.glowWarm,PAL.neonPink,PAL.glowWarm][i%3];
    gsphere(g,.15,c,x,y-.2,z,1.1);
  }
}
function tile(topColor){
  const g = new THREE.Group();
  box(g,12,1.1,12,PAL.sandDark,0,-0.55,0);
  box(g,11.6,0.35,11.6,topColor,0,0.06,0);
  return g;
}
function roofBlock(g,w,d,c,x,y,z){
  // 3-seg cylinder oriented as a proper gable: ridge along X, apex up, flat base down
  const r = new THREE.Mesh(new THREE.CylinderGeometry(d*0.62,d*0.62,w,3,1,false,-Math.PI/2),mat(c));
  r.rotation.z = -Math.PI/2;
  r.scale.x = 0.62;
  return add(g,r,x,y,z);
}
function tree(g,x,z,s){
  s=s||1;
  cyl(g,.14*s,.18*s,.7*s,PAL.brown,x,.35*s,z,6);
  sph(g,.55*s,PAL.grassDeep,x,1.05*s,z);
}

/* ------------------------- utility exports -------------------------- */
/** Remove the per-tile PointLights if your scene handles lighting itself. */
function stripLights(group){
  const lights = [];
  group.traverse(o=>{ if(o.isLight) lights.push(o); });
  lights.forEach(l=>l.parent && l.parent.remove(l));
  return group;
}

/* ============ 1. KIDS EYE VIEW — mini city ============ */
function createKidsEyeView(){
  const g = tile(PAL.gray);                    // concrete city block
  g.name = 'kids-eye-view';

  /* ---- tiny asphalt street across the tile (+ crosswalk & lane dashes) ---- */
  box(g,11.2,.12,2.6,PAL.road,0,.26,2.2);                              // street, z .9..3.5
  for(let i=0;i<5;i++) gbox(g,1.0,.04,.34,PAL.white,0,.33,1.25+i*.47,0,.4);  // crosswalk
  [-4.4,-2.6,2.6,4.4].forEach(x=>box(g,.8,.04,.14,PAL.sun,x,.33,2.2)); // center dashes

  /* ---- MINI GROCERY (left) — striped awning, lit window, produce, checkout ---- */
  box(g,3.4,2.4,2.6,PAL.cream,-3.7,1.25,-2.45);                        // shop body
  box(g,3.6,.3,2.8,PAL.tealDeep,-3.7,2.55,-2.45);                      // parapet roof
  gbox(g,2.8,.5,.14,PAL.neonCyan,-3.7,2.1,-1.1,0,1.5);                 // shop sign
  for(let i=0;i<5;i++){                                                // striped awning
    const a=box(g,.66,.1,.95,i%2?PAL.white:PAL.coral,-5.04+.67*i,1.65,-.72);
    a.rotation.x=.18;
  }
  gbox(g,2.2,1.0,.12,PAL.glowWarm,-4.0,1.05,-1.1,0,1.0);               // lit shop window
  box(g,.75,1.5,.1,PAL.tealDeep,-2.45,.85,-1.11);                      // door
  box(g,1.8,.35,.7,PAL.brown,-4.3,.4,-.7);                             // produce stand
  box(g,.6,.28,.62,PAL.honey,-4.85,.71,-.7);                           // crate A
  box(g,.6,.28,.62,PAL.brown,-4.15,.71,-.7);                           // crate B
  sph(g,.13,PAL.red,-4.95,.92,-.78);  sph(g,.13,PAL.red,-4.73,.9,-.6); // apples
  sph(g,.13,PAL.sun,-4.25,.92,-.76);  sph(g,.13,PAL.sun,-4.03,.9,-.6); // oranges
  sph(g,.18,PAL.grass,-3.62,.72,-.7);                                  // melon
  box(g,.85,.7,.55,PAL.teal,-3.15,.55,-.65);                           // checkout counter
  box(g,.3,.28,.3,PAL.slateDark,-3.3,1.02,-.65);                       // register
  gbox(g,.22,.16,.05,PAL.neonCyan,-3.3,1.1,-.51,0,1.2);                // register screen
  box(g,.4,.25,.3,PAL.coral,-2.45,.34,-.5);                            // shopping basket

  /* ---- MECHANIC SHOP (right) — open bay, car w/ popped hood, tires, tools ---- */
  box(g,3.6,2.6,2.8,PAL.slate,3.6,1.3,-2.5);                           // garage body
  box(g,3.8,.3,3.0,PAL.slateDark,3.6,2.7,-2.5);                        // flat roof
  gbox(g,2.2,.4,.14,PAL.neonPink,3.6,2.3,-1.05,0,1.3);                 // shop sign
  box(g,2.2,1.8,.2,PAL.slateDark,4.0,1.0,-1.06);                       // open garage bay
  box(g,2.3,.2,.35,PAL.gray,4.0,1.95,-.98);                            // rolled-up door
  gbox(g,1.9,.12,.12,PAL.glowWarm,4.0,1.7,-.99,0,1.2);                 // bay work light
  box(g,.9,1.1,.1,PAL.brown,2.35,1.35,-1.06);                          // tool wall board
  box(g,.07,.45,.05,PAL.gray,2.15,1.4,-.99);                           // wrench
  box(g,.3,.07,.05,PAL.sun,2.5,1.6,-.99);                              // hammer
  box(g,.07,.3,.05,PAL.red,2.5,1.15,-.99);                             // screwdriver
  box(g,1.7,.5,1.0,PAL.red,4.0,.72,-.3);                               // shop car body
  box(g,.9,.42,.9,PAL.red,4.25,1.15,-.3);                              // cabin
  const hd=box(g,.62,.05,.88,PAL.red,3.4,1.15,-.3); hd.rotation.z=.9;  // popped hood
  box(g,.5,.3,.6,PAL.slateDark,3.5,1.0,-.3);                           // engine block
  [[3.45,.22],[3.45,-.82],[4.55,.22],[4.55,-.82]].forEach(p=>
    cyl(g,.24,.24,.18,PAL.slateDark,p[0],.47,p[1],8).rotation.x=Math.PI/2); // wheels
  gbox(g,.06,.14,.14,PAL.glowWarm,3.13,.82,-.66,0,.9);                 // headlight L
  gbox(g,.06,.14,.14,PAL.glowWarm,3.13,.82,.06,0,.9);                  // headlight R
  cyl(g,.36,.36,.2,PAL.slateDark,5.15,.33,-.4,8);                      // tire stack
  cyl(g,.32,.32,.2,PAL.slateDark,5.15,.51,-.4,8);
  cyl(g,.34,.34,.2,PAL.slateDark,5.15,.69,-.4,8);
  cyl(g,.28,.28,.6,PAL.honey,2.5,.53,-.4,8);                           // oil drum

  /* ---- CONSTRUCTION ZONE (center back) — crane, foam tower, cones ---- */
  box(g,3.8,.08,3.4,PAL.sand,0,.27,-3.1);                              // dirt lot
  box(g,3.2,.35,.18,PAL.sun,0,.62,-1.5);                               // barrier bar
  box(g,.12,.4,.12,PAL.slateDark,-1.4,.42,-1.5);                       // barrier legs
  box(g,.12,.4,.12,PAL.slateDark,1.4,.42,-1.5);
  [-1.05,0,1.05].forEach(x=>box(g,.4,.39,.22,PAL.coral,x,.62,-1.5));   // hazard stripes
  box(g,.75,.72,.75,PAL.sun,-.9,.66,-3.3);                             // foam block tower
  box(g,.75,.72,.75,PAL.teal,-.9,1.36,-3.3);                           //   (half-built,
  box(g,.75,.72,.75,PAL.coral,-.9,2.06,-3.3);                          //    stepped)
  box(g,.75,.72,.75,PAL.honey,-.1,.66,-3.3);
  box(g,.75,.72,.75,PAL.purple,-.1,1.36,-3.3);
  box(g,.75,.72,.75,PAL.teal,.7,.66,-3.3);
  cyl(g,.14,.2,3.9,PAL.honey,1.3,2.2,-3.9,6);                          // crane mast
  box(g,.4,.35,.4,PAL.sun,1.3,4.2,-3.9);                               // crane cab
  box(g,3.6,.2,.2,PAL.honey,.1,4.45,-3.9);                             // jib
  box(g,.5,.55,.5,PAL.slateDark,1.75,4.1,-3.9);                        // counterweight
  box(g,.05,1.5,.05,PAL.slateDark,-1.2,3.63,-3.9);                     // cable
  box(g,.6,.6,.6,PAL.coral,-1.2,2.6,-3.9);                             // hoisted block
  gsphere(g,.12,PAL.red,1.3,4.62,-3.9,1.5);                            // warning beacon
  cone(g,.26,.55,PAL.coral,-1.5,.5,-.9,6);                             // traffic cones
  cone(g,.26,.55,PAL.coral,1.5,.5,-.9,6);
  cone(g,.26,.55,PAL.coral,.5,.5,-.55,6);

  /* ---- street furniture (approach lane x -1.8..1.8, z 4.2..5.7 stays clear) ---- */
  lamp(g,1.95,3.6,Math.PI/2);                                          // working streetlamp
  cyl(g,.15,.18,.5,PAL.red,-2.5,.47,3.9,6);                            // fire hydrant
  sph(g,.13,PAL.red,-2.5,.75,3.9);
  box(g,.42,.12,.14,PAL.red,-2.5,.5,3.9);
  cyl(g,.05,.05,1.4,PAL.gray,-2.2,.9,3.55,5);                          // stop sign pole
  gcyl(g,.28,.28,.06,PAL.red,-2.2,1.7,3.55,8,.7).rotation.x=Math.PI/2; // stop sign face
  tree(g,-4.7,4.5,.95); tree(g,4.7,4.4,.85);                           // curbside trees
  plight(g,PAL.glowWarm,-3.7,1.4,-.4,1.1,8);
  return g;
}

/* ============ 2. I DIG DINOS — excavation ============ */
function createIDigDinos(){
  const g = tile(PAL.sand);
  g.name = 'i-dig-dinos';

  /* ---- dig pit (front-left): rim + earth fill ---- */
  box(g,5.6,.3,4.2,PAL.pitRim,-2.4,.26,1.9);
  box(g,5.0,.28,3.6,PAL.pitEarth,-2.4,.31,1.9);

  /* ---- string-and-stake survey grid over the pit ---- */
  [[-4.8,.2],[0,.2],[-4.8,3.6],[0,3.6],[-4.8,1.9],[0,1.9]].forEach(s=>
    cyl(g,.05,.06,.8,PAL.brown,s[0],.75,s[1],5));
  box(g,4.8,.04,.04,PAL.white,-2.4,1.05,.2);
  box(g,4.8,.04,.04,PAL.white,-2.4,1.05,1.9);
  box(g,4.8,.04,.04,PAL.white,-2.4,1.05,3.6);
  box(g,.04,.04,3.4,PAL.white,-4.8,1.02,1.9);
  box(g,.04,.04,3.4,PAL.white,0,1.02,1.9);

  /* ---- half-uncovered skeleton: curved spine, tail toward back-left ---- */
  const SP=[];
  for(let i=0;i<=8;i++){
    const t=i/8;
    SP.push([-4.5+t*3.4, .85+t*2.0+Math.sin(t*Math.PI)*.4]);
  }
  for(let i=1;i<=8;i++){
    const t=i/8, x=SP[i][0], z=SP[i][1];
    const ang=-Math.atan2(z-SP[i-1][1], x-SP[i-1][0]);
    const s=.16+t*.1;
    box(g,s*1.5,s,s,PAL.white,x,.5,z,ang);
    if(i>=3&&i<=6) box(g,s*.55,s*1.6,s*.5,PAL.white,x,.62,z,ang);
  }
  /* flat rib arches fanning out from the spine, both sides */
  for(let i=3;i<=6;i++){
    const x=SP[i][0], z=SP[i][1];
    const ang=-Math.atan2(z-SP[i-1][1], x-SP[i-1][0]);
    const r=.62-Math.abs(i-4.5)*.14;
    [1,-1].forEach(side=>{
      const rg=new THREE.Group();
      const m=new THREE.Mesh(new THREE.TorusGeometry(r,.055,5,9,Math.PI*.7),mat(PAL.white));
      m.rotation.x=Math.PI/2;
      add(rg,m,-r,0,0);
      rg.position.set(x,.5,z); rg.rotation.y=ang; rg.scale.z=side;
      g.add(rg);
    });
  }
  /* skull at the head end (eye sockets + nostril seen from above) */
  const skull=new THREE.Group();
  box(skull,.8,.26,.6,PAL.white,0,0,0);
  box(skull,.6,.2,.36,PAL.white,.6,-.03,0);
  box(skull,.16,.06,.15,PAL.pitEarth,.1,.14,.17);
  box(skull,.16,.06,.15,PAL.pitEarth,.1,.14,-.17);
  box(skull,.11,.05,.1,PAL.pitEarth,.76,.08,0);
  box(skull,.55,.09,.34,PAL.white,.45,-.16,0);
  skull.position.set(-.8,.57,2.96); skull.rotation.y=-.22;
  g.add(skull);
  /* loose femur */
  const fem=new THREE.Group();
  cyl(fem,.09,.09,.9,PAL.white,0,0,0,6).rotation.z=Math.PI/2;
  sph(fem,.14,PAL.white,-.48,0,0); sph(fem,.14,PAL.white,.48,0,0);
  fem.position.set(-2.0,.52,.9); fem.rotation.y=.7; g.add(fem);
  /* dirt still covering the tail + a loose mound */
  sph(g,.5,PAL.pitEarth,-4.35,.42,1.0).scale.set(1.5,.5,1.1);
  sph(g,.45,PAL.pitEarth,-3.9,.4,3.2).scale.set(1.3,.45,1.0);

  /* ---- dig tools ---- */
  const brush=new THREE.Group();
  cyl(brush,.045,.045,.5,PAL.brown,0,0,0,6).rotation.z=Math.PI/2;
  box(brush,.2,.1,.14,PAL.sun,.33,0,0);
  brush.position.set(-2.6,.48,3.3); brush.rotation.y=.6; g.add(brush);
  const trowel=new THREE.Group();
  cyl(trowel,.04,.04,.34,PAL.brown,-.3,0,0,6).rotation.z=Math.PI/2;
  box(trowel,.36,.05,.22,PAL.gray,0,0,0);
  trowel.position.set(-4.35,.47,2.5); trowel.rotation.y=-.8; g.add(trowel);
  cyl(g,.3,.24,.42,PAL.teal,.75,.42,2.2,8);

  /* ---- footprint trail from the plaza toward the pit ---- */
  [[1.5,5.15,-.25],[.95,4.5,.2],[1.5,3.85,-.25],[1.0,3.2,.2]].forEach(p=>{
    const f=new THREE.Group();
    box(f,.34,.05,.42,PAL.pitEarth,0,0,0);
    box(f,.09,.05,.16,PAL.pitEarth,-.12,0,-.31);
    box(f,.09,.05,.18,PAL.pitEarth,0,0,-.33);
    box(f,.09,.05,.16,PAL.pitEarth,.12,0,-.31);
    f.position.set(p[0],.25,p[1]); f.rotation.y=p[2];
    g.add(f);
  });

  /* ---- fossil ID lab (back-right): big lit window, teal roof ---- */
  box(g,3.4,2.4,2.8,PAL.cream,3.4,1.42,-3.2);
  roofBlock(g,3.8,3.0,PAL.tealDeep,3.4,2.72,-3.2);
  gbox(g,2.2,1.2,.12,PAL.glowWarm,3.4,1.5,-1.76,0,.9);
  box(g,.08,1.28,.08,PAL.slateDark,3.4,1.5,-1.68);
  gbox(g,2.0,.3,.1,PAL.neonCyan,3.4,2.34,-1.78,0,1.5);
  box(g,.12,1.3,.8,PAL.tealDeep,1.66,.88,-2.6);
  gbox(g,.12,.7,.9,PAL.glowWarm,5.12,1.5,-3.2,0,.8);
  /* specimen crate with a bone waiting to be sorted */
  box(g,.8,.5,.6,PAL.honey,2.2,.46,-1.2);
  cyl(g,.05,.05,.42,PAL.white,2.2,.745,-1.2,6).rotation.z=Math.PI/2;
  sph(g,.09,PAL.white,1.98,.745,-1.2); sph(g,.09,PAL.white,2.42,.745,-1.2);

  /* ---- toothy skull display on a plinth (back-left), facing the plaza ---- */
  box(g,2.4,.34,2.0,PAL.slate,-3.4,.39,-3.6);
  box(g,1.9,.75,1.5,PAL.slateDark,-3.4,.9,-3.6);
  box(g,1.5,.9,1.0,PAL.white,-3.4,1.7,-3.75);
  box(g,1.05,.6,1.05,PAL.white,-3.4,1.51,-2.95);
  box(g,1.6,.2,.5,PAL.white,-3.4,2.16,-3.45);
  box(g,.3,.3,.14,PAL.slateDark,-3.77,1.92,-3.2);
  box(g,.3,.3,.14,PAL.slateDark,-3.03,1.92,-3.2);
  gsphere(g,.09,PAL.glowWarm,-3.77,1.92,-3.11,.9);
  gsphere(g,.09,PAL.glowWarm,-3.03,1.92,-3.11,.9);
  [-3.75,-3.52,-3.28,-3.05].forEach(x=>{
    cone(g,.07,.26,PAL.white,x,1.13,-2.55,5).rotation.x=Math.PI;
  });
  cone(g,.15,.65,PAL.white,-3.95,2.36,-3.7,6).rotation.z=.5;
  cone(g,.15,.65,PAL.white,-2.85,2.36,-3.7,6).rotation.z=-.5;

  /* ---- standing dino silhouette sign (right of the pit) ---- */
  box(g,1.7,.28,.7,PAL.slateDark,4.45,.36,1.8);
  box(g,1.5,.75,.18,PAL.teal,4.45,1.25,1.8);
  box(g,.34,1.25,.16,PAL.teal,3.8,2.05,1.8).rotation.z=.32;
  box(g,.56,.3,.17,PAL.teal,3.5,2.78,1.8);
  box(g,.75,.26,.16,PAL.teal,5.25,1.35,1.8).rotation.z=-.35;
  box(g,.3,.6,.16,PAL.teal,4.0,.74,1.8);
  box(g,.3,.6,.16,PAL.teal,4.9,.74,1.8);
  gsphere(g,.07,PAL.neonCyan,3.42,2.84,1.9,1.4);

  /* ---- spoil heaps + shovel behind the pit ---- */
  cone(g,1.1,1.2,PAL.pitEarth,-.4,.72,-3.8,7);
  cone(g,.7,.85,PAL.pitRim,.75,.55,-4.35,6);
  cyl(g,.04,.045,1.2,PAL.brown,1.1,.7,-3.3,5).rotation.z=.35;
  box(g,.22,.3,.06,PAL.gray,1.3,.3,-3.3).rotation.z=.35;

  /* ---- work floodlight over the dig ---- */
  cyl(g,.07,.09,2.7,PAL.slateDark,.9,1.56,.6,6);
  box(g,.75,.09,.09,PAL.slateDark,.5,2.86,.6);
  gbox(g,.42,.26,.3,PAL.glowWarm,.14,2.76,.6,0,1.5).rotation.z=.5;
  plight(g,PAL.glowWarm,-1.2,2.3,2.0,1.2,9);

  tree(g,5.0,-.5,.85);
  return g;
}

/* ============ 3. STILLSON RIVER RAILROAD ============ */
function createRailroad(){
  const g = tile(PAL.grass);
  g.name = 'stillson-river-railroad';

  /* --- the Stillson River: blue band crossing the tile north-south --- */
  box(g,2.4,.07,11.4,PAL.navy,3.0,.25,0);                    // deep-water underlay
  gbox(g,2.1,.08,11.36,PAL.sky,3.0,.29,0,0,.35);             // water surface, soft shimmer
  box(g,.5,.12,11.32,PAL.sandDark,1.75,.29,0);               // west bank
  box(g,.5,.12,11.32,PAL.sandDark,4.25,.29,0);               // east bank
  sph(g,.3,PAL.gray,2.35,.3,-3.6).scale.set(1.3,.55,1.0);    // river rocks
  sph(g,.24,PAL.gray,3.7,.3,3.1).scale.set(1.2,.5,1.0);
  box(g,.3,.03,.12,PAL.white,2.6,.34,2.1);                   // foam flecks
  box(g,.26,.03,.1,PAL.white,3.4,.34,-0.5);
  box(g,.3,.03,.12,PAL.white,2.9,.34,-2.4);

  /* --- track: ballast in two runs, even ties, continuous twin rails --- */
  box(g,7.6,.18,1.9,PAL.gray,-1.9,.28,.8);                   // ballast west of river
  box(g,1.6,.18,1.9,PAL.gray,4.9,.28,.8);                    // ballast east of river
  for(let i=-6;i<=6;i++) box(g,.24,.1,1.5,PAL.brown,i*.9,.41,.8);
  box(g,11.4,.07,.09,PAL.slateDark,0,.49,.38);               // rail
  box(g,11.4,.07,.09,PAL.slateDark,0,.49,1.22);              // rail

  /* --- low trestle bridge carrying the track over the river --- */
  box(g,2.3,.14,1.86,PAL.brown,3.0,.31,.8);                  // deck
  box(g,2.8,.4,.16,PAL.red,3.0,.5,-0.13);                    // truss girders
  box(g,2.8,.4,.16,PAL.red,3.0,.5,1.73);
  [[2.4,-0.13],[3.6,-0.13],[2.4,1.73],[3.6,1.73]].forEach(p=>
    cyl(g,.1,.13,.55,PAL.slateDark,p[0],.3,p[1],6));         // piles in the water

  /* --- chunky red locomotive with gold wheels, headed for the bridge --- */
  const loco = new THREE.Group();
  box(loco,3.2,.35,.9,PAL.slateDark,0,.45,0);                // frame
  const boil = cyl(loco,.62,.62,2.0,PAL.red,.45,1.05,0,12); boil.rotation.z = Math.PI/2;
  const smkb = cyl(loco,.64,.64,.22,PAL.slateDark,1.42,1.05,0,12); smkb.rotation.z = Math.PI/2;
  const bnd1 = cyl(loco,.64,.64,.08,PAL.sun,.05,1.05,0,12); bnd1.rotation.z = Math.PI/2;
  const bnd2 = cyl(loco,.64,.64,.08,PAL.sun,.85,1.05,0,12); bnd2.rotation.z = Math.PI/2;
  cyl(loco,.2,.3,.65,PAL.slateDark,1.0,1.9,0,8);             // smokestack
  cyl(loco,.3,.3,.14,PAL.sun,1.0,2.24,0,8);                  // stack crown
  sph(loco,.24,PAL.sun,.4,1.7,0);                            // steam dome
  box(loco,1.1,1.4,1.4,PAL.red,-1.0,1.25,0);                 // cab
  box(loco,1.3,.14,1.6,PAL.slateDark,-1.0,2.0,0);            // cab roof
  gbox(loco,.5,.5,.08,PAL.glowWarm,-1.0,1.5,.72,0,.9);       // cab windows
  gbox(loco,.5,.5,.08,PAL.glowWarm,-1.0,1.5,-.72,0,.9);
  const cow = cone(loco,.5,.8,PAL.honey,1.95,.35,0,4); cow.rotation.z = -Math.PI/2; // cowcatcher
  gbox(loco,.24,.26,.22,PAL.glowWarm,1.42,1.78,0,0,1.4);     // headlamp
  [-1.2,-.35,.5].forEach(x=>{
    cyl(loco,.34,.34,.13,PAL.sun,x,.34,.5,10).rotation.x = Math.PI/2;
    cyl(loco,.34,.34,.13,PAL.sun,x,.34,-.5,10).rotation.x = Math.PI/2;
  });
  loco.position.set(-1.9,.525,.8);
  g.add(loco);

  /* --- tender car --- */
  box(g,1.5,.8,1.0,PAL.red,-4.4,1.14,.8);
  box(g,1.1,.28,.8,PAL.slateDark,-4.4,1.6,.8);               // coal load
  [-4.8,-4.0].forEach(x=>{
    cyl(g,.22,.22,.12,PAL.sun,x,.745,1.3,10).rotation.x = Math.PI/2;
    cyl(g,.22,.22,.12,PAL.sun,x,.745,.3,10).rotation.x = Math.PI/2;
  });

  /* --- smoke puffs trailing off the stack --- */
  sph(g,.2,PAL.white,-1.0,2.85,.85);
  sph(g,.26,PAL.white,-1.4,3.3,.95);
  sph(g,.32,PAL.white,-1.85,3.7,1.05);

  /* --- Stillson Depot: red walls, slate roof, platform, lit windows --- */
  box(g,4.2,.45,1.6,PAL.gray,-3.4,.42,2.35);                 // platform
  box(g,4.16,.06,.15,PAL.honey,-3.4,.66,1.65);               // platform edge stripe
  box(g,3.0,2.0,1.7,PAL.red,-3.6,1.2,3.9);                   // depot walls
  roofBlock(g,3.4,2.1,PAL.slateDark,-3.6,2.45,3.9);          // roof
  box(g,.4,1.1,.4,PAL.slateDark,-2.7,2.7,3.9);               // chimney
  gbox(g,.55,.6,.1,PAL.glowWarm,-4.5,1.5,3.01,0,.95);        // track-side windows
  gbox(g,.55,.6,.1,PAL.glowWarm,-2.7,1.5,3.01,0,.95);
  gbox(g,.7,1.2,.1,PAL.glowWarm,-3.6,1.25,3.01,0,.75);       // track-side door
  gbox(g,.55,.6,.1,PAL.glowWarm,-4.5,1.4,4.79,0,.95);        // plaza-side windows
  gbox(g,.55,.6,.1,PAL.glowWarm,-2.7,1.4,4.79,0,.95);
  gbox(g,2.0,.26,.1,PAL.neonCyan,-3.6,2.05,4.78,0,1.2);      // station sign
  box(g,.9,.16,.35,PAL.honey,-2.2,.72,2.6);                  // platform bench
  box(g,.86,.3,.08,PAL.honey,-2.2,.93,2.76);
  box(g,.5,.5,.5,PAL.brown,-4.7,.89,2.6);                    // luggage crate

  /* --- brown water tower on legs, spout swung toward the track --- */
  [[4.2,-1.0],[5.2,-1.0],[4.2,-2.0],[5.2,-2.0]].forEach(p=>
    cyl(g,.09,.12,2.1,PAL.slateDark,p[0],1.05,p[1],6));      // legs
  box(g,1.25,.09,.09,PAL.brown,4.7,1.0,-1.0);                // cross braces
  box(g,1.25,.09,.09,PAL.brown,4.7,1.0,-2.0);
  cyl(g,.95,.95,.16,PAL.slateDark,4.7,2.13,-1.5,10);         // tank floor ring
  cyl(g,.85,.85,1.25,PAL.brown,4.7,2.8,-1.5,10);             // tank
  cyl(g,.88,.88,.14,PAL.honey,4.7,2.5,-1.5,10);              // hoop band
  cone(g,.98,.65,PAL.slateDark,4.7,3.72,-1.5,10);            // roof
  const spout = cyl(g,.08,.12,1.15,PAL.slateDark,4.7,1.75,-.85,7);
  spout.rotation.x = 2.35;                                   // spout angled down to track
  sph(g,.12,PAL.slateDark,4.7,1.35,-.44);                    // spout nozzle

  /* --- grade-crossing signal with red light --- */
  cyl(g,.06,.08,2.3,PAL.slateDark,1.25,1.15,2.1,6);          // mast
  const cb1 = box(g,1.05,.13,.08,PAL.white,1.25,2.05,2.18); cb1.rotation.z = .62;   // crossbuck
  const cb2 = box(g,1.05,.13,.08,PAL.white,1.25,2.05,2.2);  cb2.rotation.z = -.62;
  box(g,.24,.24,.16,PAL.slateDark,1.25,1.5,2.14);            // lamp housing
  gsphere(g,.1,PAL.red,1.25,1.5,2.26,1.5);                   // red warning light

  /* --- lineside clutter: tool shed + oil barrels --- */
  box(g,1.2,.95,1.0,PAL.slate,-1.0,.7,-2.8);
  box(g,1.4,.14,1.2,PAL.slateDark,-1.0,1.22,-2.8);
  cyl(g,.22,.22,.42,PAL.honey,-.1,.44,-2.5,8);
  cyl(g,.22,.22,.42,PAL.honey,-.35,.44,-1.95,8);

  /* --- approach path from the plaza + greenery --- */
  box(g,1.5,.12,2.9,PAL.cream,0,.29,4.25);                   // gravel path (low)
  lamp(g,-1.15,3.5,.5);
  tree(g,-5.0,-4.4,1.0); tree(g,-3.0,-4.8,.8); tree(g,5.1,4.9,.8);
  plight(g,PAL.glowWarm,-3.6,1.6,2.7,1.1,8);
  return g;
}

/* ============ 4. THE BEE GARDEN ============ */
function createBeeGarden(){
  const g = tile(PAL.grass);
  g.name = 'the-bee-garden';

  /* --- POLLINATOR TOWER: stacked hex tiers, back-left --- */
  const tiers=[[1.7,1.3,.85],[1.45,1.15,2.04],[1.2,1.0,3.09],[.95,.9,4.0]];
  tiers.forEach((t,i)=>{
    cyl(g,t[0]-.08,t[0],t[1],PAL.towerHues[i],-3.2,t[2],-2.8,6).rotation.y=Math.PI/6;
  });
  gbox(g,.9,1.1,.14,PAL.glowWarm,-3.2,.78,-1.3,0,1.1);            // glowing entrance
  box(g,1.3,.12,.34,PAL.slateDark,-3.2,1.42,-1.32);               // awning over door
  [[2.04,-1.52],[3.09,-1.74],[4.0,-1.96]].forEach(w=>              // hex windows per tier
    gcyl(g,.2,.2,.16,PAL.glowWarm,-3.2,w[0],w[1],6,1.2).rotation.x=Math.PI/2);
  cyl(g,.07,.1,.8,PAL.grassDeep,-3.2,4.8,-2.8,6);                 // flower cap on top
  gsphere(g,.3,PAL.sun,-3.2,5.3,-2.8,.9);
  for(let i=0;i<5;i++){
    const a=i/5*Math.PI*2;
    sph(g,.25,PAL.coral,-3.2+Math.cos(a)*.5,5.3,-2.8+Math.sin(a)*.5)
      .scale.set(1.2,.45,1.2);
  }

  /* --- HONEY CLIMBER: honeycomb wall of hex comb cells, right --- */
  box(g,4.4,.4,1.2,PAL.brown,3.4,.32,1.6);                        // timber base
  const cells=[[1.75,.85],[2.85,.85],[3.95,.85],[5.05,.85],
               [2.3,1.78],[3.4,1.78],[4.5,1.78],
               [2.85,2.71],[3.95,2.71]];
  const glowCells=[1,3,6,7];
  cells.forEach((c,i)=>{
    const m = glowCells.indexOf(i)>=0
      ? gcyl(g,.6,.6,.8,PAL.honey,c[0],c[1],1.6,6,.9)
      : cyl(g,.6,.6,.8,i%2?PAL.honey:PAL.sun,c[0],c[1],1.6,6);
    m.rotation.x=Math.PI/2;
    if(glowCells.indexOf(i)<0)                                    // open comb inset
      cyl(g,.42,.42,.1,PAL.sandDark,c[0],c[1],1.97,6).rotation.x=Math.PI/2;
  });

  /* --- LIVE HIVE: banded skep with glowing observation window, back-right --- */
  cyl(g,1.55,1.65,.35,PAL.brown,3.6,.4,-3.2,10);                  // wood platform
  const rings=[[1.22,.6,.83],[1.35,.55,1.38],[1.18,.5,1.88],[.98,.45,2.32],[.72,.4,2.71]];
  rings.forEach((r,i)=>cyl(g,r[0],r[0],r[1],i%2?PAL.sun:PAL.honey,3.6,r[2],-3.2,10));
  sph(g,.5,PAL.honey,3.6,2.95,-3.2).scale.set(1.1,.8,1.1);        // dome cap
  box(g,1.5,1.1,.4,PAL.slateDark,3.6,1.35,-1.96);                 // window frame
  gbox(g,1.24,.84,.1,PAL.neonCyan,3.6,1.35,-1.73,0,.9);           // glass panel
  sph(g,.06,PAL.slateDark,3.35,1.5,-1.66);                        // bees behind glass
  sph(g,.06,PAL.slateDark,3.85,1.18,-1.66);
  gbox(g,.5,.22,.12,PAL.glowWarm,3.6,.68,-1.98,0,1.3);            // hive entrance
  box(g,.7,.08,.5,PAL.brown,3.6,.59,-1.8);                        // landing board

  /* --- garden path: stepping stones from the plaza lane --- */
  [[0,4.9],[-.7,4.1],[-1.4,3.3],[-2.1,2.5],[-2.7,1.5],[-3.0,.5],[-3.1,-.5],
   [.9,3.9],[1.8,3.2],[2.6,2.6]]
    .forEach(s=>cyl(g,.36,.42,.1,PAL.gray,s[0],.26,s[1],7));

  /* --- oversized flowers --- */
  cyl(g,.09,.11,1.7,PAL.grassDeep,-4.3,1.0,2.2,6);                // big coral daisy
  sph(g,.18,PAL.grassDeep,-4.02,.95,2.28).scale.set(1.8,.4,.9);
  const d1=new THREE.Group();
  gsphere(d1,.3,PAL.sun,0,0,0,.8);
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2;
    sph(d1,.27,PAL.coral,Math.cos(a)*.52,Math.sin(a)*.52,-.05).scale.set(1,1,.45);
  }
  d1.position.set(-4.3,1.95,2.3); d1.rotation.x=-.5; g.add(d1);
  cyl(g,.07,.09,1.3,PAL.grassDeep,-2.3,.8,3.9,6);                 // pink tulip cup
  cone(g,.42,.75,PAL.pink,-2.3,1.8,3.9,6).rotation.x=Math.PI;
  gsphere(g,.16,PAL.sun,-2.3,2.05,3.9,.8);
  cyl(g,.07,.09,1.1,PAL.grassDeep,-4.6,.7,4.4,6);                 // purple pom
  sph(g,.38,PAL.purple,-4.6,1.5,4.4);
  cyl(g,.06,.08,.9,PAL.grassDeep,4.8,.6,4.7,6);                   // coral pom
  sph(g,.33,PAL.coral,4.8,1.25,4.7);
  cyl(g,.06,.08,.9,PAL.grassDeep,1.0,.6,3.6,6);                   // small pink daisy
  sph(g,.28,PAL.pink,1.0,1.25,3.6);
  sph(g,.12,PAL.white,1.0,1.5,3.6);

  /* --- chunky striped bees --- */
  [[-3.55,2.4,2.85,2.4],[3.6,1.0,-.95,-Math.PI/2]].forEach(b=>{
    const bee=new THREE.Group();
    sph(bee,.3,PAL.sun,0,0,0).scale.set(1.5,1,1);
    cyl(bee,.31,.31,.14,PAL.slateDark,-.08,0,0,10).rotation.z=Math.PI/2;
    cyl(bee,.29,.29,.13,PAL.slateDark,.18,0,0,10).rotation.z=Math.PI/2;
    sph(bee,.17,PAL.slateDark,-.5,.03,0);
    sph(bee,.15,PAL.white,-.02,.27,.15).scale.set(1.5,.3,.8);
    sph(bee,.15,PAL.white,-.02,.27,-.15).scale.set(1.5,.3,.8);
    bee.position.set(b[0],b[1],b[2]); bee.rotation.y=b[3];
    g.add(bee);
  });

  /* --- fireflies, greenery, hive sign --- */
  gsphere(g,.09,PAL.firefly,-1.2,1.9,-1.2,1.6);
  gsphere(g,.08,PAL.firefly,1.3,2.2,3.2,1.5);
  tree(g,.4,-4.4,1.05);
  sph(g,.5,PAL.grassDeep,1.7,.45,-4.6).scale.set(1.3,.8,1);
  sph(g,.42,PAL.grassDeep,-1.2,.4,-4.5).scale.set(1.2,.8,1);
  [[-1.5,1.0],[.6,.6],[4.6,3.6],[-.6,-1.6]].forEach(t=>
    cone(g,.16,.4,PAL.grassDeep,t[0],.38,t[1],5));
  cyl(g,.06,.08,1.0,PAL.brown,1.5,.7,3.93,5);                     // sign post
  box(g,1.1,.6,.1,PAL.cream,1.5,1.35,4.0);                        // sign board
  gcyl(g,.2,.2,.1,PAL.honey,1.5,1.35,4.06,6,1.2).rotation.x=Math.PI/2; // hex emblem
  plight(g,0xffd9a0,-3.0,1.4,-.9,1.0,8);
  return g;
}

/* ============ 5. SENSORY ROOM & STORY FACTORY ============ */
function createSensoryStory(){
  const g = tile(PAL.sand);
  g.name = 'sensory-story-factory';

  /* ---- STORY FACTORY (left half): little theater, faces +z ---- */
  box(g,4.8,3.2,3.8,PAL.tealDeep,-3.0,1.83,-1.6);          // main hall
  box(g,5.1,.3,4.1,PAL.slateDark,-3.0,3.56,-1.6);          // flat roof slab
  box(g,2.6,1.1,2.2,PAL.slate,-3.2,4.23,-2.3);             // stage fly tower
  box(g,2.8,.16,2.4,PAL.slateDark,-3.2,4.84,-2.3);         // fly tower cap

  // marquee canopy with glowing header band + bulbs
  box(g,3.6,.5,1.2,PAL.slateDark,-3.0,2.75,.85);           // canopy (back embedded in wall)
  gbox(g,3.56,.32,.08,PAL.glowWarm,-3.0,2.75,1.48,0,1.3);  // marquee front band
  gbox(g,.1,.32,1.16,PAL.glowWarm,-4.84,2.75,.85,0,1.3);   // marquee side band L
  gbox(g,.1,.32,1.16,PAL.glowWarm,-1.16,2.75,.85,0,1.3);   // marquee side band R
  gsphere(g,.09,PAL.sun,-4.4,3.05,1.38,1.3);               // marquee bulbs
  gsphere(g,.09,PAL.sun,-3.47,3.05,1.38,1.3);
  gsphere(g,.09,PAL.sun,-2.53,3.05,1.38,1.3);
  gsphere(g,.09,PAL.sun,-1.6,3.05,1.38,1.3);
  gbox(g,3.4,.16,.1,PAL.neonPink,-3.0,3.25,.33,0,1.0);     // neon accent above canopy

  // proscenium doorway: lit stage behind red curtains, gold frame
  gbox(g,1.8,1.95,.12,PAL.glowWarm,-3.0,1.2,.32,0,.55);    // warm stage glow
  box(g,.6,1.95,.1,PAL.red,-3.75,1.19,.41);                // curtain left
  box(g,.6,1.95,.1,PAL.red,-2.25,1.19,.41);                // curtain right
  box(g,1.9,.5,.1,PAL.red,-3.0,2.05,.44);                  // curtain valance
  box(g,.18,2.4,.1,PAL.honey,-4.05,1.35,.46);              // gold frame L
  box(g,.18,2.4,.1,PAL.honey,-1.95,1.35,.46);              // gold frame R
  box(g,2.34,.2,.1,PAL.honey,-3.0,2.42,.47);               // gold frame header
  box(g,2.6,.45,1.4,PAL.brown,-3.0,.45,1.2);               // stage apron
  box(g,1.5,.2,.5,PAL.brown,-3.0,.32,2.12);                // apron step

  // two premiere spotlight cones on the marquee, beams fanning up + out
  cyl(g,.1,.13,.3,PAL.slateDark,-4.35,3.14,.75,6);
  cyl(g,.1,.13,.3,PAL.slateDark,-1.65,3.14,.75,6);
  const beamL = gcone(g,.5,2.4,PAL.glowWarm,-4.71,4.47,.75,8,.4);
  beamL.rotation.z = Math.PI + .3;
  const beamR = gcone(g,.5,2.4,PAL.glowWarm,-1.29,4.47,.75,8,.4);
  beamR.rotation.z = Math.PI - .3;

  // COMIC PANELS wall: 3 white framed panels on an angled rail
  box(g,3.2,.28,.3,PAL.brown,-4.3,.36,2.5,-.65);           // base rail
  [[-5.18,1.83,-.5,PAL.coral],
   [-4.3, 2.5, -.65,PAL.sun],
   [-3.42,3.17,-.8, PAL.teal]].forEach(p=>{
    const x=p[0], z=p[1], ry=p[2], nx=Math.sin(ry), nz=Math.cos(ry);
    box(g,1.05,1.3,.12,PAL.white,x,1.12,z,ry);             // white frame
    gbox(g,.82,1.05,.08,p[3],x+nx*.055,1.14,z+nz*.055,ry,.4); // panel art
  });

  /* ---- CONNECTOR: shared lobby joining the two halves ---- */
  box(g,1.8,2.1,3.0,PAL.cream,.2,1.22,-1.8);
  box(g,2.0,.22,3.2,PAL.slateDark,.2,2.32,-1.8);
  gbox(g,.95,1.5,.12,PAL.glowWarm,.2,.99,-.33,0,.9);       // lobby door
  box(g,1.7,.09,5.5,PAL.sandDark,.2,.26,2.42);             // walkway to plaza

  /* ---- SENSORY ROOM (right half): calm purple building ---- */
  box(g,4.2,2.7,4.0,PAL.sensory,3.1,1.55,-1.7);            // main block
  box(g,4.5,.35,4.3,PAL.sensoryRoof,3.1,3.02,-1.7);        // roof
  gbox(g,4.56,.1,.1,PAL.neonPurple,3.1,2.87,.47,0,.9);     // roofline glow, front
  gbox(g,.1,.1,4.2,PAL.neonPurple,5.37,2.87,-1.7,0,.9);    // roofline glow, side
  box(g,1.0,1.75,.14,PAL.cream,3.1,1.1,.34);               // soft door
  gbox(g,.9,.2,.14,PAL.glowWarm,3.1,2.2,.34,0,.8);         // transom glow

  // round porthole windows (front x2, side x1)
  [[2.0,.0],[4.2,.0]].forEach(p=>{
    const rim = cyl(g,.42,.42,.08,PAL.white,p[0],1.75,.33,12);
    rim.rotation.x = Math.PI/2;
    const eye = gcyl(g,.3,.3,.1,PAL.glowWarm,p[0],1.75,.36,12,.8);
    eye.rotation.x = Math.PI/2;
  });
  const srim = cyl(g,.42,.42,.08,PAL.white,5.23,1.75,-1.7,12);
  srim.rotation.z = Math.PI/2;
  const seye = gcyl(g,.3,.3,.1,PAL.glowWarm,5.26,1.75,-1.7,12,.8);
  seye.rotation.z = Math.PI/2;

  // yard of glowing sensory orbs on soft mat, each on a low pedestal
  box(g,3.0,.14,2.9,PAL.sensoryRoof,3.9,.29,3.1);          // soft mat
  [[2.95,2.35,.34,0x9fe8ff,1.1],
   [4.55,2.15,.3, 0xffb3e2,1.0],
   [3.35,3.85,.32,0xc7ff9e,1.0],
   [4.75,3.75,.27,0xd9c2ff,1.2]].forEach(o=>{
    cyl(g,.3,.36,.18,PAL.slate,o[0],.43,o[1],8);
    gsphere(g,o[2],o[3],o[0],.52+o[2]*.78,o[1],o[4]);
  });

  // two open-front touch boxes at the yard edge
  [[4.3,PAL.neonPink],[5.2,PAL.neonCyan]].forEach(t=>{
    box(g,.85,.8,.8,PAL.navy,t[0],.62,5.0);
    box(g,.6,.55,.1,PAL.slateDark,t[0],.62,5.38);           // dark opening
    gbox(g,.18,.18,.06,t[1],t[0],.62,5.44,0,.7);            // glow inside
  });

  /* ---- dressing ---- */
  lamp(g,-2.6,4.9,.6);
  tree(g,-5.0,-4.7,1.05);
  tree(g,5.0,-4.85,.95);
  plight(g,0xd9b8ff,3.9,1.6,3.0,.9,8);
  return g;
}

/* ============ 6. SAVING LIVES (Life Flight) ============ */
function createSavingLives(){
  const g = tile(PAL.asphalt);
  g.name = 'saving-lives';

  /* ---------- helipad (front-right) ---------- */
  cyl(g,2.2,2.2,.22,PAL.slate,3.3,.31,2.3,16);          // pad
  cyl(g,1.9,1.9,.07,PAL.slateDark,3.3,.44,2.3,16);      // inner disc
  box(g,.22,.05,1.15,PAL.white,2.98,.48,2.3);           // H left leg
  box(g,.22,.05,1.15,PAL.white,3.62,.48,2.3);           // H right leg
  box(g,.44,.04,.22,PAL.white,3.3,.478,2.3);            // H crossbar
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2;          // edge lights
    gsphere(g,.09,PAL.neonCyan,3.3+Math.cos(a)*2.0,.46,2.3+Math.sin(a)*2.0,1.5); }

  /* ---------- Life Flight helicopter (nose +x, crosses face plaza) ---------- */
  const heli = new THREE.Group();
  box(heli,2.0,.12,.16,PAL.slateDark,.1,.05,.6);        // skids
  box(heli,2.0,.12,.16,PAL.slateDark,.1,.05,-.6);
  [[-.5,.6],[.7,.6],[-.5,-.6],[.7,-.6]].forEach(p=>     // skid struts
    box(heli,.08,.55,.08,PAL.slateDark,p[0],.35,p[1]));
  sph(heli,.85,PAL.red,.15,.95,0).scale.set(1.45,.95,1.0);   // rounded cabin
  box(heli,2.0,.4,1.76,PAL.white,.1,.8,0);              // white belly band
  gsphere(heli,.5,PAL.glowWarm,1.1,1.1,0,.9).scale.set(.8,.75,.95); // glowing windshield
  gbox(heli,.5,.3,.1,PAL.glowWarm,.35,1.2,.84,0,.7);    // side windows
  gbox(heli,.5,.3,.1,PAL.glowWarm,.35,1.2,-.84,0,.7);
  gbox(heli,.13,.36,.06,PAL.red,-.45,.8,.90,0,1.3);     // red cross, plaza side
  gbox(heli,.36,.13,.1,PAL.red,-.45,.8,.90,0,1.3);
  gbox(heli,.13,.36,.06,PAL.red,-.45,.8,-.90,0,1.3);    // red cross, far side
  gbox(heli,.36,.13,.1,PAL.red,-.45,.8,-.90,0,1.3);
  box(heli,1.7,.26,.2,PAL.red,-1.75,1.1,0);             // tail boom
  box(heli,.18,.75,.14,PAL.red,-2.55,1.5,0);            // tail fin
  sph(heli,.07,PAL.slateDark,-2.55,1.55,.12);           // tail rotor hub
  box(heli,.7,.08,.04,PAL.white,-2.55,1.55,.155);       // tail rotor blades
  box(heli,.08,.7,.04,PAL.white,-2.55,1.55,.185);
  gsphere(heli,.07,PAL.red,-2.55,1.92,0,1.5);           // tail beacon
  cyl(heli,.09,.11,.5,PAL.slateDark,0,1.85,0,6);        // rotor mast
  cyl(heli,.16,.16,.12,PAL.slateDark,0,2.12,0,8);       // rotor hub
  box(heli,3.3,.06,.26,PAL.slateDark,0,2.06,0,.5);      // main blades (x4)
  box(heli,3.3,.06,.26,PAL.slateDark,0,2.10,0,.5+Math.PI/2);
  heli.position.set(3.3,.40,2.3); g.add(heli);

  /* ---------- emergency department (back-left, entrance faces plaza) ---------- */
  box(g,4.6,2.7,3.2,PAL.cream,-3.0,1.5,-2.9);           // main block
  box(g,4.9,.42,3.5,PAL.navy,-3.0,3.02,-2.9);           // navy roof
  box(g,3.6,.3,2.6,PAL.navy,-3.0,3.35,-2.9);            // roof tier
  box(g,.7,.32,.55,PAL.white,-4.1,3.6,-3.3);            // rooftop vent
  gsphere(g,.1,PAL.red,-3.0,3.56,-2.9,1.5);             // roof beacon
  gbox(g,1.9,1.56,.14,PAL.glowWarm,-3.0,.98,-1.26,0,.95);// wide lit entrance
  box(g,.08,1.56,.12,PAL.navy,-3.0,.98,-1.23);          // sliding-door divider
  box(g,1.1,1.1,.12,PAL.white,-3.0,2.25,-1.26);         // sign backing
  gbox(g,.26,.9,.08,PAL.red,-3.0,2.25,-1.19,0,1.3);     // glowing red cross sign
  gbox(g,.9,.26,.14,PAL.red,-3.0,2.25,-1.19,0,1.3);
  gbox(g,.65,.55,.12,PAL.glowWarm,-4.55,1.05,-1.26,0,.8); // ground-floor windows
  gbox(g,.65,.55,.12,PAL.glowWarm,-1.45,1.05,-1.26,0,.8);
  gbox(g,.65,.42,.12,PAL.glowWarm,-4.55,2.35,-1.26,0,.7); // upper windows
  gbox(g,.65,.42,.12,PAL.glowWarm,-1.45,2.35,-1.26,0,.7);
  gbox(g,.12,.5,.7,PAL.glowWarm,-5.31,1.6,-3.4,0,.7);   // west side windows
  gbox(g,.12,.5,.7,PAL.glowWarm,-5.31,1.6,-2.3,0,.7);
  gbox(g,.12,.5,.7,PAL.glowWarm,-.69,1.6,-2.9,0,.7);    // east side window
  box(g,1.8,.16,1.7,PAL.navy,-4.5,2.02,-.5);            // ambulance bay awning
  gbox(g,1.8,.12,.1,PAL.red,-4.5,2.02,.38,0,1.0);       // awning red stripe
  cyl(g,.07,.07,1.8,PAL.white,-5.25,1.1,.2,6);          // awning posts
  cyl(g,.07,.07,1.8,PAL.white,-3.75,1.1,.2,6);

  /* ---------- gurney between the ER and the hangar ---------- */
  box(g,1.15,.09,.55,PAL.white,.45,.72,-3.7);           // bed
  box(g,.75,.09,.45,PAL.red,.63,.79,-3.7);              // red blanket
  box(g,.22,.09,.4,PAL.white,0,.8,-3.7);                // pillow
  sph(g,.11,PAL.brown,.1,.9,-3.7);                      // teddy patient
  box(g,.07,.44,.48,PAL.slateDark,-.05,.46,-3.7);       // leg frames
  box(g,.07,.44,.48,PAL.slateDark,.95,.46,-3.7);
  sph(g,.075,PAL.slateDark,-.05,.28,-3.93);             // wheels
  sph(g,.075,PAL.slateDark,-.05,.28,-3.47);
  sph(g,.075,PAL.slateDark,.95,.28,-3.93);
  sph(g,.075,PAL.slateDark,.95,.28,-3.47);

  /* ---------- rescue hangar (back-right, open front) ---------- */
  box(g,3.5,.14,2.4,PAL.gray,3.3,.3,-4.2);              // slab
  box(g,3.3,2.1,.18,PAL.slate,3.3,1.32,-5.36);          // back wall
  box(g,.18,2.1,2.2,PAL.slate,1.74,1.32,-4.25);         // side walls
  box(g,.18,2.1,2.2,PAL.slate,4.86,1.32,-4.25);
  box(g,3.7,.22,2.7,PAL.slateDark,3.3,2.46,-4.25);      // slate roof
  gbox(g,2.4,.2,.1,PAL.neonCyan,3.3,2.46,-2.88,0,1.2);  // roof-edge sign strip
  gbox(g,1.5,.07,.6,PAL.glowWarm,3.3,2.34,-4.2,0,1.1);  // interior light
  box(g,2.6,.07,.5,PAL.brown,3.3,1.05,-5.04);           // shelves
  box(g,2.6,.07,.5,PAL.brown,3.3,1.65,-5.04);
  box(g,.4,.3,.35,PAL.red,2.5,1.23,-5.0);               // gear crates
  box(g,.35,.28,.3,PAL.teal,3.2,1.22,-4.95);
  box(g,.3,.26,.3,PAL.white,3.9,1.21,-5.05);
  sph(g,.14,PAL.sun,2.7,1.8,-5.0);                      // helmets
  sph(g,.14,PAL.white,3.3,1.8,-5.0);
  sph(g,.14,PAL.coral,3.9,1.8,-5.0);
  box(g,.14,.75,.42,PAL.coral,4.72,1.6,-4.2);           // hanging flight suits
  box(g,.14,.75,.42,PAL.navy,4.72,1.6,-3.6);

  /* ---------- yard dressing ---------- */
  cyl(g,.32,.32,.62,PAL.red,1.0,.53,-2.4,8);            // fuel drums
  cyl(g,.32,.32,.62,PAL.white,.35,.53,-2.15,8);
  cone(g,.17,.42,PAL.coral,1.3,.44,3.9,6);              // traffic cone
  cyl(g,.05,.07,1.5,PAL.white,5.3,.95,4.6,6);           // windsock pole
  gcone(g,.16,.55,PAL.coral,5.0,1.6,4.6,6,.6).rotation.z=Math.PI/2;
  box(g,.5,.04,.16,PAL.white,-.5,.26,3.45,2.18);        // path dashes to ER
  box(g,.5,.04,.16,PAL.white,-1.05,.26,2.7,2.18);
  box(g,.5,.04,.16,PAL.white,-1.55,.26,2.0,2.18);
  box(g,.5,.04,.16,PAL.white,-2.1,.26,1.25,2.18);
  lamp(g,-2.3,4.8,Math.PI);
  tree(g,-4.7,4.4,.9);
  plight(g,PAL.glowWarm,-3.0,1.5,-.5,1.2,9);
  return g;
}

/* ============ 7. UTAH JAZZ COURT ============ */
function createJazzCourt(){
  const g = tile(PAL.courtTile);
  g.name = 'utah-jazz-court';

  /* hardwood court (runs along x, hoops at both ends), tile top y=.235 */
  box(g,9.4,.18,6.0,PAL.courtWood,0,.31,-.5);          // wood slab, top y=.40
  box(g,9.2,.04,.1,PAL.brown,0,.40,-1.9);              // plank seam
  box(g,9.2,.04,.1,PAL.brown,0,.40,.9);                // plank seam

  /* gold apron plinth framing the hardwood (one slab: no corner seams) */
  box(g,10.0,.12,6.6,PAL.honey,0,.29,-.5);             // y .23-.35, gold ledge

  /* white boundary + half-court lines (sunk into wood, protrude .045) */
  box(g,9.24,.05,.14,PAL.white,0,.42,2.1);             // sideline (front)
  box(g,9.24,.05,.14,PAL.white,0,.42,-3.1);            // sideline (back)
  box(g,.14,.05,5.2,PAL.white,4.5,.415,-.5);           // baseline (y offset vs sidelines)
  box(g,.14,.05,5.2,PAL.white,-4.5,.415,-.5);          // baseline
  box(g,.1,.05,5.2,PAL.white,0,.415,-.5);              // half-court line

  /* painted keys + glowing free-throw dots */
  box(g,1.9,.05,1.8,PAL.honey,3.4,.40,-.5);
  box(g,1.9,.05,1.8,PAL.honey,-3.4,.40,-.5);
  gcyl(g,.5,.5,.05,PAL.sun,2.45,.42,-.5,12,.4);
  gcyl(g,.5,.5,.05,PAL.sun,-2.45,.42,-.5,12,.4);

  /* gold center circle: glowing disc + ring */
  gcyl(g,.58,.58,.06,PAL.honey,0,.40,-.5,16,.35);
  const cc = new THREE.Mesh(new THREE.TorusGeometry(.85,.06,6,20),glowMat(PAL.sun,.5));
  cc.rotation.x = Math.PI/2; add(g,cc,0,.42,-.5);

  /* twin hoops: navy post, white backboard, gold target square, coral rim, net */
  [1,-1].forEach(s=>{
    box(g,.7,.25,.7,PAL.slateDark,5.15*s,.33,0);       // base pad
    cyl(g,.1,.13,2.6,PAL.navy,5.15*s,1.6,0,8);         // post
    box(g,.6,.1,.12,PAL.navy,4.85*s,2.75,0);           // arm
    box(g,.12,1.05,1.5,PAL.white,4.5*s,2.6,0);         // backboard
    gbox(g,.1,.55,.62,PAL.sun,4.47*s,2.5,0,0,.9);      // glowing target square
    box(g,.28,.06,.12,PAL.honey,4.37*s,2.26,0);        // rim bracket
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.32,.05,6,12),glowMat(PAL.coral,.9));
    rim.rotation.x = Math.PI/2; add(g,rim,4.1*s,2.25,0);
    cyl(g,.27,.16,.42,PAL.white,4.1*s,2.02,0,8);       // net hint
  });

  /* scoreboard on a post, display faces the court/plaza (+z) */
  box(g,.9,.25,.6,PAL.navy,0,.34,-4.6);                // base
  cyl(g,.1,.1,2.3,PAL.slateDark,0,1.5,-4.6,6);         // post
  box(g,2.8,1.3,.45,PAL.navy,0,3.2,-4.6);              // cabinet
  box(g,2.9,.14,.5,PAL.honey,0,3.9,-4.6);              // gold cap
  gbox(g,.62,.5,.08,PAL.sun,-.95,3.3,-4.37,0,1.2);     // home score
  gbox(g,.62,.5,.08,PAL.sun,.95,3.3,-4.37,0,1.2);      // guest score
  gbox(g,.9,.7,.08,PAL.glowWarm,0,3.15,-4.37,0,1.0);   // center clock panel
  gbox(g,2.6,.1,.08,PAL.coral,0,2.68,-4.37,0,.9);      // shot-clock strip

  /* two light masts flanking the scoreboard */
  [1,-1].forEach(s=>{
    box(g,.6,.2,.6,PAL.slateDark,5.15*s,.32,-4.4);
    cyl(g,.08,.11,3.4,PAL.slateDark,5.15*s,1.95,-4.4,6);
    box(g,.8,.12,.14,PAL.navy,4.8*s,3.55,-4.4);
    gbox(g,.5,.26,.32,PAL.glowWarm,4.5*s,3.38,-4.4,0,1.3);
  });

  /* mini bleachers behind the back sideline (bases reach into the tile) */
  [1,-1].forEach(s=>{
    box(g,2.6,.4,.7,PAL.navy,3.1*s,.42,-4.0);          // low riser, y .22-.62
    box(g,2.5,.06,.5,PAL.honey,3.1*s,.64,-4.0);        // seat plate (inset)
    box(g,2.6,.8,.7,PAL.navy,3.1*s,.62,-4.7);          // tall riser, y .22-1.02
    box(g,2.5,.06,.5,PAL.honey,3.1*s,1.03,-4.7);       // seat plate (inset)
  });

  /* team bench (left of the entrance lane) with towels + bottles */
  box(g,2.4,.12,.6,PAL.courtWood,-3.3,.62,3.4);        // seat
  box(g,.16,.35,.5,PAL.navy,-4.25,.40,3.4);            // leg (sunk into tile)
  box(g,.16,.35,.5,PAL.navy,-2.35,.40,3.4);            // leg
  box(g,2.3,.7,.1,PAL.navy,-3.3,.95,3.72);             // backrest (inset vs seat)
  box(g,.4,.06,.3,PAL.white,-3.9,.70,3.35);            // towel
  box(g,.4,.06,.3,PAL.honey,-2.75,.70,3.42);           // towel
  cyl(g,.05,.05,.22,PAL.white,-3.45,.34,2.95,6);       // bottle
  cyl(g,.05,.05,.22,PAL.white,-3.25,.34,2.98,6);       // bottle
  cyl(g,.05,.05,.22,PAL.sun,-3.05,.34,2.94,6);         // bottle

  /* ball rack (right of the entrance lane) */
  box(g,1.2,.08,.5,PAL.navy,3.3,.65,3.4);              // shelf
  box(g,.1,.46,.46,PAL.navy,2.76,.44,3.4);             // side panel (inset depth)
  box(g,.1,.46,.46,PAL.navy,3.84,.44,3.4);             // side panel (inset depth)
  sph(g,.22,PAL.basketball,2.96,.90,3.4);
  sph(g,.22,PAL.basketball,3.3,.90,3.4);
  sph(g,.22,PAL.basketball,3.64,.90,3.4);

  /* game ball on the court with a seam band */
  sph(g,.3,PAL.basketball,1.5,.70,.3);
  cyl(g,.31,.31,.05,PAL.slateDark,1.5,.70,.3,10);

  /* entrance: welcome mat + gold-topped bollards (lane x[-1.8,1.8] stays low) */
  box(g,2.6,.06,2.4,PAL.courtWood,0,.24,4.4);
  cyl(g,.12,.14,.55,PAL.navy,2.05,.5,4.5,8);
  cyl(g,.12,.14,.55,PAL.navy,-2.05,.5,4.5,8);
  gsphere(g,.1,PAL.sun,2.05,.83,4.5,1.1);
  gsphere(g,.1,PAL.sun,-2.05,.83,4.5,1.1);

  /* gold Jazz eighth-note sculpture beside the entrance */
  cyl(g,.5,.58,.45,PAL.navy,3.0,.45,4.7,10);           // pedestal
  const noteHead = gsphere(g,.3,PAL.sun,2.85,.88,4.7,.8);
  noteHead.scale.set(1.15,.72,1);                      // note head
  gcyl(g,.08,.08,1.4,PAL.sun,3.08,1.6,4.7,6,.8);       // stem (cap buried in flag)
  gbox(g,.55,.16,.14,PAL.sun,3.33,2.29,4.7,0,.8);      // flag
  gbox(g,.16,.34,.13,PAL.sun,3.53,2.05,4.7,0,.8);      // flag droop (inset depth)

  plight(g,0xffe2b0,0,3.2,-.5,1.1,11);
  return g;
}

/* ============ 8. ART LAB ============ */
function createArtLab(){
  const g = tile(PAL.sand);
  g.name = 'art-lab';
  /* ---- STUDIO building (back), flat teal roof + tilted glowing skylight ---- */
  box(g,5.4,2.8,3.4,PAL.cream,-1.6,1.5,-3.0);
  box(g,5.7,.3,3.7,PAL.tealDeep,-1.6,2.95,-3.0);
  const skf=box(g,2.8,.12,2.4,PAL.slate,-2.4,3.28,-3.0); skf.rotation.z=.28;
  const skp=gbox(g,2.5,.12,2.1,PAL.glowWarm,-2.4,3.38,-3.0,0,1.1); skp.rotation.z=.28;
  box(g,.24,.6,2.0,PAL.slate,-1.1,3.32,-3.0);
  /* wide lit window with a shelf line of paint pots */
  gbox(g,2.8,1.1,.12,PAL.glowWarm,-2.4,1.7,-1.26,0,.85);
  box(g,2.7,.1,.3,PAL.slateDark,-2.4,1.55,-1.12);
  gbox(g,.2,.2,.12,PAL.neonPink,-3.1,1.66,-1.06,0,.8);
  gbox(g,.2,.2,.12,PAL.sun,-2.4,1.66,-1.06,0,.8);
  gbox(g,.2,.2,.12,PAL.neonCyan,-1.7,1.66,-1.06,0,.8);
  /* door, transom, knob, neon fascia strip, side window */
  box(g,1.0,1.6,.16,PAL.tealDeep,0.2,1.0,-1.26);
  gbox(g,.8,.3,.14,PAL.glowWarm,0.2,2.0,-1.29,0,.9);
  sph(g,.06,PAL.sun,0.5,1.0,-1.16);
  gbox(g,2.4,.3,.16,PAL.neonPink,-1.6,3.0,-1.15,0,1.2);
  gbox(g,.16,1.0,1.5,PAL.glowWarm,1.12,1.6,-3.2,0,.8);
  /* ---- string lights across the yard (studio wall to poles) ---- */
  cyl(g,.06,.09,2.6,PAL.slateDark,4.9,1.3,3.8,6);
  cyl(g,.06,.09,2.5,PAL.slateDark,-5.0,1.25,3.0,6);
  lanterns(g,0.9,-1.4,4.9,3.8,2.5,6);
  lanterns(g,-4.2,-1.4,-5.0,3.0,2.4,4);
  /* ---- easel row (front-left), middle canvas mid-painting ---- */
  [-4.6,-3.4,-2.2].forEach(ex=>{
    const l1=box(g,.09,2.0,.09,PAL.brown,ex-.42,1.2,2.2); l1.rotation.x=-.18;
    const l2=box(g,.09,2.0,.09,PAL.brown,ex+.42,1.2,2.2); l2.rotation.x=-.18;
    const l3=box(g,.09,2.0,.09,PAL.brown,ex,1.15,1.75); l3.rotation.x=.35;
    box(g,1.0,.14,.14,PAL.brown,ex,2.08,2.03);
    const cv=box(g,1.1,.9,.07,PAL.white,ex,1.35,2.26); cv.rotation.x=-.18;
    box(g,1.2,.08,.18,PAL.brown,ex,.82,2.32);
    if(ex===-3.4){ const bl=gbox(g,.5,.4,.06,PAL.sun,ex,1.4,2.30,0,.7); bl.rotation.x=-.18; }
  });
  /* ---- GIANT PALETTE table (front-right): wood disc, thumb hole, 6 paint pools ---- */
  cyl(g,.6,.78,.5,PAL.brown,3.3,.47,2.6,8);
  cyl(g,1.6,1.6,.2,PAL.courtWood,3.3,.80,2.6,12);
  cyl(g,.22,.22,.06,PAL.slateDark,2.5,.91,2.2,8);
  [[PAL.neonPink,2.36,2.94],[PAL.sun,2.96,3.54],[PAL.neonCyan,3.8,3.47],
   [PAL.neonPurple,4.28,2.77],[PAL.red,4.07,1.96],[PAL.teal,3.3,1.6]].forEach(p=>
    gcyl(g,.3,.3,.07,p[0],p[1],.915,p[2],8,.9));
  /* giant brush leaning on the palette rim */
  const br=new THREE.Group();
  cyl(br,.09,.09,2.0,PAL.honey,0,0,0,7);
  cyl(br,.12,.12,.3,PAL.gray,0,-1.15,0,7);
  const bt=gcone(br,.17,.42,PAL.neonPurple,0,-1.44,0,7,.9); bt.rotation.x=Math.PI;
  br.position.set(3.96,1.26,1.4); br.rotation.z=.855; g.add(br);
  /* paint buckets */
  cyl(g,.3,.24,.5,PAL.white,2.1,.48,3.8,8);
  gcyl(g,.23,.23,.06,PAL.sun,2.1,.72,3.8,8,.8);
  cyl(g,.3,.24,.5,PAL.teal,4.7,.48,4.3,8);
  gcyl(g,.23,.23,.06,PAL.neonPink,4.7,.72,4.3,8,.8);
  /* ---- outdoor GALLERY WALL (right, facing plaza): 3 framed works + strip light ---- */
  box(g,3.4,.3,.5,PAL.slateDark,3.7,.3,-1.0);
  box(g,3.2,1.7,.3,PAL.white,3.7,1.25,-1.0);
  box(g,3.3,.1,.45,PAL.slate,3.7,2.13,-0.92);
  gbox(g,2.9,.09,.12,PAL.glowWarm,3.7,2.06,-0.72,0,1.3);
  [[PAL.coral,2.75],[PAL.neonCyan,3.7],[PAL.neonPurple,4.65]].forEach(f=>{
    box(g,.72,.72,.08,PAL.honey,f[1],1.25,-0.83);
    gbox(g,.5,.5,.08,f[0],f[1],1.25,-0.78,0,.6);
  });
  /* ---- paint splat ground decals ---- */
  cyl(g,.55,.55,.06,PAL.neonPink,-1.3,.26,3.3,9);
  cyl(g,.18,.18,.07,PAL.neonPink,-1.9,.26,3.7,7);
  cyl(g,.12,.12,.07,PAL.neonPink,-0.85,.26,2.8,6);
  cyl(g,.5,.5,.06,PAL.neonCyan,1.7,.26,0.9,9);
  cyl(g,.16,.16,.07,PAL.neonCyan,2.3,.26,1.4,7);
  cyl(g,.12,.12,.07,PAL.neonCyan,1.2,.26,0.3,6);
  /* path from the plaza to the studio door */
  box(g,1.4,.06,5.5,PAL.sandDark,0.2,.26,1.55);
  /* stool + brush jar near the easels */
  cyl(g,.24,.28,.45,PAL.brown,-3.5,.44,3.3,7);
  cyl(g,.15,.15,.4,PAL.sky,-2.2,.42,3.4,7);
  /* finished canvases leaning on the studio front wall */
  const c1=box(g,.85,.7,.07,PAL.white,-4.05,.58,-1.22); c1.rotation.x=-.28;
  const b1=gbox(g,.4,.3,.06,PAL.neonCyan,-4.05,.6,-1.18,0,.6); b1.rotation.x=-.28;
  const c2=box(g,.7,.55,.07,PAL.white,-3.2,.5,-1.21); c2.rotation.x=-.3;
  const b2=gbox(g,.34,.26,.06,PAL.pink,-3.2,.52,-1.17,0,.6); b2.rotation.x=-.3;
  tree(g,4.8,-3.7,.9);
  plight(g,PAL.glowWarm,-1.6,1.8,0,1.1,8);
  return g;
}

/* ============ 9. STEAM LAB ============ */
function createSteamLab(){
  const g = tile(PAL.sand);
  g.name = 'steam-lab';

  /* --- classroom building (facade faces +z) --- */
  box(g,6.0,2.8,3.6,PAL.navy,-1.2,1.45,-2.2);          // main hall
  box(g,6.2,.3,3.9,PAL.slateDark,-1.2,2.98,-2.2);      // flat roof slab
  box(g,6.2,.16,.14,PAL.cream,-1.2,2.8,-.36);          // fascia trim under roof edge
  box(g,1.2,1.7,.08,PAL.cream,0,1.07,-.4);             // door frame
  box(g,1.0,1.5,.12,PAL.teal,0,.97,-.35);              // door
  sph(g,.05,PAL.sun,.32,1.0,-.27);                     // doorknob
  gbox(g,1.5,.3,.1,PAL.neonCyan,0,2.35,-.37,0,1.4);    // neon lab sign
  /* two big lit windows + navy mullions + cream sills */
  gbox(g,1.4,1.3,.1,PAL.glowWarm,-3.1,1.7,-.37,0,.9);
  gbox(g,1.4,1.3,.1,PAL.glowWarm,-1.5,1.7,-.37,0,.9);
  box(g,.07,1.26,.08,PAL.navy,-3.1,1.7,-.33);
  box(g,1.36,.07,.08,PAL.navy,-3.1,1.7,-.35);
  box(g,.07,1.26,.08,PAL.navy,-1.5,1.7,-.33);
  box(g,1.36,.07,.08,PAL.navy,-1.5,1.7,-.35);
  box(g,1.56,.1,.18,PAL.cream,-3.1,1.02,-.36);
  box(g,1.56,.1,.18,PAL.cream,-1.5,1.02,-.36);

  /* --- rooftop gear train: 3 meshing gears on pillared axles --- */
  box(g,4.4,.25,.35,PAL.slate,-1.3,3.24,-2.85);        // base rail on roof
  box(g,.22,1.0,.22,PAL.slate,-2.8,3.85,-2.85);        // pillars
  box(g,.22,1.35,.22,PAL.slate,-1.05,4.02,-2.85);
  box(g,.22,1.0,.22,PAL.slate,.25,3.85,-2.85);
  /* big teal gear */
  cyl(g,.95,.95,.26,PAL.teal,-2.8,4.35,-2.35,12).rotation.x=Math.PI/2;
  cyl(g,.09,.09,.8,PAL.slateDark,-2.8,4.35,-2.5,6).rotation.x=Math.PI/2;
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2;
    box(g,.26,.26,.3,PAL.teal,-2.8+Math.cos(a)*.95,4.35+Math.sin(a)*.95,-2.35);}
  /* mid gear — gold and glowing */
  gcyl(g,.65,.65,.26,PAL.sun,-1.05,4.7,-2.32,10,1.0).rotation.x=Math.PI/2;
  cyl(g,.09,.09,.8,PAL.slateDark,-1.05,4.7,-2.5,6).rotation.x=Math.PI/2;
  for(let i=0;i<8;i++){const a=(i+.5)/8*Math.PI*2;
    gbox(g,.24,.24,.3,PAL.sun,-1.05+Math.cos(a)*.65,4.7+Math.sin(a)*.65,-2.32,0,1.0);}
  /* small coral gear */
  cyl(g,.45,.45,.26,PAL.coral,.25,4.35,-2.35,9).rotation.x=Math.PI/2;
  cyl(g,.09,.09,.8,PAL.slateDark,.25,4.35,-2.5,6).rotation.x=Math.PI/2;
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;
    box(g,.22,.22,.3,PAL.coral,.25+Math.cos(a)*.45,4.35+Math.sin(a)*.45,-2.35);}

  /* --- test rocket on launch ring with gantry --- */
  cyl(g,1.35,1.5,.27,PAL.slate,3.4,.35,-1.6,12);       // launch pad
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.07,5,14),glowMat(PAL.neonCyan,1.2));
  ring.rotation.x=-Math.PI/2; add(g,ring,3.4,.53,-1.6); // glowing launch ring
  cyl(g,.48,.56,1.9,PAL.white,3.4,1.95,-1.6,10);       // white body
  cyl(g,.57,.57,.4,PAL.coral,3.4,1.5,-1.6,10);         // coral bands
  cyl(g,.52,.52,.22,PAL.coral,3.4,2.55,-1.6,10);
  gbox(g,.3,.3,.1,PAL.neonCyan,3.4,2.15,-1.12,0,1.5);  // porthole
  cone(g,.5,.95,PAL.coral,3.4,3.33,-1.6,10);           // nose cone
  gsphere(g,.09,PAL.red,3.4,3.85,-1.6,1.5);            // nose beacon
  gcone(g,.34,.55,PAL.sun,3.4,.76,-1.6,8,1.6).rotation.x=Math.PI; // glowing engine
  box(g,.16,.9,.6,PAL.coral,4.02,.93,-1.6);            // fins
  box(g,.16,.9,.6,PAL.coral,2.78,.93,-1.6);
  box(g,.6,.9,.16,PAL.coral,3.4,.93,-.98);
  box(g,.6,.9,.16,PAL.coral,3.4,.93,-2.22);
  box(g,.35,3.3,.35,PAL.slate,5.0,1.88,-1.6);          // gantry tower
  box(g,1.2,.16,.28,PAL.slate,4.35,3.1,-1.6);          // gantry arm
  gsphere(g,.1,PAL.red,5.0,3.62,-1.6,1.5);             // tower beacon

  /* --- bubbling beaker on a stand --- */
  box(g,1.5,.67,1.5,PAL.slateDark,3.0,.55,2.6);
  box(g,1.7,.12,1.7,PAL.slate,3.0,.94,2.6);
  gcyl(g,.5,.62,1.15,PAL.beaker,3.0,1.57,2.6,10,.85);  // beaker
  gcyl(g,.42,.42,.12,PAL.neonCyan,3.0,2.18,2.6,10,1.5);// glowing liquid surface
  gsphere(g,.12,PAL.neonCyan,3.08,2.45,2.55,1.4);      // rising bubbles
  gsphere(g,.09,PAL.neonCyan,2.92,2.72,2.66,1.4);
  gsphere(g,.11,PAL.neonCyan,3.04,3.0,2.6,1.4);
  gsphere(g,.06,PAL.neonCyan,2.96,3.28,2.63,1.4);

  /* --- workbench with blocks + hammer --- */
  box(g,2.6,.16,1.3,PAL.courtWood,-3.5,.95,2.4);
  box(g,.2,.72,1.1,PAL.brown,-4.6,.59,2.4);
  box(g,.2,.72,1.1,PAL.brown,-2.4,.59,2.4);
  box(g,.4,.4,.4,PAL.coral,-4.1,1.22,2.3);
  box(g,.4,.4,.4,PAL.teal,-3.55,1.22,2.6);
  box(g,.4,.4,.4,PAL.sun,-4.1,1.61,2.3);
  box(g,.3,.3,.3,PAL.purple,-3.0,1.17,2.15);
  cyl(g,.05,.05,.55,PAL.brown,-3.05,1.08,2.75,6).rotation.z=Math.PI/2;
  box(g,.16,.14,.3,PAL.gray,-3.38,1.09,2.75);

  /* --- chalkboard leaning on the wall (tilted, with scribbles) --- */
  box(g,1.28,1.52,.07,PAL.cream,1.2,.905,-.238).rotation.x=-.25;  // frame
  box(g,1.15,1.4,.1,PAL.slateDark,1.2,.92,-.18).rotation.x=-.25;  // board
  box(g,.85,.06,.045,PAL.white,1.17,1.343,-.218).rotation.x=-.25; // scribbles
  box(g,.6,.06,.045,PAL.white,1.32,1.11,-.158).rotation.x=-.25;
  box(g,.75,.06,.045,PAL.white,1.12,.858,-.094).rotation.x=-.25;
  box(g,.45,.06,.045,PAL.white,1.3,.607,-.03).rotation.x=-.25;
  box(g,1.2,.06,.12,PAL.cream,1.2,.288,.095).rotation.x=-.25;     // chalk tray

  /* --- approach path + dressing --- */
  box(g,1.5,.06,5.2,PAL.sandDark,0,.26,3.05);          // walk path down the lane
  box(g,1.3,.12,.72,PAL.cream,0,.29,.02);              // doorstep
  lamp(g,2.4,4.6,-2.2);
  tree(g,-4.6,4.3,.9);
  plight(g,PAL.glowWarm,3.0,2.3,2.6,1.1,8);
  return g;
}

/* ---------------------------- registry ------------------------------ */
const EXHIBITS = [
  { id:'kids-eye-view',            name:'Kids Eye View',
    stations:['grocery store','mechanic shop','construction zone'],
    create:createKidsEyeView },
  { id:'i-dig-dinos',              name:'I Dig Dinos',
    stations:['dig pit (skeleton)','fossil ID lab','skull display'],
    create:createIDigDinos },
  { id:'stillson-river-railroad',  name:'Stillson River Railroad',
    stations:['depot','track','locomotive','water tower'],
    create:createRailroad },
  { id:'the-bee-garden',           name:'The Bee Garden',
    stations:['pollinator tower','honey climber','live hive'],
    create:createBeeGarden },
  { id:'sensory-story-factory',    name:'Sensory Room & Story Factory',
    stations:['theater stage','comic panels','sensory orbs','touch boxes'],
    create:createSensoryStory },
  { id:'saving-lives',             name:'Saving Lives (Life Flight)',
    stations:['helicopter + helipad','emergency department','rescue hangar'],
    create:createSavingLives },
  { id:'utah-jazz-court',          name:'Utah Jazz Court',
    stations:['mini court','hoops','scoreboard','bench'],
    create:createJazzCourt },
  { id:'art-lab',                  name:'Art Lab',
    stations:['studio','easel','giant palette'],
    create:createArtLab },
  { id:'steam-lab',                name:'STEAM Lab',
    stations:['classroom','roof gear','rocket','beaker'],
    create:createSteamLab },
];

/** Create an exhibit by its id. */
function createExhibit(id){
  const e = EXHIBITS.find(x=>x.id===id);
  if(!e) throw new Error(`Unknown exhibit id "${id}". Valid ids: ${EXHIBITS.map(x=>x.id).join(', ')}`);
  return e.create();
}

window.DG = { THEMES, setTheme, stripLights, EXHIBITS, createExhibit };
})();
