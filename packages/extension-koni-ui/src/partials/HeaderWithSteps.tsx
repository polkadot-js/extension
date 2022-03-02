// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import Link from '@polkadot/extension-koni-ui/components/Link';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import Header from '@polkadot/extension-koni-ui/partials/Header';

interface Props extends ThemeProps {
  className?: string;
  step: number;
  text: string;
  onBackClick: () => void;
  isBusy: boolean;
}

function HeaderWithSteps ({ className, isBusy, onBackClick, step, text }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Header
      className={className}
      isBusy={isBusy}
      text={text}
    >
      <div className='header-with-steps'>
        <div className='header-with-steps-left-content'>
          {step === 2 && (
            <FontAwesomeIcon
              className={`back-button-icon ${isBusy ? 'disabled-button' : ''}`}
              // @ts-ignore
              icon={faArrowLeft}
              onClick={onBackClick}
            />
          )}
        </div>
        <div className='header-with-steps-title'>{text}</div>
        <div className='steps'>
          <div>
            <span className='current'>{step}</span>
            <span className='total'>/2</span>
          </div>
          <Link
            className={`header-with-steps-cancel-btn ${isBusy ? 'disabled-button' : ''}`}
            to='/'
          >
            <span>{t<string>('Cancel')}</span>
          </Link>
        </div>
      </div>

    </Header>
  );
}

export default React.memo(styled(HeaderWithSteps)(({ theme }: Props) => `

  .header-with-steps {
    display: flex;
    align-items: center;
    padding: 7px 0;
  }

  .disabled-button {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none !important;
  }

  .header-with-steps-title {
    font-size: 20px;
    line-height: 30px;
    color: ${theme.textColor};
    font-weight: 500;
  }

  .header-with-steps-left-content {
    align-items: center;
    display: flex;
    flex: 1;
    padding-left: 15px;
  }

  .back-button-icon {
    cursor: pointer;
    color: ${theme.textColor}
  }

  .current {
    font-size: ${theme.labelFontSize};
    line-height: ${theme.labelLineHeight};
    color: ${theme.textColor};
  }

  .steps {
    align-items: center;
    display: flex;
    justify-content: space-between;
    flex: 1;
    padding-left: 9px;
    padding-right: 15px;
  }

  .total {
    font-size: ${theme.labelFontSize};
    line-height: ${theme.labelLineHeight};
    color: ${theme.textColor2};
  }

  .header-with-steps-cancel-btn {
    span {
      color: ${theme.buttonTextColor2};
      font-size: 15px;
      line-height: 24px;
    }
  }
`));
