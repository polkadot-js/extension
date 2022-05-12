// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
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

export const MOONBASE_SUPPORTED_NFT_CONTRACTS = [
  {
    name: 'test',
    smartContract: '0x2953ea6f45fb189f1d33820d67c001ba287f6419'
  }
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
  KONGZ_OF_ASTAR = 'Kongz Of Astar (KONGz)',
  ASTAR_DEGENS = 'AstarDegens',
  SFY_STICKYFACTORY = 'Cyberbeast',
  ASTARIANS = 'Astarians',
  ASTAR_BOTS = 'AstarBots',
  ASTAR_ZODIAC = 'Astar Zodiac collection',
  ASTAR_KEVIN = 'Astar Kevin',
  ASTAR_GHOST = 'AstarGhost',
  KANJI_ART = 'Kanji Art',
  ASTAR_BORED_APES = 'Astar Bored Apes',
  ASTAR_PUNK_X = 'Astar Punk X',
  ASTAR_INVISIBLE_FRIENDS = 'Astar Invisible Friends',
  ASTAR_METALION_KINGDOM = 'Astar MetaLion Kingdom',
  ASTAR_KARAFURU = 'Astar Karafuru',
  ASTARNAUT = 'Astarnaut',
  ASTAR_CATS = 'AstarCats'
}

export const ASTAR_SUPPORTED_NFT_CONTRACTS = [
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTAR_PUNKS,
    smartContract: '0x1b57C69838cDbC59c8236DDa73287a4780B4831F'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.KONGZ_OF_ASTAR,
    smartContract: '0xD4d23b6A848de0e43910D4edaA414254A8B569e3'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTAR_DEGENS,
    smartContract: '0xd59fc6bfd9732ab19b03664a45dc29b8421bda9a'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTARIANS,
    smartContract: '0xdf663a45d17fc3d669df586b8b9641c888a301dc'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTAR_BOTS,
    smartContract: '0x2af8a3eeab86545d6bb2f6bae7c4ab6b6d1141b8'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTAR_KEVIN,
    smartContract: '0xd311c9a8ff0d5045039a8723b20df36b42bd1554'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTAR_GHOST,
    smartContract: '0xb4bd85893d6f66869d7766ace1b1eb4d867d963e'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTAR_PUNK_X,
    smartContract: '0x5425948a8a83516D26C7081F2742De5767CFEEad'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTAR_INVISIBLE_FRIENDS,
    smartContract: '0xdf8567bf301ce9b29e284f4de585D8eE782b1158'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTAR_METALION_KINGDOM,
    smartContract: '0x43C8402f4Dd910D84f145E63Aa8E3e9A67963aB0'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTAR_KARAFURU,
    smartContract: '0x5D49B30986111f45d503fEAAFF7412Ec0f22C189'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTARNAUT,
    smartContract: '0xf008371a7EeD0AB54FDd975fE0d0f66fEFBA3415'
  },
  {
    name: ASTAR_NFT_CONTRACT_NAME.ASTAR_CATS,
    smartContract: '0x8b5d62f396Ca3C6cF19803234685e693733f9779'
  }
  // {
  //   name: ASTAR_NFT_CONTRACT_NAME.ASTAR_ZODIAC,
  //   smartContract: '0x2f23db7a79b256ab962b6ee409e5834341e675f5'
  // },
  // {
  //   name: ASTAR_NFT_CONTRACT_NAME.SFY_STICKYFACTORY,
  //   smartContract: '0x9b496b02fcc962f70e9bebb5d6c5131e300baf41'
  // },
  // {
  //   name: ASTAR_NFT_CONTRACT_NAME.KANJI_ART,
  //   smartContract: '0xda2a89940cb1afe44448299c0564b0d37a1b4609'
  // },
  // {
  //   name: ASTAR_NFT_CONTRACT_NAME.ASTAR_BORED_APES,
  //   smartContract: '0xc5f0b515a1712d0c7234d2361412eabb5061ea85'
  // }
  // {
  //   name: 'test',
  //   smartContract: '0xc61615DfF45BC2aB50BCE15fd190EBb913b852C9'
  // }
];

export interface ContractInfo {
  name: string,
  smartContract: string
}
