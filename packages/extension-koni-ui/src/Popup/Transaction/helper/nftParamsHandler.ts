// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType } from '@subwallet/chain-list/types';
import { NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { _NFT_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';

const RMRK_PREFIX = 'RMRK';
const RMRK_OP_TYPE = 'SEND';

function acalaParser (nftItem: NftItem) {
  const collectionId = parseInt(nftItem.collectionId);
  const itemId = parseInt(nftItem.id);

  return {
    collectionId,
    itemId,
    networkKey: nftItem.chain
  };
}

function rmrkParser (nftItem: NftItem) {
  if (!nftItem.rmrk_ver) {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const remark = `${RMRK_PREFIX}::${RMRK_OP_TYPE}::${nftItem.rmrk_ver}::${nftItem.id}::`;

  return {
    remark,
    networkKey: nftItem.chain
  };
}

function uniqueParser (nftItem: NftItem) {
  const collectionId = parseInt(nftItem.collectionId);
  const itemId = parseInt(nftItem.id);

  return {
    collectionId,
    itemId,
    networkKey: nftItem.chain
  };
}

function statemineParser (nftItem: NftItem) {
  const collectionId = parseInt(nftItem.collectionId);
  const itemId = parseInt(nftItem.id);

  return {
    collectionId,
    itemId,
    networkKey: nftItem.chain,
    assetHubType: nftItem.assetHubType
  };
}

function web3Parser (nftItem: NftItem) {
  const contractAddress = nftItem.collectionId;
  const tokenId = parseInt(nftItem.id);

  return {
    contractAddress,
    tokenId
  };
}

function psp34Parser (nftItem: NftItem) {
  const contractAddress = nftItem.collectionId;
  const onChainOption = nftItem.onChainOption as Record<string, string>;

  return {
    contractAddress,
    onChainOption,
    isPsp34: true,
    networkKey: nftItem.chain
  };
}

function varaParser (nftItem: NftItem) {
  const contractAddress = nftItem.collectionId;
  const tokenId = nftItem.id;

  return {
    contractAddress,
    tokenId,
    networkKey: nftItem.chain
  };
}

export default function nftParamsHandler (nftItem: NftItem, chain: string) {
  if (nftItem.type === _AssetType.ERC721) {
    return web3Parser(nftItem);
  } else if (nftItem.type === _AssetType.PSP34) {
    return psp34Parser(nftItem);
  } else {
    if (_NFT_CHAIN_GROUP.acala.includes(chain) || _NFT_CHAIN_GROUP.karura.includes(chain) || _NFT_CHAIN_GROUP.bitcountry.includes(chain)) {
      return acalaParser(nftItem);
    } else if (_NFT_CHAIN_GROUP.rmrk.includes(chain)) {
      return rmrkParser(nftItem);
    } else if (_NFT_CHAIN_GROUP.statemine.includes(chain) || _NFT_CHAIN_GROUP.statemint.includes(chain)) {
      return statemineParser(nftItem);
    } else if (_NFT_CHAIN_GROUP.unique_network.includes(chain)) {
      return uniqueParser(nftItem);
    } else if (_NFT_CHAIN_GROUP.vara.includes(chain)) {
      return varaParser(nftItem);
    }
  }

  return {
    networkKey: nftItem.chain
  };
}
