import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(GoogleStrategy.name);
  constructor(
    private readonly config: ConfigService,
    private readonly auth: AuthService,
  ) {
    const clientId = config.get<string>('googleClientID');
    const clientSecret = config.get<string>('googleClientSecret');
    const callbackUrl = config.get<string>('googleCallbackURL');
    if (!callbackUrl) {
      throw new Error('Callback URL for Google OAuth is not set');
    }
    if (!clientId) {
      throw new Error('Client ID required');
    }

    if (!clientSecret) {
      throw new Error('Client Secret required');
    }
    super({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackUrl,
      scope: ['profile', 'email'],
    });
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    if (!profile.emails?.length) {
      this.logger.error('No email provided from Google');
      return null;
    }
    // Create a user object with the profile information
    const userPayload = await this.auth.validateGoogleAuth({
      email: profile.emails[0].value,
      name: profile.displayName,
      password: '',
    });

    const user = {
      id: userPayload.uuid,
      email: profile.emails[0].value,
      name: profile.displayName,
      token: userPayload.token,
    };
    done(null, user);

    return user;
  }
}
