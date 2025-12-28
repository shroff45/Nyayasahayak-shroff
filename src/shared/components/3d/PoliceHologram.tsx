// src/shared/components/3d/PoliceHologram.tsx
// NyayaSahayak - Premium 3D Police Hologram (NyayaRakshak)
// Features: Holographic Shield, scanning radar, and drone swarms

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Shield, Radio, Target, Lock, Siren, Database, Scan, Activity } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Feature {
    icon: React.ElementType;
    label: string;
    angle: number;
    color: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PoliceHologram: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const animationIdRef = useRef<number>(0);
    const mouseRef = useRef({ x: 0, y: 0 });

    // Cyber-Police Features
    const features: Feature[] = [
        { icon: Shield, label: 'Protection', angle: 0, color: 'cyan' },
        { icon: Radio, label: 'Comms', angle: 45, color: 'blue' },
        { icon: Target, label: 'Surveillance', angle: 90, color: 'blue' },
        { icon: Lock, label: 'Security', angle: 135, color: 'cyan' },
        { icon: Siren, label: 'Emergency', angle: 180, color: 'red' },
        { icon: Database, label: 'Records', angle: 225, color: 'blue' },
        { icon: Scan, label: 'Biometrics', angle: 270, color: 'cyan' },
        { icon: Activity, label: 'Analytics', angle: 315, color: 'blue' },
    ];

    const featureRadius = 220;

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.001);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        camera.position.z = 8;
        camera.position.y = 0.5;
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        const ambientLight = new THREE.AmbientLight(0x06b6d4, 0.4);
        scene.add(ambientLight);

        const mainLight = new THREE.PointLight(0x06b6d4, 3, 20);
        mainLight.position.set(2, 5, 5);
        scene.add(mainLight);

        const redLight = new THREE.PointLight(0xef4444, 1, 15); // Emergency red
        redLight.position.set(-5, -2, -2);
        scene.add(redLight);

        // --- 3D OBJECTS ---

        // 1. Central Holographic Shield (Icosahedron)
        const shieldGeometry = new THREE.IcosahedronGeometry(1.4, 1);
        const shieldMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x06b6d4, // Cyan
            metalness: 0.8,
            roughness: 0.2,
            transmission: 0.6,
            thickness: 1,
            wireframe: true,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.5
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        scene.add(shield);

        // Core inside shield
        const coreGeometry = new THREE.OctahedronGeometry(0.8, 0);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        scene.add(core);

        // 2. Radar Rings
        const ringsGroup = new THREE.Group();
        scene.add(ringsGroup);

        const createRing = (radius: number, color: number, opacity: number) => {
            const geometry = new THREE.RingGeometry(radius, radius + 0.05, 64);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: opacity,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(geometry, material);
            ring.rotation.x = Math.PI / 2; // Lie flat
            return ring;
        };

        const radarRing1 = createRing(2.0, 0x06b6d4, 0.3);
        ringsGroup.add(radarRing1);

        const radarRing2 = createRing(2.8, 0x3b82f6, 0.2);
        ringsGroup.add(radarRing2);

        const radarRing3 = createRing(3.5, 0x06b6d4, 0.1);
        ringsGroup.add(radarRing3);

        // Scanning Sector (Radar Sweep)
        const sectorGeometry = new THREE.CircleGeometry(3.5, 32, 0, Math.PI / 4);
        const sectorMaterial = new THREE.MeshBasicMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const radarSweep = new THREE.Mesh(sectorGeometry, sectorMaterial);
        radarSweep.rotation.x = Math.PI / 2;
        ringsGroup.add(radarSweep);

        // 3. Drone Swarm (Particles)
        const particleCount = 200;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const r = 2 + Math.random() * 3;
            const y = (Math.random() - 0.5) * 4;

            positions[i * 3] = r * Math.cos(theta);
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = r * Math.sin(theta);
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x3b82f6, // Blue
            size: 0.04,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        // Grid Floor
        const gridHelper = new THREE.GridHelper(20, 40, 0x06b6d4, 0x1e3a8a);
        gridHelper.position.y = -2;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.1;
        scene.add(gridHelper);

        // Animation Loop
        const animate = () => {
            const time = performance.now() * 0.001;

            // Rotate Shield
            shield.rotation.y = time * 0.5;
            shield.rotation.z = time * 0.2;
            core.rotation.y = -time * 0.8;
            core.rotation.x = time * 0.4;

            // Pulse Core
            const scale = 1 + Math.sin(time * 2) * 0.1;
            core.scale.setScalar(scale);

            // Radar Sweep
            radarSweep.rotation.z = -time * 1.5;
            ringsGroup.rotation.y = 0.2 * Math.sin(time * 0.1); // Gentle tilt

            // Rotate Rings
            radarRing1.rotation.z = time * 0.2;
            radarRing2.rotation.z = -time * 0.15;

            // Move Particles
            particles.rotation.y = time * 0.1;
            const positions = particles.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                // Bobbing effect
                positions[i * 3 + 1] += Math.sin(time + positions[i * 3]) * 0.002;
            }
            particles.geometry.attributes.position.needsUpdate = true;

            // Camera Parallax
            camera.position.x += (mouseRef.current.x * 1 - camera.position.x) * 0.05;
            camera.position.y += (0.5 + -mouseRef.current.y * 1 - camera.position.y) * 0.05;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
            animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Handlers
        const handleResize = () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationIdRef.current);
            if (rendererRef.current) {
                rendererRef.current.dispose();
                container.removeChild(rendererRef.current.domElement);
            }
            // Dispose geometries
            shieldGeometry.dispose();
            shieldMaterial.dispose();
        };

    }, []);

    return (
        <div className="relative w-full h-full min-h-[400px] flex items-center justify-center overflow-hidden">
            {/* Canvas */}
            <div ref={containerRef} className="absolute inset-0 z-0" />

            {/* Feature Orbitals */}
            <div className="relative w-[300px] h-[300px] z-10 pointer-events-none">
                {features.map((feature, idx) => {
                    const rad = (feature.angle * Math.PI) / 180;
                    const x = Math.sin(rad) * featureRadius;
                    const y = -Math.cos(rad) * featureRadius;

                    return (
                        <div
                            key={idx}
                            className="absolute left-1/2 top-1/2 flex flex-col items-center gap-1 pointer-events-auto transition-all hover:scale-110"
                            style={{
                                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                                animation: `float-${idx} ${4 + idx * 0.3}s ease-in-out infinite`
                            }}
                        >
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md border border-${feature.color}-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-slate-900/60`}
                            >
                                <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider text-${feature.color}-400 bg-black/40 px-2 py-0.5 rounded shadow-sm`}>
                                {feature.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Central Badge Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
                <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 flex items-center justify-center animate-ping opacity-20" />
            </div>

            <style>{`
                @keyframes float-0 { 0%, 100% { transform: translate(-50%, -50%) translate(0, -${featureRadius}px) translateY(0); } 50% { transform: translate(-50%, -50%) translate(0, -${featureRadius}px) translateY(-8px); } }
                ${features.map((f, i) => `
                    @keyframes float-${i} {
                        0%, 100% { transform: translate(-50%, -50%) translate(${Math.sin(f.angle * Math.PI / 180) * featureRadius}px, ${-Math.cos(f.angle * Math.PI / 180) * featureRadius}px) translateY(0); }
                        50% { transform: translate(-50%, -50%) translate(${Math.sin(f.angle * Math.PI / 180) * featureRadius}px, ${-Math.cos(f.angle * Math.PI / 180) * featureRadius}px) translateY(-${6 + (i % 3) * 2}px); }
                    }
                `).join('')}
            `}</style>
        </div>
    );
};

export default PoliceHologram;
