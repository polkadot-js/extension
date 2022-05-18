// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { AccountJson, AuthorizeRequest } from '@polkadot/extension-base/background/types';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { ThemeProvider } from 'styled-components';

import { AccountContext, AuthorizeReqContext, themes, Warning } from '../../components';
import { Header } from '../../partials';
import { buildHierarchy } from '../../util/buildHierarchy';
import Request from './Request';
import Authorize from '.';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

const accounts = [
  { address: '5FjgD3Ns2UpnHJPVeRViMhCttuemaRXEqaD8V5z4vxcsUByA', name: 'A', type: 'sr25519' }
] as AccountJson[];

describe('Authorize', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const mountAuthorize = (authorizeRequests: AuthorizeRequest[] = [], withAccounts = true): ReactWrapper => mount(
    <AuthorizeReqContext.Provider value={authorizeRequests}>
      <AccountContext.Provider
        value={{
          accounts: withAccounts ? accounts : [],
          hierarchy: accounts ? buildHierarchy(accounts) : []
        }}
      >
        <ThemeProvider theme={themes.dark}>
          <Authorize />
        </ThemeProvider>
      </AccountContext.Provider>
    </AuthorizeReqContext.Provider>);

  it('render component', () => {
    const wrapper = mountAuthorize();

    expect(wrapper.find(Header).text()).toBe('Account connection request');
    expect(wrapper.find(Request).length).toBe(0);
  });

  it('render requests', () => {
    const wrapper = mountAuthorize([{ id: '1', request: { origin: '???' }, url: 'http://polkadot.org' }]);

    expect(wrapper.find(Request).length).toBe(1);
    expect(wrapper.find(Request).find('.warning-message').text()).toBe('An application, self-identifying as ??? is requesting access from http://polkadot.org');
  });

  it('render more request but just one accept button', () => {
    const wrapper = mountAuthorize([
      { id: '1', request: { origin: '???' }, url: 'http://polkadot.org' },
      { id: '2', request: { origin: 'abc' }, url: 'http://polkadot.pl' }
    ]);

    expect(wrapper.find(Request).length).toBe(2);
    expect(wrapper.find(Warning).length).toBe(2);
    expect(wrapper.find(Request).at(1).find('.warning-message').text()).toBe('An application, self-identifying as abc is requesting access from http://polkadot.pl');
    expect(wrapper.find('button.acceptButton').length).toBe(1);
  });

  it.only('render a warning and explication text when there is no account', () => {
    const wrapper = mountAuthorize([{ id: '1', request: { origin: '???' }, url: 'http://polkadot.org' }], false);

    expect(wrapper.find(Request).length).toBe(1);
    expect(wrapper.find(Request).find('.warning-message').text()).toBe("You do not have any account. Please create an account and refresh the application's page.");
    expect(wrapper.find('button.acceptButton').length).toBe(1);
  });
});
