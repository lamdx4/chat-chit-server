import fs from "fs";
import path from "path";

export default function removeUploadFile(fileName: string) {
  const filePath = path.join(path.join(__dirname, "../../../uploads/", fileName));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
