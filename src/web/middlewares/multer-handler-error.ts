import { NextFunction, Request, Response } from "express";
import fs from "fs/promises";
import { ResponseData } from "../utils/response-data";

export async function handleMulterErrorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err) {
    // Xoá file đơn
    if (req.file?.path) {
      await safeUnlink(req.file.path);
    }

    // Xoá file mảng (array)
    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        await safeUnlink(file.path);
      }
    }

    // Xoá file object theo field (fields)
    if (
      req.files &&
      typeof req.files === "object" &&
      !Array.isArray(req.files)
    ) {
      for (const field in req.files) {
        for (const file of req.files[field]) {
          await safeUnlink(file.path);
        }
      }
    }
    res.status(400).json(ResponseData.fail(err.message || "INVALID_FILE"));
    return;
  }

  next();
}

async function safeUnlink(path: string) {
  try {
    await fs.unlink(path);
  } catch (e) {
    console.error("Failed to delete file:", path, e);
  }
}
