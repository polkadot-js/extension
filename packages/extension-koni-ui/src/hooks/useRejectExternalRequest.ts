// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MANUAL_CANCEL_EXTERNAL_REQUEST } from '@subwallet/extension-koni-ui/constants/signing';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { QrSignerContext } from '@subwallet/extension-koni-ui/contexts/QrSignerContext';
import { rejectExternalRequest } from '@subwallet/extension-koni-ui/messaging';
import { useCallback, useContext } from 'react';

interface Result {
  handlerReject: (externalId: string) => Promise<void>;
}

export const useRejectExternalRequest = (): Result => {
  const { cleanQrState } = useContext(QrSignerContext);
  const { cleanExternalState } = useContext(ExternalRequestContext);

  const handlerReject = useCallback(async (externalId: string) => {
    if (externalId) {
      await rejectExternalRequest({ id: externalId, message: MANUAL_CANCEL_EXTERNAL_REQUEST });
    }

    cleanQrState();
    cleanExternalState();
  }, [cleanQrState, cleanExternalState]);

  return {
    handlerReject: handlerReject
  };
};
