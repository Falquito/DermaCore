"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Edit,
  Shield,
  UserCheck,
  AlertCircle,
  Check
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
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  name: string | null;
  email: string;
  roles: ('PROFESIONAL' | 'MESA_ENTRADA' | 'GERENTE')[];
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoles, setEditingRoles] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

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
    setEditingRoles(user.roles.length > 0 ? user.roles : []);
    setIsEditModalOpen(true);
  };

  const handleRoleToggle = (role: string) => {
    setEditingRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      }
      return [...prev, role];
    });
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
          roles: editingRoles,
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
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.name?.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Separar usuarios con y sin rol y preparar orden para la tabla
  const { usersWithoutRole, usersWithRole, orderedUsers } = useMemo(() => {
    const withoutRole = filteredUsers.filter(user => user.roles.length === 0);
    const withRole = filteredUsers.filter(user => user.roles.length > 0);
    return {
      usersWithoutRole: withoutRole,
      usersWithRole: withRole,
      orderedUsers: [...withoutRole, ...withRole],
    };
  }, [filteredUsers]);

  const totalPages = Math.max(1, Math.ceil(orderedUsers.length / pageSize));

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return orderedUsers.slice(startIndex, startIndex + pageSize);
  }, [orderedUsers, currentPage, pageSize]);

  const startItem = orderedUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(orderedUsers.length, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <Users className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-sm text-gray-600">Lista de usuarios del sistema</p>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 md:ml-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-600">
                    Sin Rol: <span className="font-semibold text-orange-600">{usersWithoutRole.length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
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
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        {searchTerm ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => {
                      const hasRole = user.roles.length > 0;
                      return (
                        <tr
                          key={user.id}
                          className={hasRole ? 'hover:bg-gray-50 transition-colors' : 'bg-orange-25 hover:bg-orange-50 transition-colors'}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className={`${hasRole ? 'bg-emerald-100' : 'bg-gray-100'} p-2 rounded-full`}>
                                {hasRole ? (
                                  <Shield className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Users className="h-4 w-4 text-gray-600" />
                                )}
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
                            <div className="flex flex-wrap gap-1">
                              {hasRole ? (
                                user.roles.map((role, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role]}`}
                                  >
                                    {roleLabels[role]}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  Sin asignar
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {hasRole ? (
                                <UserCheck className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                              )}
                              <span className={`text-sm font-medium ${hasRole ? 'text-emerald-600' : 'text-orange-600'}`}>
                                {hasRole ? 'Activo' : 'Pendiente'}
                              </span>
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
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {orderedUsers.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {startItem}-{endItem} de {orderedUsers.length} usuarios
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
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
              Asigna uno o más roles al usuario en el sistema. Los usuarios pueden tener múltiples roles simultáneamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Usuario</Label>
              <div className="rounded-md bg-gray-50 p-3">
                <p className="font-medium">{selectedUser?.name || 'Sin nombre'}</p>
                <p className="text-sm text-gray-600">{selectedUser?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Roles del usuario</Label>
              <div className="space-y-2">
                {['PROFESIONAL', 'MESA_ENTRADA', 'GERENTE'].map((role) => (
                  <div
                    key={role}
                    className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                      editingRoles.includes(role)
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleRoleToggle(role)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                          editingRoles.includes(role)
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {editingRoles.includes(role) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {roleLabels[role as keyof typeof roleLabels]}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        roleColors[role as keyof typeof roleColors]
                      }`}
                    >
                      {roleLabels[role as keyof typeof roleLabels]}
                    </span>
                  </div>
                ))}
              </div>

              {editingRoles.length === 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-700">
                      Sin roles asignados. El usuario será redirigido a la página de error al iniciar sesión.
                    </span>
                  </div>
                </div>
              )}
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
    </div>
  );
}
