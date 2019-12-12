// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ExtrinsicPayload } from '@polkadot/types/interfaces';
import { AccountJson, RequestSign } from '@polkadot/extension/background/types';
import { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';

import React, { useContext, useState, useEffect } from 'react';
import { TypeRegistry, createType } from '@polkadot/types';

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
}

// keep it global, we can and will re-use this across requests
const registry = new TypeRegistry();

export default function Request ({ account: { isExternal }, request, signId, url, isFirst }: Props): React.ReactElement<Props> | null {
  const onAction = useContext(ActionContext);
  const [hexBytes, setHexBytes] = useState<string | null>(null);
  const [extrinsic, setExtrinsic] = useState<ExtrinsicPayload | null>(null);

  useEffect((): void => {
    const inner = request.inner;
    if ((inner as SignerPayloadRaw).data) {
      setHexBytes((inner as SignerPayloadRaw).data);
    } else {
      setExtrinsic(createType(registry, 'ExtrinsicPayload', inner, { version: (inner as SignerPayloadJSON).version }));
    }
  }, [request]);

  const _onCancel = (): Promise<void> =>
    cancelSignRequest(signId)
      .then((): void => onAction())
      .catch((error: Error) => console.error(error));
  const _onSign = (password: string): Promise<void> =>
    approveSignPassword(signId, password)
      .then((): void => onAction())
      .catch((error: Error) => console.error(error));
  const _onSignature = ({ signature }: { signature: string }): Promise<void> =>
    approveSignSignature(signId, signature)
      .then((): void => onAction())
      .catch((error: Error) => console.error(error));

  if (extrinsic !== null) {
    const payload = request.inner as SignerPayloadJSON;
    return (
      <>
        <Address
          address={payload.address}
          genesisHash={payload.genesisHash}
        />
        {isExternal
          ? (
            <Qr
              payload={extrinsic}
              request={payload}
              onSignature={_onSignature}
            />
          )
          : (
            <Extrinsic
              isDecoded={true}
              payload={extrinsic}
              request={payload}
              url={url}
            />
          )
        }
        <SignArea>
          {isFirst && !isExternal && <Unlock onSign={_onSign} />}
          <CancelButton>
            <Link isDanger onClick={_onCancel}>Cancel</Link>
          </CancelButton>
        </SignArea>
      </>
    );
  } else if (hexBytes !== null) {
    const payload = request.inner as SignerPayloadRaw;
    return (
      <>
        <Address address={payload.address} />
        <Bytes bytes={payload.data} url={url} />
        <VerticalSpace />
        <SignArea>
          {!isExternal && <Unlock onSign={_onSign} />}
          <CancelButton>
            <Link isDanger onClick={_onCancel}>Reject</Link>
          </CancelButton>
        </SignArea>
      </>
    );
  } else {
    return null;
  }
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
