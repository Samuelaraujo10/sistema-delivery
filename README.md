# Sistema de Delivery Multi-Lojas 🍔🛵

Bem-vindo ao **CG Delivery**, uma plataforma full-stack moderna projetada para conectar clientes a diversos estabelecimentos gastronômicos com suporte a criação de cardápios dinâmicos, montadores de pratos e gestão de pedidos em tempo real.

## 🚀 Como o Projeto Evoluiu (Roadmap de Features)

Este projeto foi construído em etapas (commits lógicos), separando as responsabilidades para garantir um código limpo, escalável e de fácil manutenção:

### 1. 🏗️ Setup e Configurações Iniciais
- Estruturação do projeto no padrão de **Monorepo** (Frontend com React + Vite / Backend com Node.js + Express).
- Configuração de dependências essenciais: `axios`, `react-router-dom`, `sequelize` e bibliotecas de segurança (`helmet`, `cors`).

### 2. 🗄️ Modelagem de Dados e Banco
- Configuração do **SQLite** para persistência ágil de dados.
- Criação das entidades principais utilizando ORM Sequelize: `User`, `Establishment`, `Category`, `Product` e `Order`.

### 3. 🔐 Autenticação e Perfis de Usuário
- Implementação de um sistema de login e registro seguro utilizando **JWT** e bcrypt.
- Separação de perfis de usuário (`admin` vs `customer`), garantindo que lojistas tenham painéis de gestão enquanto os clientes têm a visão de compra.
- Criação de telas e rotas privadas usando proteções do React Router.

### 4. 🍽️ Gestão de Estabelecimentos e Cardápio Dinâmico
- Criação da **Vitrine de Lojas** na página inicial, permitindo listar e pesquisar restaurantes por categoria.
- Painel para o lojista criar e editar produtos do cardápio em tempo real.
- Suporte para upload de logos dos restaurantes e parametrização das cores da marca (White-label por loja).

### 5. 🍕 Montadores Interativos (Builders)
Uma das features mais inovadoras do projeto: **Montadores de Pratos**.
Permite que o lojista cadastre regras de montagem para produtos complexos:
- **Monte sua Pizza**: Escolha de sabores fracionados, tamanhos e bordas com cálculo avançado da fatia mais cara.
- **Monte seu Açaí**: Seleção de complementos, frutas, cremes e caldas.
- **Monte sua Massa**: Escolha do tipo de massa, proteínas e regras flexíveis de "X acompanhamentos grátis".

### 6. 🛒 Carrinho, Checkout e Acompanhamento
- Sistema de **Carrinho Global** gerenciado via localStorage para persistência.
- Sugestões de upsell ("Que tal uma bebida?") baseadas nas categorias antes de fechar o pedido.
- Tela de checkout intuitiva com cálculo automático de subtotal, taxa de entrega e regras de pedido mínimo por loja.
- Acompanhamento do pedido via **Server-Sent Events (SSE)**, garantindo que o cliente veja a mudança de status em tempo real.

### 7. 📊 Painel PDV e Dashboard (Lojista)
- Criação de um PDV ágil para a cozinha: o lojista visualiza os novos pedidos e os move por colunas (Kanban) como "Novos", "Em Preparo" e "Saiu para Entrega".
- Emissão sonora de notificação para novos pedidos.

### 8. 💸 Pagamento Pix e Notificações no WhatsApp
- **Geração de QR Code e Pix Copia e Cola** automático utilizando o padrão BR Code e as chaves Pix cadastradas pelo estabelecimento.
- **Integração Web WhatsApp**: Tanto o cliente pode chamar a loja, quanto a loja possui um atalho rápido no seu PDV para abrir o WhatsApp Web enviando uma mensagem pronta para cobrar o envio do comprovante Pix ao cliente.

---

## 🛠️ Tecnologias Utilizadas

**Frontend:**
- React.js + Vite
- React Router DOM
- Zustand (Gerenciamento de Estado)
- CSS modules e custom properties
- Lucide React (Ícones)
- qrcode.react (Geração Pix)

**Backend:**
- Node.js & Express
- Sequelize ORM (SQLite)
- JSON Web Token (JWT)
- bcryptjs
- Twilio SDK (para notificações assíncronas)

## 📦 Como Rodar o Projeto

1. Instale as dependências na pasta do backend e inicie o servidor:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. Em um novo terminal, faça o mesmo para o frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. O frontend ficará disponível em `http://localhost:5173`.
