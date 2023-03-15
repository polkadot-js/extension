// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FormInstance } from '@subwallet/react-ui/es/form/hooks/useForm';
import { useEffect } from 'react';

const useFocusFormItem = (form: FormInstance, fieldName: string, active = true) => {
  useEffect(() => {
    if (active) {
      const elem = form.getFieldInstance(fieldName) as HTMLInputElement;

      elem && elem.focus && elem.focus();
    }
  }, [active, fieldName, form]);
};

export default useFocusFormItem;
