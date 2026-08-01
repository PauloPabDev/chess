# El universo del ajedrez

Experiencia web interactiva que presenta las piezas de ajedrez mediante partículas 3D animadas con Three.js. Cada pieza se forma progresivamente a partir de partículas dispersas, acompañada de una descripción de su movimiento y su rol en el juego.

## Características

- Renderizado 3D de piezas de ajedrez (peón, caballo, alfil, torre, reina, rey y tablero) a partir de modelos `.stl`.
- Transiciones animadas de partículas entre piezas.
- Panel introductorio con pregunta de bienvenida y contenido adaptado.
- Diseño responsive con recuento de partículas ajustado para dispositivos móviles y de escritorio.
- Soporte para `prefers-reduced-motion`.

## Tecnologías

- HTML, CSS y JavaScript (módulos ES nativos, sin build step).
- [Three.js](https://threejs.org/) (vía CDN con import maps).

## Estructura del proyecto

```
├── index.html          # Punto de entrada
├── css/style.css        # Estilos
├── js/                   # Lógica de la escena, estado y UI
└── stl/                  # Modelos 3D y contenido (pieces.json)
```

## Uso

Al no requerir build, basta con servir el proyecto con cualquier servidor estático, por ejemplo:

```bash
npx serve .
```

Luego abre la URL indicada en el navegador.
