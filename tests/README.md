# Tests

Tests unitarios y de integración (pytest).

```bash
pytest
```

Estructura sugerida:
- `tests/test_sql.py` — tests del modelo relacional
- `tests/test_mongo.py` — tests de colecciones
- `tests/test_cassandra.py` — tests de queries por partition key
- `tests/test_neo4j.py` — tests de recomendaciones
- `tests/test_routes.py` — tests de endpoints Flask
