// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EraInfo, ResponseParseTransactionSubstrate } from '@subwallet/extension-base/background/types';

import { TypeRegistry } from '@polkadot/types';
import { hexToU8a } from '@polkadot/util';

export const parseSubstratePayload = (genesisHash: string, rawPayload: string, specVersion: number): ResponseParseTransactionSubstrate => {
  const registry = new TypeRegistry();

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
