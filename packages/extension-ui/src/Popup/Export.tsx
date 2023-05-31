// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { saveAs } from 'file-saver';
import React, { FormEvent, useCallback, useContext, useId, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

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

  const formId = useId();

  const _goTo = (path: string) => () => onAction(path);

  const onPassChange = useCallback((password: string) => {
    setPass(password);
    setError('');
  }, []);

  const _onExport = useCallback((): void => {
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

  const isFormValid = Boolean(pass && !error);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isFormValid) {
      _onExport();
    }
  };

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
        <form
          className='password-container'
          id={formId}
          onSubmit={onSubmit}
        >
          <InputWithLabel
            data-export-password
            disabled={isBusy}
            isError={!!error}
            label={t<string>('Password')}
            onChange={onPassChange}
            type='password'
            value={pass}
          />
          {error && (
            <Warning
              isBelowInput
              isDanger
            >
              {error}
            </Warning>
          )}
        </form>
      </div>
      <VerticalSpace />
      <ButtonArea>
        <Button
          onClick={_goTo(`..`)}
          secondary
          type='button'
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          className='export-button'
          data-export-button
          form={formId}
          isBusy={isBusy}
          isDisabled={!isFormValid}
          type='submit'
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

    & > :not(:last-child) {
      margin-bottom: 8px;
    }
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
