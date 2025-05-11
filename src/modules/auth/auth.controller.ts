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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { LocalAuthGuard } from 'src/guards/local.guard';
import { Request, Response } from 'express';
import { UserEntity, UserRoleEnum, AuthEntity } from 'src/utils/types/db.types';
import { globalCookieOptions } from 'src/utils/config/constants.config';
import { UserService } from 'src/modules/user/user.service';
import {
  ResendVerificationDto,
  VerifyEmailDto,
} from './dto/verify-email.dto';
import { ConfigService } from '@nestjs/config';
import { ENV } from 'src/utils/config/env.enum';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from 'src/modules/auth/dto/password-reset.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

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

  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const verified = await this.authService.verifyEmail(verifyEmailDto);
    if (!verified) {
      throw new BadRequestException('Email verification failed');
    }

    const responseObj = ResponseDto.createSuccessResponse(
      'Email verified successfully',
      { verified },
    );
    return responseObj;
  }

  @Get('verify-email/token')
  async verifyEmailWithToken(@Query('token') token: string) {
    const verified = await this.authService.verifyEmailWithToken(token);
    if (!verified) {
      throw new BadRequestException('Email verification failed');
    }

    const responseObj = ResponseDto.createSuccessResponse(
      'Email verified successfully',
      { verified },
    );
    return responseObj;
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
    // for cookies
    res.cookie('authorization', accessToken, globalCookieOptions);
    // for sessions  (if not using cookies)
    res.header('authorization', `Bearer ${accessToken}`);
    res.header('Access-Control-Expose-Headers', 'authorization');
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
    return responseObj;
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const sent = await this.authService.forgotPassword(forgotPasswordDto.email);
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
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {
    // Passport strategy will automatically redirect to Google
    // This function might not even be called if redirect happens before
    // It's here mainly to apply the guard
  }

  // Google OAuth callback route
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as UserEntity;

    if (!user) {
      // This case should ideally be handled by the strategy or guard
      // If it reaches here, something went wrong with user validation/creation
      throw new BadRequestException('Google authentication failed: No user profile returned.');
    }

    // At this point, `user` is the user object returned by GoogleStrategy.validate()
    // which means user is found or created in our DB.

    const accessToken = await this.authService.generateToken(user.id);

    // Set cookie
    res.cookie('authorization', accessToken, globalCookieOptions);

    // Redirect to frontend loading page with token in query param
    const frontendUrl = this.configService.get(ENV.FRONTEND_URL);
    const redirectUrl = `${frontendUrl}/auth/google/loading?token=${accessToken}`;

    // Perform the redirect
    // passthrough: true with res.redirect() might not work as expected for status codes other than default.
    // Using res.status().redirect() for clarity.
    res.status(HttpStatus.FOUND).redirect(redirectUrl);
  }
}
