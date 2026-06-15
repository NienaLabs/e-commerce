import React, { useRef } from 'react';
import { View, Text, Pressable, ImageBackground, ViewStyle, Platform, useWindowDimensions, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface PromoCardProps {
  imageUrl: string;
  badge?: string;
  heading?: string;
  subtext?: string;
  ctaLabel?: string;
  onPress?: () => void;
  containerStyle?: ViewStyle;
}

export const PromoCard = ({ imageUrl, badge, heading, subtext, ctaLabel, onPress, containerStyle }: PromoCardProps) => {
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
      tension: 260,
      friction: 20,
    }).start();
  };

  const handleMouseLeave = () => {
    if (!isDesktop) return;
    Animated.spring(hoverAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 260,
      friction: 20,
    }).start();
  };

  const hoverScale = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const hoverTranslateY = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
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
      style={({ pressed }) => [{
        width: 300,
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: pressed ? 0.06 : (colors.isDark ? 0.3 : 0.12),
        shadowRadius: 16,
        elevation: pressed ? 2 : 5,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      }, containerStyle as ViewStyle]}
    >
      <ImageBackground 
        source={{ uri: imageUrl }} 
        style={{ width: '100%', height: '100%', justifyContent: 'space-between', padding: 22 }}
        resizeMode="cover"
      >
        {/* Dark Overlay for Text Readability - Always dark for image backgrounds */}
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(34, 32, 34, 0.45)'
        }} />

        {/* Content */}
        <View style={{ zIndex: 1 }}>
          {badge && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: colors.primary,
                marginRight: 6,
              }} />
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 10,
                color: colors.primary,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}>{badge}</Text>
            </View>
          )}
          {heading && (
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 26,
              color: '#ffffff', // Keep white since overlay is always dark
              lineHeight: 30,
              letterSpacing: -0.4,
            }}>{heading}</Text>
          )}
          {subtext && (
            <Text style={{
              fontFamily: 'OpenSans_400Regular',
              fontSize: 13,
              color: 'rgba(255,255,255,0.85)',
              marginTop: 3,
            }}>{subtext}</Text>
          )}
        </View>

        {/* CTA */}
        {ctaLabel && (
          <View style={{
            alignSelf: 'flex-start',
            backgroundColor: colors.primary,
            paddingHorizontal: 18,
            paddingVertical: 9,
            borderRadius: 20,
            zIndex: 1,
          }}>
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 12,
              color: colors.isDark ? colors.ink : '#222022',
            }}>{ctaLabel}</Text>
          </View>
        )}
      </ImageBackground>
    </Pressable>
    </Animated.View>
  );
};
