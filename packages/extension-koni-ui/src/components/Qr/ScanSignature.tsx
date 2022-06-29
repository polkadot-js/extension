// Copyright 2017-2022 @polkadot/react-qr authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Scanner from '@subwallet/extension-koni-ui/components/Qr/Scanner';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SigData } from '@subwallet/extension-koni-ui/types/accountExternalRequest';
import { Result } from '@zxing/library';
import CN from 'classnames';
import React, { useCallback } from 'react';
import styled from 'styled-components';

import { isHex } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  onError?: (error: Error) => void;
  onScan: (scanned: SigData) => void;
  size?: string | number;
  style?: React.CSSProperties;
}

const PATH = '@subwallet/extension-koni-ui/components/Qr/ScanSignature';

const ScanSignature = (props: Props) => {
  const { t } = useTranslation();

  const { className, onError, onScan } = props;

  const _onScan = useCallback((result: Result | undefined | null, error: Error | undefined | null) => {
    if (result) {
      try {
        const data = result.getText();
        const signature = `0x${data}`;

        if (isHex(signature)) {
          onScan({
            signature: signature
          });
        } else {
          const message = t('Invalid signature');
          const error: Error = new Error(message);

          onError && onError(error);
          console.error(PATH, message, result.getText());
        }
      } catch (error) {
        onError && onError(error as Error);
        console.error(PATH, (error as Error).message, result.getText());
      }
    }

    if (error) {
      error.message && onError && onError(error);
      error.message && console.error(PATH, error.message);
    }
  }, [onError, onScan, t]);

  return (
    <div className={CN(className)}>
      <Scanner onResult={_onScan} />
    </div>
  );
};

export default React.memo(styled(ScanSignature)(({ theme }: Props) => `
  position: relative;
`));
