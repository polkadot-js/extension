// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import TabHeaderItem from '@subwallet/extension-koni-ui/Popup/Home/Tabs/TabHeaderItem';
import { TabHeaderItemType } from '@subwallet/extension-koni-ui/Popup/Home/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  items: TabHeaderItemType[];
  onSelectItem: (tabId: number) => void;
  activatedItem: number;
}

function TabHeaders ({ activatedItem, className, items, onSelectItem }: Props): React.ReactElement<Props> {
  return (
    <div className={`tab-headers ${className || ''}`}>
      {items.map((item) => (
        <TabHeaderItem
          isActivated={activatedItem === item.tabId}
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
