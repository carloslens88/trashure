# TODO — backlog recopilado 2026-08-03

Notas de feedback y mejoras, agrupadas por tamaño.

## ✅ Hecho (2026-08-04)

- [x] **Campamento tapado por el robot** — insignia ya la tenía, solo era
      z-index (800 → 1020, por delante del jugador).
- [x] **Objeto de la Abducción por encima de la patrulla** — reordenado
      z-index (beam 1 < item 3 < ufo 4). De paso apareció y se arregló un bug
      más gordo no reportado: el ítem subía en la dirección visual contraria
      (se alejaba de la nave al perder, se acercaba al ganar) — `bottom` tenía
      la fórmula invertida.
- [x] **Dificultad de la Abducción por experiencia** — decidido: más fácil
      para novatos. Nivel ≤2 → Vigía sube al 55 % de velocidad y tus toques
      empujan un 25 % más fuerte; nivel 3-5 → 78 %/+10 %; nivel 6+ → normal.
- [x] **Evolución del Compañero estilo Pokémon** — 3 etapas por especie
      (cría/adulto/veterano, en nivel 7 y 14), diseño propio con nombres y
      emoji nuevos, modal especial "X evolucionó a Y". Ver `petForm()` en
      [pet.js](src/game/pet.js).

## ✅ Hecho (2026-08-04, tanda 2)

- [x] **Catálogo del Compañero ×4** — de 5 a 20 especies (60 formas contando
      las 3 etapas de evolución de cada una), sin duplicar emoji ni nombres.
- [x] **Núcleo del Desechador** — uno por día en TODO el servidor (no por
      región): ubicación determinista anclada a ~15 km de Madrid (ver
      `dailyUniqueFor` en spawn.js/_shared/spawn.ts), brújula + marcador
      brillante siempre visibles mientras no tenga dueño, título exclusivo
      "Portador del Núcleo" + 300 ⚙️ al primero en cogerlo. Puerta atómica en
      `daily_unique_claims` (day como PK) evita que dos jugadores lo ganen a
      la vez. Migración v14 + edge function `collect` desplegadas.

## ✅ Hecho (2026-08-04, tanda 3)

- [x] **Evolución/fusión de objetos** — 5 unidades iguales (no en venta
      activa) se funden en 1 del siguiente escalón; las 5 se consumen.
      Recetas en [craft.js](src/game/craft.js), espejo en migración v15/v16.
      Sin receta para lo alienígena a propósito (se queda como premio de
      suerte, no fabricable).
- [x] **Particularidades por facción** — (1) el robot del jugador se tiñe
      del color de su facción en el mapa; (2) unirte a una facción también
      inclina (no exclusivo) qué Compañero te toca al eclosionar, 3 especies
      afines por facción (`FACTION_SPECIES` en pet.js); (3) fusionar los
      mismos 5 objetos da un resultado DISTINTO según tu facción — pool
      rotado por facción en `fusion_target`, mismo objeto de entrada, salida
      distinta (migración v16).

## ✅ Hecho (2026-08-04, tanda 4)

- [x] **Cofre del Gremio + Llaves** — un cofre por región, cambia cada 7 días
      (no cada día, para diferenciarlo del Escondite). Forzarlo consume una
      Llave misteriosa; 55 % de éxito ("no todas las llaves abren algo") — si
      falla, la llave se pierde igual y el cofre sigue ahí para el siguiente.
      Botín si abre: reliquia (85 %) o alienígena (15 %), inaccesible de otro
      modo. No se agota (reutilizable con más llaves). Solo online (consume
      inventario real del servidor). Sin migración nueva: vive dentro de la
      edge function `collect` ya desplegada.

## ✅ Hecho (2026-08-04, tanda 5) — lista completa

- [x] **Skins + Tarjeta de jugador** — tocar tu propio robot en el mapa abre
      una ficha (nivel, facción, título, vestuario). 8 skins compradas con
      Chatarra (mismo patrón que los Títulos): 5 universales (50-800 ⚙️) y 3
      exclusivas de facción (150 ⚙️, solo comprables/equipables por quien
      pertenece a esa facción). La skin tiñe el cuerpo del robot en el mapa;
      el anillo sigue mostrando tu facción — ambas cosas conviven. Migración
      v17.

Con esto se completó todo lo que había en la lista original.

## 💡 Ideas propias ya ofrecidas (para valorar si entran en el backlog)

- [ ] Tarjeta de hallazgo para compartir en redes al pillar algo raro+
      (canvas, sin backend — loop de crecimiento).
- [ ] Atar los duelos a la guerra semanal de facciones como fuente extra de
      puntos (les da gancho competitivo real).
- [ ] Cosmética/skins para el Compañero — puede fundirse con el punto de
      "skins comprables" de arriba en vez de ser dos sistemas separados.
