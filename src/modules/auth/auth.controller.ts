import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  Get,
  Query,
  Headers,
  UnauthorizedException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { ResponseDto } from '@app/common/dto/response.dto';
import { LocalAuthGuard } from '@app/common/guards/local.guard';
import { Request, Response } from 'express';
import {
  UserEntity,
  UserRoleEnum,
  AuthEntity,
} from '@app/common/types/db.types';
import {
  globalCookieOptions,
  JWT_SYMBOL,
} from 'src/utils/config/constants.config';
import { UserService } from 'src/modules/user/user.service';
import { ResendVerificationDto } from './dto/verify-email.dto';
import { ConfigService } from '@nestjs/config';
import { ENV } from 'src/utils/config/env.enum';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from 'src/modules/auth/dto/password-reset.dto';
import { GoogleAuthGuard } from '@app/common/guards/google.guard';
import { OriginDetectorHelper } from 'src/utils/helpers/origin-detector.helper';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(JWT_SYMBOL) private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  // one-line comment: checks authentication status and refreshes token/cookie when close to expiry
  @Get('check')
  async checkAuthStatus(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    let token = req.cookies?.authorization;

    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader?.split(' ')[1];
    }

    if (!token) {
      return ResponseDto.createSuccessResponse('User not logged in', {
        loggedIn: false,
      });
    }

    // one-line comment: verify current token and refresh it (and cookie) when near expiry
    const result = await this.authService.verifyAndRefreshTokenIfNeeded(
      token,
      res,
    );

    if (!result.valid) {
      return ResponseDto.createSuccessResponse('Invalid JWT token', {
        loggedIn: false,
      });
    }

    return ResponseDto.createSuccessResponse('User is logged in', {
      loggedIn: true,
      refreshed: !!result.refreshedToken,
    });
  }

  @Post('student')
  async signupStudent(
    @Body() createStudentDto: CreateStudentDto,
    @Headers('root-api-key') rootApiKey?: string,
  ) {
    // If role is admin or moderator, validate root API key
    if (
      (createStudentDto.role === UserRoleEnum.ADMIN ||
        createStudentDto.role === UserRoleEnum.MODERATOR) &&
      rootApiKey !== this.configService.get(ENV.ROOT_API_KEY)
    ) {
      throw new UnauthorizedException('Invalid or missing root API key');
    }

    // Default to student role if none specified
    if (!createStudentDto.role) {
      createStudentDto.role = UserRoleEnum.STUDENT;
    }

    const student = await this.authService.signupStudent(createStudentDto);
    let auth = await this.authService.findOne(student.id, true);

    // Send verification email
    await this.authService.sendVerificationEmail(
      createStudentDto.email,
      createStudentDto.firstName,
      createStudentDto.lastName,
    );

    const responseObj = ResponseDto.createSuccessResponse(
      'Account Created Successfully. Please check your email to verify your account.',
      { ...student, auth },
    );
    return responseObj;
  }

  @Get('verify-email/token')
  async verifyEmailWithToken(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { verified, user } =
      await this.authService.verifyEmailWithToken(token);
    if (!verified) {
      throw new BadRequestException('Email verification failed');
    }

    const accessToken = await this.authService.generateToken(user.id);
    await this.authService.setCookie(res, accessToken);

    const responseObj = ResponseDto.createSuccessResponse(
      'Email verified successfully',
      { verified, user },
    );
    res.status(HttpStatus.OK).json(responseObj);
  }

  @Post('resend-verification')
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    const sent = await this.authService.resendVerificationEmail(
      resendDto.email,
    );
    if (!sent) {
      throw new BadRequestException('Failed to send verification email');
    }

    const responseObj = ResponseDto.createSuccessResponse(
      'Verification email sent successfully',
      { sent },
    );
    return responseObj;
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as UserEntity;
    const profile = await this.userService.getProfile(user.id);
    const auth = profile.auth as AuthEntity;

    // Check if email is verified
    if (!auth.emailVerified) {
      // Send verification email if not verified
      await this.authService.sendVerificationEmail(
        auth.email,
        profile.firstName,
        profile.lastName,
      );

      throw new BadRequestException(
        'Email not verified. A verification email has been sent to your inbox.',
      );
    }

    const accessToken = await this.authService.generateToken(user.id);
    await this.authService.setCookie(res, accessToken);

    const responseObj = ResponseDto.createSuccessResponse(
      'Login Successful',
      profile,
    );
    res.status(200).json(responseObj);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear the authorization cookie
    res.clearCookie('authorization', {
      ...globalCookieOptions,
      maxAge: 0,
    });

    const responseObj = ResponseDto.createSuccessResponse(
      'Logged out successfully',
      null,
    );
    return res.status(200).json(responseObj);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const sent = await this.authService.forgotPassword(dto.email);
    if (!sent) {
      throw new BadRequestException('Failed to send password reset email');
    }

    const responseObj = ResponseDto.createSuccessResponse(
      'Password reset instructions sent to your email',
      { sent },
    );
    return responseObj;
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const reset = await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    if (!reset) {
      throw new BadRequestException('Password reset failed');
    }

    const responseObj = ResponseDto.createSuccessResponse(
      'Password reset successful',
      { reset },
    );
    return responseObj;
  }

  // Google OAuth initiation route
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  // Google OAuth callback route - handles dynamic redirect based on state
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserEntity;

    if (!user) {
      // This case should ideally be handled by the strategy or guard
      // If it reaches here, something went wrong with user validation/creation
      throw new BadRequestException(
        'Google authentication failed: No user profile returned.',
      );
    }

    const accessToken = await this.authService.generateToken(user.id);

    // Set cookie
    await this.authService.setCookie(res, accessToken);
    // res.cookie('authorization', accessToken, globalCookieOptions);

    const redirectUrl = OriginDetectorHelper.detectAndValidateOrigin(
      req,
      this.configService.get(ENV.FRONTEND_URL),
    );

    // Ensure redirect URL ends with dashboard path
    const finalRedirectUrl = `${redirectUrl}/`;

    // Perform the redirect
    res.status(HttpStatus.FOUND).redirect(finalRedirectUrl);
  }

  @Get('google/onetap')
  // @UseGuards(GoogleAuthGuard)
  async googleOneTapRedirect(
    @Query('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    // const authHeader = req.headers.authorization;
    // const token = authHeader.split(' ')[1];
    if (!token) {
      throw new BadRequestException('Authorization token missing');
    }
    const loginTicket = await oAuth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const userGoogleData = loginTicket.getPayload();
    if (!userGoogleData) {
      throw new BadRequestException('Invalid Google token');
    }

    const userEmail = userGoogleData.email;
    const userFirstName = userGoogleData.given_name;
    const userLastName = userGoogleData.family_name;
    const googleId = userGoogleData.sub;
    const profilePictureUrl = userGoogleData.picture;

    const user = await this.authService.validateUserWithGoogle(
      userEmail,
      userFirstName,
      userLastName,
      googleId,
      profilePictureUrl,
    );

    const accessToken = await this.authService.generateToken(user.id);
    await this.authService.setCookie(res, accessToken);
    // const user = this.authService.validateUserWithGoogle()

    // const redirectUrl = OriginDetectorHelper.detectAndValidateOrigin(
    //   req,
    //   this.configService.get(ENV.FRONTEND_URL),
    // );

    // Ensure redirect URL ends with dashboard path
    // const finalRedirectUrl = `${redirectUrl}/`;

    // Perform the redirect
    // res.status(HttpStatus.FOUND).redirect(finalRedirectUrl);
    res
      .status(HttpStatus.OK)
      .json({ message: 'Google One Tap login successful' });
  }
}
