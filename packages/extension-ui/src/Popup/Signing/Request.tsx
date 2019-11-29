// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ExtrinsicPayload } from '@polkadot/types/interfaces';
import { AccountJson, RequestExtrinsicSign } from '@polkadot/extension/background/types';

import React, { useContext, useState, useEffect } from 'react';
import { TypeRegistry, createType } from '@polkadot/types';

import { ActionBar, ActionContext, Address, ButtonArea, Link } from '../../components';
import { approveSignPassword, approveSignSignature, cancelSignRequest } from '../../messaging';
import Details from './Details';
import Qr from './Qr';
import Unlock from './Unlock';
import styled from 'styled-components';

interface Props {
  account: AccountJson;
  request: RequestExtrinsicSign;
  signId: string;
  url: string;
}

// keep it global, we can and will re-use this across requests
const registry = new TypeRegistry();

export default function Request ({ account: { isExternal }, request, signId, url }: Props): React.ReactElement<Props> | null {
  const onAction = useContext(ActionContext);
  const [payload, setPayload] = useState<ExtrinsicPayload | null>(null);

  useEffect((): void => {
    setPayload(createType(registry, 'ExtrinsicPayload', request, { version: request.version }));
  }, [request]);

  if (!payload) {
    return null;
  }

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

  return (
    <>
      <Address
        address={request.address}
        genesisHash={request.genesisHash}
      />
      {isExternal
        ? (
          <Qr
            payload={payload}
            request={request}
            onSignature={_onSignature}
          />
        )
        : (
          <Details
            isDecoded={true}
            payload={payload}
            request={request}
            url={url}
          />
        )
      }
      <SignArea>
        {!isExternal && <Unlock onSign={_onSign} />}
        <CancelButton>
          <Link isDanger onClick={_onCancel}>Cancel</Link>
        </CancelButton>
      </SignArea>
    </>
  );
}

const SignArea = styled(ButtonArea)`
  flex-direction: column;
  padding: 6px 1rem;
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
