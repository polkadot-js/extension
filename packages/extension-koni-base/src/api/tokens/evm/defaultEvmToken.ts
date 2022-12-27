// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomToken, CustomTokenType } from '@subwallet/extension-base/background/KoniTypes';

interface EvmTokenJson {
  erc20: CustomToken[],
  erc721: CustomToken[]
}

export const DEFAULT_EVM_TOKENS: EvmTokenJson = {
  erc20: [
    // bsc
    {
      name: 'Binance-Peg USD Coin',
      symbol: 'USDC',
      smartContract: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      decimals: 18,
      chain: 'binance',
      type: CustomTokenType.erc20
    },
    {
      name: 'Venus USDT',
      symbol: 'vUSDT',
      smartContract: '0xfD5840Cd36d94D7229439859C0112a4185BC0255',
      decimals: 8,
      chain: 'binance',
      type: CustomTokenType.erc20
    },
    {
      name: 'Venus BUSD',
      symbol: 'vBUSD',
      smartContract: '0x95c78222B3D6e262426483D42CfA53685A67Ab9D',
      decimals: 8,
      chain: 'binance',
      type: CustomTokenType.erc20
    },
    {
      name: 'Wrapped BNB',
      symbol: 'WBNB',
      smartContract: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      decimals: 18,
      chain: 'binance',
      type: CustomTokenType.erc20
    },
    {
      name: 'Binance-Peg Ethereum Token',
      symbol: 'ETH',
      smartContract: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      decimals: 18,
      chain: 'binance',
      type: CustomTokenType.erc20
    },
    {
      name: 'PancakeSwap Token',
      symbol: 'Cake',
      smartContract: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
      decimals: 18,
      chain: 'binance',
      type: CustomTokenType.erc20
    },
    {
      name: 'Binance-Peg BTCB Token',
      symbol: 'BTCB',
      smartContract: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      decimals: 18,
      chain: 'binance',
      type: CustomTokenType.erc20
    },
    {
      name: 'Binance-Peg Cardano Token',
      symbol: 'ADA',
      smartContract: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47',
      decimals: 18,
      chain: 'binance',
      type: CustomTokenType.erc20
    },
    {
      name: 'Binance-Peg XRP Token',
      symbol: 'XRP',
      smartContract: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE',
      decimals: 18,
      chain: 'binance',
      type: CustomTokenType.erc20
    },
    {
      name: 'Binance-Peg Polkadot Token',
      symbol: 'DOT',
      smartContract: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402',
      decimals: 18,
      chain: 'binance',
      type: CustomTokenType.erc20
    },
    {
      name: 'Binance-Peg BSC-USD',
      symbol: 'USDT',
      smartContract: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18,
      chain: 'binance',
      type: CustomTokenType.erc20
    },
    {
      name: 'Binance-Peg BUSD Token',
      symbol: 'BUSD',
      smartContract: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      decimals: 18,
      chain: 'binance',
      type: CustomTokenType.erc20
    },
    // eth
    {
      name: 'Tether USD',
      symbol: 'USDT',
      smartContract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'BNB',
      symbol: 'BNB',
      smartContract: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'USD Coin',
      symbol: 'USDC',
      smartContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Binance USD',
      symbol: 'BUSD',
      smartContract: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Lido DAO Token',
      symbol: 'LDO',
      smartContract: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Wrapped liquid staked Ether 2.0',
      symbol: 'wstETH',
      smartContract: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'stETH',
      symbol: 'stETH',
      smartContract: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Theta Token',
      symbol: 'THETA',
      smartContract: '0x3883f5e181fccaF8410FA61e12b59BAd963fb645',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'NEAR',
      symbol: 'NEAR',
      smartContract: '0x85F17Cf997934a597031b2E18a9aB6ebD4B9f6a4',
      decimals: 24,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'ApeCoin',
      symbol: 'APE',
      smartContract: '0x4d224452801ACEd8B2F0aebE155379bb5D594381',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'ChainLink Token',
      symbol: 'LINK',
      smartContract: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      smartContract: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'BAT',
      symbol: 'BAT',
      smartContract: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Cronos Coin',
      symbol: 'CRO',
      smartContract: '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b',
      decimals: 8,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Compound',
      symbol: 'COMP',
      smartContract: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'EnjinCoin',
      symbol: 'ENJ',
      smartContract: '0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'SAND',
      symbol: 'SAND',
      smartContract: '0x3845badAde8e6dFF049820680d1F14bD3903a5d0',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'GALA',
      symbol: 'GALA',
      smartContract: '0x15D4c048F83bd7e37d49eA4C83a07267Ec4203dA',
      decimals: 8,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'chiliZ',
      symbol: 'CHZ',
      smartContract: '0x3506424F91fD33084466F402d5D97f05F8e3b4AF',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: '1INCH Token',
      symbol: '1INCH',
      smartContract: '0x111111111117dC0aa78b770fA6A738034120C302',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Fantom Token',
      symbol: 'FTM',
      smartContract: '0x4E15361FD6b4BB609Fa63C81A2be19d873717870',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Maker',
      symbol: 'MKR',
      smartContract: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'KyberNetwork',
      symbol: 'KNC',
      smartContract: '0xdd974D5C2e2928deA5F71b9825b8b646686BD200',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Wrapped BTC',
      symbol: 'WBTC',
      smartContract: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Ethereum Name Service',
      symbol: 'ENS',
      smartContract: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Uniswap',
      symbol: 'UNI',
      smartContract: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'Matic Token',
      symbol: 'MATIC',
      smartContract: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'SHIBA INU',
      symbol: 'SHIB',
      smartContract: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
      decimals: 18,
      chain: 'ethereum',
      type: CustomTokenType.erc20
    },
    {
      name: 'TFA',
      symbol: 'TFA',
      smartContract: '0xE065ffaf3f7dED69BB5cf5FDd1Fd1dDA2EEe8493',
      decimals: 18,
      chain: 'moonbeam',
      type: CustomTokenType.erc20
    }
  ],
  erc721: [
    {
      name: 'MoonFit Mint Pass',
      smartContract: '0x6758053c0b27E478edE1E4882adFF708Fc4FA72D',
      chain: 'moonbeam',
      type: CustomTokenType.erc721
    },
    {
      name: 'MoonFit Beast and Beauty',
      smartContract: '0x02A6DeC99B2Ca768D638fcD87A96F6069F91287c',
      chain: 'moonbeam',
      type: CustomTokenType.erc721
    },
    {
      name: 'Moon Monkeys',
      smartContract: '0xCc1A7573C8f10d0df7Ee4d57cc958C8Df4a5Aca9',
      chain: 'moonbeam',
      type: CustomTokenType.erc721
    },
    {
      name: 'MoonDAONFT',
      smartContract: '0xc6342EAB8B7cC405Fc35ebA7F7401fc400aC0709',
      chain: 'moonbeam',
      type: CustomTokenType.erc721
    },
    {
      name: 'GlimmerApes',
      smartContract: '0x8fbe243d898e7c88a6724bb9eb13d746614d23d6',
      chain: 'moonbeam',
      type: CustomTokenType.erc721
    },
    {
      name: 'GlimmerJungle',
      smartContract: '0xcB13945Ca8104f813992e4315F8fFeFE64ac49cA',
      chain: 'moonbeam',
      type: CustomTokenType.erc721
    },
    {
      name: 'Moonbeam Punks',
      smartContract: '0xFD86D63748a6390E4a80739e776463088811774D',
      chain: 'moonbeam',
      type: CustomTokenType.erc721
    },
    {
      name: 'GlmrPunks',
      smartContract: '0x25714FcBc4bE731B95AE86483EF97ef6C3deB5Ce',
      chain: 'moonbeam',
      type: CustomTokenType.erc721
    },
    {
      name: 'MoonbeamZuki',
      smartContract: '0xC36D971c11CEbbCc20eE2C2910e07e2b1Be3790d',
      chain: 'moonbeam',
      type: CustomTokenType.erc721
    },
    {
      name: 'GlimmerKongsClub',
      smartContract: '0x62E413D4b097b474999CF33d336cD74881084ba5',
      chain: 'moonbeam',
      type: CustomTokenType.erc721
    },
    {
      name: 'Moonbeam Name Service (.moon)',
      smartContract: '0x9576167Eb03141F041ccAf57D4D0bd40Abb2b583',
      chain: 'moonbeam',
      type: CustomTokenType.erc721
    },
    {
      name: 'AthosNFT',
      smartContract: '0xcf82ddcca84d0e419bccd7a540e807c114250ded',
      chain: 'moonbeam',
      type: CustomTokenType.erc721
    },
    {
      name: 'Zoombies',
      smartContract: '0x08716e418e68564C96b68192E985762740728018',
      chain: 'moonriver',
      type: CustomTokenType.erc721
    },
    {
      name: 'Moonriver NFT Quest',
      smartContract: '0x79c8C73F85ec794f570aa7B768568a7fEdB294f8',
      chain: 'moonriver',
      type: CustomTokenType.erc721
    },
    {
      name: 'AstarGhost',
      smartContract: '0xb4bd85893d6f66869d7766ace1b1eb4d867d963e',
      chain: 'astarEvm',
      type: CustomTokenType.erc721
    },
    {
      name: 'Astar Punks',
      smartContract: '0x1b57C69838cDbC59c8236DDa73287a4780B4831F',
      chain: 'astarEvm',
      type: CustomTokenType.erc721
    },
    {
      name: 'AstarDegens',
      smartContract: '0xd59fc6bfd9732ab19b03664a45dc29b8421bda9a',
      chain: 'astarEvm',
      type: CustomTokenType.erc721
    },
    {
      name: 'Astarnaut',
      smartContract: '0xf008371a7EeD0AB54FDd975fE0d0f66fEFBA3415',
      chain: 'astarEvm',
      type: CustomTokenType.erc721
    },
    {
      name: 'AstarCats',
      smartContract: '0x8b5d62f396Ca3C6cF19803234685e693733f9779',
      chain: 'astarEvm',
      type: CustomTokenType.erc721
    },
    {
      chain: 'moonbeam',
      name: 'Exiled Racers Pilot',
      smartContract: '0x515e20e6275ceefe19221fc53e77e38cc32b80fb',
      type: CustomTokenType.erc721
    },
    {
      chain: 'moonbeam',
      name: 'MOONPETS',
      smartContract: '0x2159762693C629C5A44Fc9baFD484f8B96713467',
      type: CustomTokenType.erc721
    }
    // {
    //   name: 'AstarBots',
    //   smartContract: '0x2af8a3eeab86545d6bb2f6bae7c4ab6b6d1141b8',
    //   chain: 'astarEvm',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Astar Invisible Friends',
    //   smartContract: '0xdf8567bf301ce9b29e284f4de585D8eE782b1158',
    //   chain: 'astarEvm',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Astar Kevin',
    //   smartContract: '0xd311c9a8ff0d5045039a8723b20df36b42bd1554',
    //   chain: 'astarEvm',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Moonbeam BAYC',
    //   smartContract: '0x47B261a3DF3EBD6B36092Ac551Ce1B44F0e477b9',
    //   chain: 'moonbeam',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'DEDE the king!',
    //   smartContract: '0xedf4Bc150153623672f981c4D612Bbe427cE7d2d',
    //   chain: 'moonbeam',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'MoonCity',
    //   smartContract: '0x7cDc5D0188733eDF08412EECb9AFa840772615dC',
    //   chain: 'moonbeam',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Moonbeam BAYC',
    //   smartContract: '0x15380599b39A020378146C0714D628f14731F0A6',
    //   chain: 'moonbeam',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Hamsters Gang',
    //   smartContract: '0xD105E0da7fDc86192469654FB565c2f584920DA0',
    //   chain: 'moonbeam',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Bored Puppet Yacht Club',
    //   smartContract: '0xd364fB95989F5A47dDb9665149DD750782d37c7f',
    //   chain: 'moonbeam',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Astar MetaLion Kingdom',
    //   smartContract: '0x43C8402f4Dd910D84f145E63Aa8E3e9A67963aB0',
    //   chain: 'astarEvm',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Astar Punk X',
    //   smartContract: '0x5425948a8a83516D26C7081F2742De5767CFEEad',
    //   chain: 'astarEvm',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Astar Karafuru',
    //   smartContract: '0x5D49B30986111f45d503fEAAFF7412Ec0f22C189',
    //   chain: 'astarEvm',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Astarians',
    //   smartContract: '0xdf663a45d17fc3d669df586b8b9641c888a301dc',
    //   chain: 'astarEvm',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Kongz Of Astar (KONGz)',
    //   smartContract: '0xD4d23b6A848de0e43910D4edaA414254A8B569e3',
    //   chain: 'astarEvm',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'CryptoDate',
    //   smartContract: '0xA5c4C04DAa2Ef87BFb34A064c0bc1f92C851d843',
    //   chain: 'moonriver',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Pupazzi Punk Salvation',
    //   smartContract: '0xca9F9521011Ce7846E3Efcdb9b1f551c223C9400',
    //   chain: 'moonriver',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Moon Beast',
    //   smartContract: '0x5ca22CcE3aEf2caCBb4054503c503a1106050C8C',
    //   chain: 'moonbase',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'Moon Egg',
    //   smartContract: '0x86913a5E61D85fD9B8dbEd63dA8Bc7761B301C6b',
    //   chain: 'moonbase',
    //   type: CustomTokenType.erc721
    // },
    // {
    //   name: 'MoonFit Mint Pass',
    //   smartContract: '0x7E7d9fee5c5994aA7FC1dAeb231Af015e2FdAD3E',
    //   chain: 'moonbase',
    //   type: CustomTokenType.erc721
    // },
  ]
};
