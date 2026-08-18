import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, _res, next) {
  const err = new AppError(`Not Found - ${req.originalUrl || req.url}`, 404, 'NOT_FOUND');
  next(err);
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof AppError) {
    return res.status(error.statusCode || 400).json({
      success: false,
      error: {
        message: error.message,
        code: error.code || 'APP_ERROR',
      },
    });
  }

  // Log unexpected errors for operators
  console.error(error);

  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
}
