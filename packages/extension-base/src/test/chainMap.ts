// Copyright 2019-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';

export const TEST_CHAIN_LIST = [{
  slug: 'acala',
  name: 'Acala',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: {
    'Acala Foundation 0': 'wss://acala-rpc-0.aca-api.network',
    'Acala Foundation 1': 'wss://acala-rpc-1.aca-api.network',
    'Acala Foundation 2': 'wss://acala-rpc-2.aca-api.network/ws',
    'Acala Foundation 3': 'wss://acala-rpc-3.aca-api.network/ws',
    'Polkawallet 0': 'wss://acala.polkawallet.io',
    OnFinality: 'wss://acala-polkadot.api.onfinality.io/public-ws',
    Dwellir: 'wss://acala-rpc.dwellir.com'
  },
  substrateInfo: {
    paraId: 2000,
    relaySlug: 'polkadot',
    genesisHash: '0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c',
    addressPrefix: 10,
    crowdloanUrl: 'https://distribution.acala.network/',
    chainType: 'PARACHAIN',
    blockExplorer: 'https://acala.subscan.io/',
    symbol: 'ACA',
    existentialDeposit: '100000000000',
    decimals: 12,
    hasNativeNft: true,
    supportStaking: false,
    supportSmartContract: null
  },
  active: false,
  currentProvider: 'Acala Foundation 0'
}, {
  slug: 'alephTest',
  name: 'Aleph Zero Testnet',
  isTestnet: true,
  chainStatus: 'ACTIVE',
  providers: { 'Aleph Zero Foundation': 'wss://ws.test.azero.dev' },
  substrateInfo: {
    paraId: null,
    relaySlug: null,
    genesisHash: '0x05d5279c52c484cc80396535a316add7d47b1c5b9e0398dd1f584149341460c5',
    addressPrefix: 42,
    crowdloanUrl: null,
    chainType: 'RELAYCHAIN',
    blockExplorer: null,
    symbol: 'TZERO',
    existentialDeposit: '500',
    decimals: 12,
    hasNativeNft: false,
    supportSmartContract: ['PSP34', 'PSP22'],
    supportStaking: true
  },
  evmInfo: null,
  active: true,
  currentProvider: 'Aleph Zero Foundation'
}, {
  slug: 'amplitude',
  name: 'Amplitude',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: { Amplitude: 'wss://rpc-amplitude.pendulumchain.tech' },
  substrateInfo: {
    paraId: 2124,
    relaySlug: 'kusama',
    genesisHash: '0xcceae7f3b9947cdb67369c026ef78efa5f34a08fe5808d373c04421ecf4f1aaf',
    addressPrefix: 57,
    crowdloanUrl: null,
    chainType: 'PARACHAIN',
    blockExplorer: null,
    symbol: 'AMPE',
    existentialDeposit: '1000000000',
    decimals: 12,
    hasNativeNft: false,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: null,
  active: false,
  currentProvider: 'Amplitude'
}, {
  slug: 'amplitude_test',
  name: 'Amplitude Testnet',
  isTestnet: true,
  chainStatus: 'ACTIVE',
  providers: { Amplitude: 'wss://rpc-foucoco.pendulumchain.tech' },
  substrateInfo: {
    paraId: 2124,
    relaySlug: 'rococo',
    genesisHash: '0x67221cd96c1551b72d55f65164d6a39f31b570c77a05c90e31931b0e2f379e13',
    addressPrefix: 57,
    crowdloanUrl: null,
    chainType: 'PARACHAIN',
    blockExplorer: null,
    symbol: 'AMPE',
    existentialDeposit: '1000000000',
    decimals: 12,
    hasNativeNft: false,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: null,
  active: false,
  currentProvider: 'Amplitude'
}, {
  slug: 'astar',
  name: 'Astar',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: {
    OnFinality: 'wss://astar.api.onfinality.io/public-ws',
    Dwellir: 'wss://astar-rpc.dwellir.com',
    Astar: 'wss://rpc.astar.network',
    PinkNode: 'wss://public-rpc.pinknode.io/astar',
    Blast: 'wss://astar.public.blastapi.io',
    '1RPC': 'wss://1rpc.io/astr',
    'Light Client': 'light://substrate-connect/polkadot/astar'
  },
  substrateInfo: {
    paraId: 2006,
    relaySlug: 'polkadot',
    genesisHash: '0x9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6',
    addressPrefix: 5,
    crowdloanUrl: 'https://crowdloan.astar.network/#/',
    chainType: 'PARACHAIN',
    blockExplorer: 'https://astar.subscan.io/',
    symbol: 'ASTR',
    existentialDeposit: '1000000',
    decimals: 18,
    hasNativeNft: false,
    supportSmartContract: ['PSP34', 'PSP22'],
    supportStaking: true
  },
  evmInfo: null,
  active: false,
  currentProvider: 'OnFinality'
}, {
  slug: 'astarEvm',
  name: 'Astar - EVM',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: {
    OnFinality: 'wss://astar.api.onfinality.io/public-ws',
    Dwellir: 'wss://astar-rpc.dwellir.com',
    Astar: 'wss://rpc.astar.network',
    PinkNode: 'wss://public-rpc.pinknode.io/astar',
    Blast: 'wss://astar.public.blastapi.io',
    '1RPC': 'wss://1rpc.io/astr',
    'Light Client': 'light://substrate-connect/polkadot/astar'
  },
  substrateInfo: null,
  evmInfo: {
    evmChainId: 592,
    blockExplorer: 'https://blockscout.com/astar/',
    symbol: 'ASTR',
    decimals: 18,
    existentialDeposit: '0',
    supportSmartContract: ['ERC20', 'ERC721'],
    abiExplorer: null
  },
  active: false,
  currentProvider: 'OnFinality'
}, {
  slug: 'bifrost',
  name: 'Bifrost Kusama',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: {
    'Liebi 0': 'wss://bifrost-rpc.liebi.com/ws',
    Dwellir: 'wss://bifrost-rpc.dwellir.com',
    OnFinality: 'wss://bifrost-parachain.api.onfinality.io/public-ws'
  },
  substrateInfo: {
    paraId: 2001,
    relaySlug: 'kusama',
    genesisHash: '0x9f28c6a68e0fc9646eff64935684f6eeeece527e37bbe1f213d22caa1d9d6bed',
    addressPrefix: 6,
    crowdloanUrl: 'https://bifrost.app/vcrowdloan',
    chainType: 'PARACHAIN',
    blockExplorer: 'https://bifrost-kusama.subscan.io',
    symbol: 'BNC',
    existentialDeposit: '10000000000',
    decimals: 12,
    hasNativeNft: false,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: null,
  active: false,
  currentProvider: 'Liebi 0'
}, {
  slug: 'bifrost_dot',
  name: 'Bifrost Polkadot',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: {
    Liebi: 'wss://hk.p.bifrost-rpc.liebi.com/ws',
    OnFinality: 'wss://bifrost-polkadot.api.onfinality.io/public-ws'
  },
  substrateInfo: {
    paraId: 2030,
    relaySlug: 'polkadot',
    genesisHash: '0x262e1b2ad728475fd6fe88e62d34c200abe6fd693931ddad144059b1eb884e5b',
    addressPrefix: 6,
    crowdloanUrl: 'https://bifrost.app/vcrowdloan',
    chainType: 'PARACHAIN',
    blockExplorer: 'https://bifrost.subscan.io',
    symbol: 'BNC',
    existentialDeposit: '10000000000',
    decimals: 12,
    hasNativeNft: false,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: null,
  active: false,
  currentProvider: 'Liebi'
}, {
  slug: 'bifrost_testnet',
  name: 'Bifrost Testnet',
  isTestnet: true,
  chainStatus: 'ACTIVE',
  providers: { Liebi: 'wss://bifrost-rpc.rococo.liebi.com/ws' },
  substrateInfo: {
    paraId: 2030,
    relaySlug: 'rococo',
    genesisHash: '0x8b290fa39a8808f29d7309ea99442c95bf964838aef14be5a6449ae48f8a5f1f',
    addressPrefix: 6,
    crowdloanUrl: null,
    chainType: 'PARACHAIN',
    blockExplorer: 'https://bifrost-testnet.subscan.io/',
    symbol: 'BNC',
    existentialDeposit: '10000000000',
    decimals: 12,
    hasNativeNft: false,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: null,
  active: false,
  currentProvider: 'Liebi'
}, {
  slug: 'bitcountry',
  name: 'Bit.Country - Alpha Net',
  isTestnet: true,
  chainStatus: 'ACTIVE',
  providers: { 'Metaverse Foundation': 'wss://alphanet-rpc.bit.country' },
  substrateInfo: {
    paraId: null,
    relaySlug: null,
    genesisHash: '0xfff6fd94251f570d4c9cdf25a0475da0d7ad35160290da19dad8f9caf8bf31b5',
    addressPrefix: 42,
    crowdloanUrl: null,
    chainType: 'RELAYCHAIN',
    blockExplorer: null,
    symbol: 'NUUM',
    existentialDeposit: '1',
    decimals: 18,
    hasNativeNft: true,
    supportSmartContract: null,
    supportStaking: false
  },
  evmInfo: null,
  active: false,
  currentProvider: 'Metaverse Foundation'
}, {
  slug: 'bobabase',
  name: 'Bobabase Testnet',
  isTestnet: true,
  chainStatus: 'ACTIVE',
  providers: { RPC: 'https://bobabase.boba.network', 'Replica RPC': 'https://replica.bobabase.boba.network' },
  substrateInfo: null,
  evmInfo: {
    evmChainId: 1297,
    blockExplorer: null,
    symbol: 'BOBA',
    decimals: 18,
    existentialDeposit: '0',
    supportSmartContract: ['ERC20', 'ERC721'],
    abiExplorer: 'https://blockexplorer.bobabase.boba.network'
  },
  active: false,
  currentProvider: 'RPC'
}, {
  slug: 'calamari',
  name: 'Calamari Parachain',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: { 'Manta Network': 'wss://ws.calamari.systems/', OnFinality: 'wss://calamari.api.onfinality.io/public-ws' },
  substrateInfo: {
    paraId: 2084,
    relaySlug: 'kusama',
    genesisHash: '0x4ac80c99289841dd946ef92765bf659a307d39189b3ce374a92b5f0415ee17a1',
    addressPrefix: 78,
    crowdloanUrl: 'https://calamari.network/',
    chainType: 'PARACHAIN',
    blockExplorer: 'https://calamari.subscan.io/',
    symbol: 'KMA',
    existentialDeposit: '100000000000',
    decimals: 12,
    hasNativeNft: false,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: null,
  active: false,
  currentProvider: 'Manta Network'
}, {
  slug: 'equilibrium_parachain',
  name: 'Equilibrium',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: { Equilibrium: 'wss://node.pol.equilibrium.io', Dwellir: 'wss://equilibrium-rpc.dwellir.com' },
  substrateInfo: {
    paraId: 2011,
    relaySlug: 'polkadot',
    genesisHash: '0x89d3ec46d2fb43ef5a9713833373d5ea666b092fa8fd68fbc34596036571b907',
    addressPrefix: 68,
    crowdloanUrl: 'https://equilibrium.io/en/crowdloan#bid',
    chainType: 'PARACHAIN',
    blockExplorer: 'https://equilibrium.subscan.io',
    symbol: 'EQ',
    existentialDeposit: '100000000',
    decimals: 9,
    hasNativeNft: false,
    supportSmartContract: null,
    supportStaking: false
  },
  evmInfo: null,
  active: false,
  currentProvider: 'Equilibrium'
}, {
  slug: 'ethereum',
  name: 'Ethereum',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: {
    Cloudflare: 'https://cloudflare-eth.com',
    BlastApi: 'https://eth-mainnet.public.blastapi.io',
    Infura: 'https://mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8'
  },
  substrateInfo: null,
  evmInfo: {
    evmChainId: 1,
    blockExplorer: 'https://etherscan.io',
    symbol: 'ETH',
    decimals: 18,
    existentialDeposit: '0',
    supportSmartContract: ['ERC20', 'ERC721'],
    abiExplorer: 'https://etherscan.io'
  },
  active: true,
  currentProvider: 'Cloudflare'
}, {
  slug: 'kusama',
  name: 'Kusama',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: {
    Parity: 'wss://kusama-rpc.polkadot.io',
    OnFinality: 'wss://kusama.api.onfinality.io/public-ws',
    Dwellir: 'wss://kusama-rpc.dwellir.com',
    'Light Client': 'light://substrate-connect/kusama',
    PinkNode: 'wss://public-rpc.pinknode.io/kusama',
    RadiumBlock: 'wss://kusama.public.curie.radiumblock.xyz/ws',
    '1RPC': 'wss://1rpc.io/ksm'
  },
  substrateInfo: {
    paraId: null,
    relaySlug: null,
    genesisHash: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
    addressPrefix: 2,
    crowdloanUrl: null,
    chainType: 'RELAYCHAIN',
    blockExplorer: 'https://kusama.subscan.io/',
    symbol: 'KSM',
    existentialDeposit: '333333333',
    decimals: 12,
    hasNativeNft: true,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: null,
  active: true,
  currentProvider: 'Parity'
}, {
  slug: 'moonbase',
  name: 'Moonbase Alpha',
  isTestnet: true,
  chainStatus: 'ACTIVE',
  providers: {
    'Moonbeam Foundation': 'wss://wss.api.moonbase.moonbeam.network',
    OnFinality: 'wss://moonbeam-alpha.api.onfinality.io/public-ws',
    Blast: 'wss://moonbase-alpha.public.blastapi.io'
  },
  substrateInfo: {
    paraId: 1000,
    relaySlug: null,
    genesisHash: '0x91bc6e169807aaa54802737e1c504b2577d4fafedd5a02c10293b1cd60e39527',
    addressPrefix: 1287,
    crowdloanUrl: null,
    chainType: 'PARACHAIN',
    blockExplorer: 'https://moonbase.subscan.io/',
    symbol: 'DEV',
    existentialDeposit: '0',
    decimals: 18,
    hasNativeNft: false,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: {
    evmChainId: 1287,
    blockExplorer: 'https://moonbase.moonscan.io/',
    symbol: 'DEV',
    decimals: 18,
    existentialDeposit: '0',
    supportSmartContract: ['ERC721', 'ERC20'],
    abiExplorer: 'https://api-moonbase.moonscan.io/api?module=contract&action=getabi'
  },
  active: true,
  currentProvider: 'Moonbeam Foundation'
}, {
  slug: 'moonbeam',
  name: 'Moonbeam',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: {
    'Moonbeam Foundation': 'wss://wss.api.moonbeam.network',
    OnFinality: 'wss://moonbeam.api.onfinality.io/public-ws',
    Dwellir: 'wss://moonbeam-rpc.dwellir.com',
    '1rpc': 'wss://1rpc.io/glmr',
    PinkNode: 'wss://public-rpc.pinknode.io/moonbeam',
    Blast: 'wss://moonbeam.public.blastapi.io'
  },
  substrateInfo: {
    paraId: 2004,
    relaySlug: 'polkadot',
    genesisHash: '0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d',
    addressPrefix: 1284,
    crowdloanUrl: 'https://moonbeam.foundation/moonbeam-crowdloan/',
    chainType: 'PARACHAIN',
    blockExplorer: 'https://moonbeam.subscan.io/',
    symbol: 'GLMR',
    existentialDeposit: '0',
    decimals: 18,
    hasNativeNft: false,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: {
    evmChainId: 1284,
    blockExplorer: 'https://moonscan.io/',
    symbol: 'GLMR',
    decimals: 18,
    existentialDeposit: '0',
    supportSmartContract: ['ERC721', 'ERC20'],
    abiExplorer: 'https://api-moonbeam.moonscan.io/api?module=contract&action=getabi'
  },
  active: true,
  currentProvider: 'Moonbeam Foundation'
}, {
  slug: 'moonriver',
  name: 'Moonriver',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: {
    'Moonbeam Foundation': 'wss://wss.api.moonriver.moonbeam.network',
    OnFinality: 'wss://moonriver.api.onfinality.io/public-ws',
    Blast: 'wss://moonriver.public.blastapi.io',
    Dwellir: 'wss://moonriver-rpc.dwellir.com',
    Pinknode: 'wss://public-rpc.pinknode.io/moonriver',
    UnitedBloc: 'wss://moonriver.unitedbloc.com:2001'
  },
  substrateInfo: {
    paraId: 2023,
    relaySlug: 'kusama',
    genesisHash: '0x401a1f9dca3da46f5c4091016c8a2f26dcea05865116b286f60f668207d1474b',
    addressPrefix: 1285,
    crowdloanUrl: null,
    chainType: 'PARACHAIN',
    blockExplorer: 'https://moonriver.subscan.io/',
    symbol: 'MOVR',
    existentialDeposit: '0',
    decimals: 18,
    hasNativeNft: false,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: {
    evmChainId: 1285,
    blockExplorer: 'https://moonriver.moonscan.io/',
    symbol: 'MOVR',
    decimals: 18,
    existentialDeposit: '0',
    supportSmartContract: ['ERC721', 'ERC20'],
    abiExplorer: 'https://api-moonriver.moonscan.io/api?module=contract&action=getabi'
  },
  active: false,
  currentProvider: 'Moonbeam Foundation'
}, {
  slug: 'polkadot',
  name: 'Polkadot',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: {
    Parity: 'wss://rpc.polkadot.io',
    OnFinality: 'wss://polkadot.api.onfinality.io/public-ws',
    Dwellir: 'wss://polkadot-rpc.dwellir.com',
    'Light Client': 'light://substrate-connect/polkadot',
    RadiumBlock: 'wss://polkadot.public.curie.radiumblock.io/ws',
    '1RPC': 'wss://1rpc.io/dot',
    PinkNode: 'wss://public-rpc.pinknode.io/polkadot'
  },
  substrateInfo: {
    paraId: null,
    relaySlug: null,
    genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    addressPrefix: 0,
    crowdloanUrl: null,
    chainType: 'RELAYCHAIN',
    blockExplorer: 'https://polkadot.subscan.io/',
    symbol: 'DOT',
    existentialDeposit: '10000000000',
    decimals: 10,
    hasNativeNft: false,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: null,
  active: true,
  currentProvider: 'Parity'
}, {
  slug: 'rococo',
  name: 'Rococo',
  isTestnet: true,
  chainStatus: 'ACTIVE',
  providers: {
    Parity: 'wss://rococo-rpc.polkadot.io',
    OnFinality: 'wss://rococo.api.onfinality.io/public-ws',
    Pinknode: 'wss://rpc.pinknode.io/rococo/explorer',
    'Ares Protocol': 'wss://rococo.aresprotocol.com',
    'Light Client': 'light://substrate-connect/rococo'
  },
  substrateInfo: {
    paraId: null,
    relaySlug: null,
    genesisHash: '0x6408de7737c59c238890533af25896a2c20608d8b380bb01029acb392781063e',
    addressPrefix: 42,
    crowdloanUrl: null,
    chainType: 'RELAYCHAIN',
    blockExplorer: null,
    symbol: 'ROC',
    existentialDeposit: '33333333',
    decimals: 12,
    hasNativeNft: false,
    supportSmartContract: ['PSP34', 'PSP22'],
    supportStaking: false
  },
  evmInfo: null,
  active: true,
  currentProvider: 'Parity'
}, {
  slug: 'shibuya',
  name: 'Shibuya Testnet',
  isTestnet: true,
  chainStatus: 'ACTIVE',
  providers: { Shibuya: 'wss://rpc.shibuya.astar.network', Dwellir: 'wss://shibuya-rpc.dwellir.com' },
  substrateInfo: {
    paraId: 1000,
    relaySlug: null,
    genesisHash: '0xddb89973361a170839f80f152d2e9e38a376a5a7eccefcade763f46a8e567019',
    addressPrefix: 5,
    crowdloanUrl: null,
    chainType: 'PARACHAIN',
    blockExplorer: 'https://shibuya.subscan.io/',
    symbol: 'SBY',
    existentialDeposit: '1000000',
    decimals: 18,
    hasNativeNft: false,
    supportSmartContract: ['PSP34', 'PSP22'],
    supportStaking: true
  },
  evmInfo: null,
  active: false,
  currentProvider: 'Shibuya'
}, {
  slug: 'shibuyaEvm',
  name: 'Shibuya Testnet - EVM',
  isTestnet: true,
  chainStatus: 'ACTIVE',
  providers: { Shibuya: 'wss://rpc.shibuya.astar.network', Dwellir: 'wss://shibuya-rpc.dwellir.com' },
  substrateInfo: null,
  evmInfo: {
    evmChainId: 81,
    blockExplorer: null,
    symbol: 'SBY',
    decimals: 18,
    existentialDeposit: '0',
    supportSmartContract: ['ERC20', 'ERC721'],
    abiExplorer: null
  },
  active: false,
  currentProvider: 'Shibuya'
}, {
  slug: 'turing',
  name: 'Turing',
  isTestnet: false,
  chainStatus: 'ACTIVE',
  providers: { Turing: 'wss://rpc.turing.oak.tech', Dwellir: 'wss://turing-rpc.dwellir.com' },
  substrateInfo: {
    paraId: 2114,
    relaySlug: 'kusama',
    genesisHash: '0x0f62b701fb12d02237a33b84818c11f621653d2b1614c777973babf4652b535d',
    addressPrefix: 51,
    crowdloanUrl: null,
    chainType: 'PARACHAIN',
    blockExplorer: 'https://turing.subscan.io/',
    symbol: 'TUR',
    existentialDeposit: '100000000',
    decimals: 10,
    hasNativeNft: false,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: null,
  active: false,
  currentProvider: 'Turing'
}, {
  slug: 'turingStaging',
  name: 'Turing Staging',
  isTestnet: true,
  chainStatus: 'ACTIVE',
  providers: { Turing: 'wss://rpc.turing-staging.oak.tech' },
  substrateInfo: {
    paraId: 2114,
    relaySlug: null,
    genesisHash: '0xd54f0988402deb4548538626ce37e4a318441ea0529ca369400ebec4e04dfe4b',
    addressPrefix: 51,
    crowdloanUrl: null,
    chainType: 'PARACHAIN',
    blockExplorer: null,
    symbol: 'TUR',
    existentialDeposit: '100000000',
    decimals: 10,
    hasNativeNft: false,
    supportStaking: true,
    supportSmartContract: null
  },
  evmInfo: null,
  active: false,
  currentProvider: 'Turing'
}, {
  slug: 'westend',
  name: 'Westend',
  isTestnet: true,
  chainStatus: 'ACTIVE',
  providers: {
    Parity: 'wss://westend-rpc.polkadot.io',
    Pinknode: 'wss://rpc.pinknode.io/westend/explorer',
    Dwellir: 'wss://westend-rpc.dwellir.com',
    'Light Client': 'light://substrate-connect/westend',
    DottersNet: 'wss://rpc.dotters.network/westend',
    'Dwellir Tunisia': 'wss://westend-rpc-tn.dwellir.com'
  },
  substrateInfo: {
    paraId: null,
    relaySlug: null,
    genesisHash: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
    addressPrefix: 42,
    crowdloanUrl: null,
    chainType: 'RELAYCHAIN',
    blockExplorer: 'https://westend.subscan.io/',
    symbol: 'WND',
    existentialDeposit: '10000000000',
    decimals: 12,
    hasNativeNft: false,
    supportSmartContract: null,
    supportStaking: true
  },
  evmInfo: null,
  active: true,
  currentProvider: 'Parity'
}] as unknown as _ChainInfo[];

export const TEST_CHAIN_MAP: Record<string, _ChainInfo> = Object.fromEntries(TEST_CHAIN_LIST.map((chain) => [chain.slug, chain]));
