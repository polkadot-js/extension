// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _DEFAULT_CHAINS } from '@subwallet/chain-list';
import { _SubstrateChainType } from '@subwallet/chain-list/types';
import { SingleModeJson, ThemeNames } from '@subwallet/extension-base/background/KoniTypes';

export const API_AUTO_CONNECT_MS = 3000;
export const API_CONNECT_TIMEOUT = 30000;
export const API_MAX_RETRY = 2;

export const _API_OPTIONS_CHAIN_GROUP = {
  acala: ['acala', 'karura', 'origintrail', 'kintsugi'],
  turing: ['turingStaging', 'turing'],
  avail: ['kate', 'availTuringTest', 'avail_mainnet'],
  goldberg: ['goldberg_testnet'],
  gear: ['vara_network', 'vara_testnet']
};

export const _PREDEFINED_SINGLE_MODES: Record<string, SingleModeJson> = {
  subspace: {
    networkKeys: ['subspace_gemini_2a', 'subspace_test', 'subspace_gemini_3a'],
    theme: ThemeNames.SUBSPACE,
    autoTriggerDomain: 'subspace.network'
  }
};

export const _PURE_EVM_CHAINS = ['binance', 'binance_test', 'ethereum', 'ethereum_goerli', 'astarEvm', 'shidenEvm', 'shibuyaEvm', 'crabEvm', 'pangolinEvm', 'cloverEvm', 'boba_rinkeby', 'boba', 'bobabase', 'bobabeam', 'watr_network_evm'];

// Get balance----------------------------------------------------------------------------------------------------------

export const _BALANCE_CHAIN_GROUP = {
  kintsugi: ['kintsugi', 'interlay', 'kintsugi_test', 'mangatax_para'],
  genshiro: ['genshiro_testnet', 'genshiro'],
  equilibrium_parachain: ['equilibrium_parachain'],
  bifrost: ['bifrost', 'acala', 'karura', 'acala_testnet', 'pioneer', 'bitcountry', 'bifrost_dot', 'hydradx_main', 'hydradx_rococo', 'pendulum', 'amplitude', 'continuum_network'],
  statemine: ['statemine', 'astar', 'shiden', 'statemint', 'moonbeam', 'moonbase', 'moonriver', 'crabParachain', 'darwinia2', 'parallel', 'calamari', 'manta_network', 'rococo_assethub', 'liberlandTest', 'liberland', 'dentnet', 'pangolin', 'crust', 'phala', 'shibuya', 'dbcchain'],
  kusama: ['kusama', 'kintsugi', 'kintsugi_test', 'interlay', 'acala', 'statemint', 'karura', 'bifrost'], // perhaps there are some runtime updates
  centrifuge: ['centrifuge'],
  supportBridged: ['rococo_assethub', 'statemint', 'statemine']
};

export const _BALANCE_TOKEN_GROUP = {
  crab: ['CKTON', 'PKTON'],
  bitcountry: ['BIT']
};

export const _NFT_CHAIN_GROUP = {
  acala: ['acala'],
  karura: ['karura'], // TODO: karura and acala should be the same
  rmrk: ['kusama'],
  statemine: ['statemine'],
  statemint: ['statemint'],
  unique_network: ['unique_network', 'quartz', 'opal'],
  unique_evm: ['unique_evm'],
  bitcountry: ['bitcountry', 'pioneer', 'continuum_network'],
  vara: ['vara_network'],
  avail: ['avail_mainnet']
};

// Staking--------------------------------------------------------------------------------------------------------------

export const _STAKING_ERA_LENGTH_MAP: Record<string, number> = { // in hours
  alephTest: 24,
  aleph: 24,
  polkadot: 24,
  kusama: 6,
  westend: 6,
  hydradx: 24,
  default: 24,
  moonbeam: 6,
  moonriver: 2,
  moonbase: 2,
  turing: 2,
  turingStaging: 2,
  astar: 24,
  shiden: 24,
  shibuya: 24,
  bifrost_testnet: 0.5,
  bifrost: 13 * 600 / 3600, // real blocktime of bifros ksm = 13s
  bifrost_dot: 24,
  ternoa: 24,
  calamari: 6,
  calamari_test: 6,
  amplitude: 2,
  amplitude_test: 2,
  pendulum: 2,
  kilt: 2,
  kilt_peregrine: 2,
  edgeware: 6,
  kate: 6,
  creditcoin: 24,
  vara_network: 12,
  vara_testnet: 12,
  goldberg_testnet: 24,
  manta_network: 6,
  krest_network: 4,
  polimec: 6,
  enjin_relaychain: 24,
  availTuringTest: 24,
  polkadex: 24,
  avail_mainnet: 24
};

export const _EXPECTED_BLOCK_TIME: Record<string, number> = { // in seconds
  alephTest: 1,
  aleph: 1,
  polkadot: 6,
  kusama: 6,
  polkadex: 12,
  ternoa: 6,
  ternoa_alphanet: 6,
  westend: 6,
  kate: 20,
  edgeware: 6,
  creditcoin: 12,
  vara_network: 3,
  vara_testnet: 3,
  goldberg_testnet: 20,
  polimec: 12,
  bifrost: 13, // expect 12 but actual 13
  moonbeam: 12,
  moonriver: 12,
  moonbase: 6,
  turing: 12,
  turingStaging: 12,
  bifrost_testnet: 3,
  calamari: 12,
  calamari_test: 12,
  manta_network: 12,
  enjin_relaychain: 6,
  availTuringTest: 20,
  avail_mainnet: 20,
  dentnet: 3
};

export const _PARACHAIN_INFLATION_DISTRIBUTION: Record<string, Record<string, number>> = {
  moonbeam: { // https://docs.moonbeam.network/learn/features/staking/#annual-inflation
    reward: 0.5,
    collatorCommission: 0.2,
    bondReserve: 0.3
  },
  moonriver: {
    reward: 0.5,
    collatorCommission: 0.2,
    bondReserve: 0.3
  },
  moonbase: {
    reward: 0.5,
    collatorCommission: 0.2,
    bondReserve: 0.3
  },
  turing: { // https://docs.oak.tech/docs/delegators/
    reward: 0.5
  },
  turingStaging: { // https://docs.oak.tech/docs/delegators/
    reward: 0.5
  },
  bifrost: {
    reward: 0
  },
  bifrost_testnet: {
    reward: 0
  },
  calamari_test: {
    reward: 0.9
  },
  calamari: {
    reward: 0.9
  },
  default: {
    reward: 0
  }
};

export interface _SubstrateInflationParams {
  auctionAdjust: number;
  auctionMax: number;
  falloff: number;
  maxInflation: number;
  minInflation: number;
  stakeTarget: number;
  yearlyInflationInTokens?: number;
}

export interface _SubstrateUniformEraPayoutInflationParams extends _SubstrateInflationParams {
  yearlyInflationInTokens: number;
}

export const _SUBSTRATE_DEFAULT_INFLATION_PARAMS: _SubstrateInflationParams = {
  auctionAdjust: 0,
  auctionMax: 0,
  // 5% for falloff, as per the defaults, see
  // https://github.com/paritytech/polkadot/blob/816cb64ea16102c6c79f6be2a917d832d98df757/runtime/kusama/src/lib.rs#L534
  falloff: 0.05,
  // 10% max, 0.25% min, see
  // https://github.com/paritytech/polkadot/blob/816cb64ea16102c6c79f6be2a917d832d98df757/runtime/kusama/src/lib.rs#L523
  maxInflation: 0.1,
  minInflation: 0.025,
  stakeTarget: 0.5
};

const _ALEPH_DEFAULT_UNIFORM_ERA_PAYOUT_PARAMS: _SubstrateUniformEraPayoutInflationParams = {
  ..._SUBSTRATE_DEFAULT_INFLATION_PARAMS,
  yearlyInflationInTokens: 30000000
};

export const _KNOWN_CHAIN_INFLATION_PARAMS: Record<string, _SubstrateInflationParams> = {
  aleph: _ALEPH_DEFAULT_UNIFORM_ERA_PAYOUT_PARAMS,
  alephTest: _ALEPH_DEFAULT_UNIFORM_ERA_PAYOUT_PARAMS,
  dock_pos: { ..._SUBSTRATE_DEFAULT_INFLATION_PARAMS, stakeTarget: 0.75 },
  kusama: { ..._SUBSTRATE_DEFAULT_INFLATION_PARAMS, auctionAdjust: (0.3 / 60), auctionMax: 60, stakeTarget: 0.75 },
  neatcoin: { ..._SUBSTRATE_DEFAULT_INFLATION_PARAMS, stakeTarget: 0.75 },
  nft_mart: { ..._SUBSTRATE_DEFAULT_INFLATION_PARAMS, falloff: 0.04, stakeTarget: 0.60 },
  polkadot: { ..._SUBSTRATE_DEFAULT_INFLATION_PARAMS, stakeTarget: 0.75 },
  vara_network: { ..._SUBSTRATE_DEFAULT_INFLATION_PARAMS, stakeTarget: 0.8 },
  vara_testnet: { ..._SUBSTRATE_DEFAULT_INFLATION_PARAMS, stakeTarget: 0.8 },
  avail_mainnet: { ..._SUBSTRATE_DEFAULT_INFLATION_PARAMS, maxInflation: 0.05, minInflation: 0.01 },
  dentnet: { ..._SUBSTRATE_DEFAULT_INFLATION_PARAMS, falloff: 0.5 }
};

// Send fund------------------------------------------------------------------------------------------------------------

export const _TRANSFER_NOT_SUPPORTED_CHAINS = ['subspace_gemini_3a', 'kulupu', 'joystream', 'equilibrium_parachain', 'genshiro_testnet', 'genshiro'];

export const _TRANSFER_CHAIN_GROUP = {
  acala: ['karura', 'acala', 'acala_testnet'],
  kintsugi: ['kintsugi', 'kintsugi_test', 'interlay', 'mangatax_para'],
  genshiro: ['genshiro_testnet', 'genshiro', 'equilibrium_parachain'],
  // crab: ['crab', 'pangolin'],
  bitcountry: ['pioneer', 'bitcountry', 'bifrost', 'bifrost_dot'],
  statemine: ['statemint', 'statemine', 'darwinia2', 'astar', 'shiden', 'shibuya', 'parallel', 'liberland', 'liberlandTest', 'dentnet', 'dbcchain'],
  riochain: ['riochain'],
  sora_substrate: ['sora_substrate'],
  avail: ['kate', 'goldberg_testnet'],
  pendulum: ['pendulum', 'amplitude', 'amplitude_test', 'hydradx_main'],
  centrifuge: ['centrifuge'],
  disable_transfer: ['invarch', 'crab', 'pangolin']
};

export const _BALANCE_PARSING_CHAIN_GROUP = {
  bobabeam: ['bobabeam', 'bobabase']
};

export const _MANTA_ZK_CHAIN_GROUP = ['calamari'];

export const _ZK_ASSET_PREFIX = 'zk';

export const _DEFAULT_MANTA_ZK_CHAIN = 'calamari';

// XCM------------------------------------------------------------------------------------------------------------------

export const _XCM_CHAIN_GROUP = {
  polkadotXcm: ['astar', 'shiden', 'statemine', 'statemint', 'equilibrium_parachain', 'rococo_assethub', 'mythos'],
  xcmPallet: ['polkadot', 'kusama', 'rococo']
  // default is xTokens pallet
};

export const _XCM_TYPE = {
  RP: `${_SubstrateChainType.RELAYCHAIN}-${_SubstrateChainType.PARACHAIN}`, // DMP
  PP: `${_SubstrateChainType.PARACHAIN}-${_SubstrateChainType.PARACHAIN}`, // HRMP
  PR: `${_SubstrateChainType.PARACHAIN}-${_SubstrateChainType.RELAYCHAIN}` // UMP
};

export const _DEFAULT_ACTIVE_CHAINS = [
  ..._DEFAULT_CHAINS,
  'vara_network'
];

export const EVM_PASS_CONNECT_STATUS: Record<string, string[]> = {
  arbitrum_one: ['*'],
  okxTest: ['*'],
  astarZkEvm: ['*'],
  xlayer: ['*'],
  aleph_evm: ['*']
};

export const EVM_REFORMAT_DECIMALS = {
  acala: ['acala_evm', 'karura_evm']
};

export const LATEST_CHAIN_DATA_FETCHING_INTERVAL = 120000;

// TODO: review
const TARGET_BRANCH = process.env.NODE_ENV !== 'production' ? 'koni-dev' : 'master';

export const _CHAIN_INFO_SRC = `https://raw.githubusercontent.com/Koniverse/SubWallet-Chain/${TARGET_BRANCH}/packages/chain-list/src/data/ChainInfo.json`;
export const _CHAIN_ASSET_SRC = `https://raw.githubusercontent.com/Koniverse/SubWallet-Chain/${TARGET_BRANCH}/packages/chain-list/src/data/ChainAsset.json`;
export const _ASSET_REF_SRC = `https://raw.githubusercontent.com/Koniverse/SubWallet-Chain/${TARGET_BRANCH}/packages/chain-list/src/data/AssetRef.json`;
export const _MULTI_CHAIN_ASSET_SRC = `https://raw.githubusercontent.com/Koniverse/SubWallet-Chain/${TARGET_BRANCH}/packages/chain-list/src/data/MultiChainAsset.json`;
export const _CHAIN_LOGO_MAP_SRC = `https://raw.githubusercontent.com/Koniverse/SubWallet-Chain/${TARGET_BRANCH}/packages/chain-list/src/data/ChainLogoMap.json`;
export const _ASSET_LOGO_MAP_SRC = `https://raw.githubusercontent.com/Koniverse/SubWallet-Chain/${TARGET_BRANCH}/packages/chain-list/src/data/AssetLogoMap.json`;
