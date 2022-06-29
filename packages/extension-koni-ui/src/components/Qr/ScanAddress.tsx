// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Scanner from '@subwallet/extension-koni-ui/components/Qr/Scanner';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Result } from '@zxing/library';
import CN from 'classnames';
import React, { useCallback } from 'react';
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

const PATH = '@subwallet/extension-koni-ui/components/Qr/ScanAddress';

const ScanAddress = (props: Props) => {
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
        console.error(PATH, (error as Error).message, result.getText());
      }
    }

    if (error) {
      error.message && onError && onError(error);
      error.message && console.error(PATH, error.message);
    }
  }, [onScan, onError]);

  return (
    <div className={CN(className)}>
      <Scanner onResult={_onScan} />
    </div>
  );
};

export default React.memo(styled(ScanAddress)(({ theme }: Props) => `
  position: relative;
`));
