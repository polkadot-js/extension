// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Root } from 'protobufjs';

function defineMessage (schema: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return Root.fromJSON(JSON.parse(schema));
}

function convertEnumToString (value: any, key: string, NFTMeta: any, locale: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let result = value;

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const options = NFTMeta?.fields[key]?.resolvedType?.options;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const valueJsonComment = options[value];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
    const translationObject = JSON.parse(valueJsonComment);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (translationObject && (translationObject[locale])) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      result = translationObject[locale];
    }
  } catch (e) {
    console.log('Error parsing schema when trying to convert enum to string: ', e);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result;
}

export const deserializeNft = (schema: string, buffer: Uint8Array, locale: string) => {
  const root = defineMessage(schema);

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
    // eslint-disable-next-line @typescript-eslint/ban-types
    if (NFTMeta?.fields[key]?.resolvedType?.options && Object.keys(NFTMeta?.fields[key]?.resolvedType?.options as Object).length > 0) {
      if (Array.isArray(objectItem[key])) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const item = objectItem[key];

        objectItem[key] = [];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        item.forEach((value: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          objectItem[key].push(convertEnumToString(value, key, NFTMeta, locale));
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        objectItem[key] = convertEnumToString(objectItem[key], key, NFTMeta, locale);
      }
    }
  }

  return objectItem;
};
