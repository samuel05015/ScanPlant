import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bot, Leaf, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { plantAssistant } from '../api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  safetyNotice?: boolean;
}

const suggestions = [
  'Como saber se estou regando demais?',
  'Quais sinais indicam falta de luz?',
  'Como identificar uma possível praga?',
];

const welcomeMessage: Message = {
  id: 'welcome',
  sender: 'bot',
  text: 'Olá! Posso orientar sobre rega, luz, solo, pragas e cuidados gerais. Para ingestão, intoxicação ou uso medicinal, procure um profissional — uma foto ou conversa não confirma segurança.',
};

export default function PlantAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const sendMessage = async (questionOverride?: string) => {
    const question = (questionOverride ?? inputText).trim();
    if (question.length < 2 || isSending) return;

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, text: question, sender: 'user' },
    ]);
    setInputText('');
    setIsSending(true);

    const { data, error } = await plantAssistant.ask(question);
    const responseText = error
      ? error.status === 429
        ? 'Você enviou muitas perguntas em pouco tempo. Aguarde um minuto e tente novamente.'
        : 'Não consegui responder agora. Tente novamente em alguns instantes.'
      : data?.message || 'Não encontrei uma orientação segura para essa pergunta.';

    setMessages((current) => [
      ...current,
      {
        id: `bot-${Date.now()}`,
        text: responseText,
        sender: 'bot',
        safetyNotice: Boolean(data?.safetyNotice),
      },
    ]);
    setIsSending(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage();
  };

  return (
    <main className="page-container assistant-page">
      <section className="assistant-intro">
        <div>
          <span className="eyebrow"><Sparkles size={15} /> Orientação botânica</span>
          <h1>Assistente de plantas</h1>
          <p>Respostas práticas, respeitosas e com limites claros de segurança.</p>
        </div>
        <div className="assistant-trust"><ShieldCheck size={20} /> Moderação e limite de uso ativos</div>
      </section>

      <div className="assistant-layout">
        <aside className="assistant-guide card">
          <div className="assistant-guide-icon"><Leaf size={24} /></div>
          <h2>Como perguntar melhor</h2>
          <p>Inclua o nome da planta, onde ela fica e o que mudou recentemente.</p>
          <div className="assistant-safety-note">
            <AlertTriangle size={18} />
            <span>Não use o chat para decidir se uma planta pode ser ingerida ou usada como medicamento.</span>
          </div>
        </aside>

        <section className="assistant-chat card" aria-label="Conversa com o assistente botânico">
          <div className="assistant-chat-header">
            <div className="assistant-avatar"><Bot size={22} /></div>
            <div>
              <strong>Especialista botânico</strong>
              <span>Focado em cultivo e cuidados</span>
            </div>
          </div>

          <div className="assistant-messages" aria-live="polite">
            {messages.map((message) => (
              <div
                className={`assistant-message ${message.sender === 'user' ? 'is-user' : 'is-bot'}${message.safetyNotice ? ' is-safety' : ''}`}
                key={message.id}
              >
                {message.safetyNotice && <ShieldCheck size={17} aria-hidden="true" />}
                <span>{message.text}</span>
              </div>
            ))}
            {isSending && (
              <div className="assistant-message is-bot assistant-typing">
                <span></span><span></span><span></span>
                <span className="sr-only">Preparando resposta</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="assistant-suggestions">
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form className="assistant-composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="assistant-question">Sua pergunta</label>
            <textarea
              id="assistant-question"
              value={inputText}
              onChange={(event) => setInputText(event.target.value.slice(0, 800))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Ex.: as folhas estão amarelando depois da rega..."
              rows={2}
              maxLength={800}
              disabled={isSending}
            />
            <button className="primary-button assistant-send" type="submit" disabled={isSending || inputText.trim().length < 2}>
              <Send size={18} /> <span>Enviar</span>
            </button>
          </form>
          <div className="assistant-counter">{inputText.length}/800</div>
        </section>
      </div>
    </main>
  );
}
