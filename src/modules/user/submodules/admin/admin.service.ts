import { Injectable } from '@nestjs/common';
import { AdminRepository } from './admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async create(userId: string) {
    return this.adminRepository.create(userId);
  }

  async findById(userId: string) {
    return this.adminRepository.findById(userId);
  }
}
