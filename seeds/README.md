# Seeds — scripts de carga de datos de prueba

Scripts en Python que generan datos sintéticos (con la librería `Faker`) y los cargan en las 4 bases.

- `seed_sql.py` — usuarios, empresas, empleos, postulaciones
- `seed_mongo.py` — posts, comentarios, grupos
- `seed_cassandra.py` — notificaciones, mensajes, feed
- `seed_neo4j.py` — conexiones entre personas, relaciones empresa-persona, habilidades

Uso (después de levantar las DBs con `docker-compose up -d`):

```bash
python seeds/seed_sql.py
python seeds/seed_mongo.py
python seeds/seed_cassandra.py
python seeds/seed_neo4j.py
```

**Orden recomendado**: SQL primero (genera los user_id), luego los demás que referencian esos IDs.
