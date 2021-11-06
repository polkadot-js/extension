// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { HexString } from '@polkadot/util/types';

import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { wrapBytes } from '@polkadot/extension-dapp/wrapBytes';
import { QrDisplayPayload, QrScanSignature } from '@polkadot/react-qr';

import { Button } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { CMD_MORTAL, CMD_SIGN_MESSAGE } from './Request';

interface Props {
  address: string;
  children?: React.ReactNode;
  className?: string;
  cmd: number;
  genesisHash: string;
  onSignature: ({ signature }: { signature: HexString }) => void;
  payload: ExtrinsicPayload | string;

}

function Qr ({ address, className, cmd, genesisHash, onSignature, payload }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);

  const payloadU8a = useMemo(
    () => {
      switch (cmd) {
        case CMD_MORTAL:
          return (payload as ExtrinsicPayload).toU8a();
        case CMD_SIGN_MESSAGE:
          return wrapBytes(payload as string);
        default:
          return null;
      }
    },
    [cmd, payload]
  );

  const _onShowQr = useCallback(
    () => setIsScanning(true),
    []
  );

  if (!payloadU8a) {
    return (
      <div className={className}>
        <div className='qrContainer'>
          Transaction command:{cmd} not supported.
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className='qrContainer'>
        {isScanning
          ? <QrScanSignature onScan={onSignature} />
          : (
            <QrDisplayPayload
              address={address}
              cmd={cmd}
              genesisHash={genesisHash}
              payload={payloadU8a}
            />
          )
        }
      </div>
      {!isScanning && (
        <Button
          className='scanButton'
          onClick={_onShowQr}
        >
          {t<string>('Scan signature via camera')}
        </Button>
      )}
    </div>
  );
}

export default styled(Qr)`
  height: 100%;

  .qrContainer {
    margin: 5px auto 10px auto;
    width: 65%;

    img {
      border: white solid 1px;
    }
  }

  .scanButton {
    margin-bottom: 8px;
  }
`;
