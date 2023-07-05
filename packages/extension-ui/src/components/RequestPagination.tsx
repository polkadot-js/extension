// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback } from 'react';
import styled from 'styled-components';

import useTranslation from '../hooks/useTranslation';

interface Props {
  className?: string;
  index: number;
  totalItems: number;
  onNextClick: () => void;
  onPreviousClick: () => void;
  singularName: string;
  pluralName: string;
}

function RequestPagination({
  className,
  index,
  onNextClick,
  onPreviousClick,
  pluralName,
  singularName,
  totalItems: unsanitizedTotalItems
}: Props): React.ReactElement<Props> {
  const totalItems = unsanitizedTotalItems < 0 ? 0 : unsanitizedTotalItems;
  const { t } = useTranslation();
  const previousClickActive = index !== 0;
  const nextClickActive = index < totalItems - 1;

  const prevClick = useCallback((): void => {
    previousClickActive && onPreviousClick();
  }, [onPreviousClick, previousClickActive]);

  const nextClick = useCallback((): void => {
    nextClickActive && onNextClick();
  }, [nextClickActive, onNextClick]);

  const requestsLeft = totalItems - 1;

  return (
    <div className={className}>
      <div>
        <span>
          {requestsLeft}&nbsp;{t<string>('more')}&nbsp;
          {requestsLeft === 1 ? singularName : pluralName}
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
          <span className='divider'>/</span>
          <span className='totalSteps'>{totalItems}</span>
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

export default styled(RequestPagination)(
  ({ theme }: ThemeProps) => `
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-radius: 32px;
  box-sizing: border-box;
  padding-block: 8px;
  padding-inline: 16px;
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
    color: ${theme.transactionTooltipTextColor};
    padding: 0.5rem;

    &.active {
      color: ${theme.buttonTextColor};
      cursor: pointer;
    }
  }

  .currentStep, .divider, .totalSteps {
    display: inline-block;
    min-width: 14px;

    text-align: center;

    font-size: 14px;
    line-height: 120%;
  }

`
);
