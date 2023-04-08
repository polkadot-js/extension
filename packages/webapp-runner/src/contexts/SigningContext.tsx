// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  DEFAULT_SIGNING_STATE,
  SigningActionType,
  signingReducer,
  SigningState,
} from "@subwallet-webapp/reducer/signing";
import React, { useCallback, useReducer } from "react";

interface SigningContextProviderProps {
  children?: React.ReactElement;
}

interface SigningContextType {
  signingState: SigningState;
  cleanSigningState: () => void;
  clearError: () => void;
  onErrors: (errors: string[]) => void;
  setBusy: (val: boolean) => void;
  setPasswordError: (val: boolean) => void;
}

export const SigningContext = React.createContext({} as SigningContextType);

export const SigningContextProvider = ({
  children,
}: SigningContextProviderProps) => {
  const [signingState, dispatchSigningState] = useReducer(
    signingReducer,
    DEFAULT_SIGNING_STATE
  );

  const cleanSigningState = useCallback(() => {
    dispatchSigningState({
      type: SigningActionType.CLEAN_STATE,
      payload: null,
    });
  }, []);

  const clearError = useCallback(() => {
    dispatchSigningState({
      type: SigningActionType.CLEAR_ERROR,
      payload: null,
    });
  }, []);

  const onErrors = useCallback((errors: string[]) => {
    dispatchSigningState({
      type: SigningActionType.ON_ERROR,
      payload: { errors: errors },
    });
  }, []);

  const setBusy = useCallback((isBusy: boolean) => {
    dispatchSigningState({
      type: SigningActionType.SET_BUSY,
      payload: { isBusy: isBusy },
    });
  }, []);

  const setPasswordError = useCallback((isBusy: boolean) => {
    dispatchSigningState({
      type: SigningActionType.SET_PASSWORD_ERROR,
      payload: { passwordError: isBusy },
    });
  }, []);

  return (
    <SigningContext.Provider
      value={{
        cleanSigningState: cleanSigningState,
        clearError: clearError,
        onErrors: onErrors,
        setBusy: setBusy,
        setPasswordError: setPasswordError,
        signingState: signingState,
      }}
    >
      {children}
    </SigningContext.Provider>
  );
};
