// Turns whatever the backend sent back into one sentence a person can read.
// The API answers in several shapes: { message }, { errors: { Field: [..] } } for validation,
// an empty 403 for "not allowed", and a 429 with a "wait N seconds" message.
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const response = error?.response;

  if (!response) {
    // No response at all: the server is asleep, offline, or the network dropped.
    return error?.code === 'ERR_NETWORK' || error?.message === 'Network Error'
      ? 'Cannot reach the server. Check your internet connection and try again. If the app was idle, give it a minute to wake up.'
      : fallback;
  }

  const { status, data } = response;

  if (data?.errors && typeof data.errors === 'object') {
    const text = Object.values(data.errors).flat().join(' ');
    if (text) return text;
  }
  if (typeof data?.message === 'string' && data.message) return data.message;

  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 413) return 'That file is too large.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500) return 'The server had a problem. Please try again in a moment.';
  return fallback;
}