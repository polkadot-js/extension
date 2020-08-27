import { transparentize, darken } from 'polished';
import { Styles } from '../../styles/types';
import {
  ButtonProps,
  ButtonDefaultProps,
  ButtonIconPosition,
} from './definitions';

export const getVariant: Styles<ButtonProps> = ({
  theme,
  variant = ButtonDefaultProps.variant,
}) =>
  ({
    primary: {
      backgroundColor: theme.colors.primary,
      color: '#fff',
      boxShadow: theme.shadows[2],
      '&:hover': {
        backgroundColor: theme.colors.brandDark,
        boxShadow: theme.shadows[3],
      },
      '&:active': {
        backgroundColor: transparentize(0.2, theme.colors.brandDark),
        boxShadow: theme.shadows[3],
      },
    },
    secondary: {
      backgroundColor: theme.colors.disabled,
      color: theme.colors.highlightText,
      '&:hover': {
        color: theme.colors.brandMain,
        backgroundColor: theme.colors.brandLightest,
      },
      '&:active': {
        backgroundColor: darken(0.1, theme.colors.brandLightest),
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.highlightText,
      '&:hover': {
        color: theme.colors.highlightText,
        backgroundColor: theme.colors.disabled,
      },
      '&:disabled': {
        backgroundColor: 'transparent',
      },
    },
    ghostSecondary: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: 'currentColor',
      padding: 0,
      '&:hover': {
        backgroundColor: 'transparent',
        color: 'currentColor',
        opacity: 0.5,
      },
      '&:disabled': {
        opacity: 1,
      },
    },
    gray: {
      backgroundColor: theme.colors.gray[4],
      color: theme.colors.gray[1],
      '&:hover': {
        color: theme.colors.brandMain,
        backgroundColor: theme.colors.brandLightest,
      },
      '&:active': {
        backgroundColor: darken(0.1, theme.colors.brandLightest),
      },
    },
    light: {
      backgroundColor: '#fff',
      color: theme.colors.gray[1],
      boxShadow: theme.shadows[2],
      '&:hover': {
        backgroundColor: theme.colors.gray[4],
      },
    },
    transparent: {
      backgroundColor: 'transparent',
    },
    raw: {},
  }[variant]);

export const getIconStyle = (position: ButtonIconPosition) =>
  ({
    top: 'Bottom',
    bottom: 'Top',
    left: 'Right',
    right: 'Left',
  }[position]);
