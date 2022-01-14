// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

interface InputError {
  errorDescription: string;
}

export type Result<T> = { error: InputError } | { ok: T };

export const Result = {
  error: <T>(errorDescription: string): Result<T> => ({ error: { errorDescription } }),
  isError<T> (value: Result<T>): value is ({ error: InputError }) {
    return Object.hasOwnProperty.call(value, 'error');
  },
  isOk<T> (value: Result<T>): value is ({ ok: T }) {
    return Object.hasOwnProperty.call(value, 'ok');
  },
  ok: <T>(ok: T): Result<T> => ({ ok })
};

export declare type Validator<T> = (value: T) => Result<T> | Promise<Result<T>>;

export function allOf <T> (...validators: Validator<T>[]): Validator<T> {
  return async (value: T): Promise<Result<T>> => {
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
  return (value: string): Result<string> => {
    return value.length < minLength
      ? Result.error(errorText)
      : Result.ok(value);
  };
}

export function isSameAs <T> (expectedValue: T, errorText: string): Validator<T> {
  return (value: T): Result<T> => {
    return value !== expectedValue
      ? Result.error(errorText)
      : Result.ok(value);
  };
}
