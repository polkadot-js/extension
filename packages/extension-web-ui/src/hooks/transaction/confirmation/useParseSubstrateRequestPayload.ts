// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestSign } from '@subwallet/extension-base/background/types';
import { useMetadata } from '@subwallet/extension-web-ui/hooks';
import { isRawPayload } from '@subwallet/extension-web-ui/utils/confirmation/request/substrate';
import { useMemo } from 'react';

import { TypeRegistry } from '@polkadot/types';
import { ExtrinsicPayload } from '@polkadot/types/interfaces';
import { SignerPayloadJSON } from '@polkadot/types/types';

const registry = new TypeRegistry();

const useParseSubstrateRequestPayload = (request?: RequestSign): ExtrinsicPayload | string => {
  const chain = useMetadata((request?.payload as SignerPayloadJSON).genesisHash);

  return useMemo(() => {
    if (!request) {
      return '';
    }

    const payload = request.payload;

    if (isRawPayload(payload)) {
      return payload.data;
    } else {
      const _registry = chain?.registry || registry;

      _registry.setSignedExtensions(payload.signedExtensions, chain?.definition.userExtensions); // Important

      return _registry.createType('ExtrinsicPayload', payload, { version: payload.version });
    }
  }, [chain, request]);
};

export default useParseSubstrateRequestPayload;
