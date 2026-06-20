import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// A handful of free-to-use Unsplash images (nature/landscape set).
// Swap these out for your own URLs or pass `images` as a prop.
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80',
];

interface AutoPlayCarouselProps {
  /** Array of image URLs to cycle through */
  images?: string[];
  /** Time each image stays on screen, in ms */
  interval?: number;
  /** Height of the carousel frame */
  height?: number;
  /** Duration of the slide transition, in ms */
  slideDuration?: number;
  /** Show dot indicators at the bottom */
  showDots?: boolean;
}

export default function HeroBanner({
  images = DEFAULT_IMAGES,
  interval = 4000,
  height = 250,
  slideDuration = 450,
  showDots = true,
}: AutoPlayCarouselProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { colors } = useTheme();
  const isLargeDevice = SCREEN_WIDTH >= 768;

  const slides = [...images, images[0]]; // duplicate first slide at the end for seamless wrapping
  const [dotIndex, setDotIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const slidePos = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPaused = useRef(false);

  useEffect(() => {
    startAutoPlay();
    return stopAutoPlay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length, interval]);

  const startAutoPlay = () => {
    stopAutoPlay();
    timerRef.current = setInterval(() => {
      if (!isPaused.current) goToNext();
    }, interval);
  };

  const stopAutoPlay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const goToNext = () => {
    const nextPos = slidePos.current + 1;
    if (nextPos === slides.length - 1) {
      scrollRef.current?.scrollTo({ x: nextPos * SCREEN_WIDTH, animated: true });
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: 0, animated: false });
        slidePos.current = 0;
        setDotIndex(0);
      }, slideDuration || 400); // Wait for the scroll animation to finish
    } else {
      scrollRef.current?.scrollTo({ x: nextPos * SCREEN_WIDTH, animated: true });
      slidePos.current = nextPos;
      setDotIndex(nextPos);
    }
  };

  const handlePrev = () => {
    stopAutoPlay();
    const prevPos = slidePos.current - 1;
    if (prevPos < 0) {
      scrollRef.current?.scrollTo({ x: (slides.length - 1) * SCREEN_WIDTH, animated: false });
      setTimeout(() => {
        const newPos = slides.length - 2;
        scrollRef.current?.scrollTo({ x: newPos * SCREEN_WIDTH, animated: true });
        slidePos.current = newPos;
        setDotIndex(newPos);
      }, 50);
    } else {
      scrollRef.current?.scrollTo({ x: prevPos * SCREEN_WIDTH, animated: true });
      slidePos.current = prevPos;
      setDotIndex(prevPos);
    }
    startAutoPlay();
  };

  const handleNext = () => {
    stopAutoPlay();
    goToNext();
    startAutoPlay();
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setDotIndex(index % images.length);
  };

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index === slides.length - 1) {
      scrollRef.current?.scrollTo({ x: 0, animated: false });
      slidePos.current = 0;
    } else {
      slidePos.current = index;
    }
  };

  const onScrollBeginDrag = () => {
    stopAutoPlay();
    isPaused.current = true;
  };

  const onScrollEndDrag = () => {
    isPaused.current = false;
    startAutoPlay();
  };

  return (
    <View style={[styles.frame, { height, width: SCREEN_WIDTH }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        style={{ width: SCREEN_WIDTH, height }}
      >
        {slides.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={{ width: SCREEN_WIDTH, height }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      <LinearGradient
        colors={['transparent', colors.surfaceSoft]}
        style={styles.gradient}
        pointerEvents="none"
      />

      {isLargeDevice && (
        <>
          <Pressable style={styles.leftArrow} onPress={handlePrev}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </Pressable>
          <Pressable style={styles.rightArrow} onPress={handleNext}>
            <Ionicons name="chevron-forward" size={28} color="#fff" />
          </Pressable>
        </>
      )}

      {showDots && (
        <View style={styles.dotsContainer}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === dotIndex && styles.activeDot]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  leftArrow: {
    position: 'absolute',
    left: 24,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightArrow: {
    position: 'absolute',
    right: 24,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/*
USAGE:

import AutoPlayCarousel from './AutoPlayCarousel';

export default function App() {
  return (
    <AutoPlayCarousel
      interval={4000}
      height={300}
      slideDuration={500}
    />
  );
}

You can also pass your own image list:

<AutoPlayCarousel images={['https://...', 'https://...']} />
*/