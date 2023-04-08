// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConfirmationsQueue } from "@subwallet/extension-base/background/KoniTypes";
import {
  AuthorizeRequest,
  ConfirmationRequestBase,
  MetadataRequest,
  SigningRequest,
} from "@subwallet/extension-base/background/types";
import { SWTransactionResult } from "@subwallet/extension-base/services/transaction-service/types";
import { ReduxStatus, RequestState } from "@subwallet-webapp/stores/types";

const initialState: RequestState = {
  authorizeRequest: {},
  metadataRequest: {},
  signingRequest: {},
  transactionRequest: {},

  // Type of confirmation requets
  addNetworkRequest: {},
  addTokenRequest: {},
  switchNetworkRequest: {},
  evmSignatureRequest: {},
  evmSendTransactionRequest: {},

  // Summary Info
  reduxStatus: ReduxStatus.INIT,
  hasConfirmations: false,
  hasInternalConfirmations: false,
  numberOfConfirmations: 0,
};

export const CONFIRMATIONS_FIELDS: Array<keyof RequestState> = [
  "authorizeRequest",
  "metadataRequest",
  "signingRequest",
  "addNetworkRequest",
  "addTokenRequest",
  "switchNetworkRequest",
  "evmSignatureRequest",
  "evmSendTransactionRequest",
];

export interface ConfirmationQueueItem {
  type: ConfirmationType;
  item: ConfirmationRequestBase;
}

export type ConfirmationType = (typeof CONFIRMATIONS_FIELDS)[number];

const readyMap = {
  updateAuthorizeRequests: false,
  updateMetadataRequests: false,
  updateSigningRequests: false,
  updateConfirmationRequests: false,
};

function computeStateSummary(state: RequestState) {
  let numberOfConfirmations = 0;

  state.hasInternalConfirmations = false;
  CONFIRMATIONS_FIELDS.forEach((field) => {
    const confirmationList = Object.values(state[field]);

    numberOfConfirmations += confirmationList.length;

    if (
      !state.hasInternalConfirmations &&
      confirmationList.some((x: ConfirmationRequestBase) => x.isInternal)
    ) {
      state.hasInternalConfirmations = true;
    }
  }, 0);

  state.numberOfConfirmations = numberOfConfirmations;
  state.hasConfirmations = numberOfConfirmations > 0;

  if (Object.values(readyMap).every((v) => v)) {
    state.reduxStatus = ReduxStatus.READY;
  }
}

const requestStateSlice = createSlice({
  initialState,
  name: "requestState",
  reducers: {
    updateAuthorizeRequests(
      state,
      { payload }: PayloadAction<Record<string, AuthorizeRequest>>
    ) {
      state.authorizeRequest = payload;
      readyMap.updateAuthorizeRequests = true;
      computeStateSummary(state);
    },
    updateMetadataRequests(
      state,
      { payload }: PayloadAction<Record<string, MetadataRequest>>
    ) {
      state.metadataRequest = payload;
      readyMap.updateMetadataRequests = true;
      computeStateSummary(state);
    },
    updateSigningRequests(
      state,
      { payload }: PayloadAction<Record<string, SigningRequest>>
    ) {
      state.signingRequest = payload;
      readyMap.updateSigningRequests = true;
      computeStateSummary(state);
    },
    updateConfirmationRequests(
      state,
      action: PayloadAction<Partial<ConfirmationsQueue>>
    ) {
      Object.assign(state, action.payload);
      readyMap.updateConfirmationRequests = true;
      computeStateSummary(state);
    },
    updateTransactionRequests(
      state,
      { payload }: PayloadAction<Record<string, SWTransactionResult>>
    ) {
      state.transactionRequest = payload;
    },
  },
});

export const {
  updateAuthorizeRequests,
  updateConfirmationRequests,
  updateMetadataRequests,
  updateSigningRequests,
} = requestStateSlice.actions;
export default requestStateSlice.reducer;
