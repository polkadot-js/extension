// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MetadataDef } from '@polkadot/extension-inject/types';
import { MetadataRequest } from '../types';
import { IconOptions } from './types';

import { BehaviorSubject } from 'rxjs';
import { knownMetadata, addMetadata } from '@polkadot/extension-chains';

import { MetadataStore } from '../stores';
import { getId } from './util';

interface MetaRequest {
  id: string;
  request: MetadataDef;
  resolve: (result: boolean) => void;
  reject: (error: Error) => void;
  url: string;
}

export default class StateMetadata {
  public readonly subject: BehaviorSubject<MetadataRequest[]> = new BehaviorSubject<MetadataRequest[]>([]);

  readonly #requests: Record<string, MetaRequest> = {};

  readonly #store = new MetadataStore();

  readonly #updateIcon: (options?: IconOptions) => void;

  constructor (updateIcon: (options?: IconOptions) => void) {
    this.#updateIcon = updateIcon;
    this.#store.all((_key: string, def: MetadataDef): void => {
      addMetadata(def);
    });
  }

  public get allRequests (): MetadataRequest[] {
    return Object
      .values(this.#requests)
      .map(({ id, request, url }): MetadataRequest => ({ id, request, url }));
  }

  public get known (): MetadataDef[] {
    return knownMetadata();
  }

  public get numRequests (): number {
    return Object.keys(this.#requests).length;
  }

  private updateIcon (options?: IconOptions): void {
    this.subject.next(this.allRequests);
    this.#updateIcon(options);
  }

  private completeRequest = (id: string, fn: Function): (result: boolean | Error) => void => {
    return (result: boolean | Error): void => {
      delete this.#requests[id];
      this.updateIcon({ shouldClose: true });

      fn(result);
    };
  }

  public inject (url: string, request: MetadataDef): Promise<boolean> {
    return new Promise((resolve, reject): void => {
      const id = getId();

      this.#requests[id] = {
        id,
        reject: this.completeRequest(id, reject),
        request,
        resolve: this.completeRequest(id, resolve),
        url
      };

      this.updateIcon({ shouldOpen: true });
    });
  }

  public getRequest (id: string): MetaRequest {
    return this.#requests[id];
  }

  public save (meta: MetadataDef): void {
    this.#store.set(meta.genesisHash, meta);

    addMetadata(meta);
  }
}
