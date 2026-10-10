# Operación Número 13 · Escape room

Escape room de apuntar y hacer clic, en el navegador, basado en el cortometraje **«Operación Número 13»** de Carlos Ballesteros.

Jandro ha desaparecido por arte de magia y ha dejado una casa llena de trucos. Reúne las tres cartas del tarot, colócalas en su orden, consigue tu gorra de Guardia Civil y supera su último truco... antes de que se acabe el tiempo (10, 6 o 3 minutos).

**Jugar:** https://nicolastacoronte.github.io/operacion-n13/

## Características
- 7 salas explorables (salón, cocina, dormitorio, despacho, baño, jardín, coche) más el pasadizo final, con un mapa para viajar.
- Puzles de códigos, contraseñas, objetos que se combinan y un último truco de cartas.
- Cinemáticas con diálogos inspirados en el corto, tres finales (uno secreto) y una lectura de tarot opcional.
- Visor 3D para examinar los objetos, logros y récords guardados en el navegador, y muchos guiños al corto.
- Sin dependencias ni instalación: HTML + CSS + JavaScript puro (solo las tipografías vienen de Google Fonts).

## Probarlo en local
```bash
python3 -m http.server 8123   # y abrir http://localhost:8123
```

## Estructura
| Archivo | Contenido |
| --- | --- |
| `escape.js` | Datos y lógica: objetos, zonas de cada sala (coordenadas en %), puzles, pistas, logros |
| `ui.js` | Interfaz: escena, inventario, modales, minijuegos (tarot y último truco), escenas, logros |
| `scenes.js` | Guion de las cinemáticas |
| `tarot.js` | Preguntas y arcanos de la lectura de tarot |
| `viewer3d.js` | Visor 3D de los objetos (WebGL propio) |
| `audio.js` | Efectos de sonido sintetizados (no hay música) |
| `assets/` | Fondos, objetos, personajes y modelos 3D optimizados |

Los modelos 3D se generan desde los `.obj` originales con `tools/convert_obj.py` (en el proyecto de trabajo).

## Créditos y aviso
Basado en el cortometraje «Operación Número 13» de Carlos Ballesteros. Proyecto de fans sin ánimo de lucro, pendiente de autorización de los autores y de la productora. Parte de los gráficos se han generado con herramientas de IA.
