// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExternalState } from '@subwallet/extension-base/signers/types';
import { SigData } from '@subwallet/extension-koni-ui/types/accountExternalRequest';
import React, { useCallback, useReducer } from 'react';

import { SignerResult } from '@polkadot/types/types/extrinsic';

interface ExternalRequestContextType {
  createResolveExternalRequestData: (data: SigData) => SignerResult;
  externalState: ExternalState;
  clearExternalState: () => void;
  updateExternalState: (state: ExternalState) => void;
}

const DEFAULT_STATE: ExternalState = {
  externalId: ''
};

export const ExternalRequestContext = React.createContext({} as ExternalRequestContextType);

interface ExternalRequestContextProviderProps {
  children?: React.ReactElement;
}

enum ExternalRequestReducerType{
  UPDATE,
  INIT
}

interface ExternalRequestReducerPayload {
  type: ExternalRequestReducerType,
  payload: ExternalState
}

const initState = (state: ExternalState): ExternalState => {
  return {
    ...state
  };
};

const reducer = (oldState: ExternalState, data: ExternalRequestReducerPayload): ExternalState => {
  switch (data.type) {
    case ExternalRequestReducerType.UPDATE:
      return {
        ...oldState,
        ...data.payload
      };
    case ExternalRequestReducerType.INIT:
      return initState(data.payload);
    default:
      return oldState;
  }
};

let id = 1;

export const ExternalRequestContextProvider = ({ children }: ExternalRequestContextProviderProps) => {
  const [externalState, dispatchExternalState] = useReducer(reducer, DEFAULT_STATE, initState);

  const updateExternalState = useCallback((data: ExternalState) => {
    dispatchExternalState({ type: ExternalRequestReducerType.UPDATE, payload: data });
  }, []);

  const clearExternalState = useCallback(() => {
    dispatchExternalState({ type: ExternalRequestReducerType.INIT, payload: DEFAULT_STATE });
  }, []);

  const createResolveExternalRequestData = useCallback((data: SigData): SignerResult => {
    return ({
      id: id++,
      signature: data.signature
    });
  }, []);

  return (
    <ExternalRequestContext.Provider
      value = {{
        createResolveExternalRequestData: createResolveExternalRequestData,
        externalState: externalState,
        clearExternalState: clearExternalState,
        updateExternalState: updateExternalState
      }}
    >
      {children}
    </ExternalRequestContext.Provider>
  );
};
