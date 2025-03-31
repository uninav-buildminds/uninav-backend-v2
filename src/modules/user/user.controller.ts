import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { UserEntity } from 'src/utils/types/db.types';

// Import the extended Express type definition
// import 'src/utils/types/express.types';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createStudent(createUserDto);
    return ResponseDto.createSuccessResponse('User created successfully', user);
  }

  @Get('profile')
  @UseGuards(RolesGuard)
  async getProfile(@Req() req: Request) {
    const user = req.user as UserEntity;
    return ResponseDto.createSuccessResponse(
      'User profile retrieved successfully',
      user,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    return ResponseDto.createSuccessResponse(
      'User retrieved successfully',
      user,
    );
  }

  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   const updatedUser = await this.userService.update(id, updateUserDto);
  //   return ResponseDto.createSuccessResponse(
  //     'User updated successfully',
  //     updatedUser,
  //   );
  // }

  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   const result = await this.userService.remove(id);
  //   return ResponseDto.createSuccessResponse(
  //     'User deleted successfully',
  //     result,
  //   );
  // }
}
