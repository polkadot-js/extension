// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SigningRequest } from '@subwallet/extension-base/services/request-service/types';
import { AuthorizeRequest, MetadataRequest } from '@subwallet/extension-base/background/types';
import { ReduxStatus, RequestState, UpdateConfirmationsQueueRequest } from '@subwallet/extension-koni-ui/stores/types';

const initialState: RequestState = {
  authorizeRequest: [],
  metadataRequest: [],
  signingRequest: [],

  confirmationQueue: {
    addNetworkRequest: {},
    addTokenRequest: {},
    switchNetworkRequest: {},
    evmSignatureRequest: {},
    evmSignatureRequestExternal: {},
    evmSendTransactionRequest: {},
    evmSendTransactionRequestExternal: {}
  },

  reduxStatus: ReduxStatus.INIT
};

const requestStateSlice = createSlice({
  initialState,
  name: 'requestState',
  reducers: {
    updateAuthorizeRequest (state, action: PayloadAction<AuthorizeRequest>) {
      const { payload } = action;

      return {
        ...state,
        authorizeRequest: [...state.authorizeRequest, payload],
        reduxStatus: ReduxStatus.READY
      };
    },
    updateMetadataRequest (state, action: PayloadAction<MetadataRequest[]>) {
      const { payload } = action;

      return {
        ...state,
        metadataRequest: [...state.metadataRequest, ...payload],
        reduxStatus: ReduxStatus.READY
      };
    },
    updateSigningRequest (state, action: PayloadAction<SigningRequest[]>) {
      const { payload } = action;

      return {
        ...state,
        signingRequest: [...state.signingRequest, ...payload],
        reduxStatus: ReduxStatus.READY
      };
    },
    updateConfirmationQueue (state, action: PayloadAction<UpdateConfirmationsQueueRequest>) {
      const { payload } = action;

      return {
        ...state,
        confirmationQueue: {
          ...state.confirmationQueue,
          [payload.type]: {
            ...state.confirmationQueue[payload.type],
            ...payload.data
          }
        },
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateAuthorizeRequest, updateConfirmationQueue, updateMetadataRequest, updateSigningRequest } = requestStateSlice.actions;
export default requestStateSlice.reducer;
