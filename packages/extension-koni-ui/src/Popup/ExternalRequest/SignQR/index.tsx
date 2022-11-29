// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PASSWORD_EXPIRY_MIN } from '@subwallet/extension-base/defaults';
import SignTransactionIcon from '@subwallet/extension-koni-ui/assets/icon/sign-transacion.svg';
import { Button, Checkbox, Spinner } from '@subwallet/extension-koni-ui/components';
import { ScannerContext } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import { useGetNetworkQrRequest } from '@subwallet/extension-koni-ui/hooks/useGetNetworkQrRequest';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { accountIsLocked } from '@subwallet/extension-koni-ui/messaging';
import AccountInfo from '@subwallet/extension-koni-ui/Popup/ExternalRequest/Shared/AccountInfo';
import Unlock from '@subwallet/extension-koni-ui/Popup/Signing/Unlock';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

const SignQR = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();

  const { loading, network } = useGetNetworkQrRequest();

  const { cleanup, signDataLegacy, state: scannerState } = useContext(ScannerContext);
  const { evmChainId, isEthereumStructure, senderAddress, type } = scannerState;

  const [error, setError] = useState<string | null>(null);
  const [savePass, setSavePass] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const _onSign = useCallback(
    (): Promise<void> => {
      setIsBusy(true);

      return new Promise((resolve) => {
        setTimeout(() => {
          signDataLegacy(savePass, password)
            .catch((error: Error): void => {
              setIsBusy(false);
              setError(error.message);
              console.error(error);
            })
            .finally(() => {
              setIsBusy(false);
              resolve();
            });
        }, 100);
      });
    },
    [password, savePass, signDataLegacy]
  );

  const _onCancel = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    setIsLocked(true);
    let timeout: NodeJS.Timeout;

    senderAddress && accountIsLocked(senderAddress)
      .then(({ isLocked, remainingTime }) => {
        setIsLocked(isLocked);
        timeout = setTimeout(() => {
          setIsLocked(true);
        }, remainingTime);

        // if the account was unlocked check the remember me
        // automatically to prolong the unlock period
        !isLocked && setSavePass(true);
      })
      .catch((error: Error) => console.error(error));

    return () => {
      !!timeout && clearTimeout(timeout);
    };
  }, [senderAddress]);

  const RememberPasswordCheckbox = () => (
    <Checkbox
      checked={savePass}
      className={'save-password-container'}
      label={isLocked
        ? t<string>(
          'Remember my password for the next {{expiration}} minutes',
          { replace: { expiration: PASSWORD_EXPIRY_MIN } }
        )
        : t<string>(
          'Extend the period without password by {{expiration}} minutes',
          { replace: { expiration: PASSWORD_EXPIRY_MIN } }
        )
      }
      onChange={setSavePass}
    />
  );

  return (
    <div className={CN(className)}>
      <div className='info-container'>
        {
          (loading || !network) && (
            <div className={CN('loading')}>
              <Spinner />
            </div>
          )
        }

        {
          (!loading && network) && (
            <>
              <div className='sign-header'>
                <img
                  alt=''
                  className='sign-icon'
                  src={SignTransactionIcon}
                />
                <div className='sign-title'>
                  Sign {type === 'transaction' ? 'transaction' : 'message'}
                </div>
                <div className='sign-description'>
                  You are approving a request with account
                </div>
              </div>
              <AccountInfo
                address={senderAddress}
                forceEthereum={isEthereumStructure && !evmChainId}
                network={network}
              />
            </>
          )
        }
      </div>
      <div className='action-container'>
        {(isLocked || isEthereumStructure) && (
          <Unlock
            error={error}
            isBusy={isBusy}
            onSign={_onSign}
            password={password}
            setError={setError}
            setPassword={setPassword}
          />
        )}

        {!isEthereumStructure ? <RememberPasswordCheckbox /> : <div className={'separator'} />}

        <div className={CN('sign-button-container')}>
          <Button
            className={CN('sign-button')}
            onClick={_onCancel}
          >
            <span>
              {t('Cancel')}
            </span>
          </Button>
          <Button
            className={CN('sign-button')}
            isBusy={isBusy}
            isDisabled={(isLocked && !password) || !!error || loading}
            onClick={_onSign}
          >
            {t('Approve')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(styled(SignQR)(({ theme }: Props) => `
  flex-direction: column;
  position: relative;
  bottom: 0;
  padding: 15px;
  height: 100%;
  overflow-y: auto;

  .save-password-container {
    margin: 8px 0;
  }

  .loading{
    position: relative;
    height: 240px;
  }

  .sign-header {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-top: 15px;

    .sign-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 15px;
    }

    .sign-title {
      color: ${theme.textColor};
      text-align: center;
      font-style: normal;
      font-weight: 500;
      font-size: 24px;
      line-height: 36px;
      margin-bottom: 15px;
    }

    .sign-description {
      font-style: normal;
      font-weight: 500;
      font-size: 15px;
      line-height: 26px;
      color: ${theme.textColor2};
      margin-bottom: 24px;
    }
  }

  .action-container {
    background-color: ${theme.background};
    position: sticky;
    padding-top: 3px;
    bottom: 0;
    z-index: 10;

    .separator{
      margin: ${theme.boxMargin};
    }

    .sign-button-container {
      display: flex;
    }

    .sign-button {
      flex: 1;
    }

    .sign-button:first-child {
      background-color: ${theme.buttonBackground1};
      margin-right: 8px;

      span {
        color: ${theme.buttonTextColor2};
      }
    }

    .sign-button:last-child {
      margin-left: 8px;
    }
  }
`));
