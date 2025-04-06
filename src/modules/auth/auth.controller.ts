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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { LocalAuthGuard } from 'src/guards/local.guard';
import { Request, Response } from 'express';
import { UserEntity } from 'src/utils/types/db.types';
import { globalCookieOptions } from 'src/utils/config/constants.config';
import { UserService } from 'src/modules/user/user.service';
import {
  ResendVerificationDto,
  VerifyEmailDto,
  VerifyEmailTokenDto,
} from './dto/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('student')
  async signupStudent(@Body() createStudentDto: CreateStudentDto) {
    const student = await this.authService.signupStudent(createStudentDto);
    let auth = await this.authService.findOne(student.id, true);

    // Send verification email
    await this.authService.sendVerificationEmail(
      createStudentDto.email,
      createStudentDto.firstName,
      createStudentDto.lastName,
    );

    const responseObj = ResponseDto.createSuccessResponse(
      'Student Account Created Successfully. Please check your email to verify your account.',
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
  async verifyEmailWithToken(@Query() tokenDto: VerifyEmailTokenDto) {
    const verified = await this.authService.verifyEmailWithToken(tokenDto);
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
    let profile = await this.userService.getProfile(user.id);

    // Check if email is verified
    if (!profile.auth.emailVerified) {
      // Send verification email if not verified
      await this.authService.sendVerificationEmail(
        profile.auth.email,
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
    const responseObj = ResponseDto.createSuccessResponse(
      'Login Successful',
      profile,
    );
    res.status(200).json(responseObj);
  }
}
