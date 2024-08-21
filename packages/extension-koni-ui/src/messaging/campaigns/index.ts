// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestCampaignBannerComplete, ShowCampaignPopupRequest } from '@subwallet/extension-base/background/KoniTypes';
import { RequestUnlockDotCheckCanMint } from '@subwallet/extension-base/types';

import { sendMessage } from '../base';

export async function completeBannerCampaign (request: RequestCampaignBannerComplete): Promise<boolean> {
  return sendMessage('pri(campaign.banner.complete)', request);
}

export async function unlockDotCheckCanMint (request: RequestUnlockDotCheckCanMint): Promise<boolean> {
  return sendMessage('pri(campaign.unlockDot.canMint)', request);
}

export async function toggleCampaignPopup (request: ShowCampaignPopupRequest): Promise<null> {
  return sendMessage('pri(campaign.popup.toggle)', request);
}
