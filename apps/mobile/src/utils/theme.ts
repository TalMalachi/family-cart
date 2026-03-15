export const Colors = {
  // Primary brand
  teal:        '#1D9E75',
  tealLight:   '#E1F5EE',
  tealMid:     '#0F6E56',
  tealDark:    '#085041',

  // Secondary
  blue:        '#185FA5',
  blueLight:   '#E6F1FB',

  // Semantic
  danger:      '#E24B4A',
  dangerLight: '#FCEBEB',
  warning:     '#BA7517',
  warningLight:'#FAEEDA',
  success:     '#1D9E75',

  // Neutrals
  white:       '#FFFFFF',
  bg:          '#F5F5F2',
  bgCard:      '#FFFFFF',
  bgSecondary: '#F1EFE8',
  border:      'rgba(0,0,0,0.10)',
  borderMid:   'rgba(0,0,0,0.18)',

  // Text
  textPrimary:   '#1A1A18',
  textSecondary: '#6B6A63',
  textTertiary:  '#9C9A92',
  textInverse:   '#FFFFFF',
}

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  26,
  hero: 32,
}

export const FontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semi:    '600' as const,
}

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
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
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  4,
    elevation:     2,
  },
  strong: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius:  12,
    elevation:     6,
  },
}
