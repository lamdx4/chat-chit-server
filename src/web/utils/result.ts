import { HttpStatus, HttpStatusCode } from "./http-status-code";

export type Errors = Record<string, string[]>;

export class Result<T = void> {
  readonly isSuccess: boolean;
  readonly code: HttpStatusCode;
  readonly message: string;
  readonly data?: T;
  readonly errors: Errors;

  private constructor(
    isSuccess: boolean,
    code: HttpStatusCode,
    message: string,
    data?: T,
    errors: Errors = {}
  ) {
    this.isSuccess = isSuccess;
    this.code = code;
    this.message = message;
    this.data = data;
    this.errors = errors;
  }

  static success<T = void>(
    code: HttpStatusCode,
    data?: T,
    message = "Success"
  ): Result<T> {
    return new Result<T>(true, code, message, data);
  }

  static Ok<T = void>(data?: T, message = "Success"): Result<T> {
    return new Result<T>(true, 200, message, data);
  }

  static Created<T = void>(data?: T, message = "Created"): Result<T> {
    return new Result<T>(true, HttpStatus.Created, message, data);
  }

  static fail<T = void>(code: HttpStatusCode, message = "Error"): Result<T> {
    return new Result<T>(false, code, message, undefined);
  }

  static conflict<T = void>(
    message = "Conflict",
    errors: Errors = {}
  ): Result<T> {
    return new Result<T>(
      false,
      HttpStatus.Conflict,
      message,
      undefined,
      errors
    );
  }

  static notFound<T = void>(message: string, errors: Errors = {}): Result<T> {
    return new Result<T>(
      false,
      HttpStatus.NotFound,
      message,
      undefined,
      errors
    );
  }

  static badRequest<T = void>(
    message = "Bad Request",
    errors: Errors = {}
  ): Result<T> {
    return new Result<T>(
      false,
      HttpStatus.BadRequest,
      message,
      undefined,
      errors
    );
  }

  static failWithError<T = void>(
    code: HttpStatusCode,
    message: string,
    errors: Errors
  ): Result<T> {
    return new Result<T>(false, code, message, undefined, errors);
  }

  /**
   * Type guard for success
   */
  isSuccessful(): this is { isSuccess: true; data: T } {
    return this.isSuccess;
  }
  /**
   * Type guard for fail
   */
  isFailure(): this is { isSuccess: false; errors?: Errors } {
    return !this.isSuccess;
  }
}
