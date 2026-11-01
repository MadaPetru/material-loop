import { useWindowDimensions } from 'react-native';
import { layout } from '@/lib/theme';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const breakpoint: Breakpoint =
    width >= layout.desktopMin ? 'desktop' : width >= layout.tabletMin ? 'tablet' : 'mobile';
  const isDesktop = breakpoint === 'desktop';
  const isTablet = breakpoint === 'tablet';
  const isMobile = breakpoint === 'mobile';
  const columns = isDesktop ? 3 : isTablet ? 2 : 1;
  const contentPad = isDesktop ? layout.gutterDesktop : layout.gutterMobile;
  const contentMaxWidth = isDesktop ? layout.contentMax : undefined;

  return {
    width,
    height,
    breakpoint,
    isDesktop,
    isTablet,
    isMobile,
    columns,
    contentPad,
    contentMaxWidth,
  };
}
