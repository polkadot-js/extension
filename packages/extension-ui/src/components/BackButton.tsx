// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import arrowLeft from '../assets/arrowLeft.svg';
import Button from './Button';
import Svg from './Svg';

interface Props {
  onClick: () => void;
}

export default function BackButton ({ onClick }: Props): React.ReactElement<Props> {
  return (
    <SmallButton onClick={onClick}>
      <ArrowLeft />
    </SmallButton>
  );
}

const SmallButton = styled(Button)`
  margin-right: 11px;
  width: 42px;
  background: ${({ theme }: ThemeProps): string => theme.backButtonBackground};
`;

const ArrowLeft = styled(Svg).attrs(() => ({
  src: arrowLeft
}))`
  width: 12px;
  height: 12px;
  display: block;
  margin: auto;
  background: ${({ theme }: ThemeProps): string => theme.backButtonTextColor};
`;
