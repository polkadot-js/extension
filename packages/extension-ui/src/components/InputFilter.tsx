// Copyright 2017-2020 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import styled from 'styled-components';

import { Input } from './TextInputs';

interface Props {
  className?: string;
  onChange: (filter: string) => void;
  placeholder: string;
  value: string;
}

function InputFilter ({ className, onChange, placeholder, value } : Props) {
  const onChangeFilter = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  }, [onChange]);

  return (
    <div className={className}>
      <Input
        autoCapitalize='off'
        autoCorrect='off'
        autoFocus
        onChange={onChangeFilter}
        placeholder={placeholder}
        spellCheck={false}
        type='text'
        value={value}
      />
    </div>
  );
}

export default styled(InputFilter)`
  padding-left: 1rem !important;
  padding-right: 1rem !important;
`;
