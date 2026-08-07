import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Envío de correos transaccionales (por ahora, solo verificación de
 * cuenta del registro autónomo). Usa SMTP genérico vía nodemailer, así
 * funciona con cualquier proveedor (Gmail con contraseña de aplicación,
 * SendGrid, Amazon SES, un servidor propio, etc.) — basta con configurar
 * las variables SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM.
 *
 * Si no hay SMTP configurado (típicamente en desarrollo), el enlace de
 * verificación se deja en el log del servidor en vez de fallar, para
 * poder seguir probando el flujo sin credenciales reales.
 */
@Injectable()
export class CorreoService {
  private readonly logger = new Logger(CorreoService.name);
  private transportador: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST) {
      this.transportador = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_PORT === '465',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }
  }

  async enviarVerificacion(destino: string, nombre: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    const enlace = `${frontendUrl}/verificar-correo?token=${token}`;

    if (!this.transportador) {
      this.logger.warn(
        `SMTP no configurado — enlace de verificación para ${destino}: ${enlace}`,
      );
      return;
    }

    await this.transportador.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: destino,
      subject: 'Verifica tu correo — FPJ IA',
      html: `
        <p>Hola ${nombre},</p>
        <p>Gracias por crear tu cuenta en FPJ IA. Confirma tu correo institucional haciendo clic en el siguiente enlace:</p>
        <p><a href="${enlace}">${enlace}</a></p>
        <p>Este enlace vence en 24 horas. Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
      `,
    });
  }
}
