// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import { ActionContext, Button, SkeletonCard } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import Header from '../../partials/Header';


interface Props extends ThemeProps {
  className?: string;
}

function AddAccount({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  // TODO: PLACEHOLDER FOR NOW
  // const _onClick = useCallback(() => onAction('/account/create'), [onAction]);
  const _onClick = useCallback(() => onAction('/account/add-menu'), [onAction]);

  return (
    <>
      <Header
        showHelp
        showSettings
        text={t<string>('Accounts')}
      />
      <div className={className}>
        <div className='background'>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className='content'>
          <div className='heading'>
            <span>{t<string>('Hello!')}</span>
          </div>
          <div className='no-accounts'>
            <p>{t<string>('Add your accounts and keep exploring the Aleph Zero ecosystem!')}</p>
          </div>
 
        </div>
        <div className='button-container'>
            <Button onClick={_onClick}>
              <FontAwesomeIcon
              className='icon'
              icon={faPlus}
            />
              {t<string>('Add account')}
            </Button>
          </div>
      </div>
    </>
  );
}

export default React.memo(styled(AddAccount)(({ theme }: Props) => `
  color: ${theme.textColor};
  height: 100%;
  z-index: 100;

  .background {
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: absolute;
    top: 88px;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: -100;
    margin-left: 16px;
    margin-right: 16px;
  }

  .content {
    display: flex;
    margin-top:100px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap:16px;
    max-height: 135px;
  }

  .button-container{
    margin: 0 auto;
    margin-top: 24px;
    width: 180px;
    padding: 16px;
    height: 80px;
    gap: 16px;
  }


  .heading {
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: 2px solid ${theme.primaryColor};
    height: 71px;
      
    span {
      font-family: ${theme.secondaryFontFamily};
      font-weight: bold;
      font-size: 34px;
      line-height: 116%;
    }

}

  h3 {
    color: ${theme.textColor};
    margin-top: 0;
    font-weight: normal;
    font-size: 24px;
    line-height: 33px;
    text-align: center;
  }

  > .image {
    display: flex;
    justify-content: center;
  }

    .no-accounts {
      max-height: 48px;
  }

   .no-accounts p {
    text-align: center;
    font-weight: 300;
    font-size: 16px;
    line-height: 150%;
    letter-spacing: 0.04em;
    max-width: 312px;
    color: ${theme.subTextColor};
  }
`
)
);
