// Copyright 2019-2020 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestTypes, ResponseTypes, SubscriptionMessageTypes, MessageTypesWithNullRequest, MessageTypesWithNoSubscriptions, MessageTypesWithSubscriptions } from '../background/types';

export interface SendRequest {
  <TMessageType extends MessageTypesWithNullRequest>(message: TMessageType): Promise<ResponseTypes[TMessageType]>;
  <TMessageType extends MessageTypesWithNoSubscriptions>(message: TMessageType, request: RequestTypes[TMessageType]): Promise<ResponseTypes[TMessageType]>;
  <TMessageType extends MessageTypesWithSubscriptions>(message: TMessageType, request: RequestTypes[TMessageType], subscriber: (data: SubscriptionMessageTypes[TMessageType]) => void): Promise<ResponseTypes[TMessageType]>;
}
