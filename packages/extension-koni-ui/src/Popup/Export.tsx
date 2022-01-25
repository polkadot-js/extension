// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Theme, ThemeProps } from '../types';

import { saveAs } from 'file-saver';
import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled, { ThemeContext } from 'styled-components';

import AccountInfo from '@polkadot/extension-koni-ui/components/AccountInfo';
import ActionBar from '@polkadot/extension-koni-ui/components/ActionBar';
import ActionText from '@polkadot/extension-koni-ui/components/ActionText';
import Button from '@polkadot/extension-koni-ui/components/Button';
import InputWithLabel from '@polkadot/extension-koni-ui/components/InputWithLabel';
import Warning from '@polkadot/extension-koni-ui/components/Warning';
import Header from '@polkadot/extension-koni-ui/partials/Header';

import { ActionContext } from '../components';
import useTranslation from '../hooks/useTranslation';
import { exportAccount } from '../messaging';

const MIN_LENGTH = 6;

interface Props extends RouteComponentProps<{address: string}>, ThemeProps {
  className?: string;
}

function KoniExportAccount ({ className, match: { params: { address } } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

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

          saveAs(blob, `${address}.json`);

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
        <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} export-account-wrapper`}>
          <AccountInfo address={address} />
          <Warning className='movedWarning'>
            {t<string>("You are exporting your account. Keep it safe and don't share it with anyone.")}
          </Warning>

          <div className='passwordArea'>
            <InputWithLabel
              className='koni-export-input-label'
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

          <div className='actionArea'>
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
              <ActionBar className='withMarginTop'>
                <ActionText
                  className='cancel-button'
                  onClick={_goHome}
                  text={t<string>('Cancel')}
                />
              </ActionBar>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default withRouter(styled(KoniExportAccount)(({ theme }: Props) => `
  margin: 0 15px;

  .passwordArea {
    padding-top: 13px;
  }

  .actionArea {
    display: flex;
    justify-content: center;
  }

  .export-account-wrapper {
    padding-bottom: 8px;
  }

  .export-button {
    margin-bottom: 4px;
  }

  .movedWarning {
    margin-top: 8px;
  }

  .withMarginTop {
    margin-top: 12px;
  }

  .koni-export-input-label {
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
