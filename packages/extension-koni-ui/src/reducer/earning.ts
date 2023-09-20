// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldStepDetail, YieldTokenBaseInfo } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { simpleDeepClone } from '@subwallet/extension-koni-ui/utils';

export enum EarningStepStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

interface StepResult {
  result: SWTransactionResponse | Error | boolean | undefined;
  status: EarningStepStatus;
}

export interface YieldProcessState {
  steps: YieldStepDetail[]; // list steps
  feeStructure: YieldTokenBaseInfo[]; // estimate fee
  currentStep: number; // Current step
  stepResults: Record<number, StepResult>;
}

export enum EarningActionType {
  INIT = 'INIT', // init data
  STEP_CREATE = 'STEP_CREATE', // init step struct
  STEP_COMPLETE = 'STEP_COMPLETE', // complete current step and processing next step
  STEP_ERROR = 'STEP_ERROR', // throw error on current step
  STEP_ERROR_ROLLBACK = 'STEP_ERROR_ROLLBACK', // throw error on current step and rollback previous step
  STEP_SUBMIT = 'STEP_SUBMIT' // submit current step
}

interface AbstractEarningAction {
  type: EarningActionType;
  payload: unknown;
}

type ActionHandler<T extends AbstractEarningAction> = (oldState: YieldProcessState, action: T) => YieldProcessState;

export const DEFAULT_YIELD_PROCESS: YieldProcessState = {
  steps: [],
  feeStructure: [],
  currentStep: 0,
  stepResults: {}
};

interface InitAction extends AbstractEarningAction {
  type: EarningActionType.INIT,
  payload: YieldProcessState;
}

const handleInitAction: ActionHandler<InitAction> = () => {
  return simpleDeepClone(DEFAULT_YIELD_PROCESS);
};

interface StepCreateAction extends AbstractEarningAction {
  type: EarningActionType.STEP_CREATE,
  payload: Pick<YieldProcessState, 'steps' | 'feeStructure'>;
}

const handleStepCreateAction: ActionHandler<StepCreateAction> = (oldState, { payload }) => {
  const convertKey = (item: YieldStepDetail) => [item.id, item.type].join('-');
  const oldSteps = oldState.steps.map(convertKey).join('_');
  const newSteps = payload.steps.map(convertKey).join('_');

  const result: YieldProcessState = {
    ...oldState,
    ...payload
  };

  result.stepResults = { ...oldState.stepResults };

  if (oldSteps !== newSteps) {
    for (const step of payload.steps) {
      if (!result.stepResults[step.id]) {
        result.stepResults[step.id] = {
          result: undefined,
          status: EarningStepStatus.QUEUED
        };
      }
    }
  }

  const firstStep = Math.min(...Object.keys(result.stepResults).map((key) => parseInt(key)));
  const allQueued = Object.values(result.stepResults).every((result) => result.status === EarningStepStatus.QUEUED);

  if (allQueued) {
    result.stepResults[firstStep].status = EarningStepStatus.PROCESSING;
  }

  return result;
};

interface StepSubmitAction extends AbstractEarningAction {
  type: EarningActionType.STEP_SUBMIT,
  payload: null;
}

const handleStepSubmitAction: ActionHandler<StepSubmitAction> = (oldState) => {
  const result: YieldProcessState = { ...oldState };
  const currentStep = oldState.currentStep;

  result.stepResults = { ...oldState.stepResults };
  result.stepResults[currentStep].status = EarningStepStatus.SUBMITTING;

  return result;
};

interface StepCompleteAction extends AbstractEarningAction {
  type: EarningActionType.STEP_COMPLETE,
  payload: StepResult['result'];
}

const handleStepCompleteAction: ActionHandler<StepCompleteAction> = (oldState, { payload }) => {
  const result: YieldProcessState = { ...oldState };
  const currentStep = oldState.currentStep;
  const steps = oldState.steps.length;
  const haveNextStep = currentStep < steps - 1;

  result.stepResults = { ...oldState.stepResults };
  result.stepResults[currentStep] = {
    result: payload,
    status: EarningStepStatus.SUCCESS
  };

  if (haveNextStep) {
    result.currentStep = currentStep + 1;
  }

  return result;
};

interface StepErrorAction extends AbstractEarningAction {
  type: EarningActionType.STEP_ERROR,
  payload: StepResult['result'];
}

const handleStepErrorAction: ActionHandler<StepErrorAction> = (oldState, { payload }) => {
  const result: YieldProcessState = { ...oldState };
  const currentStep = oldState.currentStep;

  result.stepResults = { ...oldState.stepResults };
  result.stepResults[currentStep] = {
    result: payload,
    status: EarningStepStatus.ERROR
  };

  return result;
};

interface StepErrorRollbackAction extends AbstractEarningAction {
  type: EarningActionType.STEP_ERROR_ROLLBACK,
  payload: StepResult['result'];
}

const handleStepErrorRollbackAction: ActionHandler<StepErrorRollbackAction> = (oldState, { payload }) => {
  const result: YieldProcessState = { ...oldState };
  const currentStep = oldState.currentStep;
  const haveNextStep = currentStep > 0;

  const previousStep = haveNextStep ? currentStep - 1 : currentStep;

  result.stepResults = { ...oldState.stepResults };
  result.stepResults[currentStep] = {
    result: payload,
    status: EarningStepStatus.QUEUED
  };

  result.stepResults[previousStep].status = EarningStepStatus.PROCESSING;
  result.currentStep = previousStep;

  return result;
};

type EarningAction = InitAction | StepCreateAction | StepSubmitAction | StepCompleteAction | StepErrorAction | StepErrorRollbackAction;

export const earningReducer = (oldState: YieldProcessState, action: EarningAction): YieldProcessState => {
  switch (action.type) {
    case EarningActionType.INIT:
      return handleInitAction(oldState, action);
    case EarningActionType.STEP_CREATE:
      return handleStepCreateAction(oldState, action);
    case EarningActionType.STEP_SUBMIT:
      return handleStepSubmitAction(oldState, action);
    case EarningActionType.STEP_COMPLETE:
      return handleStepCompleteAction(oldState, action);
    case EarningActionType.STEP_ERROR:
      return handleStepErrorAction(oldState, action);
    case EarningActionType.STEP_ERROR_ROLLBACK:
      return handleStepErrorRollbackAction(oldState, action);
    default:
      throw new Error("Can't handle action");
  }
};
