// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, RequestSign } from '@polkadot/extension-base/background/types';
import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';

import React, { useCallback, useContext, useEffect, useState } from 'react';

import { TypeRegistry } from '@polkadot/types';
import { decodeAddress } from '@polkadot/util-crypto';

import { AccountContext, ActionContext, Address, VerticalSpace, Warning } from '../../../components';
import { approveSignSignature } from '../../../messaging';
import Bytes from '../Bytes';
import Extrinsic from '../Extrinsic';
import LedgerSign from '../LedgerSign';
import Qr from '../Qr';
import SignArea from './SignArea';
import { useTranslation } from '../../../components/translate';

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

function isRawPayload (payload: SignerPayloadJSON | SignerPayloadRaw): payload is SignerPayloadRaw {
  return !!(payload as SignerPayloadRaw).data;
}

export default function Request ({ account: { accountIndex, addressOffset, isExternal, isHardware }, buttonText, isFirst, request, signId, url }: Props): React.ReactElement<Props> | null {
  const onAction = useContext(ActionContext);
  const [{ hexBytes, payload }, setData] = useState<Data>({ hexBytes: null, payload: null });
  const [error, setError] = useState<string | null>(null);
  const { accounts } = useContext(AccountContext);
  const { t } = useTranslation();

  useEffect((): void => {
    const payload = request.payload;

    if (isRawPayload(payload)) {
      setData({
        hexBytes: payload.data,
        payload: null
      });
    } else {
      registry.setSignedExtensions(payload.signedExtensions);

      setData({
        hexBytes: null,
        payload: registry.createType('ExtrinsicPayload', payload, { version: payload.version })
      });
    }
  }, [request]);

  const _onSignature = useCallback(
    ({ signature }: { signature: HexString }): Promise<void> =>
      approveSignSignature(signId, signature)
        .then(() => onAction())
        .catch((error: Error): void => {
          setError(error.message);
          console.error(error);
        }),
    [onAction, signId]
  );

  if (payload !== null) {
    const json = request.payload as SignerPayloadJSON;

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
            accountIndex={accountIndex as number || 0}
            addressOffset={addressOffset as number || 0}
            error={error}
            genesisHash={json.genesisHash}
            onSignature={_onSignature}
            payload={payload}
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
  } else if (hexBytes !== null) {
    const { address, data } = request.payload as SignerPayloadRaw;
    const account = accounts.find((account) => decodeAddress(account.address).toString() === decodeAddress(address).toString());

    return (
      <>
        <div>
          <Address
            address={address}
            isExternal={isExternal}
          />
        </div>
        {isExternal && !isHardware && account?.genesisHash
          ? (
            <Qr
              address={address}
              cmd={CMD_SIGN_MESSAGE}
              genesisHash={account.genesisHash}
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

  return null;
}
