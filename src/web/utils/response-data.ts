export type ErrorResponses = Record<string, string[]>;

/**
 * Base class for all API responses.
 */
export abstract class ResponseBase {
  readonly isSuccess: boolean;
  readonly message: string;
  readonly errors: ErrorResponses;

  protected constructor(
    isSuccess: boolean,
    message: string = "",
    errors: ErrorResponses = {}
  ) {
    this.isSuccess = isSuccess;
    this.message = message;
    this.errors = errors;
  }
}

/**
 * Generic response class for client data responses.
 * Use ResponseData<T>.success(data) and ResponseData<T>.fail(...) for convenience.
 */
export class ResponseData<T = void> extends ResponseBase {
  readonly data?: T;

  private constructor(
    isSuccess: boolean,
    message: string = "",
    errors: ErrorResponses = {},
    data?: T
  ) {
    super(isSuccess, message, errors);
    this.data = data;
  }

  /**
   * Success response with optional data and custom message.
   */
  static success<T = void>(data?: T, message = "Success"): ResponseData<T> {
    return new ResponseData<T>(true, message, {}, data);
  }

  /**
   * Failure response with optional errors and custom message.
   */
  static fail<T = void>(message = "Error", errors: ErrorResponses = {}): ResponseData<T> {
    return new ResponseData<T>(false, message, errors);
  }

  /**
   * Type guard for success with data.
   */
  isOk(): this is { isSuccess: true; data: T } {
    return this.isSuccess;
  }

  /**
   * Type guard for failure.
   */
  isFail(): this is { isSuccess: false; errors: ErrorResponses } {
    return !this.isSuccess;
  }
}