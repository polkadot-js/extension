// Copyright 2019-2025 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface Message extends MessageEvent {
  data: {
    error?: string;
    id: string;
    origin: string;
    response?: string;
    subscription?: string;
  }
}
