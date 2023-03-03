// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FieldData } from 'rc-field-form/lib/interface';

export function convertFieldToObject<T = Record<string, any>> (fields: FieldData[]) {
  const rs = fields.reduce((data, { name, value }) => {
    data[name as string] = value;

    return data;
  }, {} as Record<string, unknown>);

  return rs as T;
}
