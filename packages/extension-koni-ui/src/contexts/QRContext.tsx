// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { QrState } from '@subwallet/extension-base/signers/types';
import React, { useCallback, useReducer } from 'react';

type QRContextState = QrState

interface QRContextType {
  QRState: QRContextState;
  updateQRState: (value: Partial<QRContextState>) => void;
  cleanQRState: () => void;
}

const DEFAULT_STATE: QRContextState = {
  isQrHashed: false,
  qrAddress: '',
  qrPayload: new Uint8Array([]),
  qrId: 0
};

export const QRContext = React.createContext({} as QRContextType);

interface QRContextProviderProps {
  children?: React.ReactElement;
}

enum QRReducerType{
  UPDATE,
  INIT
}

interface QRReducerPayload {
  type: QRReducerType,
  payload: Partial<QrState>
}

const initState = (state: QRContextState): QRContextState => {
  return {
    ...state
  };
};

const reducer = (oldState: QRContextState, data: QRReducerPayload): QRContextState => {
  switch (data.type) {
    case QRReducerType.UPDATE:
      return {
        ...oldState,
        ...data.payload
      };
    case QRReducerType.INIT:
      return initState(data.payload as QRContextState);
    default:
      return oldState;
  }
};

export const QRContextProvider = ({ children }: QRContextProviderProps) => {
  const [QRState, setQRState] = useReducer(reducer, DEFAULT_STATE, initState);

  const updateQRState = useCallback((data: Partial<QRContextState>) => {
    setQRState({ type: QRReducerType.UPDATE, payload: data });
  }, []);

  const cleanQRState = useCallback(() => {
    setQRState({ type: QRReducerType.INIT, payload: DEFAULT_STATE });
  }, []);

  return (
    <QRContext.Provider
      value = {{
        QRState: QRState,
        updateQRState: updateQRState,
        cleanQRState: cleanQRState
      }}
    >
      {children}
    </QRContext.Provider>
  );
};
