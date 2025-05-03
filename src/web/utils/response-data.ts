export type ErrorResponses = Record<string, string[]>;

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

export class ResponseData extends ResponseBase {
  readonly data: object;

  protected constructor(
    isSuccess: boolean,
    message: string = "",
    errors: ErrorResponses = {},
    data: object = {}
  ) {
    super(isSuccess, message, errors);
    this.data = data;
  }

  static success(message: string = "Success"): ResponseData {
    return new ResponseData(true, message, {}, {});
  }

  static fail(
    message: string = "Error",
    errors: ErrorResponses = {}
  ): ResponseData {
    return new ResponseData(false, message, errors, {});
  }
}

export class ResponseDataGeneric<T extends object> extends ResponseBase {
  readonly data: T;

  protected constructor(
    isSuccess: boolean,
    message: string = "",
    data: T,
    errors: ErrorResponses = {}
  ) {
    super(isSuccess, message, errors);
    this.data = data;
  }

  static success<T extends object>(
    data: T,
    message: string = "Success"
  ): ResponseDataGeneric<T> {
    return new ResponseDataGeneric<T>(true, message, data, {});
  }

  static fail<T extends object>(
    message: string = "Error",
    errors: ErrorResponses = {}
  ): ResponseDataGeneric<T> {
    return new ResponseDataGeneric<T>(false, message, {} as T, errors);
  }
}
