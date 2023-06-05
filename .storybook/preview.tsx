import React from 'react';

import { withThemeFromJSXProvider } from '@storybook/addon-styling';
import { ThemeProvider } from 'styled-components';
import { themes } from '../packages/extension-ui/src/components/themes'
import { BodyTheme } from '../packages/extension-ui/src/components/View'

import type { Preview } from '@storybook/react';
import { subscribeAccounts, subscribeAuthorizeRequests, subscribeMetadataRequests, subscribeSigningRequests } from './__mocks__/messaging';

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/,
      },
    },
    layout: 'centered',
    viewport: {
      defaultViewport: "popup",
      viewports: {
        popup: {
          name: "popup",
          type: "mobile",
          styles: {
            width: "360px",
            height: "600px",
          }
        },
        fullWidth: {
          name: "full width",
          type: "desktop",
        },
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        {
          name: "dark",
          value: themes.dark.background,
        },
        {
          name: 'light',
          value: themes.light.background,
        }
      ]
    }
  },
};

export default preview;

type Mock = {
  setMockImpl(nextMockImpl: Function): void;
};

export const decorators = [
  withThemeFromJSXProvider({
    GlobalStyles: BodyTheme,
    Provider: ThemeProvider,
    themes: {
      dark: themes.dark
    },
    defaultTheme: 'dark'
  }),
  (Story) => {
    window.localStorage.clear();
    window.localStorage.setItem('welcome_read', 'ok');

    return <Story />;
  },
  (Story) => {
    subscribeAccounts.setMockImpl((cb: Function) => cb([]));
    subscribeAuthorizeRequests.setMockImpl((cb: Function) => cb([]));
    subscribeMetadataRequests.setMockImpl((cb: Function) => cb([]));
    subscribeSigningRequests.setMockImpl((cb: Function) => cb([]));

    return <Story />;
  },
] satisfies Preview['decorators'];

window.chrome = {
  runtime: {
    connect() {
      return {
        onMessage: {
          addListener() {}
        },
        postMessage() {}
      };
    }
  },
} as unknown as typeof window.chrome;
