<p align="center"><sub>🇬🇧 English · <b>🇪🇸 Versión en español más abajo ⬇️</b></sub></p>

<div align="center">

# CSV national-team membership correction

**[▶ Open PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)**

</div>

The standard player CSV has no national-team assignment column. Importing a club roster now preserves a player's existing callup when the squad country matches the imported `Country`, and removes callups for other countries when `Country` changes. It does not create a callup that is not already present.

To explicitly assign or clear national-team membership, import `Equipos-Jugadores.csv` after the player CSV. Its `Id National` value sets the assignment; `0` clears it. Players omitted from that file are unchanged. The changes can be undone.

<br>

---

<!-- es -->
<div align="center">

### 🇪🇸 Versión en español

# Corrección de convocatorias nacionales CSV

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)**

</div>

El CSV estándar de jugadores no tiene columna de selección nacional. Al importar un plantel de club, ahora se conserva una convocatoria existente si el país de la selección coincide con `Country`; si cambia la nacionalidad, se quitan las convocatorias de otros países. Esto no crea una convocatoria que no existía.

Para asignar o quitar una selección explícitamente, importa `Equipos-Jugadores.csv` después del CSV de jugadores. `Id National` establece el equipo y `0` lo quita. Los jugadores ausentes del archivo quedan sin cambios. Los cambios se pueden deshacer.
