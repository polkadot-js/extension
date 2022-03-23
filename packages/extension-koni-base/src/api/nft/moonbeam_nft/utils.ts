// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

enum NFT_CONTRACT_NAME {
  MOON_MONKEY = 'MoonMonkey',
  MOON_DAO_NFT = 'MoonDAONFT',
  GLIMMER_APES = 'GlimmerApes',
  MOONBEAM_BAYC = 'MoonbeamBAYC'
}

export const SUPPORTED_NFT_CONTRACTS = [
  {
    name: NFT_CONTRACT_NAME.MOON_MONKEY,
    smartContract: '0xCc1A7573C8f10d0df7Ee4d57cc958C8Df4a5Aca9'
  },
  // {
  //   name: NFT_CONTRACT_NAME.MOON_DAO_NFT,
  //   smartContract: '0xc6342EAB8B7cC405Fc35ebA7F7401fc400aC0709'
  // },
  // {
  //   name: NFT_CONTRACT_NAME.GLIMMER_APES,
  //   smartContract: '0x8fbe243d898e7c88a6724bb9eb13d746614d23d6'
  // },
  // {
  //   name: NFT_CONTRACT_NAME.MOONBEAM_BAYC,
  //   smartContract: '0x15380599b39A020378146C0714D628f14731F0A6'
  // }
];
