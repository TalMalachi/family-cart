export const Colors = {
  // Primary brand – vivid purple/pink range
  teal:        '#6C5CE7',
  tealLight:   '#F0EDFF',
  tealMid:     '#5A4BD1',
  tealDark:    '#4834B5',
  tealVibrant: '#7C6CF0',

  // Secondary – ocean blue
  blue:        '#0984E3',
  blueLight:   '#E0F0FF',
  blueMid:     '#0770C2',

  // Accent – vivid orange
  amber:       '#FF922B',
  amberLight:  '#FFF5EB',

  // Semantic
  danger:      '#FF6B6B',
  dangerLight: '#FFE8E8',
  warning:     '#FF922B',
  warningLight:'#FFF5EB',
  success:     '#00B894',

  // Vivid accents
  pink:        '#E84393',
  coral:       '#FF6B6B',
  orange:      '#FF922B',
  gold:        '#FDCB6E',
  green:       '#00B894',
  cyan:        '#00CEC9',

  // Neutrals
  white:       '#FFFFFF',
  bg:          '#F0EDFF',
  bgCard:      '#FFFFFF',
  bgSecondary: '#E8E4FF',
  border:      'rgba(0,0,0,0.06)',
  borderMid:   'rgba(0,0,0,0.12)',

  // Text
  textPrimary:   '#1A1A2E',
  textSecondary: '#7C7C95',
  textTertiary:  '#94A3B8',
  textInverse:   '#FFFFFF',
}

// Gradient presets for LinearGradient
export const Gradients = {
  teal:    ['#6C5CE7', '#E84393'] as const,
  tealExt: ['#7C6CF0', '#6C5CE7', '#E84393'] as const,
  blue:    ['#0984E3', '#00CEC9'] as const,
  dark:    ['#1A1A2E', '#2D2D44'] as const,
  card:    ['#FFFFFF', '#F0EDFF'] as const,
  warm:    ['#FF922B', '#FDCB6E'] as const,
  vivid:   ['#6C5CE7', '#E84393', '#FF6B6B'] as const,
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
    shadowColor:   '#6C5CE7',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius:  8,
    elevation:     3,
  },
  elevated: {
    shadowColor:   '#1A1A2E',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius:  16,
    elevation:     5,
  },
  strong: {
    shadowColor:   '#1A1A2E',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius:  24,
    elevation:     8,
  },
  glow: {
    shadowColor:   '#6C5CE7',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius:  16,
    elevation:     6,
  },
}