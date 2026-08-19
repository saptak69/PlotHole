import React, { useEffect, useRef } from 'react';
import './MoltenMetal.css';

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const colorModeToFloat = (mode) => (mode === 'ember' ? 1 : mode === 'frost' ? 2 : 0);

const vertexShaderSource = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uScale;
uniform float uDetail;
uniform float uGlow;
uniform float uCoreSize;
uniform float uSwirl;
uniform float uFold;
uniform float uBlackPoint;
uniform float uBrightness;
uniform float uColorMode;
uniform float uGrain;
uniform float uGrainIntensity;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform bool uEnableMouse;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float time = iTime * uSpeed;
  vec2 p = uScale * ((gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y) - 0.5;

  vec2 drift = vec2(0.0);
  if (uEnableMouse) {
    drift = (uMouse - 0.5) * uMouseStrength * 2.0;
  }
  p += drift;

  vec2 i = p;
  float c = 0.0;
  float r = length(p + vec2(sin(time), sin(time * 0.3 + 5.0)) * 0.5);
  float d = length(p);
  float rot = d + time + p.x * uSwirl;

  float cosRot = cos(rot);
  mat2 warp = mat2(cos(rot - sin(time / 5.0)), sin(rot), -sin(cosRot - time), cosRot) * uFold;
  float glowCore = uGlow * uCoreSize;

  for (float n = 0.0; n < 8.0; n++) {
    if (n >= uDetail) break;
    p *= warp;
    float t = r - time / (n + 3.0);
    i -= p + vec2(cos(t - i.x - r) + sin(t + i.y), sin(t - i.y) + cos(t + i.x) + r);
    c += glowCore / length(vec2(sin(i.x + t), cos(i.y + t)));
  }

  c /= 6.0;

  float intensity = max(c - uBlackPoint, 0.0) * uBrightness;

  float g = clamp(intensity, 0.0, 1.0);

  float mid = 0.5;
  if (uColorMode > 1.5) {
    mid = 0.65;
  } else if (uColorMode > 0.5) {
    mid = 0.35;
  }

  vec3 col = mix(uColor1, uColor2, smoothstep(0.0, mid, g));
  col = mix(col, uColor3, smoothstep(mid, 1.0, g));

  float a = g;
  if (uGrain > 0.5) {
    float gr = hash(gl_FragCoord.xy + iTime);
    a += (gr - 0.5) * uGrainIntensity;
  }
  a = clamp(a, 0.0, 1.0) * uOpacity;
  fragColor = vec4(col * a, a);
}
`;

/**
 * MoltenMetal Component from React Bits
 * Real-time liquid metal / fluid caustic GL shader with domain warping and cursor drift.
 */
export default function MoltenMetal({
  color1 = '#e50914',
  color2 = '#ffb800',
  color3 = '#ffffff',
  speed = 0.35,
  scale = 4,
  detail = 3,
  glow = 1.6,
  coreSize = 0.1,
  swirl = 1,
  fold = -0.2,
  blackPoint = 0.05,
  brightness = 1.3,
  colorMode = 'molten',
  grain = true,
  grainIntensity = 0.05,
  mouseInteraction = true,
  mouseStrength = 0.3,
  opacity = 1.0,
  className = ''
}) {
  const containerRef = useRef(null);
  const uniformsRef = useRef({});

  // Sync props to uniforms
  useEffect(() => {
    uniformsRef.current = {
      uSpeed: speed,
      uScale: scale,
      uDetail: detail,
      uGlow: glow,
      uCoreSize: Math.max(coreSize, 0.001),
      uSwirl: swirl,
      uFold: fold,
      uBlackPoint: blackPoint,
      uBrightness: brightness,
      uColorMode: colorModeToFloat(colorMode),
      uGrain: grain ? 1 : 0,
      uGrainIntensity: grainIntensity,
      uOpacity: opacity,
      uMouseStrength: mouseStrength,
      uEnableMouse: mouseInteraction,
      uColor1: hexToRgb(color1),
      uColor2: hexToRgb(color2),
      uColor3: hexToRgb(color3)
    };
  }, [
    color1,
    color2,
    color3,
    speed,
    scale,
    detail,
    glow,
    coreSize,
    swirl,
    fold,
    blackPoint,
    brightness,
    colorMode,
    grain,
    grainIntensity,
    mouseInteraction,
    mouseStrength,
    opacity
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false
    });

    if (!gl) {
      console.warn('WebGL2 not supported for MoltenMetal');
      return () => {
        try {
          container.removeChild(canvas);
        } catch {}
      };
    }

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Fullscreen single triangle covering viewport [-1, -1] to [3, -1] and [-1, 3]
    const triangleData = new Float32Array([
      -1.0, -1.0,
       3.0, -1.0,
      -1.0,  3.0
    ]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleData, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Cache Uniform Locations
    const uLocs = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      uSpeed: gl.getUniformLocation(program, 'uSpeed'),
      uScale: gl.getUniformLocation(program, 'uScale'),
      uDetail: gl.getUniformLocation(program, 'uDetail'),
      uGlow: gl.getUniformLocation(program, 'uGlow'),
      uCoreSize: gl.getUniformLocation(program, 'uCoreSize'),
      uSwirl: gl.getUniformLocation(program, 'uSwirl'),
      uFold: gl.getUniformLocation(program, 'uFold'),
      uBlackPoint: gl.getUniformLocation(program, 'uBlackPoint'),
      uBrightness: gl.getUniformLocation(program, 'uBrightness'),
      uColorMode: gl.getUniformLocation(program, 'uColorMode'),
      uGrain: gl.getUniformLocation(program, 'uGrain'),
      uGrainIntensity: gl.getUniformLocation(program, 'uGrainIntensity'),
      uOpacity: gl.getUniformLocation(program, 'uOpacity'),
      uMouse: gl.getUniformLocation(program, 'uMouse'),
      uMouseStrength: gl.getUniformLocation(program, 'uMouseStrength'),
      uEnableMouse: gl.getUniformLocation(program, 'uEnableMouse'),
      uColor1: gl.getUniformLocation(program, 'uColor1'),
      uColor2: gl.getUniformLocation(program, 'uColor2'),
      uColor3: gl.getUniformLocation(program, 'uColor3')
    };

    let width = 0;
    let height = 0;

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width * dpr));
      height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(container);
    setSize();

    const targetMouse = [0.5, 0.5];
    const currentMouse = [0.5, 0.5];

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      targetMouse[0] = (e.clientX - rect.left) / rect.width;
      targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
    };

    const handleMouseLeave = () => {
      targetMouse[0] = 0.5;
      targetMouse[1] = 0.5;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let raf = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    const t0 = performance.now();

    const loop = (now) => {
      if (!gl || !program) return;

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);

      const time = (now - t0) * 0.001;
      const u = uniformsRef.current;

      gl.uniform1f(uLocs.iTime, time);
      gl.uniform2f(uLocs.iResolution, width, height);
      gl.uniform1f(uLocs.uSpeed, u.uSpeed ?? 0.35);
      gl.uniform1f(uLocs.uScale, u.uScale ?? 4);
      gl.uniform1f(uLocs.uDetail, u.uDetail ?? 3);
      gl.uniform1f(uLocs.uGlow, u.uGlow ?? 1.6);
      gl.uniform1f(uLocs.uCoreSize, u.uCoreSize ?? 0.1);
      gl.uniform1f(uLocs.uSwirl, u.uSwirl ?? 1);
      gl.uniform1f(uLocs.uFold, u.uFold ?? -0.2);
      gl.uniform1f(uLocs.uBlackPoint, u.uBlackPoint ?? 0.05);
      gl.uniform1f(uLocs.uBrightness, u.uBrightness ?? 1.3);
      gl.uniform1f(uLocs.uColorMode, u.uColorMode ?? 0);
      gl.uniform1f(uLocs.uGrain, u.uGrain ?? 1);
      gl.uniform1f(uLocs.uGrainIntensity, u.uGrainIntensity ?? 0.05);
      gl.uniform1f(uLocs.uOpacity, u.uOpacity ?? 1.0);
      gl.uniform2f(uLocs.uMouse, currentMouse[0], currentMouse[1]);
      gl.uniform1f(uLocs.uMouseStrength, u.uMouseStrength ?? 0.3);
      gl.uniform1i(uLocs.uEnableMouse, u.uEnableMouse ? 1 : 0);

      const c1 = u.uColor1 || [1, 1, 1];
      const c2 = u.uColor2 || [1, 1, 1];
      const c3 = u.uColor3 || [1, 1, 1];
      gl.uniform3f(uLocs.uColor1, c1[0], c1[1], c1[2]);
      gl.uniform3f(uLocs.uColor2, c2[0], c2[1], c2[2]);
      gl.uniform3f(uLocs.uColor3, c3[0], c3[1], c3[2]);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      raf = requestAnimationFrame(loop);
    };

    const tryStart = () => {
      if (isVisible && isPageVisible && raf === 0) {
        raf = requestAnimationFrame(loop);
      }
    };

    const tryStop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        isVisible ? tryStart() : tryStop();
      },
      { threshold: 0 }
    );
    io.observe(container);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      isPageVisible ? tryStart() : tryStop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    tryStart();

    return () => {
      tryStop();
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      try {
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(buffer);
        gl.deleteVertexArray(vao);
        container.removeChild(canvas);
      } catch {}
    };
  }, []);

  return <div ref={containerRef} className={`molten-metal-container ${className}`.trim()} />;
}
