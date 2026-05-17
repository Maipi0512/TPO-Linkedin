Ya dejé armada la parte de MongoDB del TP.

Qué hice:

* Creé la base `linkedin_simulation` en MongoDB Compass
* Armé las colecciones:

    * posts
    * comments
    * groups
    * post_likes

Después cargué documentos de ejemplo reales para simular:

* publicaciones
* artículos
* eventos
* comentarios
* grupos
* likes

También exporté todas las colecciones en archivos JSON para subirlas al repo y que todos podamos reutilizarlas/importarlas.


Ejemplos del modelo:

* `tipo: "post"` → publicación normal
* `tipo: "article"` → artículo
* `tipo: "event"` → evento profesional

Los grupos tienen arrays de miembros embebidos y los posts manejan tags y multimedia.


