// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Form, Input } from '@subwallet/react-ui';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  fields: string[];
}

const Component: React.FC<Props> = (props: Props) => {
  const { fields } = props;

  return (
    <>
      {fields.map((key) => (
        <Form.Item
          hidden={true}
          key={key}
          name={key}
        >
          <Input />
        </Form.Item>
      ))}
    </>
  );
};

const HiddenInput = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default HiddenInput;
