// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '../../../../../__mocks__/chrome';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';

import { Theme, themes } from '../../components';
import Account from './Account';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
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
    wrapper = mountAccountComponent({ isExternal: false, type: 'ed25519' });
    wrapper.find('.settings').first().simulate('click');

    expect(wrapper.find('a.menuItem').length).toBe(4);
    expect(wrapper.find('a.menuItem').at(0).text()).toBe('Rename');
    expect(wrapper.find('a.menuItem').at(1).text()).toBe('Derive New Account');
    expect(wrapper.find('a.menuItem').at(2).text()).toBe('Export Account');
    expect(wrapper.find('a.menuItem').at(3).text()).toBe('Forget Account');
    expect(wrapper.find('.genesisSelection').exists()).toBe(true);
  });

  it('does not show Export option if account is external', () => {
    wrapper = mountAccountComponent({ isExternal: true, type: 'ed25519' });
    wrapper.find('.settings').first().simulate('click');

    expect(wrapper.find('a.menuItem').length).toBe(2);
    expect(wrapper.find('a.menuItem').at(0).text()).toBe('Rename');
    expect(wrapper.find('a.menuItem').at(1).text()).toBe('Forget Account');
    expect(wrapper.find('.genesisSelection').exists()).toBe(true);
  });

  it('does not show Derive option if account is of ethereum type', () => {
    wrapper = mountAccountComponent({ isExternal: false, type: 'ethereum' });
    wrapper.find('.settings').first().simulate('click');

    expect(wrapper.find('a.menuItem').length).toBe(3);
    expect(wrapper.find('a.menuItem').at(0).text()).toBe('Rename');
    expect(wrapper.find('a.menuItem').at(1).text()).toBe('Export Account');
    expect(wrapper.find('a.menuItem').at(2).text()).toBe('Forget Account');
    expect(wrapper.find('.genesisSelection').exists()).toBe(true);
  });

  it('does not show genesis dash selection dropsown if account is hardware', () => {
    wrapper = mountAccountComponent({ isExternal: true, isHardware: true });
    wrapper.find('.settings').first().simulate('click');

    expect(wrapper.find('a.menuItem').length).toBe(2);
    expect(wrapper.find('a.menuItem').at(0).text()).toBe('Rename');
    expect(wrapper.find('a.menuItem').at(1).text()).toBe('Forget Account');
    expect(wrapper.find('.genesisSelection').exists()).toBe(false);
  });
});
