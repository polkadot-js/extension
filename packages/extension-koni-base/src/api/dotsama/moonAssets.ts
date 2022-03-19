// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { MoonAsset } from '@polkadot/extension-base/background/KoniTypes';
import { BN, bnToHex } from '@polkadot/util';

export async function getMoonAssets (api: ApiPromise) {
  await api.isReady;
  const assets = await api.query.assets.metadata.entries();
  const assetRecord = {} as Record<string, MoonAsset>;

  assets.forEach(([assetKey, value]) => {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const keyString = assetKey.toHuman()[0].toString().replace(/,/g, '');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const hexAddress = bnToHex(new BN(keyString)).slice(2).toUpperCase();
    const address = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'.slice(0, -hexAddress.length) + hexAddress;

    const valueData = value.toHuman();
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-assignment
    const info = { deposit: parseInt(valueData.deposit || ' 0'), name: valueData.name, symbol: valueData.symbol, decimals: parseInt(valueData.decimals || ' 0'), isFrozen: valueData.isFrozen, address: address } as MoonAsset;

    assetRecord[info.symbol] = info;
  });

  return assetRecord;
}
