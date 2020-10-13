// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { isXmlOrPdf } from './';

describe.only('File extension util function', () => {
  it('returns true for a xml file', () => {
    const res = isXmlOrPdf('/some.xml');

    expect(res).toBe(true);
  });

  it('returns true for a pdf file', () => {
    const res = isXmlOrPdf('/some.pdf');

    expect(res).toBe(true);
  });

  it('returns false for any other path', () => {
    expect(isXmlOrPdf('/some-pdf')).toBe(false);
    expect(isXmlOrPdf('/some-xml')).toBe(false);
  });
});
