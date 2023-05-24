
import { withThemeFromJSXProvider } from '@storybook/addon-styling';
import { ThemeProvider } from 'styled-components';
import { themes } from '../packages/extension-ui/src/components/themes'
import { BodyTheme } from '../packages/extension-ui/src/components/View'

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
            height: "625px",
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

export const decorators = [
  withThemeFromJSXProvider({
    GlobalStyles: BodyTheme,
    Provider: ThemeProvider,
    themes: {
      dark: themes.dark
    },
    defaultTheme: 'dark'
  }),
];
