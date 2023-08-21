// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { resolveAddressToDomain, resolveDomainToAddress, SupportedChainId } from '@azns/resolver-core';

import { ApiPromise } from '@polkadot/api';

export const ENS_SUFFIX = '.eth';
export const TZERO_ID_SUFFIX = '.tzero';

export const AZERO_ID_SUFFIX = '.azero';

export const SUPPORTED_DOMAIN_SUFFIX = [
  ENS_SUFFIX,
  TZERO_ID_SUFFIX,
  AZERO_ID_SUFFIX
];

export const CHAINS_SUPPORTED_DOMAIN = [
  'aleph',
  'alephTest'
];

export const AZERO_DOMAIN_CONTRACTS = [
  '5FsB91tXSEuMj6akzdPczAtmBaVKToqHmtAwSUzXh49AYzaD',
  '5CTQBfBC9SfdrCDBJdfLiyW2pg9z5W6C6Es8sK313BLnFgDf'
];

export async function resolveAzeroDomainToAddress (domain: string, chain: string, api: ApiPromise): Promise<string | undefined> {
  let chainId: SupportedChainId = SupportedChainId.AlephZero;

  if (chain === 'alephTest') {
    chainId = SupportedChainId.AlephZeroTestnet;
  }

  const primaryDomains = await resolveDomainToAddress(
    domain,
    {
      chainId,
      customApi: api
    }
  );

  if (primaryDomains.error) {
    console.debug(primaryDomains.error);
  }

  return primaryDomains?.address || undefined;
}

export async function resolveAzeroAddressToDomain (address: string, chain: string, api: ApiPromise): Promise<string | undefined> {
  let chainId: SupportedChainId = SupportedChainId.AlephZero;

  if (chain === 'alephTest') {
    chainId = SupportedChainId.AlephZeroTestnet;
  }

  const primaryDomains = await resolveAddressToDomain(
    address,
    {
      chainId,
      customApi: api
    }
  );

  if (primaryDomains.error) {
    console.debug(primaryDomains.error);
  }

  return primaryDomains?.primaryDomain || undefined;
}

export function isAzeroDomain (input: string) {
  return input.includes(AZERO_ID_SUFFIX) || input.includes(TZERO_ID_SUFFIX);
}
