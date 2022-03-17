// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetWorkInfo } from '@polkadot/extension-base/background/KoniTypes';

const NETWORKS: Record<string, NetWorkInfo> = {
  polkadot: {
    chain: 'Polkadot Relay Chain',
    genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    icon: 'polkadot',
    ss58Format: 0,
    provider: 'wss://polkadot.api.onfinality.io/public-ws',
    groups: ['RELAY_CHAIN'],
    nativeToken: 'DOT',
    decimals: 10
  },
  kusama: {
    chain: 'Kusama Relay Chain',
    genesisHash: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
    icon: 'polkadot',
    ss58Format: 2,
    provider: 'wss://kusama.api.onfinality.io/public-ws',
    groups: ['RELAY_CHAIN'],
    nativeToken: 'KSM',
    decimals: 12
  },
  westend: {
    chain: 'Westend Relay Chain',
    genesisHash: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
    icon: 'polkadot',
    ss58Format: 42,
    provider: 'wss://westend.api.onfinality.io/public-ws',
    groups: ['RELAY_CHAIN', 'TEST_NET'],
    nativeToken: 'WND'
  },
  rococo: {
    chain: 'Rococo Relay Chain',
    genesisHash: '0x037f5f3c8e67b314062025fc886fcd6238ea25a4a9b45dce8d246815c9ebe770',
    icon: 'polkadot',
    ss58Format: 42,
    provider: 'wss://rococo-rpc.polkadot.io',
    groups: ['RELAY_CHAIN', 'TEST_NET'],
    nativeToken: 'ROC'
  },
  rmrk: {
    chain: 'RMRK test',
    genesisHash: '0x55b88a59dded27563391d619d805572dd6b6b89d302b0dd792d01b3c41cfe5b1',
    icon: 'polkadot',
    ss58Format: 0,
    provider: 'wss://staging.node.rmrk.app',
    groups: ['TEST_NET']
  },
  statemint: {
    chain: 'Statemint',
    genesisHash: '0x68d56f15f85d3136970ec16946040bc1752654e906147f7e43e9d539d7c3de2f',
    icon: 'polkadot',
    ss58Format: 0,
    provider: 'wss://statemint.api.onfinality.io/public-ws',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 1000,
    nativeToken: 'KSM'
  },
  acala: {
    chain: 'Acala',
    genesisHash: '0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c',
    ss58Format: 10,
    provider: 'wss://acala-polkadot.api.onfinality.io/public-ws',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2000,
    nativeToken: 'ACA',
    crowdloanUrl: 'https://distribution.acala.network/'
  },
  moonbeam: {
    chain: 'Moonbeam',
    genesisHash: '0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d',
    ss58Format: 1284,
    provider: 'wss://moonbeam.api.onfinality.io/public-ws',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2004,
    isEthereum: true,
    nativeToken: 'DEV',
    crowdloanUrl: 'https://moonbeam.foundation/moonbeam-crowdloan/'
  },
  astar: {
    chain: 'Astar',
    genesisHash: '0x9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6',
    ss58Format: 5,
    provider: 'wss://astar.api.onfinality.io/public-ws',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2006,
    nativeToken: 'ASTR',
    crowdloanUrl: 'https://crowdloan.astar.network/#/',
    decimals: 18
  },
  parallel: {
    chain: 'Parallel',
    genesisHash: '0xe61a41c53f5dcd0beb09df93b34402aada44cb05117b71059cce40a2723a4e97',
    ss58Format: 172,
    provider: 'wss://parallel.api.onfinality.io/public-ws',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2012,
    nativeToken: 'PARA',
    crowdloanUrl: 'https://crowdloan.parallel.fi/#/auction/contribute/polkadot/2012'
  },
  clover: {
    chain: 'Clover',
    genesisHash: '0x5c7bd13edf349b33eb175ffae85210299e324d852916336027391536e686f267',
    ss58Format: 128,
    provider: 'wss://clover.api.onfinality.io/public-ws',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2002,
    nativeToken: 'CLV',
    crowdloanUrl: 'https://lucky.clover.finance/?type=support'
  },
  hydradx: {
    chain: 'HydraDX',
    genesisHash: '0xd2a620c27ec5cbc5621ff9a522689895074f7cca0d08e7134a7804e1a3ba86fc',
    ss58Format: 63,
    provider: 'wss://rpc-01.snakenet.hydradx.io',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2034,
    nativeToken: 'HDX',
    crowdloanUrl: 'https://loan.hydradx.io/'
  },
  edgeware: {
    chain: 'Edgeware',
    genesisHash: '0x742a2ca70c2fda6cee4f8df98d64c4c670a052d9568058982dad9d5a7a135c5b',
    ss58Format: 7,
    provider: 'wss://edgeware.api.onfinality.io/public-ws',
    groups: ['MAIN_NET'],
    nativeToken: 'EDG'
  },
  centrifuge: {
    chain: 'Centrifuge',
    genesisHash: '0x67dddf2673b69e5f875f6f25277495834398eafd67f492e09f3f3345e003d1b5',
    ss58Format: 36,
    provider: 'wss://fullnode.centrifuge.io',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2031,
    nativeToken: 'CFG',
    crowdloanUrl: 'https://centrifuge.io/parachain/crowdloan/'
  },
  interlay: {
    chain: 'Interlay',
    genesisHash: '0xed86d448b84db333cdbe07362ddc79530343b907bd88712557c024d7a94296bb',
    ss58Format: 42,
    provider: 'wss://api.interlay.io/parachain',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2032,
    nativeToken: 'DOT',
    crowdloanUrl: 'https://crowdloan.interlay.io/'
  },
  equilibrium: {
    chain: 'Equilibrium',
    genesisHash: '0x6f1a800de3daff7f5e037ddf66ab22ce03ab91874debeddb1086f5f7dbd48925',
    ss58Format: 68,
    provider: 'wss://node.equilibrium.io',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2011,
    nativeToken: 'EQ',
    crowdloanUrl: 'https://equilibrium.io/en/crowdloan#bid'
  },
  nodle: {
    chain: 'Nodle',
    genesisHash: '0xa3d114c2b8d0627c1aa9b134eafcf7d05ca561fdc19fb388bb9457f81809fb23',
    ss58Format: 37,
    provider: 'wss://main3.nodleprotocol.io',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2026,
    nativeToken: 'NODL',
    crowdloanUrl: 'https://parachain.nodle.com/'
  },
  darwinia: {
    chain: 'Darwinia',
    genesisHash: '0x729cb8f2cf428adcf81fe69610edda32c5711b2ff17de747e8604a3587021db8',
    ss58Format: 18,
    provider: 'wss://rpc.darwinia.network',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2003,
    nativeToken: 'RING',
    crowdloanUrl: 'https://darwinia.network/plo_contribute'
  },
  manta: {
    chain: 'Manta',
    genesisHash: '0x7822fe86be209e140e1bdb80fb09539d1825e3d1dfee79ce37c336a832a26d48',
    ss58Format: 77,
    provider: 'wss://pectinata.manta.systems',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2015,
    nativeToken: 'MANTA',
    crowdloanUrl: 'https://crowdloan.manta.network/'
  },
  'sora-substrate': {
    chain: 'SORA',
    genesisHash: '0x7e4e32d0feafd4f9c9414b0be86373f9a1efa904809b683453a9af6856d38ad5',
    ss58Format: 69,
    provider: 'wss://sora.api.onfinality.io/public-ws',
    groups: ['POLKADOT_PARACHAIN'],
    nativeToken: 'XOR',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan'
  },
  subgame: {
    chain: 'SubGame',
    genesisHash: '0xe6343cef9167c43305c6f197bbd90d55bf93efc561b3d698845398cd864f6eb3',
    ss58Format: 27,
    provider: 'wss://gamma.subgame.org/',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2017,
    nativeToken: 'SGB',
    crowdloanUrl: 'https://www.subgame.org/#/crowdloan'
  },
  odyssey: {
    chain: 'Ares Odyssey',
    genesisHash: '0x52097bd7416205228bf13ac3eda6f16de56c19cac3476866b8b8a9c00d515870',
    ss58Format: 42,
    provider: 'wss://wss.odyssey.aresprotocol.io',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2028,
    nativeToken: 'AMAS',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan'
  },
  polkadex: {
    chain: 'Polkadex',
    genesisHash: '0x3920bcb4960a1eef5580cd5367ff3f430eef052774f78468852f7b9cb39f8a3c',
    ss58Format: 88,
    provider: 'wss://mainnet.polkadex.trade',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2036,
    nativeToken: 'PDEX',
    crowdloanUrl: 'https://www.polkadex.trade/crowdloans'
  },
  aleph: {
    chain: 'Aleph Zero',
    genesisHash: '0x70255b4d28de0fc4e1a193d7e175ad1ccef431598211c55538f1018651a0344e',
    ss58Format: 42,
    provider: 'wss://ws.azero.dev/',
    groups: ['MAIN_NET'],
    nativeToken: 'AZERO',
    crowdloanUrl: 'https://contribute.alephzero.org/'
  },
  alephTest: {
    chain: 'Aleph Zero Testnet',
    genesisHash: '0x49574664f45654c043c2690b76b5bf4a05c49160e112d32b8b71b0dfb023169c',
    ss58Format: 42,
    provider: 'wss://ws.test.azero.dev/',
    groups: ['TEST_NET'],
    nativeToken: 'TZERO'
  },
  opal: {
    chain: 'OPAL by UNIQUE',
    genesisHash: '0x3fa374fbc8d0a9077356aefe327c88f447ce7f1fda905b1d4b4a2680a7b5cefa',
    ss58Format: 42,
    provider: 'wss://opal.unique.network',
    groups: ['TEST_NET'],
    nativeToken: 'OPL'
  },
  moonbase: {
    chain: 'Moonbase Alpha',
    genesisHash: '0x91bc6e169807aaa54802737e1c504b2577d4fafedd5a02c10293b1cd60e39527',
    ss58Format: 1287,
    provider: 'wss://moonbeam-alpha.api.onfinality.io/public-ws',
    groups: ['TEST_NET'],
    nativeToken: 'DEV',
    isEthereum: true
  },
  efinity: {
    chain: 'Efinity',
    genesisHash: 'UNKNOWN',
    ss58Format: -1,
    provider: 'PROVIDER',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2021,
    nativeToken: 'EFI',
    crowdloanUrl: 'https://enjin.io/efinity-crowdloan'
  },
  composableFinance: {
    chain: 'Composable Finance',
    genesisHash: 'UNKNOWN',
    ss58Format: -1,
    provider: 'PROVIDER',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2019,
    nativeToken: 'LAYR',
    crowdloanUrl: 'https://crowdloan.composable.finance/'
  },
  litentry: {
    chain: 'Litentry',
    genesisHash: 'UNKNOWN',
    ss58Format: -1,
    provider: 'PROVIDER',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2013,
    nativeToken: 'LIT',
    crowdloanUrl: 'https://crowdloan.litentry.com/'
  },
  phala: {
    chain: 'Phala Network',
    genesisHash: 'UNKNOWN',
    ss58Format: -1,
    provider: 'PROVIDER',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2035,
    nativeToken: 'PHA',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan'
  },
  crust: {
    chain: 'Crust Network',
    genesisHash: '0x8b404e7ed8789d813982b9cb4c8b664c05b3fbf433309f603af014ec9ce56a8c',
    ss58Format: 66,
    provider: 'wss://rpc.crust.network',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2008,
    nativeToken: 'CRU',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan'
  },
  coinversation: {
    chain: 'Coinversation',
    genesisHash: 'UNKNOWN',
    ss58Format: -1,
    provider: 'PROVIDER',
    groups: ['POLKADOT_PARACHAIN'],
    paraId: 2027,
    nativeToken: 'CTO',
    crowdloanUrl: 'https://www.coinversation.io/joinus'
  },
  statemine: {
    chain: 'Statemine',
    genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
    icon: 'polkadot',
    ss58Format: 2,
    provider: 'wss://statemine.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 1000,
    nativeToken: 'KSM'
  },
  karura: {
    chain: 'Karura',
    genesisHash: '0xbaf5aabe40646d11f0ee8abbdc64f4a4b7674925cba08e4a05ff9ebed6e2126b',
    ss58Format: 8,
    provider: 'wss://karura.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2000,
    nativeToken: 'KAR',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan'
  },
  moonriver: {
    chain: 'Moonriver',
    genesisHash: '0x401a1f9dca3da46f5c4091016c8a2f26dcea05865116b286f60f668207d1474b',
    ss58Format: 1285,
    provider: 'wss://moonriver.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2023,
    isEthereum: true,
    nativeToken: 'MOVR',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan'
  },
  shiden: {
    chain: 'Shiden',
    genesisHash: '0xf1cf9022c7ebb34b162d5b5e34e705a5a740b2d0ecc1009fb89023e62a488108',
    ss58Format: 5,
    provider: 'wss://shiden.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2007,
    nativeToken: 'SDN',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan'
  },
  khala: {
    chain: 'Khala',
    genesisHash: '0xd43540ba6d3eb4897c28a77d48cb5b729fea37603cbbfc7a86a73b72adb3be8d',
    ss58Format: 30,
    provider: 'wss://khala.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2004,
    nativeToken: 'PHA',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan'
  },
  bifrost: {
    chain: 'Bifrost',
    genesisHash: '0x9f28c6a68e0fc9646eff64935684f6eeeece527e37bbe1f213d22caa1d9d6bed',
    ss58Format: 6,
    provider: 'wss://bifrost-parachain.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2001,
    nativeToken: 'BNC',
    crowdloanUrl: 'https://bifrost.app/vcrowdloan'
  },
  bifrost_testnet: {
    chain: 'Bifrost Testnet',
    genesisHash: '0x8b290fa39a8808f29d7309ea99442c95bf964838aef14be5a6449ae48f8a5f1f',
    ss58Format: 6,
    provider: 'wss://bifrost-rpc.testnet.liebi.com/ws',
    groups: ['KUSAMA_PARACHAIN'],
    nativeToken: 'BNC'
  },
  kilt: {
    chain: 'KILT Spiritnet',
    genesisHash: '0x411f057b9107718c9624d6aa4a3f23c1653898297f3d4d529d9bb6511a39dd21',
    ss58Format: 38,
    provider: 'wss://spiritnet.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2086,
    nativeToken: 'KILT',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan'
  },
  calamari: {
    chain: 'Calamari Parachain',
    genesisHash: '0x4ac80c99289841dd946ef92765bf659a307d39189b3ce374a92b5f0415ee17a1',
    ss58Format: 78,
    provider: 'wss://calamari.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2084,
    nativeToken: 'KMA',
    crowdloanUrl: 'https://calamari.network/'
  },
  basilisk: {
    chain: 'Basilisk',
    genesisHash: '0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755',
    ss58Format: 10041,
    provider: 'wss://basilisk.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2090,
    nativeToken: 'BSX',
    crowdloanUrl: 'https://loan.bsx.fi/'
  },
  altair: {
    chain: 'Altair',
    genesisHash: '0xaa3876c1dc8a1afcc2e9a685a49ff7704cfd36ad8c90bf2702b9d1b00cc40011',
    ss58Format: 136,
    provider: 'wss://altair.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2088,
    nativeToken: 'AIR',
    crowdloanUrl: 'https://centrifuge.io/altair/crowdloan/'
  },
  heiko: {
    chain: 'Heiko',
    genesisHash: '0x64a1c658a48b2e70a7fb1ad4c39eea35022568c20fc44a6e2e3d0a57aee6053b',
    ss58Format: 110,
    provider: 'wss://parallel-heiko.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2085,
    nativeToken: 'HKO',
    crowdloanUrl: 'https://crowdloan.parallel.fi/#/auction/contribute/kusama/2085'
  },
  kintsugi: {
    chain: 'Kintsugi',
    genesisHash: '0x9af9a64e6e4da8e3073901c3ff0cc4c3aad9563786d89daf6ad820b6e14a0b8b',
    ss58Format: 2092,
    provider: 'wss://kintsugi.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2092,
    nativeToken: 'KINT',
    crowdloanUrl: 'https://kintsugi.interlay.io/'
  },
  picasso: {
    chain: 'Picasso',
    genesisHash: '0x6811a339673c9daa897944dcdac99c6e2939cc88245ed21951a0a3c9a2be75bc',
    ss58Format: 49,
    provider: 'wss://picasso-rpc.composable.finance',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2087,
    nativeToken: 'PICA',
    crowdloanUrl: 'https://crowdloan.composable.finance/'
  },
  pioneer: {
    chain: 'Pioneer Network',
    genesisHash: '0xf22b7850cdd5a7657bbfd90ac86441275bbc57ace3d2698a740c7b0ec4de5ec3',
    ss58Format: 268,
    provider: 'wss://pioneer.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2096,
    nativeToken: 'NEER',
    crowdloanUrl: 'https://ksmcrowdloan.bit.country/'
  },
  quartz: {
    chain: 'QUARTZ by UNIQUE',
    genesisHash: '0xcd4d732201ebe5d6b014edda071c4203e16867305332301dc8d092044b28e554',
    ss58Format: 255,
    provider: 'wss://quartz.api.onfinality.io/public-ws',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2095,
    nativeToken: 'QTZ',
    crowdloanUrl: 'https://unique.network/quartz/crowdloan/'
  },
  genshiro: {
    chain: 'Genshiro',
    genesisHash: '0x9b8cefc0eb5c568b527998bdd76c184e2b76ae561be76e4667072230217ea243',
    ss58Format: 67,
    provider: 'wss://node.genshiro.io',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2024,
    nativeToken: 'GENS',
    crowdloanUrl: 'https://genshiro.equilibrium.io/en'
  },
  subsocial: {
    chain: 'Subsocial',
    genesisHash: '0x0bd72c1c305172e1275278aaeb3f161e02eccb7a819e63f62d47bd53a28189f8',
    ss58Format: 28,
    provider: 'wss://para.subsocial.network',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2100,
    nativeToken: 'SUB',
    crowdloanUrl: 'https://app.subsocial.network/crowdloan'
  },
  zeitgeist: {
    chain: 'Zeitgeist',
    genesisHash: '0x1bf2a2ecb4a868de66ea8610f2ce7c8c43706561b6476031315f6640fe38e060',
    ss58Format: 73,
    provider: 'wss://rpc-0.zeitgeist.pm',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2101,
    nativeToken: 'ZTG',
    crowdloanUrl: 'https://crowdloan.zeitgeist.pm/'
  },
  sakura: {
    chain: 'Sakura',
    genesisHash: 'UNKNOWN',
    ss58Format: -1,
    provider: 'PROVIDER',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2016,
    nativeToken: 'SKU',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan'
  },
  shadow: {
    chain: 'Crust Shadow',
    genesisHash: '0xd4c0c08ca49dc7c680c3dac71a7c0703e5b222f4b6c03fe4c5219bb8f22c18dc',
    ss58Format: 66,
    provider: 'wss://rpc-shadow.crust.network/',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2012,
    nativeToken: 'CSM',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan'
  },
  uniqueNft: {
    chain: 'Unique TestNet 2.0',
    genesisHash: 'UPDATING',
    ss58Format: -1,
    provider: 'wss://testnet2.uniquenetwork.io',
    groups: ['TEST_NET'],
    paraId: 2012,
    nativeToken: 'UNQ'
  },
  robonomics: {
    chain: 'Robonomics',
    genesisHash: '0x631ccc82a078481584041656af292834e1ae6daab61d2875b4dd0c14bb9b17bc',
    ss58Format: 32,
    provider: 'wss://kusama.rpc.robonomics.network',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2048,
    nativeToken: 'XRT',
    crowdloanUrl: 'https://robonomics.network/kusama-slot/'
  },
  integritee: {
    chain: 'Integritee Network',
    genesisHash: '0xf195ef30c646663a24a3164b307521174a86f437c586397a43183c736a8383c1',
    ss58Format: 13,
    provider: 'wss://api.solo.integritee.io',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2015,
    nativeToken: 'TEER',
    crowdloanUrl: 'https://crowdloan.integritee.network/'
  },
  crab: {
    chain: 'Darwinia Crab',
    genesisHash: '0x34f61bfda344b3fad3c3e38832a91448b3c613b199eb23e5110a635d71c13c65',
    ss58Format: 42,
    provider: 'wss://crab-rpc.darwinia.network',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2105,
    nativeToken: 'CRAB',
    crowdloanUrl: 'https://crab.network/plo'
  },
  pichiu: {
    chain: 'Pichiu',
    genesisHash: '0xb14149220320bdc127278f8055b96c1d27750337694e920c4b8053c15145d3b1',
    ss58Format: 42,
    provider: 'wss://kusama.kylin-node.co.uk',
    groups: ['KUSAMA_PARACHAIN'],
    paraId: 2102,
    nativeToken: 'PCHU',
    crowdloanUrl: 'https://polkadot.js.org/apps/#/parachains/crowdloan'
  },
  bitcountry: {
    chain: 'Bit.Country - Testnet',
    genesisHash: '0xfff6fd94251f570d4c9cdf25a0475da0d7ad35160290da19dad8f9caf8bf31b5',
    ss58Format: 42,
    provider: 'wss://tewai-rpc.bit.country',
    groups: ['TEST_NET'],
    nativeToken: 'NUUM'
  }
};

export default NETWORKS;
