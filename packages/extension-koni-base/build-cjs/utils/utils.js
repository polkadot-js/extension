"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.categoryAddresses = categoryAddresses;
exports.convertFundStatus = void 0;
exports.convertToEvmAddress = convertToEvmAddress;
exports.filterAddressByNetworkKey = filterAddressByNetworkKey;
exports.hexToStr = hexToStr;
exports.hexToUTF16 = hexToUTF16;
exports.inJestTest = inJestTest;
exports.isAccountAll = isAccountAll;
exports.isEmptyArray = exports.isDef = exports.isAddressesEqual = void 0;
exports.isUrl = isUrl;
exports.parseIpfsLink = exports.notDef = exports.nonEmptyArr = exports.isValidAddress = void 0;
exports.reformatAddress = reformatAddress;
exports.sumBN = sumBN;
exports.toUnit = void 0;
exports.utf16ToString = utf16ToString;

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _apiHelper = require("@polkadot/extension-koni-base/api/dotsama/api-helper");

var _config = require("@polkadot/extension-koni-base/api/nft/config");

var _constants = require("@polkadot/extension-koni-base/constants");

var _util = require("@polkadot/util");

var _utilCrypto = require("@polkadot/util-crypto");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
const notDef = x => x === null || typeof x === 'undefined';

exports.notDef = notDef;

const isDef = x => !notDef(x);

exports.isDef = isDef;

const nonEmptyArr = x => Array.isArray(x) && x.length > 0;

exports.nonEmptyArr = nonEmptyArr;

const isEmptyArray = x => !Array.isArray(x) || Array.isArray(x) && x.length === 0;

exports.isEmptyArray = isEmptyArray;

function isAccountAll(address) {
  return address === _constants.ALL_ACCOUNT_KEY;
}

function reformatAddress(address, networkPrefix) {
  let isEthereum = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  if ((0, _utilCrypto.isEthereumAddress)(address)) {
    return address;
  }

  if (isAccountAll(address)) {
    return address;
  }

  const publicKey = (0, _utilCrypto.decodeAddress)(address);

  if (isEthereum) {
    return (0, _utilCrypto.ethereumEncode)(publicKey);
  }

  if (networkPrefix < 0) {
    return address;
  }

  return (0, _utilCrypto.encodeAddress)(publicKey, networkPrefix);
}

function filterAddressByNetworkKey(addresses, networkKey) {
  if (_apiHelper.ethereumChains.indexOf(networkKey) > -1) {
    return addresses.filter(address => {
      return (0, _utilCrypto.isEthereumAddress)(address);
    });
  } else {
    return addresses.filter(address => {
      return !(0, _utilCrypto.isEthereumAddress)(address);
    });
  }
}

function categoryAddresses(addresses) {
  const substrateAddresses = [];
  const evmAddresses = [];
  addresses.forEach(address => {
    if ((0, _utilCrypto.isEthereumAddress)(address)) {
      evmAddresses.push(address);
    } else {
      substrateAddresses.push(address);
    }
  });
  return [substrateAddresses, evmAddresses];
}

function convertToEvmAddress(substrateAddress) {
  const addressBytes = (0, _utilCrypto.decodeAddress)(substrateAddress);
  return (0, _utilCrypto.ethereumEncode)('0x' + Buffer.from(addressBytes.subarray(0, 20)).toString('hex'));
}

function isUrl(targetString) {
  let url;

  try {
    url = new URL(targetString);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

function inJestTest() {
  return process.env.JEST_WORKER_ID !== undefined;
}

const parseIpfsLink = ipfsLink => {
  if (!ipfsLink.includes('ipfs://ipfs/')) {
    return ipfsLink;
  }

  return _config.PINATA_IPFS_GATEWAY + ipfsLink.split('ipfs://ipfs/')[1];
};

exports.parseIpfsLink = parseIpfsLink;

function hexToStr(buf) {
  let str = '';
  let hexStart = buf.indexOf('0x');

  if (hexStart < 0) {
    hexStart = 0;
  } else {
    hexStart = 2;
  }

  for (let i = hexStart, strLen = buf.length; i < strLen; i += 2) {
    const ch = buf[i] + buf[i + 1];
    const num = parseInt(ch, 16); // eslint-disable-next-line eqeqeq

    if (num != 0) {
      str += String.fromCharCode(num);
    } else {
      break;
    }
  }

  return str;
} // eslint-disable-next-line camelcase


function utf16ToString(uInt16Array) {
  let str = ''; // eslint-disable-next-line camelcase

  for (let i = 0; i < uInt16Array.length; i++) {
    str += String.fromCharCode(uInt16Array[i]);
  }

  return str;
}

function hexToUTF16(hex) {
  const buf = [];
  let hexStart = hex.indexOf('0x');

  if (hexStart < 0) {
    hexStart = 0;
  } else {
    hexStart = 2;
  }

  for (let i = hexStart, strLen = hex.length; i < strLen; i += 2) {
    const ch = hex[i] + hex[i + 1];
    const num = parseInt(ch, 16);
    buf.push(num);
  }

  return new Uint8Array(buf);
}

const isValidAddress = address => {
  try {
    (0, _utilCrypto.encodeAddress)((0, _util.isHex)(address) ? (0, _util.hexToU8a)(address) : (0, _utilCrypto.decodeAddress)(address));
    return true;
  } catch (error) {
    return false;
  }
};

exports.isValidAddress = isValidAddress;

const toUnit = (balance, decimals) => {
  if (balance === 0) {
    return 0;
  }

  return balance / 10 ** decimals;
};

exports.toUnit = toUnit;

function sumBN(inputArr) {
  let rs = new _util.BN(0);
  inputArr.forEach(input => {
    rs = rs.add(input);
  });
  return rs;
}

const convertFundStatus = status => {
  if (status === 'Won' || status === 'Retiring') {
    return _KoniTypes.CrowdloanParaState.COMPLETED;
  } else if (status === 'Started') {
    return _KoniTypes.CrowdloanParaState.ONGOING;
  } else if (status === 'Dissolved') {
    return _KoniTypes.CrowdloanParaState.FAILED;
  } else {
    return undefined;
  }
};

exports.convertFundStatus = convertFundStatus;

const isAddressesEqual = (addresses, prevAddresses) => {
  if (addresses.length !== prevAddresses.length) {
    return false;
  }

  for (const address of addresses) {
    if (!prevAddresses.includes(address)) {
      return false;
    }
  }

  return true;
};

exports.isAddressesEqual = isAddressesEqual;