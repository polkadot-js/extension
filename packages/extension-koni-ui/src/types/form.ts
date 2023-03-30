// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Callbacks, FieldData, FormInstance as _FormInstance, Rule } from 'rc-field-form/lib/interface';

export type FormCallbacks<Values> = Callbacks<Values>;
export type FormFieldData = FieldData;
export type FormRule = Rule;
export type FormInstance<Values> = _FormInstance<Values>;
