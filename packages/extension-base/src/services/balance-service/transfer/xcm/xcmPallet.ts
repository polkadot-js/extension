// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { _getXcmBeneficiary, _getXcmDestWeight, _getXcmMultiAssets, _getXcmMultiLocation } from '@subwallet/extension-base/core/substrate/xcm-parser';
import { isUseTeleportProtocol, STABLE_XCM_VERSION } from '@subwallet/extension-base/services/balance-service/transfer/xcm/utils';

import { ApiPromise } from '@polkadot/api';

// this pallet is only used by Relaychains
export function getExtrinsicByXcmPalletPallet (tokenInfo: _ChainAsset, originChainInfo: _ChainInfo, destinationChainInfo: _ChainInfo, recipientAddress: string, value: string, api: ApiPromise) {
  const weightParam = _getXcmDestWeight(originChainInfo);
  const destination = _getXcmMultiLocation(originChainInfo, destinationChainInfo, STABLE_XCM_VERSION);
  const beneficiary = _getXcmBeneficiary(destinationChainInfo, recipientAddress, STABLE_XCM_VERSION);
  const tokenLocation = _getXcmMultiAssets(tokenInfo, value, STABLE_XCM_VERSION);

  let method = 'limitedReserveTransferAssets';

  if (isUseTeleportProtocol(originChainInfo, destinationChainInfo)) {
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
