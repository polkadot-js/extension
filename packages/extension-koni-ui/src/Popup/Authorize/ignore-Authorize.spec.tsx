// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { AuthorizeRequest } from '@polkadot/extension-base/background/types';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { ThemeProvider } from 'styled-components';

import { AuthorizeReqContext, Icon, themes } from '../../components';
import { Header } from '../../partials';
import Request from './Request';
import Authorize from '.';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

describe('Authorize', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const mountAuthorize = (authorizeRequests: AuthorizeRequest[] = []): ReactWrapper => mount(
    <AuthorizeReqContext.Provider value={authorizeRequests}>
      <ThemeProvider theme={themes.dark}>
        <Authorize />
      </ThemeProvider>
    </AuthorizeReqContext.Provider>);

  it('render component', () => {
    const wrapper = mountAuthorize();

    expect(wrapper.find(Header).text()).toBe('Authorize');
    expect(wrapper.find(Request).length).toBe(0);
  });

  it('render requests', () => {
    const wrapper = mountAuthorize([{ id: '1', request: { origin: '???' }, url: 'http://polkadot.org' }]);

    expect(wrapper.find(Request).length).toBe(1);
    expect(wrapper.find(Request).find('.tab-info').text()).toBe('An application, self-identifying as ??? is requesting access from http://polkadot.org.');
  });

  it('render more request but just one accept button', () => {
    const wrapper = mountAuthorize([
      { id: '1', request: { origin: '???' }, url: 'http://polkadot.org' },
      { id: '2', request: { origin: 'abc' }, url: 'http://polkadot.pl' }
    ]);

    expect(wrapper.find(Request).length).toBe(2);
    expect(wrapper.find(Icon).length).toBe(2);
    expect(wrapper.find(Request).at(1).find('.tab-info').text()).toBe('An application, self-identifying as abc is requesting access from http://polkadot.pl.');
    expect(wrapper.find('button.acceptButton').length).toBe(1);
  });
});
