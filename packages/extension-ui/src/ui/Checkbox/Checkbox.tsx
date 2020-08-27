import React, { FC, InputHTMLAttributes } from 'react';
import { InlineFlex } from '../InlineFlex';
import { SvgCheckmark, SvgMinusBox } from '../../assets/images/icons';
import * as typeHelpers from '../../typings/helpers';
import * as sc from './styles';
import { Label } from './Label';

export interface Props
  extends typeHelpers.Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (e: boolean) => void;
  /**
   * Specify whether the toggle should be on by default
   */
  defaultChecked?: boolean;
  /**
   * Specify whether the control is checked
   */
  checked?: boolean;
  name?: React.AllHTMLAttributes<HTMLInputElement>['name'];
  label?: React.ComponentType | string;
  indeterminate?: boolean;
}

export const Checkbox: FC<Props> = ({
  name,
  defaultChecked,
  checked,
  onChange,
  label,
  indeterminate,
  ...other
}) => {
  let checkedProps;

  if (typeof checked !== 'undefined') {
    checkedProps = { checked };
  } else {
    checkedProps = { defaultChecked };
  }

  const handleChange = (e: any) => {
    if (onChange) {
      onChange(e.currentTarget.checked);
    }
  };

  return (
    <label>
      <InlineFlex>
        <sc.Input
          {...other}
          {...checkedProps}
          type="checkbox"
          id={name}
          name={name}
          onChange={handleChange}
        />
        <sc.CheckboxInput
          {...(indeterminate ? { className: 'indeterminate' } : {})}
        >
          <sc.CheckStateIcon
            Asset={SvgMinusBox}
            color="brandMain"
            width="1.3em"
            height="1.3em"
            className="minusIcon"
          />
          <sc.CheckStateIcon
            Asset={SvgCheckmark}
            color="white"
            width="0.9em"
            height="0.9em"
            className="checkIcon"
          />
        </sc.CheckboxInput>
        {label && (
          <InlineFlex ml={2}>
            <Label htmlFor={name}>{label}</Label>
          </InlineFlex>
        )}
      </InlineFlex>
    </label>
  );
};
