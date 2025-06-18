import { NextFunction, Request, Response } from "express";

export default function multerUploadMessage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.file && !req.files) {
    res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
    return;
  }

  // If single file upload
  if (req.file) {
    req.body.file = req.file;
  }

  // If multiple files upload
  if (Array.isArray(req.files)) {
    req.body.files = req.files;
  }

  // If fields upload
  if (typeof req.files === "object" && !Array.isArray(req.files)) {
    req.body.fields = req.files;
  }

  next();
}
