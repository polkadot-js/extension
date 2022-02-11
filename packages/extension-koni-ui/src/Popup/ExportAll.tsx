// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { saveAs } from 'file-saver';
import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import ActionBar from '@polkadot/extension-koni-ui/components/ActionBar';
import ActionText from '@polkadot/extension-koni-ui/components/ActionText';
import Button from '@polkadot/extension-koni-ui/components/Button';
import InputWithLabel from '@polkadot/extension-koni-ui/components/InputWithLabel';
import Warning from '@polkadot/extension-koni-ui/components/Warning';
import Header from '@polkadot/extension-koni-ui/partials/Header';

import { AccountContext, ActionContext } from '../components';
import useTranslation from '../hooks/useTranslation';
import { exportAccounts } from '../messaging';
import {ALL_ACCOUNT_KEY} from "@polkadot/extension-koni-base/constants";

const MIN_LENGTH = 6;

interface Props extends RouteComponentProps, ThemeProps {
  className?: string;
}

function KoniExportAll ({ className }: Props): React.ReactElement<Props> {
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

      exportAccounts(accounts.filter(acc => acc.address !== ALL_ACCOUNT_KEY).map((account) => account.address), pass)
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
          <div className='forget-button-wrapper'>
            <Button
              className='export-button'
              data-export-button
              isBusy={isBusy}
              isDisabled={pass.length === 0 || !!error}
              onClick={_onExportAllButtonClick}
            >
              {t<string>('I want to export all my accounts')}
            </Button>
          </div>

          <ActionBar className='export-all__action-bar'>
            <ActionText
              className='export-all__action-text'
              onClick={_goHome}
              text={t<string>('Cancel')}
            />
          </ActionBar>
        </div>
      </div>
    </>
  );
}

export default withRouter(styled(KoniExportAll)(({ theme }: Props) => `
  .action-area {
    padding: 25px 15px 10px 15px;
  }

  .action-area > div {
    margin-top: 0;
  }

  .export-all__action-text {
    margin: auto;
    margin-top: 10px;
    > span {
      color: ${theme.buttonTextColor2};
      font-weight: 500;
      font-size: 16px;
      line-height: 26px;
    }
  }

  .forget-button-wrapper {
    padding: 0 70px;
  }

  .export-button {
    margin-top: 6px;
  }

  .export-all__action-bar {
    margin-top: 4px;
  }
`));
