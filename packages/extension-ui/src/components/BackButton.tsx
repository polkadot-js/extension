import React from 'react';
import styled from 'styled-components';

import arrowLeft from '../assets/arrowLeft.svg';
import Svg from './Svg';
import Button from './Button';

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
  background: ${({ theme }): string => theme.backButtonBackground};
`;

const ArrowLeft = styled(Svg).attrs(() => ({
  src: arrowLeft
}))`
  width: 12px;
  height: 12px;
  display: block;
  margin: auto;
  background: ${({ theme }): string => theme.backButtonTextColor};
`;
