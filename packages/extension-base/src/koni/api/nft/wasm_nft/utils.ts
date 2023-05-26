// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const A0_ART_ZERO_TESTNET_IMAGE_API = 'https://a0-test-api.artzero.io/getImage';

export const ASTAR_ART_ZERO_TESTNET_IMAGE_API = 'https://astar-test-api.artzero.io/getImage';

export const ART_ZERO_TESTNET_IPFS_API = 'https://a0-test-api.artzero.io/getJSON';

export const ASTAR_ART_ZERO_TESTNET_IPFS_API = 'https://astar-test-api.artzero.io/getJSON';

export const A0_ART_ZERO_TESTNET_COLLECTION_API = 'https://a0-test-api.artzero.io/getCollectionByAddress';

export const ASTAR_ART_ZERO_TESTNET_COLLECTION_API = 'https://astar-test-api.artzero.io/getCollectionByAddress';

export const A0_ART_ZERO_IMAGE_API = 'https://a0-api.artzero.io/getImage';

export const ASTAR_ART_ZERO_IMAGE_API = 'https://astar-api.artzero.io/getImage';

export const A0_ART_ZERO_IPFS_API = 'https://a0-api.artzero.io/getJSON';

export const ASTAR_ART_ZERO_IPFS_API = 'https://astar-api.artzero.io/getJSON';

export const A0_ART_ZERO_COLLECTION_API = 'https://a0-api.artzero.io/getCollectionByAddress';

export const ASTAR_ART_ZERO_COLLECTION_API = 'https://astar-api.artzero.io/getCollectionByAddress';

export const A0_ART_ZERO_EXTERNAL_URL = 'https://a0.artzero.io/#/marketplace';

export const ASTAR_ART_ZERO_EXTERNAL_URL = 'https://astar.artzero.io/#/marketplace';

export function collectionApiFromArtZero (chain: string) {
  if (chain === 'alephTest') {
    return A0_ART_ZERO_TESTNET_COLLECTION_API;
  }

  if (chain === 'astar') {
    return ASTAR_ART_ZERO_COLLECTION_API;
  }

  return A0_ART_ZERO_COLLECTION_API;
}

export function itemImageApiFromArtZero (chain: string) {
  if (chain === 'alephTest') {
    return A0_ART_ZERO_TESTNET_IMAGE_API;
  }

  if (chain === 'astar') {
    return ASTAR_ART_ZERO_IMAGE_API;
  }

  return A0_ART_ZERO_IMAGE_API;
}

export function collectionDetailApiFromArtZero (chain: string) {
  if (chain === 'alephTest') {
    return A0_ART_ZERO_TESTNET_COLLECTION_API;
  }

  if (chain === 'astar') {
    return ASTAR_ART_ZERO_COLLECTION_API;
  }

  return A0_ART_ZERO_COLLECTION_API;
}

export function ipfsApiFromArtZero (chain: string) {
  if (chain === 'alephTest') {
    return ART_ZERO_TESTNET_IPFS_API;
  }

  if (chain === 'astar') {
    return ASTAR_ART_ZERO_IPFS_API;
  }

  return A0_ART_ZERO_IPFS_API;
}

export function externalUrlOnArtZero (chain: string) {
  if (chain === 'astar') {
    return ASTAR_ART_ZERO_EXTERNAL_URL;
  }

  return A0_ART_ZERO_EXTERNAL_URL;
}
