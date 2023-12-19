// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { ORDINAL_COLLECTION, ORDINAL_METHODS } from '@subwallet/extension-base/constants';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';
import { fetchEventRemarkExtrinsic, fetchExtrinsicParams } from '@subwallet/extension-base/koni/api/nft/ordinal_nft/utils';
import { OrdinalRemarkData } from '@subwallet/extension-base/types';

export default class OrdinalNftApi extends BaseNftApi {
  subscanChain: string;

  constructor (addresses: string[], chain: string, subscanChain: string) {
    super(chain, undefined, addresses);
    this.subscanChain = subscanChain;
  }

  public async handleNft (address: string, handleNftParams: HandleNftParams) {
    const extrinsics = await fetchEventRemarkExtrinsic(this.subscanChain, address);

    if (extrinsics && extrinsics.length) {
      const extrinsicIds = extrinsics.map((data) => data.extrinsic_index);
      const extrinsicParams = await fetchExtrinsicParams(this.subscanChain, extrinsicIds);
      const items: NftItem[] = [];

      for (const data of extrinsicParams) {
        const { extrinsic_index: extrinsicIndex, params } = data;

        const extrinsic = extrinsics.find((item) => item.extrinsic_index === extrinsicIndex);

        if (params.length === 1 && extrinsic) {
          const [param] = params;

          if (param.name === 'remark') {
            const ordinalData = JSON.parse(param.value) as OrdinalRemarkData;

            if ('p' in ordinalData) {
              if (ORDINAL_METHODS.includes(ordinalData.p)) {
                const properties: Record<string, { value: any }> = {};

                for (const [key, value] of Object.entries(ordinalData)) {
                  properties[key] = { value: value as unknown };
                }

                properties['Block number'] = { value: extrinsic.block_num };
                properties.Date = { value: extrinsic.block_timestamp };

                const name = [ordinalData.tick, ordinalData.op, ordinalData.p].join('_');

                items.push({
                  chain: this.chain,
                  collectionId: ORDINAL_COLLECTION,
                  id: extrinsic.extrinsic_hash,
                  description: JSON.stringify(ordinalData),
                  name,
                  owner: address,
                  properties: properties
                });
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
