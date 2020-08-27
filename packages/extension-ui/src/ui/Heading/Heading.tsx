import styled from 'styled-components';
import {
  variant,
  color,
  ColorProps,
  fontWeight,
  FontWeightProps,
  lineHeight,
  LineHeightProps,
  fontSize,
  FontSizeProps,
  LetterSpacingProps,
  letterSpacing,
} from 'styled-system';

import { Box } from '../Box';

const headingStyle = variant({
  key: 'headings',
});

export type HeadingProps = {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
} & ColorProps &
  FontWeightProps &
  FontSizeProps &
  LineHeightProps &
  LetterSpacingProps;

const StyledHeading = styled(Box)<HeadingProps>`
  ${headingStyle};
  ${color};
  ${fontWeight};
  ${lineHeight};
  ${fontSize};
  ${letterSpacing}
`;

export const Heading = Object.assign(StyledHeading, {
  defaultProps: {
    as: 'h2',
    variant: 'h3',
    mt: 0,
    mb: 0,
  },
});
