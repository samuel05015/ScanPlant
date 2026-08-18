interface BrandLogoProps {
  compact?: boolean;
}

export default function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <span className={`brand-logo ${compact ? 'brand-logo--compact' : ''}`}>
      <img
        src="/imagemlogotcc.png"
        alt="ScanPlant"
        className="brand-logo__image"
      />
    </span>
  );
}
