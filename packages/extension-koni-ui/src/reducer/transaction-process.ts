// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { CommonStepDetail, CommonStepFeeInfo } from '@subwallet/extension-base/types/service-base';
import { simpleDeepClone } from '@subwallet/extension-koni-ui/utils';

// todo: review this file again and remove unnecessary logic

export enum CommonStepStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

interface StepResult {
  result: SWTransactionResponse | Error | boolean | undefined;
  status: CommonStepStatus;
}

export interface CommonProcessState {
  steps: CommonStepDetail[]; // list steps
  feeStructure: CommonStepFeeInfo[];
  currentStep: number; // Current step
  stepResults: Record<number, StepResult>;
}

export enum CommonActionType {
  INIT = 'INIT', // init data
  STEP_CREATE = 'STEP_CREATE', // init step struct
  STEP_COMPLETE = 'STEP_COMPLETE', // complete current step and processing next step
  STEP_ERROR = 'STEP_ERROR', // throw error on current step
  STEP_ERROR_ROLLBACK = 'STEP_ERROR_ROLLBACK', // throw error on current step and rollback previous step
  STEP_SUBMIT = 'STEP_SUBMIT', // submit current step
}

interface CommonStepAction {
  type: CommonActionType;
  payload: unknown;
}

type ActionHandler<T extends CommonStepAction> = (oldState: CommonProcessState, action: T) => CommonProcessState;

export const DEFAULT_COMMON_PROCESS: CommonProcessState = {
  steps: [],
  feeStructure: [],
  currentStep: 0,
  stepResults: {}
};

interface InitAction extends CommonStepAction {
  type: CommonActionType.INIT;
  payload: CommonProcessState;
}

const handleInitAction: ActionHandler<InitAction> = () => {
  return simpleDeepClone(DEFAULT_COMMON_PROCESS);
};

interface StepCreateAction extends CommonStepAction {
  type: CommonActionType.STEP_CREATE;
  payload: Pick<CommonProcessState, 'steps' | 'feeStructure'>;
}

const handleStepCreateAction: ActionHandler<StepCreateAction> = (oldState, { payload }) => {
  const convertKey = (item: CommonStepDetail) => [item.id, item.type].join('-');
  const oldSteps = oldState.steps.map(convertKey).join('_');
  const newSteps = payload.steps.map(convertKey).join('_');

  const result: CommonProcessState = {
    ...oldState,
    ...payload
  };

  result.stepResults = { ...oldState.stepResults };

  if (oldSteps !== newSteps) {
    for (const step of payload.steps) {
      if (!result.stepResults[step.id]) {
        result.stepResults[step.id] = {
          result: undefined,
          status: CommonStepStatus.QUEUED
        };
      }
    }
  }

  const firstStep = Math.min(...Object.keys(result.stepResults).map((key) => parseInt(key)));
  const allQueued = Object.values(result.stepResults).every((_result) => _result.status === CommonStepStatus.QUEUED);

  if (allQueued) {
    result.stepResults[firstStep].status = CommonStepStatus.PROCESSING;
  }

  return result;
};

interface StepSubmitAction extends CommonStepAction {
  type: CommonActionType.STEP_SUBMIT;
  payload: null;
}

const handleStepSubmitAction: ActionHandler<StepSubmitAction> = (oldState) => {
  const result: CommonProcessState = { ...oldState };
  const currentStep = oldState.currentStep;

  result.stepResults = { ...oldState.stepResults };
  result.stepResults[currentStep].status = CommonStepStatus.SUBMITTING;

  return result;
};

interface StepCompleteAction extends CommonStepAction {
  type: CommonActionType.STEP_COMPLETE;
  payload: StepResult['result'];
}

const handleStepCompleteAction: ActionHandler<StepCompleteAction> = (oldState, { payload }) => {
  const result: CommonProcessState = { ...oldState };
  const currentStep = oldState.currentStep;
  const steps = oldState.steps.length;
  const haveNextStep = currentStep < steps - 1;

  result.stepResults = { ...oldState.stepResults };
  result.stepResults[currentStep] = {
    result: payload,
    status: CommonStepStatus.SUCCESS
  };

  if (haveNextStep) {
    result.currentStep = currentStep + 1;
  }

  return result;
};

interface StepErrorAction extends CommonStepAction {
  type: CommonActionType.STEP_ERROR;
  payload: StepResult['result'];
}

const handleStepErrorAction: ActionHandler<StepErrorAction> = (oldState, { payload }) => {
  const result: CommonProcessState = { ...oldState };
  const currentStep = oldState.currentStep;

  result.stepResults = { ...oldState.stepResults };
  result.stepResults[currentStep] = {
    result: payload,
    status: CommonStepStatus.ERROR
  };

  return result;
};

interface StepErrorRollbackAction extends CommonStepAction {
  type: CommonActionType.STEP_ERROR_ROLLBACK;
  payload: StepResult['result'];
}

const handleStepErrorRollbackAction: ActionHandler<StepErrorRollbackAction> = (oldState, { payload }) => {
  const result: CommonProcessState = { ...oldState };
  const currentStep = oldState.currentStep;
  const haveNextStep = currentStep > 0;

  const previousStep = haveNextStep ? currentStep - 1 : currentStep;

  result.stepResults = { ...oldState.stepResults };
  result.stepResults[currentStep] = {
    result: payload,
    status: CommonStepStatus.QUEUED
  };

  result.stepResults[previousStep].status = CommonStepStatus.PROCESSING;
  result.currentStep = previousStep;

  return result;
};

export type CommonProcessAction =
    | InitAction
    | StepCreateAction
    | StepSubmitAction
    | StepCompleteAction
    | StepErrorAction
    | StepErrorRollbackAction;

export const commonProcessReducer = (oldState: CommonProcessState, action: CommonProcessAction): CommonProcessState => {
  switch (action.type) {
    case CommonActionType.INIT:
      return handleInitAction(oldState, action);
    case CommonActionType.STEP_CREATE:
      return handleStepCreateAction(oldState, action);
    case CommonActionType.STEP_SUBMIT:
      return handleStepSubmitAction(oldState, action);
    case CommonActionType.STEP_COMPLETE:
      return handleStepCompleteAction(oldState, action);
    case CommonActionType.STEP_ERROR:
      return handleStepErrorAction(oldState, action);
    case CommonActionType.STEP_ERROR_ROLLBACK:
      return handleStepErrorRollbackAction(oldState, action);
    default:
      throw new Error("Can't handle action");
  }
};
