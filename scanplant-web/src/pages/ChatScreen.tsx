import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messages, auth, chats } from '../api';

const Colors = {
  primary: { 500: '#22c55e' },
  text: { primary: '#1E293B', secondary: '#475569', inverse: '#FFFFFF' },
  background: { primary: '#FFFFFF', secondary: '#F8FAFC' },
};

export default function ChatScreen() {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [msgs, setMsgs] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [user, setUser] = useState<any>(null);
    const [chatInfo, setChatInfo] = useState<any>(null);
    const [userAvatar, setUserAvatar] = useState<string>('');
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = async () => {
            const { data } = await auth.getCurrentUser();
            console.log('Usuário atual:', data);
            const currentUser = data?.user || data;
            setUser(currentUser);
            const myAvatar = currentUser?.avatarUrl || currentUser?.AvatarUrl || currentUser?.avatar_url || currentUser?.avatar || '';
            console.log('Meu avatar:', myAvatar);
            setUserAvatar(myAvatar);
            
            // Buscar informações do chat
            const { data: chatData } = await chats.list();
            const currentChat = chatData?.find((c: any) => c.id.toString() === chatId);
            console.log('Chat info:', currentChat);
            if (currentChat?.otherParticipant) {
                console.log('Avatar do outro participante:', {
                    avatarUrl: currentChat.otherParticipant.avatarUrl,
                    AvatarUrl: currentChat.otherParticipant.AvatarUrl,
                    avatar_url: currentChat.otherParticipant.avatar_url,
                    avatar: currentChat.otherParticipant.avatar
                });
            }
            setChatInfo(currentChat);
            
            fetchMsgs();
        };
        load();
        const interval = setInterval(fetchMsgs, 3000);
        return () => clearInterval(interval);
    }, [chatId]);

    const fetchMsgs = async () => {
        const { data } = await messages.list(chatId);
        console.log('Mensagens recebidas:', data);
        if(data) setMsgs(data);
    };

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!input.trim()) return;
        await messages.send(chatId, input);
        setInput('');
        fetchMsgs();
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [msgs]);

    const formatTime = (timestamp: string) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: Colors.background.secondary }}>
            <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: Colors.background.secondary }}>
                {/* Header */}
                <header style={{
                    backgroundColor: Colors.background.primary,
                    padding: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
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
                    {chatInfo?.otherParticipant && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img 
                                src={chatInfo.otherParticipant.avatarUrl || chatInfo.otherParticipant.AvatarUrl || chatInfo.otherParticipant.avatar_url || chatInfo.otherParticipant.avatar || '/placeholder.png'} 
                                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                                alt={chatInfo.otherParticipant.name}
                            />
                            <div>
                                <h1 style={{ fontWeight: 'bold', fontSize: 18, color: Colors.text.primary, margin: 0 }}>
                                    {chatInfo.otherParticipant.name || 'Chat'}
                                </h1>
                            </div>
                        </div>
                    )}
                </header>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {msgs.map((msg, i) => {
                            const isMe = msg.senderId === user?.id;
                            const otherAvatar = chatInfo?.otherParticipant?.avatarUrl || chatInfo?.otherParticipant?.AvatarUrl || chatInfo?.otherParticipant?.avatar_url || chatInfo?.otherParticipant?.avatar;
                            const avatar = isMe ? userAvatar : otherAvatar;
                            return (
                                <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                                    {!isMe && (
                                        <img 
                                            src={avatar || '/placeholder.png'} 
                                            style={{ 
                                                width: 32, 
                                                height: 32, 
                                                borderRadius: '50%', 
                                                objectFit: 'cover',
                                                flexShrink: 0,
                                            }}
                                            alt="Avatar"
                                        />
                                    )}
                                    <div style={{ maxWidth: '70%' }}>
                                        <div style={{
                                            padding: 12,
                                            borderRadius: 16,
                                            fontSize: 14,
                                            backgroundColor: isMe ? Colors.primary[500] : Colors.background.primary,
                                            color: isMe ? Colors.text.inverse : Colors.text.primary,
                                            borderTopRightRadius: isMe ? 4 : 16,
                                            borderTopLeftRadius: isMe ? 16 : 4,
                                            boxShadow: isMe ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
                                        }}>
                                            {msg.content}
                                        </div>
                                        <p style={{ 
                                            fontSize: 11, 
                                            color: Colors.text.secondary, 
                                            marginTop: 4,
                                            textAlign: isMe ? 'right' : 'left',
                                            margin: '4px 0 0 0',
                                            paddingLeft: isMe ? 0 : 0,
                                            paddingRight: isMe ? 0 : 0,
                                        }}>
                                            {formatTime(msg.sentAt)}
                                        </p>
                                    </div>
                                    {isMe && (
                                        <img 
                                            src={avatar || '/placeholder.png'} 
                                            style={{ 
                                                width: 32, 
                                                height: 32, 
                                                borderRadius: '50%', 
                                                objectFit: 'cover',
                                                flexShrink: 0,
                                            }}
                                            alt="Avatar"
                                        />
                                    )}
                                </div>
                            );
                        })}
                        <div ref={endRef} />
                    </div>
                </div>

                {/* Input */}
                <form onSubmit={send} style={{
                    padding: 16,
                    backgroundColor: Colors.background.primary,
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: 8,
                }}>
                    <input 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        style={{
                            flex: 1,
                            padding: 12,
                            backgroundColor: Colors.background.secondary,
                            borderRadius: 24,
                            border: 'none',
                            outline: 'none',
                            fontSize: 14,
                        }}
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim()}
                        style={{
                            padding: 12,
                            backgroundColor: Colors.primary[500],
                            color: Colors.text.inverse,
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: input.trim() ? 1 : 0.5,
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
