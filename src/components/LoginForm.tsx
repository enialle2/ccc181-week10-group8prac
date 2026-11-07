// Part 2: the form now calls the real API (src/api/auth.ts).
// The Part 1 checks still run first, so obviously wrong input never reaches the backend.
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { LoginErrors, LoginFormValues } from '../types';
import { AuthError, clearToken, getMe, login, readToken, saveToken } from '../api/auth';
import type { User } from '../api/auth';
import Welcome from './Welcome';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_VALUES: LoginFormValues = {
  email: '',
  password: '',
  remember: false,
};

function validate(values: LoginFormValues): LoginErrors {
  const errors: LoginErrors = {};
  if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  return errors;
}

export default function LoginForm() {
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingSession, setCheckingSession] = useState<boolean>(() => readToken() !== null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Stay logged in on refresh: if a token exists, ask the API who it belongs to.
  useEffect(() => {
    const token = readToken();
    if (!token) return;

    getMe(token)
      .then((me) => setUser(me))
      .catch((error: unknown) => {
        // 401 means the token is wrong or expired, so delete it and show the form.
        if (error instanceof AuthError && error.kind === 'unauthorized') {
          clearToken();
        }
      })
      .finally(() => setCheckingSession(false));
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, type, value, checked } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError(null);

    const nextErrors = validate(values);
    setErrors(nextErrors);
    // Part 1 checks first: an invalid form never sends a request.
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const result = await login(values.email, values.password);
      saveToken(result.token);
      setUser(result.user);
    } catch (error: unknown) {
      setApiError(
        error instanceof AuthError
          ? error.message
          : 'Something went wrong on our side. Please try again later.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setValues(INITIAL_VALUES);
    setErrors({});
    setApiError(null);
  }

  if (checkingSession) {
    return (
      <section className="login-card" aria-busy="true">
        <p className="login-card__subtitle">Checking your session...</p>
      </section>
    );
  }

  // Welcome screen only after the API answered 200.
  if (user) {
    return <Welcome user={user} onLogout={handleLogout} />;
  }

  return (
    <section className="login-card" aria-labelledby="login-title">
      <h2 id="login-title" className="login-card__title">
        Sign in
      </h2>
      <p className="login-card__subtitle">Use your school email to continue.</p>

      {apiError && (
        <p className="form-error auth-message" role="alert">
          {apiError}
        </p>
      )}

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="email">School email</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@school.edu.ph"
            value={values.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="form-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="password-row">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              className="btn btn--ghost toggle-password"
              aria-controls="password"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="form-error" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <div className="form-options">
          <label className="checkbox">
            <input
              type="checkbox"
              name="remember"
              checked={values.remember}
              onChange={handleChange}
            />
            <span>Keep me signed in</span>
          </label>
          <a className="link" href="#forgot">
            Forgot password?
          </a>
        </div>

        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="login-card__divider">
        <span>or</span>
      </div>

      <div className="alt-actions">
        <button type="button" className="btn btn--secondary">
          Create account
        </button>
        <button type="button" className="btn btn--secondary">
          Continue as guest
        </button>
      </div>
    </section>
  );
}
