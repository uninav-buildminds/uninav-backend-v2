import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateStudentDto } from 'src/modules/auth/dto/create-student.dto';
import { UserService } from 'src/modules/user/user.service';
import * as bcrypt from 'bcryptjs';
import envConfig from 'src/utils/config/env.config';
import { ConfigType } from 'src/utils/types/config.types';
import { JwtService } from '@nestjs/jwt';
import { JWT_SYMBOL } from 'src/utils/config/constants.config';
import { UserEntity, AuthEntity } from 'src/utils/types/db.types';
import { AuthRepository } from './auth.repository';
import { DataFormatter } from 'src/utils/helpers/data-formater.helper';
import { cryptoService } from 'src/utils/crypto/crypto.service';
import { VerifyEmailDto, VerifyEmailTokenDto } from './dto/verify-email.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from 'src/utils/events/events.enum';
import { ConfigService } from '@nestjs/config';
import { DepartmentService } from 'src/modules/department/department.service';
import { EmailService } from 'src/utils/email/email.service';
import {
  EmailPaths,
  EmailSubjects,
} from 'src/utils/config/constants/email.enum';
import { ModeratorService } from '../moderator/moderator.service';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class AuthService {
  private readonly BCRYPT_SALT: string;
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userService: UserService,
    private readonly authRepository: AuthRepository,
    private readonly departmentService: DepartmentService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(envConfig.KEY) private readonly config: ConfigType,
    @Inject(JWT_SYMBOL) private jwtService: JwtService,
    private readonly adminService: AdminService,
    private readonly moderatorService: ModeratorService,
  ) {
    this.BCRYPT_SALT = bcrypt.genSaltSync(+this.config.BCRYPT_SALT_ROUNDS);

    this.logger.log('testing email...');
  }
  async findOne(
    id: string,
    exclude: boolean = false,
  ): Promise<Partial<AuthEntity>> {
    const auth = await this.authRepository.findByUserId(id);
    if (!auth) {
      throw new BadRequestException('auth for User not found');
    }
    return exclude ? DataFormatter.formatObject(auth, ['password']) : auth;
  }

  async signupStudent(createStudentDto: CreateStudentDto) {
    if (createStudentDto.matricNo) {
      if (await this.authRepository.findByMatricNo(createStudentDto.matricNo)) {
        throw new BadRequestException(
          'User with this matriculation number already exists',
        );
      }
    }

    // Create user first
    const userDto = {
      email: createStudentDto.email,
      firstName: createStudentDto.firstName,
      lastName: createStudentDto.lastName,
      username: createStudentDto.username,
      departmentId: createStudentDto.departmentId,
      level: createStudentDto.level,
      role: createStudentDto.role,
    };

    const createdUser = await this.userService.create(userDto);

    // Then create auth record with hashed password
    const hashedPassword = await this.hashPassword(createStudentDto.password);
    const authDto = {
      email: createStudentDto.email,
      password: hashedPassword,
      matricNo: createStudentDto.matricNo,
      studentIdType: createStudentDto.userIdType,
      studentIdImage: createStudentDto.userIdImage,
      userId: createdUser.id,
    };

    await this.authRepository.create(authDto);

    // Create additional tables if they are verified
    if (createdUser.role === 'admin') {
      await this.adminService.create(createdUser.id);
    } else if (createdUser.role === 'moderator') {
      await this.moderatorService.create(
        createdUser.id,
        createdUser.departmentId,
      );
    }

    // Get department name for the welcome email
    const department = await this.departmentService.findOne(
      createStudentDto.departmentId,
    );

    // Emit event for welcome email
    this.eventEmitter.emit(EVENTS.USER_REGISTERED, {
      email: createStudentDto.email,
      firstName: createStudentDto.firstName,
      lastName: createStudentDto.lastName,
      departmentName: department.name,
      role: createdUser.role,
    });

    return createdUser;
  }

  // Generate a 6-digit verification code
  async generateVerificationCode(): Promise<string> {
    return cryptoService.randomInt().toString().padStart(6, '0');
  }

  // Generate verification token with JWT (now only used as a secondary method)
  async generateVerificationToken(
    email: string,
    code: string,
  ): Promise<string> {
    const payload = { email, code, type: 'email_verification' };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    // Encrypt the token for added security
    return cryptoService.encrypt(token);
  }

  // Request email verification
  async sendVerificationEmail(
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<boolean> {
    // Find user by email
    const auth = await this.authRepository.findByEmail(email);
    if (!auth || !auth.user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is already verified
    if (auth.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate verification code
    const verificationCode = await this.generateVerificationCode();

    // Save verification code in the database
    await this.authRepository.saveVerificationCode(
      auth.userId,
      verificationCode,
    );

    // Generate verification token as a backup method
    const token = await this.generateVerificationToken(email, verificationCode);

    // Create verification URL - don't URL encode here since the frontend will handle it
    const verificationUrl = `${this.config.FRONTEND_URL}/auth/verify-email?token=${token}`;

    // Emit event for email verification
    this.eventEmitter.emit(EVENTS.EMAIL_VERIFICATION_REQUESTED, {
      email,
      firstName,
      lastName,
      verificationCode,
      verificationUrl,
    });

    return true;
  }

  // Verify email with token (backup method)
  async verifyEmailWithToken(token: string): Promise<boolean> {
    try {
      // Decode the URL-encoded token first
      // const decodedToken = decodeURIComponent(token);
      const decodedToken = token;
      console.log('decoded token', decodedToken);
      // Decrypt token
      const decryptedToken = cryptoService.decrypt(decodedToken);
      // Verify JWT and handle expiration
      try {
        const payload = await this.jwtService.verifyAsync(decryptedToken);

        // Validate token type
        if (payload.type !== 'email_verification') {
          throw new UnauthorizedException('Invalid token type');
        }

        // Find user and validate email matches
        const auth = await this.authRepository.findByEmail(payload.email);
        if (!auth || !auth.user) {
          throw new NotFoundException('User not found');
        }

        // Check if already verified
        if (auth.emailVerified) {
          return true;
        }

        // Validate stored verification code matches token code
        if (auth.verificationCode !== payload.code) {
          throw new UnauthorizedException('Invalid verification code');
        }

        // Update email verification status
        await this.authRepository.updateEmailVerificationStatus(
          auth.userId,
          true,
        );

        // Emit event for verification success
        this.eventEmitter.emit(EVENTS.EMAIL_VERIFICATION_SUCCESS, {
          email: payload.email,
          firstName: auth.user.firstName,
          lastName: auth.user.lastName,
        });

        return true;
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Verification token has expired');
        }
        throw new UnauthorizedException('Invalid verification token');
      }
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error('Token verification failed:', error);
      throw new UnauthorizedException('Token verification failed');
    }
  }

  // Verify email with code (primary method)
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<boolean> {
    // Find user by email
    const auth = await this.authRepository.findByEmail(verifyEmailDto.email);
    if (!auth || !auth.user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is already verified
    if (auth.emailVerified) {
      return true; // Already verified
    }

    try {
      // Verify the code against the database
      const isVerified = await this.authRepository.verifyCode(
        verifyEmailDto.email,
        verifyEmailDto.code,
      );

      if (!isVerified) {
        throw new UnauthorizedException('Invalid verification code');
      }

      // Emit event for verification success
      this.eventEmitter.emit(EVENTS.EMAIL_VERIFICATION_SUCCESS, {
        email: verifyEmailDto.email,
        firstName: auth.user.firstName,
        lastName: auth.user.lastName,
      });

      return true;
    } catch (error) {
      throw new UnauthorizedException('Verification failed. Please try again.');
    }
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<boolean> {
    // Find user by email
    const auth = await this.authRepository.findByEmail(email);
    if (!auth || !auth.user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is already verified
    if (auth.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate a new verification code
    const verificationCode = await this.generateVerificationCode();

    // Save the new verification code
    await this.authRepository.saveVerificationCode(
      auth.userId,
      verificationCode,
    );

    // Emit event to resend verification email
    this.eventEmitter.emit(EVENTS.EMAIL_VERIFICATION_RESEND, {
      email,
      firstName: auth.user.firstName,
      lastName: auth.user.lastName,
      verificationCode,
      userId: auth.userId,
    });

    return true;
  }

  async forgotPassword(email: string): Promise<boolean> {
    const auth = await this.authRepository.findByEmail(email);
    if (!auth || !auth.user) {
      throw new NotFoundException('User not found');
    }

    // Generate reset token
    const payload = { email, type: 'password_reset' };
    const token = await this.jwtService.signAsync(payload, { expiresIn: '1h' });
    const encryptedToken = cryptoService.encrypt(token);

    // Save reset token and expiry
    await this.authRepository.savePasswordResetToken(
      auth.userId,
      encryptedToken,
      new Date(Date.now() + 3600000), // 1 hour from now
    );

    // Create reset URL
    const resetUrl = `${this.config.FRONTEND_URL}/auth/reset-password?token=${encodeURIComponent(encryptedToken)}`;

    // Emit event for password reset email
    this.eventEmitter.emit(EVENTS.PASSWORD_RESET_REQUESTED, {
      email,
      firstName: auth.user.firstName,
      lastName: auth.user.lastName,
      resetUrl,
    });

    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Decrypt token
      const decryptedToken = cryptoService.decrypt(token);

      // Verify JWT
      const payload = await this.jwtService.verifyAsync(decryptedToken);

      // Check token type
      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid token type');
      }

      const auth = await this.authRepository.findByEmail(payload.email);
      if (!auth || !auth.user || !auth.passwordResetToken) {
        throw new NotFoundException('Invalid or expired reset token');
      }

      // Verify token matches and hasn't expired
      if (
        auth.passwordResetToken !== token ||
        auth.passwordResetExpires < new Date()
      ) {
        throw new UnauthorizedException('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password and clear reset token
      await this.authRepository.updatePassword(auth.userId, hashedPassword);
      await this.authRepository.clearPasswordResetToken(auth.userId);

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  async hashPassword(password: string) {
    const modifiedPassword = password + this.config.BCRYPT_PEPPER;
    const hashedPassword = await bcrypt.hash(
      modifiedPassword,
      this.BCRYPT_SALT,
    );
    return hashedPassword;
  }

  async comparePassword(password: string, hashedPassword: string) {
    return bcrypt.compare(password + this.config.BCRYPT_PEPPER, hashedPassword);
  }

  async generateToken(userId: string) {
    return await this.jwtService.signAsync({ sub: userId });
  }

  async validateUser(
    emailOrMatricNo: string,
    password: string,
  ): Promise<UserEntity | null> {
    const authData =
      await this.authRepository.findByEmailOrMatricNo(emailOrMatricNo);

    if (!authData) {
      return null;
    }

    if (await this.comparePassword(password, authData.password)) {
      // Return the user data without sensitive auth information
      return authData.user;
    }
    return null;
  }
}
