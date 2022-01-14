// Copyright 2017-2022 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';
import { Input } from './TextInputs';

interface Props extends ThemeProps {
  className?: string;
  onChange: (filter: string) => void;
  placeholder: string;
  value: string;
  withReset?: boolean;
}

function InputFilter ({ className, onChange, placeholder, value, withReset = false }: Props) {
  const inputRef: React.RefObject<HTMLInputElement> | null = useRef(null);

  const onChangeFilter = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  }, [onChange]);

  const onResetFilter = useCallback(() => {
    onChange('');
    inputRef.current && inputRef.current.select();
  }, [onChange]);

  return (
    <div className={className}>
      <Input
        autoCapitalize='off'
        autoCorrect='off'
        autoFocus
        onChange={onChangeFilter}
        placeholder={placeholder}
        ref={inputRef}
        spellCheck={false}
        type='text'
        value={value}
      />
      {withReset && !!value && (
        <FontAwesomeIcon
          className='resetIcon'
          icon={faTimes}
          onClick={onResetFilter}
        />
      )}
    </div>
  );
}

export default styled(InputFilter)(({ theme }: Props) => `
  padding-left: 1rem !important;
  padding-right: 1rem !important;
  position: relative;

  .resetIcon {
    position: absolute;
    right: 28px;
    top: 12px;
    color: ${theme.iconNeutralColor};
    cursor: pointer;
  }
`);
