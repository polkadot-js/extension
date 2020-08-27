import { darken, lighten, getLuminance } from 'polished';
import { style } from 'styled-system';
import { Styles } from './themeTypes';

export const MaxWidthScale = style({
  // React prop name
  prop: 'maxWidth',
  // key for theme values
  key: 'maxWidth',
});

export const ellipsis: Styles = () => ({
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
});

export const FormFieldLabel: Styles = ({ theme }) => ({
  color: theme.colors.highlightText,
  fontSize: theme.fontSizes[1],
  fontWeight: 600,
});

export const FormFieldError: Styles = ({ theme }) => ({
  fontSize: theme.fontSizes[0],
  color: theme.colors.red[0],
  fontWeight: 400,
});

export const textLinkInverted: Styles = () => ({
  textDecoration: 'none',

  '&:hover, &:focus': {
    textDecoration: 'underline',
  },
});

export const ulReset: Styles = () => ({
  listStyle: 'none',
  padding: 0,
  margin: 0,
});

export const buttonReset: Styles = ({ theme }) => ({
  padding: 0,
  background: 'none',
  textTransform: 'none',
  letterSpacing: 'normal',
  border: 'none',
  cursor: 'pointer',
  transitionDuration: `${theme.transitions.hover.ms}ms`,
  transitionProperty: 'background, color, box-shadow, opacity',
});

export const inputs: Styles = ({ theme }) => ({
  height: 40, // this needs to be a number because it's being used in JS logic
  backgroundColor: theme.colors.gray[1],
  borderRadius: theme.radii[1],
});

export const getHoverColor = (color: string) =>
  getLuminance(color) > 0.5 ? darken(0.2, color) : lighten(0.2, color);

export const visuallyHidden: Styles = () => ({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  border: 0,
});
