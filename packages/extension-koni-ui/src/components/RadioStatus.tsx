import type { ThemeProps } from '../types';

import React  from 'react';
import styled from 'styled-components';

interface Props {
  checked: boolean;
  className?: string;
}

function RadioStatus ({ checked, className }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <div className='radio-status'>
        {checked && (
          <div className='radio-status__dot'/>
        )}
      </div>
    </div>
  );
}

export default styled(RadioStatus)(({ theme }: ThemeProps) => `
  .radio-status {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid ${theme.checkboxBorderColor};
    background-color: ${theme.checkboxColor};
    display: flex;
    justify-content: center;
    align-items: center;

    &__dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: ${theme.checkDotColor};
    }
  }
`);
