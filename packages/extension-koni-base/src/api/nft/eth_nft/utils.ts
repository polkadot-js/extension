// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

enum MOONBEAM_NFT_CONTRACT_NAME {
  MOON_MONKEY = 'Moon Monkeys',
  MOON_DAO_NFT = 'MoonDAONFT',
  GLIMMER_APES = 'GlimmerApes',
  GLIMMER_JUNGLE = 'GlimmerJungle',
  MOONBEAM_BAYC = 'Moonbeam BAYC',
  MONKEY_BOTS_CULT = 'MonkeyBotsCult',
  BLOCKCHAIN_MONSTER = 'Blockchain Monster',
  DEDE_THE_KING = 'DEDE the king!',
  MOONBEAM_PUNKS = 'Moonbeam Punks',
  MOON_CITY = 'MoonCity',
  THE_FLIGHTERS = 'The Flighters',
  GLMR_PUNKS = 'GlmrPunks',
  MOONBEAM_ZUKI = 'MoonbeamZuki',
  HAMSTERS_GANG = 'Hamsters Gang',
  GLIMMER_KONGS_CLUB = 'GlimmerKongsClub',
  BORED_PUPPET_YACHT_CLUB = 'Bored Puppet Yacht Club',
  MOONBEAM_NAME_SERVICE = 'Moonbeam Name Service (.moon)',
  test = 'test'
}

export const MOONBEAM_SUPPORTED_NFT_CONTRACTS = [
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.MOON_MONKEY,
    smartContract: '0xCc1A7573C8f10d0df7Ee4d57cc958C8Df4a5Aca9'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.MOON_DAO_NFT,
    smartContract: '0xc6342EAB8B7cC405Fc35ebA7F7401fc400aC0709'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.GLIMMER_APES,
    smartContract: '0x8fbe243d898e7c88a6724bb9eb13d746614d23d6'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.GLIMMER_JUNGLE,
    smartContract: '0xcB13945Ca8104f813992e4315F8fFeFE64ac49cA'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.MONKEY_BOTS_CULT,
    smartContract: '0x47B261a3DF3EBD6B36092Ac551Ce1B44F0e477b9'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.DEDE_THE_KING,
    smartContract: '0xedf4Bc150153623672f981c4D612Bbe427cE7d2d'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.MOONBEAM_PUNKS,
    smartContract: '0xFD86D63748a6390E4a80739e776463088811774D'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.MOON_CITY,
    smartContract: '0x7cDc5D0188733eDF08412EECb9AFa840772615dC'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.THE_FLIGHTERS,
    smartContract: '0xF786d99c00EA512e1a8dD41aa99488B819a992D8'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.GLMR_PUNKS,
    smartContract: '0x25714FcBc4bE731B95AE86483EF97ef6C3deB5Ce'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.MOONBEAM_ZUKI,
    smartContract: '0xC36D971c11CEbbCc20eE2C2910e07e2b1Be3790d'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.HAMSTERS_GANG,
    smartContract: '0xD105E0da7fDc86192469654FB565c2f584920DA0'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.GLIMMER_KONGS_CLUB,
    smartContract: '0x62E413D4b097b474999CF33d336cD74881084ba5'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.BORED_PUPPET_YACHT_CLUB,
    smartContract: '0xd364fB95989F5A47dDb9665149DD750782d37c7f'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.MOONBEAM_NAME_SERVICE,
    smartContract: '0x9576167Eb03141F041ccAf57D4D0bd40Abb2b583'
  },
  {
    name: MOONBEAM_NFT_CONTRACT_NAME.MOONBEAM_BAYC,
    smartContract: '0x15380599b39A020378146C0714D628f14731F0A6'
  }
  // {
  //   name: MOONBEAM_NFT_CONTRACT_NAME.test,
  //   smartContract: '0x2953ea6f45fb189f1d33820d67c001ba287f6419'
  // },
  // {
  //   name: NFT_CONTRACT_NAME.BLOCKCHAIN_MONSTER,
  //   smartContract: '0x1759F2d7D3D1341081B3d7c19aFc5BDA503c8Dc5'
  // },
];

enum MOONRIVER_NFT_CONTRACT_NAME {
  ZOOMBIES = 'Zoombies',
  TREASURE_LAND = 'treasureland.dego',
  CRYPTO_DATE = 'CryptoDate',
  PUPAZZI_PUNK_SALVATION = 'Pupazzi Punk Salvation',
  NEXT_GEM = 'NextGem'
}

export const MOONRIVER_SUPPORTED_NFT_CONTRACTS = [
  {
    name: MOONRIVER_NFT_CONTRACT_NAME.ZOOMBIES,
    smartContract: '0x08716e418e68564C96b68192E985762740728018'
  },
  {
    name: MOONRIVER_NFT_CONTRACT_NAME.CRYPTO_DATE,
    smartContract: '0xA5c4C04DAa2Ef87BFb34A064c0bc1f92C851d843'
  },
  {
    name: MOONRIVER_NFT_CONTRACT_NAME.PUPAZZI_PUNK_SALVATION,
    smartContract: '0xca9F9521011Ce7846E3Efcdb9b1f551c223C9400'
  }
];

enum ASTAR_NFT_CONTRACT_NAME {
  ASTAR_PUNKS = 'Astar Punks',
  KONGZ_OF_ASTAR = 'Kongz Of Astar (KONGz)'
}

export const ASTAR_SUPPORTED_NFT_CONTRACTS = [
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTAR_PUNKS,
    smartContract: '0x1b57C69838cDbC59c8236DDa73287a4780B4831F'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.KONGZ_OF_ASTAR,
    smartContract: '0xD4d23b6A848de0e43910D4edaA414254A8B569e3'
  }
];

export interface ContractInfo {
  name: string,
  smartContract: string
}
