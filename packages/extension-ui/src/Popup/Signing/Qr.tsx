// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SignerPayload } from '@polkadot/api/types';
import { ExtrinsicPayload } from '@polkadot/types/interfaces';

import React, { useState, useEffect } from 'react';
import { QrDisplayPayload, QrScanSignature } from '@polkadot/react-qr';

import { Button, Box } from '../../components';

interface Props {
  children?: React.ReactNode;
  className?: string;
  onSignature: ({ signature }: { signature: string }) => void;
  payload: ExtrinsicPayload;
  request: SignerPayload;
}

const CMD_EXTRINSIC = 2;

export default function Qr ({ children, className, onSignature, payload, request }: Props): React.ReactElement<Props> {
  const [showScan, setShowScan] = useState(false);
  const [data, setData] = useState(new Uint8Array());
  const onShowQr = (): void => setShowScan(true);

  useEffect((): void => setData(payload.toU8a()), [payload]);

  return (
    <Box className={className}>
      {children}
      {showScan
        ? <QrScanSignature onScan={onSignature} />
        : <QrDisplayPayload
          address={request.address}
          cmd={CMD_EXTRINSIC}
          payload={data}
        />
      }
      {!showScan && (
        <Button
          label='Scan signature via camera'
          onClick={onShowQr}
        />
      )}
    </Box>
  );
}
