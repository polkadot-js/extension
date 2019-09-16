import React from 'react';
import { MemoryRouter } from 'react-router';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount } from 'enzyme';
import Export from './Export';
configure({ adapter: new Adapter() });

test('Export component', () => {
  mount(<MemoryRouter><Export/></MemoryRouter>);
});
