// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, RequestSign } from '@polkadot/extension-base/background/types';
import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { TypeRegistry } from '@polkadot/types';

import { ActionContext, Address, BottomWrapper, VerticalSpace, Warning } from '../../../components';
import { useTranslation } from '../../../components/translate';
import { approveSignSignature } from '../../../messaging';
import Bytes from '../Bytes';
import Extrinsic from '../Extrinsic';
import LedgerSign from '../LedgerSign';
import SignArea from './SignArea';

interface Props {
  account: AccountJson;
  buttonText: string;
  isFirst: boolean;
  request: RequestSign;
  signId: string;
  url: string;
  isLast: boolean;
}

interface Data {
  hexBytes: string | null;
  payload: ExtrinsicPayload | null;
}

export const CMD_MORTAL = 2;
export const CMD_SIGN_MESSAGE = 3;

// keep it global, we can and will re-use this across requests
const registry = new TypeRegistry();

function isRawPayload(payload: SignerPayloadJSON | SignerPayloadRaw): payload is SignerPayloadRaw {
  return !!(payload as SignerPayloadRaw).data;
}

const StyledAddress = styled(Address)`
  max-width: 324px;
  margin: 0px 8px 8px 8px;
`;

const Wrapper = styled.div`
  position: absolute;
  left: 0px;
  right: 0px;
  bottom: 40px;
  margin: 0px 8px;
`;

const StyledSignArea = styled(SignArea)`
  ~ ${BottomWrapper} {
    backdrop-filter: initial;
  }
`;

export default function Request({
  account: { accountIndex, addressOffset, genesisHash, isExternal, isHardware },
  buttonText,
  isFirst,
  isLast,
  request,
  signId,
  url
}: Props): React.ReactElement<Props> | null {
  const onAction = useContext(ActionContext);
  const [{ hexBytes, payload }, setData] = useState<Data>({ hexBytes: null, payload: null });
  const [error, setError] = useState<string | null>(null);
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
    ({ signature }: { signature: HexString }): void => {
      approveSignSignature(signId, signature)
        .then(() => onAction())
        .catch((error: Error): void => {
          setError(error.message);
          console.error(error);
        });
    },
    [onAction, signId]
  );

  if (payload !== null) {
    const json = request.payload as SignerPayloadJSON;

    return (
      <>
        <Extrinsic
          payload={payload}
          request={json}
          url={url}
        />
        {isHardware && (
          <LedgerSign
            accountIndex={(accountIndex as number) || 0}
            addressOffset={(addressOffset as number) || 0}
            error={error}
            genesisHash={json.genesisHash}
            onSignature={_onSignature}
            payload={payload}
            setError={setError}
          />
        )}
        <Wrapper>
          <StyledAddress
            address={json.address}
            genesisHash={json.genesisHash}
            isExternal={isExternal}
            isHardware={isHardware}
          />
          <StyledSignArea
            buttonText={buttonText}
            error={error}
            isExternal={isExternal}
            isFirst={isFirst}
            isLast={isLast}
            setError={setError}
            signId={signId}
          />
        </Wrapper>
      </>
    );
  } else if (hexBytes !== null) {
    const { address, data } = request.payload as SignerPayloadRaw;

    return (
      <>
        <Bytes
          bytes={data}
          url={url}
        />
        {isExternal && !isHardware && !genesisHash && (
          <>
            <Warning isDanger>
              {t(
                '"Allow use on any network" is not supported to show a QR code. You must associate this account with a network.'
              )}
            </Warning>
            <VerticalSpace />
          </>
        )}
        {isHardware && (
          <>
            <Warning>{t('Message signing is not supported for hardware wallets.')}</Warning>
            <VerticalSpace />
          </>
        )}
        <Wrapper>
          <StyledAddress
            address={address}
            isExternal={isExternal}
          />
          <StyledSignArea
            buttonText={buttonText}
            error={error}
            isExternal={isExternal}
            isFirst={isFirst}
            isLast={isLast}
            setError={setError}
            signId={signId}
          />
        </Wrapper>
      </>
    );
  }

  return null;
}
