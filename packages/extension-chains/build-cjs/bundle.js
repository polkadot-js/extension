"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addMetadata = addMetadata;
exports.findChain = findChain;
exports.knownMetadata = knownMetadata;
exports.metadataExpand = metadataExpand;
Object.defineProperty(exports, "packageInfo", {
  enumerable: true,
  get: function () {
    return _packageInfo.packageInfo;
  }
});

var _types = require("@polkadot/types");

var _utilCrypto = require("@polkadot/util-crypto");

var _packageInfo = require("./packageInfo");

// Copyright 2019-2022 @polkadot/extension-chains authors & contributors
// SPDX-License-Identifier: Apache-2.0
// imports chain details, generally metadata. For the generation of these,
// inside the api, run `yarn chain:info --ws <url>`
const definitions = new Map();
const expanded = new Map();

function metadataExpand(definition) {
  let isPartial = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  const cached = expanded.get(definition.genesisHash);

  if (cached && cached.specVersion === definition.specVersion) {
    return cached;
  }

  const {
    chain,
    genesisHash,
    icon,
    metaCalls,
    specVersion,
    ss58Format,
    tokenDecimals,
    tokenSymbol,
    types,
    userExtensions
  } = definition;
  const registry = new _types.TypeRegistry();

  if (!isPartial) {
    registry.register(types);
  }

  registry.setChainProperties(registry.createType('ChainProperties', {
    ss58Format,
    tokenDecimals,
    tokenSymbol
  }));
  const hasMetadata = !!metaCalls && !isPartial;

  if (hasMetadata) {
    registry.setMetadata(new _types.Metadata(registry, (0, _utilCrypto.base64Decode)(metaCalls)), undefined, userExtensions);
  }

  const isUnknown = genesisHash === '0x';
  const result = {
    definition,
    genesisHash: isUnknown ? undefined : genesisHash,
    hasMetadata,
    icon: icon || 'substrate',
    isUnknown,
    name: chain,
    registry,
    specVersion,
    ss58Format,
    tokenDecimals,
    tokenSymbol
  };

  if (result.genesisHash && !isPartial) {
    expanded.set(result.genesisHash, result);
  }

  return result;
}

function findChain(definitions, genesisHash) {
  const def = definitions.find(def => def.genesisHash === genesisHash);
  return def ? metadataExpand(def) : null;
}

function addMetadata(def) {
  definitions.set(def.genesisHash, def);
}

function knownMetadata() {
  return [...definitions.values()];
}