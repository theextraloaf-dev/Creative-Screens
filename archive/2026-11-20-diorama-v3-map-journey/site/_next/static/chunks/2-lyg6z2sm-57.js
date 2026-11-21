(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,78805,e=>{"use strict";e.s(["f",0,function(e,t=28,o=200){e.sort((e,t)=>e.y-t.y);for(let i=1;i<e.length;i++)for(let a=0;a<i;a++)Math.abs(e[i].x-e[a].x)<o&&Math.abs(e[i].y-e[a].y)<t&&(e[i].y=e[a].y+t)}])},36664,e=>{"use strict";var t=e.i(12688);e.s(["n",0,function(e,t,o,i){let a=(e,t)=>e<t?1048576*e+t:1048576*t+e,n=[],r=new Map;for(let o=0;o<t.length;o+=3){let l=3*t[o],s=3*t[o+1],u=3*t[o+2],f=e[s]-e[l],v=e[s+1]-e[l+1],c=e[s+2]-e[l+2],m=e[u]-e[l],d=e[u+1]-e[l+1],p=e[u+2]-e[l+2],h=v*p-c*d,w=c*m-f*p,g=f*d-v*m,x=Math.hypot(h,w,g)||1;h/=x,w/=x,g/=x,i&&h*((e[l]+e[s]+e[u])/3-i[0])+w*((e[l+1]+e[s+1]+e[u+1])/3-i[1])+g*((e[l+2]+e[s+2]+e[u+2])/3-i[2])<0&&(h=-h,w=-w,g=-g);let y=o/3;for(let[e,i]of(n.push([h,w,g]),[[t[o],t[o+1]],[t[o+1],t[o+2]],[t[o+2],t[o]]])){let t=a(e,i),o=r.get(t);o?o.push(y):r.set(t,[y])}}let l=new Float32Array(o.length/2*6);for(let e=0;e<o.length;e+=2){let t=r.get(a(o[e],o[e+1]));t&&!(t.length<2)&&(l.set(n[t[0]],e/2*6),l.set(n[t[1]],e/2*6+3))}return l},"b",0,function(e,o,i){let a=o.length/2,n=new Float32Array(12*a),r=new Float32Array(12*a),l=new Float32Array(4*a),s=new Float32Array(4*a),u=new Float32Array(12*a),f=new Float32Array(12*a),v=new Uint32Array(6*a),c=i&&i.length>=6*a;for(let t=0;t<a;t++){let a=3*o[2*t],m=3*o[2*t+1];for(let o=0;o<4;o++){let v=4*t+o;n[3*v]=e[a],n[3*v+1]=e[a+1],n[3*v+2]=e[a+2],r[3*v]=e[m],r[3*v+1]=e[m+1],r[3*v+2]=e[m+2],l[v]=1&o?1:-1,s[v]=o>>1,c&&(u[3*v]=i[6*t],u[3*v+1]=i[6*t+1],u[3*v+2]=i[6*t+2],f[3*v]=i[6*t+3],f[3*v+1]=i[6*t+4],f[3*v+2]=i[6*t+5])}let d=4*t;v.set([d,d+1,d+2,d+1,d+3,d+2],6*t)}return(0,t.U)({position:[n,3],other:[r,3],side:[l,1],endf:[s,1],n1:[u,3],n2:[f,3]},v)}])},61460,e=>{"use strict";var t=e.i(90072),o=e.i(9207),i=e.i(12688),a=e.i(55031),n=e.i(36664),r=e.i(78805);let l=[.929,.929,.929],s=[.929,.929,.929],u=[.929,.929,.929],f=[.929,.929,.929],v=[.075,.114,.153],c=[.733,.831,.251],m={hood:[.7,0,.8],windshield:[.2,0,1.05],roof:[0,0,1.35],rear_glass:[-.4,0,.8],trunk:[-.55,0,.95],bumper_front:[1.25,0,0],bumper_rear:[-1.25,0,0],door_front_near:[0,-1.15,.05],door_rear_near:[0,-1.15,.05],side_glass_near:[0,-1,.65],door_front_far:[0,1.15,.05],door_rear_far:[0,1.15,.05],side_glass_far:[0,1,.65],wheel_front_near:[.25,-1,0],wheel_rear_near:[-.25,-1,0],wheel_front_far:[.25,1,0],wheel_rear_far:[-.25,1,0]},d=["film_backing","film_adhesive","film_vinyl","film_laminate"],p={film_backing:[.86,.83,.77],film_adhesive:[.92,.9,.78],film_vinyl:[.97,.97,.97],film_laminate:[.9,.93,.96]},h={film_backing:v,film_adhesive:v,film_vinyl:v,film_laminate:v},w={hood:{part:"hood",at:[1.5,0,.9],win:[14,30]},roof:{part:"roof",at:[-.3,0,1.46],win:[16,30]},door:{part:"door_front_near",at:[.45,-.93,.5],win:[19,30]},wheel:{part:"wheel_front_near",at:[1.35,-.95,.33],win:[20,30]},bumper:{part:"bumper_front",at:[2.28,0,.46],win:[21,30]},backing:{part:"film_backing",at:[.18,-.93,.47],win:[41,76]},adhesive:{part:"film_adhesive",at:[.42,-.93,.56],win:[43,76]},vinyl:{part:"film_vinyl",at:[.66,-.93,.68],win:[45,62]},laminate:{part:"film_laminate",at:[.84,-.93,.8],win:[47,80]},applied:{part:"film_art",at:[.45,-.93,.65],win:[92,101]}};async function g({stage:e,gsap:x,ScrollTrigger:y,onSlow:_}){let b,M=e.querySelector(".stage__art"),A=e.querySelector("[data-callouts]"),z=e.querySelector("[data-proof]");if(!M)throw Error("no holder");let W=await fetch("/models/car.json");if(!W.ok)throw Error("model");let F=await W.json(),P=document.createElement("canvas");P.className="stage__canvas",P.setAttribute("aria-hidden","true"),M.appendChild(P);let k=Math.min(window.devicePixelRatio||1,window.innerWidth<700?1.5:2);try{b=(0,i.E)(P,k)}catch(e){throw P.remove(),e}let E=new t.zm(28,1,.5,60);E.up.set(0,0,1);let U=new t.P6,j={uFog:{value:l},uFogRange:{value:[7,22]}},C={value:[1,1]},R={};for(let[e,r]of Object.entries(F.parts)){let l,m,d=new Float32Array(r.p.length);for(let e=0;e<d.length;e++)d[e]=r.p[e]/1e3;let w=e.startsWith("film_"),g="film_art"===e,x=/glass|windshield/.test(e),y=e.startsWith("wheel"),_=new t.C9;U.add(_);let b=[r.o[0]/1e3,r.o[1]/1e3,r.o[2]/1e3],M={uColor:{value:g?c:w?p[e]:x?u:y?f:s},uAlpha:{value:1},uSweep:{value:-1},uXr:{value:[.14,.76,(0,o.i)()]},uYon:{value:0},uYmin:{value:0},...j},A=(0,i.Z)({vertex:a._,fragment:a.i,uniforms:M,blended:!0}),z=(0,i.U)({position:[d,3]},new Uint16Array(r.t)),W=new t.kE(z,A);_.add(W),W.frustumCulled=!1;let F=null;if(g){let e=d.length/3-1;F=new Float32Array(e+1);for(let t=0;t<e;t++)F[t]=t/e}let P={uColor:{value:w?h[e]:v},uAlpha:{value:1},uDraw:{value:2},...j};F?(m=(0,i.Z)({vertex:(0,a.B)(!0),fragment:a.E,uniforms:P,blended:!0,depthWrite:!1}),l=new t.a1((0,i.U)({position:[d,3],along:[F,1]},new Uint16Array(r.l)),m)):(Object.assign(P,{uRes:C,uWidth:{value:1.15*k}}),m=(0,i.Z)({vertex:a.C,fragment:a.E,uniforms:P,blended:!0,depthWrite:!1}),l=new t.kE((0,n.b)(d,r.l,(0,n.n)(d,r.t,r.l,e.startsWith("wheel")?[0,0,0]:[-b[0],-b[1],.6-b[2]])),m)),_.add(l),l.frustumCulled=!1,l.renderOrder=5;let E={x:0,y:0,z:0,a:+!w,la:+!w};R[e]={node:_,base:b,s:E,fillProg:A,lineProg:m,fillU:M,lineU:P,isFilm:w,isArt:g}}let Y=(()=>{let e=[],o=[],n=[];for(let t of[-.03,.03])for(let o of[-.14,.14])for(let i of[-.25,.25])e.push(t,o,i);[[0,1,3,2],[4,5,7,6],[0,1,5,4],[2,3,7,6],[0,2,6,4],[1,3,7,5]].forEach(([e,t,i,a])=>{o.push(e,t,i,e,i,a),n.push(e,t,t,i,i,a,a,e)});let r=new Float32Array(e),l=new t.C9;U.add(l);let s={uColor:{value:c},uAlpha:{value:1},uSweep:{value:-1},uXr:{value:[0,1,1]},uYon:{value:0},uYmin:{value:0},...j},u={uColor:{value:v},uAlpha:{value:1},uDraw:{value:2},...j},f=(0,i.Z)({vertex:a._,fragment:a.i,uniforms:s,blended:!0}),m=(0,i.Z)({vertex:(0,a.B)(!1),fragment:a.E,uniforms:u,blended:!0,depthWrite:!1});return l.add(new t.kE((0,i.U)({position:[r,3]},new Uint16Array(o)),f)),l.add(new t.a1((0,i.U)({position:[r,3]},new Uint16Array(n)),m)),{node:l,s:{x:.04,a:0},fu:s,lu:u}})();(()=>{let e=[],o=[],n=0;for(let t=-14;t<=14;t+=1)e.push(t,-14,0,t,14,0,-14,t,0,14,t,0),o.push(n,n+1,n+2,n+3),n+=4;let r=new t.C9;U.add(r),r.position.z=0;let l={uColor:{value:v},uAlpha:{value:.12},uDraw:{value:2},...j},s=(0,i.Z)({vertex:(0,a.B)(!1),fragment:a.E,uniforms:l,blended:!0,depthWrite:!1});r.add(new t.a1((0,i.U)({position:[new Float32Array(e),3]},new Uint16Array(o)),s))})();let O=R.film_art,S={v:0};O.lineU.uDraw.value=0;let V={};A?.querySelectorAll("[data-co]").forEach(e=>{V[e.dataset.co]={el:e,on:!1}});let X={az:.62,el:.2,dist:7,tx:0,ty:0,tz:.72},D={x:0,y:0,sx:0,sy:0},K=1,T=1,q=1;function B(){let e=M.getBoundingClientRect();K=Math.max(1,e.width),T=Math.max(1,e.height),q=K/T,b.setSize(K,T),E.aspect=q,E.updateProjectionMatrix(),C.value=[K*k,T*k]}let L=new ResizeObserver(B);L.observe(M),B();let Z=e=>{D.x=(e.clientX/innerWidth-.5)*2,D.y=(e.clientY/innerHeight-.5)*2};matchMedia("(pointer: fine)").matches&&window.addEventListener("pointermove",Z,{passive:!0});let I=(0,o.i)(),$=x.timeline({defaults:{ease:"none"}}),H=e=>R[e].s,N=(e,t,o,i,a="power2.inOut")=>$.to(e,{...t,duration:o,ease:a},i);N(X,{az:.5,el:.28,dist:8.6},22,6),N(X,{az:.66,el:.16,dist:4.4,tx:.45,ty:-.9,tz:.66},12,28),N(X,{az:.56,el:.14,dist:5},40,40,"none"),N(X,{az:.34,el:.14,dist:6.6,tx:0,ty:0,tz:.72},14,84),Object.entries(m).forEach(([e,[t,o,i]],a)=>N(H(e),{x:t,y:o,z:i},18,7+.35*a)),Object.keys(m).forEach((e,t)=>N(H(e),{x:0,y:0,z:0},8,28+.1*t)),Object.keys(R).filter(e=>!R[e].isFilm&&"door_front_near"!==e).forEach(e=>N(H(e),{a:.08,la:.9},5,34,"power1.out"));let G={film_backing:.4,film_adhesive:.32,film_vinyl:.6,film_laminate:.16};d.forEach(e=>N(H(e),{a:G[e],la:1},5,36)),N(H("film_art"),{a:1,la:1},4,42),Object.entries({film_backing:0,film_adhesive:-.24,film_vinyl:-.48,film_laminate:-.72,film_art:-.485}).forEach(([e,t])=>N(H(e),{y:t},12,38)),N(S,{v:1},14,44,"power1.inOut"),$.fromTo(O.lineU.uDraw,{value:0},{value:1,duration:12,ease:"power1.inOut"},52),N(H("film_vinyl"),{y:-1.5,z:.7,a:0,la:0},12,62,"power2.in"),N(H("film_backing"),{z:.5,a:0,la:0},6,72,"power2.in"),N(H("film_adhesive"),{z:.5,a:0,la:0},6,74,"power2.in"),N(H("film_art"),{y:0},12,74),N(H("film_laminate"),{y:0,a:0,la:0},12,76),$.set(Y.s,{a:1},80),$.fromTo(Y.s,{x:I>0?.04:.86},{x:I>0?.86:.04,duration:11,ease:"power1.inOut"},80),N(Y.s,{a:0},1.5,91),Object.keys(R).filter(e=>!R[e].isFilm&&"door_front_near"!==e).forEach(e=>N(H(e),{a:1,la:1},8,88)),z&&(x.set(z,{opacity:0,y:14}),$.to(z,{opacity:1,y:0,duration:6,ease:"power2.out"},94)),$.set({},{},100);let J=y.create({trigger:e,start:"top top",end:"bottom bottom",scrub:.5,animation:$,onUpdate:t=>{let o=t.progress;e.dataset.step=o<.28?"0":o<.5?"1":o<.74?"2":"3"}});e.dataset.step="0";let Q=new t.cE,ee=new t.cE,et=!1,eo=0,ei=0,ea=performance.now(),en=!1;function er(){let e=performance.now(),t=e-ea;if(ea=e,++eo>40&&t>45?ei++:t<30&&(ei=Math.max(0,ei-1)),ei>40&&!en)return void _?.();D.sx+=(D.x-D.sx)*.06,D.sy+=(D.y-D.sy)*.06;let o=X.az+.07*D.sx*I,i=X.el-.04*D.sy,a=q<1.5?1.5/q:1,n=X.dist*Math.min(a,1.9);for(let[e,t]of(E.position.set(X.tx+n*Math.sin(o)*Math.cos(i),X.ty-n*Math.cos(o)*Math.cos(i),X.tz+n*Math.sin(i)),ee.set(X.tx,X.ty,X.tz),E.lookAt(ee),E.updateMatrixWorld(),Object.entries(R))){t.node.position.set(t.base[0]+t.s.x,t.base[1]+t.s.y,t.base[2]+t.s.z);let e=t.s.a>.98;t.fillU.uAlpha.value=t.s.a,t.fillProg.transparent=!e,t.fillProg.depthWrite=e,t.lineU.uAlpha.value=t.s.la,t.node.visible=t.s.a>.005||t.s.la>.005}O.fillU.uSweep.value=S.v,O.fillU.uXr.value=[.16,.74,I],Y.node.position.set(Y.s.x,-.93,.65),Y.fu.uAlpha.value=Y.s.a,Y.lu.uAlpha.value=Y.s.a,Y.node.visible=Y.s.a>.01,b.render(U,E);let l=(J.progress??0)*100,s=[];for(let[e,t]of Object.entries(w)){let o=V[e];if(!o)continue;let i=R[t.part],a=l>=t.win[0]&&l<=t.win[1]&&i.node.visible;a!==o.on&&(o.on=a,o.el.classList.toggle("is-on",a)),a&&(Q.set(t.at[0]+i.s.x,t.at[1]+i.s.y,t.at[2]+i.s.z),Q.project(E),s.push({o,x:Math.min(Math.max((.5*Q.x+.5)*K,14),K-14),y:Math.min(Math.max((1-(.5*Q.y+.5))*T,12),T-12)}))}for(let{o:e,x:t,y:o}of((0,r.f)(s,26,190),s))e.el.style.transform=`translate(${t.toFixed(1)}px, ${o.toFixed(1)}px)`,e.el.classList.toggle("is-flip",t>.6*K)}let el=()=>er(),es=new IntersectionObserver(([e])=>{e.isIntersecting&&!et?(et=!0,ea=performance.now(),eo=0,x.ticker.add(el)):!e.isIntersecting&&et&&(et=!1,x.ticker.remove(el))},{rootMargin:"150px"});return es.observe(e),er(),e.dataset.mode="3d",{destroy(){en=!0,x.ticker.remove(el),es.disconnect(),L.disconnect(),window.removeEventListener("pointermove",Z),J.kill(),$.kill(),P.remove(),A?.querySelectorAll("[data-co]").forEach(e=>e.classList.remove("is-on")),e.dataset.mode="2d",b.dispose(),b.forceContextLoss()}}}e.s(["initStage3D",0,g])},12688,55031,e=>{"use strict";var t=e.i(90072),o=e.i(8560);e.s(["U",0,function(e,o){let i=new t.ld;for(let[o,[a,n]]of Object.entries(e))i.setAttribute(o,new t.f5(a,n));return o&&i.setIndex(new t.f5(o,1)),i},"E",0,function(e,t){let i=new o.T({canvas:e,alpha:!0,antialias:!0,depth:!0,premultipliedAlpha:!1});return i.setPixelRatio(t),i.setClearColor(0,0),i},"Z",0,function({vertex:e,fragment:o,uniforms:i,blended:a=!1,depthWrite:n=!0}){return new t.or({glslVersion:t.n,vertexShader:e.replace(/^#version 300 es\s*/,""),fragmentShader:o.replace(/^#version 300 es\s*/,""),uniforms:i,side:t.Vs,transparent:a,depthWrite:n,...a?{blending:t.UM,blendEquation:t.qR,blendSrc:t.tx,blendDst:t.oL}:{blending:t.A1}})}],12688);let i=`#version 300 es
in vec3 position;
uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform mat4 modelMatrix;
out vec3 vPos; out float vWX; out float vWY; out vec3 vW;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPos = mv.xyz; vWX = w.x; vWY = w.y; vW = w.xyz;
  gl_Position = projectionMatrix * mv;
}`,a=`#version 300 es
precision highp float;
in vec3 vPos; in float vWX; in float vWY; in vec3 vW;
uniform float uYon; uniform float uYmin;
uniform vec3 uColor; uniform float uAlpha; uniform vec3 uFog; uniform vec2 uFogRange;
uniform float uSweep; uniform vec3 uXr;
out vec4 o;
void main(){
  if (uYon > 0.5 && vWY < uYmin) discard;
  if (uSweep >= 0.0) { float t = (vWX - uXr.x) / (uXr.y - uXr.x); if (uXr.z < 0.0) t = 1.0 - t; if (t > uSweep) discard; }
  vec3 n = abs(normalize(cross(dFdx(vW), dFdy(vW))));
  float l = 1.0;   // flat: solids only hide the lines behind them (line-only look)
  vec3 c = uColor * l;
  c = mix(c, uFog, smoothstep(uFogRange.x, uFogRange.y, -vPos.z) * 0.55);
  o = vec4(c, uAlpha);
}`,n=`#version 300 es
precision highp float;
in vec3 vPos; in float vAlong; in float vK;
uniform vec3 uColor; uniform float uAlpha; uniform vec3 uFog; uniform vec2 uFogRange; uniform float uDraw;
out vec4 o;
void main(){
  if (vAlong > uDraw) discard;
  float f = smoothstep(uFogRange.x, uFogRange.y, -vPos.z);
  float a = uAlpha * (vK < 0.7 ? 0.75 : 1.0);     // interior creases are lighter as well as thinner
  o = vec4(mix(uColor, uFog, f * 0.7), a * (1.0 - f * 0.5));
}`,r=`#version 300 es
in vec3 position; in vec3 other; in float side; in float endf; in vec3 n1; in vec3 n2;
uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform vec2 uRes; uniform float uWidth;
out vec3 vPos; out float vAlong; out float vK;
void main(){
  vec4 m0 = modelViewMatrix * vec4(position, 1.0); vec4 m1 = modelViewMatrix * vec4(other, 1.0);
  vec4 c0 = projectionMatrix * m0; vec4 c1 = projectionMatrix * m1;
  float nearW = 0.05;
  vAlong = 0.0; vPos = vec3(0.0); vK = 0.0;
  if (c0.w < nearW && c1.w < nearW) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  // line hierarchy: contour (heavy), interior crease (light), hidden back edge (not drawn), steady (no normals)
  float k = 0.75;
  if (dot(n1, n1) > 0.25 && dot(n2, n2) > 0.25) {
    vec3 vd = -normalize(0.5 * (m0.xyz + m1.xyz));
    float fa = dot(normalize(mat3(modelViewMatrix) * n1), vd);
    float fb = dot(normalize(mat3(modelViewMatrix) * n2), vd);
    if (fa * fb < 0.0) k = 1.0;
    else if (fa > 0.0) k = 0.5;
    else { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  }
  vK = k;
  if (c0.w < nearW) { float t = (nearW - c0.w) / (c1.w - c0.w); c0 = mix(c0, c1, t); m0 = mix(m0, m1, t); }
  if (c1.w < nearW) { float t = (nearW - c1.w) / (c0.w - c1.w); c1 = mix(c1, c0, t); m1 = mix(m1, m0, t); }
  vec2 s0 = c0.xy / c0.w * uRes * 0.5; vec2 s1 = c1.xy / c1.w * uRes * 0.5;
  vec2 d = s1 - s0; float len = length(d);
  vec2 dir = len > 0.0001 ? d / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  bool first = endf < 0.5;
  vec4 c = first ? c0 : c1; vec2 sc = first ? s0 : s1;
  float w = uWidth * k;
  sc += nrm * side * w * 0.5 + dir * (first ? -1.0 : 1.0) * w * 0.5;
  gl_Position = vec4(sc / (uRes * 0.5) * c.w, c.z, c.w);
  gl_Position.z -= 0.0014 * c.w;
  vPos = (first ? m0 : m1).xyz;
}`,l=`#version 300 es
in vec3 position; in vec2 uv;
uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform mat4 modelMatrix;
out vec3 vPos; out vec2 vUv; out float vWY;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPos = mv.xyz; vUv = uv; vWY = w.y;
  gl_Position = projectionMatrix * mv;
}`,s=`#version 300 es
precision highp float;
in vec3 vPos; in vec2 vUv; in float vWY;
uniform sampler2D uTex; uniform float uYon; uniform float uYmin;
uniform vec3 uFog; uniform vec2 uFogRange;
out vec4 o;
void main(){
  if (uYon > 0.5 && vWY < uYmin) discard;
  vec3 c = texture(uTex, vUv).rgb;
  c = mix(c, uFog, smoothstep(uFogRange.x, uFogRange.y, -vPos.z) * 0.55);
  o = vec4(c, 1.0);
}`;e.s(["i",0,a,"_",0,i,"E",0,n,"d",0,s,"A",0,l,"C",0,r,"B",0,e=>`#version 300 es
in vec3 position; ${e?"in float along;":""}
uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
out vec3 vPos; out float vAlong; out float vK;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPos = mv.xyz; vAlong = ${e?"along":"0.0"}; vK = 1.0;
  gl_Position = projectionMatrix * mv;
  gl_Position.z -= 0.0014 * gl_Position.w;   /* lines sit slightly in front of their own surface */
}`],55031)}]);