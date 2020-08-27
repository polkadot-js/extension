import React, { ForwardRefRenderFunction } from 'react';
import { styled }  from '../../styles';
import { Icon } from '../Icon';
import { buttonReset } from '../../styles/utils';
import { getVariant, getIconStyle } from './styles';
import { ButtonProps, ButtonDefaultProps } from './definitions';

const ButtonComponent: ForwardRefRenderFunction<HTMLButtonElement, React.PropsWithChildren<ButtonProps>> = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { onClick, variant, fluid, RouterLink, iconPosition, href, ...otherProps },
  ref
) => {
  if (RouterLink) {
    return <RouterLink {...otherProps} />;
  } else {
    return (
      <button
        ref={ref}
        onClick={onClick}
        role={href && 'button'}
        {...(href && { type: undefined })}
        {...otherProps}
      />
    );
  }
};

const ButtonWithRef = React.forwardRef(ButtonComponent);

export const Button = styled(ButtonWithRef)<ButtonProps>(
  buttonReset,
  ({ theme, fluid, tight, iconPosition }) => ({
    whiteSpace: 'nowrap',
    position: 'relative',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    textAlign: 'center',
    textDecoration: 'none',
    letterSpacing: '0.75px',
    border: 'none',
    padding: '0.75rem 1.75rem',
    minHeight: '2.5rem',
    minWidth: tight ? '100px' : '128px',
    lineHeight: theme.lineHeights.tight,
    fontFamily: theme.fontFamilies.baseText,
    fontSize: theme.fontSizes[1],
    fontWeight: theme.fontWeights.semiBold,
    borderRadius: '8px',
    ...(fluid && { width: '100%' }),

    '&:disabled, &:disabled:hover': {
      backgroundColor: theme.colors.disabled,
      color: theme.colors.inactive,
      boxShadow: 'none',
      cursor: 'not-allowed',
    },

    [Icon]: {
      ...(iconPosition && {
        [`margin${getIconStyle(iconPosition)}`]: theme.space.s,
      }),
    },
  }),
  getVariant
);

Button.defaultProps = ButtonDefaultProps;
