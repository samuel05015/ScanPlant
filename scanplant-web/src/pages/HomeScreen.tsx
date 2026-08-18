import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Camera,
  CircleHelp,
  Heart,
  Leaf,
  MessageCircle,
  Search,
  ShieldCheck,
  Sprout,
  Users,
} from 'lucide-react';

const actions = [
  {
    title: 'Minha coleção',
    description: 'Organize suas plantas, cuidados e lembretes em um só lugar.',
    Icon: Sprout,
    path: '/gallery?mode=personal',
  },
  {
    title: 'Explorar espécies',
    description: 'Busque plantas por nome, família ou localização.',
    Icon: Search,
    path: '/search',
  },
  {
    title: 'Comunidade',
    description: 'Descubra coleções compartilhadas por outros apaixonados.',
    Icon: Users,
    path: '/gallery?mode=community',
  },
  {
    title: 'Conversas',
    description: 'Troque experiências com respeito e segurança.',
    Icon: MessageCircle,
    path: '/chats',
  },
  {
    title: 'Favoritos',
    description: 'Volte rapidamente às plantas que chamaram sua atenção.',
    Icon: Heart,
    path: '/favorites',
  },
  {
    title: 'Como usar',
    description: 'Aprenda a fotografar, interpretar e salvar uma identificação.',
    Icon: CircleHelp,
    path: '/instructions',
  },
];

export default function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent">
      <div className="page-container">
        <header className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <p className="section-heading-kicker text-xs uppercase text-[var(--color-primary-600)] mb-1">Seu jardim</p>
            <h1 className="section-heading-title text-3xl md:text-4xl text-[var(--color-forest)]">Bem-vindo ao ScanPlant.</h1>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[var(--color-border-light)] text-sm font-bold text-[var(--color-text-secondary)] shadow-sm"
          >
            <Leaf size={18} className="text-[var(--color-primary-600)]" /> Meu perfil
          </button>
        </header>

        <section className="relative overflow-hidden rounded-[28px] bg-[var(--color-forest)] text-white shadow-xl mb-7 md:mb-10">
          <img
            src="/scanplant-hero.png"
            alt="Folhagens verdes iluminadas pela luz natural"
            className="absolute inset-0 h-full w-full object-cover object-[68%_center] opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#123323]/95 via-[#173b2a]/75 to-[#173b2a]/10" />
          <div className="relative z-10 max-w-2xl px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-20">
            <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#d8ebdc]">Identificação botânica assistida</p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.02] max-w-xl mb-4">
              Identifique e cuide das suas plantas.
            </h2>
            <p className="max-w-lg text-sm sm:text-base leading-relaxed text-white/78 mb-7">
              Fotografe uma planta para receber uma sugestão de espécie, orientações de cuidado e alertas de segurança.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/photo')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#dff2df] px-5 py-3.5 font-extrabold text-[#214c2c] shadow-lg transition-transform hover:-translate-y-0.5"
              >
                <Camera size={20} /> Identificar uma planta
              </button>
              <button
                onClick={() => navigate('/plant-assistant')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3.5 font-bold text-white backdrop-blur-md hover:bg-white/15"
              >
                <Bot size={20} /> Perguntar ao assistente
              </button>
            </div>
          </div>
        </section>

        <section className="mb-8 md:mb-11">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="section-heading-kicker text-xs uppercase text-[var(--color-primary-600)] mb-1">Explore o ScanPlant</p>
              <h2 className="section-heading-title text-2xl sm:text-3xl text-[var(--color-forest)]">Tudo para cuidar e aprender</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {actions.map(({ title, description, Icon, path }) => (
              <button
                key={title}
                onClick={() => navigate(path)}
                className="surface-card interactive-card group flex min-h-[160px] flex-col items-start p-5 text-left"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] mb-5">
                  <Icon size={21} />
                </span>
                <span className="flex w-full items-center justify-between gap-4">
                  <span>
                    <strong className="block text-base text-[var(--color-text-primary)] mb-1">{title}</strong>
                    <span className="block text-sm leading-relaxed text-[var(--color-text-secondary)]">{description}</span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-[var(--color-primary-600)] transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3 rounded-[24px] border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] p-5 md:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 text-[var(--color-primary-700)]" size={22} />
            <div><strong className="text-sm text-[var(--color-forest)]">Privacidade por padrão</strong><p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">Sua localização só aparece quando você escolhe compartilhar.</p></div>
          </div>
          <div className="flex items-start gap-3">
            <Leaf className="mt-0.5 text-[var(--color-primary-700)]" size={22} />
            <div><strong className="text-sm text-[var(--color-forest)]">Identificação é uma estimativa</strong><p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">Não consuma ou manipule uma planta apenas pelo resultado do aplicativo.</p></div>
          </div>
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 text-[var(--color-primary-700)]" size={22} />
            <div><strong className="text-sm text-[var(--color-forest)]">Comunidade respeitosa</strong><p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">Conteúdo ofensivo ou perigoso é bloqueado antes do envio.</p></div>
          </div>
        </section>
      </div>
    </div>
  );
}
