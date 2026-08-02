import { SharedTransition, withSpring, withTiming } from 'react-native-reanimated';

export const smoothSpringTransition = (SharedTransition && typeof SharedTransition.custom === 'function') 
  ? SharedTransition.custom((values) => {
      'worklet';
      return {
        height: withSpring(values.targetHeight, { damping: 20, stiffness: 200 }),
        width: withSpring(values.targetWidth, { damping: 20, stiffness: 200 }),
        originX: withSpring(values.targetOriginX, { damping: 20, stiffness: 200 }),
        originY: withSpring(values.targetOriginY, { damping: 20, stiffness: 200 }),
      };
    })
  : undefined;
