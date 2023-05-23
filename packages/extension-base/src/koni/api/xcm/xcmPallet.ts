// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { getBeneficiary, getDestinationChainLocation, getDestWeight, getTokenLocation } from '@subwallet/extension-base/koni/api/xcm/utils';

import { ApiPromise } from '@polkadot/api';

// this pallet is only used by Relaychains
export function getExtrinsicByXcmPalletPallet (tokenInfo: _ChainAsset, originChainInfo: _ChainInfo, destinationChainInfo: _ChainInfo, recipientAddress: string, value: string, api: ApiPromise) {
  const weightParam = getDestWeight();
  const xcmVer = ['kusama'].includes(originChainInfo.slug) ? 'V2' : 'V1';
  const destination = getDestinationChainLocation(destinationChainInfo, xcmVer);
  const beneficiary = getBeneficiary(destinationChainInfo, recipientAddress, xcmVer);
  const tokenLocation = getTokenLocation(tokenInfo, value, xcmVer);

  let method = 'limitedReserveTransferAssets';

  if (['statemint', 'statemine'].includes(destinationChainInfo.slug)) {
    method = 'limitedTeleportAssets';
  }

  return api.tx.xcmPallet[method](
    destination,
    beneficiary,
    tokenLocation,
    0,
    weightParam
  );
}
