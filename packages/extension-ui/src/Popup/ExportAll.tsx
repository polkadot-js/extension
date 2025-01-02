// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RouteComponentProps } from 'react-router';

import fileSaver from 'file-saver';
import React, { useCallback, useContext, useState } from 'react';
import { withRouter } from 'react-router';

import { AccountContext, ActionBar, ActionContext, ActionText, Button, InputWithLabel, Warning } from '../components/index.js';
import { useTranslation } from '../hooks/index.js';
import { exportAccounts } from '../messaging.js';
import { Header } from '../partials/index.js';
import { styled } from '../styled.js';

const MIN_LENGTH = 6;

interface Props extends RouteComponentProps {
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
          const blob = new Blob([JSON.stringify(exportedJson)], { type: 'application/json; charset=utf-8' });

          // eslint-disable-next-line deprecation/deprecation
          fileSaver.saveAs(blob, `batch_exported_account_${Date.now()}.json`);

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
        text={t('All account')}
      />
      <div className={className}>
        <div className='actionArea'>
          <InputWithLabel
            data-export-all-password
            disabled={isBusy}
            isError={pass.length < MIN_LENGTH || !!error}
            label={t('password for encrypting all accounts')}
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
            {t('I want to export all my accounts')}
          </Button>
          <ActionBar className='withMarginTop'>
            <ActionText
              className='center'
              onClick={_goHome}
              text={t('Cancel')}
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
