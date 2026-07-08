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
  const r = new THREE.Mesh(new THREE.CylinderGeometry(d*0.62,d*0.62,w,3),mat(c));
  r.rotation.z = Math.PI/2; r.rotation.y = Math.PI/2; r.scale.y = 0.55;
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
  const g = tile(PAL.asphalt);
  g.name = 'kids-eye-view';
  // grocery store
  box(g,3.4,2.2,2.6,PAL.slate,-3.4,1.15,-2.6);
  box(g,3.6,.3,1.1,PAL.coral,-3.4,2.0,-1.1);
  gbox(g,2.4,.9,.1,PAL.glowWarm,-3.4,1.0,-1.27,0,.9);
  gbox(g,2.8,.5,.15,PAL.neonCyan,-3.4,2.55,-1.31,0,1.6);
  box(g,.6,.4,.4,PAL.sun,-4.3,.3,-1.0); box(g,.6,.4,.4,PAL.grass,-3.6,.3,-.9);
  // mechanic shop
  box(g,3.2,2.4,3.0,PAL.slateDark,3.3,1.25,-2.8);
  gbox(g,2.0,1.5,.2,PAL.glowWarm,3.3,.85,-1.32,0,.55);
  gbox(g,1.7,.3,.12,PAL.neonPink,3.3,2.7,-1.34,0,1.1);
  box(g,1.5,.55,.9,PAL.red,3.3,.4,-.2);
  box(g,.9,.4,.8,PAL.red,3.3,.85,-.35);
  gbox(g,.1,.12,.5,PAL.glowWarm,2.53,.4,-.2,0,1.2);
  cyl(g,.22,.22,.15,PAL.slateDark,2.75,.18,.2,8); cyl(g,.22,.22,.15,PAL.slateDark,3.85,.18,.2,8);
  // construction zone
  box(g,.8,.8,.8,PAL.sun,-3.6,.5,3.2); box(g,.8,.8,.8,PAL.sun,-2.7,.5,3.4);
  box(g,.8,.8,.8,PAL.sun,-3.15,1.3,3.3);
  cyl(g,.3,.3,3.4,PAL.honey,3.2,1.75,3.0,4);
  box(g,3.4,.3,.3,PAL.honey,2.0,3.4,3.0);
  sph(g,.12,PAL.red,3.2,3.65,3.0,true);
  box(g,.12,1.2,.12,PAL.slateDark,.7,2.8,3.0);
  box(g,.7,.5,.7,PAL.coral,.7,2.0,3.0);
  cone(g,.3,.6,PAL.coral,1.6,.35,4.4,6); cone(g,.3,.6,PAL.coral,2.4,.35,4.5,6);
  box(g,4.5,.06,1.4,PAL.road,0,.26,.6);
  for(let i=0;i<3;i++) gbox(g,.6,.02,.1,PAL.white,-1.4+i*1.4,.3,.6,0,.35);
  lamp(g,-.9,1.6,.4);
  plight(g,PAL.glowWarm,-3.4,1.4,-.6,1.1,8);
  return g;
}

/* ============ 2. I DIG DINOS — excavation ============ */
function createIDigDinos(){
  const g = tile(PAL.sand);
  g.name = 'i-dig-dinos';
  /* excavation pit */
  box(g,5.8,.3,4.6,PAL.pitRim,-2.4,.22,2.4);
  box(g,5.2,.25,4.0,PAL.pitEarth,-2.4,.3,2.4);
  const stakes=[[-4.9,.55],[.1,.55],[.1,4.25],[-4.9,4.25]];
  stakes.forEach(s=>cyl(g,.05,.05,.95,PAL.brown,s[0],.75,s[1],5));
  for(let i=0;i<4;i++){
    const a=stakes[i], b2=stakes[(i+1)%4];
    const dx=b2[0]-a[0], dz=b2[1]-a[1], len=Math.hypot(dx,dz);
    box(g,len,.045,.045,PAL.white,(a[0]+b2[0])/2,1.08,(a[1]+b2[1])/2,-Math.atan2(dz,dx));
  }
  /* half-excavated skeleton */
  const SEG=13, pts=[];
  for(let i=0;i<=SEG;i++){
    const t=i/SEG;
    pts.push([-4.15+t*3.25, 1.35+t*1.75+Math.sin(t*Math.PI)*.5]);
  }
  for(let i=1;i<SEG;i++){
    const [x,z]=pts[i], [nx,nz]=pts[i+1];
    const s = i<8 ? .26 : .26-(i-7)*.03;
    const ang=-Math.atan2(nz-z,nx-x);
    box(g,s*1.5,s,s,PAL.white,x,.48,z,ang);
    if(i<8) box(g,s*.5,s*.5,s*1.9,PAL.white,x,.5,z,ang);
  }
  const hx=pts[0][0], hz=pts[0][1];
  const hAng=-Math.atan2(hz-pts[1][1], hx-pts[1][0]);
  const skull=new THREE.Group();
  box(skull,.85,.32,.62,PAL.white,0,0,0);
  box(skull,.6,.22,.38,PAL.white,.62,-.04,0);
  box(skull,.32,.1,.66,PAL.white,-.28,.14,0);
  box(skull,.15,.05,.13,PAL.pitEarth,.12,.18,.17);
  box(skull,.15,.05,.13,PAL.pitEarth,.12,.18,-.17);
  box(skull,.12,.05,.1,PAL.pitEarth,.68,.09,0);
  skull.position.set(hx,.52,hz); skull.rotation.y=hAng;
  skull.traverse(o=>{o.castShadow=o.receiveShadow=true;});
  g.add(skull);
  for(let i=2;i<=6;i++){
    const [x,z]=pts[i], [nx,nz]=pts[i+1];
    const ang=-Math.atan2(nz-z,nx-x);
    const r=.66-Math.abs(i-4)*.1;
    [1,-1].forEach(side=>{
      const rg=new THREE.Group();
      const m=new THREE.Mesh(new THREE.TorusGeometry(r,.065,5,9,Math.PI*.72),mat(PAL.white));
      m.rotation.x=Math.PI/2; m.position.x=-r;
      m.castShadow=m.receiveShadow=true;
      rg.add(m);
      rg.position.set(x,.48,z); rg.rotation.y=ang; rg.scale.z=side;
      g.add(rg);
    });
  }
  const fem=new THREE.Group();
  cyl(fem,.08,.08,.95,PAL.white,0,0,0,6).rotation.z=Math.PI/2;
  sph(fem,.13,PAL.white,-.5,0,0); sph(fem,.13,PAL.white,.52,0,0);
  fem.position.set(-1.05,.48,1.9); fem.rotation.y=1.1; g.add(fem);
  const lb=new THREE.Group();
  cyl(lb,.06,.06,.6,PAL.white,0,0,0,6).rotation.z=Math.PI/2;
  sph(lb,.1,PAL.white,-.32,0,0); sph(lb,.1,PAL.white,.32,0,0);
  lb.position.set(-4.0,.42,2.6); lb.rotation.y=-.5; g.add(lb);
  sph(g,.6,PAL.pitEarth,-1.0,.32,3.15).scale.set(1.7,.45,1.15);
  sph(g,.45,PAL.pitEarth,-1.5,.3,3.0).scale.set(1.3,.4,1.0);
  /* work floodlight */
  cyl(g,.07,.09,2.6,PAL.slateDark,.5,1.3,2.5,6);
  box(g,.5,.1,.1,PAL.slateDark,.2,2.6,2.5);
  const fl=gbox(g,.4,.28,.3,PAL.glowWarm,-.05,2.5,2.5,0,1.5);
  fl.rotation.z=.5;
  plight(g,PAL.glowWarm,-1.6,2.2,2.4,1.4,9);
  /* dig tools */
  const brush=new THREE.Group();
  cyl(brush,.045,.045,.5,PAL.brown,0,0,0,6).rotation.z=Math.PI/2;
  box(brush,.18,.09,.13,PAL.sun,.32,0,0);
  brush.position.set(-3.4,.46,3.9); brush.rotation.y=.7; g.add(brush);
  const trowel=new THREE.Group();
  cyl(trowel,.04,.04,.34,PAL.brown,-.28,0,0,6).rotation.z=Math.PI/2;
  box(trowel,.34,.04,.2,PAL.gray,0,0,0);
  trowel.position.set(.6,.42,3.4); trowel.rotation.y=-.9; g.add(trowel);
  cyl(g,.3,.24,.45,PAL.teal,.9,.5,1.0,8);
  /* fossil ID lab */
  box(g,3.2,2.3,2.6,PAL.cream,3.2,1.2,-2.6);
  roofBlock(g,3.4,2.8,PAL.tealDeep,3.2,2.65,-2.6);
  gbox(g,1.9,1.0,.12,PAL.glowWarm,3.2,1.3,-1.28,0,.85);
  gbox(g,.9,.18,.1,PAL.neonCyan,3.2,2.35,-1.3,0,1.7);
  cyl(g,.16,.16,.7,PAL.slate,4.0,.6,-1.0,6);
  sph(g,.24,PAL.slate,4.0,1.05,-1.0);
  /* fossil skull display */
  cyl(g,.9,1.1,.5,PAL.slateDark,-3.3,.5,-3.0,6);
  box(g,1.3,.8,.9,PAL.white,-3.3,1.2,-3.0);
  box(g,.9,.4,.7,PAL.white,-3.3,.85,-2.5);
  cone(g,.14,.5,PAL.white,-3.8,1.8,-3.2,5); cone(g,.14,.5,PAL.white,-2.8,1.8,-3.2,5);
  tree(g,4.6,2.0,0.8);
  return g;
}

/* ============ 3. STILLSON RIVER RAILROAD ============ */
function createRailroad(){
  const g = tile(PAL.grass);
  g.name = 'stillson-river-railroad';
  for(let i=-5;i<=5;i++) box(g,.5,.1,1.6,PAL.brown,i*1.05,.28,1.6);
  box(g,11.4,.12,.18,PAL.slateDark,0,.36,1.05);
  box(g,11.4,.12,.18,PAL.slateDark,0,.36,2.15);
  const loco = new THREE.Group();
  cyl(loco,.75,.75,2.2,PAL.navy,0,1.05,0,10).rotation.z=Math.PI/2;
  box(loco,1.4,1.6,1.5,PAL.red,-1.5,1.0,0);
  gbox(loco,.5,.5,.08,PAL.glowWarm,-1.5,1.25,.76,0,.8);
  box(loco,1.5,.4,1.6,PAL.slateDark,-.3,.35,0);
  cyl(loco,.22,.3,.7,PAL.slateDark,.8,1.9,0,8);
  cone(loco,.5,.7,PAL.red,1.35,1.0,0,8).rotation.z=-Math.PI/2;
  gsphere(loco,.16,PAL.glowWarm,1.15,1.35,0,1.6);
  [-1.4,-.5,.5].forEach(x=>{
    cyl(loco,.34,.34,.2,PAL.sun,x,.35,.8,8).rotation.x=Math.PI/2;
    cyl(loco,.34,.34,.2,PAL.sun,x,.35,-.8,8).rotation.x=Math.PI/2;});
  loco.position.set(1.2,.4,1.6); g.add(loco);
  box(g,1.8,.9,1.3,PAL.teal,-2.4,1.0,1.6);
  box(g,1.4,.3,.9,PAL.slateDark,-2.4,1.55,1.6);
  sph(g,.1,PAL.red,-3.3,1.0,1.6,true);
  box(g,3.6,.4,2.2,PAL.slate,-1.6,.4,-2.2);
  box(g,2.8,1.9,1.8,PAL.red,-1.6,1.55,-2.5);
  roofBlock(g,3.2,2.2,PAL.slateDark,-1.6,2.75,-2.5);
  gbox(g,.7,1.1,.1,PAL.glowWarm,-1.6,1.15,-1.58,0,.9);
  gbox(g,.5,.5,.1,PAL.glowWarm,-2.4,1.6,-1.58,0,.7);
  gbox(g,1.6,.22,.1,PAL.neonPink,-1.6,2.5,-1.6,0,1.1);
  lamp(g,.4,-1.6,2.6);
  cyl(g,.9,.9,1.4,PAL.brown,3.6,2.6,-3.0,8);
  cone(g,1.05,.7,PAL.slateDark,3.6,3.65,-3.0,8);
  [[.4,.4],[-.4,.4],[.4,-.4],[-.4,-.4]].forEach(p=>cyl(g,.09,.09,1.9,PAL.slateDark,3.6+p[0],.95,-3.0+p[1],5));
  tree(g,4.6,3.6,1); tree(g,-4.4,3.9,0.85);
  plight(g,PAL.glowWarm,-1.6,1.6,-1.2,1.1,8);
  return g;
}

/* ============ 4. THE BEE GARDEN ============ */
function createBeeGarden(){
  const g = tile(PAL.grass);
  g.name = 'the-bee-garden';
  PAL.towerHues.forEach((h,i)=> cyl(g,1.15-i*.16,1.25-i*.16,1.1,h,-2.9,.7+i*1.05,-2.6,6));
  gcyl(g,.62,.62,.5,PAL.glowWarm,-2.9,1.0,-1.55,6,.7);
  sph(g,.5,PAL.slateDark,-2.9,5.1,-2.6);
  box(g,.9,.05,.5,PAL.sky,-2.9,5.25,-2.6);
  const cells=[[2.4,2.2,1.0],[3.4,2.6,1.7],[2.9,3.4,1.35],[3.9,3.5,.8],[2.0,3.2,.7]];
  cells.forEach((c,i)=>{
    if(i===1) gcyl(g,.62,.62,c[2],PAL.honey,c[0],c[2]/2+.2,c[1],6,.5);
    else cyl(g,.62,.62,c[2],PAL.honey,c[0],c[2]/2+.2,c[1],6);
  });
  sph(g,1.0,PAL.honey,2.8,1.0,-2.8);
  gbox(g,.5,.4,.15,PAL.glowWarm,2.8,.55,-1.85,0,1.1);
  const fl=[[-4,2.8,PAL.coral],[-3.2,3.6,PAL.pink],[-4.4,4.0,PAL.neonPurple],[0.4,4.3,PAL.coral],[4.5,-.5,PAL.pink]];
  fl.forEach(f=>{cyl(g,.05,.05,.7,PAL.grassDeep,f[0],.55,f[1],5); sph(g,.28,f[2],f[0],1.0,f[1]);});
  [[-1.2,2.6,1.4],[.6,1.8,3.4],[1.8,3.1,.6],[-3.7,1.5,1.2],[3.6,2.2,2.9]].forEach(f=>
    gsphere(g,.08,PAL.firefly,f[0],f[1],f[2],1.6));
  sph(g,.26,PAL.sun,2.3,1.75,-2.5); box(g,.45,.04,.35,PAL.sky,2.3,1.95,-2.5);
  tree(g,-.6,-3.9,1.1);
  plight(g,0xffd9a0,-2.9,1.2,-1.2,1.0,8);
  return g;
}

/* ============ 5. SENSORY ROOM & STORY FACTORY ============ */
function createSensoryStory(){
  const g = tile(PAL.sand);
  g.name = 'sensory-story-factory';
  box(g,4.6,2.6,3.4,PAL.tealDeep,-2.5,1.35,-1.4);
  roofBlock(g,4.8,3.6,PAL.slateDark,-2.5,3.0,-1.4);
  box(g,3.0,.5,2.0,PAL.brown,-2.5,.45,1.2);
  box(g,3.2,1.9,.2,PAL.red,-2.5,1.6,.28);
  gbox(g,2.6,.25,.1,PAL.glowWarm,-2.5,.75,1.25,0,.8);
  cone(g,.3,.5,PAL.sun,-3.5,2.0,.4,5); cone(g,.3,.5,PAL.sun,-1.5,2.0,.4,5);
  box(g,.9,1.2,.08,PAL.white,-4.6,1.1,1.0,.4);
  box(g,.9,1.2,.08,PAL.white,-4.9,1.1,-.3,.4);
  lanterns(g,-4.4,2.2,-.6,2.2,2.4,5);
  box(g,1.6,1.3,1.6,PAL.cream,.4,.7,-1.4);
  gbox(g,.5,.7,.08,PAL.glowWarm,.4,.65,-.58,0,.7);
  box(g,3.6,2.4,3.4,PAL.sensory,3.0,1.25,-1.4);
  box(g,3.8,.4,3.6,PAL.sensoryRoof,3.0,2.6,-1.4);
  gbox(g,3.85,.1,.1,PAL.neonPink,3.0,2.42,.42,0,1.2);
  gbox(g,.1,2.3,.1,PAL.neonCyan,4.86,1.25,.32,0,1.6);
  sph(g,.34,0x9fe8ff,2.2,1.1,.6,true);
  sph(g,.28,0xffb3e2,3.2,.9,1.0,true);
  sph(g,.3,0xc7ff9e,4.1,1.2,.5,true);
  box(g,1.0,1.0,.6,PAL.slate,4.4,.5,-3.4);
  box(g,.8,.8,.6,PAL.navy,3.4,.4,-3.5);
  plight(g,0xff9ad0,3.0,1.6,.4,1.0,8);
  return g;
}

/* ============ 6. SAVING LIVES (Life Flight) ============ */
function createSavingLives(){
  const g = tile(PAL.asphalt);
  g.name = 'saving-lives';
  cyl(g,2.3,2.3,.2,PAL.slate,2.9,.3,2.7,10);
  box(g,.9,.06,.25,PAL.white,2.9,.42,2.7); box(g,.25,.06,.9,PAL.white,2.9,.42,2.7);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;
    gsphere(g,.09,PAL.neonCyan,2.9+Math.cos(a)*2.05,.44,2.7+Math.sin(a)*2.05,2.2);}
  const heli = new THREE.Group();
  sph(heli,.8,PAL.red,0,1.0,0).scale.set(1.5,.9,.9);
  box(heli,1.8,.28,.22,PAL.red,-1.6,1.25,0);
  box(heli,.2,.7,.1,PAL.red,-2.5,1.5,0);
  box(heli,.14,.6,.14,PAL.slateDark,0,1.7,0);
  box(heli,3.4,.07,.3,PAL.slateDark,0,2.0,0,.6);
  box(heli,3.4,.07,.3,PAL.slateDark,0,2.0,0,-.9);
  box(heli,1.9,.1,.15,PAL.slateDark,0,.35,.55); box(heli,1.9,.1,.15,PAL.slateDark,0,.35,-.55);
  gbox(heli,.6,.4,.05,PAL.glowWarm,.75,1.05,0,0,.6);
  sph(heli,.07,PAL.red,-2.5,1.95,0,true);
  heli.position.set(2.9,.35,2.7); g.add(heli);
  box(g,4.2,2.6,3.0,PAL.cream,-2.9,1.35,-2.4);
  box(g,4.4,.4,3.2,PAL.navy,-2.9,2.85,-2.4);
  gbox(g,.9,.25,.25,PAL.red,-2.9,2.2,-.86,0,1.4); gbox(g,.25,.25,.9,PAL.red,-2.9,2.2,-.86,0,1.4);
  gbox(g,1.2,1.4,.1,PAL.glowWarm,-2.9,.95,-.87,0,.95);
  box(g,1.4,.7,.8,PAL.white,-4.6,.4,-.4);
  box(g,.5,.5,.7,PAL.red,-4.15,.95,-.4);
  gbox(g,.08,.1,.4,PAL.neonCyan,-5.32,.4,-.4,0,1.2);
  box(g,3.4,1.7,2.6,PAL.slate,2.7,.9,-2.8);
  roofBlock(g,3.6,3.0,PAL.gray,2.7,2.0,-2.8);
  gbox(g,2.2,1.2,.15,PAL.glowWarm,2.7,.75,-1.47,0,.5);
  plight(g,PAL.glowWarm,-2.9,1.4,-.4,1.2,9);
  return g;
}

/* ============ 7. UTAH JAZZ COURT ============ */
function createJazzCourt(){
  const g = tile(PAL.courtTile);
  g.name = 'utah-jazz-court';
  box(g,8.4,.18,5.6,PAL.courtWood,0,.28,0);
  box(g,8.4,.05,.3,PAL.white,0,.4,2.8); box(g,8.4,.05,.3,PAL.white,0,.4,-2.8);
  box(g,.3,.05,5.6,PAL.white,4.2,.4,0); box(g,.3,.05,5.6,PAL.white,-4.2,.4,0);
  box(g,.15,.05,5.6,PAL.white,0,.4,0);
  gcyl(g,.9,.9,.06,PAL.sun,0,.4,0,12,.35);
  box(g,1.6,.05,2.0,PAL.honey,3.3,.4,0); box(g,1.6,.05,2.0,PAL.honey,-3.3,.4,0);
  [[4.9,1],[-4.9,-1]].forEach(h=>{
    const s=h[1];
    cyl(g,.12,.12,2.6,PAL.slate,h[0],1.3,0,6);
    box(g,.1,1.0,1.4,PAL.white,h[0]-.15*s,2.6,0);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.34,.06,5,10),glowMat(PAL.coral,.6));
    ring.rotation.x=Math.PI/2; add(g,ring,h[0]-.55*s,2.35,0);
  });
  sph(g,.3,PAL.basketball,1.2,.55,1.0);
  box(g,2.4,.5,.7,PAL.teal,0,.55,-3.6);
  cyl(g,.1,.1,1.0,PAL.slateDark,0,.5,3.7,5);
  gbox(g,.9,.6,.08,PAL.sun,0,1.2,3.7,0,1.1);
  [[-4.2,-3.9],[4.2,3.9]].forEach(p=>{
    cyl(g,.09,.11,3.2,PAL.slateDark,p[0],1.6,p[1],6);
    gbox(g,.6,.3,.25,PAL.glowWarm,p[0],3.3,p[1],0,1.4);
  });
  plight(g,0xfff0d0,0,3.4,0,1.2,11);
  return g;
}

/* ============ 8. ART LAB ============ */
function createArtLab(){
  const g = tile(PAL.sand);
  g.name = 'art-lab';
  box(g,4.6,2.5,3.6,PAL.slate,-1.2,1.3,-1.0);
  const sk=gbox(g,2.4,.12,2.0,PAL.glowWarm,-1.9,2.85,-1.0,0,.9);
  sk.rotation.z=.3;
  roofBlock(g,2.0,3.6,PAL.coral,1.0,2.9,-1.0);
  gbox(g,1.0,1.3,.1,PAL.glowWarm,-1.2,.95,.82,0,.85);
  gbox(g,1.4,.2,.1,PAL.neonPurple,-1.2,2.1,.84,0,1.1);
  lanterns(g,-3.4,1.6,1.2,1.6,2.2,5);
  cyl(g,1.3,1.3,.18,PAL.brown,3.4,.35,2.6,10);
  [[PAL.neonPink,.6,.4],[PAL.sun,-.2,.7],[PAL.neonCyan,-.7,-.1],[PAL.neonPurple,.3,-.6]].forEach(p=>
    gcyl(g,.22,.22,.1,p[0],3.4+p[1],.5,2.6+p[2],8,.8));
  const e1=box(g,.1,2.0,.1,PAL.brown,-3.6,1.0,2.4); e1.rotation.x=.18;
  const e2=box(g,.1,2.0,.1,PAL.brown,-3.0,1.0,2.4); e2.rotation.x=.18;
  const cv=box(g,1.3,1.0,.08,PAL.white,-3.3,1.35,2.55); cv.rotation.x=.18;
  const pb=gbox(g,.5,.4,.08,PAL.sun,-3.45,1.45,2.6,0,.5); pb.rotation.x=.18;
  cyl(g,.3,.3,.5,PAL.teal,-4.3,.5,.6,8); cyl(g,.3,.3,.5,PAL.coral,-4.4,.5,1.4,8);
  cyl(g,.26,.26,.4,PAL.purple,1.6,.45,3.4,8);
  tree(g,4.3,-3.6,1);
  plight(g,PAL.glowWarm,-1.2,1.6,1.4,1.1,8);
  return g;
}

/* ============ 9. STEAM LAB ============ */
function createSteamLab(){
  const g = tile(PAL.sand);
  g.name = 'steam-lab';
  box(g,4.4,2.5,3.4,PAL.navy,-1.4,1.3,-1.2);
  box(g,4.6,.4,3.6,PAL.slateDark,-1.4,2.75,-1.2);
  box(g,1.0,1.3,.1,PAL.slateDark,-1.4,.95,.52);
  gbox(g,1.2,.9,.1,PAL.glowWarm,-2.7,1.5,.52,0,.9);
  gbox(g,1.2,.9,.1,PAL.glowWarm,-.1,1.5,.52,0,.9);
  gcyl(g,.9,.9,.3,PAL.sun,-1.4,3.4,-1.2,8,.35);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;
    box(g,.3,.3,.3,PAL.honey,-1.4+Math.cos(a)*1.0,3.4,-1.2+Math.sin(a)*1.0);}
  cyl(g,.25,.25,.35,PAL.slateDark,-1.4,3.4,-1.2,8);
  cyl(g,.5,.5,1.8,PAL.white,3.2,1.3,-2.6,9);
  cone(g,.5,.9,PAL.coral,3.2,2.65,-2.6,9);
  gbox(g,.28,.28,.06,PAL.neonCyan,3.2,1.55,-2.08,0,1.6);
  [[.55,0],[-.55,0],[0,.55],[0,-.55]].forEach(f=>
    box(g,.15,.7,.5,PAL.coral,3.2+f[0],.55,-2.6+f[1]));
  gcone(g,.3,.6,PAL.sun,3.2,.14,-2.6,7,1.7).rotation.x=Math.PI;
  gcyl(g,.35,.28,.7,PAL.beaker,2.6,.6,1.8,8,.8);
  gsphere(g,.08,PAL.neonCyan,2.5,1.15,1.8,1.4);
  gsphere(g,.06,PAL.neonCyan,2.72,1.35,1.75,1.4);
  box(g,.5,.5,.5,PAL.coral,3.6,.5,2.6); box(g,.5,.5,.5,PAL.teal,4.2,.5,2.1);
  box(g,.5,.5,.5,PAL.sun,3.9,1.0,2.35);
  plight(g,0xffc26a,3.2,.6,-2.6,1.3,8);
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
