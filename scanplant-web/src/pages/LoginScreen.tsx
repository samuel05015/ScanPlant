import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { auth } from '../api';
import BrandLogo from '../components/BrandLogo';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const { error: apiError } = await auth.signIn(email.trim(), password);
      if (apiError) {
        setError(apiError.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
          : 'Não foi possível entrar. Confira os dados e tente novamente.');
        return;
      }

      const isFirstLogin = localStorage.getItem('@scanplant_first_login');
      if (isFirstLogin === 'true') {
        localStorage.removeItem('@scanplant_first_login');
        navigate('/instructions', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch {
      setError('Não foi possível conectar. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout auth-layout--login">
      <section className="auth-visual" aria-hidden="true">
        <img src="/scanplant-hero.png" alt="" />
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-12 xl:p-16 text-white">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-md mb-5">
            <ShieldCheck size={16} /> Sua sessão é protegida
          </span>
          <h2 className="font-display max-w-xl text-5xl xl:text-6xl leading-[1.04] mb-4">Cultive conhecimento, uma descoberta por vez.</h2>
          <p className="max-w-lg text-base leading-relaxed text-white/75">Identifique espécies, organize sua coleção e tire dúvidas com orientação responsável.</p>
        </div>
      </section>

      <main className="auth-panel">
        <div className="auth-card">
          <Link to="/instructions" className="auth-brand-link" aria-label="ScanPlant — abrir guia">
            <BrandLogo compact />
          </Link>

          <p className="login-kicker text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary-600)]">Acesse sua conta</p>
          <h1 className="login-title font-display text-4xl text-[var(--color-forest)]">Bem-vindo de volta</h1>
          <p className="login-description text-sm leading-relaxed text-[var(--color-text-secondary)]">Continue cuidando das suas plantas e explorando novas espécies.</p>

          <form onSubmit={handleLogin} className="login-form" noValidate>
            <label className="block">
              <span className="block text-sm font-bold text-[var(--color-text-primary)] mb-2">E-mail</span>
              <span className="relative block">
                <Mail size={19} className="form-field-icon" aria-hidden="true" />
                <input
                  type="email"
                  className="form-field form-field--start-icon"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  required
                />
              </span>
            </label>

            <div className="block">
              <label htmlFor="login-password" className="mb-2 block text-sm font-bold text-[var(--color-text-primary)]">Senha</label>
              <span className="relative block">
                <LockKeyhole size={19} className="form-field-icon" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-field form-field--start-icon form-field--end-action"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="form-field-action"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-xs font-extrabold text-[var(--color-primary-700)] hover:underline">Esqueci minha senha</Link>
              </div>
            </div>

            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

            <button type="submit" disabled={loading || !email || !password} className="primary-button flex w-full items-center justify-center gap-2">
              {loading ? 'Verificando...' : <>Entrar com segurança <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="login-security-note flex items-start gap-3 rounded-2xl bg-[var(--color-primary-50)] p-4 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[var(--color-primary-700)]" />
            Após tentativas incorretas, o acesso é temporariamente bloqueado para proteger sua conta.
          </div>

          <p className="login-register-link text-center text-sm text-[var(--color-text-secondary)]">
            Ainda não tem conta? <Link to="/register" className="font-extrabold text-[var(--color-primary-700)] hover:underline">Criar gratuitamente</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
