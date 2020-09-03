// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ExtrinsicPayload } from '@polkadot/types/interfaces';
import { AccountJson, RequestSign } from '@polkadot/extension-base/background/types';
import { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';

import React, { useCallback, useContext, useState, useEffect } from 'react';
import { TypeRegistry } from '@polkadot/types';

import { ActionBar, ActionContext, Address, Button, ButtonArea, Checkbox, Link, VerticalSpace } from '../../components';
import { approveSignPassword, approveSignSignature, cancelSignRequest, isSignLocked } from '../../messaging';
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
  const [isBusy, setIsBusy] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [isSavedPass, setIsSavedPass] = useState(false);

  useEffect((): void => {
    setIsLocked(null);
    !isExternal && isSignLocked(signId)
      .then((isLocked) => setIsLocked(isLocked))
      .catch((error: Error) => console.error(error));
  }, [isExternal, signId]);

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

  const _onCancel = useCallback(
    (): Promise<void> => cancelSignRequest(signId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error)),
    [onAction, signId]
  );

  const _onSign = useCallback(
    (password: string): Promise<void> => {
      setIsBusy(true);

      return approveSignPassword(signId, password, !!(password && isSavedPass))
        .then((): void => {
          setIsBusy(false);
          onAction();
        })
        .catch((error: Error): void => {
          setIsBusy(false);
          setError(error.message);
          console.error(error);
        });
    },
    [onAction, isSavedPass, signId]
  );

  const _onSignQuick = useCallback(
    () => _onSign(''),
    [_onSign]
  );

  const _onSignature = useCallback(
    ({ signature }: { signature: string }): Promise<void> =>
      approveSignSignature(signId, signature)
        .then(() => onAction())
        .catch((error: Error): void => {
          setError(error.message);
          console.error(error);
        }),
    [onAction, signId]
  );

  const signButton = isLocked
    ? (
      <Unlock
        buttonText={buttonText}
        error={error}
        isBusy={isBusy}
        onSign={_onSign}
      >
        <Checkbox
          checked={!!isSavedPass}
          label="Don't ask me again for the next 15 minutes"
          onChange={setIsSavedPass}
        />
      </Unlock>
    )
    : (
      <Button
        isBusy={isBusy}
        onClick={_onSignQuick}
      >
        Sign the transaction
      </Button>
    );

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
          {(isLocked !== null) && isFirst && !isExternal && signButton}
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
          {!isExternal && signButton}
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
