// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

const chainSpec = {
  "types": {
    "AppId": "Compact<u32>",
    "DataLookupIndexItem": {
      "appId": "AppId",
      "start": "Compact<u32>"
    },
    "DataLookup": {
      "size": "Compact<u32>",
      "index": "Vec<DataLookupIndexItem>"
    },
    "KateCommitment": {
      "rows": "Compact<u16>",
      "cols": "Compact<u16>",
      "commitment": "Vec<u8>",
      "dataRoot": "H256"
    },
    "V1HeaderExtension": {
      "appLookup": "DataLookup",
      "commitment": "KateCommitment"
    },
    "HeaderExtension": {
      "_enum": {
        "V1": "V1HeaderExtension"
      }
    },
    "DaHeader": {
      "parentHash": "Hash",
      "number": "Compact<BlockNumber>",
      "stateRoot": "Hash",
      "extrinsicsRoot": "Hash",
      "digest": "Digest",
      "extension": "HeaderExtension"
    },
    "Header": "DaHeader",
    "CheckAppIdExtra": {
      "appId": "AppId"
    },
    "CheckAppIdTypes": {},
    "CheckAppId": {
      "extra": "CheckAppIdExtra",
      "types": "CheckAppIdTypes"
    },
    "BlockLength": {
      "max": "PerDispatchClass",
      "cols": "Compact<u32>",
      "rows": "Compact<u32>",
      "chunkSize": "Compact<u32>"
    },
    "PerDispatchClass": {
      "normal": "u32",
      "operational": "u32",
      "mandatory": "u32"
    },
    "DataProof": {
      "root": "H256",
      "proof": "Vec<H256>",
      "numberOfLeaves": "Compact<u32>",
      "leaf_index": "Compact<u32>",
      "leaf": "H256"
    },
    "Cell": {
      "row": "u32",
      "col": "u32"
    }
  },
  "rpc": {
    "kate": {
      "blockLength": {
        "description": "Get Block Length",
        "params": [
          {
            "name": "at",
            "type": "Hash",
            "isOptional": true
          }
        ],
        "type": "BlockLength"
      },
      "queryProof": {
        "description": "Generate the kate proof for the given `cells`",
        "params": [
          {
            "name": "cells",
            "type": "Vec<Cell>"
          },
          {
            "name": "at",
            "type": "Hash",
            "isOptional": true
          }
        ],
        "type": "Vec<u8>"
      },
      "queryDataProof": {
        "description": "Generate the data proof for the given `index`",
        "params": [
          {
            "name": "data_index",
            "type": "u32"
          },
          {
            "name": "at",
            "type": "Hash",
            "isOptional": true
          }
        ],
        "type": "DataProof"
      }
    }
  },
  "signedExtensions": {
    "CheckAppId": {
      "extrinsic": {
        "appId": "AppId"
      },
      "payload": {}
    }
  }
};

export default chainSpec;
