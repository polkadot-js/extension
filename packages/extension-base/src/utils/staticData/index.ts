// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
import { ChainInfoMap } from '@subwallet/chain-list';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
export const buyServiceInfos: Record<string, unknown>[] = require('./buyServiceInfos.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const buyTokenConfigs: Record<string, unknown>[] = require('./buyTokenConfigs.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const crowdloanFunds: Record<string, unknown>[] = require('./crowdloanFunds.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const marketingCampaigns: Record<string, unknown> = require('./marketingCampaigns.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const termAndCondition: Record<string, unknown> = require('./termAndCondition.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const currencySymbol: Record<string, unknown> = require('./currencySymbol.json');

export enum StaticKey {
  BUY_SERVICE_INFOS = 'buy-service-infos',
  CHAINS = 'chains',
  CURRENCY_SYMBOL = 'currency_symbols',
  MARKETING_CAMPAINGS = 'marketing-campaigns',
  CROWDLOAN_FUNDS = 'crowdloan-funds',
  TERM_AND_CONDITION = 'term-and-condition',
  BUY_TOKEN_CONFIGS = 'buy-token-configs'
}

export const staticData = {
  [StaticKey.CHAINS]: Object.values(ChainInfoMap),
  [StaticKey.CURRENCY_SYMBOL]: currencySymbol,
  [StaticKey.BUY_SERVICE_INFOS]: buyServiceInfos,
  [StaticKey.CROWDLOAN_FUNDS]: crowdloanFunds,
  [StaticKey.MARKETING_CAMPAINGS]: marketingCampaigns,
  [StaticKey.TERM_AND_CONDITION]: termAndCondition.default,
  [StaticKey.BUY_TOKEN_CONFIGS]: buyTokenConfigs
};
