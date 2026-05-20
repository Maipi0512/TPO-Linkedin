# LinkedIn TPO - Grupo 3

Trabajo práctico de simulación de una red profesional tipo LinkedIn, implementado con **arquitectura de persistencia políglota** (SQL + 3 NoSQL).

## Integrantes

- Pablo
- Maria Paz
- Federico

## Entrega

10 de junio de 2026

---

## Arquitectura

| Base de datos | Tipo | Responsabilidad |
|---|---|---|
| **Oracle** (web) | Relacional | Usuarios, autenticación, sesiones, Empresas, Empleos, Postulaciones, Skills, Educación, Experiencia laboral |
| **MongoDB Atlas** | Documental | Perfiles extendidos, Posts, Comentarios |
| **Neo4j Aura** | Grafos | Conexiones entre usuarios, recomendaciones, membresías a grupos |
| **DataStax Astra (Cassandra)** | Columnar | Mensajes directos, mensajes de grupo, Notificaciones |

## Stack

- **Backend**: Python + FastAPI
- **Frontend**: React + Vite
- **Versionado**: Git + GitHub

---

## Estructura del repositorio

```
linkedin-tpo-grupo3/
├── backend/          # API en Python (FastAPI)
├── frontend/         # UI en React (Vite)
├── docs/             # Documentación, DER, decisiones de diseño
│   ├── DER.png
│   ├── consigna.pdf
│   └── decisiones.md
└── README.md
```

## Cómo correr el proyecto

> En construcción. Se completará a medida que avance el desarrollo.

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Y completar con las credenciales
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Convenciones de trabajo

- **Ramas**: `main` (estable) → `develop` (integración) → `feature/<dominio>` (trabajo individual)
- **Pull Requests**: toda rama feature se mergea a develop vía PR, revisado por al menos 1 compañero/a.
- **Commits**: en español, descriptivos. Ej: `feat: endpoint de registro de usuario`, `fix: validación de email en login`.
- **Credenciales**: NUNCA commitear el archivo `.env`. Solo `.env.example` con los nombres de las variables.