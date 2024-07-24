// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ALC_NFT_RAW_VALUE } from '@subwallet/extension-base/koni/api/nft/blobinscription/consts';

export interface NftResponse {
  data: {
    dataAvailabilities: NftData[]
  }
}

interface NftData {
  isJson: boolean,
  id: string,
  extrinsicHash: string,
  dataValue: string,
  dataRaw: string,
  sender: {
    address: string
  }
}

export interface ALC { // need confirm
  p: string,
  op: string,
  tick: string,
  imgUrl: string,
  name: string,
  traits: Record<string, any>
}

export interface RemarkData {
  data: {
    remarks: { dataRaw: string }[]
  }
}

export interface transferPayload {
  p: string,
  op: string,
  amount: string,
  tick: string,
  to: string
}

export function getNftDetail (nftSlug: string) {
  if (nftSlug === 'AVAIL-OG-sqsu5a91qbu0s4oj3ldg8lrf') { // Gold
    return JSON.parse(ALC_NFT_RAW_VALUE.GOLD) as ALC;
  }

  if (nftSlug === 'AVAIL-OG-zdttjyidincrjgsmwqbxoghz') { // Silver
    return JSON.parse(ALC_NFT_RAW_VALUE.SILVER) as ALC;
  }

  if (nftSlug === 'AVAIL-OG-zy0n66yqtgw6z139hnf5vdxb') { // Bronze
    return JSON.parse(ALC_NFT_RAW_VALUE.BRONZE) as ALC;
  }

  return undefined;
}
