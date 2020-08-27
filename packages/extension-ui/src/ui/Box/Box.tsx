import {
  minWidth,
  MinWidthProps,
  MaxWidthProps,
  width,
  WidthProps,
  height,
  HeightProps,
  lineHeight,
  LineHeightProps,
  space,
  SpaceProps,
  textAlign,
  TextAlignProps,
  color,
  border,
  borderColor,
  borderWidth,
  borderRadius,
  borderStyle,
  ColorProps,
  BorderProps,
  BorderColorProps,
  BorderWidthProps,
  BorderRadiusProps,
  boxShadow,
  BoxShadowProps,
  BorderBottomProps,
  BorderRightProps,
  BorderTopProps,
  BorderLeftProps,
  borderBottom,
  borderRight,
  borderTop,
  borderLeft,
} from 'styled-system';
import { StyledComponentProps } from 'styled-components';
import { styled } from '../../styles';
import { MaxWidthScale } from '../../styles/utils';
import { ScaleProps } from '../../styles/themeTypes';
import { Theme } from '@polkadot/extension-ui/types';

export type BoxThemeProps = MinWidthProps &
  MaxWidthProps &
  WidthProps &
  HeightProps &
  LineHeightProps &
  SpaceProps &
  ColorProps &
  BorderProps &
  BorderTopProps &
  BorderRightProps &
  BorderBottomProps &
  BorderLeftProps &
  BorderColorProps &
  BorderWidthProps &
  BorderRadiusProps &
  TextAlignProps &
  BoxShadowProps &
  ScaleProps;

export const Box = styled.div<BoxThemeProps>(
  minWidth,
  MaxWidthScale,
  width,
  height,
  lineHeight,
  textAlign,
  space,
  border,
  borderTop,
  borderRight,
  borderBottom,
  borderLeft,
  borderWidth,
  borderColor,
  borderRadius,
  borderStyle,
  color,
  boxShadow,
  {
    boxSizing: 'border-box',
  }
);

export type BoxProps = StyledComponentProps<typeof Box, Theme, {}, any>;
