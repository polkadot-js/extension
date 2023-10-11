// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { detectTranslate } from '@subwallet/extension-base/utils';

import AddCampaignVersion1 from './AddCampaignVersion1';

export default class AddDotCrowdloanCampaign extends AddCampaignVersion1 {
  slug = 'dot-unlock-crowdloan';
  title = detectTranslate('Crowdloan Batch 1 is unlocking on 24 Oct');
  message = detectTranslate('Join the Crowdloan Unlock Party at SubWallet Web Dashboard with top 6 DeFi protocols to earn exclusive rewards');
  okText = detectTranslate('Join now');
  url = 'https://web.subwallet.app/earning-demo';
}
