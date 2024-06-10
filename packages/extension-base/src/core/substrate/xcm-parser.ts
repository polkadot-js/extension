// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { _Address } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainSubstrateAddressPrefix, _getEvmChainId, _getSubstrateParaId, _getSubstrateRelayParent, _getXcmAssetMultilocation, _isChainEvmCompatible, _isSubstrateParaChain, _isSubstrateRelayChain } from '@subwallet/extension-base/services/chain-service/utils';

import { decodeAddress, evmToAddress } from '@polkadot/util-crypto';

const FOUR_INSTRUCTIONS_WEIGHT = 5000000000;
const UNLIMITED_WEIGHT = 'Unlimited';

export function _getXcmDestWeight (originChainInfo: _ChainInfo) {
  if (['pioneer'].includes(originChainInfo.slug)) {
    return FOUR_INSTRUCTIONS_WEIGHT;
  }

  return UNLIMITED_WEIGHT;
}

export function _getXcmBeneficiary (destChainInfo: _ChainInfo, recipient: _Address, version: number) {
  const receiverLocation = version < 4 // from V4, X1 is also an array
    ? _getRecipientLocation(destChainInfo, recipient, version)
    : [_getRecipientLocation(destChainInfo, recipient, version)];

  return {
    [`V${version}`]: {
      parents: 0,
      interior: {
        X1: receiverLocation
      }
    }
  };
}

export function _getXcmMultiAssets (tokenInfo: _ChainAsset, value: string, version: number) {
  const assetId = _getAssetIdentifier(tokenInfo, version);

  return {
    [`V${version}`]: [
      {
        id: assetId,
        fun: { Fungible: value }
      }
    ]
  };
}

export function _getXcmMultiLocation (originChainInfo: _ChainInfo, destChainInfo: _ChainInfo, version: number, recipient?: _Address) {
  const isWithinSameConsensus = _isXcmWithinSameConsensus(originChainInfo, destChainInfo);
  const parents = _getMultiLocationParent(originChainInfo, isWithinSameConsensus);
  const interior = _getMultiLocationInterior(destChainInfo, isWithinSameConsensus, version, recipient);

  return {
    [`V${version}`]: {
      parents,
      interior
    }
  };
}

// ---------------------------------------------------------------------------------------------------------------------

function _isXcmWithinSameConsensus (originChainInfo: _ChainInfo, destChainInfo: _ChainInfo): boolean {
  return _getSubstrateRelayParent(originChainInfo) === destChainInfo.slug || _getSubstrateRelayParent(destChainInfo) === originChainInfo.slug || _getSubstrateRelayParent(originChainInfo) === _getSubstrateRelayParent(destChainInfo);
}

function _getMultiLocationParent (originChainInfo: _ChainInfo, isWithinSameConsensus: boolean): number {
  let parent = 0; // how many hops up the hierarchy

  if (_isSubstrateParaChain(originChainInfo)) {
    parent += 1;
  }

  if (!isWithinSameConsensus) {
    parent += 1;
  }

  return parent;
}

function _getMultiLocationInterior (destChainInfo: _ChainInfo, isWithinSameConsensus: boolean, version: number, recipient?: _Address): unknown {
  const junctions: unknown[] = [];

  if (isWithinSameConsensus) {
    if (_isSubstrateParaChain(destChainInfo)) {
      junctions.push({
        Parachain: _getSubstrateParaId(destChainInfo)
      });
    }
  } else {
    junctions.push({
      GlobalConsensus: _getGlobalConsensusJunction(destChainInfo, version)
    });

    if (_isSubstrateParaChain(destChainInfo)) {
      junctions.push({
        Parachain: _getSubstrateParaId(destChainInfo)
      });
    }
  }

  if (recipient) {
    junctions.push(_getRecipientLocation(destChainInfo, recipient, version));
  }

  if (junctions.length === 0 && !recipient) {
    return 'Here';
  }

  if (version < 4 && junctions.length === 1) {
    return {
      X1: junctions[0]
    };
  }

  return {
    [`X${junctions.length}`]: junctions
  };
}

function _getGlobalConsensusJunction (destChainInfo: _ChainInfo, version: number) {
  let chainSlug = destChainInfo.slug;
  let evmChainId: number | undefined;

  if (_isSubstrateParaChain(destChainInfo)) {
    const relaySlug = _getSubstrateRelayParent(destChainInfo);

    if (!relaySlug) {
      throw Error('Parachain must have a parent chainSlug');
    }

    chainSlug = relaySlug;
  } else {
    evmChainId = _getEvmChainId(destChainInfo);
  }

  if (evmChainId) {
    return {
      Ethereum: {
        chainId: evmChainId
      }
    };
  }

  switch (chainSlug) {
    case COMMON_CHAIN_SLUGS.POLKADOT:
      return version < 4 ? { Polkadot: null } : 'Polkadot';
    case COMMON_CHAIN_SLUGS.KUSAMA:
      return version < 4 ? { Kusama: null } : 'Kusama';
    default:
      return version < 4 ? { Rococo: null } : 'Rococo';
  }
}

function _getRecipientLocation (destChainInfo: _ChainInfo, recipient: _Address, version: number) {
  const network = _getNetworkByVersion(version);

  if (destChainInfo.slug === COMMON_CHAIN_SLUGS.ASTAR_EVM) {
    const ss58Address = evmToAddress(recipient, _getChainSubstrateAddressPrefix(destChainInfo)); // TODO: shouldn't pass addressPrefix directly

    return { AccountId32: { network, id: decodeAddress(ss58Address) } };
  }

  if (_isChainEvmCompatible(destChainInfo)) {
    return { AccountKey20: { network, key: recipient } };
  }

  return { AccountId32: { network, id: decodeAddress(recipient) } };
}

function _getAssetIdentifier (tokenInfo: _ChainAsset, version: number) {
  const assetIdentifier = _getXcmAssetMultilocation(tokenInfo);

  if (!assetIdentifier) {
    throw new Error('Asset must have multilocation');
  }

  return version >= 4 // from V4, Concrete is removed
    ? assetIdentifier
    : { Concrete: assetIdentifier };
}

function _getNetworkByVersion (version: number) {
  switch (version) {
    case 1:
    case 2:
      return 'Any';
    case 3:
    case 4:
      return undefined;
    default:
      return undefined;
  }
}
