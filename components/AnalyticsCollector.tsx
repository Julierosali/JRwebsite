'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';

const SESSION_KEY = 'jr_analytics_session';
const PAGE_START_KEY = 'jr_analytics_page_start';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let s = sessionStorage.getItem(SESSION_KEY);
  if (!s) {
    s = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, s);
  }
  return s;
}

function getUa(): { browser: string; device: string; os: string } {
  if (typeof navigator === 'undefined') return { browser: '', device: '', os: '' };
  const ua = navigator.userAgent;
  let browser = 'Other';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  let device = 'desktop';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) device = 'mobile';
  let os = 'Other';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'Mac';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';
  return { browser, device, os };
}

function getElementId(el: HTMLElement, path: string): string {
  const aid = el.getAttribute('data-analytics-id');
  if (aid) return `Clic identifié|${aid.trim()}`;

  const tag = el.tagName.toLowerCase();
  const inMobileDrawer = el.closest('[data-mobile-drawer="true"]') != null;
  const menuPrefix = inMobileDrawer ? 'menu mobile' : 'menu';

  if (tag === 'a') {
    const href = (el as HTMLAnchorElement).href || '';
    if (href.startsWith('mailto:')) return `${menuPrefix}|email`;
    if (href.startsWith('tel:')) return `${menuPrefix}|tel`;
    try {
      const url = new URL(href);
      const host = url.hostname.toLowerCase();
      if (host.includes('instagram')) return `${menuPrefix}|Instagram`;
      if (host.includes('facebook')) return `${menuPrefix}|Facebook`;
      if (host.includes('twitter') || host.includes('x.com')) return `${menuPrefix}|X`;
      if (host.includes('tiktok')) return `${menuPrefix}|TikTok`;
      if (host.includes('youtube')) return `${menuPrefix}|YouTube`;
      if (host.includes('spotify')) return `${menuPrefix}|Spotify`;
      if (host.includes('soundcloud')) return `${menuPrefix}|SoundCloud`;
      if (url.origin === window.location.origin) return `${menuPrefix}|lien interne`;
      return `${menuPrefix}|lien externe`;
    } catch {
      return `${menuPrefix}|lien`;
    }
  }

  if (tag === 'button') {
    const aria = el.getAttribute('aria-label');
    if (aria) return `bouton|${aria.trim().slice(0, 80)}`;
    const text = (el.textContent || '').trim().slice(0, 80);
    return text ? `bouton|${text}` : 'bouton';
  }

  if (tag === 'img') {
    const alt = (el as HTMLImageElement).alt;
    return alt ? `image|${alt.trim().slice(0, 80)}` : 'image';
  }

  const inGallery = el.closest('[data-gallery="video"]') || el.closest('[data-gallery="photo"]');
  if (inGallery) {
    const kind = el.closest('[data-gallery="video"]') ? 'vidéo' : 'photo';
    return `galerie|${kind}`;
  }

  return 'autre';
}

async function send(
  sessionId: string,
  eventType: 'pageview' | 'click',
  path: string,
  payload: {
    element_id?: string;
    duration?: number;
    referrer?: string;
    is_authenticated: boolean;
    device?: string;
    os?: string;
    browser?: string;
  }
) {
    try {
      const res = await fetch('/api/analytics/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: eventType,
          path,
          ...payload,
        }),
      });
      if (!res.ok && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] collect API error:', res.status, await res.text());
      }
    } catch (err) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('[Analytics] collect failed:', err);
    }
  }
}

export function AnalyticsCollector() {
  const { user } = useAdmin();
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const pageStartRef = useRef<number>(Date.now());

  const sendLeave = useCallback((currentPath: string, durationMs: number) => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    send(sessionId, 'pageview', currentPath, {
      duration: Math.round(durationMs / 1000),
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      is_authenticated: false,
      ...getUa(),
    });
  }, []);

  useEffect(() => {
    if (user) return;

    const now = Date.now();
    const prevPath = prevPathRef.current;
    if (prevPath != null) {
      const start = typeof window !== 'undefined' ? (parseInt(sessionStorage.getItem(PAGE_START_KEY) || '0', 10) || now) : now;
      sendLeave(prevPath, now - start);
    }

    const sessionId = getSessionId();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(PAGE_START_KEY, String(now));
    }
    prevPathRef.current = pathname || '/';

    send(sessionId, 'pageview', pathname || '/', {
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      is_authenticated: false,
      ...getUa(),
    });
  }, [pathname, user, sendLeave]);

  useEffect(() => {
    if (user) return;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const start = parseInt(sessionStorage.getItem(PAGE_START_KEY) || '0', 10);
        if (start) sendLeave(prevPathRef.current || '/', Date.now() - start);
      }
    };
    const onBeforeUnload = () => {
      const start = parseInt(sessionStorage.getItem(PAGE_START_KEY) || '0', 10);
      if (start) sendLeave(prevPathRef.current || '/', Date.now() - start);
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [user, sendLeave]);

  useEffect(() => {
    if (user) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const el = target.closest('a, button, [data-analytics-id], img, [data-gallery]') as HTMLElement | null;
      if (!el) return;
      const sessionId = getSessionId();
      const path = pathname || '/';
      const elementId = getElementId(el, path);
      send(sessionId, 'click', path, {
        element_id: elementId,
        is_authenticated: false,
        ...getUa(),
      });
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname, user]);

  return null;
}
