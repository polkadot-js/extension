// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';

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
      'light client': 'light://substrate-connect/polkadot'
      // Pinknode: 'wss://rpc.pinknode.io/polkadot/explorer' // https://github.com/polkadot-js/apps/issues/5721
    },
    active: true,
    currentProvider: 'OnFinality',
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
      'light client': 'light://substrate-connect/kusama'
      // Pinknode: 'wss://rpc.pinknode.io/kusama/explorer' // https://github.com/polkadot-js/apps/issues/5721
    },
    active: true,
    currentProvider: 'OnFinality',
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
      Dwellir: 'wss://statemint-rpc.dwellir.com'
    },
    active: false,
    currentProvider: 'OnFinality',
    currentProviderMode: 'ws',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 1000,
    nativeToken: 'KSM',
    decimals: 10
  },
  acala: {
    key: 'acala',
    chain: 'Acala',
    genesisHash: '0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c',
    ss58Format: 10,
    providers: {
      'Acala Foundation 0': 'wss://acala-rpc-0.aca-api.network',
      'Acala Foundation 1': 'wss://acala-rpc-1.aca-api.network',
      // 'Acala Foundation 2': 'wss://acala-rpc-2.aca-api.network/ws', // https://github.com/polkadot-js/apps/issues/6965
      'Acala Foundation 3': 'wss://acala-rpc-3.aca-api.network/ws',
      'Polkawallet 0': 'wss://acala.polkawallet.io',
      OnFinality: 'wss://acala-polkadot.api.onfinality.io/public-ws',
      Dwellir: 'wss://acala-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Dwellir',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2000,
    nativeToken: 'ACA',
    crowdloanUrl: 'https://distribution.acala.network/',
    decimals: 12,
    coinGeckoKey: 'acala'
  },
  moonbeam: {
    key: 'moonbeam',
    chain: 'Moonbeam',
    genesisHash: '0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d',
    ss58Format: 1284,
    providers: {
      'Moonbeam Foundation': 'wss://wss.api.moonbeam.network',
      OnFinality: 'wss://moonbeam.api.onfinality.io/public-ws',
      Dwellir: 'wss://moonbeam-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'OnFinality',
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
    abiExplorer: 'https://api-moonbeam.moonscan.io/api?module=contract&action=getabi'
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
      PinkNode: 'wss://public-rpc.pinknode.io/astar'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Dwellir',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2006,
    nativeToken: 'ASTR',
    crowdloanUrl: 'https://crowdloan.astar.network/#/',
    decimals: 18,
    getStakingOnChain: true,
    supportBonding: true,
    coinGeckoKey: 'astar'
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
      PinkNode: 'wss://public-rpc.pinknode.io/astar'
    },
    isEthereum: true,
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'OnFinality',
    groups: ['POLKADOT_PARACHAIN'],
    nativeToken: 'ASTR',
    crowdloanUrl: 'https://crowdloan.astar.network/#/',
    decimals: 18,
    coinGeckoKey: 'astar',
    evmChainId: 592,
    paraId: 2006
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
    currentProvider: 'OnFinality',
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
    currentProvider: 'OnFinality',
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
    currentProvider: 'OnFinality',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2002,
    evmChainId: 1024,
    nativeToken: 'CLV',
    crowdloanUrl: 'https://lucky.clover.finance/?type=support',
    decimals: 18,
    coinGeckoKey: 'clover-finance'
  },
  hydradx_main: {
    key: 'hydradx_main',
    chain: 'HydraDX',
    genesisHash: '0xafdc188f45c71dacbaa0b62e16a91f726c7b8699a9748cdf715459de6b7f366d',
    ss58Format: 63,
    providers: {
      'Galactic Council': 'wss://rpc-01.hydradx.io',
      Dwellir: 'wss://hydradx-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Dwellir',
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
      'Commonwealth Labs': 'wss://mainnet.edgewa.re',
      OnFinality: 'wss://edgeware.api.onfinality.io/public-ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'OnFinality',
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
    currentProvider: 'OnFinality',
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
  manta: {
    key: 'manta',
    chain: 'Manta',
    genesisHash: '0x7822fe86be209e140e1bdb80fb09539d1825e3d1dfee79ce37c336a832a26d48',
    ss58Format: 77,
    providers: {
      'Manta Kuhlii': 'wss://kuhlii.manta.systems' // https://github.com/polkadot-js/apps/issues/6930
      // 'Manta Munkiana': 'wss://munkiana.manta.systems', // https://github.com/polkadot-js/apps/issues/6871
      // 'Manta Pectinata': 'wss://pectinata.manta.systems' // https://github.com/polkadot-js/apps/issues/7018
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Manta Kuhlii',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2015,
    nativeToken: 'MANTA',
    crowdloanUrl: 'https://crowdloan.manta.network/',
    decimals: 10
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
      Soramitsu: 'wss://ws.alb.sora.org',
      OnFinality: 'wss://sora.api.onfinality.io/public-ws'
      // 'SORA Community (Lux8)': 'wss://sora.lux8.net' // https://github.com/polkadot-js/apps/issues/6195
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'OnFinality',
    groups: ['KUSAMA_PARACHAIN'],
    nativeToken: 'XOR',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 18
  },
  subgame: {
    key: 'subgame',
    chain: 'SubGame',
    genesisHash: '0xe6343cef9167c43305c6f197bbd90d55bf93efc561b3d698845398cd864f6eb3',
    ss58Format: 27,
    providers: {
      SubGame: 'wss://mainnet.subgame.org/'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'SubGame',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2017,
    nativeToken: 'SGB',
    crowdloanUrl: 'https://www.subgame.org/#/crowdloan',
    decimals: 10
  },
  odyssey: {
    key: 'odyssey',
    chain: 'Ares Odyssey',
    genesisHash: '0x52097bd7416205228bf13ac3eda6f16de56c19cac3476866b8b8a9c00d515870',
    ss58Format: 42,
    providers: {
      AresProtocol: 'wss://wss.odyssey.aresprotocol.io'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'AresProtocol',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2028,
    nativeToken: 'AMAS',
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
    currentProvider: 'OnFinality',
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
    genesisHash: '0xa3e43f6bb8cc5767147764709d6353f8654a7ef31d0577758c0e8ced0bb43087',
    ss58Format: 42,
    providers: {
      dolphin: 'wss://trillian.dolphin.red'
    },
    currentProvider: 'dolphin',
    currentProviderMode: 'ws',
    groups: ['TEST_NET'],
    nativeToken: 'DOL'
  },
  alephTest: {
    key: 'alephTest',
    chain: 'Aleph Zero Testnet',
    genesisHash: '0x49574664f45654c043c2690b76b5bf4a05c49160e112d32b8b71b0dfb023169c',
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
    supportBonding: true
  },
  opal: {
    key: 'opal',
    chain: 'OPAL by UNIQUE',
    genesisHash: '0x3fa374fbc8d0a9077356aefe327c88f447ce7f1fda905b1d4b4a2680a7b5cefa',
    ss58Format: 42,
    providers: {
      Unique: 'wss://opal.unique.network'
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
    paraId: 1000
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
      Dwellir: 'wss://statemine-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'OnFinality',
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
    currentProvider: 'OnFinality',
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
      Dwellir: 'wss://moonriver-rpc.dwellir.com'
      // Pinknode: 'wss://rpc.pinknode.io/moonriver/explorer' // https://github.com/polkadot-js/apps/issues/7058
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
    abiExplorer: 'https://api-moonriver.moonscan.io/api?module=contract&action=getabi'
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
      Dwellir: 'wss://shiden-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'OnFinality',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2007,
    nativeToken: 'SDN',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 18,
    coinGeckoKey: 'shiden'
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
    paraId: 2007
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
    supportBonding: true
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
    decimals: 18
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
    currentProvider: 'OnFinality',
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
    currentProvider: 'OnFinality',
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
      Liebi: 'wss://bifrost-rpc.testnet.liebi.com/ws'
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
    currentProvider: 'OnFinality',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2086,
    nativeToken: 'KILT',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan',
    decimals: 12,
    coinGeckoKey: 'kilt-protocol'
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
    currentProvider: 'OnFinality',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2084,
    nativeToken: 'KMA',
    crowdloanUrl: 'https://calamari.network/',
    decimals: 12,
    coinGeckoKey: 'calamari-network'
  },
  basilisk: {
    key: 'basilisk',
    chain: 'Basilisk',
    genesisHash: '0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755',
    ss58Format: 10041,
    providers: {
      HydraDX: 'wss://rpc-01.basilisk.hydradx.io',
      OnFinality: 'wss://basilisk.api.onfinality.io/public-ws',
      Dwellir: 'wss://basilisk-rpc.dwellir.com'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Dwellir',
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
    currentProvider: 'OnFinality',
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
    currentProvider: 'OnFinality',
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
    currentProvider: 'OnFinality',
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
    currentProvider: 'OnFinality',
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
  subsocial: {
    key: 'subsocial',
    chain: 'Subsocial',
    genesisHash: '0x0bd72c1c305172e1275278aaeb3f161e02eccb7a819e63f62d47bd53a28189f8',
    ss58Format: 28,
    providers: {
      Dappforce: 'wss://rpc.subsocial.network'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'Dappforce',
    groups: ['KUSAMA_PARACHAIN'],
    nativeToken: 'SUB',
    crowdloanUrl: 'https://app.subsocial.network/crowdloan',
    decimals: 11
  },
  zeitgeist: {
    key: 'zeitgeist',
    chain: 'Zeitgeist',
    genesisHash: '0x1bf2a2ecb4a868de66ea8610f2ce7c8c43706561b6476031315f6640fe38e060',
    ss58Format: 73,
    providers: {
      ZeitgeistPM: 'wss://rpc-0.zeitgeist.pm'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'ZeitgeistPM',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2101,
    nativeToken: 'ZTG',
    crowdloanUrl: 'https://crowdloan.zeitgeist.pm/',
    decimals: 10
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
    blockExplorer: 'https://crab.subscan.io'
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
    blockExplorer: 'https://pangolin.subscan.io'
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
    genesisHash: '0x8032ad7a75a2b9732315592c672ec6d0ddf95308de03a19878ed8627ae8796cc',
    ss58Format: 42,
    providers: {
      mangatax: 'wss://v4-prod-collator-01.mangatafinance.cloud'
    },
    currentProvider: 'mangatax',
    currentProviderMode: 'ws',
    active: false,
    key: 'mangatax',
    groups: ['TEST_NET'],
    nativeToken: 'MGAT'
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
  subspace: {
    key: 'subspace',
    chain: 'Subspace Farmnet',
    genesisHash: '0x332ef6e751e25426e38996c51299dfc53bcd56f40b53dce2b2fc8442ae9c4a74',
    ss58Format: 2254,
    providers: {
      subspace: 'wss://farm-rpc.subspace.network/ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'subspace',
    groups: ['TEST_NET'],
    nativeToken: 'tSSC',
    decimals: 18
  },
  subspace_gemini: {
    key: 'subspace_gemini',
    chain: 'Subspace Gemini 1',
    genesisHash: '0x9ee86eefc3cc61c71a7751bba7f25e442da2512f408e6286153b3ccc055dccf0',
    ss58Format: 2254,
    providers: {
      subspaceAsia: 'wss://apac.gemini-1b.subspace.network/ws',
      subspaceEU: 'wss://eu.gemini-1b.subspace.network/ws',
      subspaceUS: 'wss://na.gemini-1b.subspace.network/ws'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'subspaceEU',
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
    decimals: 18
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
      AjunaNetwork: 'wss://rpc-parachain.bajun.network'
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
    coinGeckoKey: 'coin-capsule'
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
    decimals: 18
  },
  amplitude: {
    key: 'amplitude',
    chain: 'Amplitude',
    genesisHash: '0xcceae7f3b9947cdb67369c026ef78efa5f34a08fe5808d373c04421ecf4f1aaf',
    ss58Format: 57,
    providers: {
      amplitude: 'wss://pencol-kus-01.pendulumchain.tech'
    },
    active: false,
    currentProviderMode: 'ws',
    currentProvider: 'amplitude',
    nativeToken: 'AMPE',
    groups: ['KUSAMA_PARACHAIN'],
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