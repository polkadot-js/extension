// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import RequireMigratePasswordModal from '@subwallet/extension-koni-ui/components/Signing/RequireMigratePassword';
import useNeedMigratePassword from '@subwallet/extension-koni-ui/hooks/useNeedMigratePassword';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

import { ActionContext, Button } from '../../../components';
import useTranslation from '../../../hooks/useTranslation';
import { approveSignPasswordV2, cancelSignRequest } from '../../../messaging';

interface Props extends ThemeProps {
  address: string;
  buttonText: string;
  children?: React.ReactElement
  className?: string;
  error: string | null;
  isExternal?: boolean;
  isFirst: boolean;
  setError: (value: string | null) => void;
  signId: string;
}

function SignArea ({ address, buttonText, children, className, error, isExternal, isFirst, setError, signId }: Props): JSX.Element {
  const needMigratePassword = useNeedMigratePassword(address);

  const [isBusy, setIsBusy] = useState(false);
  const onAction = useContext(ActionContext);
  const { t } = useTranslation();

  const _onSign = useCallback(
    (): Promise<void> => {
      setIsBusy(true);

      return approveSignPasswordV2({ id: signId })
        .then((): void => {
          setIsBusy(false);
          onAction();
        })
        .catch((error: Error): void => {
          setIsBusy(false);
          setError(error.message);
          console.error(error);
        });
    },
    [onAction, setError, setIsBusy, signId]
  );

  const _onCancel = useCallback(
    (): Promise<void> => cancelSignRequest(signId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error)),
    [onAction, signId]
  );

  return (
    <div className={CN(className, { external: isExternal })}>
      {children}
      {isFirst && !isExternal && (
        <>
          <RequireMigratePasswordModal address={address} />
          <div className='sign-button-container'>
            <Button
              className='sign-button __cancel'
              onClick={_onCancel}
            >
              <span>
                {t<string>('Cancel')}
              </span>

            </Button>
            <Button
              className='sign-button __sign'
              isBusy={isBusy}
              isDisabled={!!error || needMigratePassword}
              onClick={_onSign}
            >
              {buttonText}
            </Button>
          </div>
        </>
      )}
      {
        isExternal && (
          <div className='sign-button-container'>
            <Button
              className='sign-button __cancel'
              onClick={_onCancel}
            >
              <span>
                {t<string>('Cancel')}
              </span>

            </Button>
          </div>
        )
      }
    </div>
  );
}

export default styled(SignArea)(({ theme }: Props) => `
  flex-direction: column;
  position: sticky;
  bottom: 0;
  margin-left: -15px;
  margin-right: -15px;
  padding: 0 15px 15px;
  background-color: ${theme.background};

  &.external {
    margin-bottom: 0;

    .sign-button-container {
      .sign-button{
        margin: 0;
      }
    }
  }

  .sign-button-container {
    display: flex;
  }

  .sign-button {
    flex: 1;

    &.__cancel {
      background-color: ${theme.buttonBackground1};

      span {
        color: ${theme.buttonTextColor2};
      }
    }

    &.__sign {
     margin-left: 15px;
    }
  }

`);
