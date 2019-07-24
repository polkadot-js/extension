// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import EventEmitter from 'eventemitter3';

class NotificationHandler extends EventEmitter {
}

export const notificationHandler = new NotificationHandler();