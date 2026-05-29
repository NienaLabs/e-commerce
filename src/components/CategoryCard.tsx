import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CategoryCardProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isActive?: boolean;
  flex?: boolean; // when true, card flexes to fill its container (desktop mode)
}

export const CategoryCard = ({
  label,
  iconName,
  onPress,
  isActive = false,
  flex = false,
}: CategoryCardProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: flex ? 1 : undefined,
        width: flex ? undefined : 104,
        aspectRatio: 1,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: isActive ? 1.5 : 1,
        borderColor: isActive ? '#c3d80960' : '#eceae6',
        backgroundColor: isActive ? '#c3d80920' : '#ffffff',
        shadowColor: '#222022',
        shadowOffset: { width: 0, height: isActive ? 2 : 1 },
        shadowOpacity: isActive ? 0.09 : 0.06,
        shadowRadius: isActive ? 10 : 4,
        elevation: isActive ? 3 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      {/* Icon circle */}
      <View style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isActive ? '#c3d80930' : '#f5f5f0',
        marginBottom: 10,
      }}>
        <Ionicons
          name={iconName}
          size={28}
          color={isActive ? '#222022' : '#6b696b'}
        />
      </View>

      <Text style={{
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        color: isActive ? '#222022' : '#3a383a',
        textAlign: 'center',
        letterSpacing: 0.1,
      }}>
        {label}
      </Text>
    </Pressable>
  );
};
