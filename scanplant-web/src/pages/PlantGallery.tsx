import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { database, auth } from '../api';
import { getFavoritePlantIds, toggleFavoritePlant } from '../favorites';
import { Icons } from '../components/Icons';
import type { PlantSafetyData } from '../plantSafety';

const Colors = {
  primary: { 50: '#E8F5E9', 100: '#C8E6C9', 500: '#22c55e', 600: '#16a34a' },
  success: '#10b981',
  text: { primary: '#1E293B', secondary: '#475569', tertiary: '#94A3B8', inverse: '#FFFFFF' },
  background: { primary: '#FFFFFF', secondary: '#F8FAFC' },
  neutral: { 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1' },
};

const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 };
const BorderRadius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 };

interface Plant extends PlantSafetyData {
  id: string;
  common_name: string;
  scientific_name: string;
  image_data: string;
  city?: string;
  user_id: string;
  is_location_public?: boolean;
  reminder_enabled?: boolean;
  watering_frequency_days?: number;
  notes?: string;
  wiki_description?: string;
  reminder_notification_id?: string;
}

interface UserInfo {
  id: string;
  name: string;
}

type SafetyBadgeTone = 'danger' | 'warning' | 'positive' | 'neutral';

interface SafetyBadgeProps {
  label: string;
  value: string;
  tone: SafetyBadgeTone;
  detail?: string;
}

const SafetyBadge: React.FC<SafetyBadgeProps> = ({ label, value, tone, detail }) => {
  const tones: Record<SafetyBadgeTone, { background: string; border: string; text: string }> = {
    danger: { background: '#FFF1EE', border: '#F1B7A9', text: '#8A2D1A' },
    warning: { background: '#FFF8E7', border: '#F1D38D', text: '#70430A' },
    positive: { background: '#ECFDF3', border: '#A7E2BC', text: '#17633A' },
    neutral: { background: '#F6F8F7', border: '#DCE5DF', text: '#40584C' },
  };
  const colors = tones[tone];

  return (
    <span
      title={detail}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 7px',
        borderRadius: BorderRadius.full,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.background,
        color: colors.text,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.2,
      }}
    >
      <span style={{ fontWeight: 700 }}>{label}:</span> {value}
    </span>
  );
};

const getToxicityBadge = (plant: Plant): SafetyBadgeProps => {
  if (plant.toxicity_status === 'potentially_toxic') {
    return { label: 'Toxicidade', value: 'alerta', tone: 'danger', detail: plant.toxicity_note };
  }
  if (plant.toxicity_status === 'no_evidence_found') {
    return { label: 'Toxicidade', value: 'sem alerta conhecido', tone: 'warning', detail: plant.toxicity_note };
  }
  return { label: 'Toxicidade', value: 'não avaliada', tone: 'neutral', detail: plant.toxicity_note };
};

const getEdibilityBadge = (plant: Plant): SafetyBadgeProps => {
  if (plant.edibility_status === 'reported_edible') {
    return { label: 'Comestível', value: 'uso relatado', tone: 'positive', detail: plant.edibility_note };
  }
  if (plant.edibility_status === 'not_edible') {
    return { label: 'Comestível', value: 'não indicada', tone: 'danger', detail: plant.edibility_note };
  }
  return { label: 'Comestível', value: 'não avaliada', tone: 'neutral', detail: plant.edibility_note };
};

const getLegalBadge = (plant: Plant): SafetyBadgeProps => {
  if (plant.legal_status === 'possibly_regulated') {
    return { label: 'Legalidade', value: 'atenção', tone: 'danger', detail: plant.legal_note };
  }
  if (plant.legal_status === 'not_listed') {
    return { label: 'Legalidade', value: 'sem restrição conhecida', tone: 'warning', detail: plant.legal_note };
  }
  return { label: 'Legalidade', value: 'não avaliada', tone: 'neutral', detail: plant.legal_note };
};

const PlantGallery: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') || 'personal';
  
  const [plants, setPlants] = useState<Plant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'personal' | 'community'>(initialMode as any);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTextRef = useRef('');

  // Recarregar plantas quando o modo mudar ou quando voltar para a página
  useEffect(() => {
    loadPlants();
  }, [viewMode, searchParams]); // Adicionar searchParams como dependência

  const loadPlants = async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      if (!currentUser || !currentUser.data) {
        navigate('/login');
        return;
      }
      
      const user = currentUser.data.user;
      setUserInfo({ id: user.id, name: user.name || 'Usuário' });
      setFavoriteIds(getFavoritePlantIds(user.id));
      
      let result;
      if (viewMode === 'personal') {
        result = await database.select('plants', '*', { user_id: user.id });
      } else {
        result = await database.select('plants');
      }
      const data: Plant[] = result.data || [];
      
      // IDs são strings (Guid), ordenar por data de criação ou manter ordem da API
      const sortedData = [...data].reverse();
      setPlants(sortedData);
      setFilteredPlants(sortedData);
    } catch (error) {
      console.error('Erro ao carregar plantas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resolveImageSource = (imageData: string) => {
    if (!imageData) return '/placeholder.png';
    if (imageData.startsWith('data:image')) return imageData;
    if (imageData.startsWith('http')) return imageData;
    return `/placeholder.png`;
  };

  const searchPlant = () => {
    const term = searchTextRef.current.toLowerCase().trim();
    if (!term) {
      setFilteredPlants(plants);
      setSearched(false);
      return;
    }
    
    const filtered = plants.filter(plant => {
      const commonName = (plant.common_name || '').toLowerCase();
      return commonName.includes(term);
    });
    
    setFilteredPlants(filtered);
    setSearched(true);
  };

  const fetchAllPlants = () => {
    searchTextRef.current = '';
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    setSearched(false);
    setFilteredPlants(plants);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPlants();
    fetchAllPlants();
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'personal' ? 'community' : 'personal');
    setLoading(true);
  };

  const handleToggleFavorite = (plantId: string) => {
    setFavoriteIds(toggleFavoritePlant(plantId, userInfo?.id));
  };

  const PlantItem: React.FC<{ item: Plant }> = ({ item }) => {
    const isInCommunityView = viewMode === 'community';
    const isYourPlant = userInfo && item.user_id === userInfo.id;
    const isFavorite = favoriteIds.includes(String(item.id));
    const canShowLocation = !isInCommunityView || isYourPlant || item.is_location_public;
    const toxicityBadge = getToxicityBadge(item);
    const edibilityBadge = getEdibilityBadge(item);
    const legalBadge = getLegalBadge(item);

    return (
      <div
        onClick={() => navigate(`/plant/${item.id}`, { state: { plant: item } })}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter') navigate(`/plant/${item.id}`, { state: { plant: item } });
        }}
        style={{
          backgroundColor: Colors.background.primary,
          borderRadius: BorderRadius.xl,
          marginBottom: Spacing.lg,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          overflow: 'hidden',
          borderLeft: isInCommunityView && isYourPlant ? `4px solid ${Colors.success}` : 'none',
          cursor: 'pointer',
          border: 'none',
          width: '100%',
          textAlign: 'left',
          padding: 0,
        }}
      >
        <img
          src={resolveImageSource(item.image_data)}
          style={{
            width: 100,
            minHeight: 140,
            objectFit: 'cover',
          }}
          alt={item.common_name}
        />
        <div style={{ flex: 1, padding: Spacing.lg, position: 'relative' }}>
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleToggleFavorite(item.id);
            }}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 36,
              height: 36,
              borderRadius: BorderRadius.full,
              backgroundColor: isFavorite ? '#FEF3C7' : Colors.background.secondary,
              color: isFavorite ? '#F59E0B' : Colors.text.tertiary,
              border: `1px solid ${isFavorite ? '#FCD34D' : Colors.neutral[200]}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
            }}
          >
            <Icons.Star size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <p style={{ 
            fontSize: 16, 
            fontWeight: 600, 
            color: Colors.primary[600], 
            marginBottom: Spacing.xs,
            margin: '0 44px 0 0',
          }}>
            {item.common_name || 'Nome não disponível'}
          </p>
          <p style={{ 
            fontSize: 13, 
            fontStyle: 'italic', 
            color: Colors.text.secondary,
            marginBottom: Spacing.md,
            margin: 0,
          }}>
            {item.scientific_name || 'Nome científico não disponível'}
          </p>

          <div
            aria-label="Resumo de segurança da planta"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: Spacing.sm,
              marginBottom: Spacing.sm,
            }}
          >
            <SafetyBadge {...toxicityBadge} />
            <SafetyBadge {...edibilityBadge} />
            <SafetyBadge {...legalBadge} />
          </div>
          
          {isInCommunityView && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: Spacing.sm }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isYourPlant ? Colors.success : Colors.primary[500]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isYourPlant ? (
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                ) : (
                  <>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </>
                )}
                {isYourPlant && <circle cx="12" cy="7" r="4" />}
              </svg>
              <span style={{ 
                marginLeft: Spacing.xs, 
                color: isYourPlant ? Colors.success : Colors.primary[500],
                fontWeight: 500,
                fontSize: 14,
              }}>
                {isYourPlant ? 'Sua planta' : 'Comunidade'}
              </span>
            </div>
          )}
          
          {isInCommunityView && isYourPlant && (
            <div style={{
              position: 'absolute',
              top: 52,
              right: 8,
              backgroundColor: Colors.success,
              padding: '4px 8px',
              borderRadius: 12,
            }}>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>Sua</span>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.text.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{ 
              marginLeft: Spacing.xs, 
              fontSize: 13, 
              color: Colors.text.tertiary,
            }}>
              {canShowLocation ? (item.city || 'Local não disponível') : 'Localização privada'}
            </span>
          </div>
          
          {item.reminder_enabled && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              backgroundColor: Colors.primary[500],
              borderRadius: BorderRadius.full,
              padding: `${Spacing.xs}px ${Spacing.sm}px`,
              marginTop: Spacing.sm,
              gap: Spacing.xs,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={Colors.text.inverse} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span style={{ fontSize: 13, color: Colors.text.inverse }}>
                {`Rega a cada ${item.watering_frequency_days || '?'} dia(s)`}
              </span>
            </div>
          )}
          
          {item.notes && (
            <p style={{ 
              fontSize: 13, 
              color: Colors.text.secondary, 
              marginTop: Spacing.xs,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {item.notes}
            </p>
          )}
        </div>
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
        backgroundColor: Colors.background.secondary,
        padding: Spacing.xl,
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: `4px solid ${Colors.primary[100]}`,
          borderTop: `4px solid ${Colors.primary[500]}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ marginTop: Spacing.lg, color: Colors.text.secondary, fontSize: 16 }}>
          Carregando sua coleção...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: Colors.background.secondary,
    }}>
      <div style={{ 
        maxWidth: 1180,
        margin: '0 auto',
        backgroundColor: Colors.background.secondary,
        minHeight: '100vh',
      }}>
        {/* Header */}
        <div style={{ 
          padding: `${Spacing['2xl']}px ${Spacing.lg}px ${Spacing.xl}px`,
          width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: 10,
                borderRadius: 20,
                backgroundColor: Colors.background.primary,
                marginRight: Spacing.md,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={Colors.text.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                fontSize: 28, 
                fontWeight: 'bold', 
                color: Colors.text.primary,
                margin: 0,
              }}>
                {viewMode === 'personal' ? 'Minha Coleção de Plantas' : 'Plantas da Comunidade'}
              </h1>
              <p style={{ 
                fontSize: 16, 
                color: Colors.text.secondary,
                marginTop: Spacing.xs,
                margin: 0,
              }}>
                {viewMode === 'community' 
                  ? `${filteredPlants.length} ${filteredPlants.length === 1 ? 'planta compartilhada' : 'plantas compartilhadas'} pela comunidade`
                  : `${filteredPlants.length} ${filteredPlants.length === 1 ? 'planta encontrada' : 'plantas encontradas'} na sua coleção`
                }
              </p>
            </div>
          </div>
          
          {/* Barra de pesquisa */}
          <div style={{
            marginTop: 16,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              padding: '0 12px',
              marginBottom: 16,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Digite o nome da planta (ex: Rosa, Girassol)..."
                onChange={(e) => { searchTextRef.current = e.target.value; }}
                onKeyPress={(e) => { if (e.key === 'Enter') searchPlant(); }}
                style={{
                  flex: 1,
                  height: 50,
                  fontSize: 16,
                  color: '#1E293B',
                  border: 'none',
                  backgroundColor: 'transparent',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <button
                onClick={searchPlant}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#22C55E',
                  padding: '14px 0',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>
                  Buscar
                </span>
              </button>
              <button
                onClick={fetchAllPlants}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#DCFCE7',
                  padding: '14px 0',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <span style={{ color: '#16A34A', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>
                  Ver Todas
                </span>
              </button>
            </div>
          </div>
        </div>

        {initialMode === 'personal' && viewMode === 'personal' && (
            <div style={{
              display: 'flex',
              backgroundColor: Colors.background.secondary,
              borderRadius: BorderRadius.lg,
              padding: 4,
              marginTop: Spacing.md,
              marginBottom: Spacing.sm,
              marginLeft: Spacing.lg,
              marginRight: Spacing.lg,
            }}>
              <button
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 12px',
                  borderRadius: BorderRadius.md,
                  backgroundColor: Colors.background.primary,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={Colors.primary[500]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: Colors.primary[500], 
                  marginLeft: 6,
                }}>
                  Minhas Plantas
                </span>
              </button>
              
              <button
                onClick={toggleViewMode}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 12px',
                  borderRadius: BorderRadius.md,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={Colors.text.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span style={{ 
                  fontSize: 14, 
                  fontWeight: 500, 
                  color: Colors.text.tertiary, 
                  marginLeft: 6,
                }}>
                  Comunidade
                </span>
              </button>
            </div>
          )}

        {/* Lista de plantas */}
        <div style={{ padding: `0 ${Spacing.lg}px ${Spacing['2xl']}px` }}>
          {filteredPlants.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: Spacing.xl,
            }}>
              {viewMode === 'personal' ? (
                <>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={Colors.neutral[300]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <p style={{ 
                    fontSize: 24, 
                    fontWeight: 'bold', 
                    textAlign: 'center', 
                    marginTop: Spacing.lg,
                    color: Colors.text.secondary,
                  }}>
                    Nenhuma planta na sua coleção
                  </p>
                  <p style={{ 
                    fontSize: 16, 
                    textAlign: 'center', 
                    marginTop: Spacing.sm,
                    marginBottom: Spacing.xl,
                    color: Colors.text.tertiary,
                  }}>
                    Adicione sua primeira planta para começar!
                  </p>
                  <button
                    onClick={() => navigate('/photo')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: Colors.primary[500],
                      borderRadius: BorderRadius.full,
                      padding: `${Spacing.lg}px ${Spacing.xl}px`,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={Colors.text.inverse} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span style={{ 
                      fontSize: 16, 
                      fontWeight: 600, 
                      color: Colors.text.inverse, 
                      marginLeft: Spacing.sm,
                    }}>
                      Identificar Planta
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={Colors.neutral[300]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <p style={{ 
                    fontSize: 24, 
                    fontWeight: 'bold', 
                    textAlign: 'center', 
                    marginTop: Spacing.lg,
                    color: Colors.text.secondary,
                  }}>
                    Comunidade vazia
                  </p>
                  <p style={{ 
                    fontSize: 16, 
                    textAlign: 'center', 
                    marginTop: Spacing.sm,
                    marginBottom: Spacing.xl,
                    color: Colors.text.tertiary,
                  }}>
                    Seja o primeiro a compartilhar uma planta!
                  </p>
                  <button
                    onClick={() => navigate('/photo')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: Colors.primary[500],
                      borderRadius: BorderRadius.full,
                      padding: `${Spacing.lg}px ${Spacing.xl}px`,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={Colors.text.inverse} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span style={{ 
                      fontSize: 16, 
                      fontWeight: 600, 
                      color: Colors.text.inverse, 
                      marginLeft: Spacing.sm,
                    }}>
                      Identificar Planta
                    </span>
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredPlants.map((plant) => <PlantItem key={plant.id} item={plant} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantGallery;
