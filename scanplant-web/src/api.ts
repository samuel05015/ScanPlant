
import { API_CONFIG } from './apiConfig';

const TOKEN_KEY = '@scanplant_token';

const getApiErrorMessage = (data: any, status: number) => {
  const validationErrors = data?.errors;

  if (validationErrors && typeof validationErrors === 'object') {
    const messages = Object.values(validationErrors)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    if (messages.length > 0) return messages.join(' ');
  }

  return data?.message || data?.error || data?.title || `Erro ${status}`;
};

const isTokenExpired = (token: string) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    return typeof decoded.exp !== 'number' || decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const saveToken = (token: string) => {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Erro ao salvar token:', error);
  }
};

export const getToken = () => {
  try {
    const sessionToken = sessionStorage.getItem(TOKEN_KEY);
    if (sessionToken) {
      if (isTokenExpired(sessionToken)) {
        removeToken();
        return null;
      }
      return sessionToken;
    }

    const legacyToken = localStorage.getItem(TOKEN_KEY);
    if (legacyToken) {
      if (isTokenExpired(legacyToken)) {
        removeToken();
        return null;
      }
      sessionStorage.setItem(TOKEN_KEY, legacyToken);
      localStorage.removeItem(TOKEN_KEY);
    }
    return legacyToken;
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return null;
  }
};

export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Erro ao remover token:', error);
  }
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // On web, we default to the configured URL. 
  // Discovery logic is less relevant for web apps hosted on a domain, 
  // but if running locally, we assume the user knows the IP or uses localhost.
  const currentApiUrl = API_CONFIG.BASE_URL; 
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const fullUrl = `${currentApiUrl}${endpoint}`;
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      // Try parsing as JSON anyway, sometimes headers are wrong
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      if (response.status === 401) removeToken();
      const errorMessage = getApiErrorMessage(data, response.status);
      return { data: null, error: { message: errorMessage, status: response.status, details: data } };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return { data: null, error: { message: error.message || 'Erro de conexão.' } };
  }
};

export const plantIdentification = {
  identify: async (image: string) => apiRequest('/plant-identification', {
    method: 'POST',
    body: JSON.stringify({ image }),
  }),
};

export const plantAssistant = {
  ask: async (question: string) => apiRequest('/plant-assistant', {
    method: 'POST',
    body: JSON.stringify({ question }),
  }),
};

export const auth = {
  signUp: async (email, password, name = '') => {
    const { data, error } = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (data?.token) saveToken(data.token);
    return { data, error };
  },

  signIn: async (email, password) => {
    const { data, error } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.token) {
      saveToken(data.token);
      // Marcar que o usuário fez login pela primeira vez
      const hasSeenInstructions = localStorage.getItem('@scanplant_seen_instructions');
      if (!hasSeenInstructions) {
        localStorage.setItem('@scanplant_first_login', 'true');
      }
    }
    return { data, error };
  },

  signOut: async () => {
    removeToken();
    return { error: null };
  },

  getCurrentUser: async () => {
    const token = getToken();
    if (!token) return { data: null, error: { message: 'Não autenticado' } };
    const { data, error } = await apiRequest('/auth/me', { method: 'GET' });
    return { data: { user: data }, error };
  },

  getUsers: async () => {
    return await apiRequest('/auth/users', { method: 'GET' });
  },
  
  getUserById: async (id) => {
    return await apiRequest(`/auth/users/${id}`, { method: 'GET' });
  },

  updateProfile: async (profileData) => {
      // PascalCase mapping for C# backend
      const pascalData = {
        Name: profileData.name,
        // Phone is optional. ASP.NET's PhoneAttribute rejects an empty string,
        // so omit it when the user has not provided a number.
        Phone: typeof profileData.phone === 'string' && profileData.phone.trim()
          ? profileData.phone.trim()
          : undefined,
        Bio: profileData.bio,
        AvatarUrl: profileData.avatar_url,
        ExperienceLevel: profileData.experience_level,
        PlantPreference: profileData.plant_preference,
        City: profileData.city,
      };
      return await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(pascalData),
      });
  }
};

export const database = {
  insert: async (table, data) => {
    if (table !== 'plants') return { data: null, error: { message: 'Tabela não suportada' } };

    const plantData = {
      ScientificName: data.scientific_name,
      CommonName: data.common_name,
      Family: data.family,
      Genus: data.genus,
      WikiDescription: data.wiki_description,
      CareInstructions: data.care_instructions,
      ToxicityStatus: data.toxicity_status,
      ToxicityNote: data.toxicity_note,
      EdibilityStatus: data.edibility_status,
      EdibilityNote: data.edibility_note,
      EdibleParts: data.edible_parts,
      LegalStatus: data.legal_status,
      LegalNote: data.legal_note,
      SafetyAssessmentOrigin: data.safety_assessment_origin,
      SafetyAssessedAt: data.safety_assessed_at,
      SafetySources: data.safety_sources,
      SafetyDisclaimer: data.safety_disclaimer,
      ImageData: data.image_data,
      Latitude: data.latitude,
      Longitude: data.longitude,
      City: data.city,
      LocationName: data.location_name,
      WateringFrequencyDays: data.watering_frequency_days,
      WateringFrequencyText: data.watering_frequency_text,
      ReminderEnabled: data.reminder_enabled || false,
      Notes: data.notes,
      IsLocationPublic: data.is_location_public || false,
      IsInCommunity: data.is_in_community || false,
    };

    return await apiRequest('/plants', {
      method: 'POST',
      body: JSON.stringify(plantData),
    });
  },

  select: async (table, columns = '*', filters: any = {}) => {
    if (table === 'plants') {
      const userId = filters.user_id || filters.eq?.user_id;
      const plantId = filters.id || filters.eq?.id;
      let endpoint = '/plants';
      if (plantId) endpoint = `/plants/${plantId}`;
      else if (userId === 'current') endpoint = '/plants/my';
      else if (userId) endpoint = `/plants/user/${userId}`;
      
      const response = await apiRequest(endpoint, { method: 'GET' });
      
      // Map PascalCase to snake_case for frontend
      const mapPlant = (plant: any) => ({
          id: String(plant.id), // Garantir que ID seja string (Guid)
          scientific_name: plant.scientificName,
          common_name: plant.commonName,
          family: plant.family,
          genus: plant.genus,
          wiki_description: plant.wikiDescription,
          care_instructions: plant.careInstructions,
          toxicity_status: plant.toxicityStatus,
          toxicity_note: plant.toxicityNote,
          edibility_status: plant.edibilityStatus,
          edibility_note: plant.edibilityNote,
          edible_parts: plant.edibleParts || [],
          legal_status: plant.legalStatus,
          legal_note: plant.legalNote,
          safety_assessment_origin: plant.safetyAssessmentOrigin,
          safety_assessed_at: plant.safetyAssessedAt,
          safety_sources: plant.safetySources || [],
          safety_disclaimer: plant.safetyDisclaimer,
          image_data: plant.imageData,
          latitude: plant.latitude,
          longitude: plant.longitude,
          city: plant.city,
          location_name: plant.locationName,
          watering_frequency_days: plant.wateringFrequencyDays,
          watering_frequency_text: plant.wateringFrequencyText,
          reminder_enabled: plant.reminderEnabled,
          notes: plant.notes,
          user_id: plant.userId,
          is_location_public: plant.isLocationPublic,
          is_in_community: plant.isInCommunity,
          created_at: plant.createdAt,
        });

      if (response.data && Array.isArray(response.data)) {
        response.data = response.data.map(mapPlant);
      } else if (response.data && plantId) {
        response.data = [mapPlant(response.data)];
      }
      return response;
    } else if (table === 'profiles') {
       // Profile fetching logic
       const userId = filters.id || filters.eq?.id;
       if(userId) {
          const response = await apiRequest(`/auth/users/${userId}`, { method: 'GET' });
          if(response.data) {
             const user = response.data;
             response.data = {
                 id: user.id,
                 email: user.email,
                 name: user.name,
                 phone: user.phone,
                 bio: user.bio,
                 avatar_url: user.avatarUrl,
                 city: user.city
             }
          }
          return response;
       }
    }
    return { data: null, error: { message: 'Tabela não suportada' } };
  },
  
  update: async (table, data, filters: any) => {
      // Basic update logic stub
      return { data: null, error: null } 
  },
  delete: async (table, filters: any) => {
      const id = filters.id || filters.eq?.id;
      if(table === 'plants' && id) {
          return await apiRequest(`/plants/${id}`, { method: 'DELETE' });
      }
      return { data: null, error: null }
  }
};

export const chats = {
  createOrGet: async (otherUserId) => {
    return await apiRequest('/chats', {
      method: 'POST',
      body: JSON.stringify({ otherUserId }),
    });
  },
  list: async () => {
    return await apiRequest('/chats', { method: 'GET' });
  },
};

export const messages = {
  send: async (chatId, content) => {
    return await apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify({ chatId, content }),
    });
  },
  list: async (chatId) => {
    return await apiRequest(`/messages/chat/${chatId}`, { method: 'GET' });
  },
};

// Supabase-like wrapper for compatibility
// This mimics the chainable interface of Supabase client
export const supabase = {
  auth,
  from: (table: string) => {
    let columns = '*';
    let filters: any = {};
    
    // The query execution function
    const execute = () => database.select(table, columns, filters);

    // The Builder object
    const builder = {
      select: (cols = '*') => {
        columns = cols;
        return builder;
      },
      eq: (field: string, value: any) => {
        if (!filters.eq) filters.eq = {};
        filters.eq[field] = value;
        return builder;
      },
      order: (field: string, options?: any) => {
        // Mock order, backend typically handles default or we don't impl sort here for now
        return builder;
      },
      single: async () => {
        const res = await execute();
        // Return single object or null
        return { 
          ...res, 
          data: (res.data && Array.isArray(res.data) && res.data.length > 0) ? res.data[0] : null 
        };
      },
      // Thenable interface implementation allows 'await supabase.from(...)'
      then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => {
        return execute().then(onfulfilled, onrejected);
      },
      insert: (data: any) => {
        return database.insert(table, data);
      },
      upsert: (data: any, options: any = {}) => {
        // Upsert wrapper
        const executeUpsert = async () => {
             if(table === 'profiles') return await auth.updateProfile(data);
             return { data: null, error: null };
        };
        // Return a builder that allows chaining .select()
        const upsertBuilder = {
             select: () => upsertBuilder,
             // Thenable for upsert
             then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => {
                 return executeUpsert().then(onfulfilled, onrejected);
             }
        };
        return upsertBuilder;
      },
      delete: () => ({
        eq: (field: string, value: any) => database.delete(table, { eq: { [field]: value } })
      })
    };
    return builder;
  },
};
