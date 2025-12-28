// src/shared/components/3d/JusticeOrb.tsx
// NyayaSahayak - Premium 3D Justice Orb Component
// Pure Three.js implementation for maximum compatibility

import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
    Shield, Heart, FileText, Building2,
    Users, ShieldCheck, BookOpen, Gavel, Scale
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Feature {
    icon: React.ElementType;
    label: string;
    angle: number;
    labelSide: 'left' | 'right';
}

// ============================================================================
// MAIN COMPONENT - 3D Justice Orb
// ============================================================================

const JusticeOrb: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const animationIdRef = useRef<number>(0);
    const mouseRef = useRef({ x: 0, y: 0 });

    // Feature data
    const features: Feature[] = [
        { icon: Shield, label: 'Protection', angle: -55, labelSide: 'left' },
        { icon: Heart, label: 'Welfare', angle: 30, labelSide: 'right' },
        { icon: FileText, label: 'Rights', angle: -100, labelSide: 'left' },
        { icon: Building2, label: 'Constitution', angle: 70, labelSide: 'right' },
        { icon: Users, label: 'Democracy', angle: -145, labelSide: 'left' },
        { icon: ShieldCheck, label: 'Equality', angle: 115, labelSide: 'right' },
        { icon: BookOpen, label: 'Knowledge', angle: 175, labelSide: 'left' },
        { icon: Gavel, label: 'Authority', angle: 140, labelSide: 'right' },
    ];

    const featureRadius = 200;

    // Initialize Three.js scene
    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        camera.position.z = 8;
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x14b8a6, 0.3);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x14b8a6, 2, 20);
        pointLight1.position.set(0, 0, 0);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x3b82f6, 0.5, 15);
        pointLight2.position.set(-5, 3, -3);
        scene.add(pointLight2);

        const pointLight3 = new THREE.PointLight(0x2dd4bf, 0.5, 15);
        pointLight3.position.set(5, -3, -3);
        scene.add(pointLight3);

        // Main sphere - outer glow
        const outerGlowGeometry = new THREE.SphereGeometry(1.8, 64, 64);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x14b8a6,
            transparent: true,
            opacity: 0.03,
            side: THREE.BackSide
        });
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        scene.add(outerGlow);

        // Second glow layer
        const glowGeometry = new THREE.SphereGeometry(1.5, 64, 64);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x14b8a6,
            transparent: true,
            opacity: 0.06,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        scene.add(glow);

        // Main glass sphere
        const sphereGeometry = new THREE.SphereGeometry(1.2, 128, 128);
        const sphereMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0d9488,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.7,
            thickness: 2,
            envMapIntensity: 1,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            transparent: true,
            opacity: 0.85
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(sphere);

        // Inner glowing core
        const innerGeometry = new THREE.SphereGeometry(0.7, 32, 32);
        const innerMaterial = new THREE.MeshStandardMaterial({
            color: 0x2dd4bf,
            emissive: 0x14b8a6,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.7
        });
        const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
        scene.add(innerSphere);

        // Bright center
        const centerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const centerMaterial = new THREE.MeshBasicMaterial({
            color: 0x5eead4,
            transparent: true,
            opacity: 0.9
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        scene.add(center);

        // Orbiting rings group
        const ringsGroup = new THREE.Group();
        scene.add(ringsGroup);

        // Outer ring with dots
        const outerRing = new THREE.Group();
        const outerRingGeometry = new THREE.TorusGeometry(1.8, 0.012, 16, 100);
        const outerRingMaterial = new THREE.MeshStandardMaterial({
            color: 0x14b8a6,
            emissive: 0x14b8a6,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.5
        });
        const outerRingMesh = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        outerRingMesh.rotation.x = Math.PI / 2;
        outerRing.add(outerRingMesh);

        // Add dots to outer ring
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dotGeometry = new THREE.SphereGeometry(0.07, 16, 16);
            const dotMaterial = new THREE.MeshStandardMaterial({
                color: 0x2dd4bf,
                emissive: 0x14b8a6,
                emissiveIntensity: 1.5
            });
            const dot = new THREE.Mesh(dotGeometry, dotMaterial);
            dot.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0);
            outerRing.add(dot);
        }
        ringsGroup.add(outerRing);

        // Inner ring with dots
        const innerRing = new THREE.Group();
        const innerRingGeometry = new THREE.TorusGeometry(1.5, 0.008, 16, 100);
        const innerRingMaterial = new THREE.MeshStandardMaterial({
            color: 0x14b8a6,
            emissive: 0x14b8a6,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.6
        });
        const innerRingMesh = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        innerRingMesh.rotation.x = Math.PI / 2;
        innerRing.add(innerRingMesh);

        // Add dots to inner ring
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const dotGeometry = new THREE.SphereGeometry(0.04, 16, 16);
            const dotMaterial = new THREE.MeshStandardMaterial({
                color: 0x2dd4bf,
                emissive: 0x14b8a6,
                emissiveIntensity: 1
            });
            const dot = new THREE.Mesh(dotGeometry, dotMaterial);
            dot.position.set(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0);
            innerRing.add(dot);
        }
        innerRing.rotation.set(0.2, 0.1, 0);
        ringsGroup.add(innerRing);

        // Decorative rings
        const decoRing1Geometry = new THREE.TorusGeometry(2.1, 0.005, 16, 100);
        const decoRing1Material = new THREE.MeshStandardMaterial({
            color: 0x14b8a6,
            emissive: 0x14b8a6,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.3
        });
        const decoRing1 = new THREE.Mesh(decoRing1Geometry, decoRing1Material);
        decoRing1.rotation.x = Math.PI / 2;
        ringsGroup.add(decoRing1);

        const decoRing2Geometry = new THREE.TorusGeometry(1.65, 0.004, 16, 100);
        const decoRing2Material = new THREE.MeshStandardMaterial({
            color: 0x14b8a6,
            transparent: true,
            opacity: 0.25
        });
        const decoRing2 = new THREE.Mesh(decoRing2Geometry, decoRing2Material);
        decoRing2.rotation.set(Math.PI / 2 - 0.15, 0.2, 0);
        ringsGroup.add(decoRing2);

        // Floating particles
        const particleCount = 150;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 3.5 + Math.random() * 3;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            const colorMix = Math.random();
            colors[i * 3] = 0.1 + colorMix * 0.2;
            colors[i * 3 + 1] = 0.55 + colorMix * 0.25;
            colors[i * 3 + 2] = 0.6 + colorMix * 0.35;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        // Animation loop
        const animate = () => {
            const time = performance.now() * 0.001;

            // Sphere animations
            sphere.rotation.y = time * 0.1;
            innerSphere.rotation.y = time * 0.2;
            innerSphere.rotation.x = Math.sin(time * 0.3) * 0.1;

            // Glow pulsing
            const glowScale = 1 + Math.sin(time * 0.8) * 0.05;
            glow.scale.setScalar(glowScale);
            outerGlow.scale.setScalar(1.1 + Math.sin(time * 0.5) * 0.08);

            // Ring rotations
            outerRing.rotation.z = -time * 0.15;
            innerRing.rotation.z = time * 0.12;
            decoRing1.rotation.z = time * 0.1;
            decoRing2.rotation.z = -time * 0.08;

            // Particle animations
            const posArray = particles.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < posArray.length; i += 3) {
                posArray[i + 1] += Math.sin(time * 0.3 + i) * 0.001;
            }
            particles.geometry.attributes.position.needsUpdate = true;
            particles.rotation.y = time * 0.02;
            particles.rotation.x = Math.sin(time * 0.1) * 0.05;

            // Subtle camera movement based on mouse
            camera.position.x += (mouseRef.current.x * 0.5 - camera.position.x) * 0.02;
            camera.position.y += (-mouseRef.current.y * 0.5 - camera.position.y) * 0.02;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
            animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };

        // Handle mouse move for parallax
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationIdRef.current);

            if (rendererRef.current) {
                rendererRef.current.dispose();
                container.removeChild(rendererRef.current.domElement);
            }

            // Dispose geometries and materials
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (object.material instanceof THREE.Material) {
                        object.material.dispose();
                    }
                }
            });
        };
    }, []);

    return (
        <div className="relative w-full h-full min-h-[450px] flex items-center justify-center">
            {/* Three.js canvas container */}
            <div
                ref={containerRef}
                className="absolute inset-0 z-0"
                style={{ background: 'transparent' }}
            />

            {/* Feature Icons - Rendered as React components on top */}
            <div className="relative w-[260px] h-[260px] z-10 pointer-events-none">
                {features.map((feature, idx) => {
                    const rad = (feature.angle * Math.PI) / 180;
                    const x = Math.sin(rad) * featureRadius;
                    const y = -Math.cos(rad) * featureRadius;

                    return (
                        <div
                            key={idx}
                            className="absolute left-1/2 top-1/2 flex items-center gap-2 pointer-events-auto transition-transform hover:scale-110"
                            style={{
                                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                                animation: `float-${idx} ${3 + idx * 0.2}s ease-in-out infinite`
                            }}
                        >
                            {feature.labelSide === 'left' && (
                                <span className="text-[11px] font-medium text-teal-400 whitespace-nowrap tracking-wide drop-shadow-lg">
                                    {feature.label}
                                </span>
                            )}

                            <div
                                className="w-[38px] h-[38px] rounded-full flex items-center justify-center backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-[0_0_25px_rgba(20,184,166,0.5)]"
                                style={{
                                    background: 'rgba(15, 23, 42, 0.8)',
                                    border: '1.5px solid rgba(20, 184, 166, 0.6)',
                                    boxShadow: '0 0 15px rgba(20, 184, 166, 0.2), inset 0 0 10px rgba(20, 184, 166, 0.05)'
                                }}
                            >
                                <feature.icon className="w-[18px] h-[18px] text-teal-400" strokeWidth={1.5} />
                            </div>

                            {feature.labelSide === 'right' && (
                                <span className="text-[11px] font-medium text-teal-400 whitespace-nowrap tracking-wide drop-shadow-lg">
                                    {feature.label}
                                </span>
                            )}
                        </div>
                    );
                })}

                {/* Central Scale Icon */}
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                        background: 'rgba(20, 184, 166, 0.2)',
                        boxShadow: '0 0 40px rgba(20, 184, 166, 0.4), inset 0 0 20px rgba(20, 184, 166, 0.2)'
                    }}
                >
                    <Scale className="w-8 h-8 text-white drop-shadow-lg" strokeWidth={1.5} />
                </div>
            </div>

            {/* AI Powered Badge */}
            <div
                className="absolute bottom-8 right-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                    background: 'rgba(15, 76, 58, 0.9)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)',
                    animation: 'pulse-badge 2s ease-in-out infinite'
                }}
            >
                <div
                    className="w-2 h-2 rounded-full bg-green-500"
                    style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.8)' }}
                />
                <span className="text-sm font-medium text-green-400">
                    AI-Powered Justice
                </span>
            </div>

            {/* Floating animation keyframes */}
            <style>{`
                @keyframes float-0 { 0%, 100% { transform: translate(-50%, -50%) translate(${Math.sin(-55 * Math.PI / 180) * featureRadius}px, ${-Math.cos(-55 * Math.PI / 180) * featureRadius}px) translateY(0); } 50% { transform: translate(-50%, -50%) translate(${Math.sin(-55 * Math.PI / 180) * featureRadius}px, ${-Math.cos(-55 * Math.PI / 180) * featureRadius}px) translateY(-5px); } }
                @keyframes float-1 { 0%, 100% { transform: translate(-50%, -50%) translate(${Math.sin(30 * Math.PI / 180) * featureRadius}px, ${-Math.cos(30 * Math.PI / 180) * featureRadius}px) translateY(0); } 50% { transform: translate(-50%, -50%) translate(${Math.sin(30 * Math.PI / 180) * featureRadius}px, ${-Math.cos(30 * Math.PI / 180) * featureRadius}px) translateY(-5px); } }
                @keyframes float-2 { 0%, 100% { transform: translate(-50%, -50%) translate(${Math.sin(-100 * Math.PI / 180) * featureRadius}px, ${-Math.cos(-100 * Math.PI / 180) * featureRadius}px) translateY(0); } 50% { transform: translate(-50%, -50%) translate(${Math.sin(-100 * Math.PI / 180) * featureRadius}px, ${-Math.cos(-100 * Math.PI / 180) * featureRadius}px) translateY(-5px); } }
                @keyframes float-3 { 0%, 100% { transform: translate(-50%, -50%) translate(${Math.sin(70 * Math.PI / 180) * featureRadius}px, ${-Math.cos(70 * Math.PI / 180) * featureRadius}px) translateY(0); } 50% { transform: translate(-50%, -50%) translate(${Math.sin(70 * Math.PI / 180) * featureRadius}px, ${-Math.cos(70 * Math.PI / 180) * featureRadius}px) translateY(-5px); } }
                @keyframes float-4 { 0%, 100% { transform: translate(-50%, -50%) translate(${Math.sin(-145 * Math.PI / 180) * featureRadius}px, ${-Math.cos(-145 * Math.PI / 180) * featureRadius}px) translateY(0); } 50% { transform: translate(-50%, -50%) translate(${Math.sin(-145 * Math.PI / 180) * featureRadius}px, ${-Math.cos(-145 * Math.PI / 180) * featureRadius}px) translateY(-5px); } }
                @keyframes float-5 { 0%, 100% { transform: translate(-50%, -50%) translate(${Math.sin(115 * Math.PI / 180) * featureRadius}px, ${-Math.cos(115 * Math.PI / 180) * featureRadius}px) translateY(0); } 50% { transform: translate(-50%, -50%) translate(${Math.sin(115 * Math.PI / 180) * featureRadius}px, ${-Math.cos(115 * Math.PI / 180) * featureRadius}px) translateY(-5px); } }
                @keyframes float-6 { 0%, 100% { transform: translate(-50%, -50%) translate(${Math.sin(175 * Math.PI / 180) * featureRadius}px, ${-Math.cos(175 * Math.PI / 180) * featureRadius}px) translateY(0); } 50% { transform: translate(-50%, -50%) translate(${Math.sin(175 * Math.PI / 180) * featureRadius}px, ${-Math.cos(175 * Math.PI / 180) * featureRadius}px) translateY(-5px); } }
                @keyframes float-7 { 0%, 100% { transform: translate(-50%, -50%) translate(${Math.sin(140 * Math.PI / 180) * featureRadius}px, ${-Math.cos(140 * Math.PI / 180) * featureRadius}px) translateY(0); } 50% { transform: translate(-50%, -50%) translate(${Math.sin(140 * Math.PI / 180) * featureRadius}px, ${-Math.cos(140 * Math.PI / 180) * featureRadius}px) translateY(-5px); } }
                @keyframes pulse-badge {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.9; transform: scale(1.02); }
                }
            `}</style>
        </div>
    );
};

export default JusticeOrb;
