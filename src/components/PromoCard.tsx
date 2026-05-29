import React from 'react';
import { View, Text, Pressable, ImageBackground, ViewStyle } from 'react-native';

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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{
        width: 300,
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#222022',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: pressed ? 0.06 : 0.12,
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
        {/* Dark Overlay for Text Readability */}
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
                backgroundColor: '#c3d809',
                marginRight: 6,
              }} />
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 10,
                color: '#c3d809',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}>{badge}</Text>
            </View>
          )}
          {heading && (
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 26,
              color: '#ffffff',
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
            backgroundColor: '#c3d809',
            paddingHorizontal: 18,
            paddingVertical: 9,
            borderRadius: 20,
            zIndex: 1,
          }}>
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 12,
              color: '#222022',
            }}>{ctaLabel}</Text>
          </View>
        )}
      </ImageBackground>
    </Pressable>
  );
};
