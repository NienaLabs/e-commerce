import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
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

  return (
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
  );
};
