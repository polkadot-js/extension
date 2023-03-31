// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import State from '@subwallet/extension-base/koni/background/handlers/State';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

import MigrationScripts from './scripts';

export default class MigrationService {
  readonly state: State;
  private logger: Logger;

  constructor (state: State) {
    this.state = state;
    this.logger = createLogger('Migration');
  }

  public async run (): Promise<void> {
    this.logger.log('Migrating...');
    const keys = Object.keys(MigrationScripts).sort((a, b) => a.localeCompare(b));

    try {
      for (let i = 0; i < keys.length; i++) {
        const JobClass = MigrationScripts[keys[i]];

        const check = await this.state.dbService.stores.migration.table.where({
          name: JobClass.name,
          key: keys[i]
        }).first();

        if (!check) {
          const job = new JobClass(this.state);

          this.logger.log('Running script: ', JobClass.name);
          await job.run();
          await this.state.dbService.stores.migration.table.put({
            key: keys[i],
            name: JobClass.name,
            timestamp: +new Date()
          });
        }
      }
    } catch (error) {
      this.logger.warn('Migration error: ', error);
    }

    this.logger.log('Migration done.');
  }
}
