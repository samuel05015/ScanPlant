import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
}

interface ProfileImage {
  uri: string;
  base64?: string;
  mimeType?: string;
}

const PROFILE_IMAGE_SIZE = 512;

const prepareProfileImage = (file: File): Promise<ProfileImage> => {
  return new Promise((resolve, reject) => {
    if (file.type && !file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
        const sourceX = (image.naturalWidth - sourceSize) / 2;
        const sourceY = (image.naturalHeight - sourceSize) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = PROFILE_IMAGE_SIZE;
        canvas.height = PROFILE_IMAGE_SIZE;

        const context = canvas.getContext('2d');
        if (!context) throw new Error('Não foi possível processar a imagem.');

        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          PROFILE_IMAGE_SIZE,
          PROFILE_IMAGE_SIZE
        );

        const uri = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = uri.split(',')[1];
        if (!base64) throw new Error('Não foi possível converter a imagem.');

        resolve({ uri, base64, mimeType: 'image/jpeg' });
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Formato de imagem não suportado.'));
    };

    image.src = objectUrl;
  });
};

const ProfileSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<ProfileImage | null>(null);
  const [userData, setUserData] = useState<UserData>({
    id: '',
    name: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [initialUserData, setInitialUserData] = useState<UserData>({
    id: '',
    name: '',
    email: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: authData, error: authError } = await auth.getCurrentUser();
      
      console.log('Auth data:', authData);
      
      if (authError || !authData?.user) {
        console.error('Auth error:', authError);
        navigate('/login');
        return;
      }

      // O backend já retorna os dados do perfil no /auth/me
      const user = authData.user;
      
      const userData = {
        id: user.id || '',
        name: user.name || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || ''
      };

      console.log('Setting userData:', userData);

      setUserData(userData);
      setInitialUserData(userData);

      // Verificar avatar URL
      const avatarUrl = user.avatarUrl || user.AvatarUrl || user.avatar_url || user.avatar;
      console.log('Avatar URL found:', avatarUrl);
      
      if (avatarUrl) {
        setProfileImage({ uri: avatarUrl });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        setProfileImage(await prepareProfileImage(file));
      } catch (error) {
        console.error('Error preparing profile image:', error);
        alert(error instanceof Error ? error.message : 'Não foi possível selecionar a imagem.');
      }
    };
    
    input.click();
  };

  const hasChanges = (): boolean => {
    return (
      userData.name !== initialUserData.name ||
      userData.phone !== initialUserData.phone ||
      userData.bio !== initialUserData.bio ||
      (profileImage?.base64 !== undefined)
    );
  };

  const saveChanges = async () => {
    if (!hasChanges()) return;

    try {
      setLoading(true);

      const updateData: any = {
        name: userData.name.trim(),
        phone: userData.phone.trim() || undefined,
        bio: userData.bio
      };

      if (profileImage?.base64 && profileImage?.mimeType) {
        updateData.avatar_url = `data:${profileImage.mimeType};base64,${profileImage.base64}`;
      }

      console.log('Updating profile with:', updateData);

      const { data, error } = await auth.updateProfile(updateData);

      if (error) {
        console.error('Error updating profile:', error);
        alert('Erro ao salvar alterações: ' + error.message);
        return;
      }

      console.log('Profile updated successfully:', data);

      setInitialUserData(userData);
      if (profileImage?.base64) {
        const savedAvatar = data?.avatarUrl || data?.AvatarUrl || profileImage.uri;
        setProfileImage({ uri: savedAvatar });
      }

      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Erro ao salvar alterações');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (hasChanges()) {
      const confirm = window.confirm('Você tem alterações não salvas. Deseja sair mesmo assim?');
      if (!confirm) return;
    }
    navigate(-1);
  };

  const handleLogout = async () => {
    const confirm = window.confirm('Tem certeza que deseja sair?');
    if (!confirm) return;

    try {
      await auth.signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0]?.toUpperCase() || '?';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#ffffff'
      }}>
        <button
          onClick={handleBack}
          style={{
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <h1 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1a1a1a',
          margin: 0
        }}>
          Configurações de Perfil
        </h1>
        
        <div style={{ width: '24px' }} />
      </div>

      <div style={{
        overflowY: 'auto',
        height: 'calc(100vh - 64px)',
        paddingBottom: '48px'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '32px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#22c55e',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '32px'
            }}>
              <div style={{
                position: 'relative',
                marginBottom: '16px'
              }}>
                {profileImage?.uri ? (
                  <img
                    src={profileImage.uri}
                    alt="Avatar"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50px',
                      objectFit: 'cover',
                      backgroundColor: '#e5e7eb'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50px',
                    backgroundColor: '#e5e7eb',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '48px',
                      fontWeight: '600',
                      color: '#9ca3af'
                    }}>
                      {getInitials(userData.name)}
                    </span>
                  </div>
                )}
                
                <button
                  onClick={pickImage}
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    backgroundColor: '#22c55e',
                    width: '36px',
                    height: '36px',
                    borderRadius: '18px',
                    border: '2px solid #ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
              </div>
              
              <span style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Toque para alterar a foto
              </span>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              margin: '0 24px 32px 24px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '24px',
                marginTop: 0
              }}>
                Informações pessoais
              </h2>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Nome
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  height: '48px',
                  backgroundColor: '#ffffff',
                  paddingLeft: '16px',
                  paddingRight: '16px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ marginRight: '12px' }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    type="text"
                    value={userData.name}
                    onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu nome"
                    maxLength={120}
                    style={{
                      flex: 1,
                      height: '44px',
                      border: 'none',
                      outline: 'none',
                      fontSize: '16px',
                      color: '#1a1a1a',
                      backgroundColor: 'transparent'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Email
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  height: '48px',
                  backgroundColor: '#f9fafb',
                  paddingLeft: '16px',
                  paddingRight: '16px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ marginRight: '12px' }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    type="email"
                    value={userData.email}
                    disabled
                    style={{
                      flex: 1,
                      height: '44px',
                      border: 'none',
                      outline: 'none',
                      fontSize: '16px',
                      color: '#9ca3af',
                      backgroundColor: 'transparent'
                    }}
                  />
                </div>
                <span style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  marginTop: '8px',
                  display: 'block'
                }}>
                  O email não pode ser alterado
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Telefone
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  height: '48px',
                  backgroundColor: '#ffffff',
                  paddingLeft: '16px',
                  paddingRight: '16px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ marginRight: '12px' }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <input
                    type="tel"
                    value={userData.phone}
                    onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Seu telefone"
                    maxLength={30}
                    style={{
                      flex: 1,
                      height: '44px',
                      border: 'none',
                      outline: 'none',
                      fontSize: '16px',
                      color: '#1a1a1a',
                      backgroundColor: 'transparent'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Bio
                </label>
                <div style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  height: '100px',
                  backgroundColor: '#ffffff',
                  padding: '8px 16px'
                }}>
                  <textarea
                    value={userData.bio}
                    onChange={(e) => setUserData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    maxLength={1000}
                    style={{
                      width: '100%',
                      height: '90px',
                      border: 'none',
                      outline: 'none',
                      fontSize: '16px',
                      color: '#1a1a1a',
                      backgroundColor: 'transparent',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{
              padding: '0 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginTop: '16px'
            }}>
              <button
                onClick={saveChanges}
                disabled={!hasChanges()}
                style={{
                  width: '100%',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: hasChanges() ? '#d1d5db' : '#f3f4f6',
                  color: hasChanges() ? '#6b7280' : '#9ca3af',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: hasChanges() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  opacity: hasChanges() ? 1 : 0.6
                }}
              >
                Salvar Alterações
              </button>

              <button
                onClick={() => navigate('/chats')}
                style={{
                  width: '100%',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: '#22c55e',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Minhas Conversas
              </button>

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  color: '#ef4444',
                  border: '2px solid #ef4444',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Sair da conta
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProfileSettingsScreen;
