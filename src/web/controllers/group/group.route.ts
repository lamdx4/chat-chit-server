import { Router } from "express";
import GroupController from "./group.controller";
import asyncUtil from "../../utils/async-wrapper";
import authenticateMiddleware from "../../middlewares/authenticate.middleware";
import handleValidationErrors from "../../utils/handle-validation-errors";
import createGroupValidator from "./validators/create-group.validate";
import { handleMulterErrorMiddleware } from "../../middlewares/multer-handler-error";
import multerUploadConfig from "../../configurations/multer-config";
import multer from "multer";

let groupRouter = Router();

const groupController = new GroupController();

groupRouter.post(
  "/create",
  authenticateMiddleware,
  createGroupValidator,
  handleValidationErrors,
  asyncUtil(groupController.createGroup.bind(groupController))
);

groupRouter.post(
  "/:groupId/add-member",
  authenticateMiddleware,
  asyncUtil(groupController.addMemberToGroup.bind(groupController))
);

groupRouter.get(
  "/list",
  authenticateMiddleware,
  asyncUtil(groupController.getMyListGroup.bind(groupController))
);

groupRouter.get(
  "/:groupId/information",
  authenticateMiddleware,
  asyncUtil(groupController.getGroupById.bind(groupController))
);

groupRouter.get(
  "/:groupId/message/list",
  authenticateMiddleware,
  asyncUtil(groupController.getListMessageFromGroup.bind(groupController))
);

groupRouter.post(
  "/:groupId/message/send",
  authenticateMiddleware,
  asyncUtil(groupController.sendMessageToGroup.bind(groupController))
);

groupRouter.post(
  "/:groupId/message/send/files",
  authenticateMiddleware,
  multer({
    ...multerUploadConfig,
    fileFilter: (_req, file, cb) => {
      const allowedMimeTypes = [
        // === HÌNH ẢNH ===
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif", // GIF animations - rất phổ biến chat
        "image/webp", // Format hiện đại, tối ưu
        "image/svg+xml", // Vector graphics
        "image/bmp", // Bitmap images
        "image/tiff", // TIFF images

        // === VIDEO ===
        "video/mp4",
        "video/webm",
        "video/mpeg",
        "video/quicktime", // .mov files
        "video/avi", // AVI format
        "video/x-msvideo", // AVI alternative
        "video/ogg", // Ogg video
        "video/3gpp", // 3GP mobile video

        // === ÂM THANH ===
        "audio/mpeg", // MP3
        "audio/wav",
        "audio/ogg", // Ogg audio
        "audio/aac", // AAC format
        "audio/m4a", // M4A format
        "audio/webm", // WebM audio
        "audio/flac", // Lossless audio

        // === TÀI LIỆU OFFICE ===
        "application/pdf",
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.ms-excel", // .xls
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-powerpoint", // .ppt
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
        "application/rtf", // Rich Text Format

        // === TEXT & CODE ===
        "text/plain", // .txt
        "text/csv", // CSV files
        "application/json", // JSON files
        "application/xml", // XML files
        "text/xml", // XML alternative
        "text/html", // HTML files
        "text/css", // CSS files
        "text/javascript", // JS files
        "application/javascript", // JS alternative
        "text/markdown", // Markdown files

        // === ARCHIVE/NÉN ===
        "application/zip", // ZIP files
        "application/x-rar-compressed", // RAR files
        "application/x-7z-compressed", // 7ZIP files
        "application/gzip", // GZIP files
        "application/x-tar", // TAR files

        // === KHÁC ===
        "application/octet-stream", // Binary files
        "application/vnd.google-earth.kml+xml", // KML files
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("INVALID_FILE_TYPE"));
      }
      cb(null, true);
    },
  }).array("files", 5),
  handleMulterErrorMiddleware,
  asyncUtil(groupController.sendFileToGroup.bind(groupController))
);

groupRouter.get(
  "/:groupId/member/search",
  authenticateMiddleware,
  asyncUtil(groupController.getSearchMemberFromGroup.bind(groupController))
);

groupRouter.post(
  "/:groupId/poll/create",
  authenticateMiddleware,
  asyncUtil(groupController.createPollMessage.bind(groupController))
);
groupRouter.post(
  "/:groupId/poll/:pollId/vote",
  authenticateMiddleware,
  asyncUtil(groupController.createPollMessage.bind(groupController))
);

groupRouter.post(
  "/:groupId/rename",
  authenticateMiddleware,
  asyncUtil(groupController.renameGroup.bind(groupController))
);
groupRouter.post(
  "/:groupId/message/view-new-message",
  authenticateMiddleware,
  asyncUtil(groupController.viewNewMessage.bind(groupController))
);

groupRouter.put(
  "/:groupId/change-avatar",
  authenticateMiddleware,
  multer({
    ...multerUploadConfig,
    fileFilter: (_req, file, cb) => {
      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("INVALID_FILE_TYPE"));
      }
      cb(null, true);
    },
  }).single("avatar"),
  handleMulterErrorMiddleware,
  asyncUtil(groupController.changeGroupAvatar.bind(groupController))
);

groupRouter.post(
  "/:groupId/:messageId/member/vote",
  authenticateMiddleware,
  asyncUtil(groupController.votePollMessage.bind(groupController))
);

groupRouter.post(
  "/:groupId/change-emoji",
  authenticateMiddleware,
  asyncUtil(groupController.changeEmojiGroup.bind(groupController))
);

groupRouter.post(
  "/:groupId/message/:messageId/react",
  authenticateMiddleware,
  asyncUtil(groupController.reactMessage.bind(groupController))
);
export default groupRouter;
