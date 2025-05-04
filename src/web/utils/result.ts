export type Errors = Record<string, string[]>;

export class Result<T = void> {
  readonly isSuccess: boolean;
  readonly message: string;
  readonly data?: T;
  readonly errors?: Errors;

  private constructor(
    isSuccess: boolean,
    message: string,
    data?: T,
    errors?: Errors
  ) {
    this.isSuccess = isSuccess;
    this.message = message;
    this.data = data;
    this.errors = errors;
  }

  static success<T = void>(data?: T, message = "Success"): Result<T> {
    return new Result<T>(true, message, data);
  }

  static fail<T = void>(message = "Error", errors?: Errors): Result<T> {
    return new Result<T>(false, message, undefined, errors);
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
    return !this.isSuccess ;
  }
}
