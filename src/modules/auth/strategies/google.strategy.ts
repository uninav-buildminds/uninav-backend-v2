import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { ENV } from 'src/utils/config/env.enum';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>(ENV.GOOGLE_CLIENT_ID),
      clientSecret: configService.get<string>(ENV.GOOGLE_CLIENT_SECRET),
      callbackURL: configService.get<string>(ENV.GOOGLE_REDIRECT_URI), // e.g., http://localhost:YOUR_BACKEND_PORT/api/auth/google/callback
      scope: ['email', 'profile'],
    });
    console.log('redirect url', this.configService.get<string>(ENV.GOOGLE_REDIRECT_URI))  
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { name, emails, photos, id: googleId } = profile;
      const userEmail = emails?.[0]?.value;
      const userFirstName = name?.givenName;
      const userLastName = name?.familyName;
      // const userProfilePhoto = photos?.[0]?.value; // You might want to store this

      if (!userEmail) {
        return done(new Error('No email found in Google profile'), false);
      }

      const user = await this.authService.validateUserWithGoogle(
        userEmail,
        userFirstName,
        userLastName,
        googleId,
      );
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
} 