import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { UserRepository } from './user.repository';
import { DepartmentService } from '../department/department.service';
import { CoursesRepository } from '../courses/courses.repository';

const user: CreateUserDto = {
  firstName: 'John',
  lastName: 'Doe',
  username: 'john.doe',
  level: 1,
  email: 'john.doe@example.com',
};

describe('UserController', () => {
  let controller: UserController;
  // let service: UserService;
  const mockUserService = {
    create: jest.fn((dto) => {
      return {
        id: Date.now(),
        ...dto,
      };
    }),
  };

  // Mock dependencies that UserService requires
  const mockUserRepository = {};
  const mockDepartmentService = {};
  const mockCoursesRepository = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: DepartmentService,
          useValue: mockDepartmentService,
        },
        {
          provide: CoursesRepository,
          useValue: mockCoursesRepository,
        },
      ],
    })
      // !  mock service
      .overrideProvider(UserService)
      .useValue(mockUserService) // !  mock service

      // mock repository
      // .overrideProvider(UserRepository)
      // .useValue(mockUserRepository)
      .compile();

    controller = module.get<UserController>(UserController);
    // service = module.get<UserService>(UserService); - real service
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a user', async () => {
    const result = await controller.create(user);
    expect(result).toEqual({
      id: expect.any(Number),
      firstName: 'John',
      lastName: 'Doe',
      username: 'john.doe',
      level: 1,
      email: 'john.doe@example.com',
    });

    expect(mockUserService.create).toHaveBeenCalledWith(user);
  });
});
