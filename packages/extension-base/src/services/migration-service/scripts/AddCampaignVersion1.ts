// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { VersionCampaign } from '@subwallet/extension-base/background/KoniTypes';
import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

export default abstract class AddCampaignVersion1 extends BaseMigrationJob {
  abstract slug: string;
  abstract title: string;
  abstract message: string;
  abstract okText: string;
  abstract url: string;

  public override async run (): Promise<void> {
    await this.state.dbService.upsertCampaign({
      slug: this.slug,
      version: VersionCampaign.V1,
      isDone: false,
      isExpired: false,
      data: {
        url: this.url,
        title: this.title,
        message: this.message,
        okText: this.okText
      }
    });
  }
}
