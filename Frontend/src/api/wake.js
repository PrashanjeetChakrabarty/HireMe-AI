import { API_BASE_URL } from './axiosClient';

// The free server and database go to sleep when nobody uses them, and the first request after a quiet time can take a minute or two.
// Asking for the public role list as soon as the site opens starts them early, so they are awake when the visitor clicks Login or Register.
export function wakeServer() {
  fetch(API_BASE_URL + '/api/Roles/register-options', { method: 'GET', cache: 'no-store' }).catch(() => {});
}
