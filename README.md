# Card Checkout Fullstack

Aplicacion Full Stack que simula el checkout de un producto consumiendo una API Sandbox de pagos con tarjeta. Construida con arquitectura hexagonal, Railway Oriented Programming y CI/CD completo.

---

## Stack

| Capa | Tecnologia |
|------|-----------|
| **Frontend** | React 19 · TypeScript · Vite 8 · Redux Toolkit · React Router · TailwindCSS v4 · Jest · React Testing Library |
| **Backend** | NestJS 11 · TypeScript · Prisma v7 · PostgreSQL 16 · Jest · Supertest |
| **Infra** | AWS CDK 2 · S3 · CloudFront · ECS Fargate · RDS · Docker · GitHub Actions |
| **Diseno** | Stitch (Fintech E-commerce System) · Inter · Mobile-first |

---

## Arquitectura Backend — Hexagonal (Ports & Adapters)

```
src/
├── domain/               # Entidades, Value Objects, Puertos (interfaces)
│   ├── entities/          # Product
│   ├── value-objects/     # Money, CardNumber (próximo)
│   ├── repositories/      # IProductRepository, IPaymentGateway (próximo)
│   └── services/          # Lógica de dominio pura
├── application/           # Casos de uso + DTOs
│   ├── common/            # Result<T,E>
│   ├── dto/               # (próximo)
│   └── use-cases/         # GetProducts, GetProductById
├── infrastructure/        # Adaptadores concretos
│   ├── persistence/       # PrismaService, ProductPrismaRepository
│   └── payment-gateway/   # (próximo)
└── interfaces/            # Controllers HTTP
    └── http/
        ├── controllers/   # ProductController
        ├── webhooks/      # (próximo)
        └── modules/       # ProductModule
```

**Reglas:**
- El dominio nunca importa de capas externas
- Los controladores solo reciben peticiones y delegan en use cases
- Las integraciones externas (Prisma, pasarela de pagos) se implementan como adapters detras de puertos definidos en dominio

### Railway Oriented Programming (ROP)

Los casos de uso no lanzan excepciones para errores de negocio. Retornan `Result<T, E>`:

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Cada paso del caso de uso se encadena. Un fallo en cualquier eslabon corta la cadena y propaga el error tipado hasta el Controller, que lo mapea a HTTP:

| Error | HTTP Status |
|-------|-------------|
| `ValidationError` | 400 |
| `NotFoundError` | 404 |
| `PaymentError` | 402 |
| `InsufficientStockError` | 409 |
| Generico | 500 |

### Decision de Arquitectura: Webhook vs Polling

- **Webhook (primario)**: `POST /webhooks/payment-events` con validacion de firma de integridad. Mas fiel al comportamiento real de un gateway.
- **Polling (fallback)**: Si el webhook no llega en 30s, el backend consulta el estado con exponential backoff (1s, 2s, 4s, 8s, max 5 reintentos).

**Trade-off**: Webhook requiere un endpoint publico accesible desde el proveedor (ECS con ALB publico). Polling es mas simple pero depende de que el cliente mantenga la sesion activa.

---

## Arquitectura Frontend — Feature-Based

```
src/
├── app/
│   ├── router.tsx         # React Router (layout + rutas)
│   └── store.ts           # Redux Toolkit
├── features/
│   ├── product/
│   │   ├── api/            # productService.ts
│   │   ├── components/     # ProductCard, ProductList, ProductDetail, FilterBar
│   │   └── store/          # productSlice.ts
│   ├── checkout/           # (próximo)
│   ├── payment/            # (próximo)
│   └── transaction/        # (próximo)
├── layouts/
│   └── MainLayout.tsx     # Header + footer + Outlet
├── shared/
│   ├── api/               # Axios client
│   ├── components/        # (próximo)
│   └── hooks/             # useAppDispatch, useAppSelector, useDebounce
└── pages/                 # (próximo)
```

---

## Base de Datos

### Modelo Actual (Prisma)

```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String
  price       Float
  stock       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("products")
}
```

### Modelo Completo (próximas fases)

| Entidad | Relacion | Descripcion |
|---------|----------|-------------|
| `Product` | 1—N `Transaction` | Producto con stock y precio |
| `Transaction` | N—1 `Product`, 1—1 `Customer`, 1—1 `Delivery` | Transaccion de pago |
| `Customer` | 1—1 `Transaction` | Datos del comprador |
| `Delivery` | 1—1 `Transaction` | Direccion de entrega |

---

## API Endpoints

| Metodo | Ruta | Descripcion | Filtros |
|--------|------|-------------|---------|
| `GET` | `/api/health` | Health check | — |
| `GET` | `/api/products` | Listar productos | `?search=&sortBy=price&sortOrder=asc` |
| `GET` | `/api/products/:id` | Producto por ID | — |
| `GET` | `/` | Health check ALB (sin prefix) | — |

### Ejemplos

```bash
# Listar todos
curl http://localhost:3000/api/products

# Buscar + ordenar
curl "http://localhost:3000/api/products?search=chaqueta&sortBy=price&sortOrder=desc"

# Producto por ID
curl http://localhost:3000/api/products/<uuid>

# Health
curl http://localhost:3000/api/health
```

---

## Coverage

| | Backend | Frontend |
|---|---|---|
| **Statements** | 98.64% | 85.96% |
| **Branches** | 87.50% | 68.25% |
| **Functions** | 97.29% | 74.35% |
| **Lines** | 98.50% | 88.18% |
| **Tests** | 60 | 27 |
| **Runner** | Jest 30 | Jest 30 |

> El pipeline de CI falla si el coverage baja de los thresholds configurados.

---

## Setup Local

### Requisitos

- Node.js 22+
- PostgreSQL 16+
- Docker (opcional)

### Instalacion

```bash
# Clonar
git clone <repo-url>
cd card-checkout-fullstack

# PostgreSQL con Docker
docker compose up -d

# Backend
cd backend
cp .env.example .env   # Configurar DATABASE_URL
npm install
npx prisma migrate dev
npx prisma generate
npx tsx prisma/seed.ts
npm run start:dev       # http://localhost:3000

# Frontend
cd frontend
npm install
npm run dev             # http://localhost:5173
```

### Variables de Entorno

**Backend** (`.env`):

```env
PORT=3000
DATABASE_URL=postgresql://postgres:admin@localhost:5432/card_checkout?schema=public
PAYMENT_GATEWAY_API_KEY=     # (próxima fase)
PAYMENT_GATEWAY_SIGNATURE_SECRET=  # (próxima fase)
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`.env.development`):

```env
VITE_API_URL=http://localhost:3000
```

---

## CI/CD

### Git Flow

```
main          ← Produccion (deploy automatico)
  └── develop ← Integracion
       └── feature/* ← Features
```

### GitHub Actions

| Workflow | Disparador | Que hace |
|----------|-----------|---------|
| `ci.yml` | Push a `feature/*`, PRs | Lint → Test → Coverage check → Build |
| `deploy.yml` | Push a `main` | Build Docker → Push ECR → Deploy ECS + S3/CloudFront |

### Conventional Commits

```
feat(product): add search and sort filters
fix(security): strip card data from redux-persist
test(checkout): add ROP chain error path tests
```

---

## Despliegue AWS

```
CloudFront CDN
 ├── S3 (frontend static)
 └── ALB (publico)
      └── ECS Fargate (NestJS)
           └── RDS PostgreSQL (private subnet)
```

- **Frontend**: React build → S3 → CloudFront (HTTPS, CDN global)
- **Backend**: NestJS → Docker → ECR → ECS Fargate con ALB publico (necesario para webhooks)
- **Base de datos**: RDS PostgreSQL en subnet privada
- **Secretos**: AWS Secrets Manager (DB_PASSWORD, API keys)

### Comandos CDK

```bash
cd infra
npm install
cdk bootstrap
cdk deploy
```

---

## Seguridad

- **PAN nunca persistido**: El numero completo de tarjeta no se guarda en DB, localStorage ni logs. Solo se envia al gateway y se descarta.
- **Helmet**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Rate Limiting**: 5 req/min en endpoints de pago (`@nestjs/throttler`)
- **CORS**: Restringido al dominio del frontend
- **Webhook**: Validacion de firma de integridad antes de procesar eventos
- **Secrets**: Variables sensibles via GitHub Secrets / AWS Secrets Manager, nunca en codigo

---

## Testing

```bash
# Backend
cd backend && npm test              # Unit + integration
cd backend && npm test -- --coverage # Con coverage

# Frontend
cd frontend && npm test              # Unit + componentes
cd frontend && npm test -- --coverage # Con coverage
```

---

## Proximas Fases

- [ ] `POST /checkout` — Crear transaccion + procesar pago
- [ ] `POST /webhooks/payment-events` — Recepcion de eventos del gateway
- [ ] Formulario de tarjeta + direccion (frontend)
- [ ] Backdrop de resumen de pago
- [ ] Pantalla de resultado de transaccion
- [ ] `redux-persist` con exclusion de datos de tarjeta
- [ ] Prisma models: Transaction, Customer, Delivery
