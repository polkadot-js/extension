// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExternalState } from "@subwallet/extension-base/signers/types";
import { SigData } from "@subwallet-webapp/types";
import React, { useCallback, useReducer } from "react";

import { SignerResult } from "@polkadot/types/types/extrinsic";

interface InternalRequestContextType {
  createResolveExternalRequestData: (data: SigData) => SignerResult;
  externalState: ExternalState;
  cleanExternalState: () => void;
  updateExternalState: (state: ExternalState) => void;
}

const DEFAULT_STATE: ExternalState = {
  externalId: "",
};

export const InternalRequestContext = React.createContext(
  {} as InternalRequestContextType
);

interface InternalRequestContextProviderProps {
  children?: React.ReactElement;
}

enum InternalRequestReducerType {
  UPDATE,
  INIT,
}

interface ExternalRequestReducerPayload {
  type: InternalRequestReducerType;
  payload: ExternalState;
}

const initState = (state: ExternalState): ExternalState => {
  return {
    ...state,
  };
};

const reducer = (
  oldState: ExternalState,
  data: ExternalRequestReducerPayload
): ExternalState => {
  switch (data.type) {
    case InternalRequestReducerType.UPDATE:
      return {
        ...oldState,
        ...data.payload,
      };
    case InternalRequestReducerType.INIT:
      return initState(data.payload);
    default:
      return oldState;
  }
};

let id = 1;

export const InternalRequestContextProvider = ({
  children,
}: InternalRequestContextProviderProps) => {
  const [externalState, dispatchExternalState] = useReducer(
    reducer,
    DEFAULT_STATE,
    initState
  );

  const updateExternalState = useCallback((data: ExternalState) => {
    dispatchExternalState({
      type: InternalRequestReducerType.UPDATE,
      payload: data,
    });
  }, []);

  const cleanExternalState = useCallback(() => {
    dispatchExternalState({
      type: InternalRequestReducerType.INIT,
      payload: DEFAULT_STATE,
    });
  }, []);

  const createResolveExternalRequestData = useCallback(
    (data: SigData): SignerResult => {
      return {
        id: id++,
        signature: data.signature,
      };
    },
    []
  );

  return (
    <InternalRequestContext.Provider
      value={{
        createResolveExternalRequestData: createResolveExternalRequestData,
        externalState: externalState,
        cleanExternalState: cleanExternalState,
        updateExternalState: updateExternalState,
      }}
    >
      {children}
    </InternalRequestContext.Provider>
  );
};
