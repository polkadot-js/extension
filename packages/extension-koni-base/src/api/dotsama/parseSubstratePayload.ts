// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Call } from '@polkadot/types/interfaces';

import { ArgInfo, EraInfo, FormattedMethod, ResponseParseTransactionSubstrate } from '@subwallet/extension-base/background/types';
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
  const nonce = payload.nonce.toString();
  const tip = payload.tip.toString();
  const _era = payload.era;
  let era: string | EraInfo = _era.toString();

  if (_era.isMortalEra) {
    era = {
      period: _era.asMortalEra.period.toString(),
      phase: _era.asMortalEra.phase.toString()
    };
  }

  const method = payload.method;

  let _method: string | FormattedMethod[];

  try {
    const call = registry.createType('Call', method);
    const sectionMethod = `${call.section}.${call.method}`;

    const formatted: FormattedMethod[] = [];
    const firstArg = call.args[0];

    // that's a batch
    if (firstArg?.toRawType().startsWith('Vec<Call>')) {
      formatted.push({ args: undefined, method: sectionMethod });

      (firstArg as unknown as Call[]).forEach((c: Call) => {
        registry.createType('Call', c);
        formatted.push({ args: formatArgs(c), method: `${c.section}.${c.method}` });
      });
    } else {
      formatted.push({ args: formatArgs(call as unknown as Call), method: sectionMethod });
    }

    _method = formatted;
  } catch (e) {
    console.log((e as Error).message);
    _method = method.toString();
  }

  return { era: era, tip: tip, method: _method, nonce: nonce };
};

const formatArgs = (callInstance: Call): ArgInfo[] => {
  const paramArgKvArray: ArgInfo[] = [];
  const { args, meta } = callInstance;

  for (let i = 0; i < meta.args.length; i++) {
    let argument: string;

    if (args[i].toRawType().startsWith('AccountId')) {
      argument = args[i].toString();
    } else if (args[i].toRawType().startsWith('Vec<Call>')) {
      argument = JSON.stringify(args[i].toHuman(false));
    } else if (args[i].toRawType().startsWith('Vec')) {
      // toString is nicer than toHuman here because
      // toHuman tends to concatenate long strings and would hide data
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
      argument = (args[i] as any).map((v: any) => v.toString());
    } else {
      // toHuman takes care of the balance formating
      // with the right chain unit
      argument = JSON.stringify(args[i].toHuman());
    }

    const argName = meta.args[i].name.toHuman();

    paramArgKvArray.push({ argName, argValue: argument } as ArgInfo);
  }

  return paramArgKvArray;
};
