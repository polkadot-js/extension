import React from 'react';
import { MemoryRouter, Route } from 'react-router';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount, ReactWrapper } from 'enzyme';
import { exportAccount } from '../messaging';
import Export from './Export';
import { act } from 'react-dom/test-utils';
import { Button } from '../components';

configure({ adapter: new Adapter() });
jest.mock('../messaging');
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const flushAllPromises = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

describe('Export component', () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    (exportAccount as jest.Mock).mockResolvedValue({ exportedJson: 'json repr' });

    wrapper = mount(<MemoryRouter
      initialEntries={ ['/account/export/HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5'] }>
      <Route path='/account/export/:address' component={ Export }/>
    </MemoryRouter>);
  });

  it('creates export message on button press', async () => {
    wrapper.find('[data-export-password] input').simulate('change', { target: { value: 'passw0rd' } });
    wrapper.find('[data-export-button] button').simulate('click');
    await act(flushAllPromises);

    expect(exportAccount).toHaveBeenCalledWith('HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5', 'passw0rd');
  });

  it('button is disabled before any password is typed', () => {
    expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
  });

  it('button is enabled after password is typed', async () => {
    wrapper.find('[data-export-password] input').simulate('change', { target: { value: 'passw0rd' } });
    await act(flushAllPromises);

    expect(wrapper.find(Button).prop('isDisabled')).toBe(false);
  });

  it('does not show textarea before entering the password', () => {
    expect(wrapper.find('[data-exported-account] textarea').exists()).toBe(false);
  });

  it('input field and button are removed after entering the password', async () => {
    wrapper.find('[data-export-password] input').simulate('change', { target: { value: 'passw0rd' } });
    wrapper.find('[data-export-button] button').simulate('click');
    await act(flushAllPromises);
    wrapper.update();

    expect(wrapper.find('[data-export-password] input').exists()).toBe(false);
    expect(wrapper.find('[data-export-button] button').exists()).toBe(false);
  });

  it('textarea is displayed after entering the password', async () => {
    wrapper.find('[data-export-password] input').simulate('change', { target: { value: 'passw0rd' } });
    wrapper.find('[data-export-button] button').simulate('click');
    await act(flushAllPromises);
    wrapper.update();

    expect(wrapper.find('[data-exported-account] textarea').exists()).toBe(true);
  });

  it('shows text area with export json', async () => {
    wrapper.find('[data-export-password] input').simulate('change', { target: { value: 'passw0rd' } });
    wrapper.find('[data-export-button] button').simulate('click');
    await act(flushAllPromises);
    wrapper.update();

    expect(wrapper.find('[data-exported-account] textarea').text()).toContain('json repr');
  });
});
