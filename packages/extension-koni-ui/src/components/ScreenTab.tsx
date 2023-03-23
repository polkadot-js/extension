// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import styled from 'styled-components';

export type ChildProps = {
  label?: string;
  children: React.ReactElement;
}

type Props = ThemeProps & {
  children: React.ReactElement<ChildProps>[];
  defaultIndex?: number;
  hideTabList?: boolean;
  onSelectTab?: (index: number) => void;
}

const SwTabPanel = ({ children, label }: ChildProps) => {
  return (
    children
  );
};

const Component = (props: Props) => {
  const { children, className, defaultIndex = 0, hideTabList = false, onSelectTab } = props;

  const tabLabelList = React.Children.map(children, (child) => {
    return child.props.label;
  });

  return (
    <Tabs
      className={className}
      defaultIndex={defaultIndex}
      onSelect={onSelectTab}
    >
      <TabList className={CN('react-tabs__tab-list', { '__hide-tab-list': hideTabList })}>
        {
          tabLabelList.map((label) => (
            <Tab key={label}>{label}</Tab>
          ))
        }
      </TabList>
      {
        React.Children.map(children, (child) => (
          <TabPanel>
            {child}
          </TabPanel>
        ))
      }
    </Tabs>
  );
};

const _ScreenTab = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

    '.react-tabs__tab-list': {
      display: 'flex',
      padding: 4,
      borderRadius: token.borderRadiusLG,
      margin: `0 ${token.padding}px ${token.padding}px`,
      background: '#1A1A1A'
    },

    '.__hide-tab-list': {
      display: 'none'
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

type CompoundedComponent = React.ForwardRefExoticComponent<Omit<Props, 'theme'>> & {
  SwTabPanel: typeof SwTabPanel
};

const ScreenTab = _ScreenTab as unknown as CompoundedComponent;

ScreenTab.SwTabPanel = SwTabPanel;

export default ScreenTab;
