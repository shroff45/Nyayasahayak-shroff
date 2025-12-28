import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import './TargetCursor.css';

export interface TargetCursorProps {
    targetSelector?: string;
    spinDuration?: number;
    hideDefaultCursor?: boolean;
    hoverDuration?: number;
    parallaxOn?: boolean;
}

const TargetCursor: React.FC<TargetCursorProps> = ({
    targetSelector = '.cursor-target',
    spinDuration = 2,
    hideDefaultCursor = true,
    hoverDuration = 0.2,
    parallaxOn = true
}) => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null);
    const spinTl = useRef<gsap.core.Timeline | null>(null);
    const dotRef = useRef<HTMLDivElement>(null);

    const isActiveRef = useRef(false);
    const targetCornerPositionsRef = useRef<{ x: number; y: number }[] | null>(null);
    const tickerFnRef = useRef<(() => void) | null>(null);
    const activeStrengthRef = useRef({ current: 0 });

    const isMobile = useMemo(() => {
        if (typeof window === 'undefined') return false;
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        const isMobileUserAgent = mobileRegex.test(userAgent.toLowerCase());
        return (hasTouchScreen && isSmallScreen) || isMobileUserAgent;
    }, []);

    const constants = useMemo(() => ({ borderWidth: 3, cornerSize: 12 }), []);

    const moveCursor = useCallback((x: number, y: number) => {
        if (!cursorRef.current) return;
        gsap.to(cursorRef.current, { x, y, duration: 0.1, ease: 'power3.out' });
    }, []);

    useEffect(() => {
        if (isMobile || !cursorRef.current) return;

        const originalCursor = document.body.style.cursor;
        if (hideDefaultCursor) {
            document.body.style.cursor = 'none';
        }

        const cursor = cursorRef.current;
        cornersRef.current = cursor.querySelectorAll<HTMLDivElement>('.target-cursor-corner');

        let activeTarget: Element | null = null;
        let currentLeaveHandler: (() => void) | null = null;
        let resumeTimeout: ReturnType<typeof setTimeout> | null = null;

        const cleanupTarget = (target: Element) => {
            if (currentLeaveHandler) {
                target.removeEventListener('mouseleave', currentLeaveHandler);
            }
            currentLeaveHandler = null;
        };

        gsap.set(cursor, {
            xPercent: -50,
            yPercent: -50,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });

        const createSpinTimeline = () => {
            if (spinTl.current) {
                spinTl.current.kill();
            }
            spinTl.current = gsap
                .timeline({ repeat: -1 })
                .to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
        };

        createSpinTimeline();

        const tickerFn = () => {
            const cursorEl = cursorRef.current;
            const cornersList = cornersRef.current;
            if (!targetCornerPositionsRef.current || !cursorEl || !cornersList) {
                return;
            }
            const strength = activeStrengthRef.current.current;
            if (strength === 0) return;
            const cursorX = gsap.getProperty(cursorEl, 'x') as number;
            const cursorY = gsap.getProperty(cursorEl, 'y') as number;
            const corners = Array.from(cornersList);
            corners.forEach((corner, i) => {
                const currentX = gsap.getProperty(corner, 'x') as number;
                const currentY = gsap.getProperty(corner, 'y') as number;
                const targetPos = targetCornerPositionsRef.current?.[i];
                if (!targetPos) return;

                const targetX = targetPos.x - cursorX;
                const targetY = targetPos.y - cursorY;
                const finalX = currentX + (targetX - currentX) * strength;
                const finalY = currentY + (targetY - currentY) * strength;
                const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;
                gsap.to(corner, {
                    x: finalX,
                    y: finalY,
                    duration: duration,
                    ease: duration === 0 ? 'none' : 'power1.out',
                    overwrite: 'auto'
                });
            });
        };

        tickerFnRef.current = tickerFn;

        const moveHandler = (e: MouseEvent) => moveCursor(e.clientX, e.clientY);
        window.addEventListener('mousemove', moveHandler);

        const scrollHandler = () => {
            const cursorEl = cursorRef.current;
            if (!activeTarget || !cursorEl) return;
            const mouseX = gsap.getProperty(cursorEl, 'x') as number;
            const mouseY = gsap.getProperty(cursorEl, 'y') as number;
            const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
            const isStillOverTarget =
                elementUnderMouse &&
                (elementUnderMouse === activeTarget || elementUnderMouse.closest(targetSelector) === activeTarget);
            if (!isStillOverTarget) {
                currentLeaveHandler?.();
            }
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });

        const mouseDownHandler = () => {
            const cursorEl = cursorRef.current;
            if (!dotRef.current || !cursorEl) return;
            gsap.to(dotRef.current, { scale: 0.7, duration: 0.3 });
            gsap.to(cursorEl, { scale: 0.9, duration: 0.2 });
        };

        const mouseUpHandler = () => {
            const cursorEl = cursorRef.current;
            if (!dotRef.current || !cursorEl) return;
            gsap.to(dotRef.current, { scale: 1, duration: 0.3 });
            gsap.to(cursorEl, { scale: 1, duration: 0.2 });
        };

        window.addEventListener('mousedown', mouseDownHandler);
        window.addEventListener('mouseup', mouseUpHandler);

        const enterHandler = (e: MouseEvent) => {
            const directTarget = e.target as Element;
            const allTargets: Element[] = [];
            let current: Element | null = directTarget;
            while (current && current !== document.body) {
                if (current.matches(targetSelector)) {
                    allTargets.push(current);
                }
                current = current.parentElement;
            }
            const target = allTargets[0] || null;
            const cursorEl = cursorRef.current;
            const cornersList = cornersRef.current;

            if (!target || !cursorEl || !cornersList) return;
            if (activeTarget === target) return;
            if (activeTarget) {
                cleanupTarget(activeTarget);
            }
            if (resumeTimeout) {
                clearTimeout(resumeTimeout);
                resumeTimeout = null;
            }

            activeTarget = target;
            const corners = Array.from(cornersList);
            corners.forEach(corner => gsap.killTweensOf(corner));
            gsap.killTweensOf(cursorEl, 'rotation');
            spinTl.current?.pause();
            gsap.set(cursorEl, { rotation: 0 });

            const rect = target.getBoundingClientRect();
            const { borderWidth, cornerSize } = constants;
            const cursorX = gsap.getProperty(cursorEl, 'x') as number;
            const cursorY = gsap.getProperty(cursorEl, 'y') as number;

            targetCornerPositionsRef.current = [
                { x: rect.left - borderWidth, y: rect.top - borderWidth },
                { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
                { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
                { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize }
            ];

            isActiveRef.current = true;
            gsap.ticker.add(tickerFnRef.current!);

            gsap.to(activeStrengthRef.current, { current: 1, duration: hoverDuration, ease: 'power2.out' });

            corners.forEach((corner, i) => {
                const targetPos = targetCornerPositionsRef.current?.[i];
                if (!targetPos) return;
                gsap.to(corner, {
                    x: targetPos.x - cursorX,
                    y: targetPos.y - cursorY,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });

            const leaveHandler = () => {
                if (tickerFnRef.current) gsap.ticker.remove(tickerFnRef.current);
                isActiveRef.current = false;
                targetCornerPositionsRef.current = null;
                gsap.set(activeStrengthRef.current, { current: 0, overwrite: true });
                activeTarget = null;
                if (cornersRef.current) {
                    const corners = Array.from(cornersRef.current);
                    gsap.killTweensOf(corners);
                    const { cornerSize } = constants;
                    const positions = [
                        { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
                        { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
                        { x: cornerSize * 0.5, y: cornerSize * 0.5 },
                        { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
                    ];
                    const tl = gsap.timeline();
                    corners.forEach((corner, index) => {
                        tl.to(corner, { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: 'power3.out' }, 0);
                    });
                }
                resumeTimeout = setTimeout(() => {
                    const cursorEl = cursorRef.current;
                    if (!activeTarget && cursorEl && spinTl.current) {
                        const currentRotation = gsap.getProperty(cursorEl, 'rotation') as number;
                        const normalizedRotation = currentRotation % 360;
                        spinTl.current.kill();
                        spinTl.current = gsap
                            .timeline({ repeat: -1 })
                            .to(cursorEl, { rotation: '+=360', duration: spinDuration, ease: 'none' });
                        gsap.to(cursorEl, {
                            rotation: normalizedRotation + 360,
                            duration: spinDuration * (1 - normalizedRotation / 360),
                            ease: 'none',
                            onComplete: () => {
                                spinTl.current?.restart();
                            }
                        });
                    }
                    resumeTimeout = null;
                }, 50);
                cleanupTarget(target);
            };
            currentLeaveHandler = leaveHandler;
            target.addEventListener('mouseleave', leaveHandler);
        };

        window.addEventListener('mouseover', enterHandler as EventListener);

        return () => {
            if (tickerFnRef.current) {
                gsap.ticker.remove(tickerFnRef.current);
            }
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseover', enterHandler as EventListener);
            window.removeEventListener('scroll', scrollHandler);
            window.removeEventListener('mousedown', mouseDownHandler);
            window.removeEventListener('mouseup', mouseUpHandler);
            if (activeTarget) {
                cleanupTarget(activeTarget);
            }
            spinTl.current?.kill();
            document.body.style.cursor = originalCursor;
            isActiveRef.current = false;
            targetCornerPositionsRef.current = null;
            activeStrengthRef.current.current = 0;
        };
    }, [targetSelector, spinDuration, moveCursor, constants, hideDefaultCursor, isMobile, hoverDuration, parallaxOn]);

    useEffect(() => {
        if (isMobile || !cursorRef.current || !spinTl.current) return;
        if (spinTl.current.isActive()) {
            spinTl.current.kill();
            spinTl.current = gsap
                .timeline({ repeat: -1 })
                .to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' });
        }
    }, [spinDuration, isMobile]);

    if (isMobile) {
        return null;
    }

    return (
        <div ref={cursorRef} className="target-cursor-wrapper">
            <div ref={dotRef} className="target-cursor-dot" />
            <div className="target-cursor-corner corner-tl" />
            <div className="target-cursor-corner corner-tr" />
            <div className="target-cursor-corner corner-br" />
            <div className="target-cursor-corner corner-bl" />
        </div>
    );
};

export default TargetCursor;
