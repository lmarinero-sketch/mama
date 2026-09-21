import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  HelpCircle, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  BookOpen, 
  TrendingUp, 
  MapPin, 
  Check, 
  ChevronRight,
  Minimize2,
  Maximize2,
  RefreshCw,
  Info
} from 'lucide-react';
import { askLucas, LucasMessage } from '../../lib/lucasAssistant';

const IDLE_PHRASES = [
  '🧀 Controlando cuentas corrientes y deudas...',
  '📋 ¿Revisaste las órdenes de pedido con balanza?',
  '🚚 Ruta activa de reparto en San Juan',
  '💡 Preguntame sobre clientes, precios o el manual',
  '💰 Monitoreando cobranzas en efectivo y transferencia'
];

export const LucasChat: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [idlePhrase, setIdlePhrase] = useState('');
  const [showIdleBubble, setShowIdleBubble] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<LucasMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy **Lucas**, tu copiloto inteligente de Fiambrería Mamá. 🧀\n\nConozco en tiempo real toda la base de datos de clientes, deudas de cuentas corrientes, pedidos con balanza decimal y el manual de operaciones.\n\n¿En qué te puedo ayudar hoy?',
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        '¿Quiénes son los clientes que más deben?',
        'Ver clientes de la ruta de hoy',
        '¿Cómo cargar un pedido con decimales?',
        '¿Cuál es el fiambre más vendido?'
      ]
    }
  ]);

  // Rotación de pensamientos en reposo cada 25 segundos
  useEffect(() => {
    if (isOpen) return;

    const interval = setInterval(() => {
      const phrase = IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)];
      setIdlePhrase(phrase);
      setShowIdleBubble(true);
      const timer = setTimeout(() => setShowIdleBubble(false), 6000);
      return () => clearTimeout(timer);
    }, 25000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto scroll al final de mensajes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: LucasMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await askLucas(query, { currentPath: location.pathname });
      setMessages(prev => [...prev, response]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: 'Disculpame, hubo una interrupción al consultar los datos. Por favor intentá de nuevo.',
          timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Sugerencias contextuales según la pantalla activa
  const getContextualQuickActions = () => {
    const p = location.pathname;
    if (p.includes('/admin/orders')) {
      return [
        '¿Cómo cargar un pedido con decimales?',
        '¿Cuántos pedidos pendientes hay?',
        '¿Cómo emitir el remito PDF y enviarlo por WhatsApp?'
      ];
    }
    if (p.includes('/admin/clientes')) {
      return [
        '¿Quiénes son los clientes que más deben?',
        '¿Qué clientes tocan los martes?',
        '¿Cómo registrar un cobro a cuenta?'
      ];
    }
    if (p.includes('/admin/productos')) {
      return [
        '¿Cómo registrar un cambio de precio?',
        '¿Cómo se calcula el margen de ganancia?',
        '¿Cuáles fiambres tienen venta decimal?'
      ];
    }
    if (p.includes('/admin/rankings')) {
      return [
        '¿Cuál es el fiambre más vendido en kilos?',
        '¿Quién es el cliente más importante?',
        '¿Quiénes acumulan mayor deuda?'
      ];
    }
    if (p.includes('/admin/manual')) {
      return [
        '¿Cómo funciona el cobro a 7 días?',
        'Procedimiento de entrega con balanza',
        'Alias de transferencia de Mamá'
      ];
    }
    return [
      '¿Quiénes deben en cuenta corriente?',
      'Clientes de la ruta de hoy',
      '¿Cuánto se vendió hoy?',
      'Ver manual de operaciones'
    ];
  };

  return (
    <>
      {/* Botón Flotante y Globo de Pensamiento en Esquina Inferior Derecha */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end pointer-events-auto">
        {/* Globo de Pensamiento cuando está en reposo */}
        {!isOpen && showIdleBubble && (
          <div 
            onClick={() => setIsOpen(true)}
            className="mb-2 max-w-[220px] p-2.5 bg-white border border-brand-secondary rounded-2xl shadow-soft-lg text-xs font-bold text-brand-dark cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300 relative group"
          >
            <div className="flex items-center gap-1.5 text-brand-brown mb-0.5 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Lucas dice:</span>
            </div>
            <p className="text-brand-dark/90 leading-tight">{idlePhrase}</p>
            {/* Flechita del globo */}
            <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-white border-b border-r border-brand-secondary transform rotate-45"></div>
          </div>
        )}

        {/* Botón Principal del Avatar */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className={`relative group p-1.5 rounded-full transition-all duration-300 flex items-center justify-center shadow-soft-lg active:scale-95 ${
            isOpen 
              ? 'bg-brand-dark text-white ring-4 ring-brand-brown/20' 
              : 'bg-white hover:bg-brand-softYellow border-2 border-brand-brown ring-4 ring-brand-brown/10 hover:ring-brand-brown/20'
          }`}
          title="Hablar con Lucas (Asistente Inteligente)"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-brand-cream relative">
            {!avatarError ? (
              <img
                src="/lucas-avatar.png"
                alt="Lucas"
                onError={() => setAvatarError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand-brown text-white font-black text-base">
                👨‍💼
              </div>
            )}
          </div>

          {/* Indicador Online Verde */}
          <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs"></span>
        </button>
      </div>

      {/* Modal / Panel de Conversación de Lucas */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-end sm:items-center justify-end sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-secondary rounded-t-3xl sm:rounded-3xl w-full max-w-lg h-[85vh] sm:h-[620px] flex flex-col shadow-soft-lg overflow-hidden animate-in slide-in-from-bottom duration-300">
            
            {/* Header del Asistente */}
            <div className="p-3.5 bg-brand-cream border-b border-brand-secondary/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-softYellow border border-brand-yellow flex items-center justify-center relative shadow-xs">
                  {!avatarError ? (
                    <img
                      src="/lucas-avatar.png"
                      alt="Lucas"
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">👨‍💼</span>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold text-brand-dark leading-tight">
                      Lucas
                    </h3>
                    <span className="text-[9px] font-black bg-brand-brown text-white px-1.5 py-0.2 rounded-full">
                      COPILOTO IA
                    </span>
                  </div>
                  <p className="text-[10px] text-brand-dark/70 font-medium">
                    Fiambrería Mamá • Conectado a la base de datos
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  to="/admin/manual"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl bg-white hover:bg-brand-softYellow text-brand-dark border border-brand-secondary/80 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                  title="Ver Manual Operativo Completo"
                >
                  <BookOpen className="w-3.5 h-3.5 text-brand-brown" />
                  <span className="hidden sm:inline">Manual</span>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-brand-dark/60 hover:text-brand-dark hover:bg-black/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista de Mensajes */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-brand-bg/50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-brand-softYellow border border-brand-yellow text-brand-dark font-medium rounded-br-xs'
                        : 'bg-white border border-brand-secondary/80 text-brand-dark rounded-bl-xs'
                    }`}
                  >
                    {/* Contenido con saltos de línea y negritas sencillas */}
                    <div className="whitespace-pre-line">
                      {msg.content.split('\n').map((line, idx) => {
                        // Resaltado de negritas simples con **
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <div key={idx} className={line.startsWith('•') || line.match(/^\d+\./) ? 'ml-1 my-0.5' : 'my-0.5'}>
                            {parts.map((p, pIdx) => {
                              if (p.startsWith('**') && p.endsWith('**')) {
                                return <strong key={pIdx} className="font-extrabold text-brand-dark">{p.slice(2, -2)}</strong>;
                              }
                              return <span key={pIdx}>{p}</span>;
                            })}
                          </div>
                        );
                      })}
                    </div>

                    {/* Tarjeta de Datos Destacados si la respuesta la contiene */}
                    {msg.dataHighlights && msg.dataHighlights.items && (
                      <div className="mt-2.5 pt-2 border-t border-brand-secondary/60 grid grid-cols-2 gap-1.5">
                        {msg.dataHighlights.items.map((item, i) => (
                          <div key={i} className="bg-brand-bg p-2 rounded-xl border border-brand-secondary/40 text-[10px]">
                            <span className="text-brand-dark/60 block font-semibold">{item.label}</span>
                            <span className="font-black text-brand-brown text-xs block">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hora */}
                  <span className="text-[9px] text-brand-dark/40 mt-1 px-1">
                    {msg.timestamp}
                  </span>

                  {/* Sugerencias de seguimiento */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSend(action)}
                          className="text-[10px] bg-white hover:bg-brand-softYellow text-brand-brown font-extrabold px-2.5 py-1 rounded-xl border border-brand-secondary shadow-2xs transition-all active:scale-95 text-left flex items-center gap-1"
                        >
                          <ChevronRight className="w-2.5 h-2.5 text-brand-brown shrink-0" />
                          <span>{action}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Indicador de escribiendo */}
              {loading && (
                <div className="flex items-center gap-2 p-2.5 bg-white border border-brand-secondary/80 rounded-2xl w-fit text-xs text-brand-dark/70 shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-brand-brown animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-brand-brown animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-brand-brown animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-[11px] font-bold text-brand-dark ml-1">Lucas está consultando los datos...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Sugerencias contextuales rápidas según la página actual */}
            <div className="px-3 py-1.5 bg-brand-cream/60 border-t border-brand-secondary/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[9px] font-black text-brand-dark/50 uppercase shrink-0">Sugerencias:</span>
              {getContextualQuickActions().map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(action)}
                  className="text-[10px] whitespace-nowrap bg-white hover:bg-brand-softYellow text-brand-dark font-bold px-2.5 py-1 rounded-lg border border-brand-secondary shadow-2xs shrink-0 active:scale-95 transition-all"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Input y Botón Enviar */}
            <div className="p-2.5 bg-white border-t border-brand-secondary flex items-center gap-2">
              <input
                type="text"
                placeholder="Escribile a Lucas (ej: ¿quiénes deben?, clientes de hoy...)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={loading}
                className="flex-1 bg-brand-bg border border-brand-secondary rounded-xl px-3 py-2 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-brown focus:ring-2 focus:ring-brand-brown/20"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-2 bg-brand-brown hover:bg-brand-brown/90 disabled:opacity-40 text-white rounded-xl shadow-soft transition-all active:scale-95 shrink-0"
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
