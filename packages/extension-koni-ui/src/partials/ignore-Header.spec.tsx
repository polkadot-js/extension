// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@subwallet/extension-mocks/chrome';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';

import { themes } from '../components';
import Header from './Header';
import Settings from './MenuSettings';

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

  it('gear icon is not highlighted when settings are hidden', () => {
    wrapper = mountHeader({ showSettings: true });

    expect(wrapper.find(Settings).length).toBe(0);
    expect(wrapper.find('.cogIcon').first().hasClass('selected')).toBe(false);
  });

  it('highlights gear icon when settings are toggled', () => {
    wrapper = mountHeader({ showSettings: true });

    wrapper.find('div[data-toggle-settings]').simulate('click');

    expect(wrapper.find(Settings).length).toBe(1);
    expect(wrapper.find('.cogIcon').first().hasClass('selected')).toBe(true);
  });
});
