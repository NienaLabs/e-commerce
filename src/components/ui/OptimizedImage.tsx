import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { getOptimizedUrl } from '../../utils/imageOptimization';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  /** The source URL or asset for the image */
  source: string | null | undefined | number;
  /** Force a specific width for the optimized image. If not provided, it will be calculated from the layout. */
  optimizedWidth?: number;
  /** Target image quality (1-100), default 75 */
  quality?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  optimizedWidth,
  quality = 75,
  style,
  onLayout,
  ...props
}) => {
  const [layoutWidth, setLayoutWidth] = useState<number>(0);

  // Determine the target width for optimization
  const targetWidth = optimizedWidth || layoutWidth;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== layoutWidth) {
      // Add pixel density multiplier for sharper images on retina displays
      // Usually multiplying by 2 is a good balance of quality and size
      setLayoutWidth(Math.round(width * 2));
    }
    
    if (onLayout) {
      onLayout(event);
    }
  };

  const optimizedSource = useMemo(() => {
    if (!source) return null;
    
    // Extract the actual URL string if it's an object
    let urlString: string | undefined;
    if (typeof source === 'string') {
      urlString = source;
    } else if (typeof source === 'object' && source !== null && 'uri' in source && typeof (source as any).uri === 'string') {
      urlString = (source as any).uri;
    } else {
      // It's a number (local require) or something else we don't optimize
      return source;
    }

    if (targetWidth > 0 || optimizedWidth) {
       const finalWidth = targetWidth || 800;
       // Only try to optimize if it's a remote URL
       if (urlString?.startsWith('http')) {
         const optimizedUri = getOptimizedUrl(urlString, finalWidth, quality);
         return { uri: optimizedUri || undefined };
       }
       // For local web assets (starting with '/'), just return the original source
       return source;
    }

    return null;
  }, [source, targetWidth, quality, optimizedWidth]);

  // We wrap in a View to capture layout if no explicit width is given
  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {optimizedSource && (
        <Image
          source={optimizedSource}
          style={StyleSheet.absoluteFill}
          cachePolicy="memory-disk"
          transition={200}
          {...props}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
