import { useState, useEffect } from 'react';
import db from './database.json';
import './flip.css';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import { supabase } from './supabaseClient';

export default function App() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentView, setCurrentView] = useState('materiais'); // 'materiais' ou 'frases' ou 'admin'
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Flashcards state
  const [phrases, setPhrases] = useState([]);
  
  // Listen to Supabase Auth State Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkAdminStatus();
      else setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAdminStatus();
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async () => {
    const { data, error } = await supabase.rpc('is_admin');
    setIsAdmin(data === true);
    setIsInitializing(false);
  };

  // Fetch real phrases from Supabase when session exists
  useEffect(() => {
    const fetchPhrases = async () => {
      if (!session) {
         setPhrases([]);
         return;
      }
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Erro ao buscar flashcards:", error);
      } else if (data) {
        setPhrases(data.map(p => ({ ...p, isFlipped: false })));
      }
    };
    
    fetchPhrases();
  }, [session, currentView]);

  const [newEn, setNewEn] = useState('');
  const [newPt, setNewPt] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAddPhraseOpen, setIsAddPhraseOpen] = useState(false);
  
  // Edit Phrase State
  const [editingPhrase, setEditingPhrase] = useState(null);
  const [editEn, setEditEn] = useState('');
  const [editPt, setEditPt] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle Edit Modal
  const openEditModal = (e, phrase) => {
    e.stopPropagation();
    setEditingPhrase(phrase);
    setEditEn(phrase.en);
    setEditPt(phrase.pt);
  };

  const handleUpdatePhrase = async (e) => {
    e.preventDefault();
    if (!editEn || !editPt) return;
    setIsUpdating(true);
    const { error } = await supabase
      .from('flashcards')
      .update({ en: editEn, pt: editPt })
      .eq('id', editingPhrase.id);
      
    if (!error) {
      setPhrases(phrases.map(p => p.id === editingPhrase.id ? { ...p, en: editEn, pt: editPt } : p));
      setEditingPhrase(null);
    } else {
      alert("Erro ao editar frase: " + error.message);
    }
    setIsUpdating(false);
  };

  const handleAutoTranslateEdit = async () => {
    if (!editEn.trim()) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(editEn.trim())}&langpair=en|pt`);
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        setEditPt(data.responseData.translatedText);
      }
    } catch (err) {
      console.error("Translation error", err);
    }
    setIsUpdating(false);
  };

  const selectedFolder = db.find(f => f.id === selectedFolderId);

  const getFileUrl = (path) => {
    return `/${encodeURI(path.replace(/\\/g, '/'))}`;
  };

  const handleAddPhrase = async (e) => {
    e.preventDefault();
    if (!newEn.trim()) return;
    
    setIsTranslating(true);
    let translation = newPt.trim();

    if (!translation) {
      try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(newEn.trim())}&langpair=en|pt`);
        const data = await res.json();
        if (data && data.responseData && data.responseData.translatedText) {
          translation = data.responseData.translatedText;
        }
      } catch (err) {
        console.error("Translation error", err);
      }
    }
    
    // Insert to Supabase DB!
    const { data, error } = await supabase
      .from('flashcards')
      .insert([{ en: newEn.trim(), pt: translation || "Tradução não encontrada." }])
      .select();

    if (error) {
      console.error("Erro ao inserir flashcard no banco:", error);
    } else if (data) {
      // Data is returned automatically via returning statement. Map it correctly with isFlipped.
      const newPhrase = { ...data[0], isFlipped: false };
      setPhrases([newPhrase, ...phrases]);
    }

    setIsTranslating(false);
    setNewEn('');
    setNewPt('');
  };

  const toggleFlip = (id) => {
    setPhrases(phrases.map(p => p.id === id ? { ...p, isFlipped: !p.isFlipped } : p));
  };

  const playAudio = (e, text) => {
    e.stopPropagation(); // Prevents flipping when clicking audio
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for clarity
      
      const voices = window.speechSynthesis.getVoices();
      const preferredFemaleNames = ['Zira', 'Samantha', 'Victoria', 'Karen', 'Moira', 'Google US English'];
      
      let selectedVoice = null;
      for (const name of preferredFemaleNames) {
        selectedVoice = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'));
        if (selectedVoice) break;
      }
      
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.name.includes('Female') && v.lang.startsWith('en'));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Desculpe, seu navegador não suporta leitura de áudio.");
    }
  };

  const deletePhrase = async (e, id) => {
    e.stopPropagation();
    
    // Delete from Supabase DB!
    const { error } = await supabase.from('flashcards').delete().eq('id', id);
    if (error) {
      console.error("Erro ao deletar flashcard:", error);
      return;
    }
    
    setPhrases(phrases.filter(p => p.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Determine Sidebar Visibility on Mobile
  const showSidebarOnMobile = currentView === 'materiais' && !selectedFolderId && !selectedFile;

  if (isInitializing) {
     return <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white"><iconify-icon icon="solar:radar-2-linear" className="animate-spin text-brand-accent w-10"></iconify-icon></div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white font-inter relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,140,104, 0.15) 0%, transparent 50%)' }}>
      
      {/* Background aesthetics */}
      <div className="grid-lines">
          <div className="grid-line"></div>
          <div className="grid-line"></div>
          <div className="grid-line"></div>
          <div className="grid-line"></div>
          <div className="grid-line"></div>
      </div>
      <div className="bg-grain"></div>

      <div className="relative z-20 flex h-screen max-w-[1600px] mx-auto p-2 md:p-8 gap-0 md:gap-8">
        
        {/* Sidebar */}
        <aside className={`${showSidebarOnMobile ? 'flex' : 'hidden md:flex'} w-full md:w-80 flex-shrink-0 flex-col bg-brand-base/40 border border-white/10 rounded-[28px] md:rounded-[40px] p-4 md:p-5 backdrop-blur-xl overflow-hidden shadow-2xl`}>
          <div className="mb-4 px-2 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 flex items-center justify-center rounded-[14px] bg-white border border-white/5 p-1.5 shadow-sm">
                 <img src="/favicon.png" alt="EngLeap Logo" className="w-full h-full object-contain" />
               </div>
               <div>
                  <h2 className="font-bricolage text-xl font-semibold tracking-tight">EngLeap</h2>
                  <div className="text-[10px] font-mono text-brand-accent uppercase tracking-[0.2em] mt-1">Portal do Aluno</div>
               </div>
             </div>
             <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/5 text-red-500/50 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/30" title="Desconectar do Terminal">
               <iconify-icon icon="solar:logout-2-bold-duotone" width="20"></iconify-icon>
             </button>
          </div>

          {/* View Toggles */}
          <div className="flex flex-col gap-2 mb-4 animate-slide-up" style={{ animationDuration: '0.4s' }}>
            <button onClick={() => { setCurrentView('materiais'); setSelectedFolderId(null); setSelectedFile(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border ${currentView === 'materiais' ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent shadow-[0_0_15px_rgba(255,140,104,0.1)]' : 'bg-transparent border-transparent hover:bg-brand-base/40 hover:border-white/5 text-white/70 hover:text-white'}`}>
              <iconify-icon icon="solar:folder-with-files-bold-duotone" width="20"></iconify-icon>
              <span className="font-medium text-sm">Materiais</span>
            </button>
            <button onClick={() => { setCurrentView('frases'); setSelectedFolderId(null); setSelectedFile(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border ${currentView === 'frases' ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent shadow-[0_0_15px_rgba(255,140,104,0.1)]' : 'bg-transparent border-transparent hover:bg-brand-base/40 hover:border-white/5 text-white/70 hover:text-white'}`}>
              <iconify-icon icon="solar:card-2-bold-duotone" width="20"></iconify-icon>
              <span className="font-medium text-sm">Flashcards (Frases)</span>
            </button>
            {isAdmin && (
              <button 
                onClick={() => { setCurrentView('admin'); setSelectedFolderId(null); setSelectedFile(null); }} 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border mt-2 ${currentView === 'admin' ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent shadow-[0_0_15px_rgba(255,140,104,0.1)]' : 'bg-brand-base/20 border-white/5 hover:bg-brand-base/40 hover:border-white/10 text-brand-accent/80 hover:text-brand-accent'}`}
              >
                <iconify-icon icon="solar:shield-keyhole-bold-duotone" width="20"></iconify-icon>
                <span className="font-medium text-sm">Painel Gestão</span>
              </button>
            )}
          </div>
          
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4"></div>
          
          {/* Contextual Sidebar Content */}
          <div className="flex-grow overflow-y-auto hide-scrollbar flex flex-col gap-2 relative z-10 pr-2">
            {currentView === 'materiais' ? (
              db.map(folder => {
                const isActive = selectedFolderId === folder.id;
                return (
                  <button 
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolderId(folder.id);
                      setSelectedFile(null);
                    }}
                    className={`flex flex-col text-left px-4 py-3 rounded-2xl transition-all duration-300 border ${
                      isActive 
                        ? 'bg-white/10 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)] text-white' 
                        : 'bg-transparent border-transparent hover:bg-brand-base/40 hover:border-white/5 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-sm truncate max-w-[200px] font-inter">{folder.name}</span>
                      <span className="text-[10px] font-mono opacity-50 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{folder.files.length}</span>
                    </div>
                  </button>
                );
              })
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center p-4">
                 <iconify-icon icon="solar:cards-minimalistic-bold-duotone" width="48" className="text-brand-accent/20 mb-4"></iconify-icon>
                 <p className="text-sm text-white/40 mb-2">Treine seu vocabulário</p>
                 <span className="text-[10px] font-mono text-brand-accent uppercase tracking-widest">{phrases.length} CARTÕES SALVOS</span>
               </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className={`${showSidebarOnMobile ? 'hidden md:flex' : 'flex'} w-full flex-grow flex-col bg-brand-base/90 border border-white/5 rounded-[28px] md:rounded-[48px] overflow-hidden relative shadow-2xl backdrop-blur-xl animate-cinematic`} style={{ animationDuration: '0.8s' }}>
          
          {/* The glow changes color based on view */}
          <div className={`absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 ${currentView === 'frases' ? 'bg-brand-accent/5' : 'bg-brand-accent/5'}`}></div>
          
          {currentView === 'admin' && isAdmin ? (
             <AdminDashboard onBack={() => setCurrentView('materiais')} />
          ) : currentView === 'frases' ? (
            <div className="flex flex-col h-full relative z-10 pt-6 px-6 md:pt-12 md:px-12 overflow-hidden animate-slide-up" style={{ animationDuration: '0.4s' }}>
              <header className="mb-8 border-b border-white/10 pb-6 md:pb-8 flex flex-col gap-2 md:gap-4">
                <button onClick={() => setCurrentView('materiais')} className="md:hidden flex items-center gap-2 text-brand-accent/70 hover:text-brand-accent transition-colors text-xs font-mono tracking-widest uppercase mb-1 hover:-translate-x-1 duration-300">
                  <iconify-icon icon="solar:arrow-left-linear" width="16"></iconify-icon> MENUS
                </button>
                
                <div className="flex flex-row items-end justify-between gap-4 w-full">
                  <div>
                    <span className="text-[10px] md:text-xs font-mono text-brand-accent uppercase tracking-[0.4em] mb-1 md:mb-3 block truncate">
                      EngLeap Space
                    </span>
                    <h1 className="text-3xl md:text-5xl font-bricolage font-medium tracking-tight leading-none">
                      Flashcards
                    </h1>
                  </div>

                  {!isAddPhraseOpen && (
                     <button onClick={() => setIsAddPhraseOpen(true)} className="px-4 py-2 md:px-6 md:py-3 bg-brand-accent text-brand-dark font-bold font-bricolage rounded-full hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,140,104,0.3)] flex items-center justify-center gap-2 whitespace-nowrap text-sm md:text-base">
                       <iconify-icon icon="solar:add-circle-bold-duotone" width="20"></iconify-icon> Nova Frase
                     </button>
                  )}
                </div>

                {/* Add Phrase Form Toggle */}
                {isAddPhraseOpen && (
                  <form onSubmit={handleAddPhrase} className="flex flex-col sm:flex-row gap-3 w-full bg-brand-base/40 p-4 rounded-[20px] border border-white/10 backdrop-blur-md relative z-20 animate-fade-in mt-4">
                     <div className="absolute -top-3 -right-3">
                        <button type="button" onClick={() => setIsAddPhraseOpen(false)} className="bg-brand-dark border border-white/10 text-white/50 hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors shadow-lg">
                           <iconify-icon icon="solar:close-circle-bold" width="18"></iconify-icon>
                        </button>
                     </div>
                     <div className="flex flex-col gap-2 flex-grow">
                       <input type="text" placeholder="Frase em Inglês..." value={newEn} onChange={e => setNewEn(e.target.value)} className="bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-accent/50 w-full transition-colors font-inter" required />
                       <input type="text" placeholder="Tradução em PT (Opcional)..." value={newPt} onChange={e => setNewPt(e.target.value)} className="bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-accent/50 w-full transition-colors font-inter" />
                     </div>
                     <button type="submit" disabled={isTranslating} className="bg-brand-accent text-black font-bold text-sm px-6 py-2 rounded-xl hover:bg-brand-accent transition-colors flex items-center justify-center gap-2 h-full sm:h-auto disabled:opacity-50 disabled:cursor-not-allowed">
                       {isTranslating ? (
                         <><iconify-icon icon="solar:radar-2-linear" className="animate-spin"></iconify-icon> Traduzindo...</>
                       ) : (
                         <><iconify-icon icon="solar:add-circle-bold"></iconify-icon> Automático</>
                       )}
                     </button>
                  </form>
                )}
              </header>
              
              <div className="flex-grow overflow-y-auto hide-scrollbar pb-20">
                {phrases.length === 0 ? (
                  <div className="text-center mt-20">
                    <iconify-icon icon="solar:ghost-line-duotone" width="64" className="text-white/10 mb-4"></iconify-icon>
                    <p className="text-white/40 text-lg font-bricolage">Nenhuma frase salva ainda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {phrases.map((phrase, idx) => (
                      <div key={phrase.id} className="perspective-1000 w-full h-[200px] animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <div 
                           className={`relative w-full h-full transform-style-3d transition-transform duration-700 cursor-pointer ${phrase.isFlipped ? 'rotate-y-180' : ''}`}
                           onClick={() => toggleFlip(phrase.id)}
                        >
                          {/* Front (English) */}
                          <div className="absolute inset-0 backface-hidden w-full h-full bg-white/[0.03] border border-white/10 hover:border-brand-accent/30 rounded-[28px] p-6 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-md group transition-colors">
                            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button onClick={(e) => openEditModal(e, phrase)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-brand-accent hover:bg-brand-accent/10 transition-colors" title="Editar">
                                <iconify-icon icon="solar:pen-bold" width="16"></iconify-icon>
                              </button>
                              <button onClick={(e) => deletePhrase(e, phrase.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Excluir">
                                <iconify-icon icon="solar:trash-bin-trash-bold" width="16"></iconify-icon>
                              </button>
                            </div>
                            
                            <h3 className="text-xl font-medium text-white px-4">{phrase.en}</h3>
                            
                            <button 
                              onClick={(e) => playAudio(e, phrase.en)}
                              className="w-12 h-12 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center hover:bg-brand-accent hover:text-white transition-all transform hover:scale-110 shadow-[0_0_15px_rgba(255,140,104,0.2)] mt-6"
                              title="Ouvir Pronúncia"
                            >
                              <iconify-icon icon="solar:volume-loud-bold" width="22"></iconify-icon>
                            </button>
                          </div>

                          {/* Back (Portuguese) */}
                          <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full bg-brand-accent/5 border border-brand-accent/20 rounded-[28px] p-6 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(255,140,104,0.1)] backdrop-blur-xl">
                            <h3 className="text-xl font-bricolage text-brand-accent font-medium px-4">{phrase.pt}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : 

          /* MATERIAIS VIEW */
          selectedFile ? (
             <div className="flex flex-col h-full relative z-10 animate-slide-up" style={{ animationDuration: '0.4s' }}>
               <header className="p-4 md:p-6 border-b border-white/10 flex items-start justify-between bg-brand-dark/20">
                 <div>
                    <button onClick={() => setSelectedFile(null)} className="flex items-center gap-2 text-brand-accent/70 hover:text-brand-accent transition-colors text-xs font-mono tracking-widest uppercase mb-2 md:mb-4 hover:-translate-x-1 duration-300">
                      <iconify-icon icon="solar:arrow-left-linear" width="16"></iconify-icon> BACK
                    </button>
                    <h2 className="text-xl md:text-3xl font-bricolage text-white font-medium pr-2 max-w-[220px] md:max-w-full truncate">{selectedFile.name}</h2>
                    <span className="text-[8px] md:text-[10px] font-mono text-white/30 tracking-widest mt-1 md:mt-2 block bg-white/5 border border-white/10 px-2 py-1 rounded w-max">{selectedFile.type.toUpperCase()} DOCUMENT</span>
                 </div>
                 <a href={getFileUrl(selectedFile.path)} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors" title="Open in new tab">
                   <iconify-icon icon="solar:square-top-down-linear" width="20"></iconify-icon>
                 </a>
               </header>
               <div className="flex-grow overflow-hidden relative w-full h-full rounded-b-[28px] md:rounded-b-[48px]">
                   {selectedFile.type === 'mp4' ? (
                     <video src={getFileUrl(selectedFile.path)} controls autoPlay className="w-full h-full object-contain bg-brand-dark" />
                   ) : (
                     <iframe src={getFileUrl(selectedFile.path)} className="w-full h-full bg-transparent border-0" title={selectedFile.name} />
                   )}
               </div>
             </div>
          ) : selectedFolder ? (
            <div className="flex flex-col h-full pt-6 px-6 md:pt-12 md:px-12 relative z-10 overflow-hidden">
              <header className="mb-6 md:mb-10 border-b border-white/10 pb-6 md:pb-8 animate-slide-up">
                <button onClick={() => setSelectedFolderId(null)} className="md:hidden flex items-center gap-2 text-brand-accent/70 hover:text-brand-accent transition-colors text-xs font-mono tracking-widest uppercase mb-6 hover:-translate-x-1 duration-300">
                  <iconify-icon icon="solar:arrow-left-linear" width="16"></iconify-icon> PASTAS
                </button>
                <span className="text-xs font-mono text-brand-accent uppercase tracking-[0.4em] mb-3 block truncate">
                  DIR_ID: {selectedFolder.id}
                </span>
                <h1 className="text-3xl md:text-5xl font-bricolage font-medium tracking-tight mb-3">
                  {selectedFolder.name}
                </h1>
                <p className="text-white/40 text-sm md:text-lg max-w-2xl">
                  {selectedFolder.files.length} data modules identified in this sector.
                </p>
              </header>
              
              <div className="flex-grow overflow-y-auto hide-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
                  {selectedFolder.files.map((file, idx) => (
                    <div key={idx} className="group relative bg-brand-base/40 border border-white/5 rounded-[24px] md:rounded-[32px] p-5 md:p-6 overflow-hidden hover:bg-neutral-800 transition-all duration-500 hover:border-white/20 hover:-translate-y-1 animate-slide-up flex flex-col cursor-pointer" style={{ animationDelay: `${idx * 0.05}s` }} onClick={() => setSelectedFile(file)}>
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/0 via-transparent to-brand-accent/5 group-hover:opacity-100 opacity-0 transition-opacity"></div>
                      
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4 md:mb-6">
                           <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-xl md:text-2xl group-hover:scale-110 group-hover:bg-brand-accent/10 group-hover:text-brand-accent transition-all duration-500">
                             {file.type === 'mp4' ? <iconify-icon icon="solar:play-bold"></iconify-icon> : file.type === 'html' ? <iconify-icon icon="solar:document-text-bold-duotone"></iconify-icon> : <iconify-icon icon="solar:folder-with-files-bold-duotone"></iconify-icon>}
                           </div>
                           <span className="text-[8px] md:text-[10px] font-mono text-white/30 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">{file.type}</span>
                        </div>
                        
                        <h4 className="text-base md:text-lg font-bricolage mb-4 flex-grow line-clamp-2 md:line-clamp-3 leading-snug">{file.name}</h4>
                        
                        <div className="mt-auto pt-4 md:pt-6 border-t border-white/5 flex items-center gap-3 text-xs md:text-sm font-mono text-brand-accent/70 group-hover:text-brand-accent tracking-[0.2em] transition-colors group-hover:border-white/10">
                          ACCESS PROTOCOL <iconify-icon icon="solar:arrow-right-linear" width="16" className="group-hover:translate-x-1 transition-transform"></iconify-icon>
                        </div>
                      </div>
                    </div>
                  ))}
                 </div>
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center relative z-10 p-4">
               <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-6 border border-white/10">
                 <iconify-icon icon="solar:radar-2-linear" width="40" className="animate-spin" style={{ animationDuration: '4s' }}></iconify-icon>
               </div>
               <h3 className="text-xl md:text-2xl font-bricolage text-white/60 mb-2">No Sector Selected</h3>
               <p className="text-white/30 font-mono text-xs md:text-sm tracking-widest uppercase">Initiate target lock from the sidebar</p>
             </div>
          )}
        </main>
      </div>

      {/* Edit Phrase Modal */}
      {editingPhrase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-brand-base border border-white/10 p-6 md:p-8 rounded-[32px] w-full max-w-md shadow-2xl relative overflow-hidden animate-slide-up">
            <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-brand-accent/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-2xl font-bricolage font-bold text-white">Editar Frase</h2>
              <button onClick={() => setEditingPhrase(null)} className="text-white/40 hover:text-white transition-colors bg-brand-dark/50 border border-white/10 rounded-full w-8 h-8 flex items-center justify-center">
                <iconify-icon icon="solar:close-circle-bold" width="18"></iconify-icon>
              </button>
            </div>
            
            <form onSubmit={handleUpdatePhrase} className="flex flex-col gap-4 relative z-10">
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase tracking-widest mb-2 px-1 flex justify-between">
                  <span>Frase em Inglês</span>
                  <button type="button" onClick={handleAutoTranslateEdit} disabled={isUpdating} className="text-brand-accent hover:text-white transition-colors flex items-center gap-1 normal-case text-[10px] tracking-normal">
                    <iconify-icon icon="solar:magic-stick-3-bold-duotone" width="14"></iconify-icon> Traduzir Auto
                  </button>
                </label>
                <input 
                  type="text" 
                  value={editEn}
                  onChange={(e) => setEditEn(e.target.value)}
                  onBlur={handleAutoTranslateEdit}
                  className="w-full bg-brand-dark/40 border border-white/10 rounded-2xl py-4 px-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-accent/50 transition-colors font-inter"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-mono text-white/50 uppercase tracking-widest mb-2 px-1">Tradução Extra (Opcional)</label>
                <input 
                  type="text" 
                  value={editPt}
                  onChange={(e) => setEditPt(e.target.value)}
                  className="w-full bg-brand-dark/40 border border-white/10 rounded-2xl py-4 px-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-accent/50 transition-colors font-inter"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isUpdating}
                className="w-full mt-4 bg-brand-accent text-brand-dark font-bold font-bricolage py-4 rounded-2xl hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,140,104,0.2)]"
              >
                {isUpdating ? <iconify-icon icon="solar:radar-2-linear" className="animate-spin" width="20"></iconify-icon> : <iconify-icon icon="solar:diskette-bold" width="20"></iconify-icon>}
                {isUpdating ? 'Salvando...' : 'Atualizar Frase'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
