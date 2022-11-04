// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Scanner from '@subwallet/extension-koni-ui/components/Qr/Scanner';
import { SCAN_TYPE } from '@subwallet/extension-koni-ui/constants/qr';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { QrAccount } from '@subwallet/extension-koni-ui/types/scanner';
import { getFunctionScan } from '@subwallet/extension-koni-ui/util/scanner/attach';
import { Result } from '@zxing/library';
import CN from 'classnames';
import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  onError?: (error?: Error) => void;
  onScan: (scanned: QrAccount) => void;
  type: SCAN_TYPE;
}

const PATH = '@subwallet/extension-koni-ui/components/Qr/ScanAddress';

const ScanAddress = (props: Props) => {
  const { className, onError, onScan, type } = props;

  const _onScan = useCallback((result: Result | undefined | null, error: Error | undefined | null) => {
    if (result) {
      try {
        const data = result.getText();
        const funcRead = getFunctionScan(type);
        const qrAccount = funcRead(data);

        if (!qrAccount) {
          onError && onError(new Error('Invalid QR code'));

          throw Error('Invalid QR code');
        }

        onError && onError();
        onScan(qrAccount);
      } catch (error) {
        onError && onError(error as Error);
        console.error(PATH, (error as Error).message, result.getText());
      }
    }

    if (error) {
      error.message && onError && onError(error);
      error.message && console.error(PATH, error.message);
    }
  }, [type, onError, onScan]);

  return (
    <div className={CN(className)}>
      <Scanner onResult={_onScan} />
    </div>
  );
};

export default React.memo(styled(ScanAddress)(({ theme }: Props) => `
  position: relative;
`));
