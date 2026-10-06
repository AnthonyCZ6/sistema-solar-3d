# Sistema Solar 3D Interactivo

## Problem
Estudiantes de cualquier nivel educativo necesitan entender el sistema solar: los tamaños y distancias relativos, las órbitas y las características de cada cuerpo celeste. **Supuesto:** con los recursos que usan hoy (imágenes 2D, videos) no pueden explorarlo de forma interactiva ni con detalle visual suficiente. El costo de dejarlo sin resolver es TBD y se valida con entrevistas a estudiantes y docentes.

## Evidence
- **Supuesto:** se valida con un prototipo y pruebas con estudiantes. No hay evidencia previa (citas, métricas ni intentos fallidos).
- Por qué no bastan las herramientas existentes (NASA Eyes, Solar System Scope, videos): TBD. Se valida comparando 2 o 3 herramientas existentes.
- Por qué ahora: TBD, no se indicó.

## Users
- **Primary**: estudiantes de cualquier nivel, de primaria a universidad, que exploran el sistema solar en una web desde el dispositivo que tengan, sea de gama alta o baja. *Perfil genérico: falta decidir qué nivel se prioriza en la primera prueba.*
- **Not for**: quien necesite posiciones o distancias reales, por ejemplo para cálculos astronómicos, porque la escala es didáctica. *Falta confirmarlo.*

## Hypothesis
Creemos que **una web interactiva en 3D del sistema solar, a escala didáctica y con información de cada cuerpo celeste,** ayudará a **entender los tamaños relativos, las órbitas y las características de los planetas** a **estudiantes de cualquier nivel**.
Sabremos que acertamos cuando **TBD: falta definir el resultado medible.** Candidato: porcentaje de aciertos en un cuestionario breve tras usarla, medido en la prueba piloto.

## Success Metrics
| Métrica | Objetivo | Cómo se mide |
|---|---|---|
| Comprensión después de usarla | TBD | Cuestionario antes y después, en la prueba piloto |
| Fluidez en dispositivos de gama baja | TBD: falta definir el umbral | Prueba en equipos escolares reales |
| Nitidez en gama alta y pantallas 4K | Máxima resolución disponible | Revisión visual en una pantalla 4K |
| Tiempo de exploración voluntaria | TBD | Observación en la prueba piloto |

## Scope
**Requisitos confirmados por el usuario**
- Web interactiva. No es un video ni una app nativa.
- Calidad visual a **máxima resolución** en los dispositivos que la soporten.
- **Contenido puro**: solo información. *La interpretación exacta está pendiente; ver Open Questions.*
- **Escala didáctica**, no real.
- **Reconoce la gama del dispositivo y adapta** la calidad para que funcione en equipos de gama alta y baja.

**MVP**: *propuesto por Claude, sin confirmar*
- El Sol y los 8 planetas con órbitas animadas a escala didáctica.
- Navegación libre: girar, acercar y enfocar un cuerpo.
- Al seleccionar un cuerpo, se muestra su ficha informativa.
- Calidad adaptativa según la gama del dispositivo.

**Out of scope**: *TBD. Candidatos sin confirmar:*
- Cuentas de usuario o progreso guardado: el foco es contenido puro.
- Juegos, cuestionarios o puntos dentro de la web: se excluyen si "contenido puro" significa esto.
- Realidad virtual o aumentada.
- App móvil nativa: se decidió que sea web.
- Posiciones en tiempo real: no son compatibles con la escala didáctica.
- Varios idiomas: TBD.

## Delivery Milestones
<!-- Business outcomes, not engineering tasks. /plan turns each into a plan. -->
<!-- Status: pending | in-progress | complete -->

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Sistema solar explorable | Un estudiante abre la web y navega en 3D por el Sol y los 8 planetas en órbita | complete | `.claude/plans/sistema-solar-explorable.plan.md` |
| 2 | Fichas informativas | Al seleccionar cualquier cuerpo, el estudiante ve su información | pending | — |
| 3 | Calidad adaptativa | La web es fluida en gama baja y se ve a máxima resolución en gama alta, sin configurar nada | pending | — |
| 4 | Prueba piloto | Estudiantes reales la usan y se mide la hipótesis | pending | — |
| 5 | Lunas y cuerpos menores | Se agregan lunas, cinturón de asteroides, planetas enanos y cometas. *Falta confirmar si entra* | pending | — |

## Open Questions
- [ ] ¿Qué resultado medible confirma la hipótesis?
- [ ] ¿"Contenido puro" significa solo información, sin juegos ni cuestionarios? ¿Hay un solo nivel de contenido para todos?
- [ ] Con un solo contenido, ¿cómo se sirve igual a primaria y a universidad? ¿Qué nivel se prioriza?
- [ ] ¿Las lunas, el cinturón de asteroides, los planetas enanos y los cometas entran en el MVP o después?
- [ ] ¿En qué idioma o idiomas está el contenido?
- [ ] ¿Cuál es la gama mínima que se soporta? ¿Incluye celulares? ¿Qué ve quien no puede mostrar 3D?
- [ ] ¿Qué incluye cada ficha y de qué fuentes sale? ¿Quién revisa la precisión científica?
- [ ] ¿En qué se diferencia de NASA Eyes o Solar System Scope?
- [ ] ¿Hay fecha límite?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| La escala didáctica deja ideas erróneas sobre los tamaños y distancias reales | Media | Alto | Avisar con claridad que la escala no es real; evaluar si se agrega una comparación con la escala real como contenido |
| Los recursos a máxima resolución pesan mucho y cargan lento en redes escolares | Alta | Alto | Que la adaptación también tenga en cuenta la conexión; mostrar primero una versión ligera |
| La gama del dispositivo se detecta mal: va lenta en equipos débiles o se ve borrosa en potentes | Media | Medio | Permitir que el usuario cambie la calidad a mano |
| "Cualquier nivel" es demasiado amplio y el contenido no sirve bien a nadie | Alta | Medio | Probar con al menos dos grupos de edad en la prueba piloto |
| Las fichas contienen errores científicos | Media | Alto | Usar fuentes oficiales (NASA, ESA) y hacer una revisión antes de publicar |
| Las imágenes de alta resolución tienen licencias restrictivas | Media | Medio | Usar solo material de dominio público o con licencia libre, y citar la fuente |
| No hay evidencia de demanda y ya existen herramientas parecidas | Media | Alto | Hacer la prueba piloto (hito 4) antes de ampliar el alcance |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
