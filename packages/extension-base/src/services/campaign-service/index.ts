// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CampaignData, CampaignDataType, ShowCampaignPopupRequest } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { ListCampaignResponse } from '@subwallet/extension-base/services/campaign-service/types';
import { TARGET_ENV } from '@subwallet/extension-base/utils';
import { fetchStaticData } from '@subwallet/extension-base/utils/fetchStaticData';
import { BehaviorSubject } from 'rxjs';

import { runCampaign } from './helpers';

const targetEnvs = ['extension', 'mobile'];

export default class CampaignService {
  readonly #state: KoniState;
  private popupVisibilitySubject = new BehaviorSubject<ShowCampaignPopupRequest>({ value: true });
  constructor (state: KoniState) {
    this.#state = state;
  }

  public init () {
    if (targetEnvs.includes(TARGET_ENV)) {
      this.fetchCampaign()
        .catch((e) => {
          console.error('Error on fetch campaigns', e);
        });

      this.runCampaign()
        .catch((e) => {
          console.error('Error on run campaigns', e);
        });
    }
  }

  private async fetchCampaign () {
    const respData = await fetchStaticData<ListCampaignResponse>('marketing-campaigns');

    const campaigns: CampaignData[] = [];

    for (const data of respData) {
      // eslint-disable-next-line camelcase
      const { condition, end_time, id: campaignId, start_time } = data;

      const endTime = new Date(end_time).getTime();
      const startTime = new Date(start_time).getTime();

      for (const banner of data.banners) {
        const { buttons, id, ...baseData } = banner;

        const slug = `${campaignId}-banner-${id}`;

        if (banner.environments.includes(TARGET_ENV)) {
          campaigns.push({
            slug,
            endTime,
            startTime,
            isDone: false,
            isArchive: false,
            campaignId,
            type: CampaignDataType.BANNER,
            buttons,
            data: baseData,
            condition
          });
        }
      }

      for (const notification of data.notifications) {
        const { buttons, id, ...baseData } = notification;

        const slug = `${campaignId}-notification-${id}`;

        campaigns.push({
          slug,
          endTime,
          startTime,
          isDone: false,
          isArchive: false,
          campaignId,
          type: CampaignDataType.NOTIFICATION,
          buttons,
          data: baseData,
          condition
        });
      }
    }

    for (const campaign of campaigns) {
      const exists = await this.#state.dbService.getCampaign(campaign.slug);

      if (!exists) {
        await this.#state.dbService.upsertCampaign(campaign);
      } else {
        const data: CampaignData = {
          ...campaign,
          isDone: exists.isDone
        };

        await this.#state.dbService.upsertCampaign(data);
      }
    }

    const allCampaign = await this.#state.dbService.getAllCampaign();

    for (const stored of allCampaign) {
      const exists = campaigns.find((campaign) => campaign.slug === stored.slug);

      if (!exists) {
        const data: CampaignData = {
          ...stored,
          isArchive: true
        };

        await this.#state.dbService.upsertCampaign(data);
      }
    }

    this.#state.eventService.emit('campaign.ready', true);
  }

  public getIsPopupVisible () {
    return this.popupVisibilitySubject.value;
  }

  public toggleCampaignPopup (value: ShowCampaignPopupRequest) {
    this.popupVisibilitySubject.next(value);
  }

  public subscribeCampaignPopupVisibility () {
    return this.popupVisibilitySubject;
  }

  private async runCampaign () {
    await this.#state.eventService.waitCampaignReady;

    const campaigns = (await this.getProcessingCampaign()).filter((data) => data.type === CampaignDataType.NOTIFICATION);

    campaigns.forEach((campaign) => {
      const { isDone, slug, type } = campaign;

      if (isDone) {
        return;
      }

      const onComplete = () => {
        this.completeCampaignNotification(slug)
          .catch((e) => {
            console.error('Error when complete campaign', slug, e);
          });
      };

      try {
        switch (type) {
          case CampaignDataType.NOTIFICATION: {
            runCampaign(this.#state.notificationService, campaign);
            onComplete();
            break;
          }

          default:
            throw new Error('Missing handle campaign');
        }
      } catch (e) {
        console.error('Error on running campaigns', slug, e);
      }
    });
  }

  public getProcessingCampaign () {
    return this.#state.dbService.getProcessingCampaign();
  }

  public subscribeProcessingCampaign () {
    return this.#state.dbService.subscribeProcessingCampaign();
  }

  private async completeCampaignNotification (slug: string) {
    const campaign = await this.#state.dbService.getCampaign(slug);

    if (campaign) {
      await this.#state.dbService.upsertCampaign({
        ...campaign,
        isDone: true
      });
    }
  }

  public stop () {
    this.toggleCampaignPopup({ value: true });
  }
}
