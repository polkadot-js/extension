// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ClaimRewardHistoryItem, CrowdloanHistoryItem, HistoryItem, HistoryItemBase, NftHistoryItem, StakingHistoryItem, TransferHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { createHash } from 'crypto';

type AccountType = {
  name: string,
  address: string,
}

type ChainInfo = {
  slug: string,
  symbol: string,
}

const HISTORY_ITEM_TYPES: (HistoryItemBase['type'])[] = [
  'transfer', 'nft', 'staking', 'claim_reward', 'crowdloan'
];

const HISTORY_ITEM_STATUSES: (HistoryItemBase['status'])[] = [
  'completed', 'processing', 'failed', 'cancelled'
];

const STAKING_TYPES: (StakingHistoryItem['stakingType'])[] = [
  'stake', 'unstake', 'withdraw', 'compounding'
];

const SENDER_ADDRESSES: AccountType[] = [
  {
    name: 'Account 1',
    address: '5GBw5o91TwwLwpj24ucJimWZhpg9bc5W9mBTMERjiaYYsENd'
  },
  {
    name: 'Account 2',
    address: '5EFLCgn8gFd1QTiGpzcSZwSnBdYk82nUpjd42vAUJQabETCL'
  },
  {
    name: 'Account 3',
    address: '5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc'
  }
];

const RECEIVER_ADDRESSES: AccountType[] = [
  {
    name: 'Account 4',
    address: '5D5gr43RbK78YqSFjFPSwMexuyhQn1ecQo71ogqTsJR4zS9g'
  },
  {
    name: 'Account 5',
    address: '5HMkyzwXxVtFa4VGid3DuDtuWxZcGqt57wq9WiZPP8YrSt6d'
  }
];

const ORIGIN_CHAINS: ChainInfo[] = [
  {
    slug: 'polkadot',
    symbol: 'DOT'
  },
  {
    slug: 'kusama',
    symbol: 'KSM'
  },
  {
    slug: 'westend',
    symbol: 'WND'
  },
  {
    slug: 'astar',
    symbol: 'ASTR'
  }
];

const DESTINATION_CHAINS: ChainInfo[] = [
  {
    slug: 'astar',
    symbol: 'ASTR'
  },
  {
    slug: 'acala',
    symbol: 'ACA'
  }
];

const TIME_24H_MILLISECOND = 86400000;

const BOOLEANS: boolean[] = [true, false];

function getRandomItem<T> (items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const generateHashString = (): string => {
  const hash = createHash('sha256');
  const randomBytes = Math.random().toString(36).slice(2);

  hash.update(randomBytes);
  const hashString = hash.digest('hex');

  return `0x${hashString.slice(0, 64)}`;
};

const getRandomTimeOfDay = (dateTime: number): number => {
  const date = new Date(dateTime);
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  return new Date(startOfDay.getTime() + Math.random() * (endOfDay.getTime() - startOfDay.getTime())).getTime();
};

function generateHistoryItem (time: number): HistoryItem {
  const sender = getRandomItem(SENDER_ADDRESSES);
  const receiver = getRandomItem(RECEIVER_ADDRESSES);
  const type = getRandomItem(HISTORY_ITEM_TYPES);
  const chain = getRandomItem(ORIGIN_CHAINS);

  const itemBase: HistoryItemBase = {
    type,
    chain: chain.slug,
    senderAddress: sender.address,
    senderName: sender.name,
    recipientAddress: receiver.address,
    recipientName: receiver.name,
    status: getRandomItem(HISTORY_ITEM_STATUSES),
    extrinsicHash: generateHashString(),
    time: getRandomTimeOfDay(time),
    chainFee: '0.005',
    symbol: chain.symbol,
    amount: '10'
  };

  if (type === 'transfer') {
    const isReceived = itemBase.status === 'completed' ? getRandomItem(BOOLEANS) : false;
    const destChain = getRandomItem([...DESTINATION_CHAINS, chain]);

    const item = {
      ...itemBase,
      isReceived,
      senderAddress: isReceived ? receiver.address : sender.address,
      senderName: isReceived ? receiver.name : sender.name,
      recipientAddress: isReceived ? sender.address : receiver.address,
      recipientName: isReceived ? sender.name : receiver.name
    } as TransferHistoryItem;

    // cross chain transfer
    if (chain.slug !== destChain.slug) {
      item.destinationChainInfo = {
        fee: '0.005',
        slug: destChain.slug,
        symbol: destChain.symbol
      };
    }

    return item;
  }

  if (type === 'nft') {
    return {
      ...itemBase,
      collectionName: 'NFT COLLECTION'
    } as NftHistoryItem;
  }

  if (type === 'staking') {
    return {
      ...itemBase,
      stakingType: getRandomItem(STAKING_TYPES)
    } as StakingHistoryItem;
  }

  if (type === 'claim_reward') {
    return {
      ...itemBase
    } as ClaimRewardHistoryItem;
  }

  return {
    ...itemBase
  } as CrowdloanHistoryItem;
}

function generateItems (): HistoryItem[] {
  const result: HistoryItem[] = [];

  const currentTime = new Date();

  for (let i = 0; i < 9; i++) {
    const time = i > 0 ? currentTime.getTime() - TIME_24H_MILLISECOND * i : currentTime.getTime();

    for (let j = 0; j < 6; j++) {
      result.push(generateHistoryItem(time));
    }
  }

  return result;
}

export const HISTORY_ITEMS: HistoryItem[] = generateItems();
