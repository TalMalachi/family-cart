export const Colors = {
  // Primary brand – rich emerald gradient range
  teal:        '#0EA573',
  tealLight:   '#E8FAF3',
  tealMid:     '#0B7D58',
  tealDark:    '#064D37',
  tealVibrant: '#10C77E',

  // Secondary – indigo blue
  blue:        '#4F46E5',
  blueLight:   '#EEF2FF',
  blueMid:     '#3730A3',

  // Accent – warm amber
  amber:       '#F59E0B',
  amberLight:  '#FFFBEB',

  // Semantic
  danger:      '#EF4444',
  dangerLight: '#FEF2F2',
  warning:     '#F59E0B',
  warningLight:'#FFFBEB',
  success:     '#0EA573',

  // Neutrals
  white:       '#FFFFFF',
  bg:          '#F8FAFC',
  bgCard:      '#FFFFFF',
  bgSecondary: '#F1F5F9',
  border:      'rgba(0,0,0,0.06)',
  borderMid:   'rgba(0,0,0,0.12)',

  // Text
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  textInverse:   '#FFFFFF',
}

// Gradient presets for LinearGradient
export const Gradients = {
  teal:    ['#0EA573', '#059669'] as const,
  tealExt: ['#10C77E', '#0EA573', '#059669'] as const,
  blue:    ['#6366F1', '#4F46E5'] as const,
  dark:    ['#1E293B', '#0F172A'] as const,
  card:    ['#FFFFFF', '#F8FAFC'] as const,
  warm:    ['#F59E0B', '#D97706'] as const,
}

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   22,
  xxl:  28,
  hero: 34,
}

export const FontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semi:    '600' as const,
  bold:    '700' as const,
}

export const Radius = {
  sm:   10,
  md:   14,
  lg:   20,
  xl:   28,
  full: 999,
}

export const Space = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
}

export const Shadow = {
  card: {
    shadowColor:   '#0EA573',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius:  8,
    elevation:     3,
  },
  elevated: {
    shadowColor:   '#0F172A',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius:  16,
    elevation:     5,
  },
  strong: {
    shadowColor:   '#0F172A',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius:  24,
    elevation:     8,
  },
  glow: {
    shadowColor:   '#0EA573',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius:  16,
    elevation:     6,
  },
}