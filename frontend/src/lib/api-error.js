export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  )
}
