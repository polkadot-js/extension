// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import AccountCardBase, { _AccountCardProps } from '@subwallet/extension-koni-ui/components/Account/Card/AccountCardBase';
import React from 'react';
import styled from 'styled-components';

function Component (props: _AccountCardProps): React.ReactElement<_AccountCardProps> {
  return (
    <AccountCardBase
      {...props}
      addressPreLength={9}
      addressSufLength={9}
      preventPrefix
      showMoreBtn={true}
    />
  );
}

const AccountCardSelection = styled(Component)<_AccountCardProps>(({ theme: { token } }: _AccountCardProps) => {
  return {};
});

export default AccountCardSelection;
