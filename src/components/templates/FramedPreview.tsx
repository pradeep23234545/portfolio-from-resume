'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Copies the app's stylesheets into the frame (replacing earlier copies) */
function copyStyles(doc: Document) {
    doc.head.querySelectorAll('[data-copied-style]').forEach(n => n.remove());
    document.head.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
        const clone = node.cloneNode(true) as HTMLElement;
        clone.setAttribute('data-copied-style', '');
        doc.head.appendChild(clone);
    });
}

/** Writes an empty page into the frame with the app's fonts and styles; returns a cleanup function */
function prepareFrame(doc: Document, onReady: (body: HTMLElement) => void) {
    doc.open();
    doc.write('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"></body></html>');
    doc.close();
    // Same fonts/CSS variables as the app (next/font puts its classes on <html>/<body>)
    doc.documentElement.className = document.documentElement.className;
    doc.body.className = document.body.className;
    copyStyles(doc);
    onReady(doc.body);

    // Dev mode adds or replaces styles as files change; keep the frame in sync
    const observer = new MutationObserver(() => copyStyles(doc));
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
}

/**
 * Renders children inside an iframe so the portfolio's responsive (md:/lg:) styles
 * react to the frame's width, not the editor window's.
 */
export function FramedPreview({ children, className = '', title = 'Portfolio preview' }: { children: ReactNode; className?: string; title?: string }) {
    const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
    const [body, setBody] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const doc = frame?.contentDocument;
        return doc ? prepareFrame(doc, setBody) : undefined;
    }, [frame]);

    return (
        <iframe ref={setFrame} title={title} className={`block border-0 ${className}`}>
            {body && createPortal(children, body)}
        </iframe>
    );
}
