// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { HexString } from '@polkadot/util/types';

import { wrapBytes } from '@subwallet/extension-dapp/wrapBytes';
import { cancelSignRequest } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';

import { QrDisplayPayload, QrScanSignature } from '@polkadot/react-qr';

import { ActionContext, Button } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { CMD_MORTAL, CMD_SIGN_MESSAGE } from './Request';

interface Props extends ThemeProps {
  address: string;
  children?: React.ReactNode;
  className?: string;
  cmd: number;
  genesisHash: string;
  onSignature: ({ signature }: { signature: HexString }) => void;
  payload: ExtrinsicPayload | string;
  signId: string;
}

function Qr ({ address, className, cmd, genesisHash, onSignature, payload, signId }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const onAction = useContext(ActionContext);

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

  const _onToggleState = useCallback(
    () => setIsScanning((prevState) => !prevState),
    []
  );

  const _onCancel = useCallback((): void => {
    cancelSignRequest(signId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error));
  }, [onAction, signId]);

  if (!payloadU8a) {
    return (
      <div className={className}>
        <div className='qr-container'>
          Transaction command:{cmd} not supported.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        <div className='qr-container'>
          { isScanning && <QrScanSignature onScan={onSignature} /> }
          <div className={CN({ hidden: isScanning })}>
            <QrDisplayPayload
              address={address}
              cmd={cmd}
              genesisHash={genesisHash}
              payload={payloadU8a}
            />
          </div>
        </div>
      </div>
      <div className='sign-button-container'>
        <Button
          className='sign-button'
          onClick={_onCancel}
        >
          <span>
            {t<string>('Cancel')}
          </span>
        </Button>
        <Button
          className='sign-button'
          onClick={_onToggleState}
        >
          {isScanning ? t('Display Payload') : t('Scan QR')}
        </Button>
      </div>
    </>
  );
}

export default React.memo(styled(Qr)(({ theme }: Props) => `
  //height: 100%;

  .hidden {
    display: none;
  }

  .qr-container {
    margin: 5px auto 10px auto;
    width: 65%;

    img {
      border: white solid 1px;
    }
  }

  .sign-button-container {
    display: flex;
    position: sticky;
    bottom: 0;
    background-color: ${theme.background};
    margin-left: -15px;
    margin-right: -15px;
    margin-bottom: -15px;
    padding: 15px;
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
`));
