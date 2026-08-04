import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Image, Platform, useWindowDimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface CategoryCardProps {
  label: string;
  /** Omit when no 3D icon exists for this category yet — a neutral glyph is
   *  drawn instead. Borrowing another category's icon reads as a labelling bug
   *  to shoppers; an obvious placeholder reads as "artwork pending". */
  iconSource?: any;
  onPress: () => void;
  isActive?: boolean;
  flex?: boolean;
}

export const CategoryCard = ({
  label,
  iconSource,
  onPress,
  isActive = false,
  flex = false,
}: CategoryCardProps) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  // ── Hover animation (desktop web only) ──
  const [hoverAnim] = useState(() => new Animated.Value(0));

  const handleMouseEnter = () => {
    if (!isDesktop) return;
    Animated.spring(hoverAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 320,
      friction: 16,
    }).start();
  };

  const handleMouseLeave = () => {
    if (!isDesktop) return;
    Animated.spring(hoverAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 320,
      friction: 16,
    }).start();
  };

  const hoverScale = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const hoverTranslateY = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });

  return (
    <Animated.View
      style={[
        isDesktop && {
          transform: [{ scale: hoverScale }, { translateY: hoverTranslateY }],
        },
      ]}
      // @ts-ignore — web-only pointer events
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: flex ? 1 : undefined,
        width: flex ? undefined : 100,
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 8,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <View style={{
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
      }}>
        {iconSource ? (
          <Image source={iconSource} style={{ width: 72, height: 72, resizeMode: 'contain' }} />
        ) : (
          <View style={{
            width: 72, height: 72, borderRadius: 20,
            backgroundColor: colors.surfaceSoft,
            borderWidth: 1, borderColor: colors.surfaceMuted,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="pricetags-outline" size={30} color={colors.inkGhost} />
          </View>
        )}
      </View>

      <Text style={{
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: isActive ? colors.ink : colors.inkMuted,
        textAlign: 'center',
        letterSpacing: 0.1,
        textDecorationLine: isActive ? 'underline' : 'none',
      }}>
        {label}
      </Text>
    </Pressable>
    </Animated.View>
  );
};
