// These rules copy the backend (BackendAPI.Core/Models/*Request.cs), so a mistake is caught
// before the request is sent. The server still checks everything again.

// Same pattern as CandidateRegisterRequest.Password.
export const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
export const PASSWORD_HELP = 'Password must be at least 8 characters and include a capital letter, a number, and a special character.';

// Indian mobile number, same pattern as CandidateRegisterRequest.Phone.
export const PHONE_RULE = /^[6-9]\d{9}$/;

// JobCreateRequest: Title 3-150 characters, Description required.
export function validateJob({ title, description }) {
  const t = (title || '').trim();
  if (t.length < 3 || t.length > 150) return 'Job title must be between 3 and 150 characters.';
  if (!(description || '').trim()) return 'Please add a job description.';
  return '';
}

// ProfileUpdateRequest has no server checks, so the form enforces the register rules itself.
export function validateProfile({ fullName, phone }, { isCandidate }) {
  const name = (fullName || '').trim();
  if (name.length < 2 || name.length > 100) return 'Full name must be between 2 and 100 characters.';
  if (isCandidate && phone && !PHONE_RULE.test(phone.trim())) return 'Enter a valid 10-digit phone number.';
  return '';
}

// ResumesController accepts only .pdf and .docx. 25 MB stays under the server's default 30 MB request limit.
export const MAX_RESUME_BYTES = 25 * 1024 * 1024;
export function validateResumeFile(file) {
  if (!file) return '';
  const extension = file.name.toLowerCase().split('.').pop();
  if (!['pdf', 'docx'].includes(extension)) return 'Only PDF and DOCX files are allowed.';
  if (file.size > MAX_RESUME_BYTES) return 'That file is too large. The limit is 25 MB.';
  return '';
}

// Interviews.Venue is NVARCHAR(255) in the database.
export const MAX_VENUE_LENGTH = 255;

// ---- Checks for the login, register and password forms. Each returns '' when the value is fine. ----

// Same pattern as CandidateRegisterRequest.Email.
export const EMAIL_RULE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(value) {
  const email = (value || '').trim();
  if (!email) return 'Enter your email.';
  if (!EMAIL_RULE.test(email)) return 'Enter a valid email address, for example name@example.com.';
  return '';
}

export function validatePassword(value) {
  if (!value) return 'Enter a password.';
  if (!PASSWORD_RULE.test(value)) return PASSWORD_HELP;
  return '';
}

export function validatePhone(value) {
  const phone = (value || '').trim();
  if (!phone) return 'Enter your phone number.';
  if (!PHONE_RULE.test(phone)) return 'Enter a valid 10-digit phone number starting with 6, 7, 8 or 9.';
  return '';
}

export function validateFullName(value) {
  const name = (value || '').trim();
  if (name.length < 2 || name.length > 100) return 'Full name must be between 2 and 100 characters.';
  return '';
}

export const OTP_RULE = /^\d{6}$/;

export function validateOtp(value) {
  if (!OTP_RULE.test((value || '').trim())) return 'Enter the 6-digit code from your email.';
  return '';
}

// Checks the whole register form. Returns one message for every field that is wrong.
export function validateRegisterForm({ role, fullName, email, password, phone, companyName }) {
  const errors = {};
  if (!role) errors.role = 'Choose a role. If the list is empty, wait for the server to start.';
  const nameError = validateFullName(fullName);
  if (nameError) errors.fullName = nameError;
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  if (role === 'candidate') {
    const phoneError = validatePhone(phone);
    if (phoneError) errors.phone = phoneError;
  }
  if (role === 'recruiter' && !(companyName || '').trim()) {
    errors.companyName = 'Enter your company name.';
  }
  return errors;
}

// The login form only checks the shape of the email. The server decides if the password is right.
export function validateLoginForm({ email, password }) {
  const errors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = 'Enter your password.';
  return errors;
}