import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('student')
  async signupStudent(@Body() createStudentDto: CreateStudentDto) {
    const student = await this.authService.signupStudent(createStudentDto);
    const responseObj = ResponseDto.createSuccessResponse(
      'Student Account Created Successfully',
      student,
    );
    return responseObj;
  }
}
