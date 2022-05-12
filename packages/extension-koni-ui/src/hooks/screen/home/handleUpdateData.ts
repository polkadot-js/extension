// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { fetchStakingData } from '@subwallet/extension-koni-ui/messaging';

export default async function handleUpdateData () {
  await fetchStakingData();
}
