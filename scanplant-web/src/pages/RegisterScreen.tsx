import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { auth } from '../api';
import BrandLogo from '../components/BrandLogo';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordChecks = useMemo(() => [
    { label: '8 ou mais caracteres', valid: password.length >= 8 },
    { label: 'uma letra minúscula', valid: /[a-z]/.test(password) },
    { label: 'uma letra maiúscula', valid: /[A-Z]/.test(password) },
    { label: 'um número', valid: /\d/.test(password) },
    { label: '4 caracteres diferentes', valid: new Set(password).size >= 4 },
  ], [password]);
  const passwordIsValid = passwordChecks.every((check) => check.valid);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || !passwordIsValid) return;

    setLoading(true);
    setError('');
    try {
      const { error: apiError } = await auth.signUp(email.trim(), password, name.trim());
      if (apiError) {
        setError(apiError.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos.'
          : 'Não foi possível criar a conta. Revise os dados ou use outro e-mail.');
        return;
      }
      navigate('/instructions', { replace: true });
    } catch {
      setError('Não foi possível conectar. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-visual" aria-hidden="true">
        <img src="/scanplant-hero.png" alt="" />
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-12 xl:p-16 text-white">
          <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-white/70">Conheça • Cuide • Compartilhe</p>
          <h2 className="font-display max-w-xl text-5xl xl:text-6xl leading-[1.04] mb-4">Seu olhar para a natureza começa aqui.</h2>
          <p className="max-w-lg text-base leading-relaxed text-white/75">Crie uma coleção viva e aprenda a interpretar cada identificação com segurança.</p>
        </div>
      </section>

      <main className="auth-panel py-10">
        <div className="auth-card">
          <Link to="/login" className="inline-flex mb-6" aria-label="ScanPlant — voltar ao login">
            <BrandLogo compact />
          </Link>

          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary-600)] mb-2">Comece agora</p>
          <h1 className="font-display text-4xl text-[var(--color-forest)] mb-3">Crie sua conta</h1>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] mb-7">Leva menos de um minuto e não exige cartão.</p>

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <label className="block">
              <span className="block text-sm font-bold mb-2">Nome</span>
              <span className="relative block"><UserRound size={19} className="form-field-icon" aria-hidden="true" /><input type="text" className="form-field form-field--start-icon" placeholder="Como devemos chamar você?" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={120} required /></span>
            </label>
            <label className="block">
              <span className="block text-sm font-bold mb-2">E-mail</span>
              <span className="relative block"><Mail size={19} className="form-field-icon" aria-hidden="true" /><input type="email" className="form-field form-field--start-icon" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" required /></span>
            </label>
            <label className="block">
              <span className="block text-sm font-bold mb-2">Senha</span>
              <span className="relative block">
                <LockKeyhole size={19} className="form-field-icon" aria-hidden="true" />
                <input type={showPassword ? 'text' : 'password'} className="form-field form-field--start-icon form-field--end-action" placeholder="Crie uma senha forte" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="form-field-action" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl bg-[#f3f6f2] p-3">
              {passwordChecks.map((check) => <span key={check.label} className={`flex items-center gap-2 text-xs font-semibold ${check.valid ? 'text-[var(--color-primary-700)]' : 'text-[var(--color-text-tertiary)]'}`}><Check size={14} /> {check.label}</span>)}
            </div>

            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

            <button type="submit" disabled={loading || !name.trim() || !email.trim() || !passwordIsValid} className="primary-button flex w-full items-center justify-center gap-2">
              {loading ? 'Protegendo sua conta...' : <>Criar minha conta <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[var(--color-text-secondary)]">Já tem conta? <Link to="/login" className="font-extrabold text-[var(--color-primary-700)] hover:underline">Entrar</Link></p>
        </div>
      </main>
    </div>
  );
}
