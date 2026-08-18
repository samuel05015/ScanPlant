import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleAlert,
  Eye,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  UserRoundSearch,
  UsersRound,
} from 'lucide-react';
import { admin } from '../api';

type DashboardTab = 'alerts' | 'users' | 'messages';

interface AdminAlert {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  source: string;
  category: string;
  severity: string;
  action: string;
  status: string;
  content: string;
  reason?: string;
  createdAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  city?: string;
  createdAt: string;
  lastActivityAt?: string;
  isLocked: boolean;
  messageCount: number;
  alertCount: number;
  openAlertCount: number;
  riskScore: number;
  riskLevel: string;
}

interface AdminMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  createdAt: string;
}

interface AdminOverview {
  totalUsers: number;
  lockedUsers: number;
  totalMessages: number;
  openAlerts: number;
  criticalAlerts: number;
  suspiciousUsers: number;
  recentAlerts: AdminAlert[];
}

const formatDate = (value?: string) => value
  ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  : 'Sem atividade';

const sourceLabel: Record<string, string> = {
  chat: 'Chat entre usuários',
  assistant: 'Assistente botânico',
  admin: 'Ação administrativa',
};

const categoryLabel: Record<string, string> = {
  abuse: 'Linguagem ofensiva',
  controlled_substance: 'Substância controlada',
  controlledsubstance: 'Substância controlada',
  dangerousingestion: 'Possível intoxicação',
  offtopic: 'Uso fora do tema',
  account_locked: 'Conta bloqueada',
  account_unlocked: 'Conta desbloqueada',
};

const severityClass = (severity: string) => {
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-800';
  if (severity === 'high') return 'border-orange-200 bg-orange-50 text-orange-800';
  if (severity === 'medium') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-slate-50 text-slate-700';
};

const riskClass = (risk: string) => {
  if (risk === 'high') return 'bg-red-100 text-red-800';
  if (risk === 'medium') return 'bg-amber-100 text-amber-800';
  return 'bg-emerald-100 text-emerald-800';
};

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('alerts');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [alertStatus, setAlertStatus] = useState('open');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    const [overviewResult, alertsResult, usersResult, messagesResult] = await Promise.all([
      admin.getOverview(),
      admin.getAlerts(alertStatus),
      admin.getUsers(),
      admin.getMessages(),
    ]);

    const firstError = overviewResult.error || alertsResult.error || usersResult.error || messagesResult.error;
    if (firstError) {
      setError(firstError.message || 'Não foi possível carregar o painel administrativo.');
    } else {
      setOverview(overviewResult.data);
      setAlerts(alertsResult.data || []);
      setUsers(usersResult.data || []);
      setMessages(messagesResult.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (!overview) return;
    const refreshAlerts = async () => {
      const { data, error: apiError } = await admin.getAlerts(alertStatus);
      if (apiError) setError(apiError.message);
      else setAlerts(data || []);
    };
    void refreshAlerts();
  }, [alertStatus]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.city?.toLowerCase().includes(term));
  }, [search, users]);

  const reviewAlert = async (id: string, status: 'reviewed' | 'dismissed' | 'escalated') => {
    setActionId(id);
    const { error: apiError } = await admin.reviewAlert(id, status);
    if (apiError) setError(apiError.message);
    else await loadDashboard();
    setActionId(null);
  };

  const toggleUserLock = async (user: AdminUser) => {
    const verb = user.isLocked ? 'desbloquear' : 'bloquear por 24 horas';
    if (!window.confirm(`Deseja ${verb} a conta de ${user.name}?`)) return;
    setActionId(user.id);
    const { error: apiError } = await admin.setUserLock(user.id, !user.isLocked, 24);
    if (apiError) setError(apiError.message);
    else await loadDashboard();
    setActionId(null);
  };

  const cards = [
    { label: 'Usuários', value: overview?.totalUsers ?? 0, detail: `${overview?.lockedUsers ?? 0} bloqueados`, Icon: UsersRound, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'Alertas abertos', value: overview?.openAlerts ?? 0, detail: `${overview?.criticalAlerts ?? 0} prioritários`, Icon: ShieldAlert, tone: 'text-red-700 bg-red-50' },
    { label: 'Usuários suspeitos', value: overview?.suspiciousUsers ?? 0, detail: '3+ ocorrências em 30 dias', Icon: UserRoundSearch, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Mensagens', value: overview?.totalMessages ?? 0, detail: 'mensagens salvas', Icon: MessageSquareText, tone: 'text-sky-700 bg-sky-50' },
  ];

  return (
    <div className="page-container pb-28 lg:pb-16">
      <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">
            <ShieldCheck size={16} /> Acesso restrito
          </div>
          <h1 className="font-display text-4xl text-[var(--color-forest)] md:text-5xl">Central administrativa</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Acompanhe alertas de moderação, sinais de risco e atividades recentes sem expor esta área a usuários comuns.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border-medium)] bg-white px-4 text-sm font-bold text-[var(--color-forest)] shadow-sm hover:bg-emerald-50 disabled:opacity-60"
        >
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Atualizar dados
        </button>
      </header>

      {error && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <CircleAlert size={20} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo administrativo">
        {cards.map(({ label, value, detail, Icon, tone }) => (
          <article key={label} className="surface-card p-5">
            <div className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon size={21} /></div>
            <p className="text-3xl font-black text-[var(--color-text-primary)]">{loading ? '—' : value}</p>
            <p className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">{label}</p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{detail}</p>
          </article>
        ))}
      </section>

      <div className="mb-5 flex gap-2 overflow-x-auto rounded-2xl border border-[var(--color-border-light)] bg-white p-2">
        {([
          ['alerts', 'Alertas', ShieldAlert],
          ['users', 'Usuários', UsersRound],
          ['messages', 'Mensagens recentes', MessageSquareText],
        ] as const).map(([tab, label, Icon]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-extrabold transition ${
              activeTab === tab
                ? 'bg-[var(--color-primary-700)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-50)]'
            }`}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="surface-card grid min-h-72 place-items-center text-sm font-bold text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-2"><RefreshCw size={18} className="animate-spin" /> Carregando dados protegidos...</span>
        </div>
      ) : null}

      {!loading && activeTab === 'alerts' && (
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">Fila de moderação</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">Tentativas bloqueadas ou redirecionadas no chat e no assistente.</p>
            </div>
            <select value={alertStatus} onChange={(event) => setAlertStatus(event.target.value)} className="form-field min-h-11 w-full sm:w-48">
              <option value="open">Abertos</option>
              <option value="escalated">Escalados</option>
              <option value="reviewed">Revisados</option>
              <option value="dismissed">Descartados</option>
              <option value="all">Todos</option>
            </select>
          </div>

          <div className="space-y-4">
            {alerts.length === 0 && <EmptyState icon={<CheckCircle2 size={28} />} title="Nenhum alerta nesta fila" detail="Quando uma regra de moderação for acionada, o evento aparecerá aqui." />}
            {alerts.map((alert) => (
              <article key={alert.id} className="surface-card overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-[var(--color-border-light)] p-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${severityClass(alert.severity)}`}><AlertTriangle size={19} /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-[var(--color-text-primary)]">{categoryLabel[alert.category] || alert.category}</h3>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${severityClass(alert.severity)}`}>{alert.severity}</span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{sourceLabel[alert.source] || alert.source} • {formatDate(alert.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{alert.userName}</p>
                    <p className="break-all text-xs text-[var(--color-text-tertiary)]">{alert.userEmail}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Conteúdo registrado</p>
                  <blockquote className="whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">{alert.content}</blockquote>
                  {alert.reason && <p className="mt-3 text-sm text-[var(--color-text-secondary)]"><strong>Resposta do sistema:</strong> {alert.reason}</p>}
                  {alert.status === 'open' && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <ActionButton disabled={actionId === alert.id} onClick={() => void reviewAlert(alert.id, 'reviewed')} icon={<CheckCircle2 size={16} />} label="Marcar revisado" />
                      <ActionButton disabled={actionId === alert.id} onClick={() => void reviewAlert(alert.id, 'escalated')} icon={<ShieldAlert size={16} />} label="Escalar" danger />
                      <ActionButton disabled={actionId === alert.id} onClick={() => void reviewAlert(alert.id, 'dismissed')} icon={<Eye size={16} />} label="Descartar" />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === 'users' && (
        <section>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">Usuários e nível de risco</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">A pontuação considera quantidade e gravidade dos alertas.</p>
            </div>
            <label className="relative block w-full lg:w-80">
              <Search size={18} className="form-field-icon" aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="form-field form-field--start-icon min-h-11" placeholder="Buscar nome, email ou cidade" />
            </label>
          </div>

          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <article key={user.id} className="surface-card grid gap-4 p-5 lg:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(90px,.55fr))_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-black text-[var(--color-text-primary)]">{user.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${riskClass(user.riskLevel)}`}>risco {user.riskLevel}</span>
                    {user.isLocked && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-black uppercase text-white">bloqueado</span>}
                  </div>
                  <p className="mt-1 truncate text-sm text-[var(--color-text-secondary)]">{user.email}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Última atividade: {formatDate(user.lastActivityAt)}</p>
                </div>
                <Metric label="Risco" value={user.riskScore} />
                <Metric label="Alertas" value={user.alertCount} />
                <Metric label="Abertos" value={user.openAlertCount} />
                <Metric label="Mensagens" value={user.messageCount} />
                <button
                  type="button"
                  onClick={() => void toggleUserLock(user)}
                  disabled={actionId === user.id}
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black ${
                    user.isLocked
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-red-200 bg-red-50 text-red-800'
                  } disabled:opacity-50`}
                >
                  {user.isLocked ? <Unlock size={15} /> : <Ban size={15} />}
                  {user.isLocked ? 'Desbloquear' : 'Bloquear 24h'}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === 'messages' && (
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-black text-[var(--color-text-primary)]">Mensagens recentes</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Acesso administrativo para investigação; use somente quando necessário.</p>
          </div>
          <div className="surface-card divide-y divide-[var(--color-border-light)] overflow-hidden">
            {messages.length === 0 && <EmptyState icon={<MessageSquareText size={28} />} title="Nenhuma mensagem" detail="As mensagens trocadas entre usuários aparecerão aqui." />}
            {messages.map((message) => (
              <article key={message.id} className="p-5">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-[var(--color-text-primary)]">{message.senderName}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{message.senderEmail}</p>
                  </div>
                  <time className="text-xs font-bold text-[var(--color-text-tertiary)]">{formatDate(message.createdAt)}</time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-text-secondary)]">{message.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[var(--color-primary-50)] px-3 py-2 lg:bg-transparent lg:p-0">
      <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</p>
      <p className="mt-0.5 text-lg font-black text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function ActionButton({ disabled, onClick, icon, label, danger = false }: { disabled: boolean; onClick: () => void; icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black ${
        danger ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-700'
      } disabled:opacity-50`}
    >
      {icon} {label}
    </button>
  );
}

function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="surface-card grid min-h-56 place-items-center p-8 text-center">
      <div>
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">{icon}</div>
        <h3 className="font-black text-[var(--color-text-primary)]">{title}</h3>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{detail}</p>
      </div>
    </div>
  );
}
