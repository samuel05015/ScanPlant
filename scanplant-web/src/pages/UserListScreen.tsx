import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, chats } from '../api';

const Colors = {
    primary: { 500: '#22c55e', 100: '#dcfce7' },
    text: { primary: '#1E293B', secondary: '#475569', tertiary: '#94A3B8' },
    background: { primary: '#FFFFFF', secondary: '#F8FAFC' },
};

export default function UserListScreen() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data: currentUser } = await auth.getCurrentUser();
            const { data } = await auth.getUsers();
            console.log('Usuários carregados:', data);
            if(data) {
                setUsers(data.filter((u: any) => u.id !== (currentUser?.user?.id || currentUser?.id)));
            }
            setLoading(false);
        };
        load();
    }, []);

    const startChat = async (userId: string) => {
        const { data } = await chats.createOrGet(userId);
        if(data) navigate(`/chat/${data.id}`);
    };

    const resolveImageSource = (user: any) => {
        // Tentar vários campos possíveis
        const imageData = user.avatarUrl || user.AvatarUrl || user.avatar_url || user.avatar || user.profileImage;
        console.log('Resolvendo imagem do usuário:', user.name, 'Campos:', { 
            avatarUrl: user.avatarUrl,
            AvatarUrl: user.AvatarUrl, 
            avatar_url: user.avatar_url,
            avatar: user.avatar 
        });
        
        if (!imageData) return '/placeholder.png';
        if (typeof imageData === 'string') {
            if (imageData.startsWith('data:image')) return imageData;
            if (imageData.startsWith('http')) return imageData;
        }
        return '/placeholder.png';
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: Colors.background.secondary }}>
            <div style={{ maxWidth: 1180, margin: '0 auto', backgroundColor: Colors.background.secondary, minHeight: '100vh' }}>
                {/* Header */}
                <header style={{
                    backgroundColor: Colors.background.primary,
                    padding: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                }}>
                    <button 
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 8,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={Colors.text.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                    </button>
                    <h1 style={{ fontWeight: 'bold', fontSize: 18, color: Colors.text.primary, margin: 0 }}>Nova Conversa</h1>
                </header>

                {/* Lista de usuários */}
                <div style={{ padding: 16 }}>
                    {loading ? (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            padding: 40,
                        }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                border: `4px solid ${Colors.primary[100]}`,
                                borderTop: `4px solid ${Colors.primary[500]}`,
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                            }} />
                            <style>{`
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `}</style>
                        </div>
                    ) : users.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: 40,
                            color: Colors.text.secondary,
                        }}>
                            Nenhum usuário encontrado
                        </div>
                    ) : (
                        users.map(user => (
                            <div 
                                key={user.id} 
                                onClick={() => startChat(user.id)} 
                                style={{
                                    backgroundColor: Colors.background.primary,
                                    padding: 16,
                                    borderRadius: 12,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    marginBottom: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = Colors.background.secondary;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = Colors.background.primary;
                                }}
                            >
                                <img 
                                    src={resolveImageSource(user)} 
                                    style={{ 
                                        width: 50, 
                                        height: 50, 
                                        borderRadius: '50%', 
                                        objectFit: 'cover',
                                        backgroundColor: Colors.primary[100],
                                    }}
                                    alt={user.name}
                                    onError={(e) => {
                                        console.error('Erro ao carregar imagem do usuário:', user.name);
                                        (e.target as HTMLImageElement).src = '/placeholder.png';
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ 
                                        fontWeight: 'bold', 
                                        fontSize: 16,
                                        color: Colors.text.primary,
                                        margin: 0,
                                        marginBottom: 4,
                                    }}>
                                        {user.name || 'Usuário'}
                                    </h3>
                                    <p style={{ 
                                        fontSize: 14, 
                                        color: Colors.text.tertiary,
                                        margin: 0,
                                    }}>
                                        {user.bio || 'Entusiasta de plantas'}
                                    </p>
                                </div>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={Colors.text.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
