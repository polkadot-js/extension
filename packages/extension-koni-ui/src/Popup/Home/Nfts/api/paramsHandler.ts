// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NFT } from 'rmrk-tools';

import { NftItem } from '@polkadot/extension-base/background/KoniTypes';

function acalaParser (nftItem: NftItem) {
  const collectionId = parseInt(nftItem.collectionId as string);
  const itemId = parseInt(nftItem.id);

  return {
    collectionId,
    itemId
  };
}

function rmrkParser (nftItem: NftItem) {
  const metaSplit = nftItem.id.split('-');
  const block = parseInt(metaSplit[0]);
  const sn = metaSplit[metaSplit.length - 1];
  const symbol = metaSplit[metaSplit.length - 2];

  const nft = new NFT({
    block,
    collection: nftItem.collectionId as string,
    symbol,
    transferable: nftItem?.rmrk_transferable as number,
    sn
  });

  return { nft };
}

function uniqueParser (nftItem: NftItem) {
  const collectionId = parseInt(nftItem.collectionId as string);
  const itemId = parseInt(nftItem.id);

  return {
    collectionId,
    itemId
  };
}

export default function paramsHandler (nftItem: NftItem, networkKey: string) {
  switch (networkKey) {
    case 'acala':
      return acalaParser(nftItem);
    case 'karura':
      return acalaParser(nftItem);
    case 'rmrk':
      return rmrkParser(nftItem);
    case 'uniqueNft':
      return uniqueParser(nftItem);
    case 'quartz':
      return uniqueParser(nftItem);
    case 'opal':
      return uniqueParser(nftItem);
  }

  return {};
}
