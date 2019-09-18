import React from 'react';
import { MemoryRouter, Route } from 'react-router';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount } from 'enzyme';
import Export from './Export';
import extensionizer from 'extensionizer';

configure({ adapter: new Adapter() });

test('Export component', () => {
  const callback = jest.fn();
  extensionizer.runtime.connect().onMessage.addListener(callback);
  const wrapper = mount(<MemoryRouter
    initialEntries={ ['/account/export/HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5'] }>
    <Route path='/account/export/:address' component={ Export }/>
  </MemoryRouter>);
  const reactWrapper = wrapper.find('button');
  reactWrapper.simulate('click');
  expect(callback).toHaveBeenCalledWith(expect.objectContaining({
    message: 'pri(accounts.export)',
    request: { address: 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5' }
  }));
});
