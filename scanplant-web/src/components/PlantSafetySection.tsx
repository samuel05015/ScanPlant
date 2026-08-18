import { AlertTriangle, ExternalLink, Scale, ShieldQuestion, Utensils } from 'lucide-react';
import type { ReactNode } from 'react';
import { DEFAULT_SAFETY_DISCLAIMER } from '../plantSafety';
import type { PlantSafetyData } from '../plantSafety';

interface PlantSafetySectionProps {
  safety: PlantSafetyData;
  title?: string;
}

const getToxicityPresentation = (status?: string) => {
  if (status === 'potentially_toxic') {
    return { label: 'Possivelmente tóxica', tone: 'danger' as const };
  }
  if (status === 'no_evidence_found') {
    return { label: 'Nenhum alerta encontrado', tone: 'warning' as const };
  }
  return { label: 'Não verificada', tone: 'neutral' as const };
};

const getEdibilityPresentation = (status?: string) => {
  if (status === 'reported_edible') {
    return { label: 'Uso alimentar relatado', tone: 'warning' as const };
  }
  if (status === 'not_edible') {
    return { label: 'Não indicada para consumo', tone: 'danger' as const };
  }
  return { label: 'Não verificada', tone: 'neutral' as const };
};

const getLegalPresentation = (status?: string) => {
  if (status === 'possibly_regulated') {
    return { label: 'Pode exigir autorização', tone: 'danger' as const };
  }
  if (status === 'not_listed') {
    return { label: 'Sem restrição conhecida pela análise', tone: 'warning' as const };
  }
  return { label: 'Não verificada', tone: 'neutral' as const };
};

export default function PlantSafetySection({ safety, title = 'Segurança e regulamentação' }: PlantSafetySectionProps) {
  const toxicity = getToxicityPresentation(safety.toxicity_status);
  const edibility = getEdibilityPresentation(safety.edibility_status);
  const legal = getLegalPresentation(safety.legal_status);
  const sources = Array.isArray(safety.safety_sources) ? safety.safety_sources : [];
  const assessedAt = safety.safety_assessed_at
    ? new Date(safety.safety_assessed_at).toLocaleDateString('pt-BR')
    : null;

  return (
    <section aria-labelledby="plant-safety-title" className="mb-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-1 mb-3">
        <h3 id="plant-safety-title" className="text-lg font-bold text-[#173D2D]">{title}</h3>
        {assessedAt ? <span className="text-xs text-[#64748B]">Avaliado em {assessedAt}</span> : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <SafetyCard
          icon={<AlertTriangle size={20} />}
          label="Toxicidade"
          status={toxicity.label}
          detail={safety.toxicity_note || 'A toxicidade não foi verificada.'}
          tone={toxicity.tone}
        />
        <SafetyCard
          icon={<Utensils size={20} />}
          label="Comestibilidade"
          status={edibility.label}
          detail={safety.edibility_note || 'A comestibilidade não foi verificada.'}
          tone={edibility.tone}
        />
        <SafetyCard
          icon={<Scale size={20} />}
          label="Conservação e regulamentação"
          status={legal.label}
          detail={safety.legal_note || 'A situação regulatória não foi verificada para sua região.'}
          tone={legal.tone}
        />
      </div>

      {safety.edible_parts?.length ? (
        <p className="text-sm text-[#475569] mb-3">
          <strong>Partes com uso alimentar relatado:</strong> {safety.edible_parts.join(', ')}. Confirme a espécie, a parte correta e o preparo com uma fonte especializada.
        </p>
      ) : null}

      <div className="bg-[#FFF8E7] border border-[#F1D38D] text-[#6D430C] rounded-xl p-3 flex gap-2 text-sm leading-6">
        <ShieldQuestion size={20} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span>{safety.safety_disclaimer || DEFAULT_SAFETY_DISCLAIMER}</span>
      </div>

      {sources.length ? (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wide font-bold text-[#64748B] mb-1.5">Fontes e referências</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {sources.map((source) => (
              <li key={`${source.kind}-${source.url}`}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-sm text-[#2D6F52] underline underline-offset-2"
                >
                  {source.label}
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

interface SafetyCardProps {
  icon: ReactNode;
  label: string;
  status: string;
  detail: string;
  tone: 'danger' | 'warning' | 'neutral';
}

function SafetyCard({ icon, label, status, detail, tone }: SafetyCardProps) {
  const toneClass = tone === 'danger'
    ? 'bg-[#FFF1EE] border-[#F1B7A9] text-[#8A2D1A]'
    : tone === 'warning'
      ? 'bg-[#FFF8E7] border-[#F1D38D] text-[#70430A]'
      : 'bg-[#F6F8F7] border-[#DCE5DF] text-[#40584C]';

  return (
    <article className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <span aria-hidden="true">{icon}</span>
        <span className="text-xs uppercase tracking-wide font-bold">{label}</span>
      </div>
      <p className="font-bold text-sm mb-1">{status}</p>
      <p className="text-xs leading-5 opacity-90">{detail}</p>
    </article>
  );
}
