// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomEvmToken } from '@polkadot/extension-base/background/KoniTypes';

export const SINGULAR_V1_ENDPOINT = 'https://singular.rmrk.app/api/rmrk1/account/';

export const SINGULAR_V2_ENDPOINT = 'https://singular.app/api/rmrk2/account/';

export const KANARIA_ENDPOINT = 'https://kanaria.rmrk.app/api/rmrk2/';

export const RMRK_PINATA_SERVER = 'https://rmrk.mypinata.cloud/ipfs/';

export const SINGULAR_V1_COLLECTION_ENDPOINT = 'https://singular.rmrk.app/api/rmrk1/collection/';

export const SINGULAR_V2_COLLECTION_ENDPOINT = 'https://singular.app/api/rmrk2/collection/';

export const SINGULAR_V1_EXTERNAL_SERVER = 'https://singular.rmrk.app/collectibles/';

export const SINGULAR_V2_EXTERNAL_SERVER = 'https://singular.app/collectibles/';

export const KANARIA_EXTERNAL_SERVER = 'https://kanaria.rmrk.app/catalogue/';

export const CLOUDFLARE_SERVER = 'https://cloudflare-ipfs.com/ipfs/';

export const BIT_COUNTRY_SERVER = 'https://ipfs-cdn.bit.country/';

export const CF_IPFS_GATEWAY = 'https://cf-ipfs.com/ipfs/';

export enum SUPPORTED_NFT_NETWORKS {
  karura = 'karura',
  acala = 'acala',
  rmrk = 'rmrk',
  statemine = 'statemine',
  uniqueNft = 'uniqueNft',
  quartz = 'quartz',
  bitcountry = 'bitcountry',
  moonbeam = 'moonbeam',
  moonriver = 'moonriver',
  moonbase = 'moonbase',
  astarEvm = 'astarEvm',
}

export enum SUPPORTED_TRANSFER_CHAIN_NAME {
  moonbeam = 'moonbeam',
  moonbase = 'moonbase',
  astarEvm = 'astarEvm',
  moonriver = 'moonriver',
  shiden = 'shiden',
  shibuya = 'shibuya'
}

export const SUPPORTED_TRANSFER_EVM_CHAIN = [
  SUPPORTED_TRANSFER_CHAIN_NAME.moonbase as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.moonbeam as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.moonriver as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.astarEvm as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.shiden as string,
  SUPPORTED_TRANSFER_CHAIN_NAME.shibuya as string
];

export const TRANSFER_CHAIN_ID = {
  [SUPPORTED_TRANSFER_CHAIN_NAME.moonbase as string]: 1287,
  [SUPPORTED_TRANSFER_CHAIN_NAME.moonbeam as string]: 1284,
  [SUPPORTED_TRANSFER_CHAIN_NAME.moonriver as string]: 1285,
  [SUPPORTED_TRANSFER_CHAIN_NAME.astarEvm as string]: 592,
  [SUPPORTED_TRANSFER_CHAIN_NAME.shiden as string]: 336,
  [SUPPORTED_TRANSFER_CHAIN_NAME.shibuya as string]: 81
};

export interface EvmContracts {
  astarEvm: CustomEvmToken[];
  moonbeam: CustomEvmToken[];
  moonriver: CustomEvmToken[];
  moonbase: CustomEvmToken[];
}
