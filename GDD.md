# Alterdune – GDD

<p align="center">
  <img src="./assets/logo.png" width="350" alt="Logo de Alterdune">
</p>

## 1. Especificaciones básicas
- **Plataforma:** PC  
- **Género:** Puzzle / Aventura 2D (top-down)  
- **Público objetivo:** 12+  
- **Cámara:** Vista aérea fija por sala con transiciones  
- **Estilo visual:** Pixel art  
- **Multijugador:** 2–4 jugadores  

<p align="center">
  <img src="./assets/Tiles.png" width="500" alt="Tileset del juego">
</p>

---

## 2. Concepto
Juego de puzles en vista superior ambientado en un templo desértico antiguo.  
Los jugadores recorren laberintos donde deben presionar botones o recoger llaves para abrir puertas y avanzar hasta el final.  
El progreso es lineal: introducción → tres laberintos → fin.

### Objetivo
Completar los tres laberintos del templo resolviendo los pequeños puzles que bloquean cada salida.

### Mecánicas principales
- Movimiento 4 direcciones (WASD)
- Interacción (E) con botones o llaves
- Puertas que se abren al recoger una llave o pulsar un botón
- Progresión por niveles lineal (sin combate ni enemigos)

---

## 3. Controles
- **WASD**: mover  
- **E**: interactuar (usar botón / recoger llave)  
- **R**: reiniciar nivel  

---

## 4. Flujo de juego (resumen)
Inicio → Intro (se muestran los controles) → Personajes entran al templo → Laberinto 1 → Laberinto 2 → Laberinto 3 → Fin.

<p align="center">
  <img src="./assets/volverMenu.png" width="300" alt="Botón para volver al menú">
</p>

---

## 5. Progresión y niveles
- **Intro:** los personajes aparecen frente al templo, se muestran los controles.  
- **Laberinto 1:** camino sencillo con un botón que abre la salida.  
- **Laberinto 2:** se obtiene una llave que desbloquea una puerta.  
- **Laberinto 3:** combina los dos elementos.  
- **Fin:** pantalla final o animación simple tras completar el templo.  

---

## 6. Diseño visual
- **Paleta:** tonos piedra y arena con acentos dorados o rojos en elementos interactivos.  
- **UI mínima:** contador de llaves, texto de nivel y botón “Reiniciar”.  
- **Logo:** “Alterdune” con tipografía pixel y textura de arena.  
- **Inspiración visual:** templos antiguos, estructuras geométricas y minimalismo.  

<p align="center">
  <img src="./assets/botonCreditos.png" width="200" alt="Botón de créditos">
  <img src="./assets/play.png" width="200" alt="Botón de jugar">
  <img src="./assets/titulo.png" width="400" alt="Título del juego">
</p>

---

## 8. Narrativa
Almas llegan a un templo perdido bajo la arena.  
Al entrar, quedan atrapadas y deben avanzar resolviendo los mecanismos que bloquean el paso.  

<p align="center">
  <img src="./assets/Sprites1.png" width="450" alt="Sprites del jugador y elementos del entorno">
</p>

<p align="center">
  <img src="./assets/gameOver.png" width="400" alt="Pantalla de fin del juego">
</p>

---

## 9. Sonido
- **Música:** musica ambiental de desierto.
- **FX:** clic de botones, obtención de llave, apertura de puerta, pasos sobre piedra y sonido final de salida.

