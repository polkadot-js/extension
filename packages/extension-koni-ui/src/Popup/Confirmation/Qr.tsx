// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { Web3Transaction } from '@subwallet/extension-base/signers/types';
import { anyNumberToBN } from '@subwallet/extension-koni-base/utils/eth';
import { LoadingContainer } from '@subwallet/extension-koni-ui/components';
import DisplayPayload from '@subwallet/extension-koni-ui/components/Qr/DisplayPayload';
import ScanSignature from '@subwallet/extension-koni-ui/components/Qr/ScanSignature';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SigData } from '@subwallet/extension-koni-ui/types/accountExternalRequest';
import CN from 'classnames';
import React, { useCallback, useMemo } from 'react';
import RLP, { Input } from 'rlp';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  onScan: (sigData: SigData) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  isScanning: boolean;
  confirmation: ConfirmationDefinitions['evmSendTransactionRequestQr'][0];
  network?: NetworkJson;
}

const Qr = (props: Props) => {
  const { className, confirmation, isLoading, isScanning, network, onError, onScan } = props;

  const _onError = useCallback((error: Error) => {
    onError(error.message);
  }, [onError]);

  const payload = useMemo((): Uint8Array => {
    const _raw = confirmation.payload;

    const txObject: Web3Transaction = {
      nonce: _raw.nonce,
      from: confirmation.address || '',
      gasPrice: anyNumberToBN(_raw.gasPrice).toNumber() || 0,
      gasLimit: anyNumberToBN(_raw.gas).toNumber(),
      to: _raw.to !== undefined ? _raw.to : '',
      value: anyNumberToBN(_raw.value).toNumber(),
      data: _raw.data ? _raw.data : '',
      chainId: network?.evmChainId || 1
    };

    const data: Input = [
      txObject.nonce,
      txObject.gasPrice,
      txObject.gasLimit,
      txObject.to,
      txObject.value,
      txObject.data,
      txObject.chainId,
      new Uint8Array([0x00]),
      new Uint8Array([0x00])
    ];

    return RLP.encode(data);
  }, [confirmation, network?.evmChainId]);

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
