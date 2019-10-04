// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson } from '@polkadot/extension/background/types';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount, ReactWrapper } from 'enzyme';
import { Link } from '@polkadot/extension-ui/components';
import { MemoryRouter } from 'react-router';
import React from 'react';

import Account from './Account';

configure({ adapter: new Adapter() });

describe('Account component', () => {
  let wrapper: ReactWrapper;
  const VALID_ADDRESS = 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5';
  const mountAccountComponent = (account: AccountJson): ReactWrapper => mount(
    <MemoryRouter>
      <Account
        {...account}>
      </Account>
    </MemoryRouter>);

  it('shows Export option if account is not external', () => {
    wrapper = mountAccountComponent({ address: VALID_ADDRESS, isExternal: false });

    expect(wrapper.find(Link).length).toBe(3);
    expect(wrapper.find(Link).at(0).contains('Edit')).toBe(true);
    expect(wrapper.find(Link).at(1).contains('Export')).toBe(true);
    expect(wrapper.find(Link).at(2).contains('Forget')).toBe(true);
  });

  it('does not show Export option if account is external', () => {
    wrapper = mountAccountComponent({ address: VALID_ADDRESS, isExternal: true });

    expect(wrapper.find(Link).length).toBe(2);
    expect(wrapper.find(Link).at(0).contains('Edit')).toBe(true);
    expect(wrapper.find(Link).at(1).contains('Forget')).toBe(true);
  });
});
