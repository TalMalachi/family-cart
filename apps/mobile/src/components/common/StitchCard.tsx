import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Shadow, Colors, Radius } from '../../utils/theme';

interface StitchCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  stitchColor?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function StitchCard({
  children,
  style,
  contentStyle,
  variant = 'default',
}: StitchCardProps) {
  return (
    <View style={[
      styles.card,
      variant === 'elevated' && styles.cardElevated,
      variant === 'outlined' && styles.cardOutlined,
      style,
    ]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  cardElevated: {
    borderColor: 'transparent',
    ...Shadow.elevated,
  },
  cardOutlined: {
    borderWidth: 1.5,
    borderColor: Colors.borderMid,
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg - 1,
    overflow: 'hidden',
  },
});