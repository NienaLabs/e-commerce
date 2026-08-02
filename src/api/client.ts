/**
 * Shared API base URL helper
 * ──────────────────────────
 * On web, Chrome/Firefox treat http://127.0.0.1 and http://localhost as
 * DIFFERENT origins, even though they resolve to the same loopback address.
 * The Expo web dev server runs on http://localhost:8081, so any fetch to
 * http://127.0.0.1 is cross-origin → CORS preflight → "Failed to fetch".
 *
 * Fix: replace 127.0.0.1 with localhost at runtime on web only.
 * The .env value is intentionally left unchanged.
 */
import { Platform } from 'react-native';

const _rawBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1';

export const API_BASE_URL: string =
  Platform.OS === 'web'
    ? _rawBase.replace('127.0.0.1', 'localhost')
    : _rawBase;
