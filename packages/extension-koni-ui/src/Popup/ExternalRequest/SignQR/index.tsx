// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { PASSWORD_EXPIRY_MIN } from '@subwallet/extension-base/defaults';
import { Button, Checkbox, Spinner } from '@subwallet/extension-koni-ui/components';
import { SCANNER_QR_STEP } from '@subwallet/extension-koni-ui/constants/scanner';
import { ScannerContext } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { qrIsLocked } from '@subwallet/extension-koni-ui/messaging';
import AccountInfo from '@subwallet/extension-koni-ui/Popup/ExternalRequest/Shared/AccountInfo';
import NetworkInfo from '@subwallet/extension-koni-ui/Popup/ExternalRequest/Shared/NetworkInfo';
import Unlock from '@subwallet/extension-koni-ui/Popup/Signing/Unlock';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getNetworkJsonByGenesisHash } from '@subwallet/extension-koni-ui/util/getNetworkJsonByGenesisHash';
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
  const { genesisHash, senderAddress } = scannerState;
  const { t } = useTranslation();

  const [error, setError] = useState<string | null>(null);
  const [savePass, setSavePass] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [network, setNetwork] = useState<NetworkJson | null>(null);

  const handlerFetch = useCallback(() => {
    const network = getNetworkJsonByGenesisHash(networkMap, genesisHash);

    setLoading(!network);
    setNetwork(network);
  }, [genesisHash, networkMap]);

  const _onSign = useCallback(
    (): Promise<void> => {
      setIsBusy(true);

      return signDataLegacy(savePass, password)
        .then((): void => {
          setIsBusy(false);
        })
        .catch((error: Error): void => {
          setIsBusy(false);
          setError(error.message);
          console.error(error);
        });
    },
    [password, savePass, signDataLegacy]
  );

  const _onCancel = useCallback(() => {
    setStep(SCANNER_QR_STEP.VIEW_DETAIL_STEP);
  }, [setStep]);

  useEffect(() => {
    setIsLocked(null);
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
            <NetworkInfo network={network} />
            <AccountInfo
              address={senderAddress}
              network={network}
            />
          </>
        )
      }
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
      <RememberPasswordCheckbox />

      <div className={CN('sign-button-container')}>
        <Button
          className={CN('sign-button')}
          onClick={_onCancel}
        >
          <span>
            {t('Previous Step')}
          </span>

        </Button>
        <Button
          className={CN('sign-button')}
          isBusy={isBusy}
          isDisabled={(!!isLocked && !password) || !!error}
          onClick={_onSign}
        >
          {t('Next Step')}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(styled(SignQR)(({ theme }: Props) => `
  flex-direction: column;
  position: sticky;
  bottom: 0;
  padding: 0 15px 15px;
  background-color: ${theme.background};

  .loading{
    position: relative;
    height: 300px;
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
`));
