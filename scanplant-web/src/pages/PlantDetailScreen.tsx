import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { database, auth } from '../api';
import { getFavoritePlantIds, toggleFavoritePlant } from '../favorites';
import PlantSafetySection from '../components/PlantSafetySection';

const Colors = {
  primary: { 50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 400: '#4ADE80', 500: '#22C55E', 600: '#16A34A' },
  background: { primary: '#FFFFFF', secondary: '#F8FAFC' },
  text: { primary: '#1E293B', secondary: '#475569', tertiary: '#94A3B8', inverse: '#FFFFFF' },
  neutral: { 300: '#CBD5E1', 400: '#94A3B8' },
  error: { 500: '#EF4444' },
};

const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 };
const BorderRadius = { lg: 12, xl: 16, '2xl': 24, full: 9999 };

const resolveImageSource = (imageData: string) => {
  if (typeof imageData === 'string' && imageData.length > 0) {
    const trimmed = imageData.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    const compact = trimmed.replace(/\s/g, '');
    if (compact.length > 0 && /^[A-Za-z0-9+/=]+$/.test(compact)) {
      return `data:image/jpeg;base64,${compact}`;
    }
  }
  return '/placeholder.png';
};

export default function PlantDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [plant, setPlant] = useState<any>(location.state?.plant || null);
  const [loading, setLoading] = useState(!location.state?.plant);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    auth.getCurrentUser().then(({ data }) => {
      if (data?.user?.id) {
        setCurrentUserId(data.user.id);
        if (id) {
          setIsFavorite(getFavoritePlantIds(data.user.id).includes(String(id)));
        }
      }
    });
  }, [id]);

  useEffect(() => {
    const fetchPlantDetails = async () => {
      if (id && !location.state?.plant) {
        try {
          setLoading(true);
          const result = await database.select('plants', '*', { id: id });
          const data = result.data || [];
          
          if (data.length === 0) {
            setError('Planta não encontrada');
          } else {
            setPlant(data[0]);
          }
        } catch (err) {
          console.error('Erro ao buscar detalhes da planta:', err);
          setError('Não foi possível carregar os detalhes da planta');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPlantDetails();
  }, [id, location.state]);

  const deletePlant = () => {
    if (!plant || !plant.id) {
      alert('Não foi possível encontrar informações sobre esta planta.');
      return;
    }

    if (window.confirm('Tem certeza que deseja remover esta planta da sua coleção?')) {
      database.delete('plants', { id: plant.id })
        .then(() => {
          alert('Planta excluída com sucesso!');
          // Navegar para galeria e forçar atualização
          navigate('/gallery?refresh=' + Date.now());
        })
        .catch(() => {
          alert('Falha ao excluir a planta.');
        });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Data inválida';
    }
  };

  const toggleFavorite = () => {
    if (!plant?.id) return;
    const nextFavoriteIds = toggleFavoritePlant(plant.id, currentUserId);
    setIsFavorite(nextFavoriteIds.includes(String(plant.id)));
  };

  const HeaderButton = ({ iconName, onPress, isDelete = false, active = false }: any) => (
    <button
      onClick={onPress}
      aria-label={iconName === 'star' ? (active ? 'Remover dos favoritos' : 'Adicionar aos favoritos') : undefined}
      title={iconName === 'star' ? (active ? 'Remover dos favoritos' : 'Adicionar aos favoritos') : undefined}
      style={{
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        backgroundColor: isDelete ? Colors.error[500] : (active ? '#F59E0B' : 'rgba(0,0,0,0.4)'),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={Colors.text.inverse} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {iconName === 'arrow-left' && (
          <>
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </>
        )}
        {iconName === 'trash' && (
          <>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </>
        )}
        {iconName === 'star' && (
          <path
            fill={active ? Colors.text.inverse : 'none'}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        )}
      </svg>
    </button>
  );

  const InfoRow = ({ label, value, isItalic = false }: any) => {
    if (!value) return null;
    return (
      <div style={{ marginBottom: Spacing.lg }}>
        <p style={{
          fontSize: 16,
          fontWeight: 600,
          color: Colors.text.secondary,
          marginBottom: Spacing.xs,
          margin: 0,
        }}>
          {label}
        </p>
        <p style={{
          fontSize: 16,
          lineHeight: '24px',
          color: Colors.text.primary,
          fontStyle: isItalic ? 'italic' : 'normal',
          margin: 0,
        }}>
          {value}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: Colors.background.primary,
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: `4px solid ${Colors.primary[500]}`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{
          fontSize: 16,
          color: Colors.text.primary,
          marginTop: Spacing.md,
        }}>
          Carregando detalhes da planta...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: Colors.background.primary,
        padding: Spacing.xl,
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={Colors.error[500]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p style={{
          fontSize: 16,
          color: Colors.text.primary,
          textAlign: 'center',
          marginTop: Spacing.lg,
          marginBottom: Spacing.lg,
        }}>
          {error || 'Planta não encontrada'}
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            backgroundColor: Colors.primary[500],
            padding: `${Spacing.sm}px ${Spacing.lg}px`,
            borderRadius: BorderRadius.lg,
            border: 'none',
            cursor: 'pointer',
            color: Colors.text.inverse,
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: Colors.background.primary,
    }}>
      <div style={{
        maxWidth: 960,
        margin: '0 auto',
        backgroundColor: Colors.background.primary,
        minHeight: '100vh',
      }}>
        <div style={{
          height: 400,
          width: '100%',
          backgroundColor: Colors.neutral[300],
          position: 'relative',
        }}>
          <img
            src={plant && (plant.image_data || plant.image_url) ? resolveImageSource(plant.image_data || plant.image_url) : '/placeholder.png'}
            style={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
            }}
            alt={plant?.common_name}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 30%, rgba(0,0,0,0.8) 100%)',
          }} />
          <div style={{
            position: 'absolute',
            top: 40,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            paddingLeft: Spacing.lg,
            paddingRight: Spacing.lg,
          }}>
            <HeaderButton iconName="arrow-left" onPress={() => navigate(-1)} />
            <div style={{ display: 'flex', gap: Spacing.sm }}>
              <HeaderButton iconName="star" onPress={toggleFavorite} active={isFavorite} />
              <HeaderButton iconName="trash" onPress={deletePlant} isDelete={true} />
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: Colors.background.primary,
          borderTopLeftRadius: BorderRadius['2xl'],
          borderTopRightRadius: BorderRadius['2xl'],
          marginTop: -Spacing.xl,
          padding: Spacing.xl,
          position: 'relative',
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: Colors.text.primary,
            margin: 0,
          }}>
            {plant?.common_name || 'Nome não disponível'}
          </h1>
          <p style={{
            fontSize: 16,
            color: Colors.text.secondary,
            fontStyle: 'italic',
            marginTop: Spacing.xs,
            margin: `${Spacing.xs}px 0 0 0`,
          }}>
            {plant?.scientific_name || 'Nome científico não disponível'}
          </p>

          <div style={{
            height: 1,
            backgroundColor: Colors.neutral[300],
            marginTop: Spacing.xl,
            marginBottom: Spacing.xl,
          }} />

          <h2 style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: Colors.text.primary,
            marginTop: Spacing.lg,
            marginBottom: Spacing.md,
          }}>
            Detalhes
          </h2>
          <InfoRow label="Descrição" value={plant?.wiki_description || plant?.enhanced_description || 'Descrição não disponível'} />
          <InfoRow label="Família" value={plant?.family || 'Não disponível'} />
          <InfoRow label="Gênero" value={plant?.genus || 'Não disponível'} />

          <PlantSafetySection safety={plant} />

          <h2 style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: Colors.text.primary,
            marginTop: Spacing.lg,
            marginBottom: Spacing.md,
          }}>
            Guia de Cuidados
          </h2>
          <InfoRow label="Cuidados" value={plant?.care_instructions || 'Cuidados não disponíveis'} />

          <h2 style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: Colors.text.primary,
            marginTop: Spacing.lg,
            marginBottom: Spacing.md,
          }}>
            Lembrete de Rega
          </h2>
          <InfoRow label="Status" value={plant?.reminder_enabled ? 'Ativado' : 'Desativado'} />
          {plant?.reminder_enabled && (
            <InfoRow
              label="Frequência"
              value={plant?.watering_frequency_days ? `${plant?.watering_frequency_days} dia(s)` : (plant?.watering_frequency_text || 'Informação indisponível')}
            />
          )}

          <h2 style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: Colors.text.primary,
            marginTop: Spacing.lg,
            marginBottom: Spacing.md,
          }}>
            Localização
          </h2>
          {(() => {
            const isOwner = plant?.user_id === currentUserId;
            const canSeeLocation = isOwner || plant?.is_location_public;
            return (
              <>
                {canSeeLocation ? (
                  <>
                    <InfoRow label="Cidade" value={plant?.city || 'Não disponível'} />
                    <InfoRow label="Local Específico" value={plant?.location_name || 'Não disponível'} />
                  </>
                ) : (
                  <p style={{ fontSize: 14, color: Colors.text.tertiary, fontStyle: 'italic', margin: `0 0 ${Spacing.md}px 0` }}>
                    🔒 Localização não compartilhada pelo usuário.
                  </p>
                )}
                {canSeeLocation && plant?.latitude && plant?.longitude && (
                  <button
                    onClick={() => window.open(`https://www.google.com/maps?q=${plant.latitude},${plant.longitude}`, '_blank')}
                    style={{
                      width: '100%',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: BorderRadius.lg,
                      padding: `${Spacing.md}px`,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: Spacing.sm,
                      marginBottom: Spacing.lg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    🗺️ Abrir no Google Maps
                  </button>
                )}
              </>
            );
          })()}

          {plant?.notes && (
            <>
              <h2 style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: Colors.text.primary,
                marginTop: Spacing.lg,
                marginBottom: Spacing.md,
              }}>
                Anotações
              </h2>
              <p style={{
                fontSize: 16,
                lineHeight: '24px',
                color: Colors.text.primary,
                backgroundColor: Colors.background.secondary,
                padding: Spacing.md,
                borderRadius: BorderRadius.lg,
                margin: 0,
              }}>
                {plant.notes}
              </p>
            </>
          )}

          <div style={{
            marginTop: Spacing.xl,
            display: 'flex',
            justifyContent: 'center',
            paddingBottom: Spacing.xl,
          }}>
            <p style={{
              fontSize: 12,
              color: Colors.text.tertiary,
              margin: 0,
            }}>
              Registrada em {formatDate(plant?.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
