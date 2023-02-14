// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import Icon from '@subwallet/react-ui/es/icon';
import { MagnifyingGlass } from 'phosphor-react';
import React from 'react';

type Props = {
  children?: React.ReactNode;
};

const headerIcons = [
  {
    icon: (
      <Icon
        phosphorIcon={MagnifyingGlass}
        size='sm'
        type='phosphor'
      />
    )
  }
];

const Home = ({ children }: Props) => {
  return (
    <Layout.Base
      headerCenter={false}
      headerIcons={headerIcons}
      headerLeft={'default'}
      headerPaddingVertical={true}
      showHeader={true}
      showLeftButton={true}
      showTabBar={true}
    >
      {children}
    </Layout.Base>
  );
};

export { Home };
