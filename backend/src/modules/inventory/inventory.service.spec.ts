import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service.js';
import { PrismaService } from '../../common/database/index.js';

describe('InventoryService', () => {
  let service: InventoryService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findFirst: jest.fn(),
            },
            warehouse: {
              findFirst: jest.fn(),
            },
            supplier: {
              findFirst: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            batch: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            inventoryMovement: {
              create: jest.fn(),
            },
            accountPayable: {
              create: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prismaService)),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
