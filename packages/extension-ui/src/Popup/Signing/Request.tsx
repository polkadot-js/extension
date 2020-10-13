// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicPayload } from '@polkadot/types/interfaces';
import { AccountJson, RequestSign } from '@polkadot/extension-base/background/types';
import { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';

import React, { useCallback, useEffect, useContext, useState } from 'react';
import { PASSWORD_EXPIRY_MIN } from '@polkadot/extension-base/defaults';
import { TypeRegistry } from '@polkadot/types';

import { ActionBar, ActionContext, Address, Button, ButtonArea, Checkbox, Link, VerticalSpace } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { approveSignPassword, approveSignSignature, cancelSignRequest, isSignLocked, updatePasswordCache } from '../../messaging';
import Bytes from './Bytes';
import Extrinsic from './Extrinsic';
import Qr from './Qr';
import Unlock from './Unlock';
import styled from 'styled-components';

interface Props {
  account: AccountJson;
  buttonText: string;
  isFirst?: boolean;
  request: RequestSign;
  signId: string;
  url: string;
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

export default function Request ({ account: { address, isExternal }, buttonText, isFirst, request, signId, url }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [{ hexBytes, payload }, setData] = useState<Data>({ hexBytes: null, payload: null });
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [savePass, setSavePass] = useState(false);

  useEffect(() => {
    updatePasswordCache(address)
      .catch((e) => console.error(e));
  }, [address]);

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
    (password?: string): Promise<void> => {
      setIsBusy(true);

      return approveSignPassword(signId, savePass, password)
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
    [onAction, savePass, signId]
  );

  const _onSignQuick = useCallback(
    () => _onSign(),
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

  const SignButton = () => isLocked
    ? (
      <Unlock
        buttonText={buttonText}
        error={error}
        isBusy={isBusy}
        onSign={_onSign}
      >
        <Checkbox
          checked={savePass}
          label={t<string>(
            "Don't ask me again for the next {{expiration}} minutes",
            { replace: { expiration: PASSWORD_EXPIRY_MIN } }
          )}
          onChange={setSavePass}
        />
      </Unlock>
    )
    : (
      <Button
        isBusy={isBusy}
        isDisabled={isLocked === null}
        onClick={_onSignQuick}
      >
        {buttonText}
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
            isExternal={isExternal}
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
          {isFirst && !isExternal && <SignButton/>}
          <CancelButton>
            <Link
              isDanger
              onClick={_onCancel}
            >
              {t<string>('Cancel')}
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
          <Address
            address={raw.address}
            isExternal={isExternal}
          />
        </div>
        <Bytes
          bytes={raw.data}
          url={url}
        />
        <VerticalSpace />
        <SignArea>
          {!isExternal && <SignButton/>}
          <CancelButton>
            <Link
              isDanger
              onClick={_onCancel}
            >
              {t<string>('Reject')}
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
