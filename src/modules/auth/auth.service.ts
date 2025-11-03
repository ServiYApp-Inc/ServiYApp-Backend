import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/modules/users/users.service';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { Role } from './roles.enum';
import { ProviderStatus } from '../providers/enums/provider-status.enum';
import { getGoogleRedirectUrl } from 'src/helpers/redirect.helper';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly providersService: ProvidersService,
    private readonly jwtService: JwtService,
  ) {}

  // Registro de usuario
  async registerUser(data: any) {
    const email = data.email.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new BadRequestException('El correo ya está registrado');

    const newUser = await this.usersService.create({
      ...data,
      email,
      role: data.role || Role.User,
    });

    const payload = { id: newUser.id, email: newUser.email, role: newUser.role };
    const token = this.jwtService.sign(payload, { expiresIn: '30m' });

    return {
      message: 'Usuario registrado correctamente',
      access_token: token,
      user: {
        id: newUser.id,
        names: newUser.names,
        surnames: newUser.surnames,
        email: newUser.email,
        role: newUser.role,
        isCompleted: true,
      },
    };
  }

  // Registro de proveedor (con validación de país, región, ciudad)
  async registerProvider(data: any) {
    const email = data.email.trim().toLowerCase();
    const existing = await this.providersService.findByEmail(email);
    if (existing) throw new BadRequestException('El correo ya está registrado');

      const newProvider = await this.providersService.create({
      names: data.firstName,
      surnames: data.lastName,
      userName: data.username,
      email,
      phone: data.phone,
      password: data.password,
      countryId: data.country,
      regionId: data.region,
      cityId: data.city,
      address: data.address || data.Address || data.Adreess,
      role: Role.Provider,
    });

    const payload = { id: newProvider.id, email: newProvider.email, role: newProvider.role };
    const token = this.jwtService.sign(payload, { expiresIn: '30m' });

    return {
      message: 'Proveedor registrado correctamente',
      access_token: token,
      provider: {
        id: newProvider.id,
        names: newProvider.names,
        surnames: newProvider.surnames,
        userName: newProvider.userName,
        email: newProvider.email,
        phone: newProvider.phone,
        country: newProvider.country,
        region: newProvider.region,
        city: newProvider.city,
        address: newProvider.address,
        role: newProvider.role,
        status: newProvider.status,
        isCompleted: newProvider.isCompleted,
      },
    };
  }

  // Login de usuario
  async loginUser(email: string, password: string) {
    email = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Contraseña incorrecta');

    const payload = { id: user.id, email: user.email, role: user.role };
    return {
      message: 'Usuario autenticado correctamente',
      access_token: this.jwtService.sign(payload, { expiresIn: '30m' }),
      user,
    };
  }

  // Login de proveedor
  async loginProvider(email: string, password: string) {
    email = email.trim().toLowerCase();
    const provider = await this.providersService.findByEmail(email);
    if (!provider) throw new UnauthorizedException('Proveedor no encontrado');

    const isMatch = await bcrypt.compare(password, provider.password);
    if (!isMatch) throw new UnauthorizedException('Contraseña incorrecta');

    const payload = { id: provider.id, email: provider.email, role: provider.role };
    const token = this.jwtService.sign(payload, { expiresIn: '30m' });

    return {
      message: 'Proveedor autenticado correctamente',
      access_token: token,
      provider,
    };
  }

  // Google User
  async validateOrCreateGoogleUser(userData) {
    const email = userData.email.trim().toLowerCase();
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      const [firstName, ...rest] = (userData.names || '').split(' ');
      const lastName = rest.join(' ') || userData.surnames || 'No definido';

      user = await this.usersService.create({
        names: firstName || email.split('@')[0],
        surnames: lastName,
        email,
        password: '',
        role: Role.User,
        profilePicture: userData.profilePicture,
        isCompleted: false,
      });
    }

    return user;
  }

  async loginGoogleUser(user) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload, { expiresIn: '30m' });
    return {
      message: 'Usuario autenticado correctamente',
      access_token: token,
      user,
    };
  }

  // Google Provider
  async validateOrCreateGoogleProvider(providerData) {
    const email = providerData.email.trim().toLowerCase();
    let provider = await this.providersService.findByEmail(email);
    if (provider) return provider;

    const baseName = (providerData.names || email.split('@')[0])
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

    let userName = baseName;

    const existingUsername = await this.providersService.findByUsername(userName);
    if (existingUsername) {
      const suffix = Math.floor(Math.random() * 10000);
      userName = `${baseName}${suffix}`;
    }

    provider = await this.providersService.create({
      names: providerData.names || 'Proveedor',
      surnames: providerData.surnames || '',
      userName,
      email,
      phone: '',
      password: '',
      role: Role.Provider,
    });

    return provider;
  }

  async loginGoogleProvider(provider) {
    const payload = { id: provider.id, email: provider.email, role: provider.role };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '30m' }),
      provider,
    };
  }


  

  async handleGoogleUserRedirect(user: any) {
    console.log(' handleGoogleUserRedirect: usuario recibido =>', user);

    if (!user || !user.id) {
      console.error('❌ Usuario sin ID al manejar redirección Google User');
      return {
        redirectUrl:
          process.env.FRONTEND_BASE_URL + '/login?error=google_user_not_found',
      };
    }

    const payload = { id: user.id, email: user.email, role: user.role || Role.User };
    const token = this.jwtService.sign(payload, { expiresIn: '30m' });

    const redirectUrl = getGoogleRedirectUrl(user.isCompleted, payload.role, token);

    console.log(' Redirigiendo al frontend:', redirectUrl);
    return { redirectUrl };
  }
  // // Maneja el redireccionamiento cuando un usuario inicia sesión con Google.
  // async handleGoogleUserRedirect(user: any) {
  //   const payload = { id: user.id, email: user.email, role: user.role };
  //   // Genera token JWT válido por 30 minutos
  //   const token = this.jwtService.sign(payload, { expiresIn: '30m' });
  //   // Usa helper centralizado
  //   const redirectUrl = getGoogleRedirectUrl(user.isCompleted, user.role, token);

  //   return { redirectUrl };
  // }


  async handleGoogleProviderRedirect(provider: any) {
    console.log(' handleGoogleProviderRedirect: proveedor recibido =>', provider);

    if (!provider || !provider.id) {
      console.error('❌ Proveedor sin ID al manejar redirección Google');
      return {
        redirectUrl:
          process.env.FRONTEND_BASE_URL + '/login?error=google_provider_not_found',
      };
    }

    const payload = {
      id: provider.id,
      email: provider.email,
      role: provider.role || Role.Provider,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '30m' });

    const redirectUrl = getGoogleRedirectUrl(
      provider.isCompleted,
      payload.role,
      token,
    );

    console.log(' Redirigiendo al frontend:', redirectUrl);
    return { redirectUrl };
  }
  // // Maneja el redireccionamiento cuando un proveedor inicia sesión con Google.
  // async handleGoogleProviderRedirect(provider: any) {
  //   const payload = { id: provider.id, email: provider.email, role: provider.role };

  //   // Genera token JWT válido por 30 minutos
  //   const token = this.jwtService.sign(payload, { expiresIn: '30m' });

  //   // Usa helper centralizado
  //   const redirectUrl = getGoogleRedirectUrl(provider.isCompleted, provider.role, token);

  //   return { redirectUrl };
  // }
}
