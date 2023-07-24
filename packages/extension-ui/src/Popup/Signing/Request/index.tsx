// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, RequestPayload } from '@polkadot/extension-base/background/types';
import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Address } from '@polkadot/extension-ui/components/index';
import { TypeRegistry } from '@polkadot/types';

import { ActionContext, VerticalSpace, Warning } from '../../../components';
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
  requestPayload: RequestPayload;
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

export default function Request({
  account: { accountIndex, addressOffset, genesisHash, isExternal, isHardware },
  buttonText,
  isFirst,
  isLast,
  requestPayload,
  signId,
  url
}: Props): React.ReactElement<Props> | null {
  const onAction = useContext(ActionContext);
  const [{ hexBytes, payload }, setData] = useState<Data>({ hexBytes: null, payload: null });
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect((): void => {
    if (isRawPayload(requestPayload)) {
      setData({
        hexBytes: requestPayload.data,
        payload: null
      });
    } else {
      registry.setSignedExtensions(requestPayload.signedExtensions);

      setData({
        hexBytes: null,
        payload: registry.createType('ExtrinsicPayload', requestPayload, { version: requestPayload.version })
      });
    }
  }, [requestPayload]);

  const _onSignature = useCallback(
    ({ signature }: { signature: HexString }): void => {
      approveSignSignature(signId, signature)
        .then(() => onAction())
        .catch((error: Error): void => {
          setError(t('Unable to decode using the supplied passphrase.'));
          console.error(error);
        });
    },
    [onAction, signId, t]
  );

  if (payload !== null) {
    const jsonRequestPayload = requestPayload as SignerPayloadJSON;

    return (
      <>
        <FullHeightExtrinsic
          requestPayload={jsonRequestPayload}
          url={url}
        />
        {isHardware && (
          <LedgerSign
            accountIndex={(accountIndex as number) || 0}
            addressOffset={(addressOffset as number) || 0}
            error={error}
            genesisHash={jsonRequestPayload.genesisHash}
            onSignature={_onSignature}
            payload={payload}
            setError={setError}
          />
        )}
        <Address
          address={jsonRequestPayload.address}
          genesisHash={jsonRequestPayload.genesisHash}
          isExternal={isExternal}
          isHardware={isHardware}
        />
        <SignArea
          buttonText={buttonText}
          error={error}
          isExternal={isExternal}
          isFirst={isFirst}
          isLast={isLast}
          setError={setError}
          signId={signId}
        />
      </>
    );
  } else if (hexBytes !== null) {
    const { address, data } = requestPayload as SignerPayloadRaw;

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
        <Address
          address={address}
          isExternal={isExternal}
        />
        <SignArea
          buttonText={buttonText}
          error={error}
          isExternal={isExternal}
          isFirst={isFirst}
          isLast={isLast}
          setError={setError}
          signId={signId}
        />
      </>
    );
  }

  return null;
}

const FullHeightExtrinsic = styled(Extrinsic)`
  flex-grow: 1;
`;
