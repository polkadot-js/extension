// Copyright 2019-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import KoniState from '@subwallet/extension-base/koni/background/handlers/State';

import { UnlockDotCampaign } from './campaigns';

export default class MintCampaignService {
  public readonly unlockDotCampaign: UnlockDotCampaign;
  readonly #state: KoniState;

  constructor (state: KoniState) {
    this.#state = state;
    this.unlockDotCampaign = new UnlockDotCampaign(this.#state);
  }
}
