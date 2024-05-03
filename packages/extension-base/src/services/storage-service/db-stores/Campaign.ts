// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ICampaign } from '@subwallet/extension-base/services/storage-service/databases';
import BaseStore from '@subwallet/extension-base/services/storage-service/db-stores/BaseStore';
import { liveQuery } from 'dexie';

const filterProcessing = (campaign: ICampaign): boolean => {
  const now = new Date().getTime();
  const isExpired = now <= campaign.startTime || now >= campaign.endTime;

  return !(campaign.isArchive || campaign.isDone || isExpired);
};

const getId = (campaign: ICampaign): number => {
  return campaign.campaignId;
};

const sortById = (a: ICampaign, b: ICampaign): number => {
  return getId(a) - getId(b);
};

export default class CampaignStore extends BaseStore<ICampaign> {
  async getAll () {
    return this.table.toArray();
  }

  async getCampaign (slug: string) {
    return this.table.get(slug);
  }

  async getProcessingCampaign () {
    return (await this.table.toArray()).filter(filterProcessing).sort(sortById);
  }

  subscribeProcessingCampaign () {
    return liveQuery(
      async () => (await this.table.filter(filterProcessing).toArray()).sort(sortById)
    );
  }

  upsertCampaign (campaign: ICampaign) {
    return this.table.put(campaign);
  }
}
