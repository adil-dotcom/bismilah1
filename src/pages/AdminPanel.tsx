import React, { useState } from 'react';
import { Plus, UserPlus, Search, Lock, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserModal from '../components/UserModal';
import PasswordManagementModal from '../components/PasswordManagementModal';
import BlockUserConfirmModal from '../components/BlockUserConfirmModal';
import { useData } from '../contexts/DataContext';

interface User {
  id: string;
  username: string;
  role: string;
  name: string;
  specialite?: string;
  dateCreation: string;
  failedAttempts?: number;
  isBlocked?: boolean;
}

export default function AdminPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isBlockConfirmModalOpen, setIsBlockConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block');
  const { hasPermission, resetFailedAttempts, blockUser, unblockUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [users, setUsers] = useState<User[]>([
    {
      id: '2',
      username: 'docteur',
      role: 'docteur',
      name: 'Dr. Martin',
      specialite: 'Psychiatre',
      dateCreation: '15/03/2024',
      failedAttempts: 0,
      isBlocked: false
    },
    {
      id: '3',
      username: 'secretaire',
      role: 'secretaire',
      name: 'Marie Secrétaire',
      dateCreation: '15/03/2024',
      failedAttempts: 2,
      isBlocked: false
    }
  ]);

  const handleAddUser = (userData: any) => {
    const newUser = {
      id: (users.length + 1).toString(),
      ...userData,
      dateCreation: new Date().toLocaleDateString('fr-FR'),
      failedAttempts: 0,
      isBlocked: false
    };
    setUsers([...users, newUser]);
    setIsModalOpen(false);
  };

  const handlePasswordManagement = (user: User) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  };

  const handleBlockToggle = (userId: string, currentlyBlocked: boolean) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setBlockAction(currentlyBlocked ? 'unblock' : 'block');
      setIsBlockConfirmModalOpen(true);
    }
  };

  const handleBlockConfirm = () => {
    if (selectedUser) {
      if (blockAction === 'block') {
        blockUser(selectedUser.id);
      } else {
        unblockUser(selectedUser.id);
      }
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, isBlocked: blockAction === 'block' } : user
      ));
    }
  };

  const handleResetAttempts = (userId: string) => {
    resetFailedAttempts(userId);
    setUsers(users.map(user => 
      user.id === userId ? { ...user, failedAttempts: 0, isBlocked: false } : user
    ));
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Utilisateurs</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Nouvel utilisateur
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Rechercher un utilisateur..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom d'utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spécialité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'docteur' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.specialite || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.dateCreation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isBlocked ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Bloqué
                      </span>
                    ) : user.failedAttempts && user.failedAttempts > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {user.failedAttempts}/5 tentatives
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Shield className="h-4 w-4 mr-1" />
                        Actif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {hasPermission('reset_passwords') && (
                        <button
                          onClick={() => handlePasswordManagement(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Gérer le mot de passe"
                        >
                          <Lock className="h-5 w-5" />
                        </button>
                      )}
                      {hasPermission('block_users') && (
                        <>
                          {user.failedAttempts && user.failedAttempts > 0 && !user.isBlocked && (
                            <button
                              onClick={() => handleResetAttempts(user.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Réinitialiser les tentatives"
                            >
                              <Shield className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleBlockToggle(user.id, user.isBlocked || false)}
                            className={`${user.isBlocked ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                            title={user.isBlocked ? 'Débloquer' : 'Bloquer'}
                          >
                            <AlertTriangle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddUser}
      />

      <PasswordManagementModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <BlockUserConfirmModal
        isOpen={isBlockConfirmModalOpen}
        onClose={() => {
          setIsBlockConfirmModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleBlockConfirm}
        userName={selectedUser?.name || ''}
        action={blockAction}
      />
    </div>
  );
}