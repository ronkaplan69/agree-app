import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VerifyCode'>;
  route: RouteProp<RootStackParamList, 'VerifyCode'>;
};

const BYPASS_CODE = '111111';

export function VerifyCodeScreen({ navigation, route }: Props) {
  const { email, bypass } = route.params;
  const { verifyCode, requestCode } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';

  // Pre-fill with bypass code if in bypass mode
  const initialCode = bypass
    ? BYPASS_CODE.split('')
    : ['', '', '', '', '', ''];
  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const colors = {
    background: isDarkMode ? '#1a1a2e' : '#f8f9fa',
    card: isDarkMode ? '#16213e' : '#ffffff',
    text: isDarkMode ? '#eaeaea' : '#1a1a2e',
    textSecondary: isDarkMode ? '#a0a0a0' : '#6c757d',
    inputBg: isDarkMode ? '#1a1a2e' : '#f8f9fa',
    inputBorder: isDarkMode ? '#2d3748' : '#e2e8f0',
    primary: '#6366f1',
    primaryDark: '#4f46e5',
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      
      // Auto-submit if complete
      if (newCode.every(d => d !== '')) {
        handleSubmit(newCode.join(''));
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, '');
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if complete
    if (newCode.every(d => d !== '')) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (codeString?: string) => {
    const finalCode = codeString || code.join('');
    
    if (finalCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    const result = await verifyCode(email, finalCode);
    setIsLoading(false);

    if (result.success) {
      // Navigation will happen automatically via AuthContext
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } else {
      Alert.alert('Error', result.error || 'Invalid verification code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    const result = await requestCode(email);
    setIsResending(false);

    if (result.success) {
      Alert.alert('Success', 'A new code has been sent to your email');
    } else {
      Alert.alert('Error', result.error || 'Failed to resend code');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Enter Code
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {bypass ? (
            <>
              <Text style={{ color: '#22c55e', fontWeight: '600' }}>
                [BYPASS MODE]{'\n'}
              </Text>
              Code pre-filled: {BYPASS_CODE}
            </>
          ) : (
            <>
              We sent a 6-digit code to{'\n'}
              <Text style={{ fontWeight: '600', color: colors.text }}>
                {email}
              </Text>
            </>
          )}
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: digit ? colors.primary : colors.inputBorder,
                  color: colors.text,
                },
              ]}
              value={digit}
              onChangeText={value => handleCodeChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={() => handleSubmit()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={isResending}
        >
          {isResending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.resendText, { color: colors.primary }]}>
              Didn't receive a code? Resend
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: 10,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

