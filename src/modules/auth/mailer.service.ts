import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { join } from 'path';


@Injectable()
export class MailerService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
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

  async sendWelcomeUserMail(user: { names: string; email: string }) {
    const path = require('path');
    const fs = require('fs');

    const templatePath = path.join(process.cwd(), 'src', 'modules', 'auth', 'templates', 'welcome-user.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    html = html
      .replace(/{{name}}/g, user.names)
      .replace(/{{appName}}/g, process.env.APP_NAME ?? 'ServiYApp')
      .replace(/{{frontend_url}}/g, process.env.FRONTEND_BASE_URL);

    await this.transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `¡Bienvenido a ${process.env.APP_NAME}!`,
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
