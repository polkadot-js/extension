// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { SUPPORTED_TRANSFER_CHAIN_NAME } from '@polkadot/extension-koni-ui/Popup/Home/Nfts/types';

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
  if (!nftItem.rmrk_ver) {
    return {};
  }

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

function web3Parser (nftItem: NftItem) {
  const contractAddress = nftItem.collectionId as string;
  const tokenId = parseInt(nftItem.id as string);

  return {
    contractAddress,
    tokenId
  };
}

export default function paramsHandler (nftItem: NftItem, networkKey: string) {
  switch (networkKey) {
    case SUPPORTED_TRANSFER_CHAIN_NAME.acala:
      return acalaParser(nftItem);
    case SUPPORTED_TRANSFER_CHAIN_NAME.karura:
      return acalaParser(nftItem);
    case SUPPORTED_TRANSFER_CHAIN_NAME.kusama:
      return rmrkParser(nftItem);
    case SUPPORTED_TRANSFER_CHAIN_NAME.uniqueNft:
      return uniqueParser(nftItem);
    case SUPPORTED_TRANSFER_CHAIN_NAME.quartz:
      return uniqueParser(nftItem);
    case SUPPORTED_TRANSFER_CHAIN_NAME.opal:
      return uniqueParser(nftItem);
    case SUPPORTED_TRANSFER_CHAIN_NAME.statemine:
      return statemineParser(nftItem);
    case SUPPORTED_TRANSFER_CHAIN_NAME.statemint:
      return statemineParser(nftItem);
    case SUPPORTED_TRANSFER_CHAIN_NAME.moonriver:
      return web3Parser(nftItem);
    case SUPPORTED_TRANSFER_CHAIN_NAME.moonbeam:
      return web3Parser(nftItem);
    case SUPPORTED_TRANSFER_CHAIN_NAME.moonbase:
      return web3Parser(nftItem);
    case SUPPORTED_TRANSFER_CHAIN_NAME.bitcountry:
      return acalaParser(nftItem);
  }

  return {};
}
