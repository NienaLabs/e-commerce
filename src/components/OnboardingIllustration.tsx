import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

/**
 * Illustration slot for the onboarding steps.
 *
 * Renders the artwork once a source is supplied, and until then a labelled
 * placeholder showing the icon, the intended dimensions and the asset filename
 * to drop in. That way the layout is already correct — spacing, alignment and
 * step height don't shift when the real images arrive.
 *
 * To use real artwork: drop the file into `src/assets/onboarding/`, then set
 * `source` in ONBOARDING_ILLUSTRATIONS below to `require(...)` it.
 */

export interface IllustrationSlot {
  /** `require('../assets/onboarding/welcome.png')` once the art exists. */
  source?: ImageSourcePropType;
  /** Filename the placeholder tells the designer to supply. */
  filename: string;
  /** Ionicon shown in the placeholder, hinting at the intended subject. */
  icon: keyof typeof Ionicons.glyphMap;
  /** What the illustration should depict — brief for whoever draws it. */
  brief: string;
}

/**
 * design.md §5 puts Tier 1 illustrations at 120px on mobile with clear space
 * around them. 160 gives the welcome screen a little more presence without
 * pushing the form below the fold on a small phone.
 */
export const ILLUSTRATION_SIZE = 120;
export const ILLUSTRATION_SIZE_HERO = 160;

export function OnboardingIllustration({
  slot,
  hero = false,
}: {
  slot: IllustrationSlot;
  hero?: boolean;
}) {
  const { colors } = useTheme();
  const size = hero ? ILLUSTRATION_SIZE_HERO : ILLUSTRATION_SIZE;

  if (slot.source) {
    return (
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Image
          source={slot.source}
          style={{ width: size, height: size, resizeMode: 'contain' }}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', marginBottom: 24 }}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: size,
          height: size,
          borderRadius: 24,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colors.surfaceDeep,
          backgroundColor: colors.surfaceSoft,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 10,
        }}
      >
        <Ionicons name={slot.icon} size={hero ? 40 : 32} color={colors.inkGhost} />
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 10,
            color: colors.inkGhost,
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          {size}×{size}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 9,
            color: colors.inkGhost,
            marginTop: 2,
            textAlign: 'center',
          }}
        >
          {slot.filename}
        </Text>
      </View>
    </View>
  );
}

/**
 * The five slots, in the order the user meets them.
 *
 * Add artwork by setting `source` — nothing else needs to change.
 */
export const ONBOARDING_ILLUSTRATIONS: Record<
  'welcome' | 'consent' | 'about' | 'interests' | 'finish',
  IllustrationSlot
> = {
  welcome: {
    filename: 'welcome.png',
    icon: 'sparkles-outline',
    brief: 'Warm hello — a shopping bag or storefront with the lime accent.',
  },
  consent: {
    filename: 'consent.png',
    icon: 'shield-checkmark-outline',
    brief: 'Trust and privacy — a shield or lock, reassuring rather than stern.',
  },
  about: {
    filename: 'about-you.png',
    icon: 'person-outline',
    brief: 'Personalisation — a friendly avatar or profile card.',
  },
  interests: {
    filename: 'interests.png',
    icon: 'grid-outline',
    brief: 'Choice — a grid of product categories, one tile highlighted in lime.',
  },
  finish: {
    filename: 'all-set.png',
    icon: 'checkmark-circle-outline',
    brief: 'Celebration — a checkmark or confetti burst with the lime accent.',
  },
};
