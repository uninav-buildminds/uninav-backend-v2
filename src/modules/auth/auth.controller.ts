import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { LocalAuthGuard } from 'src/guards/local.guard';
import { Request, Response } from 'express';
import { UserEntity } from 'src/utils/types/db.types';
import { globalCookieOptions } from 'src/utils/config/constants.config';
import { UserService } from 'src/modules/user/user.service';
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
    const responseObj = ResponseDto.createSuccessResponse(
      'Student Account Created Successfully',
      { ...student, auth },
    );
    return responseObj;
  }
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as UserEntity;
    let profile = await this.userService.getProfile(user.id);
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
