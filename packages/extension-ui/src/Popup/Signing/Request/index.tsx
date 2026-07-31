// Copyright 2019-2026 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, RequestSign } from '@polkadot/extension-base/background/types';
import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { HexString } from '@polkadot/util/types';

import React, { useCallback, useContext, useEffect, useState } from 'react';

import { isExtrinsicRequest } from '@polkadot/extension-base/utils';
import { TypeRegistry } from '@polkadot/types';

import { ActionContext, Address, VerticalSpace, Warning } from '../../../components/index.js';
import { useMetadata, useTranslation } from '../../../hooks/index.js';
import { approveSignSignature } from '../../../messaging.js';
import Bytes from '../Bytes.js';
import Extrinsic from '../Extrinsic.js';
import LedgerSign from '../LedgerSign.js';
import Qr from '../Qr.js';
import SignArea from './SignArea.js';

interface Props {
  account: AccountJson;
  buttonText: string;
  isFirst: boolean;
  request: RequestSign;
  signId: string;
  url: string;
}

interface Data {
  hexBytes: string | null;
  payload: ExtrinsicPayload | null;
}

export const CMD_MORTAL = 2;
export const CMD_SIGN_MESSAGE = 3;

// keep it global, we can and will re-use this across requests
const registry = new TypeRegistry();

export default function Request ({ account: { accountIndex, addressOffset, genesisHash: accountGenesisHash, isExternal, isHardware, type }, buttonText, isFirst, request, signId, url }: Props): React.ReactElement<Props> | null {
  const onAction = useContext(ActionContext);
  const [{ hexBytes, payload }, setData] = useState<Data>({ hexBytes: null, payload: null });
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  // Raw vs extrinsic follows the channel the request arrived on, never the
  // payload fields - those are dapp-supplied and can describe either shape.
  // Use payload genesis for transaction-signing flow. Account genesis can be null
  // for allow-any accounts and should not drive payload decoding/signing setup.
  const payloadGenesisHash = isExtrinsicRequest(request)
    ? request.payload.genesisHash
    : null;
  const chain = useMetadata(payloadGenesisHash);

  useEffect((): void => {
    // When the chain and request are ready, configure the chain's registry.
    // This will be picked up by LedgerSign.
    if (chain && isExtrinsicRequest(request)) {
      chain.registry.setSignedExtensions(request.payload.signedExtensions, chain.definition.userExtensions);
    }
  }, [chain, request]);

  useEffect((): void => {
    if (isExtrinsicRequest(request)) {
      const json = request.payload;

      registry.setSignedExtensions(json.signedExtensions);

      setData({
        hexBytes: null,
        payload: registry.createType('ExtrinsicPayload', json, { version: json.version })
      });
    } else {
      setData({
        hexBytes: request.payload.data,
        payload: null
      });
    }
  }, [request]);

  const _onSignature = useCallback(
    ({ signature }: { signature: HexString }, signedTransaction?: HexString): void => {
      approveSignSignature(signId, signature, signedTransaction)
        .then(() => onAction())
        .catch((error: Error): void => {
          setError(error.message);
          console.error(error);
        });
    },
    [onAction, signId]
  );

  // Branch on the request itself rather than on the decoded state, so a render
  // that lands before the effect has caught up shows nothing instead of feeding
  // the previous request's view a payload of the other shape.
  if (isExtrinsicRequest(request)) {
    const json = request.payload;

    if (payload === null) {
      return null;
    }

    return (
      <>
        <div>
          <Address
            address={json.address}
            genesisHash={json.genesisHash}
            isExternal={isExternal}
            isHardware={isHardware}
          />
        </div>
        {isExternal && !isHardware
          ? (
            <Qr
              address={json.address}
              cmd={CMD_MORTAL}
              genesisHash={json.genesisHash}
              onSignature={_onSignature}
              payload={payload}
            />
          )
          : (
            <Extrinsic
              payload={payload}
              request={json}
              url={url}
            />
          )
        }
        {isHardware && (
          <LedgerSign
            accountIndex={accountIndex || 0}
            addressOffset={addressOffset || 0}
            error={error}
            genesisHash={json.genesisHash}
            isEthereum={type === 'ethereum'}
            onSignature={_onSignature}
            payloadExt={payload}
            payloadJson={json}
            setError={setError}
          />
        )}
        <SignArea
          buttonText={buttonText}
          error={error}
          isExternal={isExternal}
          isFirst={isFirst}
          setError={setError}
          signId={signId}
        />
      </>
    );
  } else {
    const { address, data } = request.payload;

    if (hexBytes === null) {
      return null;
    }

    return (
      <>
        <div>
          <Address
            address={address}
            isExternal={isExternal}
          />
        </div>
        {isExternal && !isHardware && accountGenesisHash
          ? (
            <Qr
              address={address}
              cmd={CMD_SIGN_MESSAGE}
              genesisHash={accountGenesisHash}
              onSignature={_onSignature}
              payload={data}
            />
          )
          : (
            <Bytes
              bytes={data}
              url={url}
            />
          )
        }
        <VerticalSpace />
        {isExternal && !isHardware && !accountGenesisHash && (
          <>
            <Warning isDanger>{t('"Allow use on any network" is not supported to show a QR code. You must associate this account with a network.')}</Warning>
            <VerticalSpace />
          </>
        )}
        {isHardware && <>
          <Warning>{t('Message signing is not supported for hardware wallets.')}</Warning>
          <VerticalSpace />
        </>}
        <SignArea
          buttonText={buttonText}
          error={error}
          isExternal={isExternal}
          isFirst={isFirst}
          setError={setError}
          signId={signId}
        />
      </>
    );
  }
}
