import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
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
import { EVENTS } from 'src/utils/events/events.enum';
import { ConfigService } from '@nestjs/config';
import { DepartmentService } from 'src/modules/department/department.service';
import { EmailType } from 'src/utils/email/constants/email.enum';
import { EmailPayloadDto } from 'src/utils/email/dto/email-payload.dto';
import { ModeratorService } from '../moderator/moderator.service';
import { AdminService } from '../admin/admin.service';
import { EventsEmitter } from 'src/utils/events/events.emitter';

@Injectable()
export class AuthService {
  private readonly BCRYPT_SALT: string;
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userService: UserService,
    private readonly authRepository: AuthRepository,
    private readonly departmentService: DepartmentService,
    private readonly eventsEmitter: EventsEmitter,
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

    // Send welcome email
    const welcomeEmailPayload: EmailPayloadDto = {
      to: createStudentDto.email,
      type: EmailType.WELCOME_STUDENT,
      context: {
        firstName: createStudentDto.firstName,
        lastName: createStudentDto.lastName,
        departmentName: department.name,
        role: createdUser.role,
      },
    };
    this.eventsEmitter.sendEmail(welcomeEmailPayload);

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

    // Send email verification
    const verificationEmailPayload: EmailPayloadDto = {
      to: email,
      type: EmailType.EMAIL_VERIFICATION,
      context: {
        firstName,
        lastName,
        verificationCode,
        verificationUrl,
      },
    };
    this.eventsEmitter.sendEmail(verificationEmailPayload);

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

        // Send verification success email
        const successEmailPayload: EmailPayloadDto = {
          to: payload.email,
          type: EmailType.EMAIL_VERIFICATION_SUCCESS,
          context: {
            firstName: auth.user.firstName,
            lastName: auth.user.lastName,
          },
        };
        this.eventsEmitter.sendEmail(successEmailPayload);

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

      // Send verification success email
      const verificationSuccessPayload: EmailPayloadDto = {
        to: verifyEmailDto.email,
        type: EmailType.EMAIL_VERIFICATION_SUCCESS,
        context: {
          firstName: auth.user.firstName,
          lastName: auth.user.lastName,
        },
      };
      this.eventsEmitter.sendEmail(verificationSuccessPayload);

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

    const verificationCode = await this.generateVerificationCode();

    await this.authRepository.saveVerificationCode(
      auth.userId,
      verificationCode,
    );

    const token = await this.generateVerificationToken(email, verificationCode);

    const verificationUrl = `${this.config.FRONTEND_URL}/auth/verify-email?token=${encodeURIComponent(token)}`;

    const resendEmailPayload: EmailPayloadDto = {
      to: email,
      type: EmailType.EMAIL_VERIFICATION,
      context: {
        firstName: auth.user.firstName,
        lastName: auth.user.lastName,
        verificationCode,
        verificationUrl,
      },
    };
    this.eventsEmitter.sendEmail(resendEmailPayload);

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
    // needs to be encoded to prevent characters being interpreted as URL symbols
    const encodedToken = encodeURIComponent(encryptedToken);
    // Save reset token and expiry
    await this.authRepository.savePasswordResetToken(
      auth.userId,
      encryptedToken,
      new Date(Date.now() + 3600000), // 1 hour from now
    );
    // Create reset URL
    const resetUrl = `${this.config.FRONTEND_URL}/auth/reset-password?token=${encodedToken}`;

    // Send password reset email
    const passwordResetPayload: EmailPayloadDto = {
      to: email,
      type: EmailType.PASSWORD_RESET,
      context: {
        firstName: auth.user.firstName,
        lastName: auth.user.lastName,
        resetUrl,
      },
    };
    this.eventsEmitter.sendEmail(passwordResetPayload);

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
      throw new UnauthorizedException('Invalid or expired reset token...');
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
    const auth =
      await this.authRepository.findByEmailOrMatricNo(emailOrMatricNo);

    if (auth && (await this.comparePassword(password, auth.password))) {
      return auth.user; // Assuming relation 'user' is loaded or use userService
    }
    return null;
  }

  async validateUserWithGoogle(
    email: string,
    firstName: string,
    lastName: string,
    googleId: string,
  ): Promise<UserEntity> {
    this.logger.log(
      `Attempting Google validation for email: ${email}, googleId: ${googleId}`,
    );

    // 1. Check if user exists by googleId
    let user = await this.userService.findByGoogleId(googleId);
    if (user) {
      this.logger.log(`User found by googleId: ${googleId}`);
      return user;
    }

    // 2. If not, check if user exists by email
    this.logger.log(`User not found by googleId, checking by email: ${email}`);
    try {
      user = await this.userService.findByEmail(email);
      if (user) {
        this.logger.log(
          `User found by email: ${email}. Linking googleId: ${googleId}`,
        );
        // User exists, link their Google ID
        await this.userService.update(user.id, { googleId });
        // Re-fetch to get potentially updated relations or ensure data consistency
        const updatedUser = await this.userService.findOne(user.id);
        if (!updatedUser) {
          throw new NotFoundException(
            'Failed to retrieve user after linking Google ID.',
          );
        }
        return updatedUser;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        // User not found by email, continue to create new user
        this.logger.log(
          `No existing user found. Creating new user for email: ${email}, googleId: ${googleId}`,
        );
      } else {
        throw error;
      }
    }

    // 3. If no user exists by email or googleId, create a new user
    this.logger.log(
      `No existing user found. Creating new user for email: ${email}, googleId: ${googleId}`,
    );

    // Ensure userService.generateUniqueUsername exists and works as expected
    const username = await this.userService.generateUniqueUsername(
      firstName,
      lastName,
    );

    const newUserDto = {
      email,
      firstName,
      lastName,
      username,
      googleId,
      role: 'student', // Default role
      // departmentId might be null initially or set to a default if applicable
      // For now, not setting departmentId, assuming it can be null or set later
      level: 100, // Default level
      departmentId: null, // Allow null department for Google sign-ups
    };

    const createdUser = await this.userService.create(newUserDto as any);

    // Create an auth record for the new user.
    const authDto = {
      userId: createdUser.id,
      email: createdUser.email,
      // For Google authenticated users, traditional password is not set.
      // The auth record might store this fact or have a placeholder.
      // Ensure this doesn't conflict with other auth flows.
      // Setting password to a very long random unguessable string
      password: cryptoService.generateRandomKey(32), // Generate a random key as placeholder
      emailVerified: true, // Email is verified by Google
      // matricNo can be null or handled differently for Google users
    };
    await this.authRepository.create(authDto as any);

    this.logger.log(
      `New user created and auth record established for googleId: ${googleId}`,
    );

    this.eventsEmitter.sendEmail({
      to: createdUser.email,
      type: EmailType.WELCOME_STUDENT,
      context: {
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        role: createdUser.role,
      },
    });

    return createdUser;
  }

  async login(user: UserEntity) {
    // Implementation of login method
  }
}
