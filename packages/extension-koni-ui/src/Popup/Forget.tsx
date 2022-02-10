// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type {ThemeProps} from '../types';

import React, {useCallback, useContext, useEffect, useState} from 'react';
import {RouteComponentProps, withRouter} from 'react-router';
import styled, {ThemeContext} from 'styled-components';

import {AccountJson} from '@polkadot/extension-base/background/types';
import AccountInfo from '@polkadot/extension-koni-ui/components/AccountInfo';
import {store} from '@polkadot/extension-koni-ui/stores';

import {AccountContext, ActionBar, ActionContext, ActionText, Button, Warning} from '../components';
import useTranslation from '../hooks/useTranslation';
import {forgetAccount} from '../messaging';
import {Header} from '../partials';
import {Theme} from '../types';
import {isAccountAll} from "@polkadot/extension-koni-ui/util";

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

function updateCurrentAccount(currentAcc: AccountJson): void {
  store.dispatch({type: 'currentAccount/update', payload: currentAcc});
}

function Forget({className, match: {params: {address}}}: Props): React.ReactElement<Props> {
  const {t} = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const {accounts} = useContext(AccountContext);
  const [isAllAccount, setIsAllAccount] = useState(false);

  useEffect(() => {
    setIsAllAccount(isAccountAll(address));
  }, []);

  const _goHome = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/');
      onAction('/');
    },
    [onAction]
  );

  const _onClick = useCallback(
    (): void => {
      setIsBusy(true);
      forgetAccount(address)
        .then(() => {
          if (accounts.length === 1) {
            updateCurrentAccount({} as AccountJson);
          }

          setIsBusy(false);
          _goHome();
        })
        .catch((error: Error) => {
          setIsBusy(false);
          console.error(error);
        });
    },
    [address, onAction]
  );

  return (
    <>
      <Header
        showSubHeader
        subHeaderName={t<string>('Forget Account')}
      />
      <div className={className}>
        {isAllAccount ?
          <div>
            <Warning>
              {t<string>(`Account "All" doesn't support this action. Please switch another account`)}
            </Warning>
            <ActionBar className='forget-account__cancel-btn-wrapper'>
              <ActionText
                className='forget-account__cancel-btn'
                onClick={_goHome}
                text={t<string>('Cancel')}
              />
            </ActionBar>
          </div>
          :
          <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'}`}>
            <AccountInfo address={address}/>
            <Warning className='forget-account__warning'>
              {t<string>('You are about to remove the account. This means that you will not be able to access it via this extension anymore. If you wish to recover it, you would need to use the seed.')}
            </Warning>
            <div className='forget-account__action-area'>
              <Button
                isBusy={isBusy}
                isDanger
                onClick={_onClick}
              >
                {t<string>('I want to forget this account')}
              </Button>
              <ActionBar className='forget-account__cancel-btn-wrapper'>
                <ActionText
                  className='forget-account__cancel-btn'
                  onClick={_goHome}
                  text={t<string>('Cancel')}
                />
              </ActionBar>
            </div>
          </div>
        }
      </div>
    </>
  );
}

export default withRouter(styled(Forget)(({theme}: Props) => `
  padding: 25px 15px 0;

  .forget-account__action-area {
    padding: 10px 24px;
  }

  .forget-account__cancel-btn {
    margin: auto;
  }

  .forget-account__cancel-btn > span {
    font-weight: 500;
    color: ${theme.buttonBackground2};
    font-size: 16px;
    line-height: 26px;
  }

  .forget-account__warning {
    margin-top: 8px;
  }

  .forget-account__cancel-btn-wrapper {
    margin-top: 4px;
  }
`));
