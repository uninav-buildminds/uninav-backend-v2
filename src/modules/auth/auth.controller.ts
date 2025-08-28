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
import { ResendVerificationDto } from './dto/verify-email.dto';
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
    return responseObj;
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
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {}

  // Google OAuth callback route
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
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
    res.cookie('authorization', accessToken, globalCookieOptions);

    // Redirect to frontend loading page with token in query param
    const frontendUrl = this.configService.get(ENV.FRONTEND_URL);
    const redirectUrl = `${frontendUrl}/`;

    // Perform the redirect
    res.status(HttpStatus.FOUND).redirect(redirectUrl);
  }
}
