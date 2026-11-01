<p align="center"><sub>🇬🇧 English · <b>🇪🇸 Versión en español más abajo ⬇️</b></sub></p>

<div align="center">

# Football Life 2027 and CSV squad assignments

**[▶ Open PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)**

</div>

Open and save Football Life 2027 EDIT files by loading your local `FL_key.bin`. The key stays in memory and is never included in the editor or release.

CSV imports now apply roster assignments consistently:

- Player CSV imports clear national-team callups for listed players because that format has no national-team assignment column. A national-team squad CSV explicitly assigns its named destination; player nationality must match the team country.
- The `Equipos-Jugadores` CSV can assign club and national-team memberships by ID. A `0` clears that assignment; players omitted from the file are unchanged.
- Club squad imports remove listed players from their other clubs. Changes can be undone.

<br>

---

<!-- es -->
<div align="center">

### 🇪🇸 Versión en español

# Football Life 2027 y asignaciones CSV

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)**

</div>

Abrí y guardá EDIT de Football Life 2027 cargando tu `FL_key.bin` local. La clave queda en memoria y nunca se incluye en el editor ni en la publicación.

Las importaciones CSV ahora aplican las asignaciones de plantel de forma coherente:

- Como el CSV de jugadores no tiene columna de selección nacional, los jugadores incluidos se quitan de todas las convocatorias. Si el archivo corresponde explícitamente al plantel de una selección, esa selección queda asignada; la nacionalidad debe coincidir con el país del equipo.
- El CSV `Equipos-Jugadores` asigna clubes y selecciones por ID. Un `0` quita esa asignación; los jugadores que no aparecen en el archivo quedan sin cambios.
- Al importar un plantel de club, los jugadores incluidos salen de sus otros clubes. Los cambios se pueden deshacer.
