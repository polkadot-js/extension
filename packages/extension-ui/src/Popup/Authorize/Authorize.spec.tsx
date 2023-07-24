// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { AccountJson, AuthorizeRequest } from '@polkadot/extension-base/background/types';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { AccountContext, AuthorizeReqContext, themes } from '../../components';
import { buildHierarchy } from '../../util/buildHierarchy';
import Account from '../Accounts/Account';
import Request from './Request';
import Authorize from '.';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

const oneRequest = [{ id: '1', payload: { origin: '???' }, url: 'http://polkadot.org' }];

const twoRequests = [...oneRequest, { id: '2', payload: { origin: 'abc' }, url: 'http://polkadot.pl' }];

const oneAccount = [
  { address: '5FjgD3Ns2UpnHJPVeRViMhCttuemaRXEqaD8V5z4vxcsUByA', name: 'A', type: 'sr25519' }
] as AccountJson[];

const twoAccountsOnehidden = [
  ...oneAccount,
  { address: '5GYmFzQCuC5u3tQNiMZNbFGakrz3Jq31NmMg4D2QAkSoQ2g5', isHidden: true, name: 'B', type: 'sr25519' }
] as AccountJson[];

const threeAccountsOnehidden = [
  ...twoAccountsOnehidden,
  {
    address: '5D2TPhGEy2FhznvzaNYW9AkuMBbg3cyRemnPsBvBY4ZhkZXA',
    name: 'BB',
    parentAddress: twoAccountsOnehidden[1].address,
    type: 'sr25519'
  }
] as AccountJson[];

describe('Authorize', () => {
  const mountAuthorize = (
    authorizeRequests: AuthorizeRequest[] = [],
    accounts: AccountJson[] = oneAccount
  ): ReactWrapper =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    mount(
      <Router>
        <AuthorizeReqContext.Provider value={authorizeRequests}>
          <AccountContext.Provider
            value={{
              accounts,
              hierarchy: accounts ? buildHierarchy(accounts) : []
            }}
          >
            <ThemeProvider theme={themes.dark}>
              <Authorize />
            </ThemeProvider>
          </AccountContext.Provider>
        </AuthorizeReqContext.Provider>
      </Router>
    );

  it('render component', () => {
    const wrapper = mountAuthorize();

    expect(wrapper.find(Request).length).toBe(0);
    setTimeout(() => {
      expect(wrapper.find('.heading').text()).toBe('You do NOT have any account');
    }, 1000);
  });

  it('render requests', () => {
    const wrapper = mountAuthorize(oneRequest);

    wrapper.update();
    expect(wrapper.find(Request).length).toBe(1);
    expect(wrapper.find(Request).find('.subtitle').text()).toBe(
      'Choose accounts to use with this app. It will access addresses, balances, activities and request transactions to sign.'
    );
  });

  it('render more request but just one accept button', () => {
    const wrapper = mountAuthorize(twoRequests);

    setTimeout(() => {
      expect(wrapper.find(Request).length).toBe(2);
      expect(wrapper.find(Request).at(1).find('.subtitle').text()).toBe(
        'Choose accounts to use with this app. It will access addresses, balances, activities and request transactions to sign.'
      );
      expect(wrapper.find('[data-accept-request-button=true] button').length).toBe(2);
    }, 1000);
  });

  it('render a warning and explication text when there is no account', () => {
    const wrapper = mountAuthorize(oneRequest, []);

    expect(wrapper.find(Request).length).toBe(1);
    setTimeout(() => {
      expect(wrapper.find('.heading').text()).toBe('You do NOT have any account');
    }, 1000);
    expect(wrapper.find('button.acceptButton').length).toBe(1);
  });

  it('show the right amount of accounts', () => {
    const wrapper = mountAuthorize(oneRequest);

    expect(wrapper.find(Request).length).toBe(1);
    expect(wrapper.find(Account).length).toBe(1);
    expect(wrapper.find('[data-accept-request-button=true] button').length).toBe(1);
  });

  it('does not show the hidden accounts', () => {
    const wrapper = mountAuthorize(oneRequest, twoAccountsOnehidden);

    expect(wrapper.find(Request).length).toBe(1);
    expect(wrapper.find(Account).length).toBe(1);
  });

  it('shows the children of hidden accounts', () => {
    const wrapper = mountAuthorize(oneRequest, threeAccountsOnehidden);

    setTimeout(() => {
      expect(wrapper.find(Request).length).toBe(1);
      expect(wrapper.find(Account).length).toBe(1);
    }, 1000);
  });
});
