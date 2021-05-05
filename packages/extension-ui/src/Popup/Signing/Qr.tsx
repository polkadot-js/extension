// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { SignerPayloadJSON } from '@polkadot/types/types';

import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { QrDisplayPayload, QrScanSignature } from '@polkadot/react-qr';

import { Button } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props {
  children?: React.ReactNode;
  className?: string;
  onSignature: ({ signature }: { signature: string }) => void;
  payload: ExtrinsicPayload;
  request: SignerPayloadJSON;
}

const CMD_MORTAL = 2;

function Qr ({ className, onSignature, payload, request }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);

  const payloadU8a = useMemo(
    () => payload.toU8a(),
    [payload]
  );

  const _onShowQr = useCallback(
    () => setIsScanning(true),
    []
  );

  return (
    <div className={className}>
      <div className='qrContainer'>
        {isScanning
          ? <QrScanSignature onScan={onSignature} />
          : (
            <QrDisplayPayload
              address={request.address}
              cmd={CMD_MORTAL}
              genesisHash={request.genesisHash}
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
