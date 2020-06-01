// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../../types';

import React from 'react';
import styled from 'styled-components';

import { Svg } from '../../components';
import ArrowLeftImage from '../../assets/arrowLeft.svg';

interface Props {
  className?: string;
  index: number;
  totalItems: number;
  onNextClick: () => void;
  onPreviousClick: () => void;
}

interface ArrowProps extends ThemeProps {
  isActive: boolean;
}

function TransactionIndex ({ className, index, onNextClick, onPreviousClick, totalItems }: Props): React.ReactElement<Props> {
  const previousClickActive = index !== 0;
  const nextClickActive = index < totalItems - 1;

  return (
    <div className={className}>
      <div>
        <span className='currentStep'>{index + 1}</span>
        <span className='totalSteps'>/{totalItems}</span>
      </div>
      <div>
        <ArrowLeft
          isActive={previousClickActive}
          onClick={(): unknown => previousClickActive && onPreviousClick()}
        />
        <ArrowRight
          isActive={nextClickActive}
          onClick={(): unknown => nextClickActive && onNextClick()}
        />
      </div>
    </div>
  );
}

const ArrowLeft = styled(Svg).attrs(() => ({ src: ArrowLeftImage }))<ArrowProps>`
  display: inline-block;
  background: ${({ isActive, theme }: ArrowProps): string => isActive ? theme.primaryColor : theme.iconNeutralColor};
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

export default styled(TransactionIndex)(({ theme }: ThemeProps) => `
  align-items: center;
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
  padding-right: 24px;

  .currentStep {
    color: ${theme.primaryColor};
    font-size: ${theme.labelFontSize};
    line-height: ${theme.labelLineHeight};
    font-weight: 600;
    margin-left: 10px;
  }

  .totalSteps {
    font-size: ${theme.labelFontSize};
    line-height: ${theme.labelLineHeight};
    color: ${theme.textColor};
    font-weight: 600;
  }
`);
