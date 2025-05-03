import multer from "multer";
import { v6 as uuidv6 } from "uuid";
import path from "path";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/files");
  },
  filename: function (_, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = file.fieldname + "-" + uuidv6() + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE, // Giới hạn kích thước
  },
});

export default upload;
