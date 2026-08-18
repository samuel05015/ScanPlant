import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { auth } from '../api';
import BrandLogo from '../components/BrandLogo';

export default function ResetPasswordScreen() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email')?.trim() || '';
  const token = searchParams.get('token')?.trim() || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordChecks = useMemo(() => [
    { label: '8 ou mais caracteres', valid: password.length >= 8 },
    { label: 'uma letra minúscula', valid: /[a-z]/.test(password) },
    { label: 'uma letra maiúscula', valid: /[A-Z]/.test(password) },
    { label: 'um número', valid: /\d/.test(password) },
    { label: '4 caracteres diferentes', valid: new Set(password).size >= 4 },
  ], [password]);
  const passwordIsValid = passwordChecks.every((check) => check.valid);
  const linkIsValid = Boolean(email && token);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || !linkIsValid || !passwordIsValid) return;

    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: apiError } = await auth.resetPassword(email, token, password);
      if (apiError) {
        setError(apiError.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos.'
          : apiError.message || 'O link é inválido ou expirou. Solicite um novo.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Não foi possível conectar. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-visual" aria-hidden="true">
        <img src="/scanplant-hero.png" alt="" />
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-12 xl:p-16 text-white">
          <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-white/70">Nova senha • Novo acesso</p>
          <h2 className="font-display max-w-xl text-5xl xl:text-6xl leading-[1.04] mb-4">Volte a cultivar suas descobertas.</h2>
          <p className="max-w-lg text-base leading-relaxed text-white/75">Escolha uma senha exclusiva para o ScanPlant e evite reutilizá-la em outros serviços.</p>
        </div>
      </section>

      <main className="auth-panel py-10">
        <div className="auth-card">
          <Link to="/login" className="inline-flex mb-6" aria-label="ScanPlant — voltar ao login">
            <BrandLogo compact />
          </Link>

          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary-600)] mb-2">Redefinição segura</p>
          <h1 className="font-display text-4xl text-[var(--color-forest)] mb-3">Crie uma nova senha</h1>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] mb-7">O link funciona uma única vez e expira após o período de segurança.</p>

          {!linkIsValid ? (
            <div className="space-y-5">
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Este link está incompleto. Solicite uma nova redefinição de senha.</div>
              <Link to="/forgot-password" className="primary-button flex w-full items-center justify-center gap-2">Solicitar novo link <ArrowRight size={18} /></Link>
            </div>
          ) : success ? (
            <div className="space-y-5">
              <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm leading-relaxed text-green-900">
                <div className="mb-2 flex items-center gap-2 font-extrabold"><ShieldCheck size={20} /> Senha atualizada</div>
                Sua nova senha já pode ser usada para entrar no ScanPlant.
              </div>
              <Link to="/login" className="primary-button flex w-full items-center justify-center gap-2">Ir para o login <ArrowRight size={18} /></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <label className="block">
                <span className="block text-sm font-bold mb-2">Nova senha</span>
                <span className="relative block">
                  <LockKeyhole size={19} className="form-field-icon" aria-hidden="true" />
                  <input type={showPassword ? 'text' : 'password'} className="form-field form-field--start-icon form-field--end-action" placeholder="Crie uma senha forte" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" maxLength={100} required />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="form-field-action" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
                </span>
              </label>

              <label className="block">
                <span className="block text-sm font-bold mb-2">Confirmar nova senha</span>
                <span className="relative block">
                  <LockKeyhole size={19} className="form-field-icon" aria-hidden="true" />
                  <input type={showPassword ? 'text' : 'password'} className="form-field form-field--start-icon" placeholder="Repita a nova senha" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" maxLength={100} required />
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl bg-[#f3f6f2] p-3">
                {passwordChecks.map((check) => <span key={check.label} className={`flex items-center gap-2 text-xs font-semibold ${check.valid ? 'text-[var(--color-primary-700)]' : 'text-[var(--color-text-tertiary)]'}`}><Check size={14} /> {check.label}</span>)}
                <span className={`flex items-center gap-2 text-xs font-semibold ${password && password === confirmation ? 'text-[var(--color-primary-700)]' : 'text-[var(--color-text-tertiary)]'}`}><Check size={14} /> senhas iguais</span>
              </div>

              {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

              <button type="submit" disabled={loading || !passwordIsValid || password !== confirmation} className="primary-button flex w-full items-center justify-center gap-2">
                {loading ? 'Atualizando...' : <>Salvar nova senha <ArrowRight size={18} /></>}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
