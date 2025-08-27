// Dashboard Page
export function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="focus-card">
          <h3 className="text-lg font-medium text-gray-900">Usuários</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">0</p>
        </div>
        <div className="focus-card">
          <h3 className="text-lg font-medium text-gray-900">Materiais</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">0</p>
        </div>
        <div className="focus-card">
          <h3 className="text-lg font-medium text-gray-900">Pedidos</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">0</p>
        </div>
        <div className="focus-card">
          <h3 className="text-lg font-medium text-gray-900">Receita</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">R$ 0</p>
        </div>
      </div>
    </div>
  )
}

// Materials Page
export function MaterialsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Materiais Têxteis</h1>
      <div className="focus-card">
        <p className="text-gray-600">Gestão de materiais em desenvolvimento...</p>
      </div>
    </div>
  )
}

// Users Page
export function UsersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Usuários</h1>
      <div className="focus-card">
        <p className="text-gray-600">Gestão de usuários em desenvolvimento...</p>
      </div>
    </div>
  )
}

// Orders Page
export function OrdersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pedidos</h1>
      <div className="focus-card">
        <p className="text-gray-600">Gestão de pedidos em desenvolvimento...</p>
      </div>
    </div>
  )
}

// Settings Page
export function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>
      <div className="focus-card">
        <p className="text-gray-600">Configurações do sistema em desenvolvimento...</p>
      </div>
    </div>
  )
}

// 404 Page
export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mt-4">Página não encontrada</p>
      </div>
    </div>
  )
}