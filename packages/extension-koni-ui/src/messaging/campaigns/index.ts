// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestCampaignBannerComplete } from '@subwallet/extension-base/background/KoniTypes';

import { sendMessage } from '../base';

export async function completeBannerCampaign (request: RequestCampaignBannerComplete): Promise<boolean> {
  return sendMessage('pri(campaign.banner.complete)', request);
}
