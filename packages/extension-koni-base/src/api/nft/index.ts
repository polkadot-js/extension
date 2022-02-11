// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftJson } from '@polkadot/extension-base/background/KoniTypes';
import { handleAcalaNfts } from '@polkadot/extension-koni-base/api/nft/acala_nft';
import { handleKaruraNfts } from '@polkadot/extension-koni-base/api/nft/karura_nft';
import { handleRmrkNfts } from '@polkadot/extension-koni-base/api/nft/rmrk_nft';
import { handleStatemineNfts } from '@polkadot/extension-koni-base/api/nft/statemine_nft';
import { handleUniqueNfts } from '@polkadot/extension-koni-base/api/nft/unique_nft';
import { reformatAddress } from '@polkadot/extension-koni-base/utils/utils';

export const getAllNftsByAccount = async (account: string): Promise<NftJson> => {
  try {
    const kusamaAddress = reformatAddress(account, 2);
    const _rmrkNfts = handleRmrkNfts(kusamaAddress);

    const _uniqueNfts = handleUniqueNfts(account);

    const _statemineNfts = handleStatemineNfts(account);

    const _karuraNfts = handleKaruraNfts(account);

    const _acalaNfts = handleAcalaNfts(account);

    const [rmrkNfts, uniqueNfts, statemineNfts, karuraNfts, acalaNfts] = await Promise.all([
      _rmrkNfts,
      _uniqueNfts,
      _statemineNfts,
      _karuraNfts,
      _acalaNfts
    ]);

    const total = rmrkNfts.total + uniqueNfts.total + statemineNfts.total + karuraNfts.total + acalaNfts.total;
    const allCollections = [
      ...rmrkNfts.allCollections,
      ...uniqueNfts.allCollections,
      ...statemineNfts.allCollections,
      ...karuraNfts.allCollections,
      ...acalaNfts.allCollections
    ];

    // const [statemineNfts] = await Promise.all([_statemineNfts]);
    // let total = statemineNfts.total;
    // let allCollections = [...statemineNfts.allCollections]
    console.log(`Fetched ${total} nfts from api for account ${account}`);

    return {
      total,
      nftList: allCollections
    } as NftJson;
  } catch (e) {
    console.error('Failed to fetch nft from api', e);
    throw e;
  }
};
