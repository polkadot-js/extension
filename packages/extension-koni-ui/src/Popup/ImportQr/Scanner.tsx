// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Result } from '@zxing/library';
import CN from 'classnames';
import React, { useCallback } from 'react';
import { QrReader } from 'react-qr-reader';
import styled from 'styled-components';

import { decodeAddress } from '@polkadot/util-crypto';

interface ScanType {
  isAddress: boolean;
  content: string;
  genesisHash: string;
  name?: string;
  isEthereum: boolean;
}

interface Props extends ThemeProps{
  className?: string;
  onError?: (error?: Error) => void;
  onScan: (scanned: ScanType) => void;
}

const SUBSTRATE_PREFIX = 'substrate';
const ETHEREUM_PREFIX = 'ethereum';
const SECRET_PREFIX = 'secret';

const Scanner = (props: Props) => {
  const { className, onError, onScan } = props;

  const _onScan = useCallback((result: Result | undefined | null, error: Error | undefined | null) => {
    if (result) {
      try {
        const data = result.getText();
        const arr: string[] = data.split(':');

        let prefix = arr[0];
        let content = '';
        let genesisHash = '';
        let name: string[] = [];
        let isEthereum = false;

        if (prefix === SUBSTRATE_PREFIX || prefix === SECRET_PREFIX) {
          [prefix, content, genesisHash, ...name] = arr;
        } else if (prefix === ETHEREUM_PREFIX) {
          [prefix, content, ...name] = arr;
          genesisHash = '';
          content = content.substring(0, 42);
          isEthereum = true;
        } else {
          onError && onError(new Error(`Invalid prefix received, expected '${SUBSTRATE_PREFIX} or ${SECRET_PREFIX} or ${ETHEREUM_PREFIX}' , found '${prefix}'`));

          throw Error(`Invalid prefix received, expected '${SUBSTRATE_PREFIX} or ${SECRET_PREFIX} or ${ETHEREUM_PREFIX}' , found '${prefix}'`);
        }

        const isAddress = prefix !== SECRET_PREFIX;

        if (isAddress && !isEthereum) {
          decodeAddress(content);
        }

        onError && onError();
        onScan({
          content,
          genesisHash,
          isAddress,
          isEthereum,
          name: name.length ? name.join(':') : undefined
        });
      } catch (error) {
        onError && onError(error as Error);
        console.error('@subwallet/extension-koni-ui/ImportQr/Scanner', (error as Error).message, result.getText());
      }
    }

    if (error) {
      error.message && onError && onError(error);
      error.message && console.error('@subwallet/extension-koni-ui/ImportQr/Scanner', error.message);
    }
  }, [onScan, onError]);

  return (
    <div className={CN(className)}>
      <QrReader
        className={'qr-scanner-container'}
        constraints={{ facingMode: 'user' }}
        onResult={_onScan}
      />
    </div>
  );
};

export default React.memo(styled(Scanner)(({ theme }: Props) => `
  display:inline-block;
  height:100%;
  transform:matrix(1,0,0,1,0,0);
  width:100%;
  video{
    margin:0;
    object-fit: cover;
  }

  .qr-scanner-container{
    &::after{
      width: 100%;
      content: '';
      top: 0px;
      left: 0px;
      z-index: 1;
      box-sizing: border-box;
      border: 50px solid rgba(0, 0, 0, 0.3);
      box-shadow: rgb(255 0 0 / 50%) 0px 0px 0px 5px inset;
      position: absolute;
      height: 100%;
    }
  }
`));
