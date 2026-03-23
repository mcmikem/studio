export type UploadErrorKind =
  | 'rule_denied'
  | 'file_too_large'
  | 'file_invalid_type'
  | 'network'
  | 'quota_exceeded'
  | 'billing_required'
  | 'upload_canceled'
  | 'unknown';

export interface UploadTelemetry {
  kind: UploadErrorKind;
  message: string;
  userMessage: string;
  originalError?: unknown;
  context?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    path?: string;
    userId?: string;
  };
}

const ERROR_CODE_MAP: Record<string, UploadErrorKind> = {
  'storage/unauthorized': 'rule_denied',
  'storage/canceled': 'upload_canceled',
  'storage/quota-exceeded': 'quota_exceeded',
  'storage/unknown': 'unknown',
  'storage/unauthenticated': 'rule_denied',
  'storage/retry-limit-exceeded': 'network',
  'storage/invalid-checksum': 'network',
  'storage/invalid-event-name': 'unknown',
  'storage/invalid-url': 'unknown',
  'storage/invalid-argument': 'unknown',
  'storage/no-default-bucket': 'billing_required',
  'storage/cannot-slice-blob': 'unknown',
  'storage/server-file-wrong-size': 'unknown',
};

const USER_MESSAGES: Record<UploadErrorKind, string> = {
  rule_denied: "You don't have permission to upload files. Please check your login status.",
  file_too_large: "This file is too large. Please use a smaller file.",
  file_invalid_type: "This file type is not supported. Please use a JPG, PNG, or WebP image.",
  network: "Network error during upload. Please check your connection and try again.",
  quota_exceeded: "Storage quota exceeded. Please contact support.",
  billing_required: "File storage is temporarily unavailable. Please try a smaller image or contact support.",
  upload_canceled: "Upload was canceled.",
  unknown: "Upload failed. Please try again.",
};

export function classifyUploadError(error: any): UploadTelemetry {
  const code = error?.code as string | undefined;
  const message: string = error?.message || '';

  if (message.includes('too large') || message.includes('Max size')) {
    return {
      kind: 'file_too_large',
      message,
      userMessage: USER_MESSAGES.file_too_large,
      originalError: error,
    };
  }

  if (message.includes('HEIC') || message.includes('supported') || message.includes('Only image')) {
    return {
      kind: 'file_invalid_type',
      message,
      userMessage: USER_MESSAGES.file_invalid_type,
      originalError: error,
    };
  }

  if (message.includes('billing') || message.includes('SERVICE_ACCOUNT')) {
    return {
      kind: 'billing_required',
      message,
      userMessage: USER_MESSAGES.billing_required,
      originalError: error,
    };
  }

  if (!navigator.onLine || message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return {
      kind: 'network',
      message,
      userMessage: USER_MESSAGES.network,
      originalError: error,
    };
  }

  if (code && ERROR_CODE_MAP[code]) {
    const kind = ERROR_CODE_MAP[code];
    return {
      kind,
      message,
      userMessage: USER_MESSAGES[kind],
      originalError: error,
    };
  }

  return {
    kind: 'unknown',
    message,
    userMessage: USER_MESSAGES.unknown,
    originalError: error,
  };
}

export function throwUploadError(error: any, context?: UploadTelemetry['context']): never {
  const telemetry = classifyUploadError(error);
  if (context) telemetry.context = context;

  console.error('[UploadTelemetry]', {
    kind: telemetry.kind,
    message: telemetry.message,
    context: telemetry.context,
  });

  throw new Error(telemetry.userMessage);
}

export function isGcsResponseError(response: Response, body?: any): UploadTelemetry | null {
  if (response.ok) return null;

  if (response.status === 401 || response.status === 403) {
    return {
      kind: 'rule_denied',
      message: `HTTP ${response.status}: ${body?.error || response.statusText}`,
      userMessage: USER_MESSAGES.rule_denied,
    };
  }

  if (response.status === 413) {
    return {
      kind: 'file_too_large',
      message: `HTTP 413: Payload too large`,
      userMessage: USER_MESSAGES.file_too_large,
    };
  }

  if (response.status >= 500) {
    return {
      kind: 'network',
      message: `HTTP ${response.status}: Server error`,
      userMessage: USER_MESSAGES.network,
    };
  }

  return {
    kind: 'unknown',
    message: `HTTP ${response.status}: ${response.statusText}`,
    userMessage: body?.error || USER_MESSAGES.unknown,
  };
}
