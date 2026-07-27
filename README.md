# Card Checkout Fullstack

Aplicacion Full Stack que simula el checkout de un producto consumiendo una API Sandbox de pagos con tarjeta. Construida con arquitectura hexagonal, Railway Oriented Programming y CI/CD completo.

---

## Stack

| Capa | Tecnologia |
|------|-----------|
| **Frontend** | React 19 · TypeScript · Vite 8 · Redux Toolkit · React Router · React Hook Form + Zod · TailwindCSS v4 · Jest · React Testing Library |
| **Backend** | NestJS 11 · TypeScript · Prisma v7 · PostgreSQL 16 · Jest · Supertest |
| **Infra** | AWS CDK 2 · S3 · CloudFront · ECS Fargate · RDS · Docker · GitHub Actions |
| **Diseno** | Stitch (Fintech E-commerce System) · Inter · Mobile-first |

---

## Arquitectura Backend — Hexagonal (Ports & Adapters)

```
src/
├── domain/
│   ├── entities/          # Product
│   ├── value-objects/     # Money, CardNumber
│   ├── repositories/      # IProductRepository, IPaymentGateway (próximo)
│   └── services/
├── application/
│   ├── common/            # Result<T,E>
│   └── use-cases/         # GetProducts, GetProductById
├── infrastructure/
│   ├── persistence/       # PrismaService, ProductPrismaRepository
│   └── payment-gateway/   # (próximo)
└── interfaces/
    └── http/
        ├── controllers/   # ProductController
        ├── webhooks/      # (próximo)
        └── modules/       # ProductModule
```

**Reglas:**
- El dominio nunca importa de capas externas
- Los controladores solo reciben peticiones y delegan en use cases
- Las integraciones externas (Prisma, pasarela de pagos) se implementan como adapters detras de puertos definidos en dominio

### Value Objects

| VO | Descripcion |
|----|-------------|
| `Money` | Inmutable, `amount >= 0`, moneda `COP`. Operaciones: `add`, `subtract`, `multiply` |
| `CardNumber` | Validacion Luhn, deteccion BIN (Visa/MasterCard), enmascaramiento. `toString()` nunca expone el PAN completo |

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

La deteccion de errores usa `instanceof` (no `constructor.name`), garantizando que funcione tras minificacion/bundling.

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
│   └── store.ts           # Redux Toolkit (product + checkout)
├── features/
│   ├── product/
│   │   ├── api/            # productService.ts
│   │   ├── components/     # ProductCard, ProductList, ProductDetail, FilterBar
│   │   └── store/          # productSlice.ts
│   └── checkout/
│       ├── components/     # CheckoutPage, CreditCardPreview, ShippingSection, PaymentSection
│       ├── store/          # checkoutSlice.ts, checkoutTypes.ts
│       └── checkoutSchema.ts  # Zod schema
├── layouts/
│   └── MainLayout.tsx     # Header sticky + nav + footer
└── shared/
    ├── api/               # Axios client
    ├── components/        # CheckoutStepper (reutilizable)
    ├── hooks/             # useAppDispatch, useAppSelector, useDebounce
    └── utils/             # luhn.ts, binDetect.ts (con @see cross-ref a backend)
```

### Flujo de navegacion

```
/ (catalogo) → click en producto → /product/:id (detalle + selector cantidad)
  → "Proceder al Pago" → /checkout (formulario + CreditCardPreview)
  → "Continuar al Resumen" → (próximo)
```

### Seguridad de datos en frontend

- El numero completo de tarjeta (PAN) **jamas se persiste** en Redux ni localStorage
- `CreditCardPreview` muestra solo version enmascarada (`**** **** **** 4242`)
- Deteccion de marca (Visa/MasterCard) en tiempo real al escribir
- Validacion Luhn en cliente (Zod) y servidor (CardNumber VO)
- Formateo automatico: tarjeta en grupos de 4, vencimiento `MM/YY` auto-insertado

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

### Modelo Completo (proximas fases)

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
| `GET` | `/api/products` | Listar productos | `?search=&minPrice=&maxPrice=&sortBy=price&sortOrder=asc` |
| `GET` | `/api/products/:id` | Producto por ID | — |
| `POST` | `/api/transactions` | Crear transaccion PENDING | Body: `productId`, `quantity`, `customer`, `delivery` |
| `GET` | `/api/transactions/:id` | Consultar transaccion | — |
| `POST` | `/api/transactions/:id/pay` | Procesar pago | Body: `cardNumber`, `cardCvc`, `cardExpiryMonth`, `cardExpiryYear`, `cardHolder`, `installments`, `customerEmail` |
| `GET` | `/` | Health check ALB (sin prefix) | — |

### Ejemplos

```bash
# Listar todos
curl http://localhost:3000/api/products

# Buscar + ordenar
curl "http://localhost:3000/api/products?search=chaqueta&sortBy=price&sortOrder=desc"

# Filtrar por rango de precio
curl "http://localhost:3000/api/products?minPrice=50000&maxPrice=200000"

# Producto por ID
curl http://localhost:3000/api/products/<uuid>

# Health
curl http://localhost:3000/api/health
```

---

## Coverage

| | Backend | Frontend |
|---|---|---|
| **Statements** | 95.87% | 86.17% |
| **Branches** | 81.56% | 73.33% |
| **Functions** | 93.44% | 75.00% |
| **Lines** | 96.25% | 88.23% |
| **Tests** | 91 | 35 |
| **Runner** | Jest 30 | Jest 30 |

> El pipeline de CI falla si el coverage baja de los thresholds configurados (backend: 80% global, frontend: 80/65/68/80).

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
PAYMENT_GATEWAY_API_KEY=     # (proxima fase)
PAYMENT_GATEWAY_SIGNATURE_SECRET=  # (proxima fase)
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
fix(security): use instanceof instead of constructor.name
refactor(checkout): split CheckoutPage into smaller components
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

- **PAN nunca persistido**: El numero completo de tarjeta no se guarda en DB, localStorage ni logs. `CardNumber.toString()` y `toJSON()` retornan solo la version enmascarada (`**** **** **** 1234`).
- **Validacion dual**: Luhn + BIN en backend (CardNumber VO) y frontend (shared/utils)
- **Helmet**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Rate Limiting**: 5 req/min en endpoints de pago (`@nestjs/throttler`)
- **CORS**: Restringido al dominio del frontend
- **Webhook**: Validacion de firma de integridad antes de procesar eventos
- **Secrets**: Variables sensibles via GitHub Secrets / AWS Secrets Manager, nunca en codigo
- **SSL**: `rejectUnauthorized` condicionado por `NODE_ENV` — solo deshabilitado en desarrollo

---

## Testing

```bash
# Backend
cd backend && npm test              # Unit + integration (72 tests)
cd backend && npm test -- --coverage

# Frontend
cd frontend && npm test              # Unit + componentes (35 tests)
cd frontend && npm test -- --coverage
```

---

## Calidad de Codigo

El proyecto sigue principios SOLID y Clean Code. Una auditoria completa encontro 0 issues criticos activos. Los hallazgos principales fueron resueltos:

- `CheckoutPage` dividido en 4 archivos (SRP)
- `instanceof` en vez de `constructor.name`
- Errores con `{ cause: error }` para preservar stack trace
- `@see` cross-references en codigo duplicado backend↔frontend
- SSL y logging condicionados por entorno

---

## Proximas Fases

- [x] ~~Catalogo de productos (backend + frontend)~~
- [x] ~~Value objects: Money, CardNumber, TransactionStatus~~
- [x] ~~Filtros y busqueda (backend + frontend)~~
- [x] ~~Formulario de tarjeta + direccion (frontend)~~
- [x] ~~POST /transactions — Crear transaccion PENDING~~
- [x] ~~POST /transactions/:id/pay — Procesar pago con gateway~~
- [x] ~~Backdrop de resumen de pago (frontend)~~
- [x] ~~Pantalla de resultado de transaccion (frontend)~~
- [x] ~~redux-persist (checkout + transaction) con exclusion de datos de tarjeta~~
- [x] ~~Prisma models: Transaction, Customer, Delivery~~
- [x] ~~POST /webhooks/payment-events — Recepcion de eventos del gateway~~
- [x] ~~Sync perezoso en GET /transactions/:id como fallback del webhook~~
- [x] ~~Actualizar stock al confirmar pago (APPROVED)~~
- [x] ~~Polling frontend cada 3s hasta resultado final~~
- [x] ~~Resiliencia al refresh con reanudacion de checkout~~
- [x] ~~Ticket de compra con desglose detallado~~
