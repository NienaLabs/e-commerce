import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { OptimizedImage } from './ui/OptimizedImage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

/**
 * A vendor's logo, or a shop mark when they haven't uploaded one.
 *
 * The fallback used to be a stock Unsplash photograph of a person, which read
 * as "this is the vendor" rather than "there is no logo here" — different
 * vendors appeared to share a face. A glyph is unmistakably a placeholder,
 * needs no network request, and stays crisp at every size we render it.
 */
export function VendorAvatar({
  uri,
  size,
  radius,
  style,
}: {
  uri?: string | null;
  size: number;
  /** Defaults to a circle. Pass a number for a rounded square. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const borderRadius = radius ?? size / 2;

  const frame: StyleProp<ViewStyle> = [
    {
      width: size,
      height: size,
      borderRadius,
      backgroundColor: colors.surfaceMuted,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    style,
  ];

  if (uri) {
    return (
      <View style={frame}>
        <OptimizedImage
          source={uri}
          optimizedWidth={size}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          recyclingKey={uri}
        />
      </View>
    );
  }

  return (
    <View style={frame}>
      <Ionicons name="storefront" size={Math.round(size * 0.5)} color={colors.inkGhost} />
    </View>
  );
}
