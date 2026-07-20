# Narrativa IA — FPJ-5 (Fase 4)

## Estado

- ✅ `src/narrativa` (`NarrativaService`): arma el system prompt con el
  Prompt CORE (`assets/prompts/`) y llama a la API de Anthropic. Devuelve
  `{ tipo: 'narracion', texto }` o `{ tipo: 'aclaracion_requerida', pregunta }`.
- ✅ `DocumentosService.generarFpj5Informe`: arma el contexto completo del
  procedimiento (funcionario, compañero, lugar, intervinientes, elementos,
  actuaciones) únicamente con variables ya persistidas en el Modelo de
  Datos V1, invoca la narrativa y traduce `aclaracion_requerida` a `409`
  (`AclaracionRequeridaException`).
- ✅ `rellenarPlantillaConBloqueRepetible`: función genérica para repetir
  un bloque de la plantilla (sección "Información del capturado(s)") una
  vez por interviniente.
- ⛔ **Bloqueado**: el ensamblado final del `.docx` no está implementado.
  Faltan `assets/documentos/fpj5-plantilla-capturado.docx` y
  `fpj5-plantilla-aprehendido.docx`. Ver sección "Pendiente" abajo.

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

## Pendiente antes de poder generar el FPJ-5 completo

1. **Subir el FPJ-5 oficial original** (Word) para reconstruir
   `fpj5-plantilla-capturado.docx` y `fpj5-plantilla-aprehendido.docx` con
   `python-docx`, igual que se hizo con `fpj6-plantilla-*.docx`:
   insertar los marcadores `{{TOKEN}}` de 8.2 MAPA-DOCUMENTAL-FPJ5-V1,
   el marcador `{{NARRACION_HECHOS}}` en la sección 9 (tabla 34), y los
   párrafos centinela `%%%BLOQUE_INTERVINIENTE_INICIO%%%` /
   `%%%BLOQUE_INTERVINIENTE_FIN%%%` alrededor de la sección 4.
2. **Decidir el diseño de captura de datos para la narrativa** (ver nota
   de gobernanza abajo): el Prompt CORE (VALIDACIONES/FLUJO_OPERATIVO)
   espera información que hoy no se persiste en el Modelo de Datos V1
   (qué observó el funcionario, desarrollo de la intervención,
   comportamiento, participación, lateralidad exacta del hallazgo, etc.).
   Con el diseño actual, el ciclo de aclaración (409) probablemente se
   activará en la mayoría de los casos pidiendo esta información por
   texto libre en cada ronda. Alternativa: ampliar el Modelo de Datos con
   los campos de los Bloques 5/6 del Formulario Maestro (requiere
   migración y actualización formal de la documentación, siguiendo el
   proceso de la Parte 8 de la EFS).
3. Una vez existan las plantillas, completar `generarFpj5Informe`
   reemplazando el `throw new NotImplementedException(...)` por el
   armado de `datosGlobales` + `bloques` y la llamada a
   `rellenarPlantillaConBloqueRepetible`, siguiendo el mismo patrón que
   `generarFpj6ActaDerechos`.

## Nota de gobernanza (Jerarquía Documental)

El Modelo de Datos V1 tiene prioridad sobre el Formulario Maestro. Por
eso `generarFpj5Informe` NO agrega campos nuevos a `actuaciones_procedimiento`
por iniciativa propia: el contexto enviado a la IA usa exclusivamente las
variables ya definidas en el Modelo de Datos V1 (REGLA INV-FPJ5-002:
Servicio Prestado, Lugar, Intervinientes, Elementos Hallados, Actuaciones
Realizadas). Cualquier información adicional que el Prompt CORE necesite
se solicita mediante el ciclo de aclaración, no mediante persistencia
nueva, hasta que el usuario decida formalmente ampliar el modelo.
