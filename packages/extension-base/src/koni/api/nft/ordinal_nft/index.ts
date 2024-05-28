// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { ORDINAL_COLLECTION } from '@subwallet/extension-base/constants';
import { SubscanService } from '@subwallet/extension-base/services/subscan-service';
import { OrdinalRemarkData, SubscanBatchChild, SubscanBatchChildParam, SubscanEventBaseItemData, SubscanExtrinsicParam } from '@subwallet/extension-base/types';

import { BaseNftApi, HandleNftParams } from '../nft';

const parseParamData = (param: SubscanBatchChildParam, event: SubscanEventBaseItemData, chain: string, address: string): NftItem | undefined => {
  const ordinalData = JSON.parse(param.value) as OrdinalRemarkData;

  if ('p' in ordinalData) {
    const properties: Record<string, { value: any }> = {};

    for (const [key, value] of Object.entries(ordinalData)) {
      const _name = key.charAt(0).toUpperCase() + key.slice(1);

      properties[_name] = { value: value as unknown };
    }

    properties['Block number'] = { value: event.extrinsic_index.split('-')[0] };
    properties.Timestamp = { value: event.block_timestamp };

    const op = ordinalData.op.charAt(0).toUpperCase() + ordinalData.op.slice(1);

    const nameParams = [op];

    if (ordinalData.amt !== undefined) {
      nameParams.push(ordinalData.amt);
    }

    nameParams.push(ordinalData.tick);
    const name = nameParams.join(' ');

    return {
      chain: chain,
      collectionId: ORDINAL_COLLECTION,
      id: event.extrinsic_hash,
      description: JSON.stringify(ordinalData),
      name,
      owner: address,
      properties: properties
    };
  }

  return undefined;
};

export default class OrdinalNftApi extends BaseNftApi {
  subscanChain: string;
  subscanService: SubscanService;

  constructor (addresses: string[], chain: string, subscanChain: string) {
    super(chain, undefined, addresses);
    this.subscanChain = subscanChain;
    this.subscanService = SubscanService.getInstance();
  }

  public async handleNft (address: string, handleNftParams: HandleNftParams) {
    const events: SubscanEventBaseItemData[] = await this.subscanService.getAccountRemarkEvents(this.subscanChain, address);

    if (events && events.length) {
      const extrinsicIds = events.map((data) => data.extrinsic_index);
      const extrinsicParams: SubscanExtrinsicParam[] = await this.subscanService.getExtrinsicParams(this.subscanChain, extrinsicIds);
      const items: NftItem[] = [];

      for (const data of extrinsicParams) {
        const { extrinsic_index: extrinsicIndex, params } = data;

        const event = events.find((item) => item.extrinsic_index === extrinsicIndex);

        if (params.length === 1 && event) {
          const [param] = params;

          if (param.name === 'remark') {
            const childParam: SubscanBatchChildParam = {
              name: param.name,
              type: param.type,
              value: param.value as string
            };
            const item = parseParamData(childParam, event, this.chain, address);

            if (item) {
              items.push(item);
            }
          } else if (param.name === 'calls') {
            const children = param.value as SubscanBatchChild[];

            for (const child of children) {
              if (child.call_module === 'System' && child.call_name === 'remark_with_event') {
                for (const childParam of child.params) {
                  const item = parseParamData(childParam, event, this.chain, address);

                  if (item) {
                    items.push(item);
                  }
                }
              }
            }
          }
        }
      }

      if (items.length) {
        // handleNftParams.updateCollection(this.chain, {
        //   chain: this.chain,
        //   collectionId: ORDINAL_COLLECTION
        // });

        for (const item of items) {
          handleNftParams.updateItem(this.chain, item, address);
        }
      }
    }
  }

  public async handleNfts (params: HandleNftParams) {
    await Promise.all(this.addresses.map((address) => this.handleNft(address, params)));
  }

  public async fetchNfts (params: HandleNftParams): Promise<number> {
    try {
      await this.handleNfts(params);
    } catch (e) {
      return 0;
    }

    return 1;
  }
}
