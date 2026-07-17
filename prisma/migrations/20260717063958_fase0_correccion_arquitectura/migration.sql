/*
  Warnings:

  - You are about to drop the `FormularioMaestro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Procedimiento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."FormularioMaestro" DROP CONSTRAINT "FormularioMaestro_procedimientoId_fkey";

-- DropTable
DROP TABLE "public"."FormularioMaestro";

-- DropTable
DROP TABLE "public"."Procedimiento";

-- DropTable
DROP TABLE "public"."Usuario";

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "identificacion" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."procedimientos" (
    "id" TEXT NOT NULL,
    "numeroInterno" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nunc" TEXT,
    "fechaCaptura" TIMESTAMP(3) NOT NULL,
    "horaCaptura" TEXT NOT NULL,
    "fechaDisposicion" TIMESTAMP(3) NOT NULL,
    "horaDisposicion" TEXT NOT NULL,
    "delito" TEXT NOT NULL,
    "tipoProcedimiento" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "observacionesGenerales" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "eliminadoEn" TIMESTAMP(3),
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."funcionario_actuante" (
    "id" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "zonaAtencion" TEXT NOT NULL,
    "estacion" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funcionario_actuante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companero_patrulla" (
    "id" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companero_patrulla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lugares_procedimiento" (
    "id" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "localidad" TEXT,
    "barrio" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "caracteristicas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lugares_procedimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."capturados" (
    "id" TEXT NOT NULL,
    "procedimiento_id" TEXT NOT NULL,
    "tipoInterviniente" TEXT NOT NULL,
    "primerNombre" TEXT NOT NULL,
    "segundoNombre" TEXT,
    "primerApellido" TEXT NOT NULL,
    "segundoApellido" TEXT,
    "tipoDocumento" TEXT,
    "numeroDocumento" TEXT,
    "expedicionDocumento" TEXT,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "edad" INTEGER NOT NULL,
    "genero" TEXT NOT NULL,
    "estadoCivil" TEXT,
    "ocupacion" TEXT,
    "correo" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "senalesParticulares" TEXT,
    "nombrePadres" TEXT,
    "telefonoPadres" TEXT,
    "nombreAcudiente" TEXT,
    "parentescoAcudiente" TEXT,
    "telefonoAcudiente" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capturados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contactos_notificacion" (
    "id" TEXT NOT NULL,
    "capturadoId" TEXT NOT NULL,
    "nombre" TEXT,
    "telefono" TEXT,
    "comunicacionExitosa" BOOLEAN NOT NULL,
    "horaComunicacion" TEXT,
    "justificacionNoComunicacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contactos_notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."elementos_incautados" (
    "id" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "capturadoId" TEXT NOT NULL,
    "tipoElemento" TEXT NOT NULL,
    "descripcionBase" TEXT NOT NULL,
    "ubicacionHallazgo" TEXT NOT NULL,
    "direccionIncautacion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elementos_incautados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detalle_sustancias" (
    "id" TEXT NOT NULL,
    "elementoId" TEXT NOT NULL,
    "cantidadEmpaques" INTEGER NOT NULL,
    "tipoSustancia" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "caracteristicas" TEXT NOT NULL,

    CONSTRAINT "detalle_sustancias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detalle_dinero" (
    "id" TEXT NOT NULL,
    "elementoId" TEXT NOT NULL,
    "valorTotal" DECIMAL(65,30) NOT NULL,
    "denominaciones" TEXT NOT NULL,

    CONSTRAINT "detalle_dinero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detalle_celulares" (
    "id" TEXT NOT NULL,
    "elementoId" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "imei" TEXT,

    CONSTRAINT "detalle_celulares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detalle_otros_elementos" (
    "id" TEXT NOT NULL,
    "elementoId" TEXT NOT NULL,
    "descripcionManual" TEXT NOT NULL,

    CONSTRAINT "detalle_otros_elementos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."actuaciones_procedimiento" (
    "id" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "derechosLeidos" BOOLEAN NOT NULL,
    "fechaDerechos" TIMESTAMP(3) NOT NULL,
    "horaDerechos" TEXT NOT NULL,
    "comprendeDerechos" BOOLEAN NOT NULL,
    "usoEsposas" BOOLEAN NOT NULL,
    "justificacionEsposas" TEXT,
    "presentaLesiones" BOOLEAN NOT NULL,
    "descripcionLesiones" TEXT,
    "trasladoCentroAsistencial" BOOLEAN NOT NULL,
    "centroAsistencial" TEXT,
    "motivoTraslado" TEXT,
    "autoridadReceptora" TEXT NOT NULL,
    "demoraExistente" BOOLEAN NOT NULL,
    "justificacionDemora" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actuaciones_procedimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documentos_generados" (
    "id" TEXT NOT NULL,
    "procedimiento_id" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "capturadoId" TEXT,
    "elementoId" TEXT,
    "fechaGeneracion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "procedimientoVersion" INTEGER NOT NULL,
    "rutaArchivo" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_generados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pagos" (
    "id" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "medioPago" TEXT NOT NULL,
    "referenciaPago" TEXT NOT NULL,
    "comprobantePago" TEXT,
    "estadoPago" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."asesoria_compleja" (
    "id" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "numeroTicket" TEXT NOT NULL,
    "motivoConsulta" TEXT NOT NULL,
    "observacionesCaso" TEXT,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estadoAsesoria" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asesoria_compleja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auditoria_eventos" (
    "id" TEXT NOT NULL,
    "fechaEvento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "tablaAfectada" TEXT NOT NULL,
    "registroAfectado" TEXT NOT NULL,
    "descripcionEvento" TEXT NOT NULL,

    CONSTRAINT "auditoria_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_identificacion_key" ON "public"."usuarios"("identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "public"."usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "procedimientos_numeroInterno_key" ON "public"."procedimientos"("numeroInterno");

-- CreateIndex
CREATE UNIQUE INDEX "funcionario_actuante_procedimientoId_key" ON "public"."funcionario_actuante"("procedimientoId");

-- CreateIndex
CREATE UNIQUE INDEX "companero_patrulla_procedimientoId_key" ON "public"."companero_patrulla"("procedimientoId");

-- CreateIndex
CREATE UNIQUE INDEX "lugares_procedimiento_procedimientoId_key" ON "public"."lugares_procedimiento"("procedimientoId");

-- CreateIndex
CREATE UNIQUE INDEX "capturados_procedimiento_id_tipoDocumento_numeroDocumento_key" ON "public"."capturados"("procedimiento_id", "tipoDocumento", "numeroDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "contactos_notificacion_capturadoId_key" ON "public"."contactos_notificacion"("capturadoId");

-- CreateIndex
CREATE UNIQUE INDEX "detalle_sustancias_elementoId_key" ON "public"."detalle_sustancias"("elementoId");

-- CreateIndex
CREATE UNIQUE INDEX "detalle_dinero_elementoId_key" ON "public"."detalle_dinero"("elementoId");

-- CreateIndex
CREATE UNIQUE INDEX "detalle_celulares_elementoId_key" ON "public"."detalle_celulares"("elementoId");

-- CreateIndex
CREATE UNIQUE INDEX "detalle_otros_elementos_elementoId_key" ON "public"."detalle_otros_elementos"("elementoId");

-- CreateIndex
CREATE UNIQUE INDEX "actuaciones_procedimiento_procedimientoId_key" ON "public"."actuaciones_procedimiento"("procedimientoId");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_procedimientoId_key" ON "public"."pagos"("procedimientoId");

-- CreateIndex
CREATE UNIQUE INDEX "asesoria_compleja_procedimientoId_key" ON "public"."asesoria_compleja"("procedimientoId");

-- CreateIndex
CREATE UNIQUE INDEX "asesoria_compleja_numeroTicket_key" ON "public"."asesoria_compleja"("numeroTicket");

-- AddForeignKey
ALTER TABLE "public"."procedimientos" ADD CONSTRAINT "procedimientos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funcionario_actuante" ADD CONSTRAINT "funcionario_actuante_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "public"."procedimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."companero_patrulla" ADD CONSTRAINT "companero_patrulla_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "public"."procedimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lugares_procedimiento" ADD CONSTRAINT "lugares_procedimiento_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "public"."procedimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."capturados" ADD CONSTRAINT "capturados_procedimiento_id_fkey" FOREIGN KEY ("procedimiento_id") REFERENCES "public"."procedimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contactos_notificacion" ADD CONSTRAINT "contactos_notificacion_capturadoId_fkey" FOREIGN KEY ("capturadoId") REFERENCES "public"."capturados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."elementos_incautados" ADD CONSTRAINT "elementos_incautados_capturadoId_fkey" FOREIGN KEY ("capturadoId") REFERENCES "public"."capturados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detalle_sustancias" ADD CONSTRAINT "detalle_sustancias_elementoId_fkey" FOREIGN KEY ("elementoId") REFERENCES "public"."elementos_incautados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detalle_dinero" ADD CONSTRAINT "detalle_dinero_elementoId_fkey" FOREIGN KEY ("elementoId") REFERENCES "public"."elementos_incautados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detalle_celulares" ADD CONSTRAINT "detalle_celulares_elementoId_fkey" FOREIGN KEY ("elementoId") REFERENCES "public"."elementos_incautados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detalle_otros_elementos" ADD CONSTRAINT "detalle_otros_elementos_elementoId_fkey" FOREIGN KEY ("elementoId") REFERENCES "public"."elementos_incautados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."actuaciones_procedimiento" ADD CONSTRAINT "actuaciones_procedimiento_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "public"."procedimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documentos_generados" ADD CONSTRAINT "documentos_generados_procedimiento_id_fkey" FOREIGN KEY ("procedimiento_id") REFERENCES "public"."procedimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pagos" ADD CONSTRAINT "pagos_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "public"."procedimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asesoria_compleja" ADD CONSTRAINT "asesoria_compleja_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "public"."procedimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
