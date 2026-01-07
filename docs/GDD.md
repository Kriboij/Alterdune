# Alterdune – GDD

## 1. Especificaciones básicas
- **Plataforma:** PC (navegador)
- **Género:** Puzzle / Aventura 2D en vista superior
- **Público objetivo:** 12+
- **Cámara:** Vista aérea fija por sala
- **Estilo visual:** Pixel art con estética neón
- **Multijugador:** 2 jugadores online

---

## 2. Concepto
Alterdune se desarrolla dentro de un entorno digital abstracto, representado como un sistema verde y neón compuesto por celdas, pasillos y trampas.

Los jugadores controlan dos virus informáticos que han sido liberados dentro del sistema y compiten por llegar al final del recorrido.  
El sistema intenta eliminarlos mediante trampas distribuidas por los laberintos, principalmente pinchos que dañan al jugador al contacto.

La experiencia es competitiva y directa: ambos jugadores recorren los mismos laberintos y el ganador se decide según su rendimiento y puntuación.

### Objetivo
Llegar al final de los tres laberintos del sistema obteniendo la mayor puntuación posible y superando al otro virus.

### Mecánicas principales
- Movimiento en cuatro direcciones sobre una cuadrícula
- Trampas de pinchos que penalizan al jugador al contacto
- Reaparición del jugador tras recibir daño
- Sistema de puntuación competitivo entre dos jugadores
- Progresión lineal por niveles
- No existe combate ni interacción directa entre jugadores

---

## 3. Controles
- **Jugador 2:** W / A / S / D

---

## 4. Flujo de juego (resumen)
Pantalla de login
Menú principal  
Búsqueda de partida  
Selección de personaje  
Laberinto 1  
Laberinto 2  
Laberinto 3  
Pantalla final

---
### Pantalla de login

<p align="center">
  <img src="./scs/login.png" width="500" alt="Pantalla de login">
</p>

El jugador introduce su nickname para identificarse en el servidor.
Hasta completar este paso no es posible acceder al menú ni al modo multijugador.

---

### Menú principal (sin buscar partida)

<p align="center">
  <img src="./scs/menu.png" width="500" alt="Menú principal">
</p>

Estado inicial del menú principal.
Desde aquí el jugador puede iniciar la búsqueda de partida o salir del juego.

---

### Menú principal (buscando partida)

<p align="center">
  <img src="./scs/buscando.png" width="500" alt="Buscando partida">
</p>

El jugador entra en la cola de matchmaking.
El sistema queda a la espera de que haya otro jugador disponible para crear una partida.

---

### Selección de personaje

<p align="center">
  <img src="./scs/selección.png" width="500" alt="Selección de personaje">
</p>

Una vez encontrada la partida, ambos jugadores acceden a la selección de personaje.
Aquí eligen su virus jugable y confirman que están listos para comenzar.

---

### Laberinto 1

<p align="center">
  <img src="./scs/lab1.png" width="500" alt="Laberinto 1">
</p>

Primer laberinto del juego.
Sirve como toma de contacto con el movimiento, la estructura del nivel y las trampas básicas.

---

### Laberinto 2

<p align="center">
  <img src="./scs/lab2.png" width="500" alt="Laberinto 2">
</p>

Segundo laberinto, más complejo que el anterior.
Los caminos son más ajustados y las trampas obligan a moverse con mayor precisión.

---

### Laberinto 3

<p align="center">
  <img src="./scs/lab3.png" width="500" alt="Laberinto 3">
</p>

Último laberinto de la partida.
Es el nivel más exigente y suele ser decisivo para determinar el ganador.

---

### Pantalla final

<p align="center">
  <img src="./scs/labDesconexion.png" width="500" alt="Pantalla final">
</p>

Pantalla de cierre de la partida.
Se muestra el resultado final y qué jugador ha ganado según su rendimiento.

---

### Desconexión durante la selección

<p align="center">
  <img src="./scs/selDesconexion.png" width="500" alt="Desconexión en selección">
</p>

Si uno de los jugadores se desconecta durante la selección de personaje,
la partida se cancela automáticamente y el jugador restante vuelve al menú.

---

### Desconexión durante la partida

<p align="center">
  <img src="./scs/labDesconexion.png" width="500" alt="Desconexión en partida">
</p>

Cuando una desconexión ocurre durante un laberinto, la partida finaliza de inmediato.
El jugador que permanece conectado es informado y se le devuelve al menú principal,
evitando estados inconsistentes o partidas incompletas.

---

## 5. Diseño visual
- **Paleta:** tonos verdes y neón sobre fondos oscuros, simulando un entorno digital.
- **Escenarios:** construidos a partir de bloques y pasillos claramente definidos.
- **Interfaz en partida:** marcador simple que muestra la puntuación de ambos jugadores en formato X - Y.
- **Logo:** “Alterdune” con tipografía pixel de alto contraste.
- **Inspiración visual:** estética de sistemas digitales y videojuegos clásicos en vista superior.

### Tileset y escenarios
El juego utiliza un **tileset personalizado** que incluye:
- Suelo y paredes del laberinto
- Elementos de colisión
- La meta final con **animación de glow** para indicar visualmente la salida del nivel

<p align="center">
  <img src="../public/assets/ReSprite/tileset.png" width="500" alt="Tileset del juego">
</p>

---

## 6. Diseño de niveles y GridEngine
El movimiento y la lógica de colisiones del juego se gestionan mediante **GridEngine**, lo que permite trabajar sobre un sistema de celdas.

Cada laberinto está diseñado en **Tiled** y exportado como archivo `.tmj`.  
Estos mapas definen:
- la estructura del laberinto
- las paredes
- las zonas con pinchos
- la posición de la meta

Este enfoque permite modificar o crear nuevos niveles sin necesidad de cambiar la lógica del juego.

---

## 7. Multijugador y servidor
Alterdune utiliza una arquitectura cliente-servidor.

El cliente está desarrollado con Phaser 3 y el servidor con Node.js y Express.  
La comunicación se divide en:
- Peticiones REST para el login y la búsqueda de partida.
- Socket.IO para la sincronización en tiempo real durante la selección y la partida.

Durante la partida:
- Los movimientos se sincronizan en tiempo real.
- El servidor controla el estado de la partida.
- Si un jugador se desconecta, la partida finaliza para ambos.

---

## 9. Narrativa
Dos virus han conseguido infiltrarse en un sistema cerrado.  
El sistema responde generando trampas para eliminarlos antes de que lleguen al núcleo.

Solo el virus que logre avanzar con menos errores y mayor precisión conseguirá sobrevivir y escapar del sistema.

### Personajes (virus)
Los jugadores pueden elegir entre distintos **virus jugables**, representados como variaciones de color y animación.

Estas variantes no cambian las mecánicas, pero permiten:
- Identificar fácilmente a cada jugador
- Personalizar la experiencia en el lobby

<p align="center">
  <img src="../public/assets/ReSprite/Sprites1.png" width="450" alt="Sprites de los virus jugables">
</p>

### Efectos visuales
Cuando un jugador muere al tocar pinchos, se reproduce un **efecto de desaparición** antes del respawn.
Este efecto refuerza visualmente la penalización y comunica claramente el evento al otro jugador.

<p align="center">
  <img src="../public/assets/ReSprite/DisappearEffectPlayer.png" width="200" alt="Efecto visual de respawn del jugador">
</p>

---

## 10. Sonido
- **buttonSound.mp3:** sonido al interactuar con la interfaz.
- **deathSound.wav:** se reproduce cuando un jugador toca los pinchos.
- **spikeAscend.wav:** sonido asociado a la activación de las trampas.
- **levelComplete.wav:** sonido al completar un laberinto.
- **Música:** sonidos electrónicos suaves que refuerzan la ambientación digital.

