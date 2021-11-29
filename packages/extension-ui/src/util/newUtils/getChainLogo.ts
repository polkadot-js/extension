// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import type { Chain } from '@polkadot/extension-chains/types';

import DOT from '../../assets/hackathonAssets/logos/DOT.svg';
import KSM from '../../assets/hackathonAssets/logos/KSM.svg';
import WSN from '../../assets/hackathonAssets/logos/WSN.svg';
import getNetworkInfo from './getNetwork';

export default function getChainLogo (chain: Chain | null | undefined): string {
  const { coin } = getNetworkInfo(chain);

  switch (coin) {
    case ('WSN'):
      return WSN;
    case ('DOT'):
      return DOT;
    case ('KSM'):
      return KSM;
    default:
      return WSN;
  }
}
