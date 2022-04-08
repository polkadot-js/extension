"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RmrkNftApi = void 0;

var _crossFetch = _interopRequireDefault(require("cross-fetch"));

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _nft = require("@polkadot/extension-koni-base/api/nft/nft");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

var _config = require("../config");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
const headers = {
  'Content-Type': 'application/json'
};
var RMRK_SOURCE;

(function (RMRK_SOURCE) {
  RMRK_SOURCE["BIRD_KANARIA"] = "bird_kanaria";
  RMRK_SOURCE["KANARIA"] = "kanaria";
  RMRK_SOURCE["SINGULAR_V1"] = "singular_v1";
  RMRK_SOURCE["SINGULAR_V2"] = "singular_v2";
})(RMRK_SOURCE || (RMRK_SOURCE = {}));

class RmrkNftApi extends _nft.BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
  }

  setAddresses(addresses) {
    super.setAddresses(addresses);
    const kusamaAddresses = [];

    for (const address of this.addresses) {
      const kusamaAddress = (0, _utils.reformatAddress)(address, 2);
      kusamaAddresses.push(kusamaAddress);
    }

    this.addresses = kusamaAddresses;
  }

  parseUrl(input) {
    if (!input || input.length === 0) {
      return undefined;
    }

    if ((0, _utils.isUrl)(input) || input.includes('https://') || input.includes('http')) {
      return input;
    }

    if (!input.includes('ipfs://ipfs/')) {
      return _config.RMRK_PINATA_SERVER + input;
    }

    return _config.RMRK_PINATA_SERVER + input.split('ipfs://ipfs/')[1];
  }

  async getMetadata(metadataUrl) {
    let url = metadataUrl;

    if (!(0, _utils.isUrl)(metadataUrl)) {
      url = this.parseUrl(metadataUrl);

      if (!url || url.length === 0) {
        return undefined;
      }
    }

    return await (0, _crossFetch.default)(url, {
      method: 'GET',
      headers
    }).then(res => res.json());
  }

  async getAllByAccount(account) {
    const fetchUrls = [{
      url: _config.KANARIA_ENDPOINT + 'account-birds/' + account,
      source: RMRK_SOURCE.BIRD_KANARIA
    }, {
      url: _config.KANARIA_ENDPOINT + 'account-items/' + account,
      source: RMRK_SOURCE.KANARIA
    }, {
      url: _config.SINGULAR_V1_ENDPOINT + account,
      source: RMRK_SOURCE.SINGULAR_V1
    }, {
      url: _config.SINGULAR_V2_ENDPOINT + account,
      source: RMRK_SOURCE.SINGULAR_V2
    }];
    let data = [];
    await Promise.all(fetchUrls.map(async _ref => {
      let {
        source,
        url
      } = _ref;

      let _data = await (0, _crossFetch.default)(url, {
        method: 'GET',
        headers
      }).then(res => res.json());

      _data = _data.map(item => {
        return { ...item,
          source
        };
      });
      data = data.concat(_data);
    }));
    const nfts = [];
    await Promise.all(data.map(async item => {
      const primaryResource = item.primaryResource ? item.primaryResource : null;
      const metadataUri = primaryResource && primaryResource.metadata ? primaryResource.metadata : item.metadata;
      const result = await this.getMetadata(metadataUri);

      if (item.source === RMRK_SOURCE.BIRD_KANARIA) {
        nfts.push({ ...item,
          metadata: result,
          external_url: _config.KANARIA_EXTERNAL_SERVER + item.id.toString()
        });
      } else if (item.source === RMRK_SOURCE.KANARIA) {
        nfts.push({ ...item,
          metadata: { ...result,
            image: this.parseUrl(result === null || result === void 0 ? void 0 : result.image)
          },
          external_url: _config.KANARIA_EXTERNAL_SERVER + item.id.toString()
        });
      } else if (item.source === RMRK_SOURCE.SINGULAR_V1) {
        nfts.push({ ...item,
          metadata: {
            description: result === null || result === void 0 ? void 0 : result.description,
            name: result === null || result === void 0 ? void 0 : result.name,
            attributes: result === null || result === void 0 ? void 0 : result.attributes,
            animation_url: this.parseUrl(result === null || result === void 0 ? void 0 : result.animation_url),
            image: this.parseUrl(result === null || result === void 0 ? void 0 : result.image)
          },
          external_url: _config.SINGULAR_V1_EXTERNAL_SERVER + item.id.toString()
        });
      } else if (item.source === RMRK_SOURCE.SINGULAR_V2) {
        const id = item.id;

        if (!id.toLowerCase().includes('kanbird')) {
          // excludes kanaria bird, already handled above
          nfts.push({ ...item,
            metadata: {
              description: result === null || result === void 0 ? void 0 : result.description,
              name: result === null || result === void 0 ? void 0 : result.name,
              attributes: result === null || result === void 0 ? void 0 : result.attributes,
              properties: result === null || result === void 0 ? void 0 : result.properties,
              animation_url: this.parseUrl(result === null || result === void 0 ? void 0 : result.animation_url),
              image: this.parseUrl(result === null || result === void 0 ? void 0 : result.mediaUri)
            },
            external_url: _config.SINGULAR_V2_EXTERNAL_SERVER + item.id.toString()
          });
        }
      }
    }));
    return nfts;
  }

  async handleNfts(updateItem, updateCollection, updateReady) {
    // const start = performance.now();
    let allNfts = [];
    const allCollections = [];

    try {
      await Promise.all(this.addresses.map(async address => {
        const nfts = await this.getAllByAccount(address);
        allNfts = allNfts.concat(nfts);
      }));

      if (allNfts.length <= 0) {
        updateReady(true);
      }

      const collectionInfoUrl = [];

      for (const item of allNfts) {
        var _item$metadata, _item$metadata2, _item$metadata3;

        const parsedItem = {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          id: item === null || item === void 0 ? void 0 : item.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          name: item === null || item === void 0 ? void 0 : (_item$metadata = item.metadata) === null || _item$metadata === void 0 ? void 0 : _item$metadata.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
          image: this.parseUrl(item.image ? item.image : item.metadata.image ? item.metadata.image : item.metadata.animation_url),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          description: item === null || item === void 0 ? void 0 : (_item$metadata2 = item.metadata) === null || _item$metadata2 === void 0 ? void 0 : _item$metadata2.description,
          external_url: item === null || item === void 0 ? void 0 : item.external_url,
          rarity: item === null || item === void 0 ? void 0 : item.metadata_rarity,
          collectionId: item === null || item === void 0 ? void 0 : item.collectionId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          properties: item === null || item === void 0 ? void 0 : (_item$metadata3 = item.metadata) === null || _item$metadata3 === void 0 ? void 0 : _item$metadata3.properties,
          chain: 'kusama',
          rmrk_ver: item.source && item.source === RMRK_SOURCE.SINGULAR_V1 ? _KoniTypes.RMRK_VER.VER_1 : _KoniTypes.RMRK_VER.VER_2
        };
        updateItem(parsedItem);
        let url = '';

        if (item.source === RMRK_SOURCE.SINGULAR_V1) {
          url = _config.SINGULAR_V1_COLLECTION_ENDPOINT + item.collectionId;
        } else {
          url = _config.SINGULAR_V2_COLLECTION_ENDPOINT + item.collectionId;
        }

        if (!collectionInfoUrl.includes(url)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          allCollections.push({
            collectionId: item.collectionId
          });
          collectionInfoUrl.push(url.replace(' ', '%20'));
        }
      }

      const allCollectionMetaUrl = [];
      await Promise.all(collectionInfoUrl.map(async url => {
        const data = await (0, _crossFetch.default)(url).then(resp => resp.json());
        const result = data[0];

        if (result && 'metadata' in result) {
          allCollectionMetaUrl.push({
            url: this.parseUrl(result === null || result === void 0 ? void 0 : result.metadata),
            id: result === null || result === void 0 ? void 0 : result.id
          });
        }

        if (data.length > 0) {
          return result;
        } else {
          return {};
        }
      }));
      const allCollectionMeta = {};
      await Promise.all(allCollectionMetaUrl.map(async item => {
        let data = {};

        if (item.url) {
          data = await (0, _crossFetch.default)(item === null || item === void 0 ? void 0 : item.url).then(resp => resp.json());
        }

        if ('mediaUri' in data) {
          // rmrk v2.0
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          allCollectionMeta[item === null || item === void 0 ? void 0 : item.id] = { ...data,
            image: data.mediaUri
          };
        } else {
          allCollectionMeta[item === null || item === void 0 ? void 0 : item.id] = { ...data
          };
        }
      }));
      allCollections.forEach(item => {
        const parsedCollection = {
          collectionId: item.collectionId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          collectionName: allCollectionMeta[item.collectionId] ? allCollectionMeta[item.collectionId].name : null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          image: allCollectionMeta[item.collectionId] ? this.parseUrl(allCollectionMeta[item.collectionId].image) : null,
          chain: 'kusama'
        };
        updateCollection(parsedCollection);
        updateReady(true);
      });
    } catch (e) {
      console.error('Failed to fetch rmrk nft', e);
    }
  }

  async fetchNfts(updateItem, updateCollection, updateReady) {
    try {
      await this.handleNfts(updateItem, updateCollection, updateReady);
    } catch (e) {
      return 0;
    }

    return 1;
  }

}

exports.RmrkNftApi = RmrkNftApi;