import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured. Add the values from your Supabase project to .env.local and restart the app.');
      return;
    }

    setIsSubmitting(true);
    const result = isRegistering
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (isRegistering && !result.data.session) {
      setMessage('Account created. Check your email to confirm your account, then sign in.');
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="brand auth-brand">
          <span className="brand-mark">CC</span>
          <span>Campus Club Explorer</span>
        </div>
        <p className="eyebrow">Your campus, your community</p>
        <h1 id="auth-title">{isRegistering ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-intro">
          {isRegistering
            ? 'Create an account to discover clubs and request membership.'
            : 'Sign in to discover clubs, events, and your membership requests.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <label>
              Full name
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </label>
          )}
          <label>
            Campus email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" minLength="6" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="form-message error-message" role="alert">{error}</p>}
          {message && <p className="form-message success-message" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button className="auth-switch" type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); setMessage(''); }}>
          {isRegistering ? 'Already have an account? Sign in' : 'New student? Create an account'}
        </button>
      </section>
    </main>
  );
}
