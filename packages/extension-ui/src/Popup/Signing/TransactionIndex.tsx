// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import { Svg } from '../../components';
import ArrowLeftImage from '../../assets/arrowLeft.svg';

interface Props {
  index: number;
  totalItems: number;
  onNextClick: () => void;
  onPreviousClick: () => void;
  className?: string;
}

function TransactionIndex ({ index, totalItems, onNextClick, onPreviousClick }: Props): React.ReactElement<Props> {
  const previousClickActive = index !== 0;
  const nextClickActive = index < totalItems - 1;

  return (
    <CreationSteps>
      <div>
        <CurrentStep>{index + 1}</CurrentStep>
        <TotalSteps>/{totalItems}</TotalSteps>
      </div>
      <div>
        <ArrowLeft onClick={(): unknown => previousClickActive && onPreviousClick()} isActive={previousClickActive} />
        <ArrowRight onClick={(): unknown => nextClickActive && onNextClick()} isActive={nextClickActive} />
      </div>
    </CreationSteps>
  );
}

const CreationSteps = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
  padding-right: 24px;
`;

const CurrentStep = styled.span`
  font-size: ${({ theme }): string => theme.labelFontSize};
  line-height: ${({ theme }): string => theme.labelLineHeight};
  color: ${({ theme }): string => theme.primaryColor};
  font-weight: 600;
  margin-left: 10px;
`;

const TotalSteps = styled.span`
  font-size: ${({ theme }): string => theme.labelFontSize};
  line-height: ${({ theme }): string => theme.labelLineHeight};
  color: ${({ theme }): string => theme.textColor};
  font-weight: 600;
`;

interface ArrowProps {
  isActive: boolean;
}

const ArrowLeft = styled(Svg).attrs(() => ({
  src: ArrowLeftImage
}))<ArrowProps>`
  display: inline-block;
  background: ${({ isActive, theme }): string => isActive ? theme.primaryColor : theme.iconNeutralColor};
  cursor: ${({ isActive }): string => isActive ? 'pointer' : 'default'};
  width: 12px;
  height: 12px;
`;
ArrowLeft.displayName = 'ArrowLeft';

const ArrowRight = styled(ArrowLeft)`
  margin-left: 6px;
  transform: rotate(180deg);
`;
ArrowRight.displayName = 'ArrowRight';

export default TransactionIndex;
