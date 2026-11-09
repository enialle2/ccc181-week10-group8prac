import type { User } from '../api/auth';

interface WelcomeProps {
  user: User;
  onLogout: () => void;
}

export default function Welcome({ user, onLogout }: WelcomeProps) {
  return (
    <section className="login-card welcome" aria-labelledby="welcome-title">
      <h2 id="welcome-title" className="login-card__title">
        Welcome, {user.name}
      </h2>
      <p className="login-card__subtitle welcome__email">{user.email}</p>
      <button type="button" className="btn btn--primary" onClick={onLogout}>
        Log out
      </button>
    </section>
  );
}
