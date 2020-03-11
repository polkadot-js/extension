import React from 'react';
import Adapter from 'enzyme-adapter-react-16';

import { configure, mount, ReactWrapper } from 'enzyme';
import {
  ActionContext,
  themes,
  InputWithLabel,
  Input,
  Button
} from '@polkadot/extension-ui/components';
import { ThemeProvider } from 'styled-components';
import Import from './ImportSeed';
import { flushAllPromises } from '../testHelpers';
import { act } from 'react-dom/test-utils';
import { BrowserRouter } from 'react-router-dom';
import DerivationPath, { OptionsLabel } from '@polkadot/extension-ui/partials/DerivationPath';
import * as messaging from '@polkadot/extension-ui/messaging';

configure({ adapter: new Adapter() });
// JSDOM is missing scrollTo methods on elements
Object.defineProperty(window.Element.prototype, 'scrollTo', {
  writable: true,
  value: jest.fn()
});
const exampleAccount = {
  seed: 'horse battery staple correct',
  address: 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5'
};

describe('Import Account', () => {
  let wrapper: ReactWrapper;
  let onActionStub: jest.Mock;
  const mountComponent = (): ReactWrapper => mount(
    <BrowserRouter>
      <ActionContext.Provider value={onActionStub}>
        <ThemeProvider theme={themes.dark}>
          <Import />
        </ThemeProvider>
      </ActionContext.Provider>
    </BrowserRouter>
  );

  beforeEach(async () => {
    onActionStub = jest.fn();
    jest.spyOn(messaging, 'createSeed').mockResolvedValue(exampleAccount);
    jest.spyOn(messaging, 'createAccountSuri').mockResolvedValue(true);
    jest.spyOn(messaging, 'validateSeed').mockResolvedValue({ address: exampleAccount.address, suri: '' });
    wrapper = mountComponent();
    await act(flushAllPromises);
  });
  const mnemonic = 'project winter lamp connect indoor chalk maximum rude lonely vote clutch autumn';
  const type = (input: ReactWrapper, value: string): unknown => input.simulate('change', { target: { value } });

  type AndPassword = {
    andPassword: (password: string) => AndRepeatedPassword;
  };

  type AndRepeatedPassword = {
    andRepeatedPassword: (repeatedPassword: string) => void;
  };

  type AndName = {
    andName: (password: string) => AndPassword;
  }

  const enterMnemonic = async (mnemomic: string): Promise<AndName> => {
    type(wrapper.find('textarea'), mnemomic);
    await act(flushAllPromises);
    wrapper.update();
    return {
      andName: (name: string): AndPassword => {
        type(wrapper.find('input'), name);
        return {
          andPassword: (password: string): AndRepeatedPassword => {
            type(wrapper.find('input[type="password"]').first(), password);
            return {
              andRepeatedPassword: (repeatedPassword: string): void => {
                type(wrapper.find('input[type="password"]').last(), repeatedPassword);
              }
            };
          }
        };
      }
    };
  };

  it('allows to import account when all fields are filled', async () => {
    const nextInput = await enterMnemonic(mnemonic);
    nextInput.andName('abc')
      .andPassword('asdasd')
      .andRepeatedPassword('asdasd');

    expect(wrapper.find('textarea').first().props().value).toEqual(mnemonic);
    expect(wrapper.find(InputWithLabel).find('input')).toHaveLength(3);
    await act(flushAllPromises);
    wrapper.update();
    wrapper.find(Button).simulate('click');
    expect(messaging.createAccountSuri).toBeCalledWith('abc', 'asdasd', 'project winter lamp connect indoor chalk maximum rude lonely vote clutch autumn', undefined);
  });

  it('typing mnemonic and name account don\'t show button to import account and repeat password input', async () => {
    const nextInput = await enterMnemonic(mnemonic);
    nextInput.andName('abc');

    expect(wrapper.find(InputWithLabel).find('input')).toHaveLength(2);
    expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input)).toHaveLength(1);
    expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]').find(Input)).toHaveLength(0);
    await act(flushAllPromises);
    wrapper.update();
    expect(wrapper.find(Button)).toHaveLength(0);
  });

  it('after pass all data to inputs show advance section', async () => {
    const nextInput = await enterMnemonic(mnemonic);
    nextInput.andName('abc')
      .andPassword('asdasd')
      .andRepeatedPassword('asdasd');

    expect(wrapper.find('textarea').first().props().value).toEqual(mnemonic);
    expect(wrapper.find(InputWithLabel).find('input')).toHaveLength(3);
    expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input)).toHaveLength(1);
    expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]').find(Input)).toHaveLength(1);
    await act(flushAllPromises);
    wrapper.update();
    expect(wrapper.find(DerivationPath).find(OptionsLabel)).toHaveLength(1);
    expect(wrapper.find(Button)).toHaveLength(1);
  });
});
