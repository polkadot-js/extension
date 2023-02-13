// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import { _AccountCardProps } from '@subwallet/extension-koni-ui/components/Account/AccountCardBase';
import AccountCardBase from '@subwallet/extension-koni-ui/components/Account/AccountCardBase';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';

function AccountCardSelection (props: Partial<_AccountCardProps>): React.ReactElement<Partial<_AccountCardProps>> {
  const { address, className, renderRightItem } = props;
  const { t } = useTranslation();
  const { show } = useToast();

  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  return (
    <AccountCardBase
      {...props}
      address={address}
      className={className}
      addressPreLength={9}
      addressSufLength={9}
      showCopyBtn
      showMoreBtn
      onPressCopyBtn={_onCopy}
      renderRightItem={renderRightItem}
    />
  );
}

export default AccountCardSelection
