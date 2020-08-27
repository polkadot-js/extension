/* eslint-disable prefer-destructuring */
import { darken } from 'polished';

export const breakpoints = {
  sm: 0,
  md: '42.5em', // 680px
  lg: '64em', // 1024px
  xl: '80em', // 1280px
};

export const fontSizes = {
  0: '0.75rem', // 12px
  1: '0.875rem', // 14px
  2: '1rem', // 16px
  3: '1.125rem', // 18px
  4: '1.25rem', // 20px
  5: '1.5rem', // 24px
  6: '1.75rem', // 28px
  7: '2.125rem', // 34px
  8: '2.625rem', // 42px
  9: '3rem', // 48px
  10: '3.75rem', // 60px,
  baseText: '1rem',
};

export const borderWidths = {
  0: '0px',
  1: '1px',
};

export const fontFamilies = {
  baseText: "'Inter', sans-serif",
};

export const lineHeights = {
  none: 1, // 16 px
  extraTight: 1.15, // 18 px
  tighter: 1.316,
  tight: 1.392, // fS == 34px => 47px
  lessTight: 1.452, // for fontSize 20px it is 29px
  normal: 1.688, // 27 px
  loose: 2.188, // 35 px
  medium: 2.938, // 47 px
  large: 4.188, // 67 px
  xlarge: 4.938, // 79 px
};

export type TFontWeightCustom =
  | 'light'
  | 'normal'
  | 'semiBold'
  | 'bold'
  | 'strong';

export const fontWeights = {
  light: 300,
  normal: 400,
  semiBold: 500,
  bold: 600,
  strong: 700,
};

export const space = {
  0: '0',
  1: '5px',
  2: '10px',
  3: '16px',
  4: '24px',
  5: '36px',
  6: '48px',
  7: '80px',
  8: '120px',

  xs: '5px',
  s: '10px',
  m: '16px',
  l: '36px',
  xl: '48px',
  xxl: '80px',
  xxxl: '120px',
  formGap: '21px',
  gridGap: '24px',

  '-0': '-0',
  '-1': '-5px',
  '-2': '-10px',
  '-3': '-16px',
  '-4': '-24px',
  '-5': '-36px',
  '-6': '-48px',
  '-7': '-80px',
  '-8': '-120px',

  '-xs': '-5px',
  '-s': '-10px',
  '-m': '-16px',
  '-l': '-36px',
  '-xl': '-48px',
  '-xxl': '-80px',
  '-xxxl': '-120px',
  '-formGap': '-21px',
  '-gridGap': '-24px',
};

export const zIndexes = {
  header: 80,
  sidebar: 100,
  modals: 120,
  selects: 140,
  tooltips: 9999,
};

const _colors = {
  gray: ['#FFFFFF', '#152935', '#6C7D89', '#8C9BA5', '#EBF0F7'],
  brandBg: '#FAFDFF',
  brandLightest: '#DCEFFE',
  brandLighter: '#6DC7F7',
  brandMain: '#1348E4',
  brandDark: '#0024BD',
  brandDarkest: '#170087',
  info: '#2574B5',
  green: ['#00AA5E', '#0B6B40', '#D4F7E7'],
  yellow: ['#EFC100', '#FBF3D0', '#E3A30C'],
  red: ['#DB2C3E', '#FAE6E8'],
  white: '#FFFFFF',
};

const gradients = {
  primary: `linear-gradient(
    180.63deg,
    ${_colors.brandLightest} 0.03%,
    rgba(220, 239, 254, 0) 79.96%
  )`,
};

export const colors = {
  ..._colors,
  baseText: _colors.gray[3],
  highlightText: _colors.gray[1],
  placeholder: _colors.gray[3],
  inactive: _colors.gray[2],
  disabled: _colors.gray[4],
  primary: _colors.brandMain,
  secondary: _colors.brandLighter,
  idle: _colors.brandLighter,
  alert: _colors.red[0],
  warning: _colors.yellow[0],
  success: _colors.green[0],
  gradient: gradients.primary,
};

export const shadows = {
  0: '',
  1: '0px 1px 2px rgba(21, 41, 53, 0.24), 0px 1px 3px rgba(21, 41, 53, 0.12);',
  2: '0px 3px 6px rgba(21, 41, 53, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.16);',
  3: '0px 3px 6px rgba(21, 41, 53, 0.1), 0px 10px 20px rgba(21, 41, 53, 0.15);',
  4: '0px 5px 10px rgba(21, 41, 53, 0.05), 0px 15px 25px rgba(21, 41, 53, 0.15);',
  5: '0px 20px 40px rgba(21, 41, 53, 0.1);',
};

export const radii = {
  0: '',
  1: '2px',
  2: '4px',
  3: '8px',
  4: '16px',
};

export type TTextVariant =
  | 'b1m'
  | 'b1'
  | 'b2m'
  | 'b2'
  | 'b3m'
  | 'b3'
  | 'sh1'
  | 'c1'
  | 'c2';

export const texts = {
  b1: {
    color: colors.gray[5],
    fontSize: fontSizes[2],
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  b1m: {
    color: colors.highlightText,
    fontSize: fontSizes[2],
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.normal,
  },
  b2: {
    color: colors.gray[5],
    fontSize: fontSizes[1],
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  b2m: {
    color: colors.highlightText,
    fontSize: fontSizes[1],
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.normal,
  },
  b3: {
    color: colors.highlightText,
    fontSize: fontSizes[0],
    fontWeight: fontWeights.normal,
  },
  b3m: {
    color: colors.highlightText,
    fontSize: fontSizes[0],
    fontWeight: fontWeights.semiBold,
  },
  sh1: {
    color: colors.gray[5],
    fontSize: fontSizes[3],
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.normal,
  },
  c1: {
    color: colors.gray[1],
    fontSize: fontSizes[1],
    lineHeight: lineHeights.none,
    fontWeight: fontWeights.semiBold,
    letterSpacing: '0.4px',
  },
  c2: {
    color: colors.brandMain,
    fontSize: fontSizes[0],
    lineHeight: lineHeights.none,
    fontWeight: fontWeights.semiBold,
    letterSpacing: '0.4px',
  },
};

export const headings = {
  h1: {
    color: colors.highlightText,
    fontSize: fontSizes[10],
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.tighter,
    letterSpacing: -1,
  },
  h2: {
    color: colors.highlightText,
    fontSize: fontSizes[9],
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.tight,
    letterSpacing: -0.5,
  },
  h3: {
    color: colors.highlightText,
    fontSize: fontSizes[7],
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.tight,
    letterSpacing: -0.25,
  },
  h4: {
    color: colors.highlightText,
    fontSize: fontSizes[5],
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.lessTight,
  },
  h5: {
    color: colors.highlightText,
    fontSize: fontSizes[4],
    fontWeight: fontWeights.semiBold,
    letterSpacing: 0.15,
    lineHeight: lineHeights.lessTight,
  },
  h6: {
    color: colors.highlightText,
    fontSize: fontSizes.baseText,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
};

export const links = {
  color: colors.brandMain,
  '&:hover, &:focus': {
    color: darken(0.2, colors.secondary),
  },
};

export const transitions = {
  hover: {
    ms: 150,
  },
  modal: {
    ms: 200,
  },
};

const _maxWidth = {
  0: '500px',
  1: '700px',
  2: '850px',
  3: '1000px',
  4: '1600px',
};

export const maxWidth = {
  ..._maxWidth,
  xs: _maxWidth[0],
  s: _maxWidth[1],
  m: _maxWidth[2],
  l: _maxWidth[3],
  xl: _maxWidth[4],
};

export const header = {
  height: '48px',
};

export const sidebar = {
  width: '124px',
};

export const footer = {
  height: header.height,
};
