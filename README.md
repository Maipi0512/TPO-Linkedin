# TPO-Linkedin — Trabajo Práctico de Bases de Datos

Simulación de la aplicación LinkedIn usando **persistencia políglota**: 1 motor SQL + 3 motores NoSQL.

## Equipo

- Bentivegna, Valentina
- Escudero, Morena
- Rodríguez, Megan
- Rodríguez, Melanie

## Stack

| Motor | Tipo | Qué guarda |
|---|---|---|
| Cloud SQL | Relacional | Usuarios, empresas, empleos, postulaciones, educación, experiencia laboral, habilidades |
| MongoDB | Documental | Posts, comentarios, grupos, eventos |
| Cassandra | Columnar | Notificaciones, mensajes directos, mensajes de grupo, feed pre-computado |
| Neo4j | Grafo | Conexiones entre personas, relaciones con empresas y habilidades |

El reparto detallado con justificación por RF/RNF está en [`docs/modelo-datos.md`](docs/modelo-datos.md).

## Estado actual del proyecto

**Fase: organización y diseño.** Todavía no hay código.

## Estructura de carpetas

```
TPO-Linkedin/
├── docs/                       # Documentación de diseño
│   └── modelo-datos.md         # Reparto entidades → motor (justificado)
├── schemas/                    # Esquemas de cada base (a definir)
│   ├── sql/
│   ├── mongo/
│   ├── cassandra/
│   └── neo4j/
├── frontend/                   # Interfaz de usuario (HTML/CSS/JS)
├── seeds/                      # Datos de prueba (a definir)
├── tests/                      # Tests (a definir)
└── README.md
```

## Próximos pasos

1. Definir el esquema SQL (DDL de las tablas)
2. Definir la estructura de documentos MongoDB
3. Definir el esquema Cassandra (CQL)
4. Definir el modelo Neo4j (nodos, relaciones, constraints)
5. Recién después, codificar el backend y el frontend
