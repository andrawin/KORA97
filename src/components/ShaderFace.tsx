import React, { useEffect, useRef } from 'react';

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  
  uniform vec3      iResolution;
  uniform float     iTime;
  uniform float     iAudioVolume;
  uniform vec4      iMouse;
  uniform float     u_zoomReactivity;
  uniform vec3      u_bgColor;
  uniform vec3      u_skinColor;
  uniform vec3      u_eyeColor;
  uniform float     u_eyeReactivity;
  uniform float     u_characterType;

  float time;
  float matID = 0.0;

  // Polynomial smooth min
  float smin( float a, float b, float k ) {
      float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
      return mix( b, a, h ) - k*h*(1.0-h);
  }
  float smax(float a,float b, float k) {
      return -smin(-a,-b,k);
  }
  mat2 rotmat(float a) {
      return mat2(cos(a),sin(a),-sin(a),cos(a));
  }

  float cylinder(vec3 p, vec3 dir, float h, float r) {
      float t = dot(p, dir);
      vec3 p_ortho = p - dir * t;
      float d = length(p_ortho) - r;
      float d_t = abs(t) - h;
      return length(max(vec2(d, d_t), 0.0)) + min(max(d, d_t), 0.0);
  }

  float robotDist(vec3 p) {
      float d = 1e4;
      float m = 0.0;
      
      // --- JUPITER PLANET (Background) ---
      // Positioned far away in the background
      vec3 jupiterP = p - vec3(-15.0, 8.0, -40.0);
      float jupiter = length(jupiterP) - 12.0;
      if (jupiter < d) {
          d = jupiter;
          m = 5.0; // Jupiter material
      }

      // Slight idle animation + Audio reactive head swing
      float audioSwing = iAudioVolume * 0.25 * sin(time * 12.0);
      float audioNod = iAudioVolume * 0.2 * cos(time * 8.0);
      p.y += sin(time * 2.0) * 0.01;
      p.xy *= rotmat(sin(time * 1.5) * 0.02 + audioSwing);
      p.yz *= rotmat(audioNod);

      vec3 headP = p - vec3(0.0, 1.5, 0.0);

      // --- HELMET (Chrome) ---
      float helmet = length(headP * vec3(1.0, 0.95, 1.0)) - 0.45;
      vec3 cutoutP = headP - vec3(0.0, -0.15, 0.15);
      float faceCut = length(cutoutP * vec3(1.0, 0.9, 1.0)) - 0.4;
      helmet = smax(helmet, -faceCut, 0.02);
      
      // Helmet seam (horizontal line)
      float seam = abs(headP.y - 0.2) - 0.005;
      helmet = smax(helmet, -seam, 0.01);
      
      d = helmet;
      m = 0.0; // Chrome

      // --- FACE (Skin) ---
      float face = length(headP * vec3(1.0, 0.9, 1.05)) - 0.36; // Slightly smaller base
      
      // Nose
      vec3 noseP = headP - vec3(0.0, -0.05, 0.38);
      float nose = length(noseP * vec3(2.5, 1.2, 1.0)) - 0.06; // Narrower, smaller nose
      face = smin(face, nose, 0.05);

      // Jaw / Audio Reactive
      float jawDrop = iAudioVolume * 0.6; // Increased jaw drop
      vec3 jawP = headP - vec3(0.0, -0.22 - jawDrop, 0.32); // Lower jaw center
      float jaw = length(jawP * vec3(1.5, 1.4, 1.0)) - 0.15; // Narrower, more V-shaped jaw
      face = smin(face, jaw, 0.08);

      // Cheeks (Audio reactive puff)
      vec3 cheekP = headP - vec3(0.0, -0.05, 0.32); // Higher cheekbones
      cheekP.x = abs(cheekP.x);
      cheekP -= vec3(0.16, 0.0, 0.0);
      float cheekPuff = iAudioVolume * 0.08;
      float cheeks = length(cheekP * vec3(1.0, 1.2, 1.0)) - (0.13 + cheekPuff); // More pronounced
      face = smin(face, cheeks, 0.08);

      // Mouth Cavity (Audio reactive smile/widen/open)
      float mouthSmile = iAudioVolume * 0.8;
      float mouthOpen = iAudioVolume * 2.5; // Vertical opening factor
      vec3 mouthP = headP - vec3(0.0, -0.18 - jawDrop*0.5, 0.38);
      
      // Decrease the Y multiplier to make the hole taller when talking
      float cavityYScale = max(1.5, 4.0 - mouthOpen); 
      float mouthCavity = length(mouthP * vec3(1.5 - mouthSmile, cavityYScale, 1.0)) - (0.04 + iAudioVolume * 0.03);
      face = smax(face, -mouthCavity, 0.02);

      if (face < d) { d = face; m = 1.0; }

      // --- LIPS ---
      float lipYScale = max(1.5, 3.0 - mouthOpen * 0.8); 
      // Increase Z multiplier (1.8) to flatten the lips against the face so they don't stick out
      float lips = length(mouthP * vec3(1.1 - mouthSmile*0.5, lipYScale, 1.8)) - (0.05 + iAudioVolume * 0.01); 
      lips = smax(lips, -mouthCavity, 0.01);
      if (lips < d) { d = lips; m = 2.0; }

      // --- EYES (Robot - Reverted to tiny ellipse) ---
      float eyeLookX = sin(time * 8.0) * 0.015 * iAudioVolume;
      float eyeLookY = cos(time * 5.0) * 0.01 * iAudioVolume;
      float eyeSquint = iAudioVolume * u_eyeReactivity;
      
      vec3 eyeP = headP - vec3(eyeLookX, 0.1 + eyeLookY, 0.35);
      eyeP.x = abs(eyeP.x);
      eyeP -= vec3(0.15, 0.0, 0.0);
      eyeP.xy *= rotmat(-0.1);
      
      // Simple tiny ellipse
      float eye = (length(eyeP * vec3(1.5, 2.5 + eyeSquint * 2.0, 1.5)) - 0.04) * 0.3;
      if (eye < d) { d = eye; m = 3.0; }

      // --- EARS (Chrome) ---
      vec3 earP = headP - vec3(0.0, -0.05, 0.0);
      earP.x = abs(earP.x);
      earP -= vec3(0.42, 0.0, 0.0);
      float earBase = cylinder(earP.zyx, vec3(0,1,0), 0.05, 0.12);
      float earSpike = cylinder(earP.zyx, vec3(0,1,0), 0.5, 0.01);
      float ears = smin(earBase, earSpike, 0.02);
      if (ears < d) { d = ears; m = 0.0; }

      // --- NECK (Chrome) ---
      vec3 neckP = p - vec3(0.0, 0.7, 0.0);
      float neck = cylinder(neckP, vec3(0,1,0), 0.5, 0.16);
      float grooves = sin(neckP.y * 60.0);
      neck -= grooves * 0.003;
      
      if (neck < d) { 
          d = neck; 
          m = (grooves > 0.5) ? 4.0 : 0.0; 
      }

      // Inner mouth dark
      if (mouthCavity < d + 0.02 && headP.z > 0.2) {
          m = 4.0;
      }

      matID = m;
      return d;
  }

  float demonDist(vec3 p) {
      float d = 1e4;
      float m = 0.0;
      
      // --- JUPITER PLANET (Background) ---
      vec3 jupiterP = p - vec3(-15.0, 8.0, -40.0);
      float jupiter = length(jupiterP) - 12.0;
      if (jupiter < d) { d = jupiter; m = 5.0; }

      // Head animation
      float audioSwing = iAudioVolume * 0.25 * sin(time * 12.0);
      float audioNod = iAudioVolume * 0.2 * cos(time * 8.0);
      p.y += sin(time * 2.0) * 0.01;
      p.xy *= rotmat(sin(time * 1.5) * 0.02 + audioSwing);
      p.yz *= rotmat(audioNod);

      vec3 headP = p - vec3(0.0, 1.5, 0.0);

      // --- FACE (Skin) ---
      float face = length(headP * vec3(1.0, 0.9, 1.05)) - 0.36;
      
      // Cute Anime Eyebrow
      float browDrop = iAudioVolume * 0.02; 
      vec3 browP = headP - vec3(0.0, 0.22 - browDrop, 0.32);
      browP.x = abs(browP.x);
      browP -= vec3(0.15, 0.0, 0.0);
      browP.xy *= rotmat(-0.15);
      float brow = length(browP * vec3(1.5, 8.0, 2.0)) - 0.015;
      browP.y -= browP.x * browP.x * 2.0; 
      brow = length(browP * vec3(1.5, 8.0, 2.0)) - 0.015;
      if (brow < d) { d = brow; m = 4.0; }

      // Nose
      vec3 noseP = headP - vec3(0.0, -0.05, 0.38);
      float nose = length(noseP * vec3(2.5, 1.2, 1.0)) - 0.06;
      face = smin(face, nose, 0.05);

      // Jaw
      float jawDrop = iAudioVolume * 0.6;
      vec3 jawP = headP - vec3(0.0, -0.22 - jawDrop, 0.32);
      float jaw = length(jawP * vec3(1.5, 1.4, 1.0)) - 0.15;
      face = smin(face, jaw, 0.08);

      // Cheeks
      vec3 cheekP = headP - vec3(0.0, -0.05, 0.32);
      cheekP.x = abs(cheekP.x);
      cheekP -= vec3(0.16, 0.0, 0.0);
      float cheekPuff = iAudioVolume * 0.08;
      float cheeks = length(cheekP * vec3(1.0, 1.2, 1.0)) - (0.13 + cheekPuff);
      face = smin(face, cheeks, 0.08);

      // Mouth Cavity
      float mouthSmile = iAudioVolume * 0.8;
      float mouthOpen = iAudioVolume * 2.5;
      vec3 mouthP = headP - vec3(0.0, -0.18 - jawDrop*0.5, 0.38);
      float cavityYScale = max(1.5, 4.0 - mouthOpen); 
      float mouthCavity = length(mouthP * vec3(1.5 - mouthSmile, cavityYScale, 1.0)) - (0.04 + iAudioVolume * 0.03);
      face = smax(face, -mouthCavity, 0.02);

      if (face < d) { d = face; m = 1.0; } // Skin

      // --- LIPS ---
      float lipYScale = max(1.5, 3.0 - mouthOpen * 0.8); 
      float lips = length(mouthP * vec3(1.1 - mouthSmile*0.5, lipYScale, 1.8)) - (0.05 + iAudioVolume * 0.01); 
      lips = smax(lips, -mouthCavity, 0.01);
      if (lips < d) { d = lips; m = 2.0; } // Lips

      // --- ANIME EYES ---
      float eyeLookX = sin(time * 8.0) * 0.015 * iAudioVolume;
      float eyeLookY = cos(time * 5.0) * 0.01 * iAudioVolume;
      float eyeSquint = iAudioVolume * u_eyeReactivity;
      
      vec3 eyeP = headP - vec3(eyeLookX, 0.08 + eyeLookY, 0.35);
      eyeP.x = abs(eyeP.x);
      eyeP -= vec3(0.16, 0.0, 0.0);
      eyeP.xy *= rotmat(-0.1);
      
      float eye = length(eyeP * vec3(1.1, 1.2 + eyeSquint, 1.5)) - 0.08; 
      if (eye < d) { d = eye; m = 3.0; } // Anime Eye material
      
      // Eyeliner / Lashes
      vec3 lashP = eyeP - vec3(0.0, 0.015, 0.0);
      float eyeliner = length(lashP * vec3(1.15, 1.4 + eyeSquint, 1.0)) - 0.085;
      eyeliner = smax(eyeliner, -eye, 0.005);
      eyeliner = smax(eyeliner, -(eyeP.y + 0.01), 0.01);
      eyeliner = smax(eyeliner, (eyeP.x - 0.05), 0.02);
      
      vec3 flickP = eyeP - vec3(0.07, 0.02, 0.0);
      flickP.xy *= rotmat(0.4);
      float flick = length(flickP * vec3(1.0, 3.0, 1.0)) - 0.015;
      flick = smax(flick, -(eyeP.y - 0.02), 0.01);
      eyeliner = smin(eyeliner, flick, 0.01);

      if (eyeliner < d) { d = eyeliner; m = 4.0; } // Dark

      // --- FUTURISTIC EYEGLASSES ---
      vec3 glassP = headP - vec3(0.0, 0.1, 0.38);
      glassP.x = abs(glassP.x);
      glassP -= vec3(0.15, 0.0, 0.0);
      // Frame (Hexagonal/Rectangular)
      float gBox = length(max(abs(glassP * vec3(1.0, 2.5, 1.0)) - vec3(0.08, 0.025, 0.01), 0.0)) - 0.01;
      float gHole = length(max(abs(glassP * vec3(1.0, 2.5, 1.0)) - vec3(0.06, 0.015, 0.02), 0.0)) - 0.01;
      float glasses = smax(gBox, -gHole, 0.01) * 0.5;
      // Bridge
      vec3 bridgeP = headP - vec3(0.0, 0.1, 0.39);
      float bridge = length(max(abs(bridgeP) - vec3(0.05, 0.005, 0.005), 0.0)) - 0.005;
      glasses = smin(glasses, bridge, 0.01);
      
      // Add some glowing tech nodes on the sides
      vec3 nodeP = glassP - vec3(0.1, 0.0, -0.02);
      float nodes = length(nodeP) - 0.02;
      glasses = smin(glasses, nodes, 0.01);

      if (glasses < d) { d = glasses; m = 8.0; }

      // --- POINTY EARS ---
      vec3 earP = headP - vec3(0.0, 0.0, 0.05);
      earP.x = abs(earP.x);
      earP -= vec3(0.35, 0.0, 0.0);
      earP.xy *= rotmat(0.3);
      earP.xz *= rotmat(-0.2);
      float ear = (length(earP * vec3(4.0, 1.5, 2.0)) - 0.15) * 0.25;
      vec3 tipP = earP - vec3(0.0, 0.15, 0.0);
      float tip = (length(tipP * vec3(6.0, 2.0, 3.0)) - 0.05) * 0.16;
      ear = smin(ear, tip, 0.1);
      if (ear < d) { d = ear; m = 1.0; } // Skin

      // --- HORNS ---
      vec3 hornP = headP - vec3(0.0, 0.25, 0.0);
      hornP.x = abs(hornP.x);
      hornP -= vec3(0.25, 0.0, 0.0);
      hornP.xy *= rotmat(-0.5);
      hornP.yz *= rotmat(-0.2);
      
      float horn = 1e4;
      vec3 hp = hornP;
      float r = 0.12;
      for(int i=0; i<6; i++) {
          float segment = length(hp * vec3(1.0, 0.8, 1.0)) - r;
          horn = smin(horn, segment, 0.08);
          hp.y -= 0.12;
          hp.xy *= rotmat(0.25);
          hp.yz *= rotmat(0.1);
          r *= 0.8;
      }
      if (horn < d) { d = horn; m = 6.0; } // Horn material

      // --- HAIR (Blue flowing) ---
      vec3 hairP = headP - vec3(0.0, 0.1, -0.05);
      float hairBase = length(hairP * vec3(0.9, 0.8, 0.95)) - 0.45;
      
      vec3 bangP = headP - vec3(0.0, 0.2, 0.35);
      bangP.x = abs(bangP.x);
      bangP -= vec3(0.1, 0.0, 0.0);
      bangP.xy *= rotmat(0.2);
      float bangs = (length(bangP * vec3(2.0, 1.0, 2.0)) - 0.15) * 0.5;
      
      vec3 tailP = headP - vec3(0.0, -0.1, -0.1);
      tailP.x = abs(tailP.x);
      tailP -= vec3(0.45, 0.0, 0.0);
      vec3 tp = tailP;
      tp.x += sin(tp.y * 8.0) * 0.05;
      tp.z += cos(tp.y * 6.0) * 0.05;
      float tail = (length(tp * vec3(1.5, 0.4, 1.5)) - 0.25) * 0.6;
      tail = smax(tail, tp.y - 0.2, 0.1);
      tail = smax(tail, -(tp.y + 0.8), 0.2);
      
      float hair = smin(hairBase, bangs, 0.1);
      hair = smin(hair, tail, 0.15);
      
      vec3 faceCutP = headP - vec3(0.0, -0.1, 0.1);
      float faceCut = length(faceCutP * vec3(1.0, 0.9, 1.0)) - 0.4;
      hair = smax(hair, -faceCut, 0.05);
      
      if (hair < d) { d = hair; m = 7.0; } // Hair material

      // --- ROCKET HAIRPIN ---
      vec3 rocketP = headP - vec3(0.32, 0.25, 0.15); // Right side of head
      rocketP.xy *= rotmat(-0.8); // Tilt outwards
      rocketP.yz *= rotmat(0.4);
      
      // Rocket body (Capsule)
      float rBody = length(rocketP - vec3(0.0, clamp(rocketP.y, -0.06, 0.06), 0.0)) - 0.025;
      if (rBody < d) { d = rBody; m = 0.0; } // Chrome body
      
      // Rocket tip (Cone-ish)
      vec3 rTipP = rocketP - vec3(0.0, 0.08, 0.0);
      float rTip = length(rTipP * vec3(1.0, 0.5, 1.0)) - 0.025;
      rTip = smax(rTip, -rTipP.y, 0.01); // Cut bottom
      if (rTip < d) { d = rTip; m = 6.0; } // Red/Orange tip
      
      // Rocket fins
      vec3 rFinP = rocketP - vec3(0.0, -0.04, 0.0);
      rFinP.xz *= rotmat(0.785); // 45 degrees
      float fins1 = length(max(abs(rFinP) - vec3(0.04, 0.02, 0.005), 0.0)) - 0.002;
      float fins2 = length(max(abs(rFinP) - vec3(0.005, 0.02, 0.04), 0.0)) - 0.002;
      float fins = smin(fins1, fins2, 0.005);
      if (fins < d) { d = fins; m = 6.0; } // Red/Orange fins

      // --- CYBORG NECK ---
      vec3 neckP = p - vec3(0.0, 0.7, 0.0);
      float neck = cylinder(neckP, vec3(0,1,0), 0.5, 0.12);
      float grooves = sin(neckP.y * 50.0);
      neck -= grooves * 0.004;
      if (neck < d) { 
          d = neck; 
          m = (grooves > 0.5) ? 4.0 : 0.0; // Dark grooves, chrome neck
      }

      // Inner mouth dark
      if (mouthCavity < d + 0.02 && headP.z > 0.2) {
          m = 4.0;
      }

      matID = m;
      return d;
  }

  float f(vec3 p) {
      if (u_characterType > 0.5) {
          return demonDist(p);
      } else {
          return robotDist(p);
      }
  }

  vec3 sceneNorm(vec3 p) {
      vec3 e = vec3(1e-3, 0, 0);
      float d = f(p);
      return normalize(vec3(
          f(p + e.xyy) - d,
          f(p + e.yxy) - d,
          f(p + e.yyx) - d
      ));
  }

  // Fake environment mapping for chrome
  vec3 envMap(vec3 dir) {
      // Studio lighting
      vec3 col = vec3(0.05); // Dark room
      // Softbox 1 (Left)
      float light1 = smoothstep(0.8, 0.95, dot(dir, normalize(vec3(-1.0, 0.5, 1.0))));
      col += vec3(1.0, 0.95, 0.9) * light1;
      // Softbox 2 (Right)
      float light2 = smoothstep(0.85, 0.98, dot(dir, normalize(vec3(1.0, 0.2, 0.5))));
      col += vec3(0.8, 0.9, 1.0) * light2;
      // Top light
      float light3 = smoothstep(0.7, 0.95, dot(dir, normalize(vec3(0.0, 1.0, 0.0))));
      col += vec3(1.0) * light3 * 0.5;
      return col;
  }

  void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec2 uv = (fragCoord / iResolution.xy * 2.0 - 1.0);
      uv.x *= iResolution.x / iResolution.y;
      time = iTime;

      // Camera (Zoomed in on face, with audio reactivity)
      float zoomOffset = iAudioVolume * u_zoomReactivity * 0.5;
      vec3 ro = vec3(0.0, 1.4, 1.1 - zoomOffset);
      
      // Mouse rotation
      if (iMouse.z > 0.0) {
          float mx = (iMouse.x / iResolution.x - 0.5) * 3.14;
          float my = (iMouse.y / iResolution.y - 0.5) * 3.14;
          ro.yz *= rotmat(-my);
          ro.xz *= rotmat(-mx);
      } else {
          // Auto rotate slightly
          ro.xz *= rotmat(sin(time * 0.5) * 0.2);
      }
      
      vec3 ta = vec3(0.0, 1.4, 0.0);
      vec3 cw = normalize(ta - ro);
      vec3 cu = normalize(cross(cw, vec3(0,1,0)));
      vec3 cv = normalize(cross(cu, cw));
      vec3 rd = normalize(uv.x * cu + uv.y * cv + 2.0 * cw);

      // Raymarching
      float t = 0.0, d = 0.0;
      for(int i = 0; i < 150; ++i) {
          vec3 p = ro + rd * t;
          d = f(p);
          if(d < 1e-3 || t > 100.0) break;
          t += d;
      }

      // Background (Solid Black)
      vec3 col = vec3(0.0);
      
      float pc = 0.0;
      vec2 pcUv = uv;
      pcUv.x += time * 0.02;
      
      // Erratic density based on time and audio
      float erratic = sin(time * 10.0) * cos(time * 23.0);
      float activeDensity = 3.0 + erratic * 2.0 + (iAudioVolume * 8.0);
      
      for(int i=1; i<=12; i++) {
          float fi = float(i);
          if (fi > activeDensity) break;
          vec2 puv = pcUv * (10.0 * fi);
          vec2 pid = floor(puv);
          vec2 pgrid = fract(puv) - 0.5;
          float pn = fract(sin(dot(pid, vec2(12.9898, 78.233))) * 43758.5453);
          pgrid += (vec2(fract(pn*34.2), fract(pn*89.4)) - 0.5) * 0.8;
          float r = 0.03 * pn;
          
          // Fade in the last layer for smoother erratic transitions
          float layerAlpha = clamp(activeDensity - fi + 1.0, 0.0, 1.0);
          pc += smoothstep(r+0.01, r-0.01, length(pgrid)) * (0.5 + 0.5*sin(time*2.0 + pn*10.0)) * (1.0/fi) * layerAlpha;
      }
      col += u_bgColor * pc * 0.8;

      if(t < 100.0) {
          vec3 rp = ro + rd * t;
          vec3 n = sceneNorm(rp);
          vec3 r = reflect(rd, n);
          
          float m = matID; // Save material ID
          
          vec3 lightDir = normalize(vec3(0.5, 1.0, 1.0));
          float diff = max(dot(n, lightDir), 0.0);
          float spec = pow(max(dot(r, lightDir), 0.0), 32.0);
          
          if (m == 0.0) {
              // Chrome
              col = envMap(r);
              // Fresnel
              float fre = pow(clamp(1.0 - dot(n, -rd), 0.0, 1.0), 3.0);
              col += vec3(1.0) * fre * 0.5;
          } else if (m == 1.0) {
              // Skin
              col = u_skinColor * (diff * 0.7 + 0.3);
              col += vec3(1.0) * spec * 0.1; // Slight skin specularity
          } else if (m == 2.0) {
              // Lips
              vec3 lipColor = mix(u_skinColor, vec3(0.8, 0.2, 0.2), 0.5);
              col = lipColor * (diff * 0.7 + 0.3);
              col += vec3(1.0) * spec * 0.2; // Glossy lips
          } else if (m == 3.0) {
              if (u_characterType > 0.5) {
                  // Anime Eyes using normals for UVs
                  vec2 eyeUV = n.xy;
                  
                  // Base eye white (sclera)
                  vec3 eyeCol = vec3(1.0);
                  
                  // Iris
                  float irisDist = length(eyeUV - vec2(0.0, -0.05));
                  if (irisDist < 0.55) {
                      // Iris gradient (darker at top, lighter at bottom)
                      float gradient = smoothstep(0.4, -0.4, eyeUV.y);
                      eyeCol = mix(u_eyeColor * 0.2, u_eyeColor * 1.8, gradient);
                      
                      // Pupil (Dark circle with bright crescent inside, like Row 3)
                      vec2 pupilUV = eyeUV - vec2(0.0, -0.05);
                      if (length(pupilUV) < 0.22) {
                          eyeCol = u_eyeColor * 0.1; // Dark pupil
                          
                          // Bright crescent inside the pupil
                          if (length(pupilUV - vec2(0.0, -0.02)) < 0.12 && length(pupilUV - vec2(0.0, 0.04)) > 0.1) {
                              eyeCol = u_eyeColor * 1.5; // Bright crescent
                          }
                      }
                      
                      // Speckles / Stars in the bottom half
                      if (eyeUV.y < -0.1) {
                          if (length(eyeUV - vec2(0.15, -0.25)) < 0.03) eyeCol = vec3(1.0);
                          if (length(eyeUV - vec2(-0.15, -0.2)) < 0.02) eyeCol = vec3(1.0);
                          if (length(eyeUV - vec2(0.0, -0.35)) < 0.025) eyeCol = vec3(1.0);
                      }
                      
                      // Main Catchlight (Top Right for both eyes)
                      if (length(eyeUV - vec2(0.2, 0.25)) < 0.15) eyeCol = vec3(1.0); 
                      
                      // Dark rim around the iris
                      if (irisDist > 0.5) {
                          eyeCol = mix(u_eyeColor * 0.1, eyeCol, smoothstep(0.55, 0.5, irisDist));
                      }
                  }
                  
                  col = eyeCol * (diff * 0.8 + 0.2);
                  col += vec3(1.0) * spec * 0.5; // Glossy eyes
              } else {
                  // Robot Eyes (Solid color glow)
                  col = u_eyeColor * 2.0;
              }
          } else if (m == 4.0) {
              // Dark (Neck grooves, mouth cavity)
              col = vec3(0.02);
          } else if (m == 5.0) {
              // Jupiter Planet
              vec3 jupColor = vec3(0.8, 0.5, 0.3);
              float bands = sin(rp.y * 1.5) * 0.5 + 0.5;
              float bands2 = sin(rp.y * 4.0 + sin(rp.x * 0.5)) * 0.5 + 0.5;
              jupColor = mix(jupColor, vec3(0.6, 0.3, 0.1), bands * 0.6);
              jupColor = mix(jupColor, vec3(0.9, 0.7, 0.5), bands2 * 0.4);
              
              col = jupColor * (diff * 0.8 + 0.2);
              float fre = pow(clamp(1.0 - dot(n, -rd), 0.0, 1.0), 4.0);
              col += vec3(0.9, 0.6, 0.3) * fre * 0.5;
          } else if (m == 6.0) {
              // Horns (Red/Orange)
              vec3 hornColor = vec3(0.8, 0.3, 0.1);
              float ridge = sin(rp.y * 40.0) * 0.5 + 0.5;
              hornColor = mix(hornColor, hornColor * 0.6, ridge * 0.3);
              col = hornColor * (diff * 0.8 + 0.2);
              col += vec3(1.0) * spec * 0.3;
          } else if (m == 7.0) {
              // Hair (Blue)
              vec3 hairColor = vec3(0.2, 0.3, 0.7);
              float hairHighlight = pow(max(dot(n, vec3(0.0, 1.0, 0.0)), 0.0), 4.0);
              col = hairColor * (diff * 0.8 + 0.2);
              col += vec3(0.4, 0.6, 1.0) * hairHighlight * 0.5;
          } else if (m == 8.0) {
              // Futuristic Glasses (Glowing Cyan/Pink)
              vec3 glassColor = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 0.0, 1.0), sin(rp.x * 10.0 + time * 2.0) * 0.5 + 0.5);
              col = glassColor * 2.0; // Glow
          }
          
          // Ambient occlusion (fake)
          float ao = clamp(rp.y * 0.5 + 0.5, 0.0, 1.0);
          col *= ao;
      }
      
      // Post processing
      col = pow(col, vec3(0.4545)); // Gamma correction
      
      gl_FragColor = vec4(col, 1.0);
  }
`;

interface ShaderFaceProps {
  volume: number;
  zoomReactivity?: number;
  bgColor?: string;
  skinColor?: string;
  eyeColor?: string;
  eyeReactivity?: number;
  characterType?: number;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : [0, 0, 0];
};

export const ShaderFace: React.FC<ShaderFaceProps> = ({ 
  volume, 
  zoomReactivity = 0.5,
  bgColor = '#3399ff',
  skinColor = '#bfa68e',
  eyeColor = '#331a0d',
  eyeReactivity = 3.0,
  characterType = 0.0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const requestRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, z: 0, w: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    glRef.current = gl;

    // Compile shaders
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;

    // Setup full screen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const iResolutionLoc = gl.getUniformLocation(program, 'iResolution');
    const iTimeLoc = gl.getUniformLocation(program, 'iTime');
    const iMouseLoc = gl.getUniformLocation(program, 'iMouse');

    const startTime = Date.now();

    const render = () => {
      if (!gl || !program) return;

      // Resize canvas to match display size
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      }

      gl.useProgram(program);

      const currentTime = (Date.now() - startTime) / 1000.0;

      gl.uniform3f(iResolutionLoc, gl.canvas.width, gl.canvas.height, 1.0);
      gl.uniform1f(iTimeLoc, currentTime);
      gl.uniform4f(iMouseLoc, mouseRef.current.x, mouseRef.current.y, mouseRef.current.z, mouseRef.current.w);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseRef.current.z > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = canvas.height - (e.clientY - rect.top);
      }
    };
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = canvas.height - (e.clientY - rect.top);
      mouseRef.current.z = 1;
    };
    const handleMouseUp = () => {
      mouseRef.current.z = 0;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Update volume uniform
  useEffect(() => {
    if (glRef.current && programRef.current) {
      const gl = glRef.current;
      gl.useProgram(programRef.current);
      
      const iAudioVolumeLoc = gl.getUniformLocation(programRef.current, 'iAudioVolume');
      const uZoomReactivityLoc = gl.getUniformLocation(programRef.current, 'u_zoomReactivity');
      const uBgColorLoc = gl.getUniformLocation(programRef.current, 'u_bgColor');
      const uSkinColorLoc = gl.getUniformLocation(programRef.current, 'u_skinColor');
      const uEyeColorLoc = gl.getUniformLocation(programRef.current, 'u_eyeColor');
      const uEyeReactivityLoc = gl.getUniformLocation(programRef.current, 'u_eyeReactivity');
      const uCharacterTypeLoc = gl.getUniformLocation(programRef.current, 'u_characterType');
      
      gl.uniform1f(iAudioVolumeLoc, volume);
      gl.uniform1f(uZoomReactivityLoc, zoomReactivity);
      gl.uniform1f(uEyeReactivityLoc, eyeReactivity);
      gl.uniform1f(uCharacterTypeLoc, characterType);
      
      const bgRgb = hexToRgb(bgColor);
      gl.uniform3f(uBgColorLoc, bgRgb[0], bgRgb[1], bgRgb[2]);
      
      const skinRgb = hexToRgb(skinColor);
      gl.uniform3f(uSkinColorLoc, skinRgb[0], skinRgb[1], skinRgb[2]);
      
      const eyeRgb = hexToRgb(eyeColor);
      gl.uniform3f(uEyeColorLoc, eyeRgb[0], eyeRgb[1], eyeRgb[2]);
    }
  }, [volume, zoomReactivity, bgColor, skinColor, eyeColor, eyeReactivity, characterType]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full rounded-2xl shadow-2xl border border-gray-800 cursor-move"
      style={{ touchAction: 'none' }}
    />
  );
};
