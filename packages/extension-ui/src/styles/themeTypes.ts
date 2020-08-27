import { ThemedStyledProps, CSSObject } from 'styled-components';
import { Theme } from '../types';

export { StyledProps } from 'styled-components';

export type Style<P = {}> = (
  props: ThemedStyledProps<P, Theme>
) => string | number;

export type Styles<P = {}> = (
  props: ThemedStyledProps<P, Theme>
) => CSSObject;

export interface Scale<TValue> {
  [id: string]: TValue;
}

export interface Breakpoints<T> {
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}

export type ResponsiveValue<T> = T | Array<T | null> | Breakpoints<T>;

export type ScaleProps = { scale?: number };
