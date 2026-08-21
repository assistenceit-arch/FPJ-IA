# Narrativa IA — FPJ-5

## Estado (actualizado)

El motor de narrativa está completo y en producción, y ya soporta
múltiples delitos (no solo estupefacientes).

- `src/narrativa` (`NarrativaService`): arma el system prompt combinando
  `core-transversal.md` (siempre se carga) + los 4 archivos
  `{prefijo}-*.md` propios del delito del procedimiento (mapa en
  `src/narrativa/delitos.ts`) + `reglas-adultos.md`/`reglas-srpa.md` +
  `estilo-obligatorio.md`/`ejemplos-redaccion-aprobados.md`, y llama a la
  API de Anthropic. Devuelve `{ tipo: 'narracion', texto }` o
  `{ tipo: 'aclaracion_requerida', pregunta }`.
- `DocumentosService.generarFpj5Informe`: arma el contexto completo del
  procedimiento (funcionario, compañero, lugar, intervinientes —con
  lectura de derechos individual—, elementos, testigos, víctimas,
  actuaciones) y lo envía a la narrativa.
- `rellenarPlantillaConBloqueRepetible`: rellena la plantilla `.docx` con
  los tokens `{{TOKEN}}` y soporta múltiples bloques repetibles en el
  mismo documento (intervinientes, testigos, víctimas), cada uno
  delimitado por sus propios marcadores centinela
  `%%%BLOQUE_X_INICIO/FIN%%%`.
- Delitos soportados actualmente: Tráfico/Fabricación/Porte de
  Estupefacientes, Porte Ilegal de Armas de Fuego, Hurto. Agregar uno
  nuevo sigue el checklist de `RESUMEN_TECNICO_FUNCIONAL` más reciente
  del proyecto (registrar en `delitos.ts`, escribir los 4 archivos de
  prompt propios sin duplicar el CORE, migración si el delito necesita
  un tipo de elemento propio).

## Configuración requerida

Agregar al `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
# Opcional, por defecto claude-sonnet-5
ANTHROPIC_MODEL=claude-sonnet-5
```

La clave se crea en console.anthropic.com. El uso tiene costo por token;
el tamaño del prompt (CORE + contexto del caso) ronda ~15-20k tokens de
entrada por llamada, más las rondas de aclaración si las hay.

## Nota de gobernanza (Jerarquía Documental)

El Modelo de Datos tiene prioridad sobre el Formulario Maestro. El
contexto que se envía a la IA usa exclusivamente variables ya
persistidas; cualquier información adicional que el Prompt CORE necesite
se solicita mediante el ciclo de aclaración (409), no inventándola ni
asumiéndola.
