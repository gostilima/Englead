import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('Acesso negado: Credenciais não podem estar vazias.');
      return;
    }

    setIsAuthenticating(true);
    
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Cadastro realizado! Verifique seu email ou faça login diretamente se a confirmação estiver desativada no painel.');
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError('Acesso negado: ' + error.message);
      }
      // if successful, supabase's onAuthStateChange listener in App.jsx will automatically pick up the session!
    }
    
    setIsAuthenticating(false);
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white font-inter flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,140,104, 0.1) 0%, transparent 60%)' }}>
      <div className="grid-lines">
          <div className="grid-line"></div>
          <div className="grid-line"></div>
          <div className="grid-line"></div>
          <div className="grid-line"></div>
          <div className="grid-line"></div>
      </div>
      <div className="bg-grain"></div>

      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}></div>

      <div className="relative z-10 w-full max-w-md p-6 animate-slide-up" style={{ animationDuration: '0.8s' }}>
        <div className="text-center mb-10">
          <div className="mx-auto flex items-center justify-center w-[80px] h-[80px] rounded-[24px] bg-white border border-white/5 p-3 mb-6 backdrop-blur-md shadow-lg">
            <img src="/favicon.png" alt="EngLeap Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bricolage font-medium tracking-tight mb-2 text-white">
            EngLeap
          </h1>
        </div>

        <div className="flex justify-center gap-4 mb-6 relative z-20 animate-slide-up" style={{ animationDuration: '0.6s' }}>
          <button onClick={() => { setIsSignUp(false); setError(''); setMessage(''); }} className={`px-6 py-2 rounded-full font-mono text-xs uppercase tracking-widest transition-all ${!isSignUp ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/50 shadow-[0_0_15px_rgba(255,140,104,0.2)]' : 'text-white/40 hover:text-white border border-transparent hover:bg-white/5'}`}>Entrar</button>
          <button onClick={() => { setIsSignUp(true); setError(''); setMessage(''); }} className={`px-6 py-2 rounded-full font-mono text-xs uppercase tracking-widest transition-all ${isSignUp ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/50 shadow-[0_0_15px_rgba(255,140,104,0.2)]' : 'text-white/40 hover:text-white border border-transparent hover:bg-white/5'}`}>Cadastrar</button>
        </div>

        <form onSubmit={handleSubmit} className="bg-brand-base/40 border border-white/10 rounded-[32px] p-8 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 animate-slide-up" style={{ animationDuration: '0.3s' }}>
              <iconify-icon icon="solar:danger-triangle-bold-duotone" width="20" className="mt-0.5"></iconify-icon>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-brand-accent/10 border border-brand-accent/30 rounded-2xl flex items-start gap-3 text-brand-accent animate-slide-up" style={{ animationDuration: '0.3s' }}>
              <iconify-icon icon="solar:info-circle-bold-duotone" width="20" className="mt-0.5"></iconify-icon>
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          <div className="mb-6 relative z-10">
            <label className="block text-xs font-mono text-white/50 uppercase tracking-widest mb-2 px-1">Access ID (Email)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                <iconify-icon icon="solar:letter-bold-duotone" width="20"></iconify-icon>
              </div>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-brand-dark/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-accent/50 focus:bg-brand-base/40 transition-all font-inter"
                placeholder="nome@exemplo.com"
                required
              />
            </div>
          </div>

          <div className="mb-8 relative z-10">
            <label className="block text-xs font-mono text-white/50 uppercase tracking-widest mb-2 px-1">Passcode (Senha)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                <iconify-icon icon="solar:lock-keyhole-bold-duotone" width="20"></iconify-icon>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-brand-dark/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-accent/50 focus:bg-brand-base/40 transition-all font-inter font-mono text-lg tracking-widest"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isAuthenticating}
            className={`w-full relative z-10 border rounded-2xl py-4 font-bricolage font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide group overflow-hidden ${isSignUp ? 'bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent border-brand-accent/30 hover:border-brand-accent/50 shadow-[0_4px_20px_rgba(255,140,104,0.1)] hover:shadow-[0_4px_30px_rgba(255,140,104,0.2)]' : 'bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent border-brand-accent/30 hover:border-brand-accent/50 shadow-[0_4px_20px_rgba(255,140,104,0.1)] hover:shadow-[0_4px_30px_rgba(255,140,104,0.2)]'}`}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            {isAuthenticating ? (
              <><iconify-icon icon="solar:radar-2-linear" className="animate-spin"></iconify-icon> {isSignUp ? 'Registrando...' : 'Autenticando...'}</>
            ) : (
              <>{isSignUp ? 'Criar Acesso' : 'Entrar no Sistema'} <iconify-icon icon="solar:arrow-right-linear" className="group-hover:translate-x-1 transition-transform"></iconify-icon></>
            )}
          </button>
          
        </form>
        
        <p className="text-center mt-8 text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">
          Secure Database Link Established
        </p>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
