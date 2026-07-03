import axios from 'axios'
import type { ApiErrorResponse } from '../types/auth'

/**
 * Extracts a human-readable error message from an API error.
 * Falls back to a generic message if the error structure is unexpected.
 */
export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiErrorResponse> | undefined
    if (data?.message) return data.message
    if (!error.response) return 'Unable to reach the server. Please check your connection.'
  }
  return 'Something went wrong. Please try again.'
}
