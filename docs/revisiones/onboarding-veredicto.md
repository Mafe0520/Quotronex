# VEREDICTO revisor-visual — onboarding
Fecha: 2026-08-22 00:00
Screenshot: docs/revisiones/onboarding-375.png
Usabilidad: 31/40
Craft: 13/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [Esquina inferior izquierda] Badge dev Next.js ("N") visible en render → capturar en NODE_ENV=production.
2. [Fondo de toda la pantalla] Solo 2 planos de profundidad; falta nivel hundido → inputs en surface-2 como sunken.
3. [Cards — borde izquierdo] Hairline 1px es el único dispositivo ownable, app intercambiable → añadir ilustración SVG por oficio o patrón de textura en fondo.
4. [StepPricebook / StepDescribe — inputs] useReducedMotion no aplica al delay del stagger de inputs → envolver con reduce ? 0 : delay.
5. [Paso 1] Sin default preseleccionado ni memoria de selección previa → persistir en localStorage y preseleccionar visualmente al volver.
