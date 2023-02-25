// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FormFieldData } from '@subwallet/extension-koni-ui/types/form';

export const simpleCheckForm = (changedFields: FormFieldData[], allFields: FormFieldData[]) => {
  const error = allFields.map((data) => data.errors || [])
    .reduce((old, value) => [...old, ...value])
    .some((value) => !!value);

  const empty = allFields.map((data) => data.value as unknown).some((value) => !value);

  return {
    error,
    empty
  };
};
