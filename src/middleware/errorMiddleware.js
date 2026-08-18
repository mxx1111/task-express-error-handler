import { AppError } from '../utils/AppError.js'

export function notFoundHandler(req, _res, next) {
  next(new AppError('Not Found', 404, 'NOT_FOUND'))
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: { message: error.message, code: error.code }
    })
    return
  }
  console.error(error)
  res.status(500).json({
    success: false,
    error: { message: 'Internal Server Error' }
  })
}
