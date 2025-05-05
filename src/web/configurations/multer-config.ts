import multer from "multer";
import { v6 as uuidv6 } from "uuid";
import path from "path";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Đường dẫn thư mục lưu trữ file
    // Bạn có thể thay đổi đường dẫn này theo nhu cầu của bạn
    // Ví dụ: cb(null, path.join(__dirname, "../uploads"));
    const uploadDir = path.join(__dirname, "../../../uploads");
    cb(null, uploadDir);
  },
  filename: function (_, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = uuidv6() + ext;
    cb(null, uniqueName);
  },
});

const multerUploadConfig = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE, // Giới hạn kích thước
  },
});

export default multerUploadConfig;
