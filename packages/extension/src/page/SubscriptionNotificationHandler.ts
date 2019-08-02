// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import EventEmitter from 'eventemitter3';

// This EventEmitter gets triggered when subscription messages are received
// from the extension. It then dispatches the event to its subscriber,
// PostMessageProvider.
export class SubscriptionNotificationHandler extends EventEmitter {
}

export const subscriptionNotificationHandler = new SubscriptionNotificationHandler();
