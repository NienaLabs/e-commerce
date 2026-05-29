import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leadingIcon?: keyof typeof Ionicons.glyphMap;
}

export const Input = ({
  label,
  error,
  leadingIcon,
  onFocus,
  onBlur,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  const getBorderColor = () => {
    if (error) return 'border-error';
    if (isFocused) return 'border-primary';
    return 'border-surface-muted';
  };

  const getShadowStyle = () => {
    if (error && isFocused) return { shadowColor: '#d9365118', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 3, elevation: 2 };
    if (isFocused) return { shadowColor: '#c3d80920', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 3, elevation: 2 };
    return {};
  };

  return (
    <View className="mb-4">
      <View 
        className={`flex-row items-center h-[52px] bg-surface-soft border-[1.5px] rounded-[12px] px-4 ${getBorderColor()}`}
        style={getShadowStyle()}
      >
        {leadingIcon && (
          <Ionicons 
            name={leadingIcon} 
            size={20} 
            color={isFocused ? '#222022' : '#6b696b'} 
            style={{ marginRight: 8 }}
          />
        )}
        <View className="flex-1 justify-center">
          {!!(isFocused || props.value) && !!label ? (
            <Text className="font-inter-medium text-[10px] text-ink-muted">
              {label}
            </Text>
          ) : null}
          <TextInput
            placeholder={!isFocused ? label : ''}
            placeholderTextColor="#9e9c9e"
            className="font-opensans text-[15px] text-ink p-0 m-0 leading-tight"
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </View>
      </View>
      {!!error ? (
        <Text className="font-opensans text-[11px] text-error mt-1 ml-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
};
