// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useFocusById from '@subwallet/extension-koni-ui/hooks/form/useFocusById';

const useFocusFormItem = (formName: string, fieldName: string, active = true, timeOut = 10) => {
  useFocusById(`${formName}_${fieldName}`, active, timeOut);
};

export default useFocusFormItem;
