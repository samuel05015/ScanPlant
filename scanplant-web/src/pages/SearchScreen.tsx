import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../api';

const Colors = {
  primary: { 500: '#22c55e', 600: '#16a34a' },
  text: { primary: '#1E293B', secondary: '#475569', tertiary: '#94A3B8', inverse: '#FFFFFF' },
  background: { primary: '#FFFFFF', secondary: '#F8FAFC' },
  neutral: { 300: '#CBD5E1' },
};

const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 };
const BorderRadius = { md: 8, lg: 12 };

interface Plant {
  id: number;
  common_name: string;
  scientific_name: string;
  image_data: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  is_location_public?: boolean;
}

const SearchScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState('common_name');
  const [plants, setPlants] = useState<Plant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTextRef = useRef('');

  useEffect(() => {
    fetchAllPlants();
  }, []);

  const fetchAllPlants = async () => {
    try {
      setLoading(true);
      const result = await database.select('plants');
      const data = result.data || [];
      const sortedData = data.sort((a, b) => b.id - a.id);
      setPlants(sortedData);
      setFilteredPlants(sortedData);
    } catch (error) {
      console.error('Erro ao carregar plantas:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPlant = (searchTerm?: string) => {
    const term = (searchTerm !== undefined ? searchTerm : searchTextRef.current).toLowerCase().trim();
    if (!term) {
      setFilteredPlants(plants);
      return;
    }

    const filtered = plants.filter((plant) => {
      let value = '';
      if (searchType === 'common_name') {
        value = (plant.common_name || '').toLowerCase();
      } else if (searchType === 'scientific_name') {
        value = (plant.scientific_name || '').toLowerCase();
      } else if (searchType === 'city') {
        value = plant.is_location_public ? (plant.city || '').toLowerCase() : '';
      }
      return value.includes(term);
    });

    setFilteredPlants(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    searchTextRef.current = value;
    searchPlant(value);
  };

  const resolveImageSource = (imageData: string) => {
    if (!imageData) return '/placeholder.png';
    if (imageData.startsWith('data:image')) return imageData;
    if (imageData.startsWith('http')) return imageData;
    return '/placeholder.png';
  };

  const openPlantInMap = (plant: Plant) => {
    if (plant.is_location_public && plant.latitude && plant.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${plant.latitude},${plant.longitude}`;
      window.open(url, '_blank');
    }
  };

  const PlantListItem: React.FC<{ item: Plant }> = ({ item }) => (
    <div
      onClick={() => openPlantInMap(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.primary,
        padding: 12,
        borderRadius: BorderRadius.lg,
        marginBottom: 12,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
        border: '1px solid #f1f5f9',
        display: 'flex',
        gap: 12,
        cursor: item.is_location_public ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.05)';
      }}
    >
      <img
        src={resolveImageSource(item.image_data)}
        style={{
          width: 60,
          height: 60,
          borderRadius: BorderRadius.md,
          backgroundColor: '#e2e8f0',
          objectFit: 'cover',
        }}
        alt={item.common_name}
      />
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: Colors.text.primary,
            margin: 0,
          }}
        >
          {item.common_name || 'Nome não disponível'}
        </p>
        <p
          style={{
            fontSize: 14,
            color: '#94A3B8',
            fontStyle: 'italic',
            margin: 0,
          }}
        >
          {item.scientific_name || 'Nome científico não disponível'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={Colors.text.secondary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span
            style={{
              fontSize: 14,
              color: Colors.text.secondary,
              marginLeft: 4,
            }}
          >
            {item.is_location_public ? (item.city || 'Local não disponível') : 'Localização privada'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: Colors.background.secondary }}>
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          backgroundColor: Colors.background.secondary,
          minHeight: '100vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            flexDirection: 'row',
            paddingVertical: 24,
            paddingHorizontal: 16,
            borderBottom: '1px solid #f1f5f9',
            alignItems: 'flex-start',
            display: 'flex',
            padding: '24px 16px',
            backgroundColor: Colors.background.secondary,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: '#F1F5F9',
              marginRight: 12,
              marginTop: 4,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={Colors.text.secondary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div style={{ flex: 1, alignItems: 'center', textAlign: 'center' }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: Colors.text.primary,
                marginTop: 8,
                margin: 0,
              }}
            >
              Explorar Plantas
            </h1>
            <p style={{ fontSize: 16, color: Colors.text.secondary, margin: 0 }}>
              Busque por nome ou localização
            </p>
          </div>
        </div>

        {/* Search Container */}
        <div
          style={{
            margin: 16,
            backgroundColor: Colors.background.primary,
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9',
          }}
        >
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              marginBottom: 12,
              justifyContent: 'center',
            }}
          >
            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                searchPlant(searchTextRef.current);
              }}
              style={{
                height: 50,
                color: Colors.text.primary,
                padding: '0 12px',
                fontSize: 16,
                border: 'none',
                backgroundColor: 'transparent',
                width: '100%',
                outline: 'none',
              }}
            >
              <option value="common_name">Nome Comum</option>
              <option value="scientific_name">Nome Científico</option>
              <option value="city">Cidade</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              paddingLeft: 12,
              paddingRight: 12,
              marginBottom: 16,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 8 }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Digite sua busca..."
              onChange={handleSearchChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') searchPlant();
              }}
              style={{
                flex: 1,
                height: 50,
                fontSize: 16,
                color: Colors.text.primary,
                border: 'none',
                backgroundColor: 'transparent',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={searchPlant}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#22C55E',
                paddingTop: 14,
                paddingBottom: 14,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span
                style={{
                  color: Colors.text.inverse,
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginLeft: 8,
                }}
              >
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
                paddingTop: 14,
                paddingBottom: 14,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16A34A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span
                style={{
                  color: '#16A34A',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginLeft: 8,
                }}
              >
                Ver Todas
              </span>
            </button>
          </div>
        </div>

        {/* Plant List */}
        <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 24 }}>
          {loading ? (
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  border: '4px solid #C8E6C9',
                  borderTop: '4px solid #22c55e',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }}
              />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : filteredPlants.length === 0 ? (
            <div
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 24,
                marginTop: 50,
                textAlign: 'center',
              }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke={Colors.neutral[300]}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ margin: '0 auto' }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <p
                style={{
                  marginTop: 16,
                  fontSize: 16,
                  color: Colors.text.secondary,
                  textAlign: 'center',
                }}
              >
                Nenhuma planta encontrada
              </p>
            </div>
          ) : (
            filteredPlants.map((plant) => <PlantListItem key={plant.id} item={plant} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchScreen;
