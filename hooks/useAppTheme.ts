import { useMemo } from 'react';
import { theme } from '@/constants/colors';

export const useAppTheme = () => {
  return useMemo(() => theme, []);
};
