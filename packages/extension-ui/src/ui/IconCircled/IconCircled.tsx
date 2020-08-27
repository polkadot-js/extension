import React from 'react';
import styled from 'styled-components';
import { Icon } from '../Icon';

type IconProps = React.ComponentProps<typeof Icon>;

export const IconCircled = styled(Icon)<IconProps>({
  borderRadius: '50%',
});

IconCircled.defaultProps = {
  ...Icon.defaultProps,
  bg: 'brandLightest',
  scale: 0.9,
  width: 48,
  height: 48,
};
