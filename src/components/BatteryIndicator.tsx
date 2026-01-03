import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColors } from '../theme/colors';

interface BatteryIndicatorProps {
  strength: number; // 0-100
  size?: 'small' | 'medium' | 'large';
}

const NUM_LINES = 7;
const LINE_TILT = 6; // degrees

// Interpolate color from red to green
const interpolateColor = (t: number): string => {
  // t is 0-1, where 0 = red, 1 = green
  const red = [239, 68, 68]; // #ef4444
  const green = [46, 155, 95]; // #2e9b5f

  const r = Math.round(red[0] + (green[0] - red[0]) * t);
  const g = Math.round(red[1] + (green[1] - red[1]) * t);
  const b = Math.round(red[2] + (green[2] - red[2]) * t);

  return `rgb(${r}, ${g}, ${b})`;
};

export function BatteryIndicator({
  strength,
  size = 'large',
}: BatteryIndicatorProps) {
  const colors = useColors();

  // Clamp strength between 0 and 100
  const clampedStrength = Math.max(0, Math.min(100, strength));

  // Calculate how many lines to show
  const linesToShow = Math.round((clampedStrength / 100) * NUM_LINES);

  // Size configurations
  const sizeConfig = {
    small: {
      width: 40,
      height: 16,
      borderWidth: 1.5,
      tipWidth: 3,
      tipHeight: 8,
      lineWidth: 3.5,
    },
    medium: {
      width: 50,
      height: 20,
      borderWidth: 2,
      tipWidth: 4,
      tipHeight: 10,
      lineWidth: 4.5,
    },
    large: {
      width: 60,
      height: 24,
      borderWidth: 2.5,
      tipWidth: 5,
      tipHeight: 12,
      lineWidth: 5.5,
    },
  };

  const config = sizeConfig[size];

  // Calculate spacing between lines
  // Minimal padding so red line starts almost at the beginning
  const horizontalPadding = 0.3;
  const verticalPadding = config.borderWidth;
  const availableWidth = config.width - horizontalPadding * 2;
  const lineSpacing = availableWidth / (NUM_LINES + 1);
  const availableHeight = config.height - verticalPadding * 2;

  return (
    <View style={styles.container}>
      {/* Battery body */}
      <View
        style={[
          styles.batteryBody,
          {
            width: config.width,
            height: config.height,
            borderWidth: config.borderWidth,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Vertical lines */}
        {Array.from({ length: NUM_LINES }).map((_, index) => {
          const lineIndex = index + 1;
          const isVisible = lineIndex <= linesToShow;

          // Position from left (evenly spaced)
          const leftPosition = horizontalPadding + lineIndex * lineSpacing;

          // Color interpolation: 0 = red (leftmost), 1 = green (rightmost)
          const colorT = index / (NUM_LINES - 1);
          const lineColor = interpolateColor(colorT);

          return (
            <View
              key={index}
              style={[
                styles.batteryLine,
                {
                  left: leftPosition - config.lineWidth / 2,
                  top: verticalPadding,
                  width: config.lineWidth,
                  height: availableHeight,
                  backgroundColor: isVisible ? lineColor : 'transparent',
                  transform: [{ rotate: `${LINE_TILT}deg` }],
                },
              ]}
            />
          );
        })}
      </View>
      <View
        style={[
          styles.batteryTip,
          {
            width: config.tipWidth,
            height: config.tipHeight,
            backgroundColor: colors.border,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryBody: {
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'white',
    position: 'relative',
  },
  batteryLine: {
    position: 'absolute',
    top: 0,
    borderRadius: 0.5,
  },
  batteryTip: {
    borderRadius: 1,
    marginLeft: 1,
  },
});
