/**
 * Service for handling dedicated Kiosk RFID URL routing, standalone mode,
 * and URL sharing for mosque attendance terminals.
 */

export function getKioskUrl(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?mode=kiosk#kiosk`;
}

export function isKioskRouteActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'kiosk' || urlParams.get('view') === 'kiosk' || urlParams.has('kiosk')) {
      return true;
    }
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('kiosk')) {
      return true;
    }
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('/kiosk') || path.includes('/kiosk/')) {
      return true;
    }
  } catch (err) {
    console.error('Error checking kiosk route:', err);
  }
  return false;
}

export function navigateToKiosk(openInNewTab: boolean = false): void {
  if (typeof window === 'undefined') return;
  const targetUrl = getKioskUrl();
  if (openInNewTab) {
    window.open(targetUrl, '_blank');
  } else {
    window.history.pushState({ mode: 'kiosk' }, '', targetUrl);
    window.dispatchEvent(new Event('kiosk-route-change'));
  }
}

export function navigateToDashboard(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    url.searchParams.delete('view');
    url.searchParams.delete('kiosk');
    url.hash = '';
    const cleanUrl = url.pathname + (url.search ? url.search : '');
    window.history.pushState({ mode: 'dashboard' }, '', cleanUrl);
    window.dispatchEvent(new Event('kiosk-route-change'));
  } catch (err) {
    console.error('Error navigating to dashboard:', err);
  }
}

export async function copyKioskUrlToClipboard(): Promise<boolean> {
  const url = getKioskUrl();
  if (!url) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // Fallback to execCommand
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Public Daily Journal URL helpers
 */
export function getPublicJournalUrl(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?view=jurnal-publik#jurnal-publik`;
}

export function isPublicJournalRouteActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'jurnal-publik' || urlParams.get('view') === 'jurnal' || urlParams.has('jurnal-publik')) {
      return true;
    }
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('jurnal-publik') || hash.includes('jurnal')) {
      return true;
    }
  } catch (err) {
    console.error('Error checking public journal route:', err);
  }
  return false;
}

export function navigateToPublicJournal(openInNewTab: boolean = false): void {
  if (typeof window === 'undefined') return;
  const targetUrl = getPublicJournalUrl();
  if (openInNewTab) {
    window.open(targetUrl, '_blank');
  } else {
    window.history.pushState({ view: 'jurnal-publik' }, '', targetUrl);
    window.dispatchEvent(new Event('kiosk-route-change'));
  }
}

export async function copyPublicJournalUrlToClipboard(): Promise<boolean> {
  const url = getPublicJournalUrl();
  if (!url) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Public Daily Ranking (Leaderboard) URL helpers
 */
export function getDailyRankingUrl(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?view=peringkat-harian#peringkat-harian`;
}

export function isDailyRankingRouteActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view')?.toLowerCase();
    if (
      view === 'peringkat-harian' || 
      view === 'peringkat' || 
      view === 'ranking' || 
      view === 'leaderboard' || 
      urlParams.has('peringkat-harian')
    ) {
      return true;
    }
    const hash = window.location.hash.toLowerCase();
    if (
      hash.includes('peringkat-harian') || 
      hash.includes('ranking-harian') || 
      hash.includes('leaderboard-harian') ||
      hash === '#peringkat'
    ) {
      return true;
    }
  } catch (err) {
    console.error('Error checking daily ranking route:', err);
  }
  return false;
}

export function navigateToDailyRanking(openInNewTab: boolean = false): void {
  if (typeof window === 'undefined') return;
  const targetUrl = getDailyRankingUrl();
  if (openInNewTab) {
    window.open(targetUrl, '_blank');
  } else {
    window.history.pushState({ view: 'peringkat-harian' }, '', targetUrl);
    window.dispatchEvent(new Event('kiosk-route-change'));
  }
}

export async function copyDailyRankingUrlToClipboard(): Promise<boolean> {
  const url = getDailyRankingUrl();
  if (!url) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
