import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, Mail, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function FeedbackModal({ onClose }) {
  const [view, setView] = useState('options');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const navigate = useNavigate();

  const handleChatWithAI = async () => {
    setCreatingChat(true);
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: 'support',
        metadata: { name: 'Support Chat', description: 'Feedback and support conversation' }
      });
      navigate(`/support-chat/${conversation.id}`);
      onClose();
    } catch {
      setCreatingChat(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !email.trim()) return;
    setSending(true);
    try {
      await base44.functions.invoke('sendFeedback', { message: message.trim(), email: email.trim() });
      setSent(true);
    } catch {}
    setSending(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative bg-card rounded-t-3xl w-full px-5 pt-5 shadow-2xl flex flex-col gap-4"
        style={{ maxHeight: '80vh', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-center mb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-foreground">Feedback & Support</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {view === 'options' && (
          <div className="flex flex-col gap-3 pb-4">
            <button
              onClick={handleChatWithAI}
              disabled={creatingChat}
              className="flex items-center gap-4 bg-muted rounded-2xl px-4 py-4 transition active:opacity-70 text-left"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                {creatingChat ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Chat with AI Assistant</p>
                <p className="text-xs text-muted-foreground mt-0.5">Get instant answers and help</p>
              </div>
            </button>

            <button
              onClick={() => setView('contact')}
              className="flex items-center gap-4 bg-muted rounded-2xl px-4 py-4 transition active:opacity-70 text-left"
            >
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Message Christian</p>
                <p className="text-xs text-muted-foreground mt-0.5">Send feedback directly to the developer</p>
              </div>
            </button>
          </div>
        )}

        {view === 'contact' && !sent && (
          <div className="flex flex-col gap-4 pb-4 overflow-y-auto">
            <button
              onClick={() => setView('options')}
              className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1 self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            <p className="text-sm text-muted-foreground">
              This message will be sent directly to <span className="font-semibold text-foreground">Christian</span>, the developer of LIFT. He'll get back to you as soon as possible with any feedback, questions, or feature requests.
            </p>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-300"
            />

            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Your feedback, question, or feature request..."
              rows={4}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />

            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || !email.trim() || sending}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? 'Sending…' : 'Send Message'}
            </button>
          </div>
        )}

        {view === 'contact' && sent && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
              <Send className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="font-bold text-foreground text-base">Message Sent!</p>
            <p className="text-sm text-muted-foreground">Christian will get back to you soon.</p>
            <button
              onClick={onClose}
              className="mt-2 py-2.5 px-6 bg-muted rounded-xl font-semibold text-sm text-foreground transition active:opacity-70"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}