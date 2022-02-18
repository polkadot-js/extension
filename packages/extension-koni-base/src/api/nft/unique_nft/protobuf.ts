// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Root } from 'protobufjs';

function defineMessage (schema: string) {
  try {
    return Root.fromJSON(JSON.parse(schema));
  } catch (e) {
    console.error(e);

    return null;
  }
}

function convertEnumToString (value: any, key: string, NFTMeta: any, locale: any) {
  let result = value;

  try {
    const options = NFTMeta?.fields[key]?.resolvedType?.options;
    const valueJsonComment = options[value];
    const translationObject = JSON.parse(valueJsonComment);

    if (translationObject && (translationObject[locale])) {
      result = translationObject[locale];
    }
  } catch (e) {
    console.log('Error parsing schema when trying to convert enum to string: ', e);
  }

  return result;
}

export const deserializeNft = (schema: string, buffer: Uint8Array, locale: string) => {
  const root = defineMessage(schema);

  if (root === null) return root;

  // Obtain the message type
  const NFTMeta = root.lookupType('onChainMetaData.NFTMeta');

  // Decode a Uint8Array (browser) or Buffer (node) to a message
  const message = NFTMeta.decode(buffer);

  // Maybe convert the message back to a plain object
  const objectItem = NFTMeta.toObject(message, {
    arrays: true, // populates empty arrays (repeated fields) even if defaults=false
    bytes: String, // bytes as base64 encoded strings
    defaults: true, // includes default values
    enums: String, // enums as string names
    longs: String, // longs as strings (requires long.js)
    objects: true, // populates empty objects (map fields) even if defaults=false
    oneofs: true
  });

  for (const key in objectItem) {
    if (NFTMeta?.fields[key]?.resolvedType?.options && Object.keys(NFTMeta?.fields[key]?.resolvedType?.options as Object).length > 0) {
      if (Array.isArray(objectItem[key])) {
        const item = objectItem[key];

        objectItem[key] = [];
        item.forEach((value: any) => {
          objectItem[key].push(convertEnumToString(value, key, NFTMeta, locale));
        });
      } else {
        objectItem[key] = convertEnumToString(objectItem[key], key, NFTMeta, locale);
      }
    }
  }

  return objectItem;
};
