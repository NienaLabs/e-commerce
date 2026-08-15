/**
 * Impression tracking
 * ───────────────────
 * An impression means a product card was actually on screen. It is the
 * denominator of every conversion figure a vendor sees, so it has to mean that
 * and nothing looser.
 *
 * The naive version — fire when the card mounts — is wrong here. Most product
 * lists in this app are a plain `ScrollView` with `.map()`, not a virtualised
 * `FlatList`, so every card in the list mounts immediately whether or not it is
 * anywhere near the viewport. That would inflate impressions by however long
 * the page is and quietly halve every conversion rate.
 *
 * So we measure. On web there is a real DOM node, so `IntersectionObserver`
 * answers exactly. On native the card measures its own window position, on
 * layout and again whenever the surrounding scroll view reports movement.
 *
 * Screens opt in by spreading `useImpressionScroll()` onto their ScrollView or
 * FlatList. Without it a card still reports an impression if it is on screen at
 * layout time, so above-the-fold content is counted correctly and anything
 * below is simply not counted — under-reporting rather than over-reporting.
 * That direction matters: a missing impression shows up as "no data", while an
 * imaginary one shows up as a number a vendor might price against.
 */
import { useCallback, useEffect, useRef } from 'react';
import {
  Dimensions,
  Platform,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { create } from 'zustand';

import { useEventStore } from '../store/eventStore';

/** Fraction of the card that must be on screen before it counts as seen. */
const VISIBLE_RATIO = 0.5;

/** How long it must stay there. Guards against a fast scroll past. */
const DWELL_MS = 300;

// A monotonically increasing tick, bumped by any instrumented scroll view.
// Cards subscribe to it to know when it is worth re-measuring. A single shared
// counter is far cheaper than every card attaching its own scroll listener.
interface ScrollTickState {
  tick: number;
}
const useScrollTick = create<ScrollTickState>(() => ({ tick: 0 }));

/** Minimum gap between re-measure passes, however often scroll fires. */
const SCROLL_THROTTLE_MS = 150;
let lastNotify = 0;

/**
 * Tell impression tracking that something scrolled.
 *
 * Self-throttling, so it is safe to call from a 60fps Reanimated worklet via
 * `runOnJS` as well as from a plain `onScroll`. Screens using a Reanimated
 * handler (the home feed does, for its collapsing header) cannot simply spread
 * `useImpressionScroll()` without clobbering their own handler, so they call
 * this from inside theirs instead.
 */
export function notifyScroll() {
  const now = Date.now();
  if (now - lastNotify < SCROLL_THROTTLE_MS) return;
  lastNotify = now;
  useScrollTick.setState((s) => ({ tick: s.tick + 1 }));
}

/**
 * Spread onto a ScrollView or FlatList that contains product cards:
 *
 *   <ScrollView {...useImpressionScroll()}>
 *
 * Without it, cards in that view can only be counted at layout time.
 */
export function useImpressionScroll() {
  return {
    onScroll: useCallback(
      (_e: NativeSyntheticEvent<NativeScrollEvent>) => notifyScroll(),
      [],
    ),
    scrollEventThrottle: SCROLL_THROTTLE_MS,
  };
}

/**
 * Attach to a product card. Returns a ref to put on its outermost View and an
 * onLayout handler.
 *
 * Deduplication (once per product per session) lives in the event store, so a
 * card scrolled past repeatedly still only counts once.
 */
export function useImpression(productId?: string, vendorId?: string) {
  const ref = useRef<View | null>(null);
  const reported = useRef(false);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tick = useScrollTick((s) => s.tick);
  const addImpression = useEventStore((s) => s.addImpression);

  const report = useCallback(() => {
    if (reported.current || !productId) return;
    reported.current = true;
    addImpression(productId, vendorId);
  }, [productId, vendorId, addImpression]);

  // Only start the dwell timer while the card is visible; cancel if it leaves
  // before DWELL_MS, so scrolling quickly past a card does not count as seeing it.
  const onVisibilityChange = useCallback(
    (visible: boolean) => {
      if (reported.current) return;
      if (visible) {
        if (dwellTimer.current == null) {
          dwellTimer.current = setTimeout(() => {
            dwellTimer.current = null;
            report();
          }, DWELL_MS);
        }
      } else if (dwellTimer.current != null) {
        clearTimeout(dwellTimer.current);
        dwellTimer.current = null;
      }
    },
    [report],
  );

  // ── Web: ask the browser directly ──
  useEffect(() => {
    if (Platform.OS !== 'web' || !productId) return;
    if (typeof IntersectionObserver === 'undefined') return;

    // On react-native-web the ref is the underlying DOM element.
    const node = ref.current as unknown as Element | null;
    if (!node || !(node instanceof Element)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          onVisibilityChange(entry.intersectionRatio >= VISIBLE_RATIO);
        }
      },
      { threshold: [0, VISIBLE_RATIO, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [productId, onVisibilityChange]);

  // ── Native: measure against the window ──
  const measure = useCallback(() => {
    if (Platform.OS === 'web' || reported.current || !ref.current) return;
    const { height: windowHeight } = Dimensions.get('window');
    ref.current.measureInWindow((_x, y, _width, height) => {
      if (!height) return;
      const visibleTop = Math.max(y, 0);
      const visibleBottom = Math.min(y + height, windowHeight);
      const visible = (visibleBottom - visibleTop) / height;
      onVisibilityChange(visible >= VISIBLE_RATIO);
    });
  }, [onVisibilityChange]);

  // Re-measure whenever any instrumented scroll view moves.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    measure();
  }, [tick, measure]);

  useEffect(
    () => () => {
      if (dwellTimer.current != null) clearTimeout(dwellTimer.current);
    },
    [],
  );

  return { ref, onLayout: measure };
}
