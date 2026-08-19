import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Film, Compass } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/**
 * Horizon Cinema Cosmos 3D Hero Section
 * Adapted for PlotHole: Cinephile Obsidian & Aurora Amber
 */
export default function HorizonHeroSection({ onExplore }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const scrollProgressRef = useRef(null);
  const menuRef = useRef(null);

  const smoothCameraPos = useRef({ x: 0, y: 30, z: 100 });
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const totalSections = 3;
  
  const threeRefs = useRef({
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    stars: [],
    nebula: null,
    mountains: [],
    animationId: null,
    locations: []
  });

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!canvasRef.current) return;
    const { current: refs } = threeRefs;
    
    // Scene setup with deep obsidian fog
    refs.scene = new THREE.Scene();
    refs.scene.fog = new THREE.FogExp2(0x08080a, 0.0003);

    // Camera
    refs.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    refs.camera.position.z = 100;
    refs.camera.position.y = 20;

    // WebGL Renderer
    refs.renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    refs.renderer.setSize(window.innerWidth, window.innerHeight);
    // Performance: Cap DPR to 1.25 to maintain ultra-smooth 60fps on high-density displays
    refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    refs.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    refs.renderer.toneMappingExposure = 0.6;

    // Post-processing Bloom
    refs.composer = new EffectComposer(refs.renderer);
    const renderPass = new RenderPass(refs.scene, refs.camera);
    refs.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.35, // strength (brighter bloom)
      0.5,  // radius
      0.65  // threshold
    );
    refs.composer.addPass(bloomPass);

    // Create 3D Scene Elements
    createStarField();
    createNebula();
    createMountains();
    createAtmosphere();

    // Cache initial mountain positions
    refs.locations = refs.mountains.map((m) => m.position.z);

    let isSectionVisible = true;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isSectionVisible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });

    if (canvasRef.current?.parentElement) {
      io.observe(canvasRef.current.parentElement);
    }

    // Start render loop
    animate();
    setIsReady(true);

    function createStarField() {
      const starCount = 4500;
      
      for (let i = 0; i < 3; i++) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let j = 0; j < starCount; j++) {
          const radius = 200 + Math.random() * 800;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);

          positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[j * 3 + 2] = radius * Math.cos(phi);

          // Cinephile Color Palette (Amber, Gold, Netflix Red, White)
          const color = new THREE.Color();
          const colorChoice = Math.random();
          if (colorChoice < 0.55) {
            color.setHSL(0, 0, 0.95 + Math.random() * 0.05); // Bright white stars
          } else if (colorChoice < 0.82) {
            color.setHSL(0.12, 1.0, 0.75); // Radiant Cinema Gold stars
          } else {
            color.setHSL(0.98, 1.0, 0.65); // Radiant Scarlet Red stars
          }
          
          colors[j * 3] = color.r;
          colors[j * 3 + 1] = color.g;
          colors[j * 3 + 2] = color.b;

          sizes[j] = Math.random() * 2.8 + 0.8;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            depth: { value: i }
          },
          vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            uniform float depth;
            
            void main() {
              vColor = color;
              vec3 pos = position;
              
              float angle = time * 0.04 * (1.0 - depth * 0.25);
              mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
              pos.xy = rot * pos.xy;
              
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              
              float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
              gl_FragColor = vec4(vColor, opacity);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        const stars = new THREE.Points(geometry, material);
        refs.scene.add(stars);
        refs.stars.push(stars);
      }
    }

    function createNebula() {
      const geometry = new THREE.PlaneGeometry(8000, 4000, 80, 80);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color(0xff2e3b) }, // Vivid Scarlet Red
          color2: { value: new THREE.Color(0xffb800) }, // Radiant Cinema Gold
          opacity: { value: 0.48 } // Brighter Nebula
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vElevation;
          uniform float time;
          
          void main() {
            vUv = uv;
            vec3 pos = position;
            
            float elevation = sin(pos.x * 0.01 + time) * cos(pos.y * 0.01 + time) * 22.0;
            pos.z += elevation;
            vElevation = elevation;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
          uniform float opacity;
          uniform float time;
          varying vec2 vUv;
          varying float vElevation;
          
          void main() {
            float mixFactor = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
            vec3 color = mix(color1, color2, mixFactor * 0.5 + 0.5);
            
            float alpha = opacity * (1.0 - length(vUv - 0.5) * 2.0);
            alpha *= 1.0 + vElevation * 0.01;
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const nebula = new THREE.Mesh(geometry, material);
      nebula.position.z = -1050;
      refs.scene.add(nebula);
      refs.nebula = nebula;
    }

    function createMountains() {
      const layers = [
        { distance: -50, height: 60, color: 0x0a0a0d, opacity: 1 },
        { distance: -100, height: 80, color: 0x121216, opacity: 0.85 },
        { distance: -150, height: 100, color: 0x16161c, opacity: 0.65 },
        { distance: -200, height: 120, color: 0x1a1a22, opacity: 0.45 }
      ];

      layers.forEach((layer, index) => {
        const points = [];
        const segments = 50;
        
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments - 0.5) * 1000;
          const y = Math.sin(i * 0.1) * layer.height + 
                   Math.sin(i * 0.05) * layer.height * 0.5 +
                   Math.random() * layer.height * 0.2 - 100;
          points.push(new THREE.Vector2(x, y));
        }
        
        points.push(new THREE.Vector2(5000, -300));
        points.push(new THREE.Vector2(-5000, -300));

        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
          color: layer.color,
          transparent: true,
          opacity: layer.opacity,
          side: THREE.DoubleSide
        });

        const mountain = new THREE.Mesh(geometry, material);
        mountain.position.z = layer.distance;
        mountain.position.y = layer.distance;
        mountain.userData = { baseZ: layer.distance, index };
        refs.scene.add(mountain);
        refs.mountains.push(mountain);
      });
    }

    function createAtmosphere() {
      const geometry = new THREE.SphereGeometry(600, 32, 32);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          uniform float time;
          
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 atmosphere = vec3(1.0, 0.08, 0.12) * intensity; // Radiant Scarlet Atmosphere
            
            float pulse = sin(time * 2.0) * 0.12 + 0.95;
            atmosphere *= pulse;
            
            gl_FragColor = vec4(atmosphere, intensity * 0.45);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
      });

      const atmosphere = new THREE.Mesh(geometry, material);
      refs.scene.add(atmosphere);
    }

    function animate() {
      refs.animationId = requestAnimationFrame(animate);

      // Skip render passes when off-screen or tab is hidden to save 100% GPU
      if (!isSectionVisible || document.hidden) return;

      const time = Date.now() * 0.001;

      // Update stars
      refs.stars.forEach((starField) => {
        if (starField.material.uniforms) {
          starField.material.uniforms.time.value = time;
        }
      });

      // Update nebula
      if (refs.nebula && refs.nebula.material.uniforms) {
        refs.nebula.material.uniforms.time.value = time * 0.5;
      }

      // Smooth camera position
      if (refs.camera && refs.targetCameraX !== undefined) {
        const smoothing = 0.05;
        smoothCameraPos.current.x += (refs.targetCameraX - smoothCameraPos.current.x) * smoothing;
        smoothCameraPos.current.y += (refs.targetCameraY - smoothCameraPos.current.y) * smoothing;
        smoothCameraPos.current.z += (refs.targetCameraZ - smoothCameraPos.current.z) * smoothing;
        
        const floatX = Math.sin(time * 0.1) * 2;
        const floatY = Math.cos(time * 0.15) * 1;
        
        refs.camera.position.x = smoothCameraPos.current.x + floatX;
        refs.camera.position.y = smoothCameraPos.current.y + floatY;
        refs.camera.position.z = smoothCameraPos.current.z;
        refs.camera.lookAt(0, 10, -600);
      }

      // Parallax mountains
      refs.mountains.forEach((mountain, i) => {
        const parallaxFactor = 1 + i * 0.4;
        mountain.position.x = Math.sin(time * 0.1) * 2 * parallaxFactor;
        mountain.position.y = 50 + (Math.cos(time * 0.15) * 1 * parallaxFactor);
      });

      if (refs.composer) {
        refs.composer.render();
      }
    }

    const handleResize = () => {
      if (refs.camera && refs.renderer && refs.composer) {
        refs.camera.aspect = window.innerWidth / window.innerHeight;
        refs.camera.updateProjectionMatrix();
        refs.renderer.setSize(window.innerWidth, window.innerHeight);
        refs.composer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      if (refs.animationId) cancelAnimationFrame(refs.animationId);
      window.removeEventListener('resize', handleResize);
      io.disconnect();

      refs.stars.forEach((s) => {
        s.geometry.dispose();
        s.material.dispose();
      });
      refs.mountains.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      if (refs.nebula) {
        refs.nebula.geometry.dispose();
        refs.nebula.material.dispose();
      }
      if (refs.renderer) refs.renderer.dispose();
    };
  }, []);

  // GSAP Entrance Animations
  useEffect(() => {
    if (!isReady) return;
    
    gsap.set([menuRef.current, titleRef.current, subtitleRef.current, scrollProgressRef.current], {
      visibility: 'visible'
    });

    const tl = gsap.timeline();

    if (titleRef.current) {
      tl.from(titleRef.current, {
        y: 80,
        opacity: 0,
        filter: 'blur(12px)',
        duration: 1.4,
        ease: "power4.out"
      });
    }

    if (subtitleRef.current) {
      tl.from(subtitleRef.current, {
        y: 40,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out"
      }, "-=0.8");
    }

    return () => {
      tl.kill();
    };
  }, [isReady]);

  // Scroll Trigger Camera Travel
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - windowHeight);
      const progress = Math.min(scrollY / maxScroll, 1);
      
      setScrollProgress(progress);
      const newSection = Math.min(totalSections - 1, Math.floor(progress * totalSections));
      setCurrentSection(newSection);

      const { current: refs } = threeRefs;
      const totalProgress = progress * totalSections;
      const sectionProgress = totalProgress % 1;
      
      const cameraPositions = [
        { x: 0, y: 30, z: 300 },   // Section 0 - CINEMA
        { x: 0, y: 40, z: -50 },   // Section 1 - COSMOS
        { x: 0, y: 50, z: -700 }   // Section 2 - INFINITY
      ];
      
      const currentPos = cameraPositions[newSection] || cameraPositions[0];
      const nextPos = cameraPositions[Math.min(totalSections - 1, newSection + 1)] || currentPos;
      
      refs.targetCameraX = currentPos.x + (nextPos.x - currentPos.x) * sectionProgress;
      refs.targetCameraY = currentPos.y + (nextPos.y - currentPos.y) * sectionProgress;
      refs.targetCameraZ = currentPos.z + (nextPos.z - currentPos.z) * sectionProgress;

      refs.mountains.forEach((mountain, i) => {
        const speed = 1 + i * 0.9;
        const targetZ = mountain.userData.baseZ + scrollY * speed * 0.4;
        mountain.userData.targetZ = targetZ;
        
        if (progress > 0.7) {
          mountain.position.z = 600000;
        } else {
          mountain.position.z = refs.locations[i] || targetZ;
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  const sectionsContent = [
    {
      title: 'HORIZON',
      badge: 'Cinephile Universe',
      line1: 'Where timeless stories meet reality,',
      line2: 'we shape the cinema chronicles of tomorrow.'
    },
    {
      title: 'COSMOS',
      badge: 'Galactic Discovery',
      line1: 'Beyond the boundaries of ordinary plots,',
      line2: 'lies an endless universe of cinematic masterpieces.'
    },
    {
      title: 'INFINITY',
      badge: 'Vault of Legends',
      line1: 'In the space between thought and creation,',
      line2: 'we log, rate, and celebrate pure cinema.'
    }
  ];

  return (
    <div ref={containerRef} className="relative w-full min-h-[180vh] bg-[#08080a] text-slate-100 overflow-hidden select-none">
      {/* 3D WebGL Canvas Layer */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />
      
      {/* Ambient Vignette Masks */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-[#08080a]/60 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-radial-vignette pointer-events-none z-0" />

      {/* Floating Side Brand Stamp */}
      <div ref={menuRef} className="fixed left-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-4 z-20 pointer-events-none opacity-60">
        <div className="w-8 h-8 rounded-full border border-[#e50914]/40 flex items-center justify-center text-[#e50914]">
          <Film className="w-4 h-4" />
        </div>
        <div className="text-[10px] font-mono tracking-widest uppercase text-slate-400 [writing-mode:vertical-lr] rotate-180">
          PLOTHOLE 3D COSMOS
        </div>
      </div>

      {/* Dynamic Scrollable Content Sections */}
      <div className="relative z-10 space-y-[40vh] pt-32 pb-48 max-w-5xl mx-auto px-6 text-center">
        {sectionsContent.map((sec, idx) => (
          <section key={idx} className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e50914]/15 border border-[#e50914]/30 text-[#ff4d5a] font-mono text-[11px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md">
              <Film className="w-3.5 h-3.5" />
              <span>{sec.badge}</span>
            </div>

            <h1 
              ref={idx === 0 ? titleRef : null} 
              className="font-display font-black text-5xl md:text-7xl lg:text-8xl tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-amber-200/80 drop-shadow-[0_10px_35px_rgba(229,9,20,0.25)]"
            >
              {sec.title}
            </h1>
            
            <div 
              ref={idx === 0 ? subtitleRef : null} 
              className="max-w-xl mx-auto text-sm md:text-base font-sans text-slate-300 leading-relaxed space-y-1 drop-shadow"
            >
              <p>{sec.line1}</p>
              <p className="text-amber-300/90 font-medium">{sec.line2}</p>
            </div>

            {idx === 0 && onExplore && (
              <button
                onClick={onExplore}
                className="btn-primary px-8 py-3.5 text-xs font-mono font-bold uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(229,9,20,0.4)] mt-4"
              >
                Enter Cinema Vault
              </button>
            )}
          </section>
        ))}
      </div>

      {/* Floating Scroll Progress Indicator */}
      <div 
        ref={scrollProgressRef} 
        className="fixed bottom-8 right-8 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/15 px-4 py-2 rounded-full shadow-2xl"
      >
        <Compass className="w-4 h-4 text-[#ffb800] animate-spin [animation-duration:10s]" />
        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#e50914] to-[#ffb800] rounded-full transition-all duration-150" 
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
        <span className="font-mono text-[11px] font-bold text-slate-300">
          0{currentSection + 1} / 0{totalSections}
        </span>
      </div>
    </div>
  );
}
