// Copyright 2019-2026 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestSign, RequestSignExtrinsic } from '../background/types.js';

export function isExtrinsicRequest (request: RequestSign): request is RequestSignExtrinsic {
  return request.channel === 'extrinsic';
}
