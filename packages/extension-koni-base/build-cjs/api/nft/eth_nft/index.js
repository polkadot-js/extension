"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Web3NftApi = void 0;

var _crossFetch = _interopRequireDefault(require("cross-fetch"));

var _web = _interopRequireDefault(require("web3"));

var _endpoints = _interopRequireWildcard(require("@polkadot/extension-koni-base/api/endpoints"));

var _config = require("@polkadot/extension-koni-base/api/nft/config");

var _nft = require("@polkadot/extension-koni-base/api/nft/nft");

var _web2 = require("@polkadot/extension-koni-base/api/web3/web3");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

var _utilCrypto = require("@polkadot/util-crypto");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
class Web3NftApi extends _nft.BaseNftApi {
  web3 = null;
  evmContracts = [];
  isConnected = false;

  constructor(addresses, chain) {
    super(undefined, addresses, chain);
  }

  connectWeb3() {
    if (this.chain === _config.SUPPORTED_NFT_NETWORKS.astarEvm) {
      this.web3 = new _web.default(new _web.default.providers.WebsocketProvider(_endpoints.default.astar.provider));
    } else {
      this.web3 = new _web.default(new _web.default.providers.WebsocketProvider(_endpoints.EVM_NETWORKS[this.chain].provider));
    }
  }

  setEvmContracts(evmContracts) {
    this.evmContracts = evmContracts;
  }

  parseUrl(input) {
    if (!input) {
      return undefined;
    }

    if ((0, _utils.isUrl)(input)) {
      return input;
    }

    if (input.includes('ipfs://')) {
      return _config.PINATA_IPFS_GATEWAY + input.split('ipfs://')[1];
    }

    return _config.PINATA_IPFS_GATEWAY + input.split('ipfs://ipfs/')[1];
  }

  parseMetadata(data) {
    const traitList = data.traits ? data.traits : data.attributes;
    const propertiesMap = {};

    if (traitList) {
      traitList.forEach(traitMap => {
        propertiesMap[traitMap.trait_type] = {
          value: traitMap.value // rarity: traitMap.trait_count / itemTotal

        };
      });
    } // extra fields


    if (data.dna) {
      propertiesMap.dna = {
        value: data.dna
      };
    }

    if (data.compiler) {
      propertiesMap.compiler = {
        value: data.compiler
      };
    }

    return {
      name: data.name,
      image: data.image_url ? this.parseUrl(data.image_url) : this.parseUrl(data.image),
      description: data.description,
      properties: propertiesMap,
      external_url: data.external_url,
      chain: this.chain
    };
  }

  async getItemsByCollection(smartContract, collectionName, updateItem, updateCollection, updateReady) {
    if (!this.web3) {
      return;
    } // eslint-disable-next-line @typescript-eslint/no-unsafe-argument


    const contract = new this.web3.eth.Contract(_web2.ERC721Contract, smartContract);
    let ownItem = false;
    let collectionImage;
    await Promise.all(this.addresses.map(async address => {
      if (!(0, _utilCrypto.isEthereumAddress)(address)) {
        return;
      } // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access


      const balance = await contract.methods.balanceOf(address).call();

      if (Number(balance) === 0) {
        updateReady(true);
        return;
      }

      const itemIndexes = [];

      for (let i = 0; i < Number(balance); i++) {
        itemIndexes.push(i);
      }

      try {
        await Promise.all(itemIndexes.map(async i => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          const tokenId = await contract.methods.tokenOfOwnerByIndex(address, i).call(); // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access

          const tokenURI = await contract.methods.tokenURI(tokenId).call();
          const detailUrl = this.parseUrl(tokenURI);

          if (detailUrl) {
            try {
              const itemDetail = await (0, _crossFetch.default)(detailUrl).then(resp => resp.json());
              const parsedItem = this.parseMetadata(itemDetail);
              parsedItem.collectionId = smartContract;
              parsedItem.id = tokenId.toString();

              if (parsedItem) {
                if (parsedItem.image) {
                  collectionImage = parsedItem.image;
                }

                updateItem(parsedItem);
                ownItem = true;
              }
            } catch (e) {
              console.error(`error parsing item for ${this.chain} nft`, e);
            }
          }
        }));
      } catch (e) {
        console.error('evm nft error', e);
      }
    }));

    if (ownItem) {
      const nftCollection = {
        collectionId: smartContract,
        collectionName,
        image: collectionImage || undefined,
        chain: this.chain
      };
      updateCollection(nftCollection);
      updateReady(true);
    }
  }

  async handleNfts(updateItem, updateCollection, updateReady) {
    if (!this.evmContracts) {
      return;
    }

    await Promise.all(this.evmContracts.map(async _ref => {
      let {
        name,
        smartContract
      } = _ref;
      return await this.getItemsByCollection(smartContract, name, updateItem, updateCollection, updateReady);
    }));
  }

  async fetchNfts(updateItem, updateCollection, updateReady) {
    try {
      this.connectWeb3();
      await this.handleNfts(updateItem, updateCollection, updateReady);
    } catch (e) {
      return 0;
    }

    return 1;
  }

}

exports.Web3NftApi = Web3NftApi;