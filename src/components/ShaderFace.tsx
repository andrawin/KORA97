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
      float face = length(headP * vec3(1.0, 0.9, 1.05)) - 0.38;
      
      // Forehead / Brow (Audio reactive furrow)
      float browDrop = iAudioVolume * 0.08;
      vec3 browP = headP - vec3(0.0, 0.18 - browDrop, 0.34);
      browP.x = abs(browP.x);
      browP -= vec3(0.14, 0.0, 0.0);
      browP.xy *= rotmat(-0.1 + iAudioVolume * 0.4);
      float brow = length(browP * vec3(1.5, 2.5, 1.0)) - 0.05;
      face = smin(face, brow, 0.06);

      // Nose
      vec3 noseP = headP - vec3(0.0, -0.05, 0.38);
      float nose = length(noseP * vec3(2.0, 1.0, 1.0)) - 0.08;
      face = smin(face, nose, 0.06);

      // Jaw / Audio Reactive
      float jawDrop = iAudioVolume * 0.25;
      vec3 jawP = headP - vec3(0.0, -0.2 - jawDrop, 0.32);
      float jaw = length(jawP * vec3(1.2, 1.2, 1.0)) - 0.18;
      face = smin(face, jaw, 0.08);

      // Cheeks (Audio reactive puff)
      vec3 cheekP = headP - vec3(0.0, -0.1, 0.3);
      cheekP.x = abs(cheekP.x);
      cheekP -= vec3(0.15, 0.0, 0.0);
      float cheekPuff = iAudioVolume * 0.08;
      float cheeks = length(cheekP) - (0.12 + cheekPuff);
      face = smin(face, cheeks, 0.08);

      // Mouth Cavity (Audio reactive smile/widen)
      float mouthSmile = iAudioVolume * 0.8;
      vec3 mouthP = headP - vec3(0.0, -0.18 - jawDrop*0.5, 0.38);
      float mouthCavity = length(mouthP * vec3(1.5 - mouthSmile, 4.0, 1.0)) - 0.04;
      face = smax(face, -mouthCavity, 0.02);

      if (face < d) { d = face; m = 1.0; }

      // --- LIPS ---
      float lips = length(mouthP * vec3(1.2 - mouthSmile*0.5, 3.0, 0.8)) - 0.05;
      lips = smax(lips, -mouthCavity, 0.01);
      if (lips < d) { d = lips; m = 2.0; }

      // --- EYES ---
      // Audio reactive eye movement (darting) and squinting
      float eyeLookX = sin(time * 8.0) * 0.015 * iAudioVolume;
      float eyeLookY = cos(time * 5.0) * 0.01 * iAudioVolume;
      float eyeSquint = iAudioVolume * 3.0; // Eyes narrow when loud
      
      vec3 eyeP = headP - vec3(eyeLookX, 0.08 + eyeLookY, 0.34);
      eyeP.x = abs(eyeP.x);
      eyeP -= vec3(0.16, 0.0, 0.0);
      eyeP.xy *= rotmat(-0.1);
      float eye = length(eyeP * vec3(1.0, 3.0 + eyeSquint, 1.0)) - 0.035;
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

  float f(vec3 p) {
      return robotDist(p);
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
      col += vec3(0.2, 0.6, 1.0) * pc * 0.8;

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
              vec3 skinColor = vec3(0.75, 0.55, 0.42); // Tan / Southeast Asian skin tone
              col = skinColor * (diff * 0.7 + 0.3);
              col += vec3(1.0) * spec * 0.1; // Slight skin specularity
          } else if (m == 2.0) {
              // Lips
              vec3 lipColor = vec3(0.8, 0.4, 0.4);
              col = lipColor * (diff * 0.7 + 0.3);
              col += vec3(1.0) * spec * 0.2; // Glossy lips
          } else if (m == 3.0) {
              // Eyes (Brown/Hazel)
              vec3 eyeColor = vec3(0.2, 0.1, 0.05);
              col = eyeColor * (diff * 0.8 + 0.2);
              col += vec3(1.0) * spec * 0.8; // Very glossy eyes
          } else if (m == 4.0) {
              // Dark (Neck grooves, mouth cavity)
              col = vec3(0.02);
          } else if (m == 5.0) {
              // Jupiter Planet
              // Base color
              vec3 jupColor = vec3(0.8, 0.5, 0.3);
              // Add bands using sine waves based on local Y position
              // We need to reconstruct local Y. Since it's far away, rp.y is a good approximation
              float bands = sin(rp.y * 1.5) * 0.5 + 0.5;
              float bands2 = sin(rp.y * 4.0 + sin(rp.x * 0.5)) * 0.5 + 0.5;
              jupColor = mix(jupColor, vec3(0.6, 0.3, 0.1), bands * 0.6);
              jupColor = mix(jupColor, vec3(0.9, 0.7, 0.5), bands2 * 0.4);
              
              col = jupColor * (diff * 0.8 + 0.2);
              // Add a slight atmospheric glow at the edges
              float fre = pow(clamp(1.0 - dot(n, -rd), 0.0, 1.0), 4.0);
              col += vec3(0.9, 0.6, 0.3) * fre * 0.5;
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
}

export const ShaderFace: React.FC<ShaderFaceProps> = ({ volume, zoomReactivity = 0.5 }) => {
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
      gl.uniform1f(iAudioVolumeLoc, volume);
      gl.uniform1f(uZoomReactivityLoc, zoomReactivity);
    }
  }, [volume, zoomReactivity]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full rounded-2xl shadow-2xl border border-gray-800 cursor-move"
      style={{ touchAction: 'none' }}
    />
  );
};
