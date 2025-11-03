import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

// Estrategia de autenticación para usuarios mediante Google OAuth 2.0.
@Injectable()
export class GoogleUserStrategy extends PassportStrategy(Strategy, 'google-user') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_USER_CLIENT_ID,
      clientSecret: process.env.GOOGLE_USER_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_USER_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  // Valida o crea un usuario después de autenticarse con Google.
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log('VALIDANDO USUARIO GOOGLE...', profile);

    try {
      const { name, emails, photos } = profile;

      const userData = {
        names: name?.givenName,
        surnames: name?.familyName,
        email: emails?.[0]?.value,
        profilePicture: photos?.[0]?.value,
        role: 'user',
      };

      const user = await this.authService.validateOrCreateGoogleUser(userData);
      console.log(' Usuario Google validado/creado:', user);
      done(null, user);
    } catch (error) {
      console.error('ERROR EN VALIDATE GOOGLE:', error);
      done(error, null);
    }
  }
}
