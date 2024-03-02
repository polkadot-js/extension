// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { SwapFeeInfo, SwapStepDetail } from '@subwallet/extension-base/types/swap';
import { simpleDeepClone } from '@subwallet/extension-web-ui/utils';

// todo: review this file again and remove unnecessary logic

export enum SwapStepStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

interface StepResult {
  result: SWTransactionResponse | Error | boolean | undefined;
  status: SwapStepStatus;
}

export interface SwapProcessState {
  steps: SwapStepDetail[]; // list steps
  feeStructure: SwapFeeInfo[];
  currentStep: number; // Current step
  stepResults: Record<number, StepResult>;
}

export enum SwapActionType {
  INIT = 'INIT', // init data
  STEP_CREATE = 'STEP_CREATE', // init step struct
  STEP_COMPLETE = 'STEP_COMPLETE', // complete current step and processing next step
  STEP_ERROR = 'STEP_ERROR', // throw error on current step
  STEP_ERROR_ROLLBACK = 'STEP_ERROR_ROLLBACK', // throw error on current step and rollback previous step
  STEP_SUBMIT = 'STEP_SUBMIT', // submit current step
}

interface AbstractSwapAction {
  type: SwapActionType;
  payload: unknown;
}

type ActionHandler<T extends AbstractSwapAction> = (oldState: SwapProcessState, action: T) => SwapProcessState;

export const DEFAULT_SWAP_PROCESS: SwapProcessState = {
  steps: [],
  feeStructure: [],
  currentStep: 0,
  stepResults: {}
};

interface InitAction extends AbstractSwapAction {
  type: SwapActionType.INIT;
  payload: SwapProcessState;
}

const handleInitAction: ActionHandler<InitAction> = () => {
  return simpleDeepClone(DEFAULT_SWAP_PROCESS);
};

interface StepCreateAction extends AbstractSwapAction {
  type: SwapActionType.STEP_CREATE;
  payload: Pick<SwapProcessState, 'steps' | 'feeStructure'>;
}

const handleStepCreateAction: ActionHandler<StepCreateAction> = (oldState, { payload }) => {
  const convertKey = (item: SwapStepDetail) => [item.id, item.type].join('-');
  const oldSteps = oldState.steps.map(convertKey).join('_');
  const newSteps = payload.steps.map(convertKey).join('_');

  const result: SwapProcessState = {
    ...oldState,
    ...payload
  };

  result.stepResults = { ...oldState.stepResults };

  if (oldSteps !== newSteps) {
    for (const step of payload.steps) {
      if (!result.stepResults[step.id]) {
        result.stepResults[step.id] = {
          result: undefined,
          status: SwapStepStatus.QUEUED
        };
      }
    }
  }

  const firstStep = Math.min(...Object.keys(result.stepResults).map((key) => parseInt(key)));
  const allQueued = Object.values(result.stepResults).every((_result) => _result.status === SwapStepStatus.QUEUED);

  if (allQueued) {
    result.stepResults[firstStep].status = SwapStepStatus.PROCESSING;
  }

  return result;
};

interface StepSubmitAction extends AbstractSwapAction {
  type: SwapActionType.STEP_SUBMIT;
  payload: null;
}

const handleStepSubmitAction: ActionHandler<StepSubmitAction> = (oldState) => {
  const result: SwapProcessState = { ...oldState };
  const currentStep = oldState.currentStep;

  result.stepResults = { ...oldState.stepResults };
  result.stepResults[currentStep].status = SwapStepStatus.SUBMITTING;

  return result;
};

interface StepCompleteAction extends AbstractSwapAction {
  type: SwapActionType.STEP_COMPLETE;
  payload: StepResult['result'];
}

const handleStepCompleteAction: ActionHandler<StepCompleteAction> = (oldState, { payload }) => {
  const result: SwapProcessState = { ...oldState };
  const currentStep = oldState.currentStep;
  const steps = oldState.steps.length;
  const haveNextStep = currentStep < steps - 1;

  result.stepResults = { ...oldState.stepResults };
  result.stepResults[currentStep] = {
    result: payload,
    status: SwapStepStatus.SUCCESS
  };

  if (haveNextStep) {
    result.currentStep = currentStep + 1;
  }

  return result;
};

interface StepErrorAction extends AbstractSwapAction {
  type: SwapActionType.STEP_ERROR;
  payload: StepResult['result'];
}

const handleStepErrorAction: ActionHandler<StepErrorAction> = (oldState, { payload }) => {
  const result: SwapProcessState = { ...oldState };
  const currentStep = oldState.currentStep;

  result.stepResults = { ...oldState.stepResults };
  result.stepResults[currentStep] = {
    result: payload,
    status: SwapStepStatus.ERROR
  };

  return result;
};

interface StepErrorRollbackAction extends AbstractSwapAction {
  type: SwapActionType.STEP_ERROR_ROLLBACK;
  payload: StepResult['result'];
}

const handleStepErrorRollbackAction: ActionHandler<StepErrorRollbackAction> = (oldState, { payload }) => {
  const result: SwapProcessState = { ...oldState };
  const currentStep = oldState.currentStep;
  const haveNextStep = currentStep > 0;

  const previousStep = haveNextStep ? currentStep - 1 : currentStep;

  result.stepResults = { ...oldState.stepResults };
  result.stepResults[currentStep] = {
    result: payload,
    status: SwapStepStatus.QUEUED
  };

  result.stepResults[previousStep].status = SwapStepStatus.PROCESSING;
  result.currentStep = previousStep;

  return result;
};

type SwapAction =
  | InitAction
  | StepCreateAction
  | StepSubmitAction
  | StepCompleteAction
  | StepErrorAction
  | StepErrorRollbackAction;

export const swapReducer = (oldState: SwapProcessState, action: SwapAction): SwapProcessState => {
  switch (action.type) {
    case SwapActionType.INIT:
      return handleInitAction(oldState, action);
    case SwapActionType.STEP_CREATE:
      return handleStepCreateAction(oldState, action);
    case SwapActionType.STEP_SUBMIT:
      return handleStepSubmitAction(oldState, action);
    case SwapActionType.STEP_COMPLETE:
      return handleStepCompleteAction(oldState, action);
    case SwapActionType.STEP_ERROR:
      return handleStepErrorAction(oldState, action);
    case SwapActionType.STEP_ERROR_ROLLBACK:
      return handleStepErrorRollbackAction(oldState, action);
    default:
      throw new Error("Can't handle action");
  }
};
