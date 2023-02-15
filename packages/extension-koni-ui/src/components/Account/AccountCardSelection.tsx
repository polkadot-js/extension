// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import AccountCardBase, { _AccountCardProps } from '@subwallet/extension-koni-ui/components/Account/AccountCardBase';
import React from 'react';

function AccountCardSelection (props: Partial<_AccountCardProps>): React.ReactElement<Partial<_AccountCardProps>> {
  return (
    <AccountCardBase
      {...props}
      addressPreLength={9}
      addressSufLength={9}
      showMoreBtn
    />
  );
}

export default AccountCardSelection;
