// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmTokenJson } from '@subwallet/extension-base/background/KoniTypes';

export const DEFAULT_EVM_TOKENS: EvmTokenJson = {
  erc20: [],
  erc721: [
    {
      name: 'Moon Monkeys',
      smartContract: '0xCc1A7573C8f10d0df7Ee4d57cc958C8Df4a5Aca9',
      chain: 'moonbeam',
      type: 'erc721'
    },
    {
      name: 'MoonDAONFT',
      smartContract: '0xc6342EAB8B7cC405Fc35ebA7F7401fc400aC0709',
      chain: 'moonbeam',
      type: 'erc721'
    },
    {
      name: 'GlimmerApes',
      smartContract: '0x8fbe243d898e7c88a6724bb9eb13d746614d23d6',
      chain: 'moonbeam',
      type: 'erc721'
    },
    {
      name: 'GlimmerJungle',
      smartContract: '0xcB13945Ca8104f813992e4315F8fFeFE64ac49cA',
      chain: 'moonbeam',
      type: 'erc721'
    },
    {
      name: 'Moonbeam Punks',
      smartContract: '0xFD86D63748a6390E4a80739e776463088811774D',
      chain: 'moonbeam',
      type: 'erc721'
    },
    {
      name: 'GlmrPunks',
      smartContract: '0x25714FcBc4bE731B95AE86483EF97ef6C3deB5Ce',
      chain: 'moonbeam',
      type: 'erc721'
    },
    {
      name: 'MoonbeamZuki',
      smartContract: '0xC36D971c11CEbbCc20eE2C2910e07e2b1Be3790d',
      chain: 'moonbeam',
      type: 'erc721'
    },
    {
      name: 'GlimmerKongsClub',
      smartContract: '0x62E413D4b097b474999CF33d336cD74881084ba5',
      chain: 'moonbeam',
      type: 'erc721'
    },
    {
      name: 'Moonbeam Name Service (.moon)',
      smartContract: '0x9576167Eb03141F041ccAf57D4D0bd40Abb2b583',
      chain: 'moonbeam',
      type: 'erc721'
    },
    {
      name: 'Zoombies',
      smartContract: '0x08716e418e68564C96b68192E985762740728018',
      chain: 'moonriver',
      type: 'erc721'
    },
    {
      name: 'Moonriver NFT Quest',
      smartContract: '0x79c8C73F85ec794f570aa7B768568a7fEdB294f8',
      chain: 'moonriver',
      type: 'erc721'
    },
    {
      name: 'AstarGhost',
      smartContract: '0xb4bd85893d6f66869d7766ace1b1eb4d867d963e',
      chain: 'astarEvm',
      type: 'erc721'
    },
    {
      name: 'Astar Punks',
      smartContract: '0x1b57C69838cDbC59c8236DDa73287a4780B4831F',
      chain: 'astarEvm',
      type: 'erc721'
    },
    {
      name: 'AstarDegens',
      smartContract: '0xd59fc6bfd9732ab19b03664a45dc29b8421bda9a',
      chain: 'astarEvm',
      type: 'erc721'
    },
    {
      name: 'Astarnaut',
      smartContract: '0xf008371a7EeD0AB54FDd975fE0d0f66fEFBA3415',
      chain: 'astarEvm',
      type: 'erc721'
    },
    {
      name: 'AstarCats',
      smartContract: '0x8b5d62f396Ca3C6cF19803234685e693733f9779',
      chain: 'astarEvm',
      type: 'erc721'
    }
    // {
    //   name: 'AstarBots',
    //   smartContract: '0x2af8a3eeab86545d6bb2f6bae7c4ab6b6d1141b8',
    //   chain: 'astarEvm',
    //   type: 'erc721'
    // },
    // {
    //   name: 'Astar Invisible Friends',
    //   smartContract: '0xdf8567bf301ce9b29e284f4de585D8eE782b1158',
    //   chain: 'astarEvm',
    //   type: 'erc721'
    // },
    // {
    //   name: 'Astar Kevin',
    //   smartContract: '0xd311c9a8ff0d5045039a8723b20df36b42bd1554',
    //   chain: 'astarEvm',
    //   type: 'erc721'
    // },
    // {
    //   name: 'Moonbeam BAYC',
    //   smartContract: '0x47B261a3DF3EBD6B36092Ac551Ce1B44F0e477b9',
    //   chain: 'moonbeam',
    //   type: 'erc721'
    // },
    // {
    //   name: 'DEDE the king!',
    //   smartContract: '0xedf4Bc150153623672f981c4D612Bbe427cE7d2d',
    //   chain: 'moonbeam',
    //   type: 'erc721'
    // },
    // {
    //   name: 'MoonCity',
    //   smartContract: '0x7cDc5D0188733eDF08412EECb9AFa840772615dC',
    //   chain: 'moonbeam',
    //   type: 'erc721'
    // },
    // {
    //   name: 'Moonbeam BAYC',
    //   smartContract: '0x15380599b39A020378146C0714D628f14731F0A6',
    //   chain: 'moonbeam',
    //   type: 'erc721'
    // },
    // {
    //   name: 'Hamsters Gang',
    //   smartContract: '0xD105E0da7fDc86192469654FB565c2f584920DA0',
    //   chain: 'moonbeam',
    //   type: 'erc721'
    // },
    // {
    //   name: 'Bored Puppet Yacht Club',
    //   smartContract: '0xd364fB95989F5A47dDb9665149DD750782d37c7f',
    //   chain: 'moonbeam',
    //   type: 'erc721'
    // },
    // {
    //   name: 'Astar MetaLion Kingdom',
    //   smartContract: '0x43C8402f4Dd910D84f145E63Aa8E3e9A67963aB0',
    //   chain: 'astarEvm',
    //   type: 'erc721'
    // },
    // {
    //   name: 'Astar Punk X',
    //   smartContract: '0x5425948a8a83516D26C7081F2742De5767CFEEad',
    //   chain: 'astarEvm',
    //   type: 'erc721'
    // },
    // {
    //   name: 'Astar Karafuru',
    //   smartContract: '0x5D49B30986111f45d503fEAAFF7412Ec0f22C189',
    //   chain: 'astarEvm',
    //   type: 'erc721'
    // },
    // {
    //   name: 'Astarians',
    //   smartContract: '0xdf663a45d17fc3d669df586b8b9641c888a301dc',
    //   chain: 'astarEvm',
    //   type: 'erc721'
    // },
    // {
    //   name: 'Kongz Of Astar (KONGz)',
    //   smartContract: '0xD4d23b6A848de0e43910D4edaA414254A8B569e3',
    //   chain: 'astarEvm',
    //   type: 'erc721'
    // },
    // {
    //   name: 'CryptoDate',
    //   smartContract: '0xA5c4C04DAa2Ef87BFb34A064c0bc1f92C851d843',
    //   chain: 'moonriver',
    //   type: 'erc721'
    // },
    // {
    //   name: 'Pupazzi Punk Salvation',
    //   smartContract: '0xca9F9521011Ce7846E3Efcdb9b1f551c223C9400',
    //   chain: 'moonriver',
    //   type: 'erc721'
    // },
  ]
};
