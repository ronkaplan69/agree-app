import React, { useRef, useCallback } from 'react';
import { StyleSheet, Animated, Dimensions, PanResponder } from 'react-native';
import { PrincipleCard } from './PrincipleCard';
import { Principle } from '../api';
import { useColors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Swipe thresholds and distances
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.36; // % of screen width - distance needed to complete swipe
const MIN_SWIPE_DISTANCE = 20; // Minimum distance before gesture activates
const EARLY_CAPTURE_THRESHOLD = 5; // Early capture threshold for right swipes (to prevent navigation)
const RIGHT_SWIPE_CAPTURE_THRESHOLD = 8; // Threshold for capturing right swipes early

// Gesture sensitivity
const HORIZONTAL_VS_VERTICAL_RATIO = 1.5; // How much more horizontal than vertical movement needed
const RIGHT_SWIPE_HORIZONTAL_RATIO = 1.2; // More lenient ratio for right swipe detection

// Velocity thresholds
const VELOCITY_THRESHOLD = 0.5; // Minimum velocity to complete swipe even without distance

// Animation settings
const ANIMATION_DURATION = 300; // Duration for swipe completion animation (ms)
const SPRING_TENSION = 40; // Spring animation tension (lower = slower)
const SPRING_FRICTION = 7; // Spring animation friction (higher = more damping)

// Rotation settings
const ROTATION_MULTIPLIER = 0.1; // How much the card rotates during swipe
const MAX_ROTATION_DEG = 10; // Maximum rotation angle in degrees

// Overlay opacity settings
const OVERLAY_FADE_START = 50; // Distance (px) where overlay starts to fade in
const OVERLAY_OPACITY_START = 0.3; // Initial overlay opacity when fading in
const OVERLAY_OPACITY_FULL = 0.8; // Full overlay opacity at threshold

// Target position multiplier (how far off-screen the card goes)
const TARGET_POSITION_MULTIPLIER = 1.5; // Multiplier of screen width for final position

interface SwipeablePrincipleCardProps {
  principle: Principle;
  onSwipeRight: (principle: Principle) => void;
  onSwipeLeft: (principle: Principle) => void;
  onPress: (principle: Principle) => void;
}

export function SwipeablePrincipleCard({
  principle,
  onSwipeRight,
  onSwipeLeft,
  onPress,
}: SwipeablePrincipleCardProps) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const isAnimating = useRef(false);

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right') {
        onSwipeRight(principle);
      } else {
        onSwipeLeft(principle);
      }
    },
    [principle, onSwipeRight, onSwipeLeft],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: (_, gesture) => {
        // Capture early for right swipes to prevent navigation from intercepting
        // Allow capture if there's any horizontal movement (even small)
        return Math.abs(gesture.dx) > EARLY_CAPTURE_THRESHOLD;
      },
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only activate on horizontal swipes (more horizontal than vertical movement)
        // Require more movement to be less sensitive
        return (
          Math.abs(gesture.dx) > MIN_SWIPE_DISTANCE &&
          Math.abs(gesture.dx) >
            Math.abs(gesture.dy) * HORIZONTAL_VS_VERTICAL_RATIO
        );
      },
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        // Capture early to prevent TouchableOpacity and navigation from interfering
        // Capture right swipes earlier to prevent navigation back gesture
        const isRightSwipe = gesture.dx > 0;
        const isHorizontal =
          Math.abs(gesture.dx) >
          Math.abs(gesture.dy) * RIGHT_SWIPE_HORIZONTAL_RATIO;

        // For right swipes, be more aggressive in capturing to prevent navigation
        if (
          isRightSwipe &&
          isHorizontal &&
          Math.abs(gesture.dx) > RIGHT_SWIPE_CAPTURE_THRESHOLD
        ) {
          return true;
        }

        // For left swipes, use normal threshold
        return (
          Math.abs(gesture.dx) > MIN_SWIPE_DISTANCE &&
          Math.abs(gesture.dx) >
            Math.abs(gesture.dy) * HORIZONTAL_VS_VERTICAL_RATIO
        );
      },
      onPanResponderGrant: () => {
        // Stop any ongoing animations
        isAnimating.current = false;
        translateX.stopAnimation();
        rotate.stopAnimation();
        // Set offset to current value, then reset value to 0
        translateX.setOffset((translateX as any)._value || 0);
        translateX.setValue(0);
        rotate.setOffset((rotate as any)._value || 0);
        rotate.setValue(0);
      },
      onPanResponderMove: (_, gesture) => {
        // Use offset + value pattern for smooth tracking
        translateX.setValue(gesture.dx);
        rotate.setValue((gesture.dx / SCREEN_WIDTH) * ROTATION_MULTIPLIER);
      },
      onPanResponderRelease: (_, gesture) => {
        // Calculate final position: offset (from previous position) + gesture.dx (current movement)
        const offsetX = (translateX as any)._offset || 0;
        const finalX = offsetX + gesture.dx;

        // Flatten offset and set to final position
        translateX.flattenOffset();
        rotate.flattenOffset();
        translateX.setValue(finalX);
        rotate.setValue((finalX / SCREEN_WIDTH) * ROTATION_MULTIPLIER);

        const velocity = gesture.vx; // Horizontal velocity

        // Check if swipe meets threshold OR has sufficient velocity
        const hasEnoughDistance =
          finalX > SWIPE_THRESHOLD || finalX < -SWIPE_THRESHOLD;
        const hasEnoughVelocity = Math.abs(velocity) > VELOCITY_THRESHOLD;

        const shouldSwipeRight =
          finalX > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD;
        const shouldSwipeLeft =
          finalX < -SWIPE_THRESHOLD || velocity < -VELOCITY_THRESHOLD;

        if (
          (shouldSwipeRight || shouldSwipeLeft) &&
          (hasEnoughDistance || hasEnoughVelocity)
        ) {
          const direction = shouldSwipeRight ? 'right' : 'left';
          const targetX = shouldSwipeRight
            ? SCREEN_WIDTH * TARGET_POSITION_MULTIPLIER
            : -SCREEN_WIDTH * TARGET_POSITION_MULTIPLIER;

          isAnimating.current = true;
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: targetX,
              duration: ANIMATION_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: (targetX / SCREEN_WIDTH) * ROTATION_MULTIPLIER,
              duration: ANIMATION_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: ANIMATION_DURATION,
              useNativeDriver: true,
            }),
          ]).start(() => {
            isAnimating.current = false;
            handleSwipeComplete(direction);
          });
        } else {
          // Spring back to center - always reset properly
          isAnimating.current = true;
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: SPRING_TENSION,
              friction: SPRING_FRICTION,
            }),
            Animated.spring(rotate, {
              toValue: 0,
              useNativeDriver: true,
              tension: SPRING_TENSION,
              friction: SPRING_FRICTION,
            }),
          ]).start(() => {
            isAnimating.current = false;
          });
        }
      },
      onPanResponderTerminate: () => {
        // Handle interruption (e.g., by another gesture) - always spring back
        translateX.flattenOffset();
        rotate.flattenOffset();
        isAnimating.current = true;
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: SPRING_TENSION,
            friction: SPRING_FRICTION,
          }),
          Animated.spring(rotate, {
            toValue: 0,
            useNativeDriver: true,
            tension: SPRING_TENSION,
            friction: SPRING_FRICTION,
          }),
        ]).start(() => {
          isAnimating.current = false;
        });
      },
    }),
  ).current;

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [`-${MAX_ROTATION_DEG}deg`, '0deg', `${MAX_ROTATION_DEG}deg`],
  });

  // Determine overlay colors based on swipe direction
  // Right overlay: show when swiping right (positive translateX)
  const rightOverlayOpacity = translateX.interpolate({
    inputRange: [
      -SCREEN_WIDTH,
      0,
      OVERLAY_FADE_START,
      SWIPE_THRESHOLD,
      SCREEN_WIDTH,
    ],
    outputRange: [
      0,
      0,
      OVERLAY_OPACITY_START,
      OVERLAY_OPACITY_FULL,
      OVERLAY_OPACITY_FULL,
    ],
    extrapolate: 'clamp',
  });

  // Left overlay: show when swiping left (negative translateX)
  const leftOverlayOpacity = translateX.interpolate({
    inputRange: [
      -SCREEN_WIDTH,
      -SWIPE_THRESHOLD,
      -OVERLAY_FADE_START,
      0,
      SCREEN_WIDTH,
    ],
    outputRange: [
      OVERLAY_OPACITY_FULL,
      OVERLAY_OPACITY_FULL,
      OVERLAY_OPACITY_START,
      0,
      0,
    ],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ translateX }, { rotate: rotateInterpolate }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Agree overlay (green, right swipe) */}
      <Animated.View
        style={[
          styles.overlay,
          styles.agreeOverlay,
          { opacity: rightOverlayOpacity },
        ]}
      >
        <Animated.Text style={[styles.overlayText, { color: colors.white }]}>
          AGREE
        </Animated.Text>
      </Animated.View>

      {/* Disagree overlay (red, left swipe) */}
      <Animated.View
        style={[
          styles.overlay,
          styles.disagreeOverlay,
          { opacity: leftOverlayOpacity },
        ]}
      >
        <Animated.Text style={[styles.overlayText, { color: colors.white }]}>
          Not For Me
        </Animated.Text>
      </Animated.View>

      <PrincipleCard principle={principle} onPress={onPress} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  agreeOverlay: {
    backgroundColor: '#2e9b5f',
  },
  disagreeOverlay: {
    backgroundColor: '#ef4444',
  },
  overlayText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
  },
});
