import Adapter from 'enzyme-adapter-react-16';
import { configure } from 'enzyme';
import extensionizer from 'extensionizer';
import { exportAccount } from './messaging';

configure({ adapter: new Adapter() });

describe('messaging sends message to background via extension port for', () => {
  test('exportAccount', () => {
    const callback = jest.fn();
    extensionizer.runtime.connect().onMessage.addListener(callback);

    exportAccount('HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5', 'passw0rd');

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      message: 'pri(accounts.export)',
      request: { address: 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5', password: 'passw0rd' }
    }));
  });
});
