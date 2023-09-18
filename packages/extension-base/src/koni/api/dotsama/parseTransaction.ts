// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ArgInfo, EraInfo, FormattedMethod, ResponseParseTransactionSubstrate } from '@subwallet/extension-base/background/KoniTypes';
import { t } from 'i18next';

import { ApiPromise } from '@polkadot/api';
import { Call } from '@polkadot/types/interfaces';
import { hexToU8a } from '@polkadot/util';

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

export const parseSubstrateTransaction = (data: string, apiPromise: ApiPromise): ResponseParseTransactionSubstrate => {
  const registry = apiPromise.registry;

  const payload = registry.createType('ExtrinsicPayload', hexToU8a(data));
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

  const call = registry.createType('Call', _method);
  const sectionMethod = `${call.section}.${call.method}`;

  const result: FormattedMethod[] = [];
  const firstArg = call.args[0];

  const baseInfo: Omit<ResponseParseTransactionSubstrate, 'method' | 'message'> = {
    era: era,
    tip: tip,
    nonce: nonce,
    specVersion: specVer
  };

  // that's a batch
  if (firstArg?.toRawType().startsWith('Vec<Call>')) {
    result.push({ args: undefined, methodName: sectionMethod });

    (firstArg as unknown as Call[]).forEach((c: Call) => {
      registry.createType('Call', c);
      result.push({ args: formatArgs(c), methodName: `${c.section}.${c.method}` });
    });
  } else {
    try {
      result.push({ args: formatArgs(call as unknown as Call), methodName: sectionMethod });
    } catch (e) {
      return {
        ...baseInfo,
        message: t('Unable to decode the information'),
        method: _method
      };
    }
  }

  return { ...baseInfo, method: result, message: '' };
};
