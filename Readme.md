# 🐉 RolMaster

**RolMaster** es una aplicación web para jugar a rol y gestionar campañas con mapas 3D, IA generativa y un sistema profundo de exploración e interacción. Diseñada para masters exigentes y jugadores curiosos, combina lo mejor del rol clásico con herramientas modernas y accesibles.

---

## ✨ Características principales

- 🎲 **Mapas 3D**: El master controla la vista que ven los jugadores.
- 🧠 **Generación con IA**: Crea mapas y mundos completos a partir de una trama inicial.
- 🕵️ **Exploración realista**: Los jugadores solo ven lo que no está oculto; descubren el mundo al jugar.
- 👥 **Gestión avanzada de personajes**: Restricciones configurables por el master, personajes pregenerados, historial de partidas, etc.
- 💬 **NPCs con IA**: Responden a preguntas con conocimiento generado o personalizado por el master.
- 🛠️ **Editor de campañas y eventos**: Define ciudades, clima, poblaciones, eventos mundiales o locales, etc.
- 📜 **Sistema de conocimiento**: General (CDs, habilidades) y específico (secretos por personaje/NPC).
- 🧭 **Movimiento entre localizaciones**: Viaje rápido con eventos simulados, o exploración manual.

---

## 💰 Modelo de suscripción

- **Solo los masters pagan** (jugadores gratis).
- Crear contenido es gratis; pagar solo es necesario para lanzar partidas activas.
- Suscripciones disponibles:
  - Por sesiones (más caro)
  - Mensual, trimestral, semestral, anual (con descuentos)
- 🎁 Se incluye una **sesión gratuita de prueba**.
- 💸 Los jugadores pueden dejar **propinas**. Algunos masters podrán fijar un precio mínimo por partida.
  - La plataforma se queda con un 5% de comisión.

---

## 🧙‍♂️ Personajes y sesiones

- Los jugadores pueden:
  - Crear personajes
  - Ver historial de partidas
  - Unirse con personajes previos o crear nuevos
- El master puede:
  - Establecer restricciones
  - Aceptar o rechazar personajes
  - Predefinir personajes disponibles
- El sistema explica por qué una opción no está disponible y permite excepciones manuales.

---

## 🧠 Sistema de conocimiento

- **General**: Conocimientos accesibles si se supera una CD basada en habilidades (Inteligencia, Sabiduría…).
- **Específico**: Depende del trasfondo del NPC.
- Usa etiquetas (`común`, `elfo`, `mago`, etc.) para definir rareza y accesibilidad.
- Botón “Hablar de esto” para compartir información con el grupo.
  - Si es falso, se puede forzar tirada de Engañar, etc.

---

## 🌍 Movimiento y viaje

- **Modo Saltar**: Simula viaje, encuentros y duración automáticamente.
- **Modo Viaje**: Exploración en tiempo real, como una ciudad.
- Solo se puede viajar a localizaciones conocidas (por exploración, mapas o conocimiento).

---

## 🎭 Gestor de eventos

- Crea eventos activados por:
  - Llegar a localización
  - Pasar tiempo
  - Interacciones con NPCs
  - Cambios en el conocimiento general (ej: buscados)
- Eventos mundiales: guerras, terremotos, etc.
- Las consecuencias pueden ser:
  - Cambios en el mundo
  - Nuevos caminos o monstruos
  - Recompensas o penalizaciones
- Las **misiones** son eventos específicos con condiciones sencillas: tirar dados, entregar objetos, etc.

---

## ⚙️ Enfoque técnico

- **Frontend**: WebGL/WebGPU con `three.js`.
- **Backend**: `NestJS`.
- **IA**: Se usará **Gemini** por defecto (con acceso completo al contexto del mundo). No elegible por el usuario.
- **Visualización**:
  - Los jugadores y NPCs son tokens con imagen.
  - Objetos 3D solo se usan para lógica de exploración.
- **Compatible con móvil** (al menos visor de mapas).
- **Multiventana**: No es un videojuego. Puedes tener abiertas varias ventanas, solo una renderiza el mapa.

---

## 🚧 Estado del proyecto

Actualmente en desarrollo activo.  
Contribuciones, ideas, sugerencias y bugs son bienvenidos.

---

## 📜 Licencia

_(Agrega aquí tu licencia, como MIT, GPL-3.0, etc.)_

---

¿Te encanta el rol? ¿Eres un master con ambición o un jugador con ganas de aventura?  
**RolMaster** es tu nuevo campo de batalla (o de diplomacia, o de comercio con elfos...).

---

