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
    
    // If it's a number (local asset require), just pass it directly
    if (typeof source === 'number') {
      return source;
    }

    // Only optimize if we have a target width, otherwise load original (or don't load yet)
    if (targetWidth > 0 || optimizedWidth) {
       // If layout hasn't happened but optimizedWidth is provided, targetWidth will be optimizedWidth
       const finalWidth = targetWidth || 800; // Fallback
       return { uri: getOptimizedUrl(source as string, finalWidth, quality) || undefined };
    }

    // While waiting for layout, we can return null to avoid loading the original massive image
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
