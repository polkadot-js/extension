// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props {
  className?: string;
  index: number;
  totalItems: number;
  onNextClick: () => void;
  onPreviousClick: () => void;
}

function TransactionIndex ({ className, index, onNextClick, onPreviousClick, totalItems }: Props): React.ReactElement<Props> {
  const previousClickActive = index !== 0;
  const nextClickActive = index < totalItems - 1;

  const prevClick = useCallback(
    (): void => {
      previousClickActive && onPreviousClick();
    },
    [onPreviousClick, previousClickActive]
  );

  const nextClick = useCallback(
    (): void => {
      nextClickActive && onNextClick();
    },
    [nextClickActive, onNextClick]
  );

  return (
    <div className={className}>
      <div>
        <span className='currentStep'>{index + 1}</span>
        <span className='totalSteps'>/{totalItems}</span>
      </div>
      <div>
        <FontAwesomeIcon
          className={`arrowLeft ${previousClickActive ? 'active' : ''}`}
          icon={faArrowLeft}
          onClick={prevClick}
          size='sm'
        />
        <FontAwesomeIcon
          className={`arrowRight ${nextClickActive ? 'active' : ''}`}
          icon={faArrowRight}
          onClick={nextClick}
          size='sm'
        />
      </div>
    </div>
  );
}

export default styled(TransactionIndex)(({ theme }: ThemeProps) => `
  align-items: center;
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
  padding-right: 24px;

  .arrowLeft, .arrowRight {
    display: inline-block;
    color: ${theme.iconNeutralColor};

    &.active {
      color: ${theme.primaryColor};
      cursor: pointer;
    }
  }

  .arrowRight {
    margin-left: 0.5rem;
  }

  .currentStep {
    color: ${theme.primaryColor};
    font-size: ${theme.labelFontSize};
    line-height: ${theme.labelLineHeight};
    margin-left: 10px;
  }

  .totalSteps {
    font-size: ${theme.labelFontSize};
    line-height: ${theme.labelLineHeight};
    color: ${theme.textColor};
  }
`);
