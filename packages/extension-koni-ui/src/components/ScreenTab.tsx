// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import { Tab, TabList, Tabs } from 'react-tabs';
import styled from 'styled-components';

type Props = ThemeProps & {
  tabList: string[];
  children: React.ReactNode;
}

const Component: React.FC<Props> = (props: Props) => {
  const { children, className, tabList } = props;

  const renderTabItem = () => {
    return (
      <TabList>
        {
          tabList.map((item) => (
            <Tab key={item}>{item}</Tab>
          ))
        }
      </TabList>
    );
  };

  return (
    <Tabs className={className}>
      {renderTabItem()}

      {children}
    </Tabs>
  );
};

const ScreenTab = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

    '.react-tabs__tab-list': {
      display: 'flex',
      padding: 4,
      borderRadius: '8px',
      margin: '16px',
      background: '#1A1A1A'
    },

    '.react-tabs__tab': {
      display: 'inline-block',
      border: 'none',
      outline: 'none',
      position: 'relative',
      listStyle: 'none',
      padding: '5px 8px',
      cursor: 'pointer',
      flex: 1,
      textAlign: 'center',
      borderRadius: '8px',
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      fontWeight: token.fontWeightStrong
    },

    '.react-tabs__tab--selected': {
      background: '#252525'
    }
  };
});

export default ScreenTab;
