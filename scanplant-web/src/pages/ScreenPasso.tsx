import { useNavigate } from 'react-router-dom';
import { Camera, ChevronRight, Leaf, MapPin, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { getToken } from '../api';

const steps = [
  { number: '01', Icon: Camera, title: 'Fotografe com clareza', description: 'Centralize folhas, flores ou frutos, use luz natural e evite fundos muito carregados.' },
  { number: '02', Icon: Sparkles, title: 'Leia como uma sugestão', description: 'Confira nome, confiança e alertas. Uma foto não substitui avaliação de um especialista.' },
  { number: '03', Icon: MapPin, title: 'Escolha sua privacidade', description: 'Você decide se salva só na coleção ou compartilha; localização começa sempre protegida.' },
  { number: '04', Icon: MessageCircle, title: 'Converse com responsabilidade', description: 'Use o assistente para cuidados gerais. Conteúdo ofensivo, perigoso ou ilícito é bloqueado.' },
];

export default function ScreenPasso() {
  const navigate = useNavigate();

  const finish = () => {
    localStorage.setItem('@scanplant_seen_instructions', 'true');
    navigate(getToken() ? '/' : '/login', { replace: true });
  };

  return (
    <main className="min-h-screen bg-[var(--color-ivory)]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[0.82fr_1.18fr]">
        <section className="relative overflow-hidden bg-[var(--color-forest)] px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-16">
          <img src="/scanplant-hero.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#173b2a]/65 to-[#102d20]/95" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/12 backdrop-blur"><Leaf size={23} /></span><span className="font-display text-2xl font-bold">ScanPlant</span></div>
            <div className="my-auto py-16 lg:py-0">
              <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--color-primary-200)]">Guia de primeiros passos</p>
              <h1 className="font-display max-w-xl text-4xl leading-tight sm:text-5xl lg:text-6xl">Descobrir é só o começo.</h1>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/72 sm:text-base">Use o ScanPlant para aprender e organizar — sempre respeitando os limites da identificação por imagem.</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm">
              <ShieldCheck size={21} className="mt-0.5 shrink-0 text-[var(--color-primary-200)]" />
              <p className="text-xs leading-relaxed text-white/72"><strong className="block text-sm text-white mb-1">Segurança antes da curiosidade</strong>Nunca ingira, aplique na pele ou ofereça a animais uma planta identificada apenas pelo aplicativo.</p>
            </div>
          </div>
        </section>

        <section className="flex items-center px-5 py-10 sm:px-10 lg:px-16 lg:py-16">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-8 lg:mb-10"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary-600)] mb-2">Como usar</p><h2 className="font-display text-3xl sm:text-4xl text-[var(--color-forest)]">Quatro passos para uma boa experiência</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {steps.map(({ number, Icon, title, description }) => (
                <article key={number} className="surface-card p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-primary-100)] text-[var(--color-primary-700)]"><Icon size={21} /></span><span className="font-display text-2xl text-[var(--color-primary-300)]">{number}</span></div>
                  <h3 className="mb-2 text-base font-extrabold text-[var(--color-text-primary)]">{title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
                </article>
              ))}
            </div>
            <button onClick={finish} className="primary-button mt-7 flex w-full items-center justify-center gap-2 sm:w-auto sm:min-w-[240px] sm:px-6">Entendi, vamos começar <ChevronRight size={19} /></button>
          </div>
        </section>
      </div>
    </main>
  );
}
