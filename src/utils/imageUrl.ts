/**
 * Ask for images at the size they're actually drawn.
 * ──────────────────────────────────────────────────
 * A product card renders a ~248px thumbnail, but was downloading the full
 * 800–1080px original — several hundred KB per card, times every card in the
 * grid. Nothing about the stored file changes here; we just request a smaller
 * rendition where the host can produce one.
 *
 * Two kinds of URL show up in this app:
 *
 *   • Unsplash (seed/demo data) — resizes on demand via query params, so a
 *     card can ask for exactly what it needs.
 *   • Our own storage (S3/LocalStack) — serves a fixed object. Uploads now
 *     also write a smaller `<key>_thumb.jpg` next to the original, so lists
 *     can use that instead. See THUMB_SUFFIX and uploadFile().
 */

import { useState, useCallback, useEffect } from 'react';

/** Suffix for the small rendition written alongside each upload. */
export const THUMB_SUFFIX = '_thumb';

/** Anything wider than this is treated as "full size, don't substitute". */
const THUMB_MAX_WIDTH = 500;

function isOurStorage(url: string): boolean {
  return url.includes('/ecommerce-media-bucket') || /\.s3[.-][^/]*\.amazonaws\.com/.test(url);
}

/**
 * A URL for `url` suited to being displayed at `width` logical pixels.
 * Falls back to the original whenever we can't do better, so it is always
 * safe to call.
 */
export function sizedImageUrl(url: string | null | undefined, width: number): string {
  if (!url) return '';

  // Request ~2x for high-DPI screens, but never upscale past a sane ceiling.
  const target = Math.min(Math.round(width * 2), 1600);

  // ── Unsplash: rewrite the sizing params it already understands ──
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('w', String(target));
      u.searchParams.set('q', '75');
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      return u.toString();
    } catch {
      return url;
    }
  }

  // ── Our storage: use the thumbnail rendition for small slots ──
  //
  // The suffix goes before a hardcoded `.jpg`, not before the original
  // extension: uploadThumbnail() re-encodes every rendition as JPEG regardless
  // of the source format, so a `photo.png` original has a `photo_thumb.jpg`
  // beside it. Reusing the original extension produced `photo_thumb.png`,
  // a URL that can never exist — every non-JPEG product image 404'd.
  if (isOurStorage(url) && width <= THUMB_MAX_WIDTH) {
    const dot = url.lastIndexOf('.');
    if (dot > 0 && !url.slice(0, dot).endsWith(THUMB_SUFFIX)) {
      return `${url.slice(0, dot)}${THUMB_SUFFIX}.jpg`;
    }
  }

  return url;
}

/**
 * `sizedImageUrl` with automatic fall-back to the original.
 *
 * The thumbnail rendition only exists for images uploaded after uploadFile()
 * started writing one, and the write is best-effort even now. Pointing an
 * <Image> straight at the derived URL therefore turns every older product into
 * a blank tile. Wire `onError` up and a missing thumbnail costs one failed
 * request instead of the picture.
 */
export function useSizedImage(url: string | null | undefined, width: number) {
  const sized = sizedImageUrl(url, width);
  const [failed, setFailed] = useState(false);

  // A new product scrolled into a recycled card deserves a fresh attempt.
  useEffect(() => setFailed(false), [sized]);

  const onError = useCallback(() => setFailed(true), []);

  return {
    uri: failed ? (url ?? '') : sized,
    onError,
    /** True once we've given up on the thumbnail and are showing the original. */
    isOriginal: failed,
  };
}
