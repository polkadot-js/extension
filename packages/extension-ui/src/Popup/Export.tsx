// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { saveAs } from 'file-saver';
import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import viewOff from '../assets/viewOff.svg';
import viewOn from '../assets/viewOn.svg';
import {
  ActionContext,
  Address,
  Button,
  ButtonArea,
  InputWithLabel,
  VerticalSpace,
  Warning,
  WarningBox
} from '../components';
import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import { exportAccount } from '../messaging';
import { Header } from '../partials';

const MIN_LENGTH = 6;

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

function Export({
  className,
  match: {
    params: { address }
  }
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { show } = useToast();
  const [isBusy, setIsBusy] = useState(false);
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const _goTo = (path: string) => () => onAction(path);

  const onPassChange = useCallback((password: string) => {
    setPass(password);
    setError('');
  }, []);

  const _onExportButtonClick = useCallback((): void => {
    setIsBusy(true);

    exportAccount(address, pass)
      .then(({ exportedJson }) => {
        const blob = new Blob([JSON.stringify(exportedJson)], { type: 'application/json; charset=utf-8' });

        saveAs(blob, `AlephZeroSigner_${address}.json`);
        show(t<string>('Export successful'), 'success');
        onAction('..');
      })
      .catch((error: Error) => {
        console.error(error);
        setError(error.message);
        setIsBusy(false);
      });
  }, [address, onAction, pass, show, t]);

  const _handleInputTypeChange = useCallback(() => setIsPasswordVisible((isPasswordVisible) => !isPasswordVisible), []);

  return (
    <>
      <Header
        text={t<string>('Export account')}
        withBackArrow
        withHelp
      />
      <div className={className}>
        <WarningBox
          description={t<string>('If someone has your JSON file they will have full control of your accounts.')}
          title={t<string>('Do not share your JSON file!')}
        />
        <Address address={address} />
        <div className='password-container'>
          <InputWithLabel
            data-export-password
            disabled={isBusy}
            isError={pass.length < MIN_LENGTH || !!error}
            label={t<string>('Password')}
            onChange={onPassChange}
            type={isPasswordVisible ? 'text' : 'password'}
            value={pass}
          />
          <div className='password-icon'>
            <img
              onClick={_handleInputTypeChange}
              src={isPasswordVisible ? viewOn : viewOff}
            />
          </div>
          {pass.length < MIN_LENGTH && pass !== '' && (
            <Warning
              isBelowInput
              isDanger
            >
              {t<string>('Password is too short')}
            </Warning>
          )}
          {error && <Warning isDanger>{error}</Warning>}
        </div>
      </div>
      <VerticalSpace />
      <ButtonArea>
        <Button
          onClick={_goTo(`..`)}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          className='export-button'
          data-export-button
          isBusy={isBusy}
          isDanger
          isDisabled={pass.length < MIN_LENGTH || pass === '' || !!error}
          onClick={_onExportButtonClick}
        >
          {t<string>('Export')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default withRouter(styled(Export)`
  display: flex;
  flex-direction: column;
  gap: 24px;

  .password-container {
    position: relative;
  }
  .password-icon {
    position: absolute;
    top: 18px;
    right: 36px;
    cursor: pointer;
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
