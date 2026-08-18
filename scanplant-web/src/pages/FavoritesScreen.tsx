import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../api';
import { getFavoritePlantIds, toggleFavoritePlant } from '../favorites';
import { Icons } from '../components/Icons';

const Colors = {
  primary: { 50: '#F0FDF4', 100: '#DCFCE7', 500: '#22C55E', 600: '#16A34A' },
  text: { primary: '#1E293B', secondary: '#475569', tertiary: '#94A3B8', inverse: '#FFFFFF' },
  background: { primary: '#FFFFFF', secondary: '#F8FAFC' },
  neutral: { 200: '#E2E8F0', 300: '#CBD5E1' },
  danger: '#EF4444',
};

const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 };
const BorderRadius = { md: 8, lg: 12, xl: 16, full: 9999 };

interface Plant {
  id: string;
  common_name: string;
  scientific_name: string;
  image_data: string;
  city?: string;
  user_id: string;
  reminder_enabled?: boolean;
  watering_frequency_days?: number;
}

const resolveImageSource = (imageData: string) => {
  if (!imageData) return '/placeholder.png';
  if (imageData.startsWith('data:image')) return imageData;
  if (imageData.startsWith('http')) return imageData;
  return '/placeholder.png';
};

export default function FavoritesScreen() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        if (!currentUser?.data?.user?.id) {
          navigate('/login');
          return;
        }

        const currentUserId = currentUser.data.user.id;
        const storedFavoriteIds = getFavoritePlantIds(currentUserId);
        setUserId(currentUserId);
        setFavoriteIds(storedFavoriteIds);

        const [myPlantsResult, communityPlantsResult] = await Promise.all([
          database.select('plants', '*', { user_id: currentUserId }),
          database.select('plants'),
        ]);

        const plantsById = new Map<string, Plant>();
        [...(myPlantsResult.data || []), ...(communityPlantsResult.data || [])].forEach((plant: Plant) => {
          plantsById.set(String(plant.id), plant);
        });

        const allPlants = Array.from(plantsById.values());
        const favoritePlants = allPlants.filter((plant) => storedFavoriteIds.includes(String(plant.id)));
        setPlants(favoritePlants.reverse());
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [navigate]);

  const removeFavorite = (plantId: string) => {
    const nextFavoriteIds = toggleFavoritePlant(plantId, userId);
    setFavoriteIds(nextFavoriteIds);
    setPlants((currentPlants) => currentPlants.filter((plant) => String(plant.id) !== String(plantId)));
  };

  const FavoritePlantItem = ({ plant }: { plant: Plant }) => (
    <div
      onClick={() => navigate(`/plant/${plant.id}`, { state: { plant } })}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter') navigate(`/plant/${plant.id}`, { state: { plant } });
      }}
      style={{
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.lg,
        boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        border: `1px solid ${Colors.neutral[200]}`,
        cursor: 'pointer',
      }}
    >
      <img
        src={resolveImageSource(plant.image_data)}
        alt={plant.common_name || 'Planta favorita'}
        style={{ width: 104, height: 124, objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ flex: 1, padding: Spacing.lg, minWidth: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: Colors.primary[600], margin: 0 }}>
          {plant.common_name || 'Nome nao disponivel'}
        </p>
        <p
          style={{
            fontSize: 13,
            fontStyle: 'italic',
            color: Colors.text.secondary,
            margin: `${Spacing.xs}px 0 ${Spacing.md}px`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {plant.scientific_name || 'Nome cientifico nao disponivel'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', color: Colors.text.tertiary, fontSize: 13 }}>
          <Icons.MapPin size={14} />
          <span style={{ marginLeft: Spacing.xs }}>{plant.city || 'Local nao disponivel'}</span>
        </div>
        {plant.reminder_enabled && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: Colors.primary[50],
              color: Colors.primary[600],
              borderRadius: BorderRadius.full,
              padding: `${Spacing.xs}px ${Spacing.sm}px`,
              marginTop: Spacing.sm,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Icons.Droplet size={13} />
            <span style={{ marginLeft: Spacing.xs }}>
              {`Rega a cada ${plant.watering_frequency_days || '?'} dia(s)`}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={(event) => {
          event.stopPropagation();
          removeFavorite(plant.id);
        }}
        aria-label="Remover dos favoritos"
        title="Remover dos favoritos"
        style={{
          width: 42,
          height: 42,
          borderRadius: BorderRadius.full,
          backgroundColor: '#FEF3C7',
          color: '#F59E0B',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          marginRight: Spacing.md,
          flexShrink: 0,
        }}
      >
        <Icons.Star size={22} fill="currentColor" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: Colors.background.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: Colors.text.secondary, fontSize: 16 }}>Carregando favoritos...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: Colors.background.secondary }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', minHeight: '100vh', backgroundColor: Colors.background.secondary }}>
        <div style={{ padding: `${Spacing['2xl']}px ${Spacing.lg}px ${Spacing.xl}px` }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => navigate(-1)}
              aria-label="Voltar"
              style={{
                width: 44,
                height: 44,
                borderRadius: BorderRadius.full,
                backgroundColor: Colors.background.primary,
                border: 'none',
                boxShadow: '0 4px 8px rgba(15, 23, 42, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginRight: Spacing.md,
              }}
            >
              <Icons.ArrowLeft size={24} color={Colors.text.secondary} />
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: Colors.text.primary, margin: 0 }}>
                Favoritos
              </h1>
              <p style={{ fontSize: 16, color: Colors.text.secondary, margin: `${Spacing.xs}px 0 0` }}>
                {favoriteIds.length === 1 ? '1 planta favoritada' : `${favoriteIds.length} plantas favoritadas`}
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: `0 ${Spacing.lg}px ${Spacing['2xl']}px` }}>
          {plants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${Spacing['2xl']}px ${Spacing.lg}px` }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: BorderRadius.full,
                  backgroundColor: Colors.primary[100],
                  color: Colors.primary[600],
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icons.Star size={34} />
              </div>
              <h2 style={{ fontSize: 22, color: Colors.text.primary, margin: `${Spacing.lg}px 0 ${Spacing.sm}px` }}>
                Nenhuma favorita ainda
              </h2>
              <p style={{ fontSize: 15, color: Colors.text.secondary, lineHeight: '22px', margin: `0 0 ${Spacing.xl}px` }}>
                Toque na estrela de uma planta para guardar suas preferidas aqui.
              </p>
              <button
                onClick={() => navigate('/gallery?mode=personal')}
                style={{
                  backgroundColor: Colors.primary[500],
                  color: Colors.text.inverse,
                  border: 'none',
                  borderRadius: BorderRadius.full,
                  padding: `${Spacing.md}px ${Spacing.xl}px`,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                Ver minhas plantas
              </button>
            </div>
          ) : (
            plants.map((plant) => <FavoritePlantItem key={plant.id} plant={plant} />)
          )}
        </div>
      </div>
    </div>
  );
}
