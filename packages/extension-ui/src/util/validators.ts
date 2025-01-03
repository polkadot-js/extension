// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

interface InputError {
  errorDescription: string;
}

export type ResultType<T> = { error: InputError } | { ok: T };

export declare type Validator<T> = (value: T) => ResultType<T> | Promise<ResultType<T>>;

export const Result = {
  error: <T>(errorDescription: string): ResultType<T> => ({ error: { errorDescription } }),
  isError<T> (value: ResultType<T>): value is ({ error: InputError }) {
    return Object.hasOwnProperty.call(value, 'error');
  },
  isOk<T> (value: ResultType<T>): value is ({ ok: T }) {
    return Object.hasOwnProperty.call(value, 'ok');
  },
  ok: <T>(ok: T): ResultType<T> => ({ ok })
};

export function allOf <T> (...validators: Validator<T>[]): Validator<T> {
  return async (value: T): Promise<ResultType<T>> => {
    for (const validator of validators) {
      const validationResult = await validator(value);

      if (Result.isError(validationResult)) {
        return validationResult;
      }
    }

    return Result.ok(value);
  };
}

export function isNotShorterThan (minLength: number, errorText: string): Validator<string> {
  return (value: string): ResultType<string> => {
    return value.length < minLength
      ? Result.error(errorText)
      : Result.ok(value);
  };
}

export function isSameAs <T> (expectedValue: T, errorText: string): Validator<T> {
  return (value: T): ResultType<T> => {
    return value !== expectedValue
      ? Result.error(errorText)
      : Result.ok(value);
  };
}
