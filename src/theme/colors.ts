import { useColorScheme } from 'react-native';

export const palette = {
  // Primary greens
  primary: '#2e9b5f',
  primaryLight: '#5cb885',

  // Dark mode
  dark: {
    background: '#0f1f15',
    card: '#152b1c',
    cardHighlight: '#1a3d24',
    text: '#e8f0eb',
    textSecondary: '#8fa898',
    border: '#2d4a38',
  },

  // Light mode
  light: {
    background: '#f4f9f6',
    card: '#ffffff',
    cardHighlight: '#e6f5eb',
    text: '#1a2e20',
    textSecondary: '#5c7365',
    border: '#d4e5db',
  },

  // Semantic
  error: '#ef4444',
  white: '#ffffff',
};

export function useColors() {
  const isDarkMode = useColorScheme() === 'dark';
  const mode = isDarkMode ? palette.dark : palette.light;

  return {
    background: mode.background,
    card: mode.card,
    cardHighlight: mode.cardHighlight,
    text: mode.text,
    textSecondary: mode.textSecondary,
    border: mode.border,
    primary: palette.primary,
    primaryLight: palette.primaryLight,
    error: palette.error,
    white: palette.white,
    isDarkMode,
  };
}

