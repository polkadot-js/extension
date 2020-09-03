// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ExtrinsicPayload } from '@polkadot/types/interfaces';
import { AccountJson, RequestSign } from '@polkadot/extension-base/background/types';
import { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';

import React, { useContext, useState, useEffect } from 'react';
import { TypeRegistry } from '@polkadot/types';

import { ActionBar, ActionContext, Address, ButtonArea, Link, VerticalSpace } from '../../components';
import { approveSignPassword, approveSignSignature, cancelSignRequest } from '../../messaging';
import Bytes from './Bytes';
import Extrinsic from './Extrinsic';
import Qr from './Qr';
import Unlock from './Unlock';
import styled from 'styled-components';

interface Props {
  account: AccountJson;
  request: RequestSign;
  signId: string;
  url: string;
  isFirst?: boolean;
  buttonText?: string;
}

interface Data {
  hexBytes: string | null;
  payload: ExtrinsicPayload | null;
}

// keep it global, we can and will re-use this across requests
const registry = new TypeRegistry();

function isRawPayload (payload: SignerPayloadJSON | SignerPayloadRaw): payload is SignerPayloadRaw {
  return !!(payload as SignerPayloadRaw).data;
}

export default function Request ({ account: { isExternal }, buttonText, isFirst, request, signId, url }: Props): React.ReactElement<Props> | null {
  const onAction = useContext(ActionContext);
  const [{ hexBytes, payload }, setData] = useState<Data>({ hexBytes: null, payload: null });
  const [error, setError] = useState<string | null>(null);

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

  const _onCancel = (): Promise<void> =>
    cancelSignRequest(signId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error));
  const _onSign = (password: string): Promise<void> =>
    approveSignPassword(signId, password)
      .then(() => onAction())
      .catch((error: Error): void => {
        setError(error.message);
        console.error(error);
      });
  const _onSignature = ({ signature }: { signature: string }): Promise<void> =>
    approveSignSignature(signId, signature)
      .then(() => onAction())
      .catch((error: Error): void => {
        setError(error.message);
        console.error(error);
      });

  if (payload !== null) {
    const json = request.payload as SignerPayloadJSON;

    return (
      <>
        <div>
          <Address
            address={json.address}
            genesisHash={json.genesisHash}
          />
        </div>
        {isExternal
          ? (
            <Qr
              onSignature={_onSignature}
              payload={payload}
              request={json}
            />
          ) : (
            <Extrinsic
              isDecoded={true}
              payload={payload}
              request={json}
              url={url}
            />
          )
        }
        <SignArea>
          {isFirst && !isExternal && (
            <Unlock
              buttonText={buttonText}
              error={error}
              onSign={_onSign}
            />
          )}
          <CancelButton>
            <Link
              isDanger
              onClick={_onCancel}
            >
              Cancel
            </Link>
          </CancelButton>
        </SignArea>
      </>
    );
  } else if (hexBytes !== null) {
    const raw = request.payload as SignerPayloadRaw;

    return (
      <>
        <div>
          <Address address={raw.address} />
        </div>
        <Bytes
          bytes={raw.data}
          url={url}
        />
        <VerticalSpace />
        <SignArea>
          {!isExternal && (
            <Unlock
              buttonText={buttonText}
              onSign={_onSign}
            />
          )}
          <CancelButton>
            <Link
              isDanger
              onClick={_onCancel}
            >
              Reject
            </Link>
          </CancelButton>
        </SignArea>
      </>
    );
  }

  return null;
}

const SignArea = styled(ButtonArea)`
  flex-direction: column;
  padding: 6px 24px;
`;

const CancelButton = styled(ActionBar)`
  margin-top: 4px;
  margin-bottom: 4px;
  text-decoration: underline;

  a {
    margin: auto;
  }
`;

CancelButton.displayName = 'CancelButton';
