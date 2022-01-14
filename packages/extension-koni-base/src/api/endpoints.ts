// Copyright 2019-2021 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { NetWorkInfo } from './types';

const networks: Record<string, NetWorkInfo> = {
  polkadot: {
    chain: 'Polkadot Relay Chain',
    genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    icon: 'polkadot',
    ss58Format: 0,
    provider: 'wss://polkadot.api.onfinality.io/public-ws',
    group: 'RELAY_CHAIN'
  },
  kusama: {
    chain: 'Kusama Relay Chain',
    genesisHash: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
    icon: 'polkadot',
    ss58Format: 2,
    provider: 'wss://kusama.api.onfinality.io/public-ws',
    group: 'RELAY_CHAIN'
  },
  westend: {
    chain: 'Westend Relay Chain',
    genesisHash: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
    icon: 'polkadot',
    ss58Format: 42,
    provider: 'wss://westend.api.onfinality.io/public-ws',
    group: 'RELAY_CHAIN'
  },
  koni: {
    chain: 'Koni test',
    genesisHash: '0x7a48390870728092c951aaf4e1632c849a74489d9cee0bf51d3527b33983fc0a',
    icon: 'polkadot',
    ss58Format: 42,
    provider: 'wss://rpc.koniverse.com',
    group: 'POLKADOT_PARACHAIN'
  },
  statemint: {
    chain: 'Statemint',
    genesisHash: '0x68d56f15f85d3136970ec16946040bc1752654e906147f7e43e9d539d7c3de2f',
    icon: 'polkadot',
    ss58Format: 0,
    provider: 'wss://statemint.api.onfinality.io/public-ws',
    group: 'POLKADOT_PARACHAIN'
  },
  acala: {
    chain: 'Acala',
    genesisHash: '0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c',
    ss58Format: 10,
    provider: 'wss://acala-polkadot.api.onfinality.io/public-ws',
    group: 'POLKADOT_PARACHAIN'
  },
  moonbeam: {
    chain: 'Moonbeam',
    genesisHash: '0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d',
    ss58Format: 1284,
    provider: 'wss://moonbeam.api.onfinality.io/public-ws',
    group: 'POLKADOT_PARACHAIN'
  },
  astar: {
    chain: 'Astar',
    genesisHash: '0x9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6',
    ss58Format: 5,
    provider: 'wss://astar.api.onfinality.io/public-ws',
    group: 'POLKADOT_PARACHAIN'
  },
  parallel: {
    chain: 'Parallel',
    genesisHash: '0xe61a41c53f5dcd0beb09df93b34402aada44cb05117b71059cce40a2723a4e97',
    ss58Format: 172,
    provider: 'wss://parallel.api.onfinality.io/public-ws',
    group: 'POLKADOT_PARACHAIN'
  },
  clover: {
    chain: 'Clover',
    genesisHash: '0x5c7bd13edf349b33eb175ffae85210299e324d852916336027391536e686f267',
    ss58Format: 128,
    provider: 'wss://rpc-para.clover.finance/',
    group: 'POLKADOT_PARACHAIN'
  },
  hydradx: {
    chain: 'HydraDX',
    genesisHash: '0xd2a620c27ec5cbc5621ff9a522689895074f7cca0d08e7134a7804e1a3ba86fc',
    ss58Format: 63,
    provider: 'wss://rpc-01.snakenet.hydradx.io/',
    group: 'POLKADOT_PARACHAIN'
  },
  statemine: {
    chain: 'Statemine',
    genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
    icon: 'polkadot',
    ss58Format: 2,
    provider: 'wss://statemine.api.onfinality.io/public-ws',
    group: 'KUSAMA_PARACHAIN'
  },
  karura: {
    chain: 'Karura',
    genesisHash: '0xbaf5aabe40646d11f0ee8abbdc64f4a4b7674925cba08e4a05ff9ebed6e2126b',
    ss58Format: 8,
    provider: 'wss://karura.api.onfinality.io/public-ws',
    group: 'KUSAMA_PARACHAIN'
  },
  moonriver: {
    chain: 'Moonriver',
    genesisHash: '0x401a1f9dca3da46f5c4091016c8a2f26dcea05865116b286f60f668207d1474b',
    ss58Format: 1285,
    provider: 'wss://moonriver.api.onfinality.io/public-ws',
    group: 'KUSAMA_PARACHAIN'
  },
  shiden: {
    chain: 'Shiden',
    genesisHash: '0xf1cf9022c7ebb34b162d5b5e34e705a5a740b2d0ecc1009fb89023e62a488108',
    ss58Format: 5,
    provider: 'wss://shiden.api.onfinality.io/public-ws',
    group: 'KUSAMA_PARACHAIN'
  },
  khala: {
    chain: 'Khala',
    genesisHash: '0xd43540ba6d3eb4897c28a77d48cb5b729fea37603cbbfc7a86a73b72adb3be8d',
    ss58Format: 30,
    provider: 'wss://khala-api.phala.network/ws',
    group: 'KUSAMA_PARACHAIN'
  },
  bifrost: {
    chain: 'Bifrost',
    genesisHash: '0x9f28c6a68e0fc9646eff64935684f6eeeece527e37bbe1f213d22caa1d9d6bed',
    ss58Format: 6,
    provider: 'wss://bifrost-parachain.api.onfinality.io/public-ws',
    group: 'KUSAMA_PARACHAIN'
  },
  kilt: {
    chain: 'KILT Spiritnet',
    genesisHash: '0x411f057b9107718c9624d6aa4a3f23c1653898297f3d4d529d9bb6511a39dd21',
    ss58Format: 38,
    provider: 'wss://spiritnet.api.onfinality.io/public-ws',
    group: 'KUSAMA_PARACHAIN'
  },
  calamari: {
    chain: 'Calamari Parachain',
    genesisHash: '0x4ac80c99289841dd946ef92765bf659a307d39189b3ce374a92b5f0415ee17a1',
    ss58Format: 78,
    provider: 'wss://calamari.api.onfinality.io/public-ws',
    group: 'KUSAMA_PARACHAIN'
  },
  basilisk: {
    chain: 'Basilisk',
    genesisHash: '0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755',
    ss58Format: 10041,
    provider: 'wss://basilisk.api.onfinality.io/public-ws',
    group: 'KUSAMA_PARACHAIN'
  },
  altair: {
    chain: 'Altair',
    genesisHash: '0xaa3876c1dc8a1afcc2e9a685a49ff7704cfd36ad8c90bf2702b9d1b00cc40011',
    ss58Format: 136,
    provider: 'wss://altair.api.onfinality.io/public-ws',
    group: 'KUSAMA_PARACHAIN'
  },
  heiko: {
    chain: 'Heiko',
    genesisHash: '0x64a1c658a48b2e70a7fb1ad4c39eea35022568c20fc44a6e2e3d0a57aee6053b',
    ss58Format: 110,
    provider: 'wss://heiko-rpc.parallel.fi/',
    group: 'KUSAMA_PARACHAIN'
  },
  kintsugi: {
    chain: 'Kintsugi',
    genesisHash: '0x9af9a64e6e4da8e3073901c3ff0cc4c3aad9563786d89daf6ad820b6e14a0b8b',
    ss58Format: 2092,
    provider: 'wss://kintsugi.api.onfinality.io/public-ws',
    group: 'KUSAMA_PARACHAIN'
  },
  picasso: {
    chain: 'Picasso',
    genesisHash: '0x6811a339673c9daa897944dcdac99c6e2939cc88245ed21951a0a3c9a2be75bc',
    ss58Format: 49,
    provider: 'wss://picasso-rpc.composable.finance/',
    group: 'KUSAMA_PARACHAIN'
  },
  pioneer: {
    chain: 'Pioneer Network',
    genesisHash: '0xf22b7850cdd5a7657bbfd90ac86441275bbc57ace3d2698a740c7b0ec4de5ec3',
    ss58Format: 268,
    provider: 'wss://pioneer.api.onfinality.io/public-ws',
    group: 'KUSAMA_PARACHAIN'
  },
  quartz: {
    chain: 'QUARTZ by UNIQUE',
    genesisHash: '0xcd4d732201ebe5d6b014edda071c4203e16867305332301dc8d092044b28e554',
    ss58Format: 255,
    provider: 'wss://us-ws-quartz.unique.network/',
    group: 'KUSAMA_PARACHAIN'
  },
  // "genshiro": {
  //   "chain": "Genshiro",
  //   "genesisHash": "0x9b8cefc0eb5c568b527998bdd76c184e2b76ae561be76e4667072230217ea243",
  //   "ss58Format": 67,
  //   "provider": "wss://node.genshiro.io/",
  //   "group": "KUSAMA_PARACHAIN",
  // },
  subsocial: {
    chain: 'Subsocial',
    genesisHash: '0x0bd72c1c305172e1275278aaeb3f161e02eccb7a819e63f62d47bd53a28189f8',
    ss58Format: 28,
    provider: 'wss://subsocial.api.onfinality.io/public-ws',
    group: 'KUSAMA_PARACHAIN'
  },
  zeitgeist: {
    chain: 'Zeitgeist',
    genesisHash: 'UNKNOWN',
    ss58Format: -1,
    provider: 'PROVIDER',
    group: 'NOT_SURE'
  },
  sakura: {
    chain: 'Sakura',
    genesisHash: 'UNKNOWN',
    ss58Format: -1,
    provider: 'PROVIDER',
    group: 'NOT_SURE'
  },
  shadow: {
    chain: 'Crust Shadow',
    genesisHash: 'UNKNOWN',
    ss58Format: -1,
    provider: 'PROVIDER',
    group: 'NOT_SURE'
  }
};

export default networks;
