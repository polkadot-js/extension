// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import '../../../../../__mocks__/chrome';

import Adapter from 'enzyme-adapter-react-16';
import { configure, mount, ReactWrapper } from 'enzyme';
import { themes, Theme } from '@polkadot/extension-ui/components';
import { MemoryRouter } from 'react-router';
import React from 'react';

import Account from './Account';
import { ThemeProvider } from 'styled-components';

configure({ adapter: new Adapter() });

describe('Account component', () => {
  let wrapper: ReactWrapper;
  const VALID_ADDRESS = 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const mountAccountComponent = (additionalAccountProperties: Record<string, unknown>, theme: Theme = themes.dark): ReactWrapper => mount(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <Account
          {...{ address: VALID_ADDRESS, ...additionalAccountProperties }}
        >
        </Account>
      </ThemeProvider>
    </MemoryRouter>);

  it('shows Export option if account is not external', () => {
    wrapper = mountAccountComponent({ isExternal: false });
    wrapper.find('Details').simulate('click');

    expect(wrapper.find('a.menuItem').length).toBe(4);
    expect(wrapper.find('a.menuItem').at(0).text()).toBe('Rename');
    expect(wrapper.find('a.menuItem').at(1).text()).toBe('Derive New Account');
    expect(wrapper.find('a.menuItem').at(2).text()).toBe('Export Account');
    expect(wrapper.find('a.menuItem').at(3).text()).toBe('Forget Account');
  });

  it('does not show Export option if account is external', () => {
    wrapper = mountAccountComponent({ isExternal: true });
    wrapper.find('Details').simulate('click');

    expect(wrapper.find('a.menuItem').length).toBe(2);
    expect(wrapper.find('a.menuItem').at(0).text()).toBe('Rename');
    expect(wrapper.find('a.menuItem').at(1).text()).toBe('Forget Account');
  });
});
