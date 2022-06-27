// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EraInfo, ResponseParseTransactionSubstrate } from '@subwallet/extension-base/background/types';
import KoniState from '@subwallet/extension-koni-base/background/handlers/State';

import { TypeRegistry } from '@polkadot/types';
import { Registry } from '@polkadot/types/types';
import { hexToU8a } from '@polkadot/util';

export const parseSubstratePayload = (state: KoniState, genesisHash: string, rawPayload: string, specVersion: number): ResponseParseTransactionSubstrate => {
  let networkKey = '';
  const networks = state.getNetworkMap();
  const dotSamaAPIMap = state.getDotSamaApiMap();

  for (const _networkKey of Object.keys(networks)) {
    const networkInfo = networks[_networkKey];

    if (networkInfo.genesisHash.toLowerCase() === genesisHash.toLowerCase()) {
      networkKey = _networkKey;
      break;
    }
  }

  let registry: Registry;

  if (dotSamaAPIMap[networkKey]) {
    registry = dotSamaAPIMap[networkKey].registry;
  } else {
    registry = new TypeRegistry();
  }

  const payload = registry.createType('ExtrinsicPayload', hexToU8a(rawPayload), { specVersion: specVersion });
  const nonce = payload.nonce.toNumber();
  const tip = payload.tip.toNumber();
  const specVer = payload.specVersion.toNumber();

  const _era = payload.era;
  let era: string | EraInfo = _era.toString();

  if (_era.isMortalEra) {
    era = {
      period: _era.asMortalEra.period.toNumber(),
      phase: _era.asMortalEra.phase.toNumber()
    };
  }

  const _method = payload.method.toString();

  return { era: era, tip: tip, method: _method, nonce: nonce, specVersion: specVer };
};
