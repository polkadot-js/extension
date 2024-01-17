// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestSign } from '@subwallet/extension-base/background/types';
import { isRawPayload } from '@subwallet/extension-web-ui/utils/confirmation/request/substrate';
import { useMemo } from 'react';

import { TypeRegistry } from '@polkadot/types';
import { ExtrinsicPayload } from '@polkadot/types/interfaces';

const registry = new TypeRegistry();

const useParseSubstrateRequestPayload = (request?: RequestSign): ExtrinsicPayload | string => {
  return useMemo(() => {
    if (!request) {
      return '';
    }

    const payload = request.payload;

    if (isRawPayload(payload)) {
      return payload.data;
    } else {
      registry.setSignedExtensions(payload.signedExtensions); // Important

      return registry.createType('ExtrinsicPayload', payload, { version: payload.version });
    }
  }, [request]);
};

export default useParseSubstrateRequestPayload;
