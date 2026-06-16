import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, Platform, useWindowDimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = width >= 768 && isWeb;

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');

  const [animation] = useState(() => new Animated.Value(0));
  const timerRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    Animated.spring(animation, {
      toValue: 0,
      useNativeDriver: Platform.OS !== 'web',
      friction: 8,
      tension: 40,
    }).start(({ finished }) => {
      if (finished) {
        setVisible(false);
      }
    });
  }, [animation]);

  const showToast = useCallback((msg: string, toastType: ToastType = 'info') => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setMessage(msg);
    setType(toastType);
    setVisible(true);

    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      friction: 6,
      tension: 45,
    }).start();

    timerRef.current = setTimeout(() => {
      hideToast();
    }, 3000);
  }, [animation, hideToast]);

  const getStatusDetails = () => {
    switch (type) {
      case 'success':
        return {
          color: colors.success,
          icon: 'checkmark-circle' as const,
        };
      case 'warning':
        return {
          color: colors.warning,
          icon: 'warning' as const,
        };
      case 'error':
        return {
          color: colors.error,
          icon: 'alert-circle' as const,
        };
      case 'info':
      default:
        return {
          color: colors.info,
          icon: 'information-circle' as const,
        };
    }
  };

  const { color: statusColor, icon: statusIcon } = getStatusDetails();

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: isDesktop ? [100, 0] : [-150, 0],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity,
              transform: [{ translateY }],
              backgroundColor: colors.surface,
              borderColor: colors.surfaceMuted,
            },
            isDesktop
              ? { bottom: 40, alignSelf: 'center', width: 400 }
              : { top: Math.max(insets.top, 16), left: 16, right: 16 },
          ]}
        >
          {/* Left Edge Accent Bar */}
          <View style={[styles.accentBar, { backgroundColor: statusColor }]} />

          {/* Leading Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name={statusIcon} size={20} color={statusColor} />
          </View>

          {/* Toast Text */}
          <Text
            style={[styles.toastText, { color: colors.ink }]}
            numberOfLines={2}
          >
            {message}
          </Text>

          {/* Dismiss button */}
          <Pressable onPress={hideToast} style={styles.closeButton}>
            <Ionicons name="close" size={16} color={colors.inkGhost} />
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#222022',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 16px rgba(34,32,34,0.12)',
      },
    }),
    zIndex: 99999,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  iconContainer: {
    marginRight: 12,
    marginLeft: 4,
  },
  toastText: {
    flex: 1,
    fontFamily: 'OpenSans_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
