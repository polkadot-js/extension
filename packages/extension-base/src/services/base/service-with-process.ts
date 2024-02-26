// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { OptimalProcessParams, OptimalProcessResult } from '@subwallet/extension-base/types/service-base';

export abstract class BaseServiceWithProcess {
  // todo: there might be more
  public abstract generateOptimalProcess(params: OptimalProcessParams): Promise<OptimalProcessResult>;
}
