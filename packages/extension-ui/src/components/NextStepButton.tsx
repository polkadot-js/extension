// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import arrowLeft from '../assets/arrowLeft.svg';
import Svg from './Svg';
import Button from './Button';

type Props = React.ComponentProps<typeof Button>;

export default function NextStepButton ({ children, ...props }: Props): React.ReactElement<Props> {
  return (
    <Button {...props}>
      {children}
      <ArrowRight />
    </Button>
  );
}

const ArrowRight = styled(Svg).attrs(() => ({
  src: arrowLeft
}))`
  float: right;
  width: 12px;
  height: 12px;
  margin: 4px 1px 0 0;
  transform: rotate(180deg);
  background: ${({ theme }: ThemeProps): string => theme.buttonTextColor};
`;
