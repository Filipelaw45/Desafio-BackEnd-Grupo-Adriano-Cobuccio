## Desafio para back-end Grupo Adriano Cobuccio

API com NestJS de carteira financeira.

## 📋 Pré-requisitos

### Para execução via Docker
- [Docker](https://www.docker.com/get-started) (versão 20.10 ou superior)
- [Docker Compose](https://docs.docker.com/compose/install/) (versão 2.0 ou superior)

### Para execução Local
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [PostgreSQL](https://www.postgresql.org/download/) (versão 14 ou superior)
- [npm](https://www.npmjs.com/)

## 🚀 Configuração Inicial

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd Desafio-BackEnd-Grupo-Adriano-Cobuccio
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

---

## 🐳 Execução com Docker

### 1. Build e inicialização dos containers
```bash
docker-compose up --build
```

### 2. Executar em background (modo detached)
```bash
docker-compose up -d
```

### 3. Verificar status dos containers
```bash
docker-compose ps
```

### 4. Visualizar logs
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f api
docker-compose logs -f postgres
```

### 5. Parar os containers
```bash
docker-compose down
```

### 6. Parar e remover volumes (dados do banco)
```bash
docker-compose down -v
```

### 📍 URLs de Acesso (Docker)
- **Pode Variar conforme seu .env**
- **API**: http://localhost:3000
- **Swagger (Documentação da API)**: http://localhost:3000/api

---

## 💻 Execução Local

### 1. Configurar o Banco de Dados

#### Criar o banco de dados PostgreSQL

### 2. Configurar a API (Backend)

```bash

# Instalar dependências
npm install

# Executar migrações do banco de dados
npm run migration:run

# Iniciar em modo desenvolvimento
npm run start:dev

# OU iniciar em modo produção
npm run build
npm run start:prod
```

### 📍 URLs de Acesso (Local)
- **API**: http://localhost:3000
- **Swagger (Documentação da API)**: http://localhost:3000/api

---

## 📖 Documentação da API

A documentação completa da API está disponível através do Swagger:

**http://localhost:3000/api**

O Swagger fornece:
- 📋 Lista completa de endpoints
- 📝 Schemas de requisição e resposta
- 🧪 Interface para testar endpoints
- 🔐 Documentação de autenticação

---

## 📄 Licença

UNLICENSED - Projeto privado
