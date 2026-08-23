# VEREDICTO revisor-visual — paywall
Fecha: 2026-08-22 00:00
Screenshot: docs/revisiones/paywall-375.png
Usabilidad: 32/40
Craft: 13/20
Copy (si vende): 15/20 — PARCIAL: FICHA-AVATAR.md ausente, trazabilidad no verificada
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA

Top defectos:
1. [límite entre plan anual y plan mensual] Círculo oscuro "N" (avatar de usuario o elemento de nav) superpuesto sobre la cabecera de la card Mensual — rompe el layout y delata un z-index sin controlar → aislar el elemento en su propio stacking context (isolation: isolate en el header) y confirmar que ningún elemento de nav desborda sobre el main.
2. [ambas cards de plan] Dos CTAs de idéntico peso visual (mismo color sólido, mismo alto, mismo ancho) — el ojo no sabe cuál es la acción primaria → reducir el botón Mensual a variante outline/ghost o disminuir su peso; el CTA Anual debe ser el único botón sólido en la pantalla.
3. [eje craft — encaje óptico] El artefacto "N" colapsa EJE 5 a 1/4 haciendo que el craft total (13/20) no pase el gate ≥16 → corregir el overflow antes de volver a puntuar craft.
4. [proyecto — fichas ausentes] FICHA-ARTE.md y FICHA-AVATAR.md no existen → no se puede verificar fidelidad de paleta, familia tipográfica ni radio de bordes; el copy tampoco puede trazarse a campo de avatar. Crear ambas fichas antes del siguiente cierre.
5. [footer — copy] "Ahora no, seguir sin plan" vincula a /app dando acceso gratuito sin fricción adicional — si el plan gratuito no existe como tier definido, este enlace regala la app; verificar que /app sin sesión de plan redirige al estado limitado correcto.
