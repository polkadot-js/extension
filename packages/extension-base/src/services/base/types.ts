// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

// 'init' | 'started' | 'starting' | 'stopped' | 'stopping'
import { OptimalProcessParams, OptimalProcessResult } from '@subwallet/extension-base/types/service-base';
import { PromiseHandler } from '@subwallet/extension-base/utils/promise';

export enum ServiceStatus {
  NOT_INITIALIZED = 'not_initialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  STARTED = 'started',
  STARTING = 'starting',
  STOPPED = 'stopped',
  STOPPING = 'stopping',
}

export interface CoreServiceInterface {
  status: ServiceStatus;
  init: () => Promise<void>;
  startPromiseHandler: PromiseHandler<void>;
  start: () => Promise<void>;
  waitForStarted: () => Promise<void>;
}

export interface StoppableServiceInterface extends CoreServiceInterface {
  stopPromiseHandler: PromiseHandler<void>;
  stop: () => Promise<void>;
  waitForStopped: () => Promise<void>;
}

export interface PersistDataServiceInterface {
  loadData: () => Promise<void>;
  persistData: () => Promise<void>;
}

export interface SubscribeServiceInterface {
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export interface CronServiceInterface {
  startCron: () => Promise<void>;
  stopCron: () => Promise<void>;
}

export interface ServiceWithProcessInterface {
  generateOptimalProcess(params: OptimalProcessParams): Promise<OptimalProcessResult>;
}
