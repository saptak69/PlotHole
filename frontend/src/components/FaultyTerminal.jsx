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
  vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * t);
  mat2 rot1 = rotate(0.1);
  
  vec2 q = vec2(fbm(p + offset1, t), fbm(rot01 * p + offset1, t));
  vec2 r = vec2(fbm(rot1 * q + offset0, t), fbm(q + offset0, t));
  return fbm(p + r, t);
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
        
        float ripple = sin(distToMouse * 20.0 - iTime * 5.0) * 0.1 * mouseInfluence;
        intensity += ripple;
    }
    
    if(uUsePageLoadAnimation > 0.5){
        float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
        float cellDelay = cellRandom * 0.8;
        float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);
        
        float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
        intensity *= fadeAlpha;
    }
    
    p = fract(p);
    p *= uDigitSize;
    
    float px5 = p.x * 5.0;
    float py5 = (1.0 - p.y) * 5.0;
    float x = fract(px5);
    float y = fract(py5);
    
    float i = floor(py5) - 2.0;
    float j = floor(px5) - 2.0;
    float n = i * i + j * j;
    float f = n * 0.0625;
    
    float isOn = step(0.1, intensity - f);
    float brightnessVal = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);
    
    return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightnessVal;
}

float onOff(float a, float b, float c)
{
  return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
}

float displace(vec2 look)
{
    float y = look.y - mod(iTime * 0.25, 1.0);
    float window = 1.0 / (1.0 + 50.0 * y * y);
    return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window;
}

vec3 getColor(vec2 p, float t){
    float bar = step(mod(p.y + t * 20.0, 1.0), 0.2) * 0.4 + 1.0;
    bar *= uScanlineIntensity;
    
    float displacement = displace(p);
    p.x += displacement;

    if (uGlitchAmount != 1.0) {
      float extra = displacement * (uGlitchAmount - 1.0);
      p.x += extra;
    }

    float middle = digit(p, t);
    
    const float off = 0.002;
    float sum = digit(p + vec2(-off, -off), t) + digit(p + vec2(0.0, -off), t) + digit(p + vec2(off, -off), t) +
                digit(p + vec2(-off, 0.0), t) + digit(p + vec2(0.0, 0.0), t) + digit(p + vec2(off, 0.0), t) +
                digit(p + vec2(-off, off), t) + digit(p + vec2(0.0, off), t) + digit(p + vec2(off, off), t);
    
    vec3 baseColor = vec3(0.9) * middle + sum * 0.1 * vec3(1.0) * bar;
    return baseColor;
}

vec2 barrel(vec2 uv){
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + uCurvature * r2;
  return c * 0.5 + 0.5;
}

void main() {
    float t = iTime * 0.333333;
    vec2 uv = vUv;

    if(uCurvature != 0.0){
      uv = barrel(uv);
    }
    
    vec2 p = uv * uScale;
    vec3 col = getColor(p, t);

    if(uChromaticAberration != 0.0){
      vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
      col.r = getColor(p + ca, t).r;
      col.b = getColor(p - ca, t).b;
    }

    col *= uTint;
    col *= uBrightness;

    if(uDither > 0.0){
      float rnd = hash21(gl_FragCoord.xy);
      col += (rnd - 0.5) * (uDither * 0.003922);
    }

    float alpha = clamp(length(col) * 1.5, 0.0, 1.0);
    fragColor = vec4(col, alpha);
}
`;

export default function FaultyTerminal({
  scale = 1.5,
  gridMul = [2, 1],
  digitSize = 1.2,
  timeScale = 1,
  pause = false,
  scanlineIntensity = 1,
  glitchAmount = 1,
  flickerAmount = 1,
  noiseAmp = 1,
  chromaticAberration = 0,
  dither = 0,
  curvature = 0,
  tint = '#00f5a0',
  mouseReact = true,
  mouseStrength = 0.5,
  dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
  pageLoadAnimation = false,
  brightness = 1,
  className = '',
  style = {},
  ...rest
}) {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const frozenTimeRef = useRef(0);
  const rafRef = useRef(0);
  const loadAnimationStartRef = useRef(0);
  const timeOffsetRef = useRef(Math.random() * 100);

  const tintVec = useMemo(() => hexToRgb(tint), [tint]);
  const ditherValue = useMemo(() => (typeof dither === 'boolean' ? (dither ? 1 : 0) : dither), [dither]);

  const handleMouseMove = useCallback((e) => {
    const ctn = containerRef.current;
    if (!ctn) return;
    const rect = ctn.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    mouseRef.current = { x, y };
  }, []);

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
      console.warn('WebGL2 not supported');
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
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
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
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Fullscreen single triangle covering viewport
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
      if (uLocs.iResolution) {
        gl.useProgram(program);
        gl.uniform3f(uLocs.iResolution, canvas.width, canvas.height, canvas.width / canvas.height);
      }
    }

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);
    resize();

    const update = (t) => {
      rafRef.current = requestAnimationFrame(update);

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
        const animationDuration = 2000;
        const animationElapsed = t - loadAnimationStartRef.current;
        progress = Math.min(animationElapsed / animationDuration, 1);
      }

      if (mouseReact) {
        const dampingFactor = 0.08;
        const smoothMouse = smoothMouseRef.current;
        const mouse = mouseRef.current;
        smoothMouse.x += (mouse.x - smoothMouse.x) * dampingFactor;
        smoothMouse.y += (mouse.y - smoothMouse.y) * dampingFactor;
      }

      gl.useProgram(program);

      if (uLocs.iTime) gl.uniform1f(uLocs.iTime, elapsed);
      if (uLocs.uScale) gl.uniform1f(uLocs.uScale, scale);
      if (uLocs.uGridMul) gl.uniform2f(uLocs.uGridMul, gridMul[0], gridMul[1]);
      if (uLocs.uDigitSize) gl.uniform1f(uLocs.uDigitSize, digitSize);
      if (uLocs.uScanlineIntensity) gl.uniform1f(uLocs.uScanlineIntensity, scanlineIntensity);
      if (uLocs.uGlitchAmount) gl.uniform1f(uLocs.uGlitchAmount, glitchAmount);
      if (uLocs.uFlickerAmount) gl.uniform1f(uLocs.uFlickerAmount, flickerAmount);
      if (uLocs.uNoiseAmp) gl.uniform1f(uLocs.uNoiseAmp, noiseAmp);
      if (uLocs.uChromaticAberration) gl.uniform1f(uLocs.uChromaticAberration, chromaticAberration);
      if (uLocs.uDither) gl.uniform1f(uLocs.uDither, ditherValue);
      if (uLocs.uCurvature) gl.uniform1f(uLocs.uCurvature, curvature);
      if (uLocs.uTint) gl.uniform3f(uLocs.uTint, tintVec[0], tintVec[1], tintVec[2]);
      if (uLocs.uMouse) gl.uniform2f(uLocs.uMouse, smoothMouseRef.current.x, smoothMouseRef.current.y);
      if (uLocs.uMouseStrength) gl.uniform1f(uLocs.uMouseStrength, mouseStrength);
      if (uLocs.uUseMouse) gl.uniform1f(uLocs.uUseMouse, mouseReact ? 1.0 : 0.0);
      if (uLocs.uPageLoadProgress) gl.uniform1f(uLocs.uPageLoadProgress, progress);
      if (uLocs.uUsePageLoadAnimation) gl.uniform1f(uLocs.uUsePageLoadAnimation, pageLoadAnimation ? 1.0 : 0.0);
      if (uLocs.uBrightness) gl.uniform1f(uLocs.uBrightness, brightness);

      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    rafRef.current = requestAnimationFrame(update);

    if (mouseReact) container.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
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
