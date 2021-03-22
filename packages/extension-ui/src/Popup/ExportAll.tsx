// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { AccountContext, ActionBar, ActionContext, ActionText, Button, InputWithLabel, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import { exportAccounts } from '../messaging';
import { Header } from '../partials';

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
    () => onAction('/'),
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

      exportAccounts(accounts.map((account) => account.address), pass)
        .then(({ exportedJson }) => {
          const element = document.createElement('a');

          element.href = `data:text/plain;charset=utf-8,${exportedJson}`;
          element.download = `batch_exported_account_${Date.now()}.json`;
          element.click();

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
        text={t<string>('All account')}
      />
      <div className={className}>
        <div className='actionArea'>
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
          <Button
            className='export-button'
            data-export-button
            isBusy={isBusy}
            isDanger
            isDisabled={pass.length === 0 || !!error}
            onClick={_onExportAllButtonClick}
          >
            {t<string>('I want to export all my accounts')}
          </Button>
          <ActionBar className='withMarginTop'>
            <ActionText
              className='center'
              onClick={_goHome}
              text={t<string>('Cancel')}
            />
          </ActionBar>
        </div>
      </div>
    </>
  );
}

export default withRouter(styled(ExportAll)`
  .actionArea {
    padding: 10px 24px;
  }

  .center {
    margin: auto;
  }

  .export-button {
    margin-top: 6px;
  }

  .movedWarning {
    margin-top: 8px;
  }

  .withMarginTop {
    margin-top: 4px;
  }
`);
