// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RouteComponentProps } from 'react-router';

import fileSaver from 'file-saver';
import React, { useCallback, useContext, useState } from 'react';
import { withRouter } from 'react-router';

import { ActionBar, ActionContext, ActionText, Address, Button, InputWithLabel, Warning } from '../components/index.js';
import { useTranslation } from '../hooks/index.js';
import { exportAccount } from '../messaging.js';
import { Header } from '../partials/index.js';
import { styled } from '../styled.js';

const MIN_LENGTH = 6;

interface Props extends RouteComponentProps<{address: string}> {
  className?: string;
}

function Export ({ className, match: { params: { address } } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
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

  const _onExportButtonClick = useCallback(
    (): void => {
      setIsBusy(true);

      exportAccount(address, pass)
        .then(({ exportedJson }) => {
          const blob = new Blob([JSON.stringify(exportedJson)], { type: 'application/json; charset=utf-8' });

          // eslint-disable-next-line deprecation/deprecation
          fileSaver.saveAs(blob, `${address}.json`);

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
        text={t('Export account')}
      />
      <div className={className}>
        <Address address={address}>
          <Warning className='movedWarning'>
            {t("You are exporting your account. Keep it safe and don't share it with anyone.")}
          </Warning>
          <div className='actionArea'>
            <InputWithLabel
              data-export-password
              disabled={isBusy}
              isError={pass.length < MIN_LENGTH || !!error}
              label={t('password for this account')}
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
              onClick={_onExportButtonClick}
            >
              {t('I want to export this account')}
            </Button>
            <ActionBar className='withMarginTop'>
              <ActionText
                className='center'
                onClick={_goHome}
                text={t('Cancel')}
              />
            </ActionBar>
          </div>
        </Address>
      </div>
    </>
  );
}

export default withRouter(styled(Export)`
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
