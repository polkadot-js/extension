// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import AccountCardBase, { _AccountCardProps } from '@subwallet/extension-koni-ui/components/Account/AccountCardBase';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import React, { useCallback } from 'react';

function AccountCardSelection (props: Partial<_AccountCardProps>): React.ReactElement<Partial<_AccountCardProps>> {
  const t = useTranslation().t;
  const notify = useNotification();

  const _onCopy = useCallback(
    () => notify({ message: t('Copied'), type: 'info', duration: 1.5 }),
    [notify, t]
  );

  return (
    <AccountCardBase
      {...props}
      addressPreLength={9}
      addressSufLength={9}
      onPressCopyBtn={_onCopy}
      showCopyBtn
      showMoreBtn
    />
  );
}

export default AccountCardSelection;
