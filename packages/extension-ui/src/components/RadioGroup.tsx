import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import RadioCard from './RadioCard';

interface Option {
  text: string;
  value: string;
}

interface OptionsReduce {
  alephOptions: Option[];
  otherOptions: Option[];
}

interface Props {
  className?: string;
  options: Array<Option>;
  onSelectionChange: (value: string) => void;
  defaultSelectedValue?: string | null;
  withTestNetwork?: boolean;
}

const RadioGroup: React.FC<Props> = ({
  className,
  defaultSelectedValue,
  onSelectionChange,
  options,
  withTestNetwork = false
}) => {
  const [selectedValue, setSelectedValue] = useState(defaultSelectedValue || '');

  const handleChange = useCallback(
    (value: string) => {
      setSelectedValue(value);
      onSelectionChange(value);
    },
    [onSelectionChange]
  );

  const { alephOptions, otherOptions } = options.reduce<OptionsReduce>(
    (acc, option) => {
      const isAleph = withTestNetwork ? option.text.includes('Aleph Zero') : option.text === 'Aleph Zero';

      if (isAleph) {
        return {
          ...acc,
          alephOptions: [...acc.alephOptions, option]
        };
      }

      if (withTestNetwork || !option.text.includes('Aleph Zero')) {
        return {
          ...acc,
          otherOptions: [...acc.otherOptions, option]
        };
      }

      return acc;
    },
    { alephOptions: [], otherOptions: [] }
  );

  return (
    <div className={className}>
      <div className='aleph-options'>
        {alephOptions.map((option) => (
          <div key={option.value}>
            <RadioCard
              onChange={handleChange}
              option={option}
              selectedValue={selectedValue}
            />
          </div>
        ))}
      </div>
      <div className='other-options'>
        {otherOptions.map((option) => (
          <div key={option.value}>
            <RadioCard
              onChange={handleChange}
              option={option}
              selectedValue={selectedValue}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default styled(RadioGroup)`
  .aleph-options {
    margin-bottom: 16px;
  }

  .aleph-options, .other-options {
    & > div:first-child {
      ${RadioCard}{
        border-radius: 8px 8px 2px 2px;
      }
    }

    & > div:last-child {
      ${RadioCard}{
        border-radius: 2px 2px 8px 8px;
      }
    }

    & > div:only-child {
      ${RadioCard}{
        border-radius: 8px;
      }
    }
  }
`;
