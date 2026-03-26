import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Stitch, Shadow, Colors, Radius } from '../../utils/theme';

interface StitchCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  stitchColor?: string;
}

export default function StitchCard({
  children,
  style,
  contentStyle,
  stitchColor,
}: StitchCardProps) {
  const color = stitchColor ?? Stitch.borderColor;

  return (
    <View style={[styles.outer, style]}>
      <View style={[styles.stitchBorder, { borderColor: color }]}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: Stitch.outerBg,
    borderRadius: Stitch.borderRadius,
    padding: Stitch.insetPadding,
    ...Shadow.card,
  },
  stitchBorder: {
    borderWidth: Stitch.borderWidth,
    borderStyle: 'dashed',
    borderColor: Stitch.borderColor,
    borderRadius: Stitch.borderRadius - 2,
  },
  content: {
    backgroundColor: Colors.bgCard,
    borderRadius: Stitch.borderRadius - 4,
    overflow: 'hidden',
  },
});
