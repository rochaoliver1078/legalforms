# LegalForms 📋

Formulários inteligentes para legalização de empresas. Estilo JotForm, com lógica condicional, sócios dinâmicos e compartilhamento via WhatsApp/e-mail.

## Stack

- **Frontend**: Next.js 14 + React
- **Banco de dados**: Supabase (PostgreSQL)
- **Upload de arquivos**: Supabase Storage
- **E-mail**: Resend
- **Hospedagem**: Vercel

## Setup rápido

### 1. Supabase
- Crie um projeto em [supabase.com](https://supabase.com)
- Execute o SQL do arquivo `supabase-setup.sql` no SQL Editor
- Copie a URL e as chaves (Settings → API)

### 2. Resend
- Crie conta em [resend.com](https://resend.com)
- Copie a API key

### 3. Configurar variáveis
```bash
cp .env.example .env.local
# Preencha as variáveis com seus valores
```

### 4. Rodar local
```bash
npm install
npm run dev
```

### 5. Deploy no Vercel
```bash
# Opção 1: Via CLI
npx vercel

# Opção 2: Conecte o GitHub repo no vercel.com
```

Adicione as variáveis de ambiente no dashboard do Vercel.

## Estrutura

```
app/
├── page.tsx              → Tela principal (Meus Formulários + Builder)
├── f/[id]/page.tsx       → Formulário público (link para o cliente)
├── api/forms/route.ts    → CRUD de formulários
├── api/submissions/      → Salvar respostas + notificar
├── api/upload/           → Upload de arquivos
components/
├── LegalFormsApp.jsx     → App completo (Builder + Fill + Share)
lib/
├── supabase.ts           → Cliente Supabase
├── email.ts              → Envio de e-mails via Resend
├── types.ts              → TypeScript types
```

## Funcionalidades

- ✅ Form Builder visual (3 colunas estilo JotForm)
- ✅ Card Form (uma pergunta por tela, otimizado mobile)
- ✅ Campos inteligentes: sócios dinâmicos + alterações multi-evento
- ✅ Compartilhar via link, WhatsApp, e-mail
- ✅ Notificação por e-mail quando cliente preenche
- ✅ Upload de documentos (RG, contratos, etc.)
- ✅ Persistência no Supabase (PostgreSQL)
- ✅ 100% gratuito (Vercel + Supabase + Resend free tiers)

## Custo

**R$ 0/mês** para até ~50.000 acessos e 500 MB de dados.
