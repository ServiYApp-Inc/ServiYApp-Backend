import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    const host = this.configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com';
    const port = this.configService.get<number>('EMAIL_PORT') || 587;

    this.logger.log(`Configurando SMTP: ${user} @ ${host}:${port}`);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // STARTTLS
      auth: { user, pass },
    });

    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Error al conectar con SMTP:', error.message);
      } else {
        this.logger.log('Conexión SMTP establecida correctamente');
      }
    });
  }

  async sendWelcomeUserMail(user: { names: string; email: string }) {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'modules',
        'auth',
        'templates',
        'welcome-user.html',
      );
      let html = fs.readFileSync(templatePath, 'utf-8');

      html = html
        .replace(/{{name}}/g, user.names ?? '')
        .replace(/{{appName}}/g, String(this.configService.get('APP_NAME') ?? 'ServiYApp'))
        .replace(/{{frontend_url}}/g, String(this.configService.get('FRONTEND_BASE_URL') ?? ''));

      await this.transporter.sendMail({
        from: `"${this.configService.get('APP_NAME')}" <${this.configService.get('EMAIL_USER')}>`,
        to: user.email,
        subject: `¡Bienvenido a ${this.configService.get('APP_NAME')}!`,
        html,
      });

      this.logger.log(`Correo de bienvenida enviado a ${user.email}`);
    } catch (error) {
      this.logger.error(`Error enviando correo a ${user.email}: ${error.message}`);
      throw error;
    }
  }


  async sendPasswordResetMail(
    entity: { email: string; names?: string; surnames?: string },
    resetLink: string,
    type: 'user' | 'provider',
  ) {
    const templatePath = join(process.cwd(), 'src', 'modules', 'auth', 'templates', 'reset-password.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    const fullName =
      [entity.names, entity.surnames].filter(Boolean).join(' ') ||
      (type === 'provider' ? 'Proveedor' : 'Usuario');

    html = html
      .replace(/{{name}}/g, fullName)
      .replace(/{{reset_link}}/g, resetLink)
      .replace(/{{expiry_minutes}}/g, '15')
      .replace(/{{appName}}/g, String(process.env.APP_NAME ?? 'ServiYApp'));

    return this.transporter.sendMail({
      from: `"Soporte ${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
      to: entity.email,
      subject:
        type === 'provider'
          ? `Recupera tu contraseña como proveedor — ${process.env.APP_NAME}`
          : `Recupera tu contraseña — ${process.env.APP_NAME}`,
      html,
    });
  }

  async sendWelcomeProviderMail(provider: { names: string; email: string }) {
    const path = require('path');
    const fs = require('fs');

    const templatePath = path.join(process.cwd(), 'src', 'modules', 'auth', 'templates', 'welcome-provider.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    html = html
      .replace(/{{name}}/g, provider.names)
      .replace(/{{appName}}/g, process.env.APP_NAME ?? 'ServiYApp')
      .replace(/{{frontend_url}}/g, process.env.FRONTEND_BASE_URL);

    await this.transporter.sendMail({
      from: `"${process.env.APP_NAME} Aliados" <${process.env.EMAIL_USER}>`,
      to: provider.email,
      subject: `Bienvenido a ${process.env.APP_NAME} Aliados`,
      html,
    });
  }
}

