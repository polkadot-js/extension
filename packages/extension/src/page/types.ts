// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageTypes } from '../background/types';

export interface SendRequest {
  (message: MessageTypes, request?: any, subscriber?: (data: any) => any): Promise<any>;
}
