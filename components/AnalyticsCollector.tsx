'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';

const SESSION_KEY = 'jr_analytics_session';
const ENDPOINT = '/api/analytics/collect';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Repli (contexte non sécurisé)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getSessionId(): string {
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = uuid();
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return uuid();
  }
}

/** Détection navigateur / OS. L'ordre compte : Edge et Opera contiennent « Chrome », Android contient « Linux », iOS contient « Mac OS X ». */
export function parseUa(ua: string): { browser: string; device: string; os: string } {
  let browser = 'Other';
  if (/Edg(e|A|iOS)?\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';
  else if (/Firefox\/|FxiOS/.test(ua)) browser = 'Firefox';
  else if (/Chrome\/|CriOS/.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua)) browser = 'Safari';

  let os = 'Other';
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/.test(ua)) os = 'Mac';
  else if (/CrOS/.test(ua)) os = 'ChromeOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  let device = 'desktop';
  if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) device = 'tablet';
  else if (/Mobi|iPhone|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(ua)) device = 'mobile';
  return { browser, device, os };
}

function getElementId(el: HTMLElement): string {
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
      if (host.includes('twitter') || host === 'x.com' || host.endsWith('.x.com')) return `${menuPrefix}|X`;
      if (host.includes('tiktok')) return `${menuPrefix}|TikTok`;
      if (host.includes('youtube')) return `${menuPrefix}|YouTube`;
      if (host.includes('spotify')) return `${menuPrefix}|Spotify`;
      if (host.includes('soundcloud')) return `${menuPrefix}|SoundCloud`;
      if (host.includes('deezer')) return `${menuPrefix}|Deezer`;
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

  const gallery = el.closest('[data-gallery]');
  if (gallery) return `galerie|${gallery.getAttribute('data-gallery') === 'video' ? 'vidéo' : 'photo'}`;

  return 'autre';
}

type Payload = {
  session_id: string;
  event_type: 'pageview' | 'click';
  path: string;
  event_id?: string;
  element_id?: string;
  duration?: number;
  referrer?: string;
  browser?: string;
  device?: string;
  os?: string;
};

/** Envoi fiable, y compris à la fermeture de l'onglet (sendBeacon, sinon fetch keepalive). */
function send(payload: Payload, { beacon = false } = {}) {
  const body = JSON.stringify(payload);
  try {
    if (beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      if (navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))) return;
    }
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch {
    // statistiques : ne jamais casser le site
  }
}

type CurrentPage = { eventId: string; path: string; visibleMs: number; visibleSince: number | null };

export function AnalyticsCollector() {
  const { user, loading } = useAdmin();
  const pathname = usePathname() || '/';
  const pageRef = useRef<CurrentPage | null>(null);
  const tracking = !loading && !user;

  // Clôt la page en cours : envoie la durée (temps visible uniquement) sur la même ligne.
  const flushRef = useRef<(beacon: boolean) => void>(() => {});
  flushRef.current = (beacon: boolean) => {
    const page = pageRef.current;
    if (!page) return;
    const now = Date.now();
    const total = page.visibleMs + (page.visibleSince != null ? now - page.visibleSince : 0);
    send(
      {
        session_id: getSessionId(),
        event_type: 'pageview',
        event_id: page.eventId,
        path: page.path,
        duration: Math.round(total / 1000),
        ...getUaSafe(),
      },
      { beacon }
    );
  };

  // Nouvelle page vue à chaque changement d'URL.
  useEffect(() => {
    if (!tracking) return;
    if (pageRef.current) flushRef.current(false);
    const eventId = uuid();
    pageRef.current = {
      eventId,
      path: pathname,
      visibleMs: 0,
      visibleSince: document.visibilityState === 'visible' ? Date.now() : null,
    };
    send({
      session_id: getSessionId(),
      event_type: 'pageview',
      event_id: eventId,
      path: pathname,
      referrer: document.referrer || undefined,
      ...getUaSafe(),
    });
  }, [pathname, tracking]);

  // Onglet masqué / fermé : on met à jour la durée ; onglet de retour : on reprend le chrono.
  useEffect(() => {
    if (!tracking) return;
    const onVisibility = () => {
      const page = pageRef.current;
      if (!page) return;
      if (document.visibilityState === 'hidden') {
        if (page.visibleSince != null) {
          page.visibleMs += Date.now() - page.visibleSince;
          page.visibleSince = null;
        }
        flushRef.current(true);
      } else if (page.visibleSince == null) {
        page.visibleSince = Date.now();
      }
    };
    const onPageHide = () => flushRef.current(true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [tracking]);

  // Clics
  useEffect(() => {
    if (!tracking) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest('a, button, [data-analytics-id], img, [data-gallery]') as HTMLElement | null;
      if (!el) return;
      send({
        session_id: getSessionId(),
        event_type: 'click',
        path: pathname,
        element_id: getElementId(el),
        ...getUaSafe(),
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname, tracking]);

  // Un admin qui se connecte : on arrête de suivre la page en cours.
  useEffect(() => {
    if (user) pageRef.current = null;
  }, [user]);

  return null;
}

function getUaSafe() {
  if (typeof navigator === 'undefined') return {};
  return parseUa(navigator.userAgent);
}
