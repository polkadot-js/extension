// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';
import styled, { ThemeContext } from 'styled-components';

import { AccountJson } from '@subwallet/extension-base/background/types';
import { RootState, store } from '@subwallet/extension-koni-ui/stores';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';

import { AccountContext, AccountInfoEl, ActionBar, ActionContext, ActionText, Button, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import { forgetAccount } from '../messaging';
import { Header } from '../partials';
import { Theme } from '../types';

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

function updateCurrentAccount (currentAcc: AccountJson | null): void {
  store.dispatch({ type: 'currentAccount/update', payload: currentAcc });
}

function Forget ({ className, match: { params: { address } } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [buttonId, setButtonId] = useState('');
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const { accounts } = useContext(AccountContext);
  const _isAllAccount = isAccountAll(address);
  const currentAccount = useSelector((state: RootState) => state.currentAccount);

  const _goHome = useCallback(
    () => {
      setButtonId('cancel');
      window.localStorage.setItem('popupNavigation', '/');
      onAction('/');
    },
    [onAction]
  );

  const _onClick = useCallback(
    (): void => {
      setIsBusy(true);
      setButtonId('forget');
      forgetAccount(address)
        .then(() => {
          const accountAll = accounts.find((acc) => isAccountAll(acc.address));

          if (accountAll) {
            if (accounts.length === 1) {
              console.error('There is problem with accounts', accounts);
            } else if (accounts.length === 2) {
              updateCurrentAccount(null);
            } else if (accounts.length > 2) {
              updateCurrentAccount(accountAll);
            }
          } else {
            console.error('Can not find account All', accounts);
          }

          window.localStorage.setItem('popupNavigation', '/');
          onAction('/');
        })
        .catch((error: Error) => {
          setIsBusy(false);
          console.error(error);
        });
    },
    [accounts, address, onAction]
  );

  return (
    <>
      <Header
        isBusy={isBusy}
        showSubHeader
        subHeaderName={t<string>('Forget Account')}
      />
      <div className={className}>
        {_isAllAccount
          ? <div>
            <Warning>
              {t<string>('Account "All" doesn\'t support this action. Please switch to another account')}
            </Warning>
            <ActionBar className='forget-account__cancel-btn-wrapper'>
              <ActionText
                className='forget-account__cancel-btn'
                onClick={_goHome}
                text={t<string>('Cancel')}
              />
            </ActionBar>
          </div>
          : <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} forget-account-wrapper`}>
            <AccountInfoEl
              address={address}
              type={currentAccount.account?.type}
            />
            <Warning className='forget-account__warning'>
              {t<string>('You are about to remove the account. This means that you will not be able to access it via this extension anymore. If you wish to recover it, you would need to use the seed.')}
            </Warning>
            <div className='forget-account__action-area'>
              <Button
                className='forget-account-btn'
                isBusy={isBusy && buttonId === 'cancel'}
                isDisabled={isBusy}
                onClick={_goHome}
              >
                <span>{t<string>('Cancel')}</span>
              </Button>
              <Button
                className='forget-account-btn'
                isBusy={isBusy && buttonId === 'forget'}
                isDanger
                isDisabled={isBusy}
                onClick={_onClick}
              >
                {t<string>('Forget')}
              </Button>

            </div>
          </div>
        }
      </div>
    </>
  );
}

export default withRouter(styled(Forget)(({ theme }: Props) => `
  padding: 25px 15px 0;

  .forget-account-wrapper {
    padding-bottom: 8px;
  }

  .forget-account__action-area {
    padding-top: 20px;
    display: flex;
  }

  .forget-account-btn {
    flex: 1;
  }

  .forget-account-btn:first-child {
    margin-right: 8px;
    background-color: ${theme.buttonBackground1};

    span {
      color: ${theme.buttonTextColor2};
    }
  }

  .forget-account-btn:last-child {
    margin-left: 8px;
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
    margin-top: 12px;
  }
`));
