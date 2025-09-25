"use client";

import { useState, useEffect } from 'react';
import GerenciaSidebar from '@/components/ui/gerencia-sidebar';
import GerenciaTopbar from '@/components/ui/gerencia-topbar';
import { 
  Users, 
  Search, 
  Edit, 
  Shield,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'PROFESIONAL' | 'MESA_ENTRADA' | 'GERENTE' | null;
  createdAt: string;
  updatedAt: string;
}

const roleLabels = {
  PROFESIONAL: 'Profesional',
  MESA_ENTRADA: 'Mesa de entrada',
  GERENTE: 'Gerente'
};

const roleColors = {
  PROFESIONAL: 'bg-blue-100 text-blue-800',
  MESA_ENTRADA: 'bg-green-100 text-green-800',
  GERENTE: 'bg-purple-100 text-purple-800'
};

export default function UsuariosPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        console.error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditingRole(user.role || 'NONE');
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedUser.id,
          role: editingRole === 'NONE' ? null : editingRole,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id ? data.user : user
        ));
        setIsEditModalOpen(false);
        setSelectedUser(null);
      } else {
        console.error('Error al actualizar usuario');
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separar usuarios con y sin rol
  const usersWithoutRole = filteredUsers.filter(user => !user.role);
  const usersWithRole = filteredUsers.filter(user => user.role);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <GerenciaSidebar 
        userRole="GERENTE" 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <GerenciaTopbar 
          userName="Administrador"
          userEmail="admin@carelink.com"
        />
        
        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
                  <p className="text-gray-600 text-sm">
                    Lista de usuarios del sistema
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center space-x-4 ml-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-gray-600">
                        Sin Rol: <span className="font-semibold text-orange-600">{usersWithoutRole.length}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-gray-600">
                        Con Rol: <span className="font-semibold text-emerald-600">{usersWithRole.length}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    Cargando usuarios...
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Usuario</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Rol</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Estado</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Fecha</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {/* Usuarios sin rol primero */}
                      {usersWithoutRole.map((user) => (
                        <tr key={user.id} className="bg-orange-25 hover:bg-orange-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-gray-100 p-2 rounded-full">
                                <Users className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.name || 'Sin nombre'}
                                </p>
                                <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-900">{user.email}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Sin asignar
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm text-orange-600 font-medium">Pendiente</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('es-ES')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </td>
                        </tr>
                      ))}
                      
                      {/* Usuarios con rol */}
                      {usersWithRole.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-emerald-100 p-2 rounded-full">
                                <Shield className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.name || 'Sin nombre'}
                                </p>
                                <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-900">{user.email}</td>
                          <td className="py-3 px-4">
                            {user.role && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                                {roleLabels[user.role]}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <UserCheck className="h-4 w-4 text-emerald-500" />
                              <span className="text-sm text-emerald-600 font-medium">Activo</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('es-ES')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </td>
                        </tr>
                      ))}
                      
                      {filteredUsers.length === 0 && !loading && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">
                            {searchTerm ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Edit User Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Edit className="h-5 w-5 text-emerald-600" />
                  <span>Editar Usuario</span>
                </DialogTitle>
                <DialogDescription>
                  Asigna o modifica el rol del usuario en el sistema.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Usuario</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{selectedUser?.name || 'Sin nombre'}</p>
                    <p className="text-sm text-gray-600">{selectedUser?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Rol del usuario</Label>
                  <Select value={editingRole} onValueChange={setEditingRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Sin rol asignado</SelectItem>
                      <SelectItem value="PROFESIONAL">Profesional</SelectItem>
                      <SelectItem value="MESA_ENTRADA">Mesa de entrada</SelectItem>
                      <SelectItem value="GERENTE">Gerente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={updating}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateUser}
                  disabled={updating}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {updating ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}