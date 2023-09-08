// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';

export const YIELD_POOLS_INFO: Record<string, YieldPoolInfo> = {
  DOT___native_staking: {
    slug: 'DOT___native_staking',
    chain: 'polkadot',
    name: 'Polkadot Native Staking',
    description: 'Staking DOT by directly nominating validators',
    type: YieldPoolType.NATIVE_STAKING,
    inputAssets: [
      'polkadot-NATIVE-DOT'
    ],
    rewardAssets: [
      'polkadot-NATIVE-DOT'
    ],
    feeAssets: [
      'polkadot-NATIVE-DOT'
    ],
    withdrawalMethods: [
      {
        name: 'Default Unstaking',
        description: 'Wait 28 days to get your tokens back',
        waitingTime: 28 * 24 // 0 means immediately
      }
    ]
  },
  DOT___nomination_pool: {
    slug: 'DOT___nomination_pool',
    chain: 'polkadot',
    name: 'Polkadot Nomination Pool',
    description: 'Start staking with just 1 DOT',
    type: YieldPoolType.NOMINATION_POOL,
    inputAssets: [
      'polkadot-NATIVE-DOT'
    ],
    rewardAssets: [
      'polkadot-NATIVE-DOT'
    ],
    feeAssets: [
      'polkadot-NATIVE-DOT'
    ],
    withdrawalMethods: [
      {
        name: 'Default Unstaking',
        description: 'Wait 28 days to get your tokens back',
        waitingTime: 28 * 24 // 0 means immediately
      }
    ]
  },
  DOT___acala_liquid_staking: {
    slug: 'DOT___acala_liquid_staking',
    chain: 'acala',
    name: 'Acala Liquid Staking',
    description: 'Stake DOT to receive LDOT',
    type: YieldPoolType.LIQUID_STAKING,
    inputAssets: [
      'acala-LOCAL-DOT'
    ],
    rewardAssets: [
      'acala-LOCAL-LDOT'
    ],
    feeAssets: [
      'acala-NATIVE-ACA',
      'acala-LOCAL-DOT'
    ],
    altInputAssets: [
      'polkadot-NATIVE-DOT'
    ],
    withdrawalMethods: [
      {
        name: 'Default unstaking',
        description: 'Wait 28 days to get your tokens back',
        waitingTime: 28 * 24 // 0 means immediately
      },
      {
        name: 'Instant unstaking',
        description: 'Match your position with someone joining the pool and swap LDOT',
        waitingTime: 0 // 0 means immediately
      }
    ]
  },
  DOT___bifrost_liquid_staking: {
    slug: 'DOT___bifrost_liquid_staking',
    chain: 'bifrost_dot',
    name: 'Bifrost Liquid Staking',
    description: 'Stake DOT by minting vDOT',
    type: YieldPoolType.LIQUID_STAKING,
    inputAssets: [
      'bifrost_dot-LOCAL-DOT'
    ],
    rewardAssets: [
      'bifrost_dot-LOCAL-vDOT'
    ],
    feeAssets: [
      'bifrost_dot-NATIVE-BNC',
      'bifrost_dot-LOCAL-DOT'
    ],
    altInputAssets: [
      'polkadot-NATIVE-DOT'
    ],
    withdrawalMethods: [
      {
        name: 'Default unstaking',
        description: 'Wait 28 days to get your tokens back',
        waitingTime: 28 * 24 // 0 means immediately
      },
      {
        name: 'Lightning unstaking',
        description: 'Swap vDOT to receive DOT immediately',
        waitingTime: 0 // 0 means immediately
      }
    ]
  },
  DOT___parallel_liquid_staking: {
    slug: 'DOT___parallel_liquid_staking',
    chain: 'parallel',
    name: 'Parallel Liquid Staking',
    description: 'Stake DOT by minting sDOT',
    type: YieldPoolType.LIQUID_STAKING,
    inputAssets: [
      'parallel-LOCAL-DOT'
    ],
    rewardAssets: [
      'parallel-LOCAL-sDOT'
    ],
    feeAssets: [
      'parallel-NATIVE-PARA'
    ],
    altInputAssets: [
      'polkadot-NATIVE-DOT'
    ],
    withdrawalMethods: [
      {
        name: 'Default unstaking',
        description: 'Wait 28 days to get your tokens back',
        waitingTime: 28 * 24 // 0 means immediately
      },
      {
        name: 'Instant unstaking',
        description: 'Swap vDOT to receive DOT immediately',
        waitingTime: 0 // 0 means immediately
      }
    ]
  },
  DOT___interlay_lending: {
    slug: 'DOT___interlay_lending',
    chain: 'interlay',
    name: 'Interlay Lending',
    description: 'Earn rewards by lending DOT',
    type: YieldPoolType.LENDING,
    inputAssets: [
      'interlay-LOCAL-DOT'
    ],
    rewardAssets: [
      'interlay-NATIVE-INTR',
      'interlay-LOCAL-DOT'
    ],
    feeAssets: [
      'interlay-NATIVE-INTR',
      'interlay-LOCAL-DOT'
    ],
    altInputAssets: [
      'polkadot-NATIVE-DOT'
    ],
    withdrawalMethods: [
      {
        name: 'Default withdrawal',
        description: 'Withdraw your DOT',
        waitingTime: 0 // 0 means immediately
      }
    ]
  }
};
