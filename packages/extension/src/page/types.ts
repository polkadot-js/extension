// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { RequestMessage } from '../background/types';

export interface SendRequest {
  <TRequestMessage extends RequestMessage>(message: TRequestMessage['message'], request?: TRequestMessage['payload'], subscriber ?: (data: any) => void): Promise <any>;
}