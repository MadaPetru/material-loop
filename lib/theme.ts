export const colors = {
  bg: '#EDE9E2',
  bgMuted: '#E3DED5',
  bgElevated: '#FAF8F4',
  ink: '#152018',
  inkMuted: '#5A645C',
  inkFaint: '#8B948C',
  line: '#D2CBC0',
  brand: '#1F4D32',
  brandDark: '#143524',
  brandSoft: '#DCEADF',
  accent: '#B85A2A',
  accentSoft: '#F3E4DA',
  danger: '#9B2F24',
  dangerSoft: '#F6E6E3',
  success: '#1F4D32',
  successSoft: '#DCEADF',
  mapDust: '#C4B9A8',
  white: '#FFFFFF',
  overlay: 'rgba(21, 32, 24, 0.5)',
  heroFrom: '#1F4D32',
  heroVia: '#163A27',
  heroTo: '#2A4030',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const fonts = {
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansBold: 'DMSans_700Bold',
  display: 'SourceSerif4_600SemiBold',
  displayBold: 'SourceSerif4_700Bold',
};

export const typography = {
  displayHero: { fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 46 },
  displayLg: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34 },
  displayMd: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  title: { fontFamily: fonts.sansBold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18 },
};

export const layout = {
  mobileMax: 639,
  tabletMin: 640,
  desktopMin: 1024,
  contentMax: 1120,
  contentNarrow: 480,
  gutterMobile: spacing.lg,
  gutterDesktop: spacing.xxl,
};

export const shadows = {
  soft: {
    shadowColor: '#152018',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  lift: {
    shadowColor: '#152018',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 6,
  },
};
