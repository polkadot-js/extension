// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components';
import { FormInstance, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Input, InputRef } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { ChangeEventHandler, ForwardedRef, forwardRef, useCallback } from 'react';
import styled from 'styled-components';

interface Props extends BasicInputWrapper, ThemeProps {
  prefix: string;
  index: number;
  form: FormInstance<unknown>;
  formName: string;
}

const Component: React.ForwardRefRenderFunction<InputRef, Props> = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { className, form, formName, index, prefix, ...restProps } = props;

  const _onChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    const value = event.target.value;

    // Trim to prevent press 'space' character will reset next value
    const data = value.trim().split(' ');

    const result: Record<string, string> = {};

    const start = index;

    const validates: string[] = [];

    data.forEach((value, index) => {
      const name = prefix + String(start + index);

      result[name] = value;
      validates.push(name);
    });

    form.setFieldsValue(result);

    // Focus
    const focusField = (index: number) => {
      const focusField = prefix + String(index);
      const id = formName + '_' + focusField;

      const element = document.getElementById(id) as HTMLInputElement;

      element?.focus?.();
    };

    if (data.length > 1) {
      focusField(start + data.length - 1);
    } else {
      // Case press space
      if (value.includes(' ')) {
        focusField(start + 1);
      }
    }

    form.validateFields(validates).catch(console.error);
  }, [form, formName, index, prefix]);

  return (
    <Input
      autoComplete='off'
      className={CN(className)}
      {...restProps}
      onChange={_onChange}
    />
  );
};

const SeedPhraseInput = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default SeedPhraseInput;
