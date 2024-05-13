// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from '@subwallet/extension-chains/types';

import { RequestSign } from '@subwallet/extension-base/background/types';
import { isRawPayload } from '@subwallet/extension-koni-ui/utils';
import { useMemo } from 'react';

import { TypeRegistry } from '@polkadot/types';
import { ExtrinsicPayload } from '@polkadot/types/interfaces';

const registry = new TypeRegistry();

const useParseSubstrateRequestPayload = (chain: Chain | null, request?: RequestSign): ExtrinsicPayload | string => {
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
