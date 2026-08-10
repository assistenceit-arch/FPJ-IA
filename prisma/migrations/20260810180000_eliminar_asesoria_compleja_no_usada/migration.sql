-- Adenda 2026-08-10 (limpieza de fin de sesion): el modulo
-- asesoria-compleja (controlador, servicio, DTOs) nunca fue llamado
-- por el frontend -- quedo montado en el backend desde una fase
-- anterior, pero la asesoria de procedimientos complejos que
-- realmente se usa hoy vive en ConfiguracionPagos.contactoTelefono/
-- contactoCorreo (construido en esta misma sesion). Se elimina la
-- tabla, nunca alcanzo a tener datos reales al no haber estado nunca
-- conectada a ninguna pantalla.
DROP TABLE "public"."asesoria_compleja";
