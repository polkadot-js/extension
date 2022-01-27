// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';
import styled, { ThemeContext } from 'styled-components';

import TabHeaderItem from '@polkadot/extension-koni-ui/Popup/Home/Tabs/TabHeaderItem';
import { TabHeaderItemType } from '@polkadot/extension-koni-ui/Popup/Home/types';
import { Theme, ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
  items: TabHeaderItemType[];
  onSelectItem: (tabId: number) => void;
  activatedItem: number;
}

function TabHeaders ({ activatedItem, className, items, onSelectItem }: Props): React.ReactElement<Props> {
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

  return (
    <div className={`tab-headers ${className? className : ''}`}>
      {items.map((item) => (
        <TabHeaderItem
          isActivated={activatedItem === item.tabId}
          isDarkTheme={themeContext.id === 'dark'}
          item={item}
          key={item.tabId}
          onSelect={onSelectItem}
        />
      ))}
    </div>
  );
}

export default styled(TabHeaders)(({ theme }: Props) => `
  display: flex;
  border-top: 2px solid ${theme.borderColor2};

  .tab-header-item {
    flex: 1;
  }
`);
