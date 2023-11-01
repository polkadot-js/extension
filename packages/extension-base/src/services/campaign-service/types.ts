// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CampaignAction, CampaignButton } from '@subwallet/extension-base/background/KoniTypes';

type Metadata = Record<string, any> | null;

interface _BannerData {
  id: number;
  alt: string;
  action: CampaignAction;
  metadata: Metadata;
  environments: string[];
  position: string[];
  buttons: CampaignButton[];
  media: string;
}

interface _NotificationData {
  id: number;
  title: string;
  message: string;
  repeat: number;
  repeatAfter: number;
  action: CampaignAction;
  metadata: Metadata;
  buttons: CampaignButton[];
}

interface _CampaignData {
  id: number;
  name: string;
  description: null;
  start_time: string;
  end_time: string;
  condition: Metadata;
  banners: _BannerData[];
  notifications: _NotificationData[];
}

export type ListCampaignResponse = _CampaignData[]
