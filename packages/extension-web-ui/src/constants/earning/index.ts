// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export * from './staticData';
export * from './statusUi';

export enum ExclusiveRewardSlug {
  PARALLEL='DOT___parallel_liquid_staking',
  BIFROST='DOT___bifrost_liquid_staking',
  ACALA='DOT___acala_liquid_staking'
}

export const EXCLUSIVE_REWARD_SLUGS: string[] = [
  // ExclusiveRewardSlug.PARALLEL,
  // ExclusiveRewardSlug.BIFROST,
  // ExclusiveRewardSlug.ACALA
];

export const ExclusiveRewardContentMap: Record<string, string> = {
  // [ExclusiveRewardSlug.PARALLEL]: '1M PARA reward pool available from Oct 24 to Nov 7!',
  // [ExclusiveRewardSlug.BIFROST]: '5K BNC reward pool available from Oct 24 to Nov 7!',
  // [ExclusiveRewardSlug.ACALA]: '80K ACA reward pool available from Oct 24 to Nov 7!'
};
