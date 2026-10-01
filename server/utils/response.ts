export function successResponse(message: string, data: any = null) {
  return {
    status: 'success',
    message,
    data,
    errors: null,
  }
}

export function errorResponse(
  event: any,
  message: string,
  errors: any = null,
  statusCode: number = 400,
): never {
  throw createError({
    statusCode,
    message,
    data: {
      status: 'error',
      message,
      data: null,
      errors,
    },
  })
}
