import React from 'react';
import { Text, Pressable, ViewStyle, TextStyle, StyleProp } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) => {
  const getContainerClasses = (pressed: boolean) => {
    let base = "flex-row items-center justify-center h-[52px] md:h-[48px] px-6 rounded-full ";
    
    if (disabled) {
      return base + "bg-surface-muted";
    }

    switch (variant) {
      case 'primary':
        return base + (pressed ? "bg-primary-dim scale-95 " : "bg-primary shadow-glow-primary ");
      case 'secondary':
        return base + `bg-surface border-[1.5px] border-surface-muted ${pressed ? "bg-surface-soft border-primary-border" : "shadow-raised-1"}`;
      case 'ghost':
        return base + "bg-transparent";
      case 'destructive':
        return base + "bg-error-ghost border border-error";
      default:
        return base;
    }
  };

  const getTextClasses = () => {
    let base = "font-inter text-[15px] ";
    
    if (disabled) {
      return base + "text-ink-ghost font-semibold";
    }

    switch (variant) {
      case 'primary':
        return base + "text-ink font-semibold";
      case 'secondary':
        return base + "text-ink font-semibold";
      case 'ghost':
        return base + "text-ink-soft font-semibold text-[14px]";
      case 'destructive':
        return base + "text-error font-semibold";
      default:
        return base + "text-ink font-semibold";
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={getContainerClasses(false)} // Note: NativeWind v4 supports 'active:' but React Native Pressable style function is more reliable for transform
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed && !disabled && variant === 'primary' ? 0.97 : 1 }],
          opacity: pressed && variant !== 'primary' ? 0.8 : 1,
        },
        style,
      ]}
    >
      {icon && <React.Fragment>{icon}</React.Fragment>}
      <Text className={getTextClasses()} style={[{ marginLeft: icon ? 8 : 0 }, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
};
