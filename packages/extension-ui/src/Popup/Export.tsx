// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { ActionBar, ActionContext, ActionText, Address, Button, ErrorBoundary, InputWithLabel, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import { exportAccount } from '../messaging';
import { Header } from '../partials';
import styled from 'styled-components';

const MIN_LENGTH = 6;

type Props = RouteComponentProps<{ address: string }>;

function Export ({ match: { params: { address } } }: Props): React.ReactElement<Props> {
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
      <ErrorBoundary trigger='export'>
        <div>
          <Address address={address}>
            <MovedWarning danger>{t<string>("You are exporting your account. Keep it safe and don't share it with anyone.")}</MovedWarning>
            <ActionArea>
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
              <CancelButton>
                <ActionText
                  onClick={_goHome}
                  text={t<string>('Cancel')}
                />
              </CancelButton>
            </ActionArea>
          </Address>
        </div>
      </ErrorBoundary>
    </>
  );
}

const MovedWarning = styled(Warning)`
  margin-top: 8px;
`;

const ActionArea = styled.div`
  padding: 10px 24px;
`;

const CancelButton = styled(ActionBar)`
  margin-top: 4px;
  text-decoration: underline;

  ${ActionText} {
    margin: auto;
  }
`;

export default withRouter(Export);
