import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { ENV } from 'src/utils/config/env.enum';
import { Request } from 'express';

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
      passReqToCallback: true, // Enable request access in validate method
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      console.log('current state', req.query.state);
      const { name, emails, photos, id: googleId } = profile;
      const userEmail = emails?.[0]?.value;
      const userFirstName = name?.givenName;
      const userLastName = name?.familyName;
      const userProfilePhoto = photos?.[0]?.value; // Google profile picture URL

      if (!userEmail) {
        return done(new Error('No email found in Google profile'), false);
      }

      const user = await this.authService.validateUserWithGoogle(
        userEmail,
        userFirstName,
        userLastName,
        googleId,
        userProfilePhoto,
      );
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
}
