// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { VersionCampaign } from '@subwallet/extension-base/background/KoniTypes';
import { EventService } from '@subwallet/extension-base/services/event-service';
import NotificationService from '@subwallet/extension-base/services/notification-service/NotificationService';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';

import { runCampaignVersion1 } from './helpers';

export default class CampaignService {
  #dbService: DatabaseService;
  #notificationService: NotificationService;
  #eventService: EventService;

  constructor (dbService: DatabaseService, notificationService: NotificationService, eventService: EventService) {
    this.#dbService = dbService;
    this.#notificationService = notificationService;
    this.#eventService = eventService;

    this.runCampaign()
      .catch((e) => {
        console.error('Error on running campaigns', e);
      });
  }

  private async runCampaign () {
    await this.#eventService.waitMigrateReady;

    const campaigns = await this.getProcessingCampaign();

    campaigns.forEach((campaign) => {
      const { version } = campaign;

      switch (version) {
        case VersionCampaign.V1: {
          const onComplete = () => {
            const slug = campaign.slug;

            this.completeCampaign(slug)
              .catch((e) => {
                console.error('Error when complete campaign', slug, e);
              });
          };

          runCampaignVersion1(this.#notificationService, campaign, onComplete);
          break;
        }

        default:
          throw new Error('Missing handle campaign');
      }
    });
  }

  public getProcessingCampaign () {
    return this.#dbService.getProcessingCampaign();
  }

  private async completeCampaign (slug: string) {
    const campaign = await this.#dbService.getCampaign(slug);

    if (campaign) {
      await this.#dbService.upsertCampaign({
        ...campaign,
        isDone: true
      });
    }
  }
}
