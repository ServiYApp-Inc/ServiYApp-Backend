import { Controller, Post, Body, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import express from 'express';

// Controlador de autenticación.
// Maneja registro, login y autenticación con Google para usuarios y proveedores.
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Registra un nuevo usuario con email y contraseña.
  @Post('register/user')
  registerUser(@Body() body: any) {
    return this.authService.registerUser(body);
  }

  // Registra un nuevo proveedor con email y contraseña.
  @Post('register/provider')
  registerProvider(@Body() body: any) {
    return this.authService.registerProvider(body);
  }

  // Inicia sesión como usuario.
  // Recibe el email y contraseña, valida las credenciales
  // y devuelve un token JWT si la autenticación es correcta.
  @Post('login/user')
  loginUser(@Body() body: { email: string; password: string }) {
    return this.authService.loginUser(body.email, body.password);
  }

  // Inicia sesión como proveedor.
  // Similar al login de usuario, pero consulta la tabla de proveedores.
  @Post('login/provider')
  loginProvider(@Body() body: { email: string; password: string }) {
    return this.authService.loginProvider(body.email, body.password);
  }

  // Inicia el flujo de autenticación con Google para usuarios.
  // Redirige al usuario al formulario de inicio de sesión de Google.
  @Get('google/user')
  @UseGuards(AuthGuard('google-user'))
  async googleUserLogin() {}

  // Callback de Google tras autenticación del usuario.
  // Google redirige a esta ruta una vez el usuario ha iniciado sesión.
  // Aquí se obtiene la información del perfil de Google y se genera el token.
  @Get('google/user/callback')
  @UseGuards(AuthGuard('google-user'))
  async googleUserCallback(@Req() req, @Res() res: express.Response) {
    const result = await this.authService.handleGoogleUserRedirect(req.user);
    return res.redirect(result.redirectUrl);
  }

  // Inicia el flujo de autenticación con Google para proveedores.
  // Redirige al proveedor al inicio de sesión de Google.
  @Get('google/provider')
  @UseGuards(AuthGuard('google-provider'))
  async googleProviderLogin() {}

  // Callback de Google tras autenticación del proveedor.
  // Procesa la respuesta de Google, genera el token y redirige al frontend.
  @Get('google/provider/callback')
  @UseGuards(AuthGuard('google-provider'))
  async googleProviderCallback(@Req() req, @Res() res: express.Response) {
    const result = await this.authService.handleGoogleProviderRedirect(req.user);
    return res.redirect(result.redirectUrl);
  }
}
