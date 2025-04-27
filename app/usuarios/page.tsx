"use client"

import { useState, useEffect } from "react"
import { Search, Edit, Trash2, UserPlus, Shield, Coffee } from "lucide-react"
import { getUsers, deleteUser } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AddUserDialog } from "@/components/add-user-dialog"
import { EditUserDialog } from "@/components/edit-user-dialog"

export default function UsuariosPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const { toast } = useToast()

  // Colores para los diferentes roles
  const roleColors = {
    admin: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      icon: <Shield className="h-5 w-5 text-blue-500" />,
      avatarBg: "bg-blue-100",
      avatarText: "text-blue-800",
      border: "border-blue-500",
    },
    cashier: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: <Coffee className="h-5 w-5 text-green-500" />,
      avatarBg: "bg-green-100",
      avatarText: "text-green-800",
      border: "border-green-500",
    },
    employee: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      icon: <UserPlus className="h-5 w-5 text-amber-500" />,
      avatarBg: "bg-amber-100",
      avatarText: "text-amber-800",
      border: "border-amber-500",
    },
    owner: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      icon: <Shield className="h-5 w-5 text-purple-500" />,
      avatarBg: "bg-purple-100",
      avatarText: "text-purple-800",
      border: "border-purple-500",
    },
  }

  // Nombres en español para los roles
  const roleNames = {
    admin: "Administrador",
    cashier: "Cajero",
    employee: "Empleado",
    owner: "Propietario",
  }

  useEffect(() => {
    setMounted(true)

    const loadUsers = async () => {
      try {
        if (typeof window !== "undefined") {
          const usersData = await getUsers()
          console.log("Usuarios cargados:", usersData) // Depuración
          setUsers(usersData)
          setFilteredUsers(usersData)
        }
      } catch (error) {
        console.error("Error al cargar usuarios:", error)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      loadUsers()
    }
  }, [mounted])

  // Filtrar usuarios por búsqueda
  useEffect(() => {
    if (!users.length) return

    let filtered = [...users]

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const handleUserAdded = async () => {
    try {
      const usersData = await getUsers()
      console.log("Usuarios recargados:", usersData) // Depuración
      setUsers(usersData)
      setFilteredUsers(usersData)
    } catch (error) {
      console.error("Error al recargar usuarios:", error)
    }
  }

  const handleEditUser = (user) => {
    if (!user || !user.id) {
      console.error("No se puede editar: usuario no válido", user)
      toast({
        title: "Error",
        description: "No se puede editar el usuario porque no es válido",
        variant: "destructive",
      })
      return
    }

    // Crear una copia limpia del objeto usuario para evitar problemas de referencia
    const userCopy = {
      id: user.id,
      email: user.email || "",
      displayName: user.displayName || "",
      role: user.role || "employee",
    }

    setSelectedUser(userCopy)
    setIsEditUserOpen(true)
  }

  const handleDeleteUser = async (userId, userRole) => {
    // No permitir eliminar al propietario
    if (userRole === "owner") {
      toast({
        title: "Acción no permitida",
        description: "No se puede eliminar al usuario propietario",
        variant: "destructive",
      })
      return
    }

    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      try {
        await deleteUser(userId)
        toast({
          title: "Usuario eliminado",
          description: "El usuario ha sido eliminado correctamente",
          duration: 3000,
        })
        handleUserAdded()
      } catch (error) {
        console.error("Error al eliminar usuario:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el usuario",
          variant: "destructive",
        })
      }
    }
  }

  if (!mounted) return null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => setIsAddUserOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Agregar Usuario
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          type="text"
          placeholder="Buscar usuarios por nombre o correo..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Leyenda de roles */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="text-sm font-medium">Roles:</div>
        <div
          className={`flex items-center gap-1 ${roleColors.admin.text} ${roleColors.admin.bg} px-2 py-1 rounded-full`}
        >
          {roleColors.admin.icon} Administrador
        </div>
        <div
          className={`flex items-center gap-1 ${roleColors.cashier.text} ${roleColors.cashier.bg} px-2 py-1 rounded-full`}
        >
          {roleColors.cashier.icon} Cajero
        </div>
        <div
          className={`flex items-center gap-1 ${roleColors.employee.text} ${roleColors.employee.bg} px-2 py-1 rounded-full`}
        >
          {roleColors.employee.icon} Empleado
        </div>
        <div
          className={`flex items-center gap-1 ${roleColors.owner.text} ${roleColors.owner.bg} px-2 py-1 rounded-full`}
        >
          {roleColors.owner.icon} Propietario
        </div>
      </div>

      {/* Lista de usuarios */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando usuarios...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const role = user.role || "employee"
            const roleColor = roleColors[role] || roleColors.employee

            // Depuración
            console.log("Renderizando usuario:", user)
            console.log("Role:", role)
            console.log("RoleColor:", roleColor)

            return (
              <Card key={user.id} className={`overflow-hidden border-l-4 ${roleColor.border}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`${roleColor.avatarBg} ${roleColor.avatarText} font-bold rounded-full w-12 h-12 flex items-center justify-center`}
                    >
                      {user.displayName
                        ? user.displayName.substring(0, 2).toUpperCase()
                        : user.email.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{user.displayName || "Sin nombre"}</h3>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleColor.bg} ${roleColor.text}`}
                        >
                          {roleColor.icon} {roleNames[role] || "Empleado"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4 gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={role === "owner" ? "text-gray-300 cursor-not-allowed" : "text-red-500"}
                      onClick={() => handleDeleteUser(user.id, user.role)}
                      disabled={role === "owner"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No se encontraron usuarios</p>
          <p className="text-sm text-gray-400 mt-1">Intenta con otra búsqueda o añade un nuevo usuario</p>
        </div>
      )}

      <AddUserDialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen} onUserAdded={handleUserAdded} />

      <EditUserDialog
        open={isEditUserOpen}
        onOpenChange={setIsEditUserOpen}
        user={selectedUser}
        onUserUpdated={handleUserAdded}
      />
    </div>
  )
}
