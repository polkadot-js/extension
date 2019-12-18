// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import Adapter from 'enzyme-adapter-react-16';

import { ThemeProvider } from 'styled-components';
import { AuthorizeContext, themes, Header, Icon } from '@polkadot/extension-ui/components';
import Authorize from '.';
import { configure, mount, ReactWrapper } from 'enzyme';
import { AuthorizeRequest } from '@polkadot/extension/background/types';
import Request from './Request';

configure({ adapter: new Adapter() });

describe('Authorize', () => {
  const mountAuthorize = (authorizeRequests: AuthorizeRequest[] = []): ReactWrapper => mount(
    <AuthorizeContext.Provider value={authorizeRequests}>
      <ThemeProvider theme={themes.dark}>
        <Authorize />
      </ThemeProvider>
    </AuthorizeContext.Provider>);

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

    expect(wrapper.find('AcceptButton').length).toBe(1);
    expect(wrapper.find(Icon).length).toBe(2);
    expect(wrapper.find(Request).at(1).find('.tab-info').text()).toBe('An application, self-identifying as abc is requesting access from http://polkadot.pl.');
  });
});
