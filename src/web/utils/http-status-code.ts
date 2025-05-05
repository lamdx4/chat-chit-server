/**
 * HTTP status codes and their descriptions.
 */
export const HttpStatus = {
  // 1xx Informational
  Continue: 100, // Được sử dụng để thông báo rằng server đã nhận được phần đầu của yêu cầu và đang chờ nhận các phần tiếp theo.
  SwitchingProtocols: 101, // Được sử dụng để thông báo rằng server đồng ý chuyển đổi giao thức được yêu cầu trong yêu cầu "Upgrade" của client.
  Processing: 102, // Được sử dụng để thông báo rằng server đang xử lý yêu cầu nhưng chưa hoàn thành.
  EarlyHints: 103, // Được sử dụng để thông báo rằng server đã bắt đầu gửi phần trước của phản hồi và client nên chờ đợi để tiếp tục nhận phần còn lại.

  // 2xx Success
  Ok: 200, // Yêu cầu đã được xử lý thành công.
  Created: 201, // Yêu cầu đã được xử lý thành công và đã tạo mới tài nguyên.
  Accepted: 202, // Yêu cầu đã được chấp nhận để xử lý, nhưng xử lý thực tế có thể diễn ra ở tương lai.
  NonAuthoritativeInformation: 203, // Yêu cầu đã được xử lý thành công, nhưng thông tin trả về có thể không phải là thông tin chính thức từ nguồn tài nguyên.
  NoContent: 204, // Yêu cầu đã được xử lý thành công, nhưng không có nội dung trả về.
  ResetContent: 205, // Yêu cầu đã được xử lý thành công, và client nên làm mới (refresh) trang hiện tại.
  PartialContent: 206, // Yêu cầu được chỉ định một phần của tài nguyên đã được gửi thành công.

  // 3xx Redirection
  Ambiguous: 300, // Yêu cầu có nhiều lựa chọn và server không thể tự động chọn một lựa chọn duy nhất.
  MovedPermanently: 301, // Tài nguyên đã được chuyển hướng vĩnh viễn sang một địa chỉ mới.
  Found: 302, // Tài nguyên đã được chuyển hướng tạm thời sang một địa chỉ mới.
  SeeOther: 303, // Client nên thực hiện yêu cầu mới đến địa chỉ đã được cung cấp.
  NotModified: 304, // Tài nguyên không thay đổi từ lần truy cập trước đó.
  TemporaryRedirect: 307, // Yêu cầu sẽ được chuyển hướng tạm thời sang một địa chỉ mới.
  PermanentRedirect: 308, // Yêu cầu sẽ được chuyển hướng vĩnh viễn sang một địa chỉ mới.

  // 4xx Client Error
  BadRequest: 400, // Yêu cầu của client không hợp lệ.
  Unauthorized: 401, // Client cần xác thực (authenticate) để truy cập tài nguyên.
  PaymentRequired: 402, // Đã được dành cho việc sử dụng trong tương lai.
  Forbidden: 403, // Client không có quyền truy cập tài nguyên được yêu cầu.
  NotFound: 404, // Tài nguyên được yêu cầu không tồn tại trên server.
  MethodNotAllowed: 405, // Phương thức yêu cầu không được hỗ trợ cHttpStatusCodeho tài nguyên đã cho.
  NotAcceptable: 406, // Server không thể sinh ra nội dung phù hợp với các tiêu chuẩn của yêu cầu "Accept" của client.
  ProxyAuthenticationRequired: 407, // Client cần xác thực với proxy để truy cập tài nguyên.
  RequestTimeout: 408, // Client đã không gửi yêu cầu trong khoảng thời gian cho phép.
  Conflict: 409, // Yêu cầu xung đột với trạng thái hiện tại của tài nguyên.
  Gone: 410, // Tài nguyên đã không còn tồn tại trên server.
  LengthRequired: 411, // Server yêu cầu một trường "Content-Length" không được gửi trong yêu cầu của client.
  PreconditionFailed: 412, // Một hoặc nhiều tiền điều kiện đã không thành công khi xử lý yêu cầu.
  PayloadTooLarge: 413, // Kích thước yêu cầu quá lớn để server xử lý.
  UriTooLong: 414, // URI của yêu cầu quá dài để server xử lý.
  UnsupportedMediaType: 415, // Định dạng phương thức truyền không được server hỗ trợ cho yêu cầu.
  RequestedRangeNotSatisfiable: 416, // Một hoặc nhiều phạm vi yêu cầu không hợp lệ hoặc không thể đáp ứng được.
  ExpectationFailed: 417, // Server không thể đáp ứng với tiêu chuẩn trong trường "Expect" của yêu cầu.
  AmATeapot: 418, // Server là một ấm đun nước (teapot) và không thể đáp ứng yêu cầu để trà.
  Misdirected: 421, // Yêu cầu đã gửi tới server không phù hợp.
  UnprocessableEntity: 422, // Yêu cầu không thể được xử lý bởi server.
  FailedDependency: 424, // Yêu cầu thất bại do phụ thuộc không thành công.
  PreconditionRequired: 428, // Server yêu cầu một tiền điều kiện để tiếp tục xử lý yêu cầu.
  TooManyRequests: 429, // Client đã gửi quá nhiều yêu cầu trong một khoảng thời gian cho phép.

  // 5xx Server Error
  InternalServerError: 500, // Server gặp lỗi nội bộ khi xử lý yêu cầu.
  NotImplemented: 501, // Server không hỗ trợ tính năng được yêu cầu.
  BadGateway: 502, // Server đóng vai trò là một cổng (gateway) hoặc proxy và nhận được phản hồi không hợp lệ từ server upstream.
  ServiceUnavailable: 503, // Server không thể xử lý yêu cầu do quá tải hoặc bảo trì.
  GatewayTimeout: 504, // Server đóng vai trò là một cổng hoặc proxy và không nhận được phản hồi kịp thời từ server upstream.
  HttpVersionNotSupported: 505, // Server không hỗ trợ phiên bản giao thức HTTP được yêu cầu trong yêu cầu.
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];
