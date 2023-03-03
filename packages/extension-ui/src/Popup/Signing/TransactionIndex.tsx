// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback } from 'react';
import styled from 'styled-components';

import useTranslation from '../../hooks/useTranslation';

interface Props {
  className?: string;
  index: number;
  totalItems: number;
  onNextClick: () => void;
  onPreviousClick: () => void;
}

function TransactionIndex({
  className,
  index,
  onNextClick,
  onPreviousClick,
  totalItems
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const previousClickActive = index !== 0;
  const nextClickActive = index < totalItems - 1;

  const prevClick = useCallback((): void => {
    previousClickActive && onPreviousClick();
  }, [onPreviousClick, previousClickActive]);

  const nextClick = useCallback((): void => {
    nextClickActive && onNextClick();
  }, [nextClickActive, onNextClick]);

  const transactionsLeft = totalItems - 1;

  return (
    <div className={className}>
      <div>
        <span>
          {transactionsLeft}&nbsp;{t<string>('more')}&nbsp;
          {transactionsLeft === 1 ? t<string>('Transaction') : t<string>('Transactions')}
        </span>
      </div>
      <div className='arrow-group'>
        <FontAwesomeIcon
          className={`arrowLeft ${previousClickActive ? 'active' : ''}`}
          icon={faChevronLeft}
          onClick={prevClick}
          size='sm'
        />
        <div>
          <span className='currentStep'>{index + 1}</span>
          <span className='totalSteps'>/{totalItems}</span>
        </div>
        <FontAwesomeIcon
          className={`arrowRight ${nextClickActive ? 'active' : ''}`}
          icon={faChevronRight}
          onClick={nextClick}
          size='sm'
        />
      </div>
    </div>
  );
}

export default styled(TransactionIndex)(
  ({ theme }: ThemeProps) => `
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-radius: 32px;
  box-sizing: border-box;
  padding: 8px 8px 8px 16px;
  gap: 83px;
  background: #FFFFFF;
  color: ${theme.buttonTextColor};
  font-family: ${theme.secondaryFontFamily};
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 120%;
  letter-spacing: 0.07em;
  width: 328px;
  height: 40px;
  margin-top: 8px;

  .arrow-group {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .arrowLeft, .arrowRight {
    display: inline-block;
    opacity: 0.65;
    color: ${theme.stepsInactiveColor};

    &.active {
      color: ${theme.buttonTextColor};
      cursor: pointer;
    }
  }

  .arrowRight {
    margin-left: 0.5rem;
  }

  .currentStep, .totalSteps {
    font-size: 14px;
    line-height: 120%;
    margin-left: 10px;
  }

`
);
