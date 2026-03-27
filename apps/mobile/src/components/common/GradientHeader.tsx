import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients, FontSize, FontWeight, Space } from '../../utils/theme';

interface GradientHeaderProps {
  title: string;
  gradient?: readonly string[];
  children?: React.ReactNode;
  style?: ViewStyle;
}

export default function GradientHeader({
  title,
  gradient,
  children,
  style,
}: GradientHeaderProps) {
  const colors = (gradient ?? Gradients.vivid) as [string, string, ...string[]];

  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, style]}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Space.xl,
    paddingTop: 60,
    paddingBottom: Space.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});