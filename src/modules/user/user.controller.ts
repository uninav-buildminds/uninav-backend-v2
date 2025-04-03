import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Request } from 'express';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { UserEntity } from 'src/utils/types/db.types';
import { AuthService } from 'src/modules/auth/auth.service';
import { UpdateUserDto } from 'src/modules/user/dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createStudent(createUserDto);
    return ResponseDto.createSuccessResponse('User created successfully', user);
  }

  @Get('profile')
  @UseGuards(RolesGuard)
  async getProfile(@Req() req: Request) {
    const user = req.user as UserEntity;
    let profile = await this.userService.getProfile(user.id);
    return ResponseDto.createSuccessResponse(
      'User profile retrieved successfully',
      profile,
    );
  }

  @Patch()
  @UseGuards(RolesGuard)
  async update(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    const user = req.user as UserEntity;
    const updatedUser = await this.userService.update(user.id, updateUserDto);
    return ResponseDto.createSuccessResponse(
      'User updated successfully',
      updatedUser,
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
}
