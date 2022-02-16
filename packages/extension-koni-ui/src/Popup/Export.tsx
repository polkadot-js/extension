// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Theme, ThemeProps } from '../types';
import { saveAs } from 'file-saver';
import React, {useCallback, useContext, useEffect, useState} from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled, { ThemeContext } from 'styled-components';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import { ActionContext, AccountInfoEl, ActionBar, ActionText, Button, InputWithLabel, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import { exportAccount } from '../messaging';
import {isAccountAll} from "@polkadot/extension-koni-ui/util";

const MIN_LENGTH = 6;

interface Props extends RouteComponentProps<{address: string}>, ThemeProps {
  className?: string;
}

function ExportAccount ({ className, match: { params: { address } } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
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

  const onPassChange = useCallback(
    (password: string) => {
      setPass(password);
      setError('');
    }
    , []);

  const _onExportButtonClick = useCallback(
    (): void => {
      setIsBusy(true);

      exportAccount(address, pass)
        .then(({ exportedJson }) => {
          const blob = new Blob([JSON.stringify(exportedJson)], { type: 'application/json; charset=utf-8' });

          saveAs(blob, `${address}.json`);

          window.localStorage.setItem('popupNavigation', '/');
          onAction('/');
        })
        .catch((error: Error) => {
          console.error(error);
          setError(error.message);
          setIsBusy(false);
        });
    },
    [address, onAction, pass]
  );

  return (
    <>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Export account')}
      />
      <div className={className}>
        {isAllAccount ?
          <div>
            <Warning>
              {t<string>(`Account "All" doesn't support this action. Please switch to another account`)}
            </Warning>

            <ActionBar className='export__action-bar'>
              <ActionText
                className='cancel-button'
                onClick={_goHome}
                text={t<string>('Cancel')}
              />
            </ActionBar>
          </div> :
          <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} export-account-wrapper`}>
            <AccountInfoEl address={address} />
            <Warning className='export-warning'>
              {t<string>("You are exporting your account. Keep it safe and don't share it with anyone.")}
            </Warning>

            <div className='export__password-area'>
              <InputWithLabel
                className='export__input-label'
                data-export-password
                disabled={isBusy}
                isError={pass.length < MIN_LENGTH || !!error}
                label={t<string>('password for this account')}
                onChange={onPassChange}
                type='password'
              />
              {error && (
                <Warning
                  isBelowInput
                  isDanger
                >
                  {error}
                </Warning>
              )}
            </div>

            <div className='export__action-area'>
              <div>
                <Button
                  className='export-button'
                  data-export-button
                  isBusy={isBusy}
                  isDisabled={pass.length === 0 || !!error}
                  onClick={_onExportButtonClick}
                >
                  {t<string>('I want to export this account')}
                </Button>
                <ActionBar className='export__action-bar'>
                  <ActionText
                    className='cancel-button'
                    onClick={_goHome}
                    text={t<string>('Cancel')}
                  />
                </ActionBar>
              </div>
            </div>
          </div>
        }

      </div>
    </>
  );
}

export default withRouter(styled(ExportAccount)(({ theme }: Props) => `
  margin: 0 15px;
  padding-top: 25px;

  .export__password-area {
    padding-top: 13px;
  }

  .export__action-area {
    display: flex;
    justify-content: center;
  }

  .export-account-wrapper {
    padding-bottom: 8px;
  }

  .export-button {
    margin-bottom: 4px;
  }

  .export-warning {
    margin-top: 8px;
  }

  .export__action-bar {
    margin-top: 12px;
  }

  .export__input-label {
    margin-bottom: 20px;
  }

  .cancel-button {
    margin-top: 10px;
    margin: auto;
    > span {
      color: ${theme.buttonTextColor2};
      font-weight: 500;
      font-size: 16px;
      line-height: 26px;
  }
`));
