import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chats, auth } from '../api';

const Colors = {
  primary: { 50: '#E8F5E9', 100: '#C8E6C9', 400: '#66BB6A', 500: '#22c55e', 600: '#16a34a' },
  text: { primary: '#1E293B', secondary: '#475569', tertiary: '#94A3B8', inverse: '#FFFFFF' },
  background: { primary: '#FFFFFF', secondary: '#F8FAFC' },
  neutral: { 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1' },
};

const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 };
const BorderRadius = { md: 8, lg: 12 };

interface ChatItem {
  id: number;
  otherParticipant?: {
    id: string;
    name: string;
    avatar?: string;
  };
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isLastMessageFromMe: boolean;
}

interface CurrentUser {
  id: string;
  name: string;
}

const ChatListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [chatsList, setChatsList] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    loadChatsAndUser();
    const intervalId = setInterval(() => {
      loadChatsAndUser();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const loadChatsAndUser = async () => {
    try {
      const { data: userData } = await auth.getCurrentUser();
      console.log('Usuário atual:', userData);
      setCurrentUser(userData?.user || userData);

      const { data: chatsData, error } = await chats.list();
      console.log('Resposta chats.list():', { data: chatsData, error });
      
      if (error) {
        console.error('Erro na API de chats:', error);
        return;
      }

      if (!chatsData || !Array.isArray(chatsData)) {
        console.warn('chatsData não é um array:', chatsData);
        setChatsList([]);
        return;
      }
      
      const processedChats = chatsData.map((chat: any) => {
        console.log('Processando chat:', chat);
        const otherParticipant = chat.otherParticipant || {
          id: 'unknown',
          name: 'Usuário',
          avatar: null,
        };

        return {
          id: chat.id,
          otherParticipant,
          lastMessage: chat.lastMessage || '',
          lastMessageTime: chat.lastMessageTime || '',
          unreadCount: chat.unreadCount || 0,
          isLastMessageFromMe: chat.lastSenderId === (userData?.user?.id || userData?.id) || false,
        };
      });

      console.log('Chats processados:', processedChats);
      setChatsList(processedChats);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveImageSource = (imageData: string | null | undefined) => {
    console.log('Resolvendo imagem no ChatList, imageData recebido:', imageData);
    if (!imageData) return '/placeholder.png';
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image')) return imageData;
      if (imageData.startsWith('http')) return imageData;
    }
    return '/placeholder.png';
  };

  const truncateMessage = (text: string) => {
    if (text.length > 35) {
      return text.substring(0, 35) + '...';
    }
    return text;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    try {
      const messageDate = new Date(timeString);
      const today = new Date();
      
      if (messageDate.toDateString() === today.toDateString()) {
        return messageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } else {
        return messageDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }
    } catch {
      return '';
    }
  };

  const renderChatItem = (item: ChatItem) => {
    const displayName = item.otherParticipant?.name || 'Usuário';
    const displayAvatar = item.otherParticipant?.avatarUrl || item.otherParticipant?.AvatarUrl || item.otherParticipant?.avatar_url || item.otherParticipant?.avatar;
    const timeString = formatTime(item.lastMessageTime || '');

    return (
      <button
        key={item.id}
        onClick={() =>
          navigate(`/chat/${item.id}`, {
            state: {
              chatId: item.id,
              otherUserId: item.otherParticipant?.id,
              otherUserName: item.otherParticipant?.name,
            },
          })
        }
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingLeft: Spacing.lg,
          paddingRight: Spacing.lg,
          paddingTop: Spacing.md,
          paddingBottom: Spacing.md,
          borderBottom: `1px solid ${Colors.neutral[100]}`,
          backgroundColor: Colors.background.primary,
          marginLeft: Spacing.xs,
          marginRight: Spacing.xs,
          marginTop: Spacing.xs / 2,
          marginBottom: Spacing.xs / 2,
          borderRadius: BorderRadius.md,
          display: 'flex',
          border: 'none',
          width: 'calc(100% - 8px)',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <div style={{ position: 'relative', marginRight: Spacing.md }}>
          <img
            src={displayAvatar ? resolveImageSource(displayAvatar) : '/placeholder.png'}
            style={{ width: 50, height: 50, borderRadius: 25 }}
            alt={displayName}
          />
          {item.unreadCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: Colors.primary[500],
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: Colors.text.inverse,
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              >
                {item.unreadCount}
              </span>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 4,
              display: 'flex',
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: Colors.text.primary,
                flex: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName}
            </span>
            <span
              style={{
                fontSize: 13,
                color: Colors.text.tertiary,
                marginLeft: Spacing.sm,
              }}
            >
              {timeString}
            </span>
          </div>

          <div
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: Spacing.xs / 2,
              width: '100%',
              display: 'flex',
            }}
          >
            {item.lastMessage ? (
              <>
                {item.isLastMessageFromMe && (
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: Colors.text.secondary,
                      marginRight: 2,
                    }}
                  >
                    Você:{' '}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 15,
                    color:
                      item.unreadCount > 0 && !item.isLastMessageFromMe
                        ? Colors.text.primary
                        : Colors.text.secondary,
                    fontWeight:
                      item.unreadCount > 0 && !item.isLastMessageFromMe ? 600 : 400,
                    flex: 1,
                    marginRight: Spacing.xs,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {truncateMessage(item.lastMessage)}
                </span>
                {item.isLastMessageFromMe && item.unreadCount === 0 && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={Colors.primary[400]}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginLeft: 4 }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </>
            ) : (
              <span
                style={{
                  fontSize: 15,
                  color: Colors.text.secondary,
                  flex: 1,
                  marginRight: Spacing.xs,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Iniciar uma conversa...
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.background.primary,
          minHeight: '100vh',
          display: 'flex',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: `4px solid ${Colors.primary[100]}`,
            borderTop: `4px solid ${Colors.primary[500]}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
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
    <div style={{ minHeight: '100vh', backgroundColor: Colors.background.primary }}>
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          backgroundColor: Colors.background.primary,
          minHeight: '100vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: Spacing.lg,
            paddingRight: Spacing.lg,
            paddingTop: Spacing.md,
            paddingBottom: Spacing.md,
            borderBottom: `1px solid ${Colors.neutral[200]}`,
            display: 'flex',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: Spacing.xs,
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
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
          <h1
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: Colors.text.primary,
              margin: 0,
            }}
          >
            Conversas
          </h1>
          <button
            onClick={() => navigate('/users')}
            style={{
              padding: Spacing.xs,
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={Colors.primary[500]}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* Lista de conversas */}
        {chatsList.length === 0 ? (
          <div
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: Spacing.xl,
              paddingRight: Spacing.xl,
              paddingTop: 100,
              display: 'flex',
              flexDirection: 'column',
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
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: Colors.text.secondary,
                marginTop: Spacing.lg,
                textAlign: 'center',
              }}
            >
              Nenhuma conversa ainda
            </p>
            <p
              style={{
                fontSize: 16,
                color: Colors.text.tertiary,
                marginTop: Spacing.md,
                textAlign: 'center',
              }}
            >
              Inicie uma conversa com outro dono de plantas para trocar dicas e tirar dúvidas!
            </p>
            <button
              onClick={() => navigate('/user-list')}
              style={{
                marginTop: Spacing.xl,
                backgroundColor: Colors.primary[500],
                paddingLeft: Spacing.xl,
                paddingRight: Spacing.xl,
                paddingTop: Spacing.md,
                paddingBottom: Spacing.md,
                borderRadius: BorderRadius.lg,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: Colors.text.inverse,
                }}
              >
                Nova Conversa
              </span>
            </button>
          </div>
        ) : (
          <div style={{ paddingTop: Spacing.md, paddingBottom: Spacing.md }}>
            {chatsList.map((chat) => renderChatItem(chat))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatListScreen;
