// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { PASSWORD_EXPIRY_MIN } from '@subwallet/extension-base/defaults';
import SignTransactionIcon from '@subwallet/extension-koni-ui/assets/icon/sign-transacion.svg';
import { Button, Checkbox, Spinner } from '@subwallet/extension-koni-ui/components';
import { SCANNER_QR_STEP } from '@subwallet/extension-koni-ui/constants/scanner';
import { ScannerContext } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { qrIsLocked } from '@subwallet/extension-koni-ui/messaging';
import AccountInfo from '@subwallet/extension-koni-ui/Popup/ExternalRequest/Shared/AccountInfo';
import Unlock from '@subwallet/extension-koni-ui/Popup/Signing/Unlock';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getNetworkJsonByInfo } from '@subwallet/extension-koni-ui/util/getNetworkJsonByGenesisHash';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

const SignQR = (props: Props) => {
  const { className } = props;

  const { networkMap } = useSelector((state: RootState) => state);
  const { setStep, signDataLegacy, state: scannerState } = useContext(ScannerContext);
  const { evmChainId, genesisHash, isEthereum, senderAddress, type } = scannerState;
  const { t } = useTranslation();

  const [error, setError] = useState<string | null>(null);
  const [savePass, setSavePass] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [network, setNetwork] = useState<NetworkJson | null>(null);

  const handlerFetch = useCallback(() => {
    const info: undefined | number | string = isEthereum ? evmChainId : genesisHash;
    const network = getNetworkJsonByInfo(networkMap, isEthereum, info);

    setLoading(!network);
    setNetwork(network);
  }, [isEthereum, evmChainId, genesisHash, networkMap]);

  const _onSign = useCallback(
    (): Promise<void> => {
      setIsBusy(true);

      return new Promise((resolve) => {
        setTimeout(() => {
          signDataLegacy(savePass, password)
            .then((): void => {
              setIsBusy(false);
              resolve();
            })
            .catch((error: Error): void => {
              setIsBusy(false);
              setError(error.message);
              console.error(error);
              resolve();
            });
        }, 100);
      });
    },
    [password, savePass, signDataLegacy]
  );

  const _onCancel = useCallback(() => {
    setStep(SCANNER_QR_STEP.SCAN_STEP);
  }, [setStep]);

  useEffect(() => {
    setIsLocked(true);
    let timeout: NodeJS.Timeout;

    senderAddress && qrIsLocked(senderAddress)
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

  useEffect(() => {
    handlerFetch();
  }, [handlerFetch]);

  const RememberPasswordCheckbox = () => (
    <Checkbox
      checked={savePass}
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
              forceEthereum={isEthereum && !evmChainId}
              network={network}
            />
          </>
        )
      }
      <div className='action-container'>
        {isLocked && (
          <Unlock
            error={error}
            isBusy={isBusy}
            onSign={_onSign}
            password={password}
            setError={setError}
            setPassword={setPassword}
          />
        )}

        {!isEthereum ? <RememberPasswordCheckbox /> : <div className={'separator'} />}

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
  padding: 15px 15px 0;

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
