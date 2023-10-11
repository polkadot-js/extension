// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import State from '@subwallet/extension-base/koni/background/handlers/State';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';
import { EventService } from '@subwallet/extension-base/services/event-service';

import MigrationScripts, { EVERYTIME } from './scripts';

export default class MigrationService {
  readonly state: State;
  private logger: Logger;
  #eventService: EventService;

  constructor (state: State, eventService: EventService) {
    this.state = state;
    this.#eventService = eventService;
    this.logger = createLogger('Migration');
  }

  public async run (): Promise<void> {
    const keys = Object.keys(MigrationScripts).sort((a, b) => a.localeCompare(b));

    for (let i = 0; i < keys.length; i++) {
      try {
        const JobClass = MigrationScripts[keys[i]];
        const key = keys[i];
        const name = JobClass.name;

        const check = await this.state.dbService.stores.migration.table.where({
          name,
          key
        }).first();

        if (!check || key.startsWith(EVERYTIME)) {
          const job = new JobClass(this.state);

          await job.run();
          await this.state.dbService.stores.migration.table.put({
            key,
            name,
            timestamp: new Date().getTime()
          });
        }
      } catch (error) {
        this.logger.error('Migration error: ', MigrationScripts[keys[i]].name, error);
      }
    }

    this.#eventService.emit('migration.done', true);
  }
}
