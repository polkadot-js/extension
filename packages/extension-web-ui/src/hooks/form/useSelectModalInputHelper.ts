// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from '@subwallet/extension-web-ui/components/Field/Base';
import { InputRef, ModalContext, SelectModalProps } from '@subwallet/react-ui';
import { InputFocusOptions } from 'rc-input/es/utils/commonUtils';
import { ForwardedRef, useCallback, useContext, useEffect, useState } from 'react';

export function useSelectModalInputHelper ({ id, onBlur, onChange, onFocus }: BasicInputWrapper, ref: ForwardedRef<InputRef>): Pick<SelectModalProps<any>, 'onSelect'> {
  const modalContext = useContext(ModalContext);
  const modalId = id || '';
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    typeof ref === 'function' && ref({
      focus: (options?: InputFocusOptions) => {
        modalContext.activeModal(modalId);
      },
      blur: () => {
        modalContext.inactiveModal(modalId);
      },
      setSelectionRange: (start: number, end: number, direction?: 'forward' | 'backward' | 'none') => {
        console.log('This action is not supported');
      },
      select: () => {
        modalContext.activeModal(modalId);
      },
      input: null
    });
  }, [id, modalContext, modalId, ref]);

  useEffect(() => {
    const open = modalContext.checkActive(modalId);

    setIsOpen((isO) => {
      if (isO !== open) {
        if (open) {
        // @ts-ignore
          onFocus && onFocus({});
        } else {
          // @ts-ignore
          onBlur && onBlur({});
        }
      }

      return open;
    });
  }, [isOpen, modalContext, modalId, onBlur, onFocus]);

  const onSelect = useCallback((val: string) => {
    onChange && onChange({ target: { value: val } });
  }, [onChange]);

  return {
    onSelect
  };
}
