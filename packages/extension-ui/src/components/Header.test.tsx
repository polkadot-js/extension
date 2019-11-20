// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import Adapter from 'enzyme-adapter-react-16';
import {configure, mount, ReactWrapper} from 'enzyme';
import {defaultTheme, Header} from '@polkadot/extension-ui/components';
import {MemoryRouter} from 'react-router';
import React from 'react';

import {ThemeProvider} from 'styled-components';

configure({adapter: new Adapter()});

describe('Header component', () => {
  let wrapper: ReactWrapper;
  const mountHeader = (props:React.ComponentProps<typeof Header>={}): ReactWrapper => mount(
    <MemoryRouter>
      <ThemeProvider theme={defaultTheme}>
        <Header {...props}>
        </Header>
      </ThemeProvider>
    </MemoryRouter>);

  it('shows gear icon', () => {
    wrapper = mountHeader({showSettings: true});

    expect(wrapper.find('Gear').length).toBe(1);
    expect(wrapper.find('ActiveGear').length).toBe(0);
  });
  it('shows gear icon', () => {
    wrapper = mountHeader({showSettings: true});

    wrapper.find('Settings').simulate('click');

    expect(wrapper.find('ActiveGear').length).toBe(1);
    expect(wrapper.find('Gear').length).toBe(0);
  });
});
