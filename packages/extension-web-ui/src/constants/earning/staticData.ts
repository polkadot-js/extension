// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolType } from '@subwallet/extension-base/types';

export const EARNING_DATA_RAW = {
  [YieldPoolType.NOMINATION_POOL]: [
    {
      icon: 'ThumbsUp',
      title: 'Select active pool',
      description:
        'It is recommended that you select an active pool with the <strong>Earning</strong> status to earn staking rewards',
      iconColor: '#aada62'
    },
    {
      icon: 'Coins',
      title: 'Unstake and withdraw',
      description:
        'Once staked, your funds will be locked. Unstake your funds anytime and withdraw after a period of <strong>{periodNumb}</strong>. Keep in mind that these actions are not automated and will incur network fees',
      iconColor: '#e6dc25'
    },
    {
      icon: 'CheckCircle',
      title: 'Keep your transferable balance',
      description:
        'Ensure that your transferable balance includes <strong>a minimum of {maintainBalance} {maintainSymbol}</strong> to cover your existential deposit and network fees associated with staking, unstaking, and withdrawals',
      iconColor: '#4cd9ac'
    },
    {
      icon: 'Wallet',
      title: 'Claim your rewards',
      description:
        'Your staking rewards will be paid out every {paidOut} {paidOutTimeUnit}. Make sure to claim them <strong>manually</strong>',
      iconColor: '#51BC5E'
    },
    {
      icon: 'Eye',
      title: 'Track your stake',
      description: 'Keep an eye on your stake periodically, as rewards and staking status can fluctuate over time',
      iconColor: '#008dff'
    }
  ],
  [YieldPoolType.NATIVE_STAKING]: [
    {
      icon: 'ThumbsUp',
      title: 'Select {validatorNumber} {validatorType}',
      description:
        'It is recommended that you select {validatorNumber} {validatorType} to optimize your staking rewards',
      iconColor: '#aada62'
    },
    {
      icon: 'Coins',
      title: 'Unstake and withdraw',
      description:
        'Once staked, your funds will be locked. Unstake your funds anytime and withdraw after a period of <strong>{periodNumb}</strong>. Keep in mind that these actions are <strong>not automated</strong> and will incur network fees',
      iconColor: '#e6dc25'
    },
    {
      icon: 'CheckCircle',
      title: 'Keep your transferable balance',
      description:
        'Ensure that your transferable balance includes <strong>a minimum of {maintainBalance} {maintainSymbol}</strong> to cover your existential deposit and network fees associated with staking, unstaking, and withdrawals',
      iconColor: '#4cd9ac'
    },
    {
      icon: 'Wallet',
      title: 'Check your rewards',
      description:
        'Your staking rewards will be paid out every {paidOut} {paidOutTimeUnit} and will be automatically compounded to your stake',
      iconColor: '#51BC5E'
    },
    {
      icon: 'Eye',
      title: 'Manage your stake',
      description:
        'You need to monitor your stake constantly and change {validatorType} when needed as staking status can fluctuate over time',
      iconColor: '#008dff'
    }
  ],
  [YieldPoolType.LIQUID_STAKING]: [
    {
      icon: 'ThumbsUp',
      title: 'Receive {derivative}',
      description: 'You will receive {derivative} as a representation of your staked {inputToken}',
      iconColor: '#aada62'
    },
    {
      icon: 'Coins',
      title: 'Unstake and withdraw',
      description:
        'Once staked, your funds will be locked. Unstake your funds anytime and withdraw immediately with a higher fee or wait {periodNumb} before withdrawing with a lower fee',
      iconColor: '#e6dc25'
    },
    {
      icon: 'CheckCircle',
      title: 'Keep your transferable balance',
      description:
        'Ensure that your transferable balance includes <strong>a minimum of {maintainBalance} {maintainSymbol}</strong> to cover your existential deposit and network fees associated with staking, unstaking, and withdrawals.',
      iconColor: '#4cd9ac'
    },
    {
      icon: 'Wallet',
      title: 'Check your {derivative}',
      description:
        'The amount of {derivative} doesn’t increase over time, only its value in {inputToken} does. This means that by the time you decide to withdraw {inputToken} from {derivative}, your {derivative} should be worth more than your originally staked {inputToken}',
      iconColor: '#51BC5E'
    },
    {
      icon: 'Eye',
      title: 'Track your APY',
      description:
        'Keep an eye on your stake as APY can fluctuate over time. APY fluctuation is determined by the protocol beyond SubWallet’s control',
      iconColor: '#008dff'
    }
  ],
  [YieldPoolType.LENDING]: [
    {
      icon: 'ThumbsUp',
      title: 'Receive {derivative}',
      description: 'You will receive {derivative} as a representation of your supplied {inputToken}',
      iconColor: '#aada62'
    },
    {
      icon: 'Coins',
      title: 'Withdraw anytime',
      description: 'Once supplied, your funds will be locked. Withdraw your funds anytime with a fee',
      iconColor: '#e6dc25'
    },
    {
      icon: 'CheckCircle',
      title: 'Keep your transferable balance',
      description:
        'Ensure that your transferable balance includes <strong>a minimum of {maintainBalance} {maintainSymbol}</strong> to cover your existential deposit and network fees associated with staking, unstaking, and withdrawals',
      iconColor: '#4cd9ac'
    },
    {
      icon: 'Wallet',
      title: 'Check your {derivative}',
      description:
        'The amount of {derivative} doesn’t increase over time, only its value in {inputToken} does. This means that by the time you decide to withdraw {inputToken} from {derivative}, your {derivative} should be worth more than your originally supplied {inputToken}',
      iconColor: '#51BC5E'
    },
    {
      icon: 'Eye',
      title: 'Track your APY',
      description:
        'Keep an eye on your supply as APY can fluctuate over time. APY fluctuation is determined by the protocol beyond SubWallet’s control',
      iconColor: '#008dff'
    }
  ],
  DAPP_STAKING: [
    {
      icon: 'ThumbsUp',
      title: 'Select {validatorNumber} {dAppString}',
      description: 'It is recommended that you select {validatorNumber} {dAppString} to optimize your staking rewards',
      iconColor: '#aada62'
    },
    {
      icon: 'Coins',
      title: 'Unstake and withdraw',
      description:
        'Once staked, your funds will be locked. Unstake your funds anytime and withdraw after a period of <strong>{periodNumb}</strong>. Keep in mind that these actions are <strong>not automated</strong> and will incur network fees',
      iconColor: '#e6dc25'
    },
    {
      icon: 'CheckCircle',
      title: 'Keep your transferable balance',
      description:
        'Ensure that your transferable balance includes <strong>a minimum of {maintainBalance} {maintainSymbol}</strong> to cover your existential deposit and network fees associated with staking, reward claiming, unstaking and withdrawals',
      iconColor: '#4cd9ac'
    },
    {
      icon: 'Wallet',
      title: 'Claim your rewards',
      description:
        'Your staking rewards will be paid out every {paidOut} {paidOutTimeUnit}. Make sure to claim them <strong>manually</strong>',
      iconColor: '#51BC5E'
    },
    {
      icon: 'Eye',
      title: 'Track your stake',
      description: 'Keep an eye on your stake periodically, as rewards and staking status can fluctuate over time.',
      iconColor: '#008dff'
    }
  ],
  [YieldPoolType.PARACHAIN_STAKING]: [],
  [YieldPoolType.SINGLE_FARMING]: []
};

export const STAKE_ALERT_DATA = {
  title: 'Pay attention!',
  description:
    'Don’t stake all your funds. Keep in mind that you need at least {tokenAmount} in your free balance to pay gas fees for claiming rewards, unstaking and withdrawing'
};

export const UNSTAKE_ALERT_DATA = [
  {
    title: 'Wait time',
    description: 'Once unstaked, your funds will become available for withdrawal after {unBondedTime}',
    icon: 'ClockClockwise',
    iconColor: '#2595e6'
  },
  {
    title: 'No rewards',
    description: 'During the unstaking period of {unBondedTime}, your tokens produce no rewards',
    icon: 'Coins',
    iconColor: '#e6dc25'
  },
  {
    title: 'Manual withdrawal',
    description: 'Keep in mind that you need to withdraw manually after the wait time is over',
    icon: 'DownloadSimple',
    iconColor: '#aada62'
  }
];
