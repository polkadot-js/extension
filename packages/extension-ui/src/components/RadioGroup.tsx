// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';

import RadioCard from './RadioCard';

interface Option {
  text: string;
  value: string;
}

interface Props {
  className?: string;
  options: Array<Option>;
  onSelectionChange: (value: string) => void;
  defaultSelectedValue?: string | null;
}

const RadioGroup: React.FC<Props> = ({ className, defaultSelectedValue, onSelectionChange, options }) => {
  const [selectedValue, setSelectedValue] = useState(defaultSelectedValue || '');

  const handleChange = useCallback(
    (value: string) => {
      setSelectedValue(value);
      onSelectionChange(value);
    },
    [onSelectionChange]
  );

  return (
    <div className={className}>
      {options.map((option, index) => (
        <div key={option.value}>
          <RadioCard
            onChange={handleChange}
            option={option}
            position={index === 0 ? 'top' : index === options.length - 1 ? 'bottom' : 'middle'}
            selectedValue={selectedValue}
          />
        </div>
      ))}
    </div>
  );
};

export default RadioGroup;
