// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';

import { themes } from '../components';
import Header from './Header';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

describe('Header component', () => {
  let wrapper: ReactWrapper;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const mountHeader = (props: React.ComponentProps<typeof Header> = {}): ReactWrapper => mount(
    <MemoryRouter>
      <ThemeProvider theme={themes.dark}>
        <Header {...props}>
        </Header>
      </ThemeProvider>
    </MemoryRouter>);



  it('settings icon exists when showSettings prop is true', () => {
    wrapper = mountHeader({ showSettings: true });
    wrapper.find('img[data-toggle-settings]').simulate('click');

    expect(wrapper.exists()).toBe(true);
  });
});
