# Schemas — definiciones de esquema de cada motor

| Carpeta | Contenido | Paso del proyecto |
|---|---|---|
| `sql/` | Scripts DDL (`CREATE TABLE`, índices, FKs) para Cloud SQL | Paso 4 |
| `mongo/` | Documentación de la forma de los documentos JSON | Paso 5 |
| `cassandra/` | Scripts CQL (`CREATE KEYSPACE`, `CREATE TABLE`) | Paso 6 |
| `neo4j/` | Constraints e índices Cypher | Paso 7 |

El reparto de qué entidad va a qué motor está justificado en [`../docs/modelo-datos.md`](../docs/modelo-datos.md).
