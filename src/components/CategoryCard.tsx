import React, { useRef } from 'react';
import { View, Text, Pressable, Image, Platform, useWindowDimensions, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface CategoryCardProps {
  label: string;
  iconSource: any;
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
  const hoverAnim = useRef(new Animated.Value(0)).current;

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
        <Image source={iconSource} style={{ width: 72, height: 72, resizeMode: 'contain' }} />
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
