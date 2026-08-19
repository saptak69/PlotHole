import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import './FaultyTerminal.css';

const hexToRgb = (hex) => {
  let h = hex.replace('#', '').trim();
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const num = parseInt(h.slice(0, 6), 16);
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
};

const vertexShaderSource = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform float iTime;
uniform vec3  iResolution;
uniform float uScale;

uniform vec2  uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3  uTint;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform float uBrightness;

float hash21(vec2 p){
  p = fract(p * 234.56);
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float noise(vec2 p, float t)
{
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(t * 0.090909))) + 0.2; 
}

mat2 rotate(float angle)
{
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p, float t)
{
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5 * uNoiseAmp;
  
  mat2 modify0 = rotate(t * 0.02);
  f += amp * noise(p, t);
  p = modify0 * p * 2.0;
  amp *= 0.454545;
  
  mat2 modify1 = rotate(t * 0.02);
  f += amp * noise(p, t);
  p = modify1 * p * 2.0;
  amp *= 0.454545;
  
  mat2 modify2 = rotate(t * 0.08);
  f += amp * noise(p, t);
  
  return f;
}

float pattern(vec2 p, float t) {
  vec2 offset1 = vec2(1.0);
  mat2 rot01 = rotate(0.08 * t);
  float f1 = fbm(p + offset1, t);
  return fbm(rot01 * p + f1, t);
}

float digit(vec2 p, float t){
    vec2 grid = uGridMul * 15.0;
    vec2 s = floor(p * grid) / grid;
    p = p * grid;
    float intensity = pattern(s * 0.1, t) * 1.3 - 0.03;
    
    if(uUseMouse > 0.5){
        vec2 mouseWorld = uMouse * uScale;
        float distToMouse = distance(s, mouseWorld);
        float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
        intensity += mouseInfluence;
    }
    
    if(uUsePageLoadAnimation > 0.5){
        float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
        float cellDelay = cellRandom * 0.8;
        float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);
        intensity *= smoothstep(0.0, 1.0, cellProgress);
    }
    
    p = fract(p);
    p *= uDigitSize;
    
    float px5 = p.x * 5.0;
    float py5 = (1.0 - p.y) * 5.0;
    
    float i = floor(py5) - 2.0;
    float j = floor(px5) - 2.0;
    float n = i * i + j * j;
    float f = n * 0.0625;
    
    float isOn = step(0.1, intensity - f);
    return isOn;
}

void main() {
    vec2 uv = vUv;
    
    if(uCurvature > 0.0){
        vec2 centered = uv - 0.5;
        float dist = dot(centered, centered);
        uv = uv + centered * dist * uCurvature;
        if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0){
            fragColor = vec4(0.0);
            return;
        }
    }
    
    vec2 p = (gl_FragCoord.xy / iResolution.xy) * uScale;
    
    float r = digit(p + vec2(uChromaticAberration * 0.005, 0.0), iTime);
    float g = digit(p, iTime);
    float b = digit(p - vec2(uChromaticAberration * 0.005, 0.0), iTime);
    
    vec3 col = vec3(r, g, b) * uTint * uBrightness;
    
    if(uScanlineIntensity > 0.0){
        float scanline = sin(gl_FragCoord.y * 0.5) * 0.5 + 0.5;
        col *= 1.0 - scanline * uScanlineIntensity * 0.3;
    }
    
    if(uFlickerAmount > 0.0){
        float flicker = sin(iTime * 40.0) * 0.05 + 0.95;
        col *= mix(1.0, flicker, uFlickerAmount);
    }
    
    fragColor = vec4(col, 1.0);
}
`;

export default function FaultyTerminal({
  scale = 1.0,
  gridMul = [2, 1],
  digitSize = 1.2,
  timeScale = 0.8,
  pause = false,
  scanlineIntensity = 0.5,
  glitchAmount = 0.5,
  flickerAmount = 0.5,
  noiseAmp = 0.5,
  chromaticAberration = 0.5,
  dither = 0.2,
  curvature = 0.05,
  tint = '#e50914',
  mouseReact = true,
  mouseStrength = 0.5,
  pageLoadAnimation = false,
  brightness = 1.35,
  className = '',
  style = {},
  ...rest
}) {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const isVisibleRef = useRef(true);
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothMouseRef = useRef({ x: 0, y: 0 });
  const frozenTimeRef = useRef(0);
  const timeOffsetRef = useRef(Math.random() * 100);
  const loadAnimationStartRef = useRef(0);

  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.0);

  const tintVec = useMemo(() => hexToRgb(tint), [tint]);
  const ditherValue = useMemo(() => (typeof dither === 'boolean' ? (dither ? 1 : 0) : dither), [dither]);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouseRef.current = { x, y };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'faulty-terminal-canvas';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });

    if (!gl) return;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vertexShaderSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragmentShaderSource);
    gl.compileShader(fs);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    const vertices = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uLocs = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      uScale: gl.getUniformLocation(program, 'uScale'),
      uGridMul: gl.getUniformLocation(program, 'uGridMul'),
      uDigitSize: gl.getUniformLocation(program, 'uDigitSize'),
      uScanlineIntensity: gl.getUniformLocation(program, 'uScanlineIntensity'),
      uGlitchAmount: gl.getUniformLocation(program, 'uGlitchAmount'),
      uFlickerAmount: gl.getUniformLocation(program, 'uFlickerAmount'),
      uNoiseAmp: gl.getUniformLocation(program, 'uNoiseAmp'),
      uChromaticAberration: gl.getUniformLocation(program, 'uChromaticAberration'),
      uDither: gl.getUniformLocation(program, 'uDither'),
      uCurvature: gl.getUniformLocation(program, 'uCurvature'),
      uTint: gl.getUniformLocation(program, 'uTint'),
      uMouse: gl.getUniformLocation(program, 'uMouse'),
      uMouseStrength: gl.getUniformLocation(program, 'uMouseStrength'),
      uUseMouse: gl.getUniformLocation(program, 'uUseMouse'),
      uPageLoadProgress: gl.getUniformLocation(program, 'uPageLoadProgress'),
      uUsePageLoadAnimation: gl.getUniformLocation(program, 'uUsePageLoadAnimation'),
      uBrightness: gl.getUniformLocation(program, 'uBrightness')
    };

    function resize() {
      if (!container || !canvas || !gl) return;
      const width = container.offsetWidth || window.innerWidth;
      const height = container.offsetHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.uniform3f(uLocs.iResolution, canvas.width, canvas.height, canvas.width / canvas.height);
    }

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);
    resize();

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisibleRef.current = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    io.observe(container);

    const update = (t) => {
      rafRef.current = requestAnimationFrame(update);
      if (!isVisibleRef.current || document.hidden) return;

      if (pageLoadAnimation && loadAnimationStartRef.current === 0) {
        loadAnimationStartRef.current = t;
      }

      let elapsed = frozenTimeRef.current;
      if (!pause) {
        elapsed = (t * 0.001 + timeOffsetRef.current) * timeScale;
        frozenTimeRef.current = elapsed;
      }

      let progress = pageLoadAnimation ? 0 : 1;
      if (pageLoadAnimation && loadAnimationStartRef.current > 0) {
        progress = Math.min((t - loadAnimationStartRef.current) / 2000, 1);
      }

      if (mouseReact) {
        smoothMouseRef.current.x += (mouseRef.current.x - smoothMouseRef.current.x) * 0.08;
        smoothMouseRef.current.y += (mouseRef.current.y - smoothMouseRef.current.y) * 0.08;
      }

      gl.useProgram(program);
      gl.uniform1f(uLocs.iTime, elapsed);
      gl.uniform1f(uLocs.uScale, scale);
      gl.uniform2f(uLocs.uGridMul, gridMul[0], gridMul[1]);
      gl.uniform1f(uLocs.uDigitSize, digitSize);
      gl.uniform1f(uLocs.uScanlineIntensity, scanlineIntensity);
      gl.uniform1f(uLocs.uGlitchAmount, glitchAmount);
      gl.uniform1f(uLocs.uFlickerAmount, flickerAmount);
      gl.uniform1f(uLocs.uNoiseAmp, noiseAmp);
      gl.uniform1f(uLocs.uChromaticAberration, chromaticAberration);
      gl.uniform1f(uLocs.uDither, ditherValue);
      gl.uniform1f(uLocs.uCurvature, curvature);
      gl.uniform3f(uLocs.uTint, tintVec[0], tintVec[1], tintVec[2]);
      gl.uniform2f(uLocs.uMouse, smoothMouseRef.current.x, smoothMouseRef.current.y);
      gl.uniform1f(uLocs.uMouseStrength, mouseStrength);
      gl.uniform1f(uLocs.uUseMouse, mouseReact ? 1.0 : 0.0);
      gl.uniform1f(uLocs.uPageLoadProgress, progress);
      gl.uniform1f(uLocs.uUsePageLoadAnimation, pageLoadAnimation ? 1.0 : 0.0);
      gl.uniform1f(uLocs.uBrightness, brightness);

      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    rafRef.current = requestAnimationFrame(update);
    if (mouseReact) container.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      io.disconnect();
      if (mouseReact) container.removeEventListener('mousemove', handleMouseMove);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      try {
        container.removeChild(canvas);
      } catch {}
      loadAnimationStartRef.current = 0;
      timeOffsetRef.current = Math.random() * 100;
    };
  }, [
    dpr,
    pause,
    timeScale,
    scale,
    gridMul,
    digitSize,
    scanlineIntensity,
    glitchAmount,
    flickerAmount,
    noiseAmp,
    chromaticAberration,
    ditherValue,
    curvature,
    tintVec,
    mouseReact,
    mouseStrength,
    pageLoadAnimation,
    brightness,
    handleMouseMove
  ]);

  return (
    <div
      ref={containerRef}
      className={`faulty-terminal-container ${className}`}
      style={style}
      {...rest}
    />
  );
}
