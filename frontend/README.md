# Frontend

Acá va todo lo relacionado con la interfaz que verá el usuario.

## Pantallas previstas (estilo LinkedIn simplificado)

| Pantalla | Qué muestra | Qué base/s de datos consulta |
|---|---|---|
| Login / Registro | Email + contraseña, alta de usuario | Cloud SQL |
| Feed | Muro con posts de las personas que sigo | MongoDB (posts) + Cassandra (notificaciones) |
| Mi Perfil | Datos personales, experiencia, educación, posts propios | Cloud SQL + MongoDB |
| Mi Red | Conexiones aceptadas + "personas que quizá conozcas" | Neo4j |
| Empleos | Listado de ofertas + postulación | Cloud SQL |
| Mensajes | Chat directo y grupal | Cassandra |
| Notificaciones | Lista ordenada por fecha | Cassandra |

## Estructura prevista (cuando arranquemos la codificación)

```
frontend/
├── pages/    # Archivos HTML de cada pantalla
├── styles/   # CSS (Bootstrap + estilos propios)
└── scripts/  # JavaScript para interactividad
```

## Estilo visual

- Paleta tipo LinkedIn (azul institucional `#0A66C2`)
- Bootstrap 5 para componentes y diseño responsivo (cumple RNF5)
- Iconos: Bootstrap Icons
- Layout simple: navbar arriba + contenido centrado + footer

## Estado actual

Vacío. Se llena cuando lleguemos al paso de crear los templates HTML.
