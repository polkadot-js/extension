// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import Link from '@polkadot/extension-koni-ui/components/Link';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string,
  showBackArrow?: boolean,
  subHeaderName?: string,
  showCancelButton?: boolean,
  isBusy?: boolean
}

function SubHeader ({ className = '', isBusy, showBackArrow, showCancelButton, subHeaderName }: Props): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className={`subheader-container ${className}`}>
      <div className={'subheader-container__part-1'}>
        {showBackArrow && (
          <Link
            className='backlink'
            to='/'
          >
            <FontAwesomeIcon
              className={`arrowLeftIcon ${isBusy ? 'disabled-btn' : ''}`}
              icon={faArrowLeft}
            />
          </Link>
        )
        }
      </div>
      <div className={'subheader-container__part-2'}>
        <div className='subheader-container__text'>
          {subHeaderName}
        </div>
      </div>
      <div className={'subheader-container__part-3'}>
        {showCancelButton && (
          <Link
            className='sub-header__cancel-btn'
            to='/'
          >
            <span>{t<string>('Cancel')}</span>
          </Link>
        )
        }
      </div>
    </div>
  );
}

export default styled(SubHeader)(({ theme }: Props) => `
  display: flex;
  align-items: center;
  padding-bottom: 13px;
  margin: 7px 15px 0 15px;

  .subheader-container__text {
    font-size: 20px;
    line-height: 30px;
    font-weight: 500;
    color: ${theme.textColor};
  }

  .disabled-btn {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none !important;
  }

  .subheader-container__part-1 {
    flex: 1;
  }

  .subheader-container__part-2 {
  }

  .subheader-container__part-3 {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .sub-header__cancel-btn {
    color: ${theme.buttonTextColor2};
  }
`);
