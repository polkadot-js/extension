import React from 'react';
import Adapter from 'enzyme-adapter-react-16';

import {ThemeProvider} from "styled-components";
import {AuthorizeContext, defaultTheme, Header} from "@polkadot/extension-ui/components";
import Authorize from ".";
import { configure, mount, ReactWrapper } from 'enzyme';
import {AuthorizeRequest} from '@polkadot/extension/background/types';
import Request from './Request';

configure({ adapter: new Adapter() });

describe('Authorize', () => {

  const mountAuthorize = (authorizeRequests: AuthorizeRequest[] = []): ReactWrapper => mount(
    <AuthorizeContext.Provider value={authorizeRequests}>
      <ThemeProvider theme={defaultTheme}>
        <Authorize/>
      </ThemeProvider>
    </AuthorizeContext.Provider>);


  it('render component', () => {
    const wrapper = mountAuthorize();

    expect(wrapper.find(Header).text()).toBe('polkadot');
    expect(wrapper.find(Request).length).toBe(0);

  })

  it('render requests', () => {
    const wrapper = mountAuthorize([{id: '1', request: {origin: '???'}, url: 'http://polkadot.org'}]);

    expect(wrapper.find(Request).length).toBe(1);
    expect(wrapper.find(Request).find('.tab-info').text()).toBe('An application, self-identifying as ??? is requesting access from http://polkadot.org');

  })
  
  it('render requests', () => {
    const wrapper = mountAuthorize([{id: '1', request: {origin: '???'}, url: 'http://polkadot.org'}]);

    expect(wrapper.find(Request).length).toBe(1);
    expect(wrapper.find(Request).find('.tab-info').text()).toBe('An application, self-identifying as ??? is requesting access from http://polkadot.org');

  })
})
