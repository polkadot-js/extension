// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface SigningState {
  isBusy: boolean;
  errors: string[];
  passwordError: boolean;
}

export enum SigningActionType {
  INIT = 'INIT',
  SET_BUSY = 'SET_BUSY',
  SET_PASSWORD_ERROR = 'SET_PASSWORD_ERROR',
  ON_ERROR = 'ON_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
  CLEAN_STATE = 'CLEAN_STATE',
  START = 'START',
  UPDATE = 'UPDATE'
}

interface AbstractSigningAction {
  type: SigningActionType;
  payload: Partial<SigningState> | null;
}

interface SigningInitAction extends AbstractSigningAction {
  type: SigningActionType.INIT;
  payload: Partial<SigningState>;
}

interface SigningSetBusyAction extends AbstractSigningAction {
  type: SigningActionType.SET_BUSY;
  payload: {
    isBusy: boolean;
  };
}

interface SigningSetPasswordErrorAction extends AbstractSigningAction {
  type: SigningActionType.SET_PASSWORD_ERROR;
  payload: {
    passwordError: boolean;
  };
}

interface SigningOnErrorAction extends AbstractSigningAction {
  type: SigningActionType.ON_ERROR;
  payload: {
    errors: string[];
  };
}
interface SigningClearErrorAction extends AbstractSigningAction {
  type: SigningActionType.CLEAR_ERROR;
  payload: null;
}

interface SigningCleanStateAction extends AbstractSigningAction {
  type: SigningActionType.CLEAN_STATE;
  payload: null;
}

type SigningAction = SigningInitAction | SigningSetBusyAction | SigningSetPasswordErrorAction | SigningOnErrorAction | SigningClearErrorAction | SigningCleanStateAction;

export const DEFAULT_SIGNING_STATE: SigningState = {
  isBusy: false,
  errors: [],
  passwordError: false
};

const initHandler = ({ payload }: SigningInitAction): SigningState => {
  return {
    ...DEFAULT_SIGNING_STATE,
    ...payload
  };
};

const setBusyHandler = (state: SigningState, { payload }: SigningSetBusyAction): SigningState => {
  return {
    ...state,
    isBusy: payload.isBusy
  };
};

const setPasswordErrorHandler = (state: SigningState, { payload }: SigningSetPasswordErrorAction): SigningState => {
  return {
    ...state,
    passwordError: payload.passwordError
  };
};

const onErrorHandler = (state: SigningState, { payload }: SigningOnErrorAction): SigningState => {
  return {
    ...state,
    errors: payload.errors
  };
};

const clearErrorHandler = (state: SigningState): SigningState => {
  return {
    ...state,
    errors: []
  };
};

const cleanStateHandler = (): SigningState => {
  return {
    ...DEFAULT_SIGNING_STATE
  };
};

export const signingReducer = (state: SigningState, action: SigningAction): SigningState => {
  const { type } = action;

  switch (type) {
    case SigningActionType.INIT:
      return initHandler(action);
    case SigningActionType.SET_BUSY:
      return setBusyHandler(state, action);
    case SigningActionType.SET_PASSWORD_ERROR:
      return setPasswordErrorHandler(state, action);
    case SigningActionType.ON_ERROR:
      return onErrorHandler(state, action);
    case SigningActionType.CLEAR_ERROR:
      return clearErrorHandler(state);
    case SigningActionType.CLEAN_STATE:
      return cleanStateHandler();
    default:
      throw new Error("Can't handle action");
  }
};
