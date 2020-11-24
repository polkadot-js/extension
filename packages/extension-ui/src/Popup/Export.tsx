// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '../types';

import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { ActionBar, ActionContext, ActionText, Address, Button, InputWithLabel, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import { exportAccount } from '../messaging';
import { Header } from '../partials';
import styled from 'styled-components';

const MIN_LENGTH = 6;

interface Props extends RouteComponentProps<{address: string}>, ThemeProps {
  className?: string;
}

function Export ({ className, match: { params: { address } } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [pass, setPass] = useState('');
  const [wrongPasswordHighlight, setWrongPasswordHighlight] = useState(false);

  const _goHome = useCallback(
    () => onAction('/'),
    [onAction]
  );

  const _onExportButtonClick = useCallback(
    (): void => {
      setIsBusy(true);

      exportAccount(address, pass)
        .then(({ exportedJson }) => {
          const element = document.createElement('a');
          const { meta } = JSON.parse(exportedJson) as { meta: { name: string } };

          element.href = `data:text/plain;charset=utf-8,${exportedJson}`;
          element.download = `${meta.name}_exported_account_${Date.now()}.json`;
          element.click();

          onAction('/');
        })
        .catch((error: Error) => {
          console.error(error);

          setIsBusy(false);
          setWrongPasswordHighlight(true);
          setTimeout(() => setWrongPasswordHighlight(false), 100);
        });
    },
    [address, onAction, pass]
  );

  return (
    <>
      <Header
        showBackArrow
        text={t<string>('Export account')}
      />
      <div className={className}>
        <Address address={address}>
          <Warning className='movedWarning'>
            {t<string>("You are exporting your account. Keep it safe and don't share it with anyone.")}
          </Warning>
          <div className='actionArea'>
            <InputWithLabel
              data-export-password
              disabled={isBusy}
              isError={pass.length < MIN_LENGTH || wrongPasswordHighlight}
              label={t<string>('password for this account')}
              onChange={setPass}
              type='password'
            />
            <Button
              className='export-button'
              data-export-button
              isBusy={isBusy}
              isDanger
              isDisabled={pass.length === 0}
              onClick={_onExportButtonClick}
            >
              {t<string>('I want to export this account')}
            </Button>
            <ActionBar className='withMarginTop'>
              <ActionText
                className='center'
                onClick={_goHome}
                text={t<string>('Cancel')}
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

  .movedWarning {
    margin-top: 8px;
  }

  .withMarginTop {
    margin-top: 4px;
  }
`);
