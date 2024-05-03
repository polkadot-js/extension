// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { sendMessage } from '../base';

export async function approveMetaRequest (id: string): Promise<boolean> {
  return sendMessage('pri(metadata.approve)', { id });
}

export async function rejectMetaRequest (id: string): Promise<boolean> {
  return sendMessage('pri(metadata.reject)', { id });
}
