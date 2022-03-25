// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftItem } from '@polkadot/extension-base/background/KoniTypes';

const RMRK_PREFIX = 'RMRK';
const RMRK_OP_TYPE = 'SEND';

function acalaParser (nftItem: NftItem) {
  const collectionId = parseInt(nftItem.collectionId as string);
  const itemId = parseInt(nftItem.id as string);

  return {
    collectionId,
    itemId
  };
}

function rmrkParser (nftItem: NftItem) {
  if (!nftItem.rmrk_ver) return {};

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const remark = `${RMRK_PREFIX}::${RMRK_OP_TYPE}::${nftItem.rmrk_ver}::${nftItem.id}::`;

  return { remark };
}

function uniqueParser (nftItem: NftItem) {
  const collectionId = parseInt(nftItem.collectionId as string);
  const itemId = parseInt(nftItem.id as string);

  return {
    collectionId,
    itemId
  };
}

function statemineParser (nftItem: NftItem) {
  const collectionId = parseInt(nftItem.collectionId as string);
  const itemId = parseInt(nftItem.id as string);

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
    case 'kusama':
      return rmrkParser(nftItem);
    case 'uniqueNft':
      return uniqueParser(nftItem);
    case 'quartz':
      return uniqueParser(nftItem);
    case 'opal':
      return uniqueParser(nftItem);
    case 'statemine':
      return statemineParser(nftItem);
    case 'statemint':
      return statemineParser(nftItem);
  }

  return {};
}
