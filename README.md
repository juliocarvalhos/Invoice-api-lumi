# Lumi Invoice API

API RESTful para processamento inteligente de faturas de energia elétrica. Recebe PDFs de faturas, extrai dados estruturados via LLM (Google Gemini), calcula variáveis de negócio e persiste os resultados em banco de dados relacional.

## Tecnologias e justificativas

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | NestJS + TypeScript | Arquitetura modular com injeção de dependência nativa, ideal para APIs com múltiplas responsabilidades. TypeScript garante tipagem forte, essencial para mapear os dados extraídos pelo LLM sem ambiguidades. |
| Banco de dados | PostgreSQL 15 (Docker) | Banco relacional robusto com suporte a índices compostos, adequado para queries de filtro e agregação dos dados das faturas. Docker elimina dependência de instalação local. |
| ORM | Prisma | Schema declarativo e geração automática de tipos TypeScript a partir do banco, garantindo consistência entre a camada de dados e o código. Migrations versionadas facilitam evolução do schema. |
| LLM | Google Gemini 2.5 Flash | Suporte nativo a documentos PDF via `inlineData` sem necessidade de extração prévia de texto. O modo `responseMimeType: application/json` força saída estruturada, reduzindo alucinações e eliminando parsing frágil. |
| Upload | Multer | Integração nativa com NestJS via `@nestjs/platform-express`, com suporte a `fileFilter` para rejeitar arquivos não-PDF e `limits` para controle de tamanho, sem dependências extras. |
| Documentação | Swagger / OpenAPI | Interface gráfica para testar endpoints sem ferramentas externas, gerada automaticamente a partir dos decorators do NestJS — documentação sempre sincronizada com o código. |
| Testes | Jest | Framework padrão do NestJS com suporte a mocks de módulos inteiros (`jest.mock`), permitindo isolar completamente o LLM e o banco durante os testes unitários. |

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores:

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | String de conexão com o PostgreSQL | `postgresql://postgres:postgres@localhost:5432/lumi_db` |
| `GEMINI_API_KEY` | Chave de API do Google Gemini (obtenha em [aistudio.google.com](https://aistudio.google.com)) | `AIzaSy...` |
| `PORT` | Porta em que o servidor vai escutar | `3000` |

> A `GEMINI_API_KEY` é obrigatória para o processamento de faturas. Sem ela, o endpoint de upload retornará erro 503.

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [Docker](https://www.docker.com/) + Docker Compose

## Setup local

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd lumi-invoice-api

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Abra o .env e preencha GEMINI_API_KEY com sua chave do Google AI Studio
# https://aistudio.google.com/

# 3. Subir o banco de dados
docker compose up -d

# 4. Instalar dependências
npm install

# 5. Rodar migrations
npx prisma migrate deploy

# 6. Iniciar o servidor
npm run start:dev
```

O servidor estará disponível em `http://localhost:3000`.

## Documentação interativa (Swagger)

Acesse `http://localhost:3000/api` para explorar e testar todos os endpoints via interface gráfica.

## Endpoints

### Health Check
```bash
GET /health
# Resposta: { "status": "ok" }
```

### Upload de Fatura
```bash
curl -X POST http://localhost:3000/invoices/upload \
  -F "file=@fatura.pdf"
```

Resposta `201 Created`:
```json
{
  "id": "2cb07bb1-c230-443f-a960-11aef201b807",
  "numero_cliente": "7204076116",
  "mes_referencia": "JAN/2024",
  "energia_eletrica_kwh": 50,
  "energia_eletrica_valor": 47.75,
  "energia_sceee_kwh": 456,
  "energia_sceee_valor": 232.42,
  "energia_compensada_kwh": 456,
  "energia_compensada_valor": -222.22,
  "contrib_ilum_publica": 49.43,
  "consumo_energia_kwh": 506,
  "energia_compensada_total_kwh": 456,
  "valor_total_sem_gd": 329.6,
  "economia_gd": -222.22,
  "created_at": "2026-02-25T12:18:39.001Z"
}
```

Erros possíveis:
- `400` — arquivo não enviado ou não é PDF
- `503` — API do Gemini indisponível
- `422` — resposta do LLM não pôde ser interpretada

### Listagem de Faturas
```bash
# Todas as faturas
curl http://localhost:3000/invoices

# Filtrar por cliente
curl "http://localhost:3000/invoices?numero_cliente=7204076116"

# Filtrar por mês
curl "http://localhost:3000/invoices?mes_referencia=JAN/2024"

# Filtrar por cliente e mês
curl "http://localhost:3000/invoices?numero_cliente=7204076116&mes_referencia=JAN/2024"
```

Resposta `200 OK`: array de faturas (mesmo formato do upload). Retorna `[]` quando nenhum registro corresponde ao filtro.

### Dashboard — Energia (kWh)
```bash
# Todos os clientes
curl http://localhost:3000/dashboard/energy

# Por cliente
curl "http://localhost:3000/dashboard/energy?numero_cliente=7204076116"
```

Resposta `200 OK`:
```json
[
  {
    "mes_referencia": "JAN/2024",
    "consumo_energia_kwh": 506,
    "energia_compensada_total_kwh": 456
  }
]
```

### Dashboard — Financeiro (R$)
```bash
# Todos os clientes
curl http://localhost:3000/dashboard/financial

# Por cliente
curl "http://localhost:3000/dashboard/financial?numero_cliente=7204076116"
```

Resposta `200 OK`:
```json
[
  {
    "mes_referencia": "JAN/2024",
    "valor_total_sem_gd": 329.6,
    "economia_gd": -222.22
  }
]
```

## Variáveis calculadas

| Variável | Fórmula |
|---|---|
| `consumo_energia_kwh` | `energia_eletrica_kwh` + `energia_sceee_kwh` |
| `energia_compensada_total_kwh` | `energia_compensada_kwh` |
| `valor_total_sem_gd` | `energia_eletrica_valor` + `energia_sceee_valor` + `contrib_ilum_publica` |
| `economia_gd` | `energia_compensada_valor` |

## Testes

```bash
# Rodar todos os testes unitários
npm run test

# Rodar com relatório de cobertura
npm run test:cov
```

Os testes são completamente isolados — nenhuma chamada real ao Gemini ou ao banco de dados é feita durante os testes.

## Arquitetura de módulos

```
src/
  app.module.ts           # Módulo raiz
  prisma/                 # PrismaModule global (conexão com BD)
  llm/                    # LlmModule: GeminiService (extração via LLM)
  invoices/               # InvoicesModule: upload, listagem, lógica de negócio
  dashboard/              # DashboardModule: endpoints de dados consolidados
```
