import { err, ok, type Result, type ResultAsync } from "neverthrow";

import type { AppError } from "./errors";
import { PersistenceError } from "./errors";

export type AppResult<Value> = Result<Value, AppError>;
export type AppResultAsync<Value> = ResultAsync<Value, AppError>;

export const okApp = <Value>(value: Value): AppResult<Value> => ok(value);
export const errApp = (error: AppError): AppResult<never> => err(error);

export const fromUnknownPersistenceError = (
  cause: unknown,
  message = "A local persistence operation failed."
): PersistenceError => new PersistenceError(message, { cause });

export const unwrapQueryResult = <Value>(result: AppResult<Value>): Value => {
  if (result.isOk()) {
    return result.value;
  }

  throw result.error;
};

export const unwrapQueryResultAsync = async <Value>(
  result: AppResultAsync<Value>
): Promise<Value> => unwrapQueryResult(await result);
