import { query } from "express-validator"

const searchUserValidator = [
    query("phone").optional().isString().withMessage("Phone must be a string"),
    query("userName").optional().isEmail().withMessage("Email must be a valid email"),
]
export default searchUserValidator