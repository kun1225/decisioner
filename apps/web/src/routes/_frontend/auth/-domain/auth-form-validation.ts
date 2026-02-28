const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOWERCASE_PATTERN = /[a-z]/;
const UPPERCASE_PATTERN = /[A-Z]/;
const SPECIAL_PATTERN = /[^a-zA-Z0-9]/;

type LoginFields = {
  email: string;
  password: string;
};

type RegisterFields = {
  email: string;
  name: string;
  password: string;
  confirmedPassword: string;
};

export function validateLoginInput(values: LoginFields) {
  const errors: Partial<Record<keyof LoginFields, string>> = {};

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Invalid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  }

  return errors;
}

export function validateRegisterInput(values: RegisterFields) {
  const errors: Partial<Record<keyof RegisterFields, string>> = {};

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Invalid email address';
  }

  const name = values.name.trim();
  if (!name) {
    errors.name = 'Name is required';
  } else if (name.length > 255) {
    errors.name = 'Name must be at most 255 characters';
  }

  const password = values.password;
  if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (password.length > 72) {
    errors.password = 'Password must be at most 72 characters';
  } else if (!LOWERCASE_PATTERN.test(password)) {
    errors.password = 'Password must contain a lowercase letter';
  } else if (!UPPERCASE_PATTERN.test(password)) {
    errors.password = 'Password must contain an uppercase letter';
  } else if (!SPECIAL_PATTERN.test(password)) {
    errors.password = 'Password must contain a special character';
  }

  if (values.password !== values.confirmedPassword) {
    errors.confirmedPassword = 'Passwords do not match';
  }

  return errors;
}
