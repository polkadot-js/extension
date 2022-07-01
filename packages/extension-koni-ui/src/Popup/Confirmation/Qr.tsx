// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions } from '@subwallet/extension-base/background/KoniTypes';
import { LoadingContainer } from '@subwallet/extension-koni-ui/components';
import DisplayPayload from '@subwallet/extension-koni-ui/components/Qr/DisplayPayload';
import ScanSignature from '@subwallet/extension-koni-ui/components/Qr/ScanSignature';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SigData } from '@subwallet/extension-koni-ui/types/accountExternalRequest';
import CN from 'classnames';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { hexToU8a } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  onScan: (sigData: SigData) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  isScanning: boolean;
  isMessage: boolean;
  confirmation: ConfirmationDefinitions['evmSendTransactionRequestQr' | 'evmSignatureRequestQr'][0];
}

const Qr = (props: Props) => {
  const { className, confirmation, isLoading, isMessage, isScanning, onError, onScan } = props;

  const _onError = useCallback((error: Error) => {
    onError(error.message);
  }, [onError]);

  const payload = useMemo((): Uint8Array => {
    const _raw = confirmation.payload;

    return hexToU8a(_raw.qrPayload);
  }, [confirmation]);

  const canSign = useMemo((): boolean => {
    return confirmation.payload.canSign;
  }, [confirmation.payload.canSign]);

  if (!canSign) {
    return (
      <></>
    );
  }

  return (
    <div className={CN(className)}>
      <div className='auth-transaction-body'>
        {
          isLoading && (
            <LoadingContainer />
          )
        }
        <div className='qr-container'>
          { !isLoading && isScanning && (
            <ScanSignature
              onError={_onError}
              onScan={onScan}
            />
          )}
        </div>
        <div className={CN('display-qr', { hidden: isScanning || isLoading })}>
          <div className={'qr-content'}>
            <DisplayPayload
              address={confirmation.address || ''}
              genesisHash={''}
              isEthereum={true}
              isHash={false}
              isMessage={isMessage}
              payload={payload}
              size={320}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(styled(Qr)(({ theme }: Props) => `
  display: flex;
  position: relative;
  flex: 1;
  margin-top: 10px;
  min-height: 320px;

  .auth-transaction-body{
    flex: 1;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    padding-top: 25px;
  }

  .display-qr {
    margin: 0 30px;
    display: flex;
    justify-content: center;
    align-items: center;

    .qr-content {
      height: 324px;
      width: 324px;
      border: 2px solid ${theme.textColor};
    }
  }

  .scan-qr {
    margin: 0 20px;
  }

  .hidden {
    display: none;
  }

`));
