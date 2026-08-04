/**
 * Google sign-in, per platform.
 * ─────────────────────────────
 * Native uses the system auth session (a real in-app browser tab). Web can't:
 * expo-web-browser's web implementation opens a popup and polls
 * `popup.closed` on an interval to decide the flow finished. Google's OAuth
 * pages now send Cross-Origin-Opener-Policy headers, which severs the
 * opener→popup relationship, so that poll throws:
 *
 *   "Cross-Origin-Opener-Policy policy would block the window.closed call."
 *
 * The promise then never resolves as a success. The user picks their account,
 * Google redirects, and the app — never told — is still sitting on the login
 * screen. That is exactly the "it bounces me back to login" symptom.
 *
 * So on web we do a full-page redirect instead of a popup. There is no opener
 * relationship to sever, COOP is irrelevant, and the token arrives as a normal
 * page load which consumePendingGoogleToken() picks up on mount.
 */
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { getGoogleLoginUrl } from '../api/auth';

/** Where to send the user once sign-in completes, across the web redirect. */
const RETURN_KEY = 'konura_google_return_to';

/**
 * Extract a session token from a redirect URL.
 *
 * The backend puts it in the fragment (#token=) so it never reaches server
 * logs or Referer headers; the query param is accepted for compatibility.
 */
export function tokenFromUrl(url: string): string | undefined {
  if (!url) return undefined;

  if (url.includes('#')) {
    const fragment = url.split('#')[1] ?? '';
    const fromHash = new URLSearchParams(fragment).get('token');
    if (fromHash) return fromHash;
  }

  const queryIndex = url.indexOf('?');
  if (queryIndex >= 0) {
    const query = url.slice(queryIndex + 1).split('#')[0];
    const fromQuery = new URLSearchParams(query).get('token');
    if (fromQuery) return fromQuery;
  }

  return undefined;
}

/**
 * Web only. If this page load is the return leg of a Google redirect, take the
 * token and scrub it from the address bar so it isn't left in history or
 * re-consumed on refresh. Returns undefined on native or an ordinary load.
 */
export function consumePendingGoogleToken(): { token: string; returnTo?: string } | undefined {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

  const token = tokenFromUrl(window.location.href);
  if (!token) return undefined;

  let returnTo: string | undefined;
  try {
    returnTo = window.sessionStorage.getItem(RETURN_KEY) ?? undefined;
    window.sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // Private mode / storage disabled — fall back to the default landing.
  }

  // Drop the token from the URL without adding a history entry.
  try {
    window.history.replaceState(null, '', window.location.pathname + window.location.search.replace(/[?&]token=[^&]*/, ''));
  } catch {
    // Non-fatal: worst case the token stays visible until the next navigation.
  }

  return { token, returnTo };
}

/**
 * Kick off Google sign-in.
 *
 * On web this navigates away and never resolves — treat any code after the
 * call as unreachable. On native it resolves with the token, or undefined if
 * the user dismissed the sheet.
 */
export async function beginGoogleSignIn(options: {
  /** Route within the app to land on afterwards, e.g. '/(auth)/login'. */
  redirectPath: string;
  /** Where to send the user once signed in. Preserved across the redirect. */
  returnTo?: string;
}): Promise<string | undefined> {
  const authUrl = await getGoogleLoginUrl();

  if (Platform.OS === 'web') {
    if (options.returnTo) {
      try {
        window.sessionStorage.setItem(RETURN_KEY, options.returnTo);
      } catch {
        // Storage unavailable — the user just lands on the default screen.
      }
    }
    window.location.assign(authUrl);
    // Navigation has been scheduled; nothing after this runs.
    return undefined;
  }

  const redirectUri = Linking.createURL(options.redirectPath);
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
  if (result.type !== 'success' || !result.url) return undefined;
  return tokenFromUrl(result.url);
}
