import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotFoundException extends HttpException {
  constructor() {
    super('User Was Not Found', HttpStatus.NOT_FOUND);
  }
}
