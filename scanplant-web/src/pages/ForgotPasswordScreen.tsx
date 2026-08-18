import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send, ShieldCheck } from 'lucide-react';
import { auth } from '../api';
import BrandLogo from '../components/BrandLogo';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || !email.trim()) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error: apiError } = await auth.requestPasswordReset(email.trim());
      if (apiError) {
        setError(apiError.status === 429
          ? 'Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.'
          : 'Não foi possível solicitar a redefinição agora. Tente novamente.');
        return;
      }

      setMessage(data?.message || 'Se existir uma conta com este email, enviaremos as instruções.');
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
          <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-white/70">Recupere • Proteja • Continue</p>
          <h2 className="font-display max-w-xl text-5xl xl:text-6xl leading-[1.04] mb-4">Sua coleção continua segura.</h2>
          <p className="max-w-lg text-base leading-relaxed text-white/75">Enviaremos um link temporário para que somente quem acessa seu email possa criar uma nova senha.</p>
        </div>
      </section>

      <main className="auth-panel">
        <div className="auth-card">
          <Link to="/login" className="inline-flex mb-6" aria-label="ScanPlant — voltar ao login">
            <BrandLogo compact />
          </Link>

          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary-600)] mb-2">Recuperação de acesso</p>
          <h1 className="font-display text-4xl text-[var(--color-forest)] mb-3">Esqueceu a senha?</h1>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] mb-7">Informe o email da sua conta. Por segurança, a mensagem de confirmação será a mesma mesmo quando o endereço não estiver cadastrado.</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <label className="block">
              <span className="block text-sm font-bold mb-2">E-mail</span>
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
                  maxLength={254}
                  required
                />
              </span>
            </label>

            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
            {message && <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{message}</div>}

            <button type="submit" disabled={loading || !email.trim()} className="primary-button flex w-full items-center justify-center gap-2">
              {loading ? 'Enviando...' : <>Enviar link seguro <Send size={18} /></>}
            </button>
          </form>

          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[var(--color-primary-50)] p-4 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[var(--color-primary-700)]" />
            O link expira em 30 minutos e não permite descobrir se um email possui conta.
          </div>

          <Link to="/login" className="mt-7 flex items-center justify-center gap-2 text-sm font-extrabold text-[var(--color-primary-700)] hover:underline">
            <ArrowLeft size={17} /> Voltar para o login
          </Link>
        </div>
      </main>
    </div>
  );
}
