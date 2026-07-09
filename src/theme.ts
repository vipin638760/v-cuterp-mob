// Luxe Obsidian — canonical tokens. Do NOT invent new colors.
// Source of truth: MOBILE_DESIGN.md §2.

export const colors = {
  bg: '#0a0806',
  bg2: '#13100c',
  bg3: '#1a1510',
  bg4: '#221c15',
  bg5: '#2a231a',

  line: 'rgba(212, 165, 116, 0.08)',
  line2: 'rgba(212, 165, 116, 0.14)',

  text: '#f5e6c8',
  text2: '#d4a574',
  text3: '#8a7a5f',
  text4: '#5a4e3d',

  gold: '#d4a574',
  gold2: '#b8864a',
  goldBright: '#f0c987',

  green: '#6bbf7b',
  red: '#d46b6b',
  orange: '#e0955a',
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 18,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const fonts = {
  serifRegular: 'CormorantGaramond_400Regular',
  serifMedium: 'CormorantGaramond_500Medium',
  serifSemiBold: 'CormorantGaramond_600SemiBold',
  serifItalic: 'CormorantGaramond_400Regular_Italic',
  sansRegular: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  sansExtraBold: 'Inter_800ExtraBold',
  script: 'GreatVibes_400Regular',
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
    elevation: 24,
  },
} as const;

export const greetingForHour = (h: number): string => {
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
};

export const INR = (v: number | null | undefined): string => {
  const n = Math.round(Number(v) || 0);
  return (n < 0 ? '-₹' : '₹') + Math.abs(n).toLocaleString('en-IN');
};
