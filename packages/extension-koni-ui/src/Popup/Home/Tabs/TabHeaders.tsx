import {Theme, ThemeProps} from "@polkadot/extension-koni-ui/types";
import {TabHeaderItemType} from "@polkadot/extension-koni-ui/Popup/Home/types";
import React, {useContext} from "react";
import styled, {ThemeContext} from "styled-components";
import TabHeaderItem from "@polkadot/extension-koni-ui/Popup/Home/Tabs/TabHeaderItem";

interface Props extends ThemeProps {
  className?: string;
  items: TabHeaderItemType[];
  onSelectItem: (tabId: number) => void;
  activatedItem: number;
}

function TabHeaders({items, className, onSelectItem, activatedItem}: Props): React.ReactElement<Props> {
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

  return (
    <div className={`tab-headers ${className}`}>
      {items.map(item => (
        <TabHeaderItem
          key={item.tabId}
          item={item}
          onSelect={onSelectItem}
          isActivated={activatedItem === item.tabId}
          isDarkTheme={themeContext.id === 'dark'}
        />
      ))}
    </div>
  )
}

export default styled(TabHeaders)(({theme}: Props) => `
  display: flex;
  border-top: 2px solid #212845;

  .tab-header-item {
    flex: 1;
  }
`);
