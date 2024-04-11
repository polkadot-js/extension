// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/chain-list';
import { ExtrinsicType, LedgerNetwork } from '@subwallet/extension-base/background/KoniTypes';

export const PredefinedLedgerNetwork: LedgerNetwork[] = [
  {
    accountName: 'Polkadot',
    appName: 'Polkadot',
    networkName: 'Polkadot network',
    genesisHash: ChainInfoMap.polkadot.substrateInfo?.genesisHash || '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    icon: 'substrate',
    network: 'polkadot',
    slug: ChainInfoMap.polkadot.slug,
    isDevMode: false,
    isEthereum: false
  },
  {
    accountName: 'Statemint',
    appName: 'Statemint',
    networkName: 'Polkadot Assets Hub (Statemint) network',
    genesisHash: ChainInfoMap.statemint.substrateInfo?.genesisHash || '0x68d56f15f85d3136970ec16946040bc1752654e906147f7e43e9d539d7c3de2f',
    icon: 'substrate',
    network: 'statemint',
    slug: ChainInfoMap.statemint.slug,
    isDevMode: false,
    isEthereum: false
  },
  {
    accountName: 'Statemine',
    appName: 'Statemine',
    networkName: 'Kusama Assets Hub (Statemine) network',
    genesisHash: ChainInfoMap.statemine.substrateInfo?.genesisHash || '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
    icon: 'substrate',
    network: 'statemine',
    slug: ChainInfoMap.statemine.slug,
    isDevMode: false,
    isEthereum: false
  },
  {
    accountName: 'Kusama',
    appName: 'Kusama',
    networkName: 'Kusama network',
    genesisHash: ChainInfoMap.kusama.substrateInfo?.genesisHash || '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
    icon: 'substrate',
    network: 'kusama',
    slug: ChainInfoMap.kusama.slug,
    isDevMode: false,
    isEthereum: false
  },
  {
    accountName: 'Acala',
    appName: 'Acala',
    networkName: 'Acala network',
    genesisHash: ChainInfoMap.acala.substrateInfo?.genesisHash || '0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c',
    icon: 'substrate',
    network: 'acala',
    slug: ChainInfoMap.acala.slug,
    isDevMode: false,
    isEthereum: false
  },
  {
    accountName: 'Aleph Zero',
    appName: 'Aleph Zero',
    networkName: 'Aleph Zero network',
    genesisHash: ChainInfoMap.aleph.substrateInfo?.genesisHash || '0x70255b4d28de0fc4e1a193d7e175ad1ccef431598211c55538f1018651a0344e',
    icon: 'substrate',
    network: 'aleph-node',
    slug: ChainInfoMap.aleph.slug,
    isDevMode: false,
    isEthereum: false
  },
  {
    accountName: 'Astar',
    appName: 'Astar',
    networkName: 'Astar network',
    genesisHash: ChainInfoMap.astar.substrateInfo?.genesisHash || '0x9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6',
    icon: 'substrate',
    network: 'astar',
    slug: ChainInfoMap.astar.slug,
    isDevMode: false,
    isEthereum: false
  },
  {
    accountName: 'EVM',
    appName: 'Ethereum',
    networkName: 'EVM networks',
    genesisHash: '',
    network: 'ethereum',
    icon: 'ethereum',
    slug: ChainInfoMap.ethereum.slug,
    isDevMode: false,
    isEthereum: true
  },
  {
    accountName: 'Karura',
    appName: 'Karura',
    networkName: 'Karura network',
    genesisHash: ChainInfoMap.karura.substrateInfo?.genesisHash || '0xbaf5aabe40646d11f0ee8abbdc64f4a4b7674925cba08e4a05ff9ebed6e2126b',
    icon: 'substrate',
    network: 'karura',
    slug: ChainInfoMap.karura.slug,
    isDevMode: false,
    isEthereum: false
  },
  {
    accountName: 'Edgeware',
    appName: 'Edgeware',
    networkName: 'Edgeware network',
    genesisHash: ChainInfoMap.edgeware.substrateInfo?.genesisHash || '0x742a2ca70c2fda6cee4f8df98d64c4c670a052d9568058982dad9d5a7a135c5b',
    icon: 'substrate',
    network: 'edgeware',
    slug: ChainInfoMap.edgeware.slug,
    isDevMode: true,
    isEthereum: false
  },
  {
    accountName: 'XX Network',
    appName: 'XX Network',
    networkName: 'XX network',
    genesisHash: ChainInfoMap.xx_network.substrateInfo?.genesisHash || '0x50dd5d206917bf10502c68fb4d18a59fc8aa31586f4e8856b493e43544aa82aa',
    icon: 'substrate',
    network: 'xxnetwork',
    slug: ChainInfoMap.xx_network.slug,
    isDevMode: true,
    isEthereum: false
  },
  {
    accountName: 'Polymesh',
    appName: 'Polymesh',
    networkName: 'Polymesh network',
    genesisHash: ChainInfoMap.polymesh.substrateInfo?.genesisHash || '0x6fbd74e5e1d0a61d52ccfe9d4adaed16dd3a7caa37c6bc4d0c2fa12e8b2f4063',
    icon: 'substrate',
    network: 'polymesh',
    slug: ChainInfoMap.polymesh.slug,
    isDevMode: true,
    isEthereum: false
  }
  // {
  //   displayName: 'Centrifuge',
  //   genesisHash: '0xb3db41421702df9a7fcac62b53ffeac85f7853cc4e689e0b93aeb3db18c09d82',
  //   icon: 'substrate',
  //   network: 'centrifuge',
  //   isDevMode: false
  // },
  // {
  //   displayName: 'Genshiro',
  //   genesisHash: '0x9b8cefc0eb5c568b527998bdd76c184e2b76ae561be76e4667072230217ea243',
  //   icon: 'substrate',
  //   network: 'genshiro',
  //   isDevMode: true
  // },
  // {
  //   displayName: 'Parallel',
  //   genesisHash: '0xe61a41c53f5dcd0beb09df93b34402aada44cb05117b71059cce40a2723a4e97',
  //   icon: 'substrate',
  //   network: 'parallel',
  //   isDevMode: true
  // },
  // {
  //   displayName: 'Polkadex network',
  //   genesisHash: ChainInfoMap.polkadex.substrateInfo?.genesisHash || '0x3920bcb4960a1eef5580cd5367ff3f430eef052774f78468852f7b9cb39f8a3c',
  //   icon: 'substrate',
  //   network: 'polkadex',
  //   slug: ChainInfoMap.polkadex.slug,
  //   isDevMode: true
  // }
];

export const isLedgerCapable = !!(window as unknown as { USB?: unknown }).USB;

/*
  BLOCK
  *: All network,
  evm: All evm network,
  substrate: All substrate network
*/

export const BLOCK_DEFAULT_LEDGER_NETWORKS: string[] = ['*'];

/* TRANSFER */
export const BLOCK_TRANSFER_NATIVE_LEDGER_NETWORKS: string[] = [];
export const BLOCK_TRANSFER_TOKEN_LEDGER_NETWORKS: string[] = [];
export const BLOCK_TRANSFER_XCM_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_TRANSFER_NFT_LEDGER_NETWORKS: string[] = ['astar'];
/* TRANSFER */

/* STAKING */
// NOMINATE
export const BLOCK_STAKING_BONDING_LEDGER_NETWORKS: string[] = ['evm'];
export const BLOCK_STAKING_UN_BONDING_LEDGER_NETWORKS: string[] = ['evm'];
export const BLOCK_STAKING_WITHDRAW_LEDGER_NETWORKS: string[] = ['evm'];

// POOL
export const BLOCK_STAKING_JOIN_POOL_LEDGER_NETWORKS: string[] = ['evm'];
export const BLOCK_STAKING_LEAVE_POOL_LEDGER_NETWORKS: string[] = ['evm'];
export const BLOCK_STAKING_POOL_WITHDRAW_LEDGER_NETWORKS: string[] = ['evm'];

// COMMON
export const BLOCK_STAKING_CANCEL_UNSTAKE_LEDGER_NETWORKS: string[] = ['evm'];
export const BLOCK_STAKING_CLAIM_REWARD_LEDGER_NETWORKS: string[] = ['evm'];

// OTHER
export const BLOCK_STAKING_COMPOUNDING_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_STAKING_CANCEL_COMPOUNDING_LEDGER_NETWORKS: string[] = ['*'];
/* STAKING */

/* EARNING */
export const BLOCK_JOIN_YIELD_POOL_LEDGER_NETWORKS: string[] = [];
export const BLOCK_MINT_LDOT_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_MINT_QDOT_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_MINT_SDOT_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_MINT_VDOT_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_MINT_VMANTA_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_MINT_STDOT_LEDGER_NETWORKS: string[] = [];

export const BLOCK_REDEEM_LDOT_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_REDEEM_QDOT_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_REDEEM_SDOT_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_REDEEM_VDOT_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_REDEEM_VMANTA_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_REDEEM_STDOT_LEDGER_NETWORKS: string[] = [];

export const BLOCK_UNSTAKE_QDOT_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_UNSTAKE_VDOT_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_UNSTAKE_VMANTA_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_UNSTAKE_LDOT_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_UNSTAKE_SDOT_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_UNSTAKE_STDOT_LEDGER_NETWORKS: string[] = [];

export const BLOCK_APPROVE_LEDGER_NETWORKS: string[] = [];
/* EARNING */

/// OTHER
export const BLOCK_CROWDLOAN_LEDGER_NETWORKS: string[] = ['*'];
export const BLOCK_EVM_EXECUTE_LEDGER_NETWORKS: string[] = ['substrate'];
export const BLOCK_UNKNOWN_LEDGER_NETWORKS: string[] = ['*'];

export const BLOCK_SWAP_LEDGER_NETWORKS: string[] = [];

export const BLOCK_ACTION_LEDGER_NETWORKS: Record<ExtrinsicType, string[]> = {
  /* TRANSFER */
  [ExtrinsicType.TRANSFER_BALANCE]: BLOCK_TRANSFER_NATIVE_LEDGER_NETWORKS,
  [ExtrinsicType.TRANSFER_TOKEN]: BLOCK_TRANSFER_TOKEN_LEDGER_NETWORKS,
  [ExtrinsicType.TRANSFER_XCM]: BLOCK_TRANSFER_XCM_LEDGER_NETWORKS,
  [ExtrinsicType.SEND_NFT]: BLOCK_TRANSFER_NFT_LEDGER_NETWORKS,
  /* TRANSFER */

  /* STAKING */
  [ExtrinsicType.STAKING_BOND]: BLOCK_STAKING_BONDING_LEDGER_NETWORKS,
  [ExtrinsicType.STAKING_UNBOND]: BLOCK_STAKING_UN_BONDING_LEDGER_NETWORKS,
  [ExtrinsicType.STAKING_WITHDRAW]: BLOCK_STAKING_WITHDRAW_LEDGER_NETWORKS,

  [ExtrinsicType.STAKING_JOIN_POOL]: BLOCK_STAKING_JOIN_POOL_LEDGER_NETWORKS,
  [ExtrinsicType.STAKING_LEAVE_POOL]: BLOCK_STAKING_LEAVE_POOL_LEDGER_NETWORKS,
  [ExtrinsicType.STAKING_POOL_WITHDRAW]: BLOCK_STAKING_POOL_WITHDRAW_LEDGER_NETWORKS,

  [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: BLOCK_STAKING_CANCEL_UNSTAKE_LEDGER_NETWORKS,
  [ExtrinsicType.STAKING_CLAIM_REWARD]: BLOCK_STAKING_CLAIM_REWARD_LEDGER_NETWORKS,

  [ExtrinsicType.STAKING_COMPOUNDING]: BLOCK_STAKING_COMPOUNDING_LEDGER_NETWORKS,
  [ExtrinsicType.STAKING_CANCEL_COMPOUNDING]: BLOCK_STAKING_CANCEL_COMPOUNDING_LEDGER_NETWORKS,
  /* STAKING */

  /* EARNING */
  [ExtrinsicType.JOIN_YIELD_POOL]: BLOCK_JOIN_YIELD_POOL_LEDGER_NETWORKS,
  [ExtrinsicType.MINT_LDOT]: BLOCK_MINT_LDOT_LEDGER_NETWORKS,
  [ExtrinsicType.MINT_QDOT]: BLOCK_MINT_QDOT_LEDGER_NETWORKS,
  [ExtrinsicType.MINT_SDOT]: BLOCK_MINT_SDOT_LEDGER_NETWORKS,
  [ExtrinsicType.MINT_VDOT]: BLOCK_MINT_VDOT_LEDGER_NETWORKS,
  [ExtrinsicType.MINT_VMANTA]: BLOCK_MINT_VMANTA_LEDGER_NETWORKS,
  [ExtrinsicType.MINT_STDOT]: BLOCK_MINT_STDOT_LEDGER_NETWORKS,

  [ExtrinsicType.REDEEM_LDOT]: BLOCK_REDEEM_LDOT_LEDGER_NETWORKS,
  [ExtrinsicType.REDEEM_QDOT]: BLOCK_REDEEM_QDOT_LEDGER_NETWORKS,
  [ExtrinsicType.REDEEM_SDOT]: BLOCK_REDEEM_SDOT_LEDGER_NETWORKS,
  [ExtrinsicType.REDEEM_VDOT]: BLOCK_REDEEM_VDOT_LEDGER_NETWORKS,
  [ExtrinsicType.REDEEM_VMANTA]: BLOCK_REDEEM_VMANTA_LEDGER_NETWORKS,
  [ExtrinsicType.REDEEM_STDOT]: BLOCK_REDEEM_STDOT_LEDGER_NETWORKS,

  [ExtrinsicType.UNSTAKE_QDOT]: BLOCK_UNSTAKE_QDOT_LEDGER_NETWORKS,
  [ExtrinsicType.UNSTAKE_VDOT]: BLOCK_UNSTAKE_VDOT_LEDGER_NETWORKS,
  [ExtrinsicType.UNSTAKE_VMANTA]: BLOCK_UNSTAKE_VMANTA_LEDGER_NETWORKS,
  [ExtrinsicType.UNSTAKE_LDOT]: BLOCK_UNSTAKE_LDOT_LEDGER_NETWORKS,
  [ExtrinsicType.UNSTAKE_SDOT]: BLOCK_UNSTAKE_SDOT_LEDGER_NETWORKS,
  [ExtrinsicType.UNSTAKE_STDOT]: BLOCK_UNSTAKE_STDOT_LEDGER_NETWORKS,

  [ExtrinsicType.TOKEN_APPROVE]: BLOCK_APPROVE_LEDGER_NETWORKS,
  /* STAKING */

  [ExtrinsicType.SWAP]: BLOCK_SWAP_LEDGER_NETWORKS,

  [ExtrinsicType.CROWDLOAN]: BLOCK_CROWDLOAN_LEDGER_NETWORKS,
  [ExtrinsicType.EVM_EXECUTE]: BLOCK_EVM_EXECUTE_LEDGER_NETWORKS,
  [ExtrinsicType.UNKNOWN]: BLOCK_UNKNOWN_LEDGER_NETWORKS
};
