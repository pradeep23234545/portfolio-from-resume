'use client';

import { useEffect } from 'react';

/** Sends one page-view event for the portfolio's Analytics page. Renders nothing. */
export function ViewTracker({ portfolioId }: { portfolioId: string }) {
    useEffect(() => {
        const body = JSON.stringify({
            portfolioId,
            path: window.location.pathname,
            referrer: document.referrer || null,
        });
        fetch('/api/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true })
            .catch(() => { /* analytics must never break the page */ });
    }, [portfolioId]);
    return null;
}
