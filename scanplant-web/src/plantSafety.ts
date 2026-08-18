export interface PlantSafetySource {
  label: string;
  url: string;
  kind: 'identification' | 'ai_analysis' | 'official_reference' | string;
}

export interface PlantSafetyData {
  toxicity_status?: 'potentially_toxic' | 'no_evidence_found' | 'unknown' | string;
  toxicity_note?: string;
  edibility_status?: 'reported_edible' | 'not_edible' | 'unknown' | string;
  edibility_note?: string;
  edible_parts?: string[];
  legal_status?: 'possibly_regulated' | 'not_listed' | 'unknown' | string;
  legal_note?: string;
  safety_assessment_origin?: string;
  safety_assessed_at?: string;
  safety_sources?: PlantSafetySource[];
  safety_disclaimer?: string;
}

export const DEFAULT_SAFETY_DISCLAIMER =
  'Resultado informativo e probabilístico. Não confirme ingestão, contato, cultivo, posse ou comércio apenas com esta identificação.';

