// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SwapProviderId } from '@subwallet/extension-base/types/swap';
import { DefaultLogosMap } from '@subwallet/extension-web-ui/assets/logo';
import { SUBSTRATE_GENERIC_KEY } from '@subwallet/extension-web-ui/constants';

const SwLogosMap: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet: require('./subwallet.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  avatar_placeholder: require('./avatar_placeholder.png'),
  default: DefaultLogosMap.default,
  transak: DefaultLogosMap.transak,
  onramper: DefaultLogosMap.onramper,
  moonpay: DefaultLogosMap.moonpay,
  banxa: DefaultLogosMap.banxa,
  coinbase: DefaultLogosMap.coinbase,
  rocketIcon: DefaultLogosMap.rocketIcon,
  invarch: DefaultLogosMap.invarch,
  sora_polkadot: DefaultLogosMap.sora_polkadot,
  logion: DefaultLogosMap.logion,
  energy_web_x: DefaultLogosMap.energy_web_x,
  moonsama: DefaultLogosMap.moonsama,
  omnibtc: DefaultLogosMap.omnibtc,
  coinversation: DefaultLogosMap.coinversation,
  peaq: DefaultLogosMap.peaq,
  t3rn: DefaultLogosMap.t3rn,
  moonwell: DefaultLogosMap.moonwell,
  stellaswap: DefaultLogosMap.stellaswap,
  chain_flip_mainnet: DefaultLogosMap.chain_flip,
  chain_flip_testnet: DefaultLogosMap.chain_flip,
  hydradx_mainnet: DefaultLogosMap.hydradx,
  hydradx_testnet: DefaultLogosMap.hydradx,
  [SUBSTRATE_GENERIC_KEY]: DefaultLogosMap[SUBSTRATE_GENERIC_KEY],
  [SwapProviderId.POLKADOT_ASSET_HUB.toLowerCase()]: DefaultLogosMap.polkadot_assethub,
  [SwapProviderId.KUSAMA_ASSET_HUB.toLowerCase()]: DefaultLogosMap.kusama_assethub,
  [SwapProviderId.ROCOCO_ASSET_HUB.toLowerCase()]: DefaultLogosMap.rococo_assethub
};

export default SwLogosMap;
