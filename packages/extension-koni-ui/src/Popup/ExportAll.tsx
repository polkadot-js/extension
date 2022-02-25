// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { saveAs } from 'file-saver';
import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { ALL_ACCOUNT_KEY } from '@polkadot/extension-koni-base/constants';
import Header from '@polkadot/extension-koni-ui/partials/Header';

import { AccountContext, ActionContext, Button, InputWithLabel, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import { exportAccounts } from '../messaging';

const MIN_LENGTH = 6;

interface Props extends RouteComponentProps, ThemeProps {
  className?: string;
}

function ExportAll ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

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

  const _onExportAllButtonClick = useCallback(
    (): void => {
      setIsBusy(true);

      exportAccounts(accounts.filter((acc) => acc.address !== ALL_ACCOUNT_KEY).map((account) => account.address), pass)
        .then(({ exportedJson }) => {
          const blob = new Blob([JSON.stringify(exportedJson)], { type: 'application/json; charset=utf-8' });

          saveAs(blob, `batch_exported_account_${Date.now()}.json`);

          window.localStorage.setItem('popupNavigation', '/');
          onAction('/');
        })
        .catch((error: Error) => {
          console.error(error);
          setError(error.message);
          setIsBusy(false);
        });
    },
    [accounts, onAction, pass]
  );

  return (
    <>
      <Header
        isBusy={isBusy}
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('All account')}
      />
      <div className={className}>
        <div className='action-area'>
          <InputWithLabel
            data-export-all-password
            disabled={isBusy}
            isError={pass.length < MIN_LENGTH || !!error}
            label={t<string>('password for encrypting all accounts')}
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
          <div className='export-button-wrapper'>
            <Button
              className='export-btn'
              isBusy={isBusy}
              onClick={_goHome}
            >
              <span>{t<string>('Cancel')}</span>
            </Button>
            <Button
              className='export-btn'
              data-export-button
              isBusy={isBusy}
              isDisabled={pass.length === 0 || !!error}
              onClick={_onExportAllButtonClick}
            >
              {t<string>('Export')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default withRouter(styled(ExportAll)(({ theme }: Props) => `
  .action-area {
    padding: 25px 15px 10px 15px;
  }

  .disabled-btn {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none !important;
  }

  .action-area > div {
    margin-top: 0;
  }

  .export-button-wrapper {
    display: flex;
    padding-top: 20px;
  }

  .export-btn {
    flex: 1;
  }

  .export-btn:first-child {
    margin-right: 8px;
    background-color: ${theme.buttonBackground1};

    span {
      color: ${theme.buttonTextColor2};
    }
  }

  .export-btn:last-child {
    margin-left: 8px;
  }
`));
