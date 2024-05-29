// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from '@subwallet/extension-web-ui/components';
import { FormInstance, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Input, InputRef } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { ChangeEventHandler, ClipboardEventHandler, FocusEventHandler, ForwardedRef, forwardRef, useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props extends BasicInputWrapper, ThemeProps {
  prefix: string;
  index: number;
  form: FormInstance<unknown>;
  formName: string;
  hideText: boolean;
}

const Component: React.ForwardRefRenderFunction<InputRef, Props> = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { className, form, formName, hideText, index, onBlur, onFocus, prefix, ...restProps } = props;
  const [focus, setFocus] = useState(false);

  const _onChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    const value = event.target.value;

    // Trim to prevent press 'space' character will reset next value
    const data = value.trim().split(' ');

    const result: Record<string, string> = {};

    const start = data.length > 1 ? 0 : index;

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
      // Not focus
    } else {
      // Case press space
      if (value.includes(' ')) {
        focusField(start + 1);
      }
    }

    form.validateFields(validates).catch(console.error);
  }, [form, formName, index, prefix]);

  const onPaste: ClipboardEventHandler<HTMLInputElement> = useCallback((event) => {
    const value = event.clipboardData.getData('text');

    // Trim to prevent press 'space' character will reset next value
    const data = value.trim().split(' ');

    if (data.length > 1) {
      event.preventDefault();
    } else {
      return;
    }

    const result: Record<string, string> = {};

    const start = 0;

    const validates: string[] = [];

    data.forEach((value, index) => {
      const name = prefix + String(start + index);

      result[name] = value;
      validates.push(name);
    });

    form.setFieldsValue(result);

    form.validateFields(validates).catch(console.error);
  }, [form, prefix]);

  const _onFocus: FocusEventHandler<HTMLInputElement> = useCallback((event) => {
    setFocus(true);
    onFocus?.(event);
  }, [onFocus]);

  const _onBlur: FocusEventHandler<HTMLInputElement> = useCallback((event) => {
    setFocus(false);
    onBlur?.(event);
  }, [onBlur]);

  return (
    <Input
      autoComplete='off'
      className={CN(className)}
      ref={ref}
      type={(hideText && !focus) ? 'password' : 'text'}
      {...restProps}
      onBlur={_onBlur}
      onChange={_onChange}
      onFocus={_onFocus}
      onPaste={onPaste}
      prefix={<span className='prefix'>{String(index + 1).padStart(2, '0')}</span>}
    />
  );
};

const SeedPhraseInput = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '&.ant-input-container': {
      backgroundColor: token.colorBgInput
    },

    '.prefix': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      width: token.sizeMD - 2
    },

    '.ant-input-prefix': {
      paddingRight: 2
    },

    '.ant-input': {
      paddingTop: token.paddingXS + 2,
      paddingBottom: token.paddingXS + 2,
      height: token.controlHeightLG,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    },

    '.ant-input-suffix': {
      height: token.controlHeightLG
    },

    '.ant-input-status-icon': {
      display: 'none'
    }
  };
});

export default SeedPhraseInput;
