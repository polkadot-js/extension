import { ButtonHTMLAttributes } from 'react';
import { WidthProps } from 'styled-system';

export type HtmlButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
export type ButtonIconPosition = 'left' | 'right' | 'top' | 'bottom';
export type variants =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'ghostSecondary'
  | 'transparent'
  | 'raw'
  | 'light'
  | 'gray';

export type ButtonProps = HtmlButtonProps & {
  /**
   * Specify the variant of Button you want to create
   */
  variant?: variants;
  fluid?: boolean;
  tight?: boolean;
  /**
   * Optionally specify an href for your Button
   */
  href?: string;
  RouterLink?: React.ComponentType<any>;
  iconPosition?: ButtonIconPosition;
} & WidthProps;

export const ButtonDefaultProps = {
  onClick: () => {},
  variant: 'primary' as variants,
  fluid: false,
  tabIndex: 0,
  type: 'button' as HtmlButtonProps['type'],
};
