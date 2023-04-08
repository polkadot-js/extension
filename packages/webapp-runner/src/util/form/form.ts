// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FormFieldData } from "@subwallet-webapp/types/form";
import { FieldData } from "rc-field-form/lib/interface";

export function convertFieldToObject<T = Record<string, any>>(
  fields: FieldData[]
) {
  const rs = fields.reduce((data, { name, value }) => {
    data[name as string] = value;

    return data;
  }, {} as Record<string, unknown>);

  return rs as T;
}

export const simpleCheckForm = (allFields: FormFieldData[]) => {
  const error = allFields
    .map((data) => data.errors || [])
    .reduce((old, value) => [...old, ...value])
    .some((value) => !!value);

  const empty = allFields
    .map((data) => data.value as unknown)
    .some((value) => !value);

  return {
    error,
    empty,
  };
};
