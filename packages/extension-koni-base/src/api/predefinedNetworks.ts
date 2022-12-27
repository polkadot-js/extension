// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ContractType, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';

export const PREDEFINED_NETWORKS: Record<string, NetworkJson> = {
  polkadot: {
    key: 'polkadot',
    chain: 'Polkadot Relay Chain',
    genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    icon: 'polkadot',
    ss58Format: 0,
    providers: {
      Parity: 'wss://rpc.polkadot.io',
      OnFinality: 'wss://polkadot.api.onfinality.io/public-ws',
      // 'Geometry Labs': 'wss://polkadot.geometry.io/websockets', // https://github.com/polkadot-js/apps/pull/6746
      Dwellir: 'wss://polkadot-rpc.dwellir.com',
      'light client': 'light://substrate-connect/polkadot',
      RadiumBlock: 'wss://polkadot.public.curie.radiumblock.io/ws',
      '1RPC': 'wss://1rpc.io/dot',
      Pinknode: 'wss://public-rpc.pinknode.io/polkadot' // https://github.com/polkadot-js/apps/issues/5721
    },
    active: true,
    currentProvider: 'Parity',
    currentProviderMode: 'ws',
    groups: ['RELAY_CHAIN'],
    nativeToken: 'DOT',
    decimals: 10,
    coinGeckoKey: 'polkadot',
    supportBonding: true,
    getStakingOnChain: true
  },
  kusama: {
    key: 'kusama',
    chain: 'Kusama Relay Chain',
    genesisHash: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
    icon: 'polkadot',
    ss58Format: 2,
    providers: {
      Parity: 'wss://kusama-rpc.polkadot.io',
      OnFinality: 'wss://kusama.api.onfinality.io/public-ws',
      // 'Geometry Labs': 'wss://kusama.geometry.io/websockets', // https://github.com/polkadot-js/apps/pull/6746
      Dwellir: 'wss://kusama-rpc.dwellir.com',
      'light client': 'light://substrate-connect/kusama',
      Pinknode: 'wss://public-rpc.pinknode.io/kusama',
      RadiumBlock: 'wss://kusama.public.curie.radiumblock.xyz/ws',
      '1RPC': 'wss://1rpc.io/ksm'
    },
    active: true,
    currentProvider: 'Parity',
    currentProviderMode: 'ws',
    groups: ['RELAY_CHAIN'],
    nativeToken: 'KSM',
    decimals: 12,
    coinGeckoKey: 'kusama',
    supportBonding: true,
    getStakingOnChain: true
  },
  westend: {
    key: 'westend',
    chain: 'Westend Relay Chain',
    genesisHash: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
    icon: 'polkadot',
    ss58Format: 42,
    providers: {
      Parity: 'wss://westend-rpc.polkadot.io',
      Pinknode: 'wss://rpc.pinknode.io/westend/explorer',
      Dwellir: 'wss://westend-rpc.dwellir.com',
      'light client': 'light://substrate-connect/westend'
    },
    active: false,
    currentProvider: 'Parity',
    currentProviderMode: 'ws',
    groups: ['RELAY_CHAIN', 'TEST_NET'],
    nativeToken: 'WND',
    decimals: 12,
    supportBonding: true,
    getStakingOnChain: true
  },
  rococo: {
    key: 'rococo',
    chain: 'Rococo Relay Chain',
    genesisHash: '0x6408de7737c59c238890533af25896a2c20608d8b380bb01029acb392781063e',
    icon: 'polkadot',
    ss58Format: 42,
    providers: {
      Parity: 'wss://rococo-rpc.polkadot.io',
      OnFinality: 'wss://rococo.api.onfinality.io/public-ws', // After reset, node misses host functions
      Pinknode: 'wss://rpc.pinknode.io/rococo/explorer', // After reset, syncs to old chain
      'Ares Protocol': 'wss://rococo.aresprotocol.com', // https://github.com/polkadot-js/apps/issues/5767
      'light client': 'light://substrate-connect/rococo'
    },
    active: false,
    currentProvider: 'Parity',
    currentProviderMode: 'ws',
    groups: ['RELAY_CHAIN', 'TEST_NET'],
    nativeToken: 'ROC',
    decimals: 12
  },
  statemint: {
    key: 'statemint',
    chain: 'Statemint',
    genesisHash: '0x68d56f15f85d3136970ec16946040bc1752654e906147f7e43e9d539d7c3de2f',
    icon: 'polkadot',
    ss58Format: 0,
    providers: {
      Parity: 'wss://statemint-rpc.polkadot.io',
      OnFinality: 'wss://statemint.api.onfinality.io/public-ws',
      Dwellir: 'wss://statemint-rpc.dwellir.com',
      PinkNode: 'wss://public-rpc.pinknode.io/statemint',
      RadiumBlock: 'wss://statemint.public.curie.radiumblock.xyz/ws'
    },
    active: false,
    currentProvider: 'Parity',
    currentProviderMode: 'ws',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 1000,
    nativeToken: 'DOT',
    decimals: 10,
    coinGeckoKey: 'polkadot'
  },
  pioneer: {
    key: 'pioneer',
    chain: 'Pioneer Network',
    genesisHash: '0xf22b7850cdd5a7657bbfd90ac86441275bbc57ace3d2698a740c7b0ec4de5ec3',
    ss58Format: 268,
    providers: {
      OnFinality: 'wss://pioneer.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'OnFinality',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2096,
    nativeToken: 'NEER',
    crowdloanUrl: 'https://ksmcrowdloan.bit.country/',
    decimals: 18,
    coinGeckoKey: 'metaverse-network-pioneer'
  },
  ethereum: {
    key: 'ethereum',
    chain: 'Ethereum Mainnet',
    genesisHash: '0xb60d7bdd334cd3768d43f14a05c7fe7e886ba5bcb77e1064530052fed1a3f145',
    ss58Format: 0,
    providers: {
      Cloudflare: 'https://cloudflare-eth.com',
      BlastApi: 'https://eth-mainnet.public.blastapi.io',
      Infura: 'https://mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8'
    },
    active: false,
    currentProviderMode: 'http',
    currentProvider: 'Infura',
    groups: ['MAIN_NET'],
    isEthereum: true,
    nativeToken: 'ETH',
    decimals: 18,
    coinGeckoKey: 'ethereum',
    evmChainId: 1,
    supportBonding: false,
    getStakingOnChain: false,
    abiExplorer: 'https://etherscan.io',
    supportSmartContract: [ContractType.evm]
  },
  ethereum_goerli: {
    key: 'ethereum_goerli',
    chain: 'Ethereum Testnet (Goerli)',
    genesisHash: '0x2c8974e8936649eb65786299a1129fb6a47c5e703705489be96ea715496096c5',
    ss58Format: 0,
    providers: {
      Infura: 'https://goerli.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
      Optimism: 'https://goerli.optimism.io'
    },
    active: false,
    currentProviderMode: 'http',
    currentProvider: 'Infura',
    groups: ['TEST_NET'],
    isEthereum: true,
    nativeToken: 'GoerliETH',
    decimals: 18,
    coinGeckoKey: 'ethereum_goerli',
    evmChainId: 1,
    supportBonding: false,
    getStakingOnChain: false,
    abiExplorer: 'https://goerli.etherscan.io',
    supportSmartContract: [ContractType.evm]
  },
  binance: {
    key: 'binance',
    chain: 'Binance Smart Chain',
    genesisHash: '0x59bba357145ca539dcd1ac957abc1ec5833319ddcae7f5e8b5da0c36624784b2',
    ss58Format: 0,
    providers: {
      Binance: 'https://bsc-dataseed.binance.org/',
      Defibit: 'https://bsc-dataseed1.defibit.io/',
      Ninicoin: 'https://bsc-dataseed1.ninicoin.io/',
      Nodereal: 'https://bsc.nodereal.io/'
    },
    active: false,
    currentProviderMode: 'http',
    currentProvider: 'Binance',
    groups: ['MAIN_NET'],
    isEthereum: true,
    nativeToken: 'BNB',
    decimals: 18,
    coinGeckoKey: 'binancecoin',
    evmChainId: 56,
    supportBonding: false,
    getStakingOnChain: false,
    abiExplorer: 'https://bscscan.com',
    supportSmartContract: [ContractType.evm]
  },
  binance_test: {
    key: 'binance_test',
    chain: 'Binance Smart Chain (Testnet)',
    genesisHash: '0xdd00fd71b568b8a2571a276129bc122ec640095f16c01d851c45a64e9a0731f1',
    ss58Format: 0,
    providers: {
      Binance: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      Binance2: 'https://data-seed-prebsc-2-s1.binance.org:8545/'
    },
    active: false,
    currentProviderMode: 'http',
    currentProvider: 'Binance',
    groups: ['TEST_NET'],
    isEthereum: true,
    nativeToken: 'BNB',
    decimals: 18,
    evmChainId: 97,
    supportBonding: false,
    getStakingOnChain: false,
    abiExplorer: 'https://testnet.bscscan.com',
    supportSmartContract: [ContractType.evm]
  },
  moonbeam: {
    key: 'moonbeam',
    chain: 'Moonbeam',
    genesisHash: '0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d',
    ss58Format: 1284,
    providers: {
      'Moonbeam Foundation': 'wss://wss.api.moonbeam.network',
      OnFinality: 'wss://moonbeam.api.onfinality.io/public-ws',
      Dwellir: 'wss://moonbeam-rpc.dwellir.com',
      '1rpc': 'wss://1rpc.io/glmr',
      PinkNode: 'wss://public-rpc.pinknode.io/moonbeam',
      Blast: 'wss://moonbeam.public.blastapi.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Moonbeam Foundation',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2004,
    isEthereum: true,
    nativeToken: 'GLMR',
    crowdloanUrl: 'https://moonbeam.foundation/moonbeam-crowdloan/',
    decimals: 18,
    coinGeckoKey: 'moonbeam',
    evmChainId: 1284,
    supportBonding: true,
    getStakingOnChain: true,
    abiExplorer: 'https://api-moonbeam.moonscan.io/api?module=contract&action=getabi',
    supportSmartContract: [ContractType.evm]
  },
  astar: {
    key: 'astar',
    chain: 'Astar',
    genesisHash: '0x9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6',
    ss58Format: 5,
    providers: {
      OnFinality: 'wss://astar.api.onfinality.io/public-ws',
      Dwellir: 'wss://astar-rpc.dwellir.com',
      Astar: 'wss://rpc.astar.network',
      PinkNode: 'wss://public-rpc.pinknode.io/astar',
      Blast: 'wss://astar.public.blastapi.io',
      '1rpc': 'wss://1rpc.io/astr'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Astar',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2006,
    nativeToken: 'ASTR',
    crowdloanUrl: 'https://crowdloan.astar.network/#/',
    decimals: 18,
    getStakingOnChain: true,
    supportBonding: true,
    coinGeckoKey: 'astar',
    supportSmartContract: [ContractType.wasm]
  },
  astarEvm: {
    key: 'astarEvm',
    chain: 'Astar - EVM',
    genesisHash: '0x9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6_evm',
    ss58Format: 5,
    providers: {
      OnFinality: 'wss://astar.api.onfinality.io/public-ws',
      Dwellir: 'wss://astar-rpc.dwellir.com',
      Astar: 'wss://rpc.astar.network',
      PinkNode: 'wss://public-rpc.pinknode.io/astar',
      Blast: 'wss://astar.public.blastapi.io',
      '1rpc': 'wss://1rpc.io/astr'
    },
    isEthereum: true,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Astar',
    groups: ['POLKADOT_PARACHAIN'],
    nativeToken: 'ASTR',
    crowdloanUrl: 'https://crowdloan.astar.network/#/',
    decimals: 18,
    coinGeckoKey: 'astar',
    evmChainId: 592,
    supportSmartContract: [ContractType.evm]
  },
  acala: {
    key: 'acala',
    chain: 'Acala',
    genesisHash: '0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c',
    ss58Format: 10,
    providers: {
      'Acala Foundation 0': 'wss://acala-rpc-0.aca-api.network',
      'Acala Foundation 1': 'wss://acala-rpc-1.aca-api.network',
      'Acala Foundation 2': 'wss://acala-rpc-2.aca-api.network/ws',
      'Acala Foundation 3': 'wss://acala-rpc-3.aca-api.network/ws',
      'Polkawallet 0': 'wss://acala.polkawallet.io',
      OnFinality: 'wss://acala-polkadot.api.onfinality.io/public-ws',
      Dwellir: 'wss://acala-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Acala Foundation 0',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2000,
    nativeToken: 'ACA',
    crowdloanUrl: 'https://distribution.acala.network/',
    decimals: 12,
    coinGeckoKey: 'acala'
  },
  parallel: {
    key: 'parallel',
    chain: 'Parallel',
    genesisHash: '0xe61a41c53f5dcd0beb09df93b34402aada44cb05117b71059cce40a2723a4e97',
    ss58Format: 172,
    providers: {
      OnFinality: 'wss://parallel.api.onfinality.io/public-ws',
      Parallel: 'wss://rpc.parallel.fi'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Parallel',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2012,
    nativeToken: 'PARA',
    crowdloanUrl: 'https://crowdloan.parallel.fi/#/auction/contribute/polkadot/2012',
    decimals: 12
  },
  clover: {
    key: 'clover',
    chain: 'Clover',
    genesisHash: '0x5c7bd13edf349b33eb175ffae85210299e324d852916336027391536e686f267',
    ss58Format: 128,
    providers: {
      Clover: 'wss://rpc-para.clover.finance',
      OnFinality: 'wss://clover.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Clover',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2002,
    nativeToken: 'CLV',
    crowdloanUrl: 'https://lucky.clover.finance/?type=support',
    decimals: 18,
    coinGeckoKey: 'clover-finance'
  },
  cloverEvm: {
    key: 'cloverEvm',
    chain: 'Clover - EVM',
    genesisHash: '0x5c7bd13edf349b33eb175ffae85210299e324d852916336027391536e686f267_1',
    ss58Format: 128,
    providers: {
      Clover: 'wss://rpc-para.clover.finance',
      OnFinality: 'wss://clover.api.onfinality.io/public-ws'
    },
    active: false,
    isEthereum: true,
    currentProviderMode: 'ws',
    currentProvider: 'Clover',
    groups: ['POLKADOT_PARACHAIN'],
    evmChainId: 1024,
    nativeToken: 'CLV',
    crowdloanUrl: 'https://lucky.clover.finance/?type=support',
    decimals: 18,
    coinGeckoKey: 'clover-finance',
    supportSmartContract: [ContractType.evm]
  },
  hydradx_main: {
    key: 'hydradx_main',
    chain: 'HydraDX',
    genesisHash: '0xafdc188f45c71dacbaa0b62e16a91f726c7b8699a9748cdf715459de6b7f366d',
    ss58Format: 63,
    providers: {
      'Galactic Council': 'wss://rpc.hydradx.cloud',
      Dwellir: 'wss://hydradx-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Galactic Council',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2034,
    nativeToken: 'HDX',
    crowdloanUrl: 'https://loan.hydradx.io/',
    decimals: 12
  },
  edgeware: {
    key: 'edgeware',
    chain: 'Edgeware',
    genesisHash: '0x742a2ca70c2fda6cee4f8df98d64c4c670a052d9568058982dad9d5a7a135c5b',
    ss58Format: 7,
    providers: {
      JelliedOwl: 'wss://edgeware.jelliedowl.net',
      OnFinality: 'wss://edgeware.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'JelliedOwl',
    groups: ['MAIN_NET'],
    nativeToken: 'EDG',
    decimals: 18,
    coinGeckoKey: 'edgeware'
  },
  centrifuge: {
    key: 'centrifuge',
    chain: 'Centrifuge',
    genesisHash: '0xb3db41421702df9a7fcac62b53ffeac85f7853cc4e689e0b93aeb3db18c09d82',
    ss58Format: 36,
    providers: {
      Centrifuge: 'wss://fullnode.parachain.centrifuge.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Centrifuge',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2031,
    nativeToken: 'CFG',
    crowdloanUrl: 'https://centrifuge.io/parachain/crowdloan/',
    decimals: 18,
    coinGeckoKey: 'centrifuge'
  },
  interlay: {
    key: 'interlay',
    chain: 'Interlay',
    genesisHash: '0xed86d448b84db333cdbe07362ddc79530343b907bd88712557c024d7a94296bb',
    ss58Format: 42,
    providers: {
      'Kintsugi Labs': 'wss://api.interlay.io/parachain',
      OnFinality: 'wss://interlay.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Kintsugi Labs',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2032,
    nativeToken: 'INTR',
    crowdloanUrl: 'https://crowdloan.interlay.io/',
    decimals: 10,
    coinGeckoKey: 'interlay'
  },
  equilibrium_parachain: {
    key: 'equilibrium_parachain',
    chain: 'Equilibrium Parachain',
    genesisHash: '0x89d3ec46d2fb43ef5a9713833373d5ea666b092fa8fd68fbc34596036571b907',
    ss58Format: 68,
    providers: {
      Equilibrium: 'wss://node.pol.equilibrium.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Equilibrium',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2011,
    nativeToken: 'TOKEN',
    crowdloanUrl: 'https://equilibrium.io/en/crowdloan#bid',
    decimals: 10,
    coinGeckoKey: 'equilibrium-token'
  },
  nodle: {
    key: 'nodle',
    chain: 'Nodle',
    genesisHash: '0xa3d114c2b8d0627c1aa9b134eafcf7d05ca561fdc19fb388bb9457f81809fb23',
    ss58Format: 37,
    providers: {
      OnFinality: 'wss://nodle-parachain.api.onfinality.io/public-ws',
      Dwellir: 'wss://eden-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Dwellir',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2026,
    nativeToken: 'NODL',
    crowdloanUrl: 'https://parachain.nodle.com/',
    decimals: 11
  },
  darwinia: {
    key: 'darwinia',
    chain: 'Darwinia',
    genesisHash: '0x729cb8f2cf428adcf81fe69610edda32c5711b2ff17de747e8604a3587021db8',
    ss58Format: 18,
    providers: {
      'Darwinia Network': 'wss://rpc.darwinia.network',
      Darwinia: 'wss://darwinia-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Darwinia',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2003,
    nativeToken: 'RING',
    crowdloanUrl: 'https://darwinia.network/plo_contribute',
    decimals: 9,
    coinGeckoKey: 'darwinia-network-native-token'
  },
  sora_ksm: {
    key: 'sora_ksm',
    chain: 'SORA Kusama',
    genesisHash: '0x6d8d9f145c2177fa83512492cdd80a71e29f22473f4a8943a6292149ac319fb9',
    ss58Format: 420,
    providers: {
      Soramitsu: 'wss://ws.parachain-collator-1.c1.sora2.soramitsu.co.jp'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Soramitsu',
    groups: ['KUSAMA_PARACHAIN'],
    nativeToken: 'Unit',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 12,
    paraId: 2011
  },
  odyssey: {
    key: 'odyssey',
    chain: 'Ares Odyssey',
    genesisHash: '0x0f3665e2e57fb38fd638145b69e567fb05bbadfd457624f90f15e5dbb31320bb',
    ss58Format: 34,
    providers: {
      AresProtocol: 'wss://odyssey.aresprotocol.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'AresProtocol',
    groups: ['MAIN_NET'],
    nativeToken: 'ARES',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 12
  },
  polkadex: {
    key: 'polkadex',
    chain: 'Polkadex',
    genesisHash: '0x3920bcb4960a1eef5580cd5367ff3f430eef052774f78468852f7b9cb39f8a3c',
    ss58Format: 88,
    providers: {
      'Polkadex Team': 'wss://mainnet.polkadex.trade/',
      OnFinality: 'wss://polkadex.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Polkadex Team',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2040,
    nativeToken: 'PDEX',
    coinGeckoKey: 'polkadex',
    crowdloanUrl: 'https://www.polkadex.trade/crowdloans',
    decimals: 12,
    getStakingOnChain: true,
    supportBonding: true
  },
  polkadexTest: {
    key: 'polkadexTest',
    chain: 'Polkadex - Testnet',
    genesisHash: '0xd0024e7110db2a8b35d6599e64e82d3eb30070200a423398319efb6b4d596427',
    ss58Format: 88,
    providers: {
      'Polkadex Team': 'wss://blockchain.polkadex.trade'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Polkadex Team',
    groups: ['TEST_NET'],
    nativeToken: 'Unit',
    crowdloanUrl: 'https://www.polkadex.trade/crowdloans',
    decimals: 12,
    getStakingOnChain: true,
    supportBonding: true
  },
  aleph: {
    key: 'aleph',
    chain: 'Aleph Zero',
    genesisHash: '0x70255b4d28de0fc4e1a193d7e175ad1ccef431598211c55538f1018651a0344e',
    ss58Format: 42,
    providers: {
      'Aleph Zero Foundation': 'wss://ws.azero.dev'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Aleph Zero Foundation',
    groups: ['MAIN_NET'],
    nativeToken: 'AZERO',
    crowdloanUrl: 'https://contribute.alephzero.org/',
    decimals: 12,
    coinGeckoKey: 'aleph-zero',
    getStakingOnChain: true,
    supportBonding: true
  },
  rmrk: {
    key: 'rmrk',
    chain: 'RMRK Devnet',
    genesisHash: '0x6c7ae90ef70a31fe9f0f2329007ff4b4c4fe62fe71cd2b753ee37c1aa1070fef',
    icon: 'polkadot',
    ss58Format: 0,
    providers: {
      rmrk: 'wss://staging.node.rmrk.app'
    },
    active: false,
    currentProvider: 'rmrk',
    currentProviderMode: 'ws',
    nativeToken: 'UNIT',
    groups: ['TEST_NET'],
    decimals: 12,
    coinGeckoKey: 'rmrk'
  },
  dolphin: {
    key: 'dolphin',
    chain: 'Dolphin Testnet',
    active: false,
    genesisHash: '0x79372c8ed25b51c0d3c1f085becb264c93f1ecbc71dcf387fdb5c294fd823a08',
    ss58Format: 78,
    providers: {
      dolphin: 'wss://ws.rococo.dolphin.engineering'
    },
    currentProvider: 'dolphin',
    currentProviderMode: 'ws',
    groups: ['TEST_NET'],
    nativeToken: 'DOL',
    decimals: 18
  },
  alephTest: {
    key: 'alephTest',
    chain: 'Aleph Zero Testnet',
    genesisHash: '0x05d5279c52c484cc80396535a316add7d47b1c5b9e0398dd1f584149341460c5',
    ss58Format: 42,
    providers: {
      'Aleph Zero Foundation': 'wss://ws.test.azero.dev'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Aleph Zero Foundation',
    groups: ['TEST_NET'],
    nativeToken: 'TZERO',
    decimals: 12,
    getStakingOnChain: true,
    supportBonding: true,
    supportSmartContract: [ContractType.wasm]
  },
  opal: {
    key: 'opal',
    chain: 'OPAL by UNIQUE',
    genesisHash: '0x3fa374fbc8d0a9077356aefe327c88f447ce7f1fda905b1d4b4a2680a7b5cefa',
    ss58Format: 42,
    providers: {
      Unique: 'wss://ws-opal.unique.network',
      Europe: 'wss://eu-ws-opal.unique.network',
      NA: 'wss://us-ws-opal.unique.network',
      Asia: 'wss://asia-ws-opal.unique.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Unique',
    groups: ['TEST_NET'],
    nativeToken: 'OPL',
    decimals: 18
  },
  moonbase: {
    key: 'moonbase',
    chain: 'Moonbase Alpha',
    genesisHash: '0x91bc6e169807aaa54802737e1c504b2577d4fafedd5a02c10293b1cd60e39527',
    ss58Format: 1287,
    providers: {
      'Moonbeam Foundation': 'wss://wss.api.moonbase.moonbeam.network',
      OnFinality: 'wss://moonbeam-alpha.api.onfinality.io/public-ws',
      Blast: 'wss://moonbase-alpha.public.blastapi.io'
      // Pinknode: 'wss://rpc.pinknode.io/alphanet/explorer' // https://github.com/polkadot-js/apps/issues/7058
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Moonbeam Foundation',
    groups: ['TEST_NET'],
    nativeToken: 'DEV',
    isEthereum: true,
    abiExplorer: 'https://api-moonbase.moonscan.io/api?module=contract&action=getabi',
    decimals: 18,
    evmChainId: 1287,
    supportBonding: true,
    getStakingOnChain: true,
    paraId: 1000,
    supportSmartContract: [ContractType.evm]
  },
  efinity: {
    key: 'efinity',
    chain: 'Efinity',
    genesisHash: '0x335369975fced3fc22e23498da306a712f4fd964c957364d53c49cea9db8bc2f',
    ss58Format: 1110,
    providers: {
      Efinity: 'wss://rpc.efinity.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Efinity',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2021,
    nativeToken: 'EFI',
    crowdloanUrl: 'https://enjin.io/efinity-crowdloan',
    decimals: 10,
    coinGeckoKey: 'efinity'
  },
  composableFinance: {
    key: 'composableFinance',
    chain: 'Composable Finance',
    genesisHash: '0xdaab8df776eb52ec604a5df5d388bb62a050a0aaec4556a64265b9d42755552d',
    ss58Format: 49,
    providers: {
      Composable: 'wss://rpc.composable.finance'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Composable',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2019,
    nativeToken: 'LAYR',
    crowdloanUrl: 'https://crowdloan.composable.finance/',
    decimals: 12
  },
  phala: {
    key: 'phala',
    chain: 'Phala Network',
    genesisHash: '0x1bb969d85965e4bb5a651abbedf21a54b6b31a21f66b5401cc3f1e286268d736',
    ss58Format: 30,
    providers: {
      Phala: 'wss://api.phala.network/ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Phala',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2035,
    nativeToken: 'PHA',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 10,
    coinGeckoKey: 'pha'
  },
  crust: {
    key: 'crust',
    chain: 'Crust Network',
    genesisHash: '0x8b404e7ed8789d813982b9cb4c8b664c05b3fbf433309f603af014ec9ce56a8c',
    ss58Format: 66,
    providers: {
      'Crust Network': 'wss://rpc.crust.network',
      OnFinality: 'wss://crust.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Crust Network',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2008,
    nativeToken: 'CRU',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 12,
    coinGeckoKey: 'crust-network'
  },
  // coinversation: {
  //   key: 'coinversation',
  //   chain: 'Coinversation',
  //   genesisHash: 'UNKNOWN',
  //   ss58Format: -1,
  //   providers: {
  //     Coinversation: 'wss://rpc.coinversation.io/'
  //   },
  //   active: false,
  //   currentProviderMode: 'ws',
  //   currentProvider: 'Coinversation',
  //   groups: ['POLKADOT_PARACHAIN'],
  //   paraId: 2027,
  //   nativeToken: 'CTO',
  //   crowdloanUrl: 'https://www.coinversation.io/joinus',
  //   decimals: 10,
  //   coinGeckoKey: 'coinversation'
  // },
  statemine: {
    key: 'statemine',
    chain: 'Statemine',
    genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
    icon: 'polkadot',
    ss58Format: 2,
    providers: {
      Parity: 'wss://statemine-rpc.polkadot.io',
      OnFinality: 'wss://statemine.api.onfinality.io/public-ws',
      Dwellir: 'wss://statemine-rpc.dwellir.com',
      RadiumBlock: 'wss://statemine.public.curie.radiumblock.xyz/ws',
      PinkNode: 'wss://public-rpc.pinknode.io/statemine'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Parity',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 1000,
    nativeToken: 'KSM',
    decimals: 12
  },
  karura: {
    key: 'karura',
    chain: 'Karura',
    genesisHash: '0xbaf5aabe40646d11f0ee8abbdc64f4a4b7674925cba08e4a05ff9ebed6e2126b',
    ss58Format: 8,
    providers: {
      'Acala Foundation 0': 'wss://karura-rpc-0.aca-api.network',
      'Acala Foundation 1': 'wss://karura-rpc-1.aca-api.network',
      'Acala Foundation 2': 'wss://karura-rpc-2.aca-api.network/ws',
      'Acala Foundation 3': 'wss://karura-rpc-3.aca-api.network/ws',
      'Polkawallet 0': 'wss://karura.polkawallet.io',
      OnFinality: 'wss://karura.api.onfinality.io/public-ws',
      Dwellir: 'wss://karura-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Acala Foundation 2',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2000,
    nativeToken: 'KAR',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 12,
    coinGeckoKey: 'karura'
  },
  moonriver: {
    key: 'moonriver',
    chain: 'Moonriver',
    genesisHash: '0x401a1f9dca3da46f5c4091016c8a2f26dcea05865116b286f60f668207d1474b',
    ss58Format: 1285,
    providers: {
      'Moonbeam Foundation': 'wss://wss.api.moonriver.moonbeam.network',
      OnFinality: 'wss://moonriver.api.onfinality.io/public-ws',
      Dwellir: 'wss://moonriver-rpc.dwellir.com',
      Blast: 'wss://moonriver.public.blastapi.io',
      Pinknode: 'wss://public-rpc.pinknode.io/moonriver' // https://github.com/polkadot-js/apps/issues/7058
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Moonbeam Foundation',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2023,
    isEthereum: true,
    nativeToken: 'MOVR',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 18,
    coinGeckoKey: 'moonriver',
    evmChainId: 1285,
    supportBonding: true,
    getStakingOnChain: true,
    abiExplorer: 'https://api-moonriver.moonscan.io/api?module=contract&action=getabi',
    supportSmartContract: [ContractType.evm]
  },
  shiden: {
    key: 'shiden',
    chain: 'Shiden',
    genesisHash: '0xf1cf9022c7ebb34b162d5b5e34e705a5a740b2d0ecc1009fb89023e62a488108',
    ss58Format: 5,
    providers: {
      StakeTechnologies: 'wss://rpc.shiden.astar.network',
      OnFinality: 'wss://shiden.api.onfinality.io/public-ws',
      Pinknode: 'wss://rpc.pinknode.io/shiden/explorer',
      Dwellir: 'wss://shiden-rpc.dwellir.com',
      Blast: 'wss://shiden.public.blastapi.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'StakeTechnologies',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2007,
    nativeToken: 'SDN',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 18,
    coinGeckoKey: 'shiden',
    supportSmartContract: [ContractType.wasm],
    supportBonding: true,
    getStakingOnChain: true
  },
  shidenEvm: {
    key: 'shidenEvm',
    chain: 'Shiden - EVM',
    active: false,
    genesisHash: '0xf1cf9022c7ebb34b162d5b5e34e705a5a740b2d0ecc1009fb89023e62a488108___EVM',
    ss58Format: 5,
    providers: {
      astar: 'wss://rpc.shiden.astar.network'
    },
    currentProviderMode: 'ws',
    currentProvider: 'astar',
    groups: ['KUSAMA_PARACHAIN'],
    nativeToken: 'SDN',
    evmChainId: 336,
    isEthereum: true,
    supportSmartContract: [ContractType.evm]
  },
  shibuya: {
    key: 'shibuya',
    chain: 'Shibuya Testnet',
    genesisHash: '0xddb89973361a170839f80f152d2e9e38a376a5a7eccefcade763f46a8e567019',
    ss58Format: 5,
    providers: {
      Shibuya: 'wss://rpc.shibuya.astar.network/'
    },
    isEthereum: false,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Shibuya',
    groups: ['TEST_NET'],
    nativeToken: 'SBY',
    decimals: 18,
    getStakingOnChain: true,
    supportBonding: true,
    supportSmartContract: [ContractType.wasm]
  },
  shibuyaEvm: {
    key: 'shibuyaEvm',
    chain: 'Shibuya Testnet - EVM',
    genesisHash: '0xddb89973361a170839f80f152d2e9e38a376a5a7eccefcade763f46a8e567019_evm',
    ss58Format: 5,
    providers: {
      Shibuya: 'wss://rpc.shibuya.astar.network/'
    },
    isEthereum: true,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Shibuya',
    groups: ['TEST_NET'],
    evmChainId: 81,
    nativeToken: 'SBY',
    decimals: 18,
    supportSmartContract: [ContractType.evm]
  },
  khala: {
    key: 'khala',
    chain: 'Khala',
    genesisHash: '0xd43540ba6d3eb4897c28a77d48cb5b729fea37603cbbfc7a86a73b72adb3be8d',
    ss58Format: 30,
    providers: {
      Phala: 'wss://khala-api.phala.network/ws',
      OnFinality: 'wss://khala.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Phala',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2004,
    nativeToken: 'PHA',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 12
  },
  bifrost: {
    key: 'bifrost',
    chain: 'Bifrost Kusama',
    genesisHash: '0x9f28c6a68e0fc9646eff64935684f6eeeece527e37bbe1f213d22caa1d9d6bed',
    ss58Format: 6,
    providers: {
      'Liebi 0': 'wss://bifrost-rpc.liebi.com/ws',
      'Liebi 1': 'wss://us.bifrost-rpc.liebi.com/ws',
      'Liebi 2': 'wss://eu.bifrost-rpc.liebi.com/ws',
      OnFinality: 'wss://bifrost-parachain.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Liebi 0',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2001,
    nativeToken: 'BNC',
    crowdloanUrl: 'https://bifrost.app/vcrowdloan',
    decimals: 12,
    coinGeckoKey: 'bifrost-native-coin',
    getStakingOnChain: true,
    supportBonding: true,
    blockExplorer: 'https://bifrost-kusama.subscan.io'
  },
  bifrost_dot: {
    key: 'bifrost_dot',
    chain: 'Bifrost Polkadot',
    genesisHash: '0x262e1b2ad728475fd6fe88e62d34c200abe6fd693931ddad144059b1eb884e5b',
    ss58Format: 6,
    providers: {
      Liebi: 'wss://hk.p.bifrost-rpc.liebi.com/ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Liebi',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2030,
    nativeToken: 'BNC',
    crowdloanUrl: 'https://bifrost.app/vcrowdloan',
    decimals: 12,
    coinGeckoKey: 'bifrost-native-coin',
    blockExplorer: 'https://bifrost.subscan.io'
  },
  bifrost_testnet: {
    key: 'bifrost_testnet',
    chain: 'Bifrost Testnet',
    genesisHash: '0x8b290fa39a8808f29d7309ea99442c95bf964838aef14be5a6449ae48f8a5f1f',
    ss58Format: 6,
    providers: {
      Liebi: 'wss://bifrost-rpc.rococo.liebi.com/ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Liebi',
    groups: ['TEST_NET'],
    nativeToken: 'BNC',
    decimals: 12,
    getStakingOnChain: true,
    supportBonding: true
  },
  kilt: {
    key: 'kilt',
    chain: 'KILT Spiritnet',
    genesisHash: '0x411f057b9107718c9624d6aa4a3f23c1653898297f3d4d529d9bb6511a39dd21',
    ss58Format: 38,
    providers: {
      'KILT Protocol': 'wss://spiritnet.kilt.io/',
      OnFinality: 'wss://spiritnet.api.onfinality.io/public-ws',
      Dwellir: 'wss://kilt-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'KILT Protocol',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2086,
    nativeToken: 'KILT',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 12,
    coinGeckoKey: 'kilt-protocol',
    supportBonding: true,
    getStakingOnChain: true
  },
  calamari: {
    key: 'calamari',
    chain: 'Calamari Parachain',
    genesisHash: '0x4ac80c99289841dd946ef92765bf659a307d39189b3ce374a92b5f0415ee17a1',
    ss58Format: 78,
    providers: {
      'Manta Network': 'wss://ws.calamari.systems/',
      OnFinality: 'wss://calamari.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Manta Network',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2084,
    nativeToken: 'KMA',
    crowdloanUrl: 'https://calamari.network/',
    decimals: 12,
    coinGeckoKey: 'calamari-network',
    getStakingOnChain: true,
    supportBonding: true
  },
  basilisk: {
    key: 'basilisk',
    chain: 'Basilisk',
    genesisHash: '0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755',
    ss58Format: 10041,
    providers: {
      Basilisk: 'wss://rpc.basilisk.cloud',
      Dwellir: 'wss://basilisk-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Basilisk',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2090,
    coinGeckoKey: 'basilisk',
    nativeToken: 'BSX',
    crowdloanUrl: 'https://loan.bsx.fi/',
    decimals: 12
  },
  altair: {
    key: 'altair',
    chain: 'Altair',
    genesisHash: '0xaa3876c1dc8a1afcc2e9a685a49ff7704cfd36ad8c90bf2702b9d1b00cc40011',
    ss58Format: 136,
    providers: {
      Centrifuge: 'wss://fullnode.altair.centrifuge.io',
      OnFinality: 'wss://altair.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Centrifuge',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2088,
    nativeToken: 'AIR',
    crowdloanUrl: 'https://centrifuge.io/altair/crowdloan/',
    decimals: 18,
    coinGeckoKey: 'altair'
  },
  heiko: {
    key: 'heiko',
    chain: 'Heiko',
    genesisHash: '0x64a1c658a48b2e70a7fb1ad4c39eea35022568c20fc44a6e2e3d0a57aee6053b',
    ss58Format: 110,
    providers: {
      OnFinality: 'wss://parallel-heiko.api.onfinality.io/public-ws',
      Parallel: 'wss://heiko-rpc.parallel.fi'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Parallel',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2085,
    nativeToken: 'HKO',
    crowdloanUrl: 'https://crowdloan.parallel.fi/#/auction/contribute/kusama/2085',
    decimals: 12
  },
  kintsugi: {
    key: 'kintsugi',
    chain: 'Kintsugi',
    genesisHash: '0x9af9a64e6e4da8e3073901c3ff0cc4c3aad9563786d89daf6ad820b6e14a0b8b',
    ss58Format: 2092,
    providers: {
      'Kintsugi Labs': 'wss://api-kusama.interlay.io/parachain',
      OnFinality: 'wss://kintsugi.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Kintsugi Labs',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2092,
    nativeToken: 'KINT',
    crowdloanUrl: 'https://kintsugi.interlay.io/',
    decimals: 12,
    coinGeckoKey: 'kintsugi'
  },
  kintsugi_test: {
    key: 'kintsugi_test',
    chain: 'Kintsugi Testnet',
    genesisHash: '0x364dd762ee3fa02f63548f579f185e64932fc1a29052d7d9a588d2a57b191abf',
    ss58Format: 42,
    active: false,
    providers: {
      testnet: 'wss://api-testnet.interlay.io:443/parachain'
    },
    currentProviderMode: 'ws',
    currentProvider: 'testnet',
    groups: ['TEST_NET'],
    nativeToken: 'KINT',
    decimals: 12
  },
  picasso: {
    key: 'picasso',
    chain: 'Picasso',
    genesisHash: '0x6811a339673c9daa897944dcdac99c6e2939cc88245ed21951a0a3c9a2be75bc',
    ss58Format: 49,
    providers: {
      Composable: 'wss://picasso-rpc.composable.finance'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Composable',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2087,
    nativeToken: 'PICA',
    crowdloanUrl: 'https://crowdloan.composable.finance/',
    decimals: 12,
    coinGeckoKey: 'picasso-network'
  },
  quartz: {
    key: 'quartz',
    chain: 'QUARTZ by UNIQUE',
    genesisHash: '0xcd4d732201ebe5d6b014edda071c4203e16867305332301dc8d092044b28e554',
    ss58Format: 255,
    providers: {
      Unique: 'wss://quartz.unique.network',
      OnFinality: 'wss://quartz.api.onfinality.io/public-ws',
      'Unique Europe': 'wss://eu-ws-quartz.unique.network',
      'Unique US': 'wss://us-ws-quartz.unique.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Unique',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2095,
    nativeToken: 'QTZ',
    crowdloanUrl: 'https://unique.network/quartz/crowdloan/',
    decimals: 18,
    coinGeckoKey: 'quartz'
  },
  unique_network: {
    key: 'unique_network',
    chain: 'UNIQUE NETWORK',
    active: false,
    genesisHash: '0x84322d9cddbf35088f1e54e9a85c967a41a56a4f43445768125e61af166c7d31',
    ss58Format: 7391,
    providers: {
      unique: 'wss://ws.unique.network/'
    },
    currentProvider: 'unique',
    currentProviderMode: 'ws',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2037,
    nativeToken: 'UNQ'
  },
  genshiro: {
    key: 'genshiro',
    chain: 'Genshiro',
    genesisHash: '0x9b8cefc0eb5c568b527998bdd76c184e2b76ae561be76e4667072230217ea243',
    ss58Format: 68,
    providers: {
      Equilibrium: 'wss://node.genshiro.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Equilibrium',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2024,
    nativeToken: 'GENS',
    crowdloanUrl: 'https://genshiro.equilibrium.io/en',
    decimals: 10,
    coinGeckoKey: 'genshiro'
  },
  genshiro_testnet: {
    key: 'genshiro_testnet',
    chain: 'Genshiro Testnet',
    genesisHash: '0xdec164ef73b27c5b7e404114305102018a2b5a4ddda665bb510ce896ad5ba78d',
    ss58Format: 68,
    providers: {
      testnet: 'wss://testnet.genshiro.io'
    },
    decimals: 9,
    nativeToken: 'TOKEN',
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'testnet',
    groups: ['TEST_NET']
  },
  subsocial_x: {
    key: 'subsocial_x',
    active: false,
    chain: 'SubsocialX',
    genesisHash: '0x4a12be580bb959937a1c7a61d5cf24428ed67fa571974b4007645d1886e7c89f',
    ss58Format: 28,
    providers: {
      subsocialx: 'wss://para.subsocial.network'
    },
    currentProviderMode: 'ws',
    currentProvider: 'subsocialx',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2100,
    nativeToken: 'SUB',
    crowdloanUrl: 'https://app.subsocial.network/crowdloan'
  },
  zeitgeist: {
    key: 'zeitgeist',
    chain: 'Zeitgeist',
    genesisHash: '0x1bf2a2ecb4a868de66ea8610f2ce7c8c43706561b6476031315f6640fe38e060',
    ss58Format: 73,
    providers: {
      OnFinality: 'wss://zeitgeist.api.onfinality.io/public-ws',
      Dwellir: 'wss://zeitgeist-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Dwellir',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2101,
    nativeToken: 'ZTG',
    crowdloanUrl: 'https://crowdloan.zeitgeist.pm/',
    decimals: 10,
    coinGeckoKey: 'zeitgeist'
  },
  sakura: {
    key: 'sakura',
    chain: 'Sakura',
    genesisHash: '0x7b0f142a9299b0886595992f8cac58814c8956de6a31c77caca95db01370fc2c',
    ss58Format: 42,
    providers: {
      Clover: 'wss://rpc.sakura.clover.finance'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Clover',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2016,
    nativeToken: 'SKU',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 10,
    coinGeckoKey: 'sakura'
  },
  shadow: {
    key: 'shadow',
    chain: 'Crust Shadow',
    genesisHash: '0xd4c0c08ca49dc7c680c3dac71a7c0703e5b222f4b6c03fe4c5219bb8f22c18dc',
    ss58Format: 66,
    providers: {
      Crust: 'wss://rpc-shadow.crust.network/'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Crust',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2012,
    nativeToken: 'CSM',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 12,
    coinGeckoKey: 'crust-storage-market'
  },
  uniqueNft: {
    key: 'uniqueNft',
    chain: 'Unique TestNet 2.0',
    genesisHash: 'UPDATING',
    ss58Format: -1,
    providers: {
      Unique: 'wss://testnet2.unique.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Unique',
    groups: ['TEST_NET'],
    nativeToken: 'UNQ',
    decimals: 15
  },
  robonomics: {
    key: 'robonomics',
    chain: 'Robonomics',
    genesisHash: '0x631ccc82a078481584041656af292834e1ae6daab61d2875b4dd0c14bb9b17bc',
    ss58Format: 32,
    providers: {
      Airalab: 'wss://kusama.rpc.robonomics.network/'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Airalab',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2048,
    nativeToken: 'XRT',
    crowdloanUrl: 'https://robonomics.network/kusama-slot/',
    decimals: 9,
    coinGeckoKey: 'robonomics-network'
  },
  integritee: {
    key: 'integritee',
    chain: 'Integritee Network',
    genesisHash: '0xf195ef30c646663a24a3164b307521174a86f437c586397a43183c736a8383c1',
    ss58Format: 13,
    providers: {
      Integritee: 'wss://kusama.api.integritee.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Integritee',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2015,
    nativeToken: 'TEER',
    crowdloanUrl: 'https://crowdloan.integritee.network/',
    decimals: 12,
    coinGeckoKey: 'integritee'
  },
  integriteePolkadot: {
    key: 'integriteePolkadot',
    chain: 'Integritee Shell',
    genesisHash: '0xe13e7af377c64e83f95e0d70d5e5c3c01d697a84538776c5b9bbe0e7d7b6034c',
    ss58Format: 13,
    providers: {
      Integritee: 'wss://polkadot.api.integritee.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Integritee',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2015,
    nativeToken: 'TEER',
    crowdloanUrl: 'https://crowdloan.integritee.network/',
    decimals: 12,
    coinGeckoKey: 'integritee'
  },
  crab: {
    key: 'crab',
    chain: 'Darwinia Crab',
    genesisHash: '0x34f61bfda344b3fad3c3e38832a91448b3c613b199eb23e5110a635d71c13c65',
    ss58Format: 42,
    providers: {
      OnFinality: 'wss://darwinia-crab.api.onfinality.io/public-ws',
      Darwinia_Network: 'wss://crab-rpc.darwinia.network',
      Dwellir: 'wss://darwiniacrab-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Darwinia_Network',
    groups: ['MAIN_NET'],
    nativeToken: 'CRAB',
    crowdloanUrl: 'https://crab.network/plo',
    decimals: 9,
    coinGeckoKey: 'darwinia-crab-network'
  },
  crabParachain: {
    key: 'crabParachain',
    chain: 'Crab Parachain',
    genesisHash: '0xeac895d7768b17837a9c3a9f0280c01502c3ef40193df923490a0fa9c60ea076',
    ss58Format: 42,
    providers: {
      Crab: 'wss://crab-parachain-rpc.darwinia.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Crab',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2105,
    nativeToken: 'CRAB',
    crowdloanUrl: 'https://crab.network/plo',
    decimals: 18,
    coinGeckoKey: 'darwinia-crab-network'
  },
  crabEvm: {
    key: 'crabEvm',
    chain: 'Darwinia Crab - EVM',
    genesisHash: '0x34f61bfda344b3fad3c3e38832a91448b3c613b199eb23e5110a635d71c13c65_1',
    ss58Format: 42,
    providers: {
      Darwinia_Network: 'wss://crab-rpc.darwinia.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Darwinia_Network',
    groups: ['MAIN_NET'],
    nativeToken: 'CRAB',
    decimals: 18,
    coinGeckoKey: 'darwinia-crab-network',
    isEthereum: true,
    evmChainId: 44,
    blockExplorer: 'https://crab.subscan.io',
    supportSmartContract: [ContractType.evm]
  },
  pangolin: {
    key: 'pangolin',
    chain: 'Pangolin',
    genesisHash: '0xce44bd16fc276f9e457b452577b6c2678e57768260012af127479fed806da7e7',
    ss58Format: 42,
    providers: {
      Pangolin_Network: 'wss://pangolin-rpc.darwinia.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Pangolin_Network',
    groups: ['TEST_NET'],
    nativeToken: 'PRING',
    decimals: 9,
    isEthereum: false,
    blockExplorer: 'https://pangolin.subscan.io'
  },
  pangolinEvm: {
    key: 'pangolinEvm',
    chain: 'Pangolin - EVM',
    genesisHash: '0xce44bd16fc276f9e457b452577b6c2678e57768260012af127479fed806da7e7_1',
    ss58Format: 42,
    providers: {
      Pangolin_Network: 'wss://pangolin-rpc.darwinia.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Pangolin_Network',
    groups: ['TEST_NET'],
    nativeToken: 'PRING',
    decimals: 18,
    isEthereum: true,
    evmChainId: 43,
    blockExplorer: 'https://pangolin.subscan.io',
    supportSmartContract: [ContractType.evm]
  },
  bitcountry: {
    key: 'bitcountry',
    chain: 'Bit.Country - Alpha Net',
    genesisHash: '0xfff6fd94251f570d4c9cdf25a0475da0d7ad35160290da19dad8f9caf8bf31b5',
    ss58Format: 42,
    providers: {
      'Metaverse Foundation': 'wss://alphanet-rpc.bit.country'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Metaverse Foundation',
    groups: ['TEST_NET'],
    nativeToken: 'NUUM',
    decimals: 18
  },
  chainx: {
    key: 'chainx',
    chain: 'Chain X',
    active: false,
    genesisHash: '0x6ac13efb5b368b97b4934cef6edfdd99c2af51ba5109bfb8dacc116f9c584c10',
    ss58Format: 44,
    providers: {
      chainx: 'wss://mainnet.chainx.org/ws'
    },
    currentProvider: 'chainx',
    currentProviderMode: 'ws',
    groups: ['MAIN_NET'],
    nativeToken: 'PCX'
  },
  acala_testnet: {
    key: 'acala_testnet',
    active: false,
    chain: 'Acala Mandala TC7',
    genesisHash: '0x5c562e6300954998233c9a40b6b86f3028977e6d32d0da1af207738d19f98c1b',
    icon: 'polkadot',
    ss58Format: 42,
    providers: {
      OnFinality: 'wss://acala-mandala.api.onfinality.io/public-ws',
      Polkawallet: 'wss://mandala.polkawallet.io'
    },
    currentProviderMode: 'ws',
    currentProvider: 'OnFinality',
    groups: ['TEST_NET'],
    nativeToken: 'ACA',
    decimals: 12
  },
  turing: {
    chain: 'Turing Network',
    genesisHash: '0x0f62b701fb12d02237a33b84818c11f621653d2b1614c777973babf4652b535d',
    ss58Format: 51,
    providers: {
      turing: 'wss://rpc.turing.oak.tech',
      OnFinality: 'wss://turing.api.onfinality.io/public-ws',
      Dwellir: 'wss://turing-rpc.dwellir.com'
    },
    currentProviderMode: 'ws',
    currentProvider: 'turing',
    key: 'turing',
    active: false,
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2114,
    nativeToken: 'TUR',
    decimals: 10,
    crowdloanUrl: 'https://crowdloan.zeitgeist.pm/',
    getStakingOnChain: true,
    supportBonding: true
  },
  turingStaging: {
    chain: 'Turing Staging',
    genesisHash: '0xd54f0988402deb4548538626ce37e4a318441ea0529ca369400ebec4e04dfe4b',
    ss58Format: 51,
    providers: {
      turing: 'wss://rpc.turing-staging.oak.tech'
    },
    currentProviderMode: 'ws',
    currentProvider: 'turing',
    key: 'turingStaging',
    active: false,
    groups: ['TEST_NET'],
    paraId: 2114,
    nativeToken: 'TUR',
    decimals: 10,
    crowdloanUrl: 'https://crowdloan.zeitgeist.pm/',
    getStakingOnChain: true,
    supportBonding: true
  },
  mangatax: {
    chain: 'MangataX Public Testnet',
    genesisHash: '0x797fe0d6ea6917b5a36707961d819dca1826628123510730425c3bafc65ccf59',
    ss58Format: 42,
    providers: {
      mangatax: 'wss://roccoco-testnet-collator-01.mangatafinance.cloud'
    },
    currentProvider: 'mangatax',
    currentProviderMode: 'ws',
    active: false,
    key: 'mangatax',
    groups: ['TEST_NET'],
    nativeToken: 'MGAT',
    decimals: 18
  },
  mangatax_para: {
    chain: 'Mangata Kusama Mainnet',
    genesisHash: '0xd611f22d291c5b7b69f1e105cca03352984c344c4421977efaa4cbdd1834e2aa',
    ss58Format: 42,
    providers: {
      mangata: 'wss://prod-kusama-collator-01.mangatafinance.cloud',
      OnFinality: 'wss://mangata-x.api.onfinality.io/public-ws'
    },
    currentProviderMode: 'ws',
    currentProvider: 'mangata',
    key: 'mangatax_para',
    active: false,
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2110,
    nativeToken: 'MGX'
  },
  encointer: {
    chain: 'Encointer Network',
    genesisHash: '0x7dd99936c1e9e6d1ce7d90eb6f33bea8393b4bf87677d675aa63c9cb3e8c5b5b',
    ss58Format: 42,
    providers: {
      OnFinality: 'wss://encointer.api.onfinality.io/public-ws'
    },
    currentProvider: 'OnFinality',
    currentProviderMode: 'ws',
    active: false,
    key: 'encointer',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 1001,
    nativeToken: 'KSM'
  },
  litmus: {
    chain: 'Litmus',
    genesisHash: '0xda5831fbc8570e3c6336d0d72b8c08f8738beefec812df21ef2afc2982ede09c',
    ss58Format: 131,
    providers: {
      litmus: 'wss://rpc.litmus-parachain.litentry.io'
    },
    currentProviderMode: 'ws',
    currentProvider: 'litmus',
    key: 'litmus',
    active: false,
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2106,
    nativeToken: 'LIT',
    decimals: 12,
    crowdloanUrl: 'https://kusama-crowdloan.litentry.com/'
  },
  litentry: {
    key: 'litentry',
    chain: 'Litentry',
    genesisHash: '0x2fc8bb6ed7c0051bdcf4866c322ed32b6276572713607e3297ccf411b8f14aa9',
    ss58Format: 31,
    providers: {
      Litentry: 'wss://rpc.litentry-parachain.litentry.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Litentry',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2013,
    nativeToken: 'LIT',
    crowdloanUrl: 'https://crowdloan.litentry.com/',
    decimals: 12,
    coinGeckoKey: 'litentry'
  },
  tinkernet: {
    key: 'tinkernet',
    chain: 'InvArch Tinker Network',
    genesisHash: '0xd42e9606a995dfe433dc7955dc2a70f495f350f373daa200098ae84437816ad2',
    ss58Format: 117,
    providers: {
      Invarch: 'wss://tinker.invarch.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Invarch',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2125,
    nativeToken: 'TNKR',
    crowdloanUrl: 'https://invarch.network/tinkernet',
    decimals: 12
  },
  imbue_network: {
    key: 'imbue_network',
    chain: 'Imbue Kusama',
    genesisHash: '0xca93a37c913a25fa8fdb33c7f738afc39379cb71d37874a16d4c091a5aef9f89',
    ss58Format: 42,
    providers: {
      Imbue: 'wss://imbue-kusama.imbue.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Imbue',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2121,
    nativeToken: 'IMBU',
    decimals: 12
  },
  subspace_test: {
    key: 'subspace_test',
    chain: 'Subspace Testnet',
    genesisHash: '0x332ef6e751e25426e38996c51299dfc53bcd56f40b53dce2b2fc8442ae9c4a74_2',
    ss58Format: 2254,
    providers: {
      testnet: 'wss://test-rpc.subspace.network/ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'testnet',
    groups: ['TEST_NET'],
    nativeToken: 'tSSC',
    decimals: 18
  },
  subspace_gemini_2a: {
    key: 'subspace_gemini_2a',
    chain: 'Subspace Gemini 2a',
    genesisHash: '0x43d10ffd50990380ffe6c9392145431d630ae67e89dbc9c014cac2a417759101',
    ss58Format: 2254,
    providers: {
      'Europe 0': 'wss://eu-0.gemini-2a.subspace.network/ws',
      'Europe 1': 'wss://eu-1.gemini-2a.subspace.network/ws',
      'Europe 2': 'wss://eu-2.gemini-2a.subspace.network/ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Europe 0',
    groups: ['TEST_NET'],
    nativeToken: 'tSSC',
    decimals: 18,
    blockExplorer: 'https://subspace.subscan.io'
  },
  origintrail: {
    key: 'origintrail',
    chain: 'OriginTrail Parachain',
    genesisHash: '0xe7e0962324a3b86c83404dbea483f25fb5dab4c224791c81b756cfc948006174',
    ss58Format: 101,
    providers: {
      TraceLabs: 'wss://parachain-rpc.origin-trail.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'TraceLabs',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2043,
    nativeToken: 'OTP',
    decimals: 12
  },
  // kapex: {
  //   key: 'kapex',
  //   chain: 'Kapex',
  //   genesisHash: '0x7838c3c774e887c0a53bcba9e64f702361a1a852d5550b86b58cd73827fa1e1e',
  //   ss58Format: 2007,
  //   providers: {
  //     Totem: 'wss://k-ui.kapex.network'
  //   },
  //   active: false,
  //   currentProviderMode: 'ws',
  //   currentProvider: 'Totem',
  //   groups: ['POLKADOT_PARACHAIN'],
  //   paraId: 2007,
  //   nativeToken: 'KAPEX',
  //   decimals: 12
  // },
  dorafactory: {
    key: 'dorafactory',
    chain: 'Dorafactory Network',
    genesisHash: '0x577d331ca43646f547cdaa07ad0aa387a383a93416764480665103081f3eaf14',
    ss58Format: 128,
    providers: {
      DORA: 'wss://kusama.dorafactory.org'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'DORA',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2115,
    nativeToken: 'DORA',
    coinGeckoKey: 'dora-factory',
    decimals: 12
  },
  bajun: {
    key: 'bajun',
    chain: 'Bajun Kusama',
    genesisHash: '0x35a06bfec2edf0ff4be89a6428ccd9ff5bd0167d618c5a0d4341f9600a458d14',
    ss58Format: 1337,
    providers: {
      AjunaNetwork: 'wss://rpc-parachain.bajun.network',
      OnFinality: 'wss://bajun.api.onfinality.io/public-ws',
      Dwellir: 'wss://bajun-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'AjunaNetwork',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2119,
    nativeToken: 'BAJU',
    decimals: 12
  },
  listen: {
    key: 'listen',
    chain: 'Listen Network',
    genesisHash: '0x48eb7f3fff34e702aa2b504674df8f8afbf9889f804e3088c0cb662e433552a0',
    ss58Format: 42,
    providers: {
      'Listen Foundation 1': 'wss://rpc.mainnet.listen.io',
      'Listen Foundation 2': 'wss://wss.mainnet.listen.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Listen Foundation 1',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2118,
    nativeToken: 'LT',
    decimals: 12
  },
  kabocha: {
    key: 'kabocha',
    chain: 'Kabocha',
    genesisHash: '0xfeb426ca713f0f46c96465b8f039890370cf6bfd687c9076ea2843f58a6ae8a7',
    ss58Format: 27,
    providers: {
      JelliedOwl: 'wss://kabocha.jelliedowl.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'JelliedOwl',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2113,
    nativeToken: 'KAB',
    decimals: 12
  },
  gmdie: {
    key: 'gmdie',
    chain: 'GM Parachain',
    genesisHash: '0x19a3733beb9cb8a970a308d835599e9005e02dc007a35440e461a451466776f8',
    ss58Format: 7013,
    providers: {
      gmDie: 'wss://kusama.gmordie.com',
      bLdNodes: 'wss://ws.gm.bldnodes.org',
      TerraBioDAO: 'wss://ws-node-gm.terrabiodao.org'
    },
    active: false,
    currentProvider: 'bLdNodes',
    currentProviderMode: 'ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2123,
    nativeToken: 'FREN',
    decimals: 12
  },
  ternoa: {
    key: 'ternoa',
    chain: 'Ternoa Mainnet',
    genesisHash: '0x6859c81ca95ef624c9dfe4dc6e3381c33e5d6509e35e147092bfbc780f777c4e',
    ss58Format: 42,
    providers: {
      ternoa: 'wss://mainnet.ternoa.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'ternoa',
    nativeToken: 'CAPS',
    groups: ['MAIN_NET'],
    decimals: 18,
    coinGeckoKey: 'coin-capsule',
    supportBonding: true,
    getStakingOnChain: true
  },
  tanganika: {
    key: 'tanganika',
    chain: 'DataHighway Tanganika',
    genesisHash: '0xeacdd2d5b42de9769ccbb6e8d9013ab0d90ab105bf601d4aac53e874c145ec21',
    ss58Format: 33,
    providers: {
      tanganika: 'wss://tanganika.datahighway.com'
    },
    active: false,
    currentProvider: 'tanganika',
    currentProviderMode: 'ws',
    nativeToken: 'DHX',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2116,
    decimals: 18
  },
  amplitude: {
    key: 'amplitude',
    chain: 'Amplitude',
    genesisHash: '0xcceae7f3b9947cdb67369c026ef78efa5f34a08fe5808d373c04421ecf4f1aaf',
    ss58Format: 57,
    providers: {
      amplitude: 'wss://rpc-amplitude.pendulumchain.tech'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'amplitude',
    nativeToken: 'AMPE',
    groups: ['KUSAMA_PARACHAIN'],
    decimals: 12,
    paraId: 2124,
    supportBonding: true,
    getStakingOnChain: true
  },
  pendulum: {
    key: 'pendulum',
    chain: 'Pendulum',
    genesisHash: '0xcceae7f3b9947cdb67369c026ef78efa5f34a08fe5808d373c04421ecf4f1aaf',
    ss58Format: 56,
    providers: {},
    active: false,
    currentProviderMode: 'ws',
    currentProvider: null,
    nativeToken: 'PEN',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2094,
    decimals: 12
  },
  gear_testnet: {
    key: 'gear_testnet',
    chain: 'Gear Staging Testnet',
    genesisHash: '0x6f022bd353c56b3e441507e1173601fd9dc0fb7547e6a95bbaf9b21f311bcab6',
    ss58Format: 42,
    providers: {
      gear: 'wss://rpc-node.gear-tech.io'
    },
    currentProvider: 'gear',
    active: false,
    currentProviderMode: 'ws',
    nativeToken: 'Unit',
    decimals: 12,
    groups: ['TEST_NET']
  },
  snow: {
    key: 'snow',
    chain: 'Snow Network',
    genesisHash: '0xb34f6cd03a41f0fab38ba9fd5b11cce5f303633c46f39f0c6fdc7c3c602bafa9',
    ss58Format: 2207,
    providers: {
      snow: 'wss://snow-rpc.icenetwork.io'
    },
    currentProvider: 'snow',
    active: false,
    currentProviderMode: 'ws',
    nativeToken: 'ICZ',
    decimals: 18,
    paraId: 2129,
    groups: ['KUSAMA_PARACHAIN']
  },
  arctic_testnet: {
    key: 'arctic_testnet',
    chain: 'Arctic Testnet',
    genesisHash: '0x5c4207232d344710a176b1982471acf9b058f40b4a57470c25410b68b684c766',
    ss58Format: 2207,
    providers: {
      arctic: 'wss://arctic-rpc.icenetwork.io:9944'
    },
    currentProvider: 'arctic',
    active: false,
    currentProviderMode: 'ws',
    nativeToken: 'ICY',
    decimals: 18,
    groups: ['TEST_NET']
  },
  ternoa_alphanet: {
    key: 'ternoa_alphanet',
    chain: 'Ternoa Alphanet',
    genesisHash: '0x18bcdb75a0bba577b084878db2dc2546eb21504eaad4b564bb7d47f9d02b6ace',
    ss58Format: 42,
    providers: {
      ternoa: 'wss://alphanet.ternoa.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'ternoa',
    nativeToken: 'CAPS',
    groups: ['TEST_NET'],
    decimals: 18,
    supportBonding: true,
    getStakingOnChain: true
  },
  calamari_test: {
    key: 'calamari_test',
    chain: 'Calamari Staging',
    genesisHash: '0x2ae061f08422b6503b8aa5f401242a209999669c3b8945f814dc096fb1a977bd',
    ss58Format: 78,
    providers: {
      calamari_test: 'wss://c1.calamari.seabird.systems'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'calamari_test',
    nativeToken: 'KMA',
    groups: ['TEST_NET'],
    decimals: 12,
    supportBonding: true,
    getStakingOnChain: true
  },
  boba: {
    key: 'boba',
    chain: 'Boba Network',
    genesisHash: '0xc7d53ee64d57e783b539c09923069280b95a212a36e84b308e15ad6f09a6fd6e',
    ss58Format: 0,
    providers: {
      'Read RPC': 'https://lightning-replica.boba.network',
      'Write RPC': 'https://mainnet.boba.network'
    },
    active: false,
    currentProviderMode: 'http',
    currentProvider: 'Write RPC',
    groups: ['MAIN_NET'],
    isEthereum: true,
    nativeToken: 'ETH',
    coinGeckoKey: 'ethereum',
    decimals: 18,
    evmChainId: 288,
    supportBonding: false,
    getStakingOnChain: false,
    abiExplorer: 'https://blockexplorer.boba.network',
    supportSmartContract: [ContractType.evm]
  },
  boba_rinkeby: {
    key: 'boba_rinkeby',
    chain: 'Boba Rinkeby (Testnet)',
    genesisHash: '0x6854c3f614bd5096f3b4cf142c9fbad8b95ced2eda2f5d64f97e8136b80e3677',
    ss58Format: 0,
    providers: {
      RPC: 'https://rinkeby.boba.network'
    },
    active: false,
    currentProviderMode: 'http',
    currentProvider: 'RPC',
    groups: ['TEST_NET'],
    isEthereum: true,
    nativeToken: 'ETH',
    decimals: 18,
    evmChainId: 28,
    supportBonding: false,
    getStakingOnChain: false,
    abiExplorer: 'https://blockexplorer.rinkeby.boba.network',
    supportSmartContract: [ContractType.evm]
  },
  bobabeam: {
    key: 'bobabeam',
    chain: 'Bobabeam',
    genesisHash: '0x6330c695da0822ab704c71ec3e26e14999e8074754fa1923059dd9a3e0d39c07',
    ss58Format: 0,
    providers: {
      RPC: 'https://bobabeam.boba.network',
      'Replica RPC': 'https://replica.bobabeam.boba.network'
    },
    active: false,
    currentProviderMode: 'http',
    coinGeckoKey: 'boba-network',
    currentProvider: 'RPC',
    groups: ['MAIN_NET'],
    isEthereum: true,
    nativeToken: 'BOBA',
    decimals: 18,
    evmChainId: 1294,
    supportBonding: false,
    getStakingOnChain: false,
    abiExplorer: 'https://blockexplorer.bobabeam.boba.network',
    supportSmartContract: [ContractType.evm]
  },
  bobabase: {
    key: 'bobabase',
    chain: 'Bobabase (Testnet)',
    genesisHash: '0x66482d8e7d148ce68bc546fc4e2f5e0631d4fc816d5327fb1f688a8fbad01d6a',
    ss58Format: 0,
    providers: {
      RPC: 'https://bobabase.boba.network',
      'Replica RPC': 'https://replica.bobabase.boba.network'
    },
    active: false,
    currentProviderMode: 'http',
    currentProvider: 'RPC',
    groups: ['TEST_NET'],
    isEthereum: true,
    nativeToken: 'BOBA',
    decimals: 18,
    evmChainId: 1297,
    supportBonding: false,
    getStakingOnChain: false,
    abiExplorer: 'https://blockexplorer.bobabase.boba.network',
    supportSmartContract: [ContractType.evm]
  },
  amplitude_test: {
    key: 'amplitude_test',
    chain: 'Amplitude Testnet',
    genesisHash: '0x67221cd96c1551b72d55f65164d6a39f31b570c77a05c90e31931b0e2f379e13',
    ss58Format: 57,
    providers: {
      pendulum: 'wss://rpc-foucoco.pendulumchain.tech'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'pendulum',
    groups: ['TEST_NET'],
    nativeToken: 'AMPE',
    decimals: 12,
    supportBonding: true,
    getStakingOnChain: true
  },
  kilt_peregrine: {
    key: 'kilt_peregrine',
    chain: 'KILT Peregrine',
    genesisHash: '0xa0c6e3bac382b316a68bca7141af1fba507207594c761076847ce358aeedcc21',
    ss58Format: 38,
    providers: {
      kilt: 'wss://peregrine.kilt.io/parachain-public-ws/'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'kilt',
    groups: ['TEST_NET'],
    nativeToken: 'PILT',
    decimals: 15,
    supportBonding: true,
    getStakingOnChain: true
  },
  xx_network: {
    key: 'xx_network',
    chain: 'XX Network',
    genesisHash: '0x50dd5d206917bf10502c68fb4d18a59fc8aa31586f4e8856b493e43544aa82aa',
    ss58Format: 55,
    providers: {
      'XX Foundation': 'wss://rpc.xx.network',
      dwellir: 'wss://xxnetwork-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'XX Foundation',
    groups: ['MAIN_NET'],
    nativeToken: 'xx',
    decimals: 9,
    coinGeckoKey: 'xxcoin'
  },
  watr_network: {
    key: 'watr_network',
    chain: 'Watr Network',
    genesisHash: '0xb53c620c41860278fa3068a5367c8eedceefce8a7c29237d830bc09a71737b5d',
    ss58Format: 19,
    providers: {
      watr: 'wss://rpc.dev.watr.org'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'watr',
    groups: ['TEST_NET'],
    nativeToken: 'WATRD',
    decimals: 18,
    coinGeckoKey: 'watr'
  },
  watr_network_evm: {
    key: 'watr_network_evm',
    chain: 'Watr Network - EVM',
    genesisHash: '0xb53c620c41860278fa3068a5367c8eedceefce8a7c29237d830bc09a71737b5d_evm',
    ss58Format: 19,
    providers: {
      watr: 'https://rpc.dev.watr.org'
    },
    active: false,
    isEthereum: true,
    currentProviderMode: 'http',
    currentProvider: 'watr',
    groups: ['TEST_NET'],
    nativeToken: 'WATRD',
    decimals: 18,
    evmChainId: 688,
    coinGeckoKey: 'watr',
    supportSmartContract: [ContractType.evm]
  },
  subspace_gemini_3a: {
    key: 'subspace_gemini_3a',
    chain: 'Subspace Gemini 3a',
    genesisHash: '0x8797298eb8cd5c3b3a08b6c1a6ed7809ee40e7f80fc0acf3cdb3fde00a435b2f',
    ss58Format: 2254,
    providers: {
      'Europe 0': 'wss://eu-0.gemini-3a.subspace.network/ws',
      'Europe 1': 'wss://eu-1.gemini-3a.subspace.network/ws',
      'Europe 2': 'wss://eu-2.gemini-3a.subspace.network/ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Europe 0',
    groups: ['TEST_NET'],
    nativeToken: 'tSSC',
    decimals: 18
  },
  fusotao: {
    key: 'fusotao',
    chain: 'Fusotao',
    genesisHash: '0xa7113159e275582ee71ee499b24378a2416f34dc5aaf714443f0d11c6c3d99d3',
    ss58Format: 42,
    providers: {
      fusotao: 'wss://gateway.mainnet.octopus.network/fusotao/0efwa9v0crdx4dg3uj8jdmc5y7dj4ir2'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'fusotao',
    groups: ['MAIN_NET'],
    nativeToken: 'TAO',
    decimals: 18,
    coinGeckoKey: 'fusotao'
  },
  discovol: {
    key: 'discovol',
    chain: 'Discovol',
    genesisHash: '0x2dfbcf7700297bd8ce07a4665ab39e2ed1a3790df783b936988c85eb87e38bee',
    ss58Format: 42,
    providers: {
      discovol: 'wss://gateway.mainnet.octopus.network/discovol/afpft46l1egfhrv8at5pfyrld03zseo1'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'discovol',
    groups: ['MAIN_NET'],
    nativeToken: 'DISC',
    decimals: 14
  },
  discovol_testnet: {
    key: 'discovol_testnet',
    chain: 'Discovol (Testnet)',
    genesisHash: '0xdc1922b7f60b4925091bbfdd912684c449de7a7cdc5592e9eab11fee55fa53ec',
    ss58Format: 42,
    providers: {
      discovol_testnet: 'wss://gateway.testnet.octopus.network/discovol/o4urcey87y4n1qimhfrad92gzs315z9h'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'discovol_testnet',
    groups: ['TEST_NET'],
    nativeToken: 'DISC',
    decimals: 14
  },
  atocha: {
    key: 'atocha',
    chain: 'Atocha',
    genesisHash: '0x1f11f745be512a17f39b571a9391b5ee6747b900c1db98176828e4a1346dbe9b',
    ss58Format: 42,
    providers: {
      atocha: 'wss://gateway.mainnet.octopus.network/atocha/jungxomf4hdcfocwcalgoiz64g9avjim'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'atocha',
    groups: ['MAIN_NET'],
    nativeToken: 'ATO',
    decimals: 18,
    coinGeckoKey: 'atocha-coin'
  },
  myriad: {
    key: 'myriad',
    chain: 'Myriad',
    genesisHash: '0x74ed91fbc18497f011290f9119a2217908649170337b6414a2d44923ade07063',
    ss58Format: 42,
    providers: {
      myriad: 'wss://gateway.mainnet.octopus.network/myriad/a4cb0a6e30ff5233a3567eb4e8cb71e0'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'myriad',
    groups: ['MAIN_NET'],
    nativeToken: 'MYRIA',
    decimals: 18,
    coinGeckoKey: 'myriad-social'
  },
  deBio: {
    key: 'deBio',
    chain: 'DeBio',
    genesisHash: '0x996800af345b3109acdada9913e36d1efa98b89e7dcd0b61b70fdbfc13b2fa50',
    ss58Format: 42,
    providers: {
      deBio: 'wss://gateway.mainnet.octopus.network/debionetwork/ae48005a0c7ecb4053394559a7f4069e'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'deBio',
    groups: ['MAIN_NET'],
    nativeToken: 'DBIO',
    decimals: 18,
    coinGeckoKey: 'debio-network'
  },
  barnacle: {
    key: 'barnacle',
    chain: 'Barnacle',
    genesisHash: '0xb3d6017fd8f67d1d9970a010ee1bbf0bc12c5ff2d2c7b9c311a11332cb7b3a53',
    ss58Format: 42,
    providers: {
      barnacle: 'wss://gateway.testnet.octopus.network/barnacle0928/9mw012zuf27soh7nrrq3a4p0s2ti3cyn'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'barnacle',
    groups: ['TEST_NET'],
    nativeToken: 'BAR',
    decimals: 18
  },
  barnacle_evm: {
    key: 'barnacle_evm',
    chain: 'Barnacle EVM',
    genesisHash: '0x49c76ef3ec0e3931db706b8df850b3e57bf0637a74ac72d0ae3d8242bc0c2a35',
    ss58Format: 42,
    providers: {
      barnacle_evm: 'wss://gateway.testnet.octopus.network/barnacle-evm/wj1hhcverunusc35jifki19otd4od1n5'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'barnacle_evm',
    groups: ['TEST_NET'],
    nativeToken: 'EBAR',
    decimals: 18,
    isEthereum: true
  },
  collectives: {
    key: 'collectives',
    chain: 'Collectives',
    genesisHash: '0x46ee89aa2eedd13e988962630ec9fb7565964cf5023bb351f2b6b25c1b68b0b2',
    ss58Format: 0,
    providers: {
      viaParity: 'wss://polkadot-collectives-rpc.polkadot.io'
    },
    paraId: 1001,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'viaParity',
    groups: ['POLKADOT_PARACHAIN'],
    nativeToken: 'DOT',
    decimals: 10
  },
  ajunaPolkadot: {
    key: 'ajunaPolkadot',
    chain: 'Ajuna Network',
    genesisHash: '0xe358eb1d11b31255a286c12e44fe6780b7edb171d657905a97e39f71d9c6c3ee',
    ss58Format: 1328,
    providers: {
      viaAjunaNetwork: 'wss://rpc-parachain.ajuna.network'
    },
    paraId: 2028,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'viaAjunaNetwork',
    groups: ['POLKADOT_PARACHAIN'],
    nativeToken: 'AJUN',
    decimals: 12
  },
  bitgreen: {
    key: 'bitgreen',
    chain: 'Bitgreen',
    genesisHash: '0xc14597baeccb232d662770d2d50ae832ca8c3192693d2b0814e6433f2888ddd6',
    ss58Format: 42,
    providers: {
      viaBitgreen: 'wss://mainnet.bitgreen.org'
    },
    paraId: 2048,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'viaBitgreen',
    groups: ['POLKADOT_PARACHAIN'],
    nativeToken: 'BBB',
    decimals: 18
  },
  frequency: {
    key: 'frequency',
    chain: 'Frequency',
    genesisHash: '0x4a587bf17a404e3572747add7aab7bbe56e805a5479c6c436f07f36fcc8d3ae1',
    ss58Format: 90,
    providers: {
      'Frequency 0': 'wss://0.rpc.frequency.xyz',
      'Frequency 1': 'wss://1.rpc.frequency.xyz'
    },
    paraId: 2091,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Frequency 1',
    groups: ['POLKADOT_PARACHAIN'],
    nativeToken: 'FRQCY',
    decimals: 8
  },
  hashedNetwork: {
    key: 'hashedNetwork',
    chain: 'Hashed Network',
    genesisHash: '0x331645ae3db556c7754a82f79cece12cce3420975d5b0219d51b1cb4f6ddc21c',
    ss58Format: 42,
    providers: {
      'Hashed Systems': 'wss://c1.hashed.network'
    },
    paraId: 2093,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Hashed Systems',
    groups: ['POLKADOT_PARACHAIN'],
    nativeToken: 'HASH',
    decimals: 18
  },
  kapex: {
    key: 'kapex',
    chain: 'Kapex',
    genesisHash: '0x7838c3c774e887c0a53bcba9e64f702361a1a852d5550b86b58cd73827fa1e1e',
    ss58Format: 2007,
    providers: {
      viaTotem: 'wss://k-ui.kapex.network'
    },
    paraId: 2007,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'viaTotem',
    groups: ['POLKADOT_PARACHAIN'],
    nativeToken: 'KPX',
    decimals: 12
  },
  kylinNetwork: {
    key: 'kylinNetwork',
    chain: 'Kylin Network',
    genesisHash: '0xf2584690455deda322214e97edfffaf4c1233b6e4625e39478496b3e2f5a44c5',
    ss58Format: 42,
    providers: {
      'Kylin Network': 'wss://polkadot.kylin-node.co.uk'
    },
    paraId: 2052,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Kylin Network',
    groups: ['POLKADOT_PARACHAIN'],
    nativeToken: 'KYL',
    decimals: 18,
    coinGeckoKey: 'kylin-network'
  },
  ipci: {
    key: 'ipci',
    chain: 'DAO IPCI',
    genesisHash: '0x6f0f071506de39058fe9a95bbca983ac0e9c5da3443909574e95d52eb078d348',
    ss58Format: 32,
    providers: {
      viaAiralab: 'wss://kusama.rpc.ipci.io'
    },
    paraId: 2222,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'viaAiralab',
    groups: ['KUSAMA_PARACHAIN'],
    nativeToken: 'MITO',
    decimals: 12
  },
  kico: {
    key: 'kico',
    chain: 'KICO',
    genesisHash: '0x52149c30c1eb11460dce6c08b73df8d53bb93b4a15d0a2e7fd5dafe86a73c0da',
    ss58Format: 42,
    providers: {
      'DICO Foundation': 'wss://rpc.kico.dico.io'
    },
    paraId: 2107,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'DICO Foundation',
    groups: ['KUSAMA_PARACHAIN'],
    nativeToken: 'KICO',
    decimals: 14
  },
  luhnNetwork: {
    key: 'luhnNetwork',
    chain: 'Luhn Network',
    genesisHash: '0xba713fdbf674083c5541c1439b83d8e593e1105f35f11954bcc50d0bf9607873',
    ss58Format: 42,
    providers: {
      'Hashed Systems': 'wss://c1.luhn.network'
    },
    paraId: 2232,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Hashed Systems',
    groups: ['KUSAMA_PARACHAIN'],
    nativeToken: 'LUHN',
    decimals: 18
  },
  pichiu: {
    key: 'pichiu',
    chain: 'Pichiu Network',
    genesisHash: '0x0e06260459b4f9034aba0a75108c08ed73ea51d2763562749b1d3600986c4ea5',
    ss58Format: 42,
    providers: {
      'Kylin Network': 'wss://kusama.kylin-node.co.uk',
      OnFinality: 'wss://pichiu.api.onfinality.io/public-ws'
    },
    paraId: 2102,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'OnFinality',
    groups: ['KUSAMA_PARACHAIN'],
    nativeToken: 'PCHU',
    decimals: 18
  },
  riodefi: {
    key: 'riodefi',
    chain: 'RioDeFi',
    genesisHash: '0x70310f31bdb878e9920121807ee46236bda2e00c10eb105a40b386bd7ad16906',
    ss58Format: 42,
    providers: {
      RioProtocol: 'wss://rio-kusama.riocorenetwork.com'
    },
    paraId: 2227,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'RioProtocol',
    groups: ['KUSAMA_PARACHAIN'],
    nativeToken: 'UNIT',
    decimals: 12
  },
  automata: {
    key: 'automata',
    chain: 'Automata',
    genesisHash: '0xc8eda34601b5a48c73f47ee39a3a86a858c34f044185b17dc7d5ad155813dc63',
    ss58Format: 42,
    providers: {
      'Automata Network': 'wss://api.ata.network',
      OnFinality: 'wss://automata.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'OnFinality',
    groups: ['MAIN_NET'],
    nativeToken: 'ATA',
    decimals: 18,
    coinGeckoKey: 'automata'
  },
  creditcoin: {
    key: 'creditcoin',
    chain: 'Creditcoin',
    genesisHash: '0xdd954cbf4000542ef1a15bca509cd89684330bee5e23766c527cdb0d7275e9c2',
    ss58Format: 42,
    providers: {
      'Creditcoin Foundation': 'wss://rpc.mainnet.creditcoin.network/ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Creditcoin Foundation',
    groups: ['MAIN_NET'],
    nativeToken: 'CTC',
    decimals: 18,
    coinGeckoKey: 'creditcoin-2'
  },
  crownSterling: {
    key: 'crownSterling',
    chain: 'Crown Sterling',
    genesisHash: '0xce24ecf534daea9cd46e425659ef4950a57dd29d07272b423220129c323a64b7',
    ss58Format: 0,
    providers: {
      'Crown Sterling': 'wss://blockchain.crownsterling.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Crown Sterling',
    groups: ['MAIN_NET'],
    nativeToken: 'CSOV',
    decimals: 12,
    coinGeckoKey: 'crownsterling'
  },
  dockPosMainnet: {
    key: 'dockPosMainnet',
    chain: 'Dock',
    genesisHash: '0x6bfe24dca2a3be10f22212678ac13a6446ec764103c0f3471c71609eac384aae',
    ss58Format: 22,
    providers: {
      'Dock Association': 'wss://mainnet-node.dock.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Dock Association',
    groups: ['MAIN_NET'],
    nativeToken: 'DOCK',
    decimals: 6,
    coinGeckoKey: 'dock',
    blockExplorer: 'https://dock.subscan.io'
  },
  kusari: {
    key: 'kusari',
    chain: 'Kusari',
    genesisHash: '0x4959f8d87d40d9ef516459ff177111bb03d875e5a7ed69282f6b689a707b69f5',
    ss58Format: 42,
    providers: {
      Swapdex: 'wss://ws.kusari.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Swapdex',
    groups: ['MAIN_NET'],
    nativeToken: 'KSI',
    decimals: 18
  },
  logion: {
    key: 'logion',
    chain: 'logion Standalone',
    genesisHash: '0xe9d7420a5f73edef005ccb8e043500aa5b2458f173912184ea93c14dc035a203',
    ss58Format: 42,
    providers: {
      Logion: 'wss://rpc01.logion.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Logion',
    groups: ['MAIN_NET'],
    nativeToken: 'LGNT',
    decimals: 18
  },
  neatcoin: {
    key: 'neatcoin',
    chain: 'Neatcoin',
    genesisHash: '0xfbb541421d30423c9a753ffa844b64fd44d823f513bf49e3b73b3a656309a595',
    ss58Format: 48,
    providers: {
      Neatcoin: 'wss://rpc.neatcoin.org/ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Neatcoin',
    groups: ['MAIN_NET'],
    nativeToken: 'NEAT',
    decimals: 12
  },
  nftmart: {
    key: 'nftmart',
    chain: 'NFTMart',
    genesisHash: '0xfcf9074303d8f319ad1bf0195b145871977e7c375883b834247cb01ff22f51f9',
    ss58Format: 12191,
    providers: {
      NFTMart: 'wss://mainnet.nftmart.io/rpc/ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'NFTMart',
    groups: ['MAIN_NET'],
    nativeToken: 'NMT',
    decimals: 12,
    coinGeckoKey: 'nftmart-token'
  },
  polymesh: {
    key: 'polymesh',
    chain: 'Polymesh Mainnet',
    genesisHash: '0x6fbd74e5e1d0a61d52ccfe9d4adaed16dd3a7caa37c6bc4d0c2fa12e8b2f4063',
    ss58Format: 12,
    providers: {
      Polymath: 'wss://mainnet-rpc.polymesh.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Polymath',
    groups: ['MAIN_NET'],
    nativeToken: 'POLYX',
    decimals: 6,
    coinGeckoKey: 'polymesh',
    blockExplorer: 'https://polymesh.subscan.io'
  },
  riochain: {
    key: 'riochain',
    chain: 'RioChain',
    genesisHash: '0xd8c6dc2e057b94d05c870a7b39bfb30ae10202ed9cf7731d28dafcfe9458e307',
    ss58Format: 42,
    providers: {
      RioChain: 'wss://node.v1.riochain.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'RioChain',
    groups: ['MAIN_NET'],
    nativeToken: 'RFUEL',
    decimals: 12,
    coinGeckoKey: 'rio-defi'
  },
  sherpax: {
    key: 'sherpax',
    chain: 'SherpaX',
    genesisHash: '0xe195ef16d0c628b5cab1486a233865def6e71f8b7814dd058a6b93a85118b796',
    ss58Format: 44,
    providers: {
      ChainX: 'wss://mainnet.sherpax.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'ChainX',
    groups: ['MAIN_NET'],
    nativeToken: 'KSX',
    decimals: 18
  },
  'sora-substrate': {
    key: 'sora-substrate',
    chain: 'SORA',
    genesisHash: '0x7e4e32d0feafd4f9c9414b0be86373f9a1efa904809b683453a9af6856d38ad5',
    ss58Format: 69,
    providers: {
      'SORA Parliament Ministry of Finance #2': 'wss://mof2.sora.org',
      'SORA Parliament Ministry of Finance': 'wss://ws.mof.sora.org',
      'SORA Parliament Ministry of Finance #3': 'wss://mof3.sora.org',
      OnFinality: 'wss://sora.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'SORA Parliament Ministry of Finance #2',
    groups: ['MAIN_NET'],
    nativeToken: 'XOR',
    decimals: 18,
    coinGeckoKey: 'sora',
    blockExplorer: 'https://sora.subscan.io'
  },
  swapdex: {
    key: 'swapdex',
    chain: 'Swapdex',
    genesisHash: '0x15bac4f0a9aad3f46c5fc067fdb59b3ff29738dcd491fe5e37b4b76121163471',
    ss58Format: 42,
    providers: {
      Swapdex: 'wss://ws.swapdex.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Swapdex',
    groups: ['MAIN_NET'],
    nativeToken: 'SDX',
    decimals: 18,
    coinGeckoKey: 'swapdex'
  },
  '3dpass': {
    key: '3dpass',
    chain: '3DPass',
    genesisHash: '0x6c5894837ad89b6d92b114a2fb3eafa8fe3d26a54848e3447015442cd6ef4e66',
    ss58Format: 71,
    providers: {
      '3dpass': 'wss://rpc2.3dpass.org'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: '3dpass',
    groups: ['MAIN_NET'],
    nativeToken: 'P3D',
    decimals: 12
  },
  alephSmartNet: {
    key: 'alephSmartNet',
    chain: 'Aleph Zero Smartnet',
    genesisHash: '0x6153e2745a56d188365372b5cce283dfddbb96b17e9bb396cceb4630103ff92b',
    ss58Format: 42,
    providers: {
      alephSmartNet: 'wss://ws-smartnet.test.azero.dev'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'alephSmartNet',
    groups: ['TEST_NET'],
    nativeToken: 'SZERO',
    decimals: 12
  },
  kulupu: {
    key: 'kulupu',
    chain: 'Kulupu',
    genesisHash: '0xf7a99d3cb92853d00d5275c971c132c074636256583fee53b3bbe60d7b8769ba',
    ss58Format: 16,
    providers: {
      Kulupu: 'wss://rpc.kulupu.corepaper.org/ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Kulupu',
    groups: ['MAIN_NET'],
    nativeToken: 'KLP',
    decimals: 12,
    coinGeckoKey: 'kulupu',
    blockExplorer: 'https://kulupu.subscan.io'
  },
  joystream: {
    key: 'joystream',
    chain: 'Joystream',
    genesisHash: '0x6b5e488e0fa8f9821110d5c13f4c468abcd43ce5e297e62b34c53c3346465956',
    ss58Format: 126,
    providers: {
      Jsgenesis: 'wss://rpc.joystream.org'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Jsgenesis',
    groups: ['MAIN_NET'],
    nativeToken: 'JOY',
    decimals: 10
  }
};

function getGenesisHashes () {
  const result: Record<string, string> = {};

  for (const [key, networkJson] of Object.entries(PREDEFINED_NETWORKS)) {
    if (networkJson.genesisHash !== 'UNKNOWN' && networkJson.genesisHash !== 'UPDATING') {
      result[networkJson.genesisHash] = key;
    }
  }

  return result;
}

export const PREDEFINED_GENESIS_HASHES = getGenesisHashes();
