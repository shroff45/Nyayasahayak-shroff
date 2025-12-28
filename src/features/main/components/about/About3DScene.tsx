import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { supportsWebGL, trackAboutEvent } from '../../../../services/analytics';
import StaticHeroFallback from './StaticHeroFallback';

/**
 * About3DScene - Interactive Three.js visualization with graceful fallbacks
 * 
 * Features:
 * - Floating geometric scales of justice (abstract, not cliché)
 * - Orbiting data nodes representing interconnected cases
 * - Subtle particle field for AI/tech feel
 * - Mouse parallax for interactivity
 * - Graceful fallback for no WebGL or reduced motion
 */
const About3DScene: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const frameRef = useRef<number>(0);
    const mouseRef = useRef({ x: 0, y: 0 });

    const prefersReducedMotion = useReducedMotion();
    const webGLSupported = useMemo(() => supportsWebGL(), []);

    // Determine if we should show 3D
    const shouldShow3D = webGLSupported && !prefersReducedMotion && window.innerWidth >= 768;

    useEffect(() => {
        if (!shouldShow3D || !containerRef.current) {
            if (!webGLSupported) {
                trackAboutEvent({ type: 'webgl_fallback_triggered' });
            }
            return;
        }

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.z = 5;
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'low-power' // Optimize for battery
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x4AA3FF, 0.4);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x9A4DFF, 0.8, 100);
        pointLight1.position.set(5, 5, 5);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x2BE7B8, 0.6, 100);
        pointLight2.position.set(-5, -5, 5);
        scene.add(pointLight2);

        // Create abstract geometric scales
        const scalesGroup = new THREE.Group();

        // Central pillar (cylinder)
        const pillarGeometry = new THREE.CylinderGeometry(0.08, 0.1, 1.5, 8);
        const metalMaterial = new THREE.MeshPhongMaterial({
            color: 0x4AA3FF,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        const pillar = new THREE.Mesh(pillarGeometry, metalMaterial);
        pillar.position.y = -0.25;
        scalesGroup.add(pillar);

        // Balance beam
        const beamGeometry = new THREE.BoxGeometry(2.5, 0.08, 0.08);
        const beam = new THREE.Mesh(beamGeometry, metalMaterial);
        beam.position.y = 0.5;
        scalesGroup.add(beam);

        // Scale pans (torus for modern look)
        const panGeometry = new THREE.TorusGeometry(0.25, 0.04, 8, 24);
        const panMaterial = new THREE.MeshPhongMaterial({
            color: 0x2BE7B8,
            shininess: 80,
            transparent: true,
            opacity: 0.85
        });

        const leftPan = new THREE.Mesh(panGeometry, panMaterial);
        leftPan.position.set(-1, 0.2, 0);
        leftPan.rotation.x = Math.PI / 2;
        scalesGroup.add(leftPan);

        const rightPan = new THREE.Mesh(panGeometry, panMaterial);
        rightPan.position.set(1, 0.2, 0);
        rightPan.rotation.x = Math.PI / 2;
        scalesGroup.add(rightPan);

        // Connecting chains (lines)
        const chainMaterial = new THREE.LineBasicMaterial({ color: 0x9A4DFF, transparent: true, opacity: 0.6 });

        const leftChainGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1.15, 0.5, 0),
            new THREE.Vector3(-1, 0.2, 0)
        ]);
        const leftChain = new THREE.Line(leftChainGeometry, chainMaterial);
        scalesGroup.add(leftChain);

        const rightChainGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(1.15, 0.5, 0),
            new THREE.Vector3(1, 0.2, 0)
        ]);
        const rightChain = new THREE.Line(rightChainGeometry, chainMaterial);
        scalesGroup.add(rightChain);

        scene.add(scalesGroup);

        // Orbiting data nodes
        const nodeGeometry = new THREE.IcosahedronGeometry(0.08, 0);
        const nodeMaterial = new THREE.MeshPhongMaterial({
            color: 0x9A4DFF,
            emissive: 0x9A4DFF,
            emissiveIntensity: 0.3
        });

        const nodes: THREE.Mesh[] = [];
        const nodeCount = window.innerWidth < 1024 ? 5 : 8;

        for (let i = 0; i < nodeCount; i++) {
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
            const angle = (i / nodeCount) * Math.PI * 2;
            const radius = 2 + Math.random() * 0.5;
            node.position.x = Math.cos(angle) * radius;
            node.position.y = (Math.random() - 0.5) * 1.5;
            node.position.z = Math.sin(angle) * radius * 0.5;
            node.userData = { angle, radius, speed: 0.2 + Math.random() * 0.3 };
            scene.add(node);
            nodes.push(node);
        }

        // Particle field
        const particleCount = window.innerWidth < 1024 ? 30 : 60;
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 10;
            positions[i + 1] = (Math.random() - 0.5) * 6;
            positions[i + 2] = (Math.random() - 0.5) * 5;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            color: 0x4AA3FF,
            size: 0.03,
            transparent: true,
            opacity: 0.6
        });
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        // Mouse move handler
        const handleMouseMove = (event: MouseEvent) => {
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        let time = 0;
        const animate = () => {
            time += 0.01;

            // Gentle scales oscillation
            scalesGroup.rotation.y = Math.sin(time * 0.5) * 0.1 + mouseRef.current.x * 0.1;
            scalesGroup.rotation.x = Math.sin(time * 0.3) * 0.05 + mouseRef.current.y * 0.05;

            // Subtle balance beam tilt
            beam.rotation.z = Math.sin(time * 0.7) * 0.03;
            leftPan.position.y = 0.2 + Math.sin(time * 0.7) * 0.05;
            rightPan.position.y = 0.2 - Math.sin(time * 0.7) * 0.05;

            // Orbit nodes
            nodes.forEach(node => {
                const { angle, radius, speed } = node.userData;
                const newAngle = angle + time * speed;
                node.position.x = Math.cos(newAngle) * radius;
                node.position.z = Math.sin(newAngle) * radius * 0.5;
                node.rotation.x += 0.02;
                node.rotation.y += 0.02;
            });

            // Subtle particle drift
            particles.rotation.y += 0.001;

            // Camera subtle movement (parallax)
            camera.position.x += (mouseRef.current.x * 0.3 - camera.position.x) * 0.05;
            camera.position.y += (mouseRef.current.y * 0.3 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
            frameRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Resize handler
        const handleResize = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameRef.current);

            if (rendererRef.current && containerRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
                rendererRef.current.dispose();
            }
        };
    }, [shouldShow3D, webGLSupported]);

    // Show fallback for non-WebGL, reduced motion, or mobile
    if (!shouldShow3D) {
        return (
            <div className="w-full h-[300px] md:h-[400px] relative">
                <StaticHeroFallback />
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-[300px] md:h-[400px] relative"
            role="img"
            aria-label="Interactive 3D visualization of scales of justice representing AI-powered judicial intelligence"
            onMouseEnter={() => trackAboutEvent({ type: '3d_scene_interaction', action: 'hover' })}
        />
    );
};

export default About3DScene;
