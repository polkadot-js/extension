/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-shadow */
import React, { FC, CSSProperties } from 'react';
import { color, width, height, TLengthStyledSystem } from 'styled-system';
import { Box, BoxThemeProps } from '../Box';
import { styled } from '../../styles';

export interface IconProps extends BoxThemeProps {
  Asset: React.ComponentType<React.SVGAttributes<SVGElement>>;
  width?: TLengthStyledSystem;
  height?: TLengthStyledSystem;
  scale?: number;
  rotate?: string;
  ariaLabel?: string;
  className?: string;
  onClick?: any;
  style?: CSSProperties;
  br?: any;
  id?: string;
}

const IconComponent: FC<IconProps> = ({
  Asset,
  color,
  width,
  height,
  scale,
  rotate,
  bg, // Filter out prop coming from IconCircled component
  className,
  ariaLabel,
  ...props
}) => {
  return (
    <Box as="span" className={className} {...props}>
      <Asset role="img" aria-label={ariaLabel} />
    </Box>
  );
};

export const Icon = styled(IconComponent)<IconProps>(
  color,
  width,
  height,
  ({ scale, rotate }) => ({
    display: 'inline-block',
    verticalAlign: 'middle',

    svg: {
      display: 'block',
      width: '100%',
      height: '100%',
      ...(scale && { padding: `${(1 - scale) * 100}%` }),
      ...(rotate && { transform: `rotateZ(${rotate})` }),
    },
  })
);

Icon.defaultProps = {
  width: '1em',
  height: '1em',
};
