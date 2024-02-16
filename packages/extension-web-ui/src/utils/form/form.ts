// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FormFieldData } from '@subwallet/extension-web-ui/types/form';
import { FieldData } from 'rc-field-form/lib/interface';

import { isArray } from '@polkadot/util';

export function convertFieldToObject<T = Record<string, any>> (fields: FieldData[]) {
  const rs = fields.reduce((data, { name, value }) => {
    data[name as string] = value;

    return data;
  }, {} as Record<string, unknown>);

  return rs as T;
}

export function convertFieldToError<T = Record<string, unknown>> (fields: FieldData[]): Record<keyof T, string[]> {
  return fields.reduce((data, { errors, name }) => {
    data[name as keyof T] = errors || [];

    return data;
  }, {} as Record<keyof T, string[]>);
}

// RequiredFields: '*': check all | '--x': exclude x | 'x': include x
export const simpleCheckForm = (allFields: FormFieldData[], requiredFields: string[] = ['*']) => {
  const error = allFields.map((data) => data.errors || [])
    .reduce((old, value) => [...old, ...value], [])
    .some((value) => !!value);

  const empty = allFields.some((data) => {
    const value = data.value as unknown;
    const names = isArray(data.name) ? data.name : [data.name];

    let checkAll = false;

    const required: string[] = [];
    const ignored: string[] = [];

    for (const requiredField of requiredFields) {
      if (requiredField === '*') {
        checkAll = true;
      } else if (requiredField.startsWith('--')) {
        const name = requiredField.slice(2);

        ignored.push(name);
      } else {
        required.push(requiredField);
      }
    }

    const ignorePass = ignored.length ? ignored.every((name) => !names.includes(name)) : true;
    const requirePass = required.length ? required.some((name) => names.includes(name)) : true;

    const needCheck = checkAll || (ignorePass && requirePass);

    return !needCheck ? false : typeof value === 'boolean' ? false : !value;
  });

  return {
    error,
    empty
  };
};
