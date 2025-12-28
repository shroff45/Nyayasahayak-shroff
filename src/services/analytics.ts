/**
 * Analytics Stub for About Page Interactions
 * 
 * This module provides typed event tracking for the About page.
 * Currently logs to console in development; wire to actual provider in production.
 */

export type AboutAnalyticsEvent =
    | { type: 'page_view'; section: 'about' }
    | { type: 'scroll_depth'; depth: 25 | 50 | 75 | 100 }
    | { type: 'cta_click'; button: 'explore_features' | 'sign_in' | 'get_started' }
    | { type: 'role_tab_switch'; role: 'judge' | 'police' | 'citizen' }
    | { type: 'feature_card_hover'; feature: string }
    | { type: '3d_scene_interaction'; action: 'hover' | 'fallback_triggered' }
    | { type: 'webgl_fallback_triggered' };

/**
 * Track an About page analytics event.
 * Stubs the event in development for future integration.
 */
export const trackAboutEvent = (event: AboutAnalyticsEvent): void => {
    if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics Stub]', JSON.stringify(event, null, 2));
    }
    // Future: Send to actual analytics provider
    // Example: window.gtag?.('event', event.type, event);
};

/**
 * Utility to check if WebGL is supported
 */
export const supportsWebGL = (): boolean => {
    try {
        const canvas = document.createElement('canvas');
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
    } catch (e) {
        return false;
    }
};
