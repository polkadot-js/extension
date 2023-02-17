// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { ButtonProps, Icon } from '@subwallet/react-ui';
import { FadersHorizontal, MagnifyingGlass } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {
  children?: React.ReactNode;
  onClickFilterIcon?: () => void;
  onClickSearchIcon?: () => void;
};

const Home = ({ children, onClickFilterIcon, onClickSearchIcon }: Props) => {
  const navigate = useNavigate();

  const headerIcons = useMemo<ButtonProps[]>(() => {
    return [
      {
        icon: (
          <Icon
            phosphorIcon={FadersHorizontal}
            size='sm'
            type='phosphor'
          />
        ),
        onClick: onClickFilterIcon
      },
      {
        icon: (
          <Icon
            phosphorIcon={MagnifyingGlass}
            size='sm'
            type='phosphor'
          />
        ),
        onClick: onClickSearchIcon
      }
    ];
  }, [onClickFilterIcon, onClickSearchIcon]);

  const onClickListIcon = useCallback(() => {
    navigate('/settings/list');
  }, [navigate]);

  return (
    <Layout.Base
      headerCenter={false}
      headerIcons={headerIcons}
      headerLeft={'default'}
      headerOnClickLeft={onClickListIcon}
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
