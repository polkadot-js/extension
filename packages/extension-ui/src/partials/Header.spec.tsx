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
  const mountHeader = (props: React.ComponentProps<typeof Header> = {}): ReactWrapper =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    mount(
      <MemoryRouter>
        <ThemeProvider theme={themes.dark}>
          <Header {...props}></Header>
        </ThemeProvider>
      </MemoryRouter>
    );

  it('settings icon exists when withSettings prop is true', () => {
    wrapper = mountHeader({ withSettings: true });
    wrapper.find('Svg[data-toggle-settings]').first().simulate('click');

    expect(wrapper.exists()).toBe(true);
  });
});
