export type ErrorCode =
  | 'GAME_NOT_FOUND'
  | 'SESSION_NOT_FOUND'
  | 'GAME_ALREADY_COMPLETED'
  | 'ATTEMPT_LIMIT_REACHED'
  | 'MOVIE_NOT_FOUND'
  | 'MOVIE_NOT_PLAYABLE'
  | 'DUPLICATE_GUESS'
  | 'CHALLENGE_NOT_FOUND'
  | 'CHALLENGE_EXPIRED'
  | 'CHALLENGE_DISABLED'
  | 'HINT_NOT_AVAILABLE'
  | 'HINT_ALREADY_REVEALED'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, statusCode = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      status: error.statusCode,
    };
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return {
    error: {
      code: 'INTERNAL_ERROR' as ErrorCode,
      message,
    },
    status: 500,
  };
}
