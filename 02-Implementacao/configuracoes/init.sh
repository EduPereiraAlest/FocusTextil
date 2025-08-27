#!/bin/bash

# Script de inicialização do Focus Textil Modernizado
# Estrutura reorganizada com configurações centralizadas

echo "🚀 Iniciando Focus Textil Modernizado..."

# Verificar se estamos no diretório correto
if [ ! -f "../package.json" ]; then
    echo "❌ Execute este script a partir da pasta configuracoes/"
    exit 1
fi

# Voltar para o diretório raiz
cd ..

echo "📦 Instalando dependências..."

# Instalar dependências do projeto raiz
npm install

# Instalar dependências do backend
cd backend && npm install && cd ..

# Instalar dependências do frontend  
cd frontend && npm install && cd ..

echo "🐳 Iniciando containers Docker..."

# Ir para a pasta de infraestrutura e subir os containers
cd infrasestrutura
docker-compose up -d

echo "⏰ Aguardando serviços iniciarem..."
sleep 10

echo "🗄️ Executando migrations..."
cd ../backend
npm run db:migrate

echo "🌱 Executando seeds..."
npm run db:seed

echo "✅ Setup completo!"
echo "📱 Frontend: http://localhost:3000"
echo "⚙️ Backend: http://localhost:3001"
echo "🗄️ PostgreSQL: localhost:5432"
echo "🔴 Redis: localhost:6379"

echo "🚀 Para desenvolvimento, execute:"
echo "   cd ../.. && npm run dev"