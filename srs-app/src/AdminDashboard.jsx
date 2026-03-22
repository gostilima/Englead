import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function AdminDashboard({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create / Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Action state
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'LIST_USERS' })
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Failed to fetch users');
      
      setUsers(responseData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const action = editingUserId ? 'UPDATE_USER' : 'CREATE_USER';
      const payload = editingUserId ? { userId: editingUserId, email, password } : { email, password };
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action, payload })
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Failed to save user');
      
      setIsModalOpen(false);
      resetForm();
      fetchUsers(); // Refresh
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Certeza absoluta que deseja DELETAR este aluno? O acesso será revogado permanentemente.')) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'DELETE_USER', payload: { userId } })
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Failed to delete user');
      
      fetchUsers(); // Refresh
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    resetForm();
    setEditingUserId(user.id);
    setEmail(user.email);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingUserId(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="w-full h-full p-4 md:p-8 animate-fade-in text-white overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-8 md:mb-10">
          <div>
            {onBack && (
              <button 
                 onClick={onBack} 
                 className="md:hidden flex items-center gap-2 text-brand-accent/70 hover:text-brand-accent transition-colors text-xs font-mono tracking-widest uppercase mb-4 hover:-translate-x-1 duration-300"
              >
                <iconify-icon icon="solar:arrow-left-linear" width="16"></iconify-icon> MENUS
              </button>
            )}
            <h1 className="text-3xl md:text-4xl font-bricolage font-bold tracking-tight">Painel Gestão</h1>
            <p className="font-mono text-[10px] md:text-xs text-brand-accent uppercase tracking-widest mt-2 opacity-80">Administração de Alunos EngLeap</p>
          </div>
          <button onClick={openCreateModal} className="w-full md:w-auto px-6 py-3 bg-brand-accent text-brand-dark font-bold font-bricolage rounded-full hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,140,104,0.3)]">
             + Novo Aluno
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400">
            <iconify-icon icon="solar:danger-triangle-bold-duotone" width="20" className="mt-0.5"></iconify-icon>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="bg-brand-base/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
          {loading ? (
             <div className="text-center py-20 text-white/50 animate-pulse">
                <iconify-icon icon="solar:radar-2-linear" width="40" className="animate-spin mb-4"></iconify-icon>
                <p>Loading database...</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">ID do Aluno</th>
                    <th className="py-4 font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">Email</th>
                    <th className="py-4 font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">Último Acesso</th>
                    <th className="py-4 font-mono text-[10px] text-white/40 uppercase tracking-[0.2em] text-right">Ações de Gestão</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 font-mono text-xs text-white/60">{user.id.substring(0,8)}...</td>
                      <td className="py-4 font-inter text-sm font-medium">{user.email}</td>
                      <td className="py-4 font-inter text-sm text-white/60">{new Date(user.last_sign_in_at || user.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 text-right">
                        <button onClick={() => openEditModal(user)} className="p-2 text-white/50 hover:text-white transition-colors" title="Editar Credenciais">
                          <iconify-icon icon="solar:pen-bold-duotone" width="20"></iconify-icon>
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} disabled={isSubmitting} className="p-2 text-white/50 hover:text-red-400 transition-colors ml-2" title="Revogar / Deletar Aluno">
                          <iconify-icon icon="solar:trash-bin-trash-bold-duotone" width="20"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-10 text-white/40">Nenhum aluno encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-brand-dark/90 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
                   <iconify-icon icon="solar:close-circle-bold-duotone" width="24"></iconify-icon>
                </button>
             </div>
             
             <h2 className="text-3xl font-bricolage font-bold tracking-tight mb-6">
                {editingUserId ? 'Editar Aluno' : 'Novo Aluno'}
             </h2>
             
             <form onSubmit={handleSaveUser}>
                <div className="mb-6">
                  <label className="block text-xs font-mono text-white/50 uppercase tracking-widest mb-2 px-1">Email do Aluno</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                    className="w-full bg-brand-base/40 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-brand-accent/50" />
                </div>
                
                <div className="mb-8">
                  <label className="block text-xs font-mono text-white/50 uppercase tracking-widest mb-2 px-1">
                    {editingUserId ? 'Nova Senha (opcional)' : 'Senha de Acesso'}
                  </label>
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required={!editingUserId}
                    className="w-full bg-brand-base/40 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-brand-accent/50" />
                </div>
                
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-accent/20 text-brand-accent border border-brand-accent/30 hover:border-brand-accent/50 rounded-2xl py-4 font-bricolage font-bold text-lg transition-all flex justify-center items-center">
                   {isSubmitting ? <iconify-icon icon="solar:radar-2-linear" className="animate-spin" width="24"></iconify-icon> : 'Salvar Alterações'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
