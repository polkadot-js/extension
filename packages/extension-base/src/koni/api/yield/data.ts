// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';

export const YIELD_POOLS_INFO: Record<string, YieldPoolInfo> = {
  WND___nomination_pool: {
    slug: 'WND___nomination_pool',
    chain: 'westend',
    name: 'Westend Nomination Pool',
    description: 'Start staking with just 1 WND',
    type: YieldPoolType.NOMINATION_POOL,
    inputAssets: [
      'westend-NATIVE-WND'
    ],
    rewardAssets: [
      'westend-NATIVE-WND'
    ],
    feeAssets: [
      'westend-NATIVE-WND'
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
    derivativeAssets: [
      'acala-LOCAL-LDOT'
    ],
    rewardAssets: [
      'acala-LOCAL-DOT'
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
    derivativeAssets: [
      'bifrost_dot-LOCAL-vDOT'
    ],
    rewardAssets: [
      'bifrost_dot-LOCAL-DOT'
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
    derivativeAssets: [
      'parallel-LOCAL-sDOT'
    ],
    rewardAssets: [
      'parallel-LOCAL-DOT'
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
    derivativeAssets: [
      'interlay-LOCAL-qDOT'
    ],
    rewardAssets: [
      'interlay-LOCAL-DOT',
      'interlay-NATIVE-INTR'
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
  },
  LcDOT___acala_euphrates_liquid_staking: {
    slug: 'LcDOT___acala_euphrates_liquid_staking',
    chain: 'acala',
    name: 'LcDOT Liquid Staking',
    description: 'Earn rewards by staking LcDOT',
    type: YieldPoolType.LIQUID_STAKING,
    inputAssets: [
      'acala-LOCAL-LcDOT'
    ],
    derivativeAssets: [
      'acala-LOCAL-LDOT'
    ],
    rewardAssets: [
      'acala-LOCAL-DOT',
      'acala-NATIVE-ACA'
    ],
    feeAssets: [
      'acala-NATIVE-ACA'
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
  },
  xcDOT___moonwell_lending: {
    slug: 'xcDOT___moonwell_lending',
    chain: 'moonbeam',
    name: 'Moonwell Lending',
    logo: 'moonwell',
    description: 'Earn rewards by lending xcDOT',
    type: YieldPoolType.LENDING,
    inputAssets: [
      'moonbeam-LOCAL-xcDOT'
    ],
    derivativeAssets: [
      'moonbeam-LOCAL-mDOT' // TODO: add to chain-list
    ],
    rewardAssets: [
      'moonbeam-LOCAL-xcDOT',
      'moonbeam-ERC20-WELL-0x511ab53f793683763e5a8829738301368a2411e3',
      'moonbeam-NATIVE-GLMR'
    ],
    feeAssets: [
      'moonbeam-NATIVE-GLMR'
    ],
    altInputAssets: [],
    withdrawalMethods: [
      {
        name: 'Default withdrawal',
        description: 'Withdraw your DOT',
        waitingTime: 0 // 0 means immediately
      }
    ]
  }
};
