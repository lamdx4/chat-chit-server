import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationError } from "express-validator";
import { ErrorResponses, ResponseData } from "./response-data";

const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const formattedErrors: ErrorResponses = {};

  const addError = (field: string, msg: string) => {
    if (!formattedErrors[field]) {
      formattedErrors[field] = [];
    }
    formattedErrors[field].push(msg);
  };

  for (const error of result.array({ onlyFirstError: false })) {
    switch (error.type) {
      case "field": {
        addError(error.path, error.msg);
        break;
      }
      case "alternative": {
        addError("general", error.msg);
        for (const nested of error.nestedErrors) {
          addError(nested.path, nested.msg);
        }
        break;
      }
      case "alternative_grouped": {
        addError("general", error.msg);
        for (const group of error.nestedErrors) {
          for (const nested of group) {
            addError(nested.path, nested.msg);
          }
        }
        break;
      }
      case "unknown_fields": {
        addError("general", error.msg);
        for (const field of error.fields) {
          addError(field.path, `Unknown field: ${field.path}`);
        }
        break;
      }
      default: {
        addError("general", "Unknown validation error");
      }
    }
  }

  res
    .status(400)
    .json(ResponseData.fail("VALIDATE_ERROR", formattedErrors));
};

export default handleValidationErrors;
