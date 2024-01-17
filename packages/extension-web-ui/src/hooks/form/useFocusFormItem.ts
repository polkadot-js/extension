// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FormInstance } from '@subwallet/react-ui/es/form/hooks/useForm';
import { useEffect } from 'react';

const useFocusFormItem = (form: FormInstance, fieldName: string, active = true, timeOut = 33) => {
  useEffect(() => {
    if (active) {
      setTimeout(() => {
        const elem = form.getFieldInstance(fieldName) as HTMLInputElement;

        elem?.focus?.();
      }, timeOut);
    }
  }, [active, fieldName, form, timeOut]);
};

export default useFocusFormItem;
