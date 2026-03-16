// backend/src/common/repositories/base.repository.ts
import { PrismaService } from '../../prisma/prisma.service';

export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  protected abstract readonly modelName: string;

  constructor(protected prisma: PrismaService) {}

  async create(data: CreateDto): Promise<T> {
    // @ts-ignore - dynamic model access
    return this.prisma[this.modelName].create({ data });
  }

  async findById(id: string): Promise<T | null> {
    // @ts-ignore - dynamic model access
    return this.prisma[this.modelName].findUnique({
      where: { id, deletedAt: null }
    });
  }

  async findAll(where?: any): Promise<T[]> {
    // @ts-ignore - dynamic model access
    return this.prisma[this.modelName].findMany({
      where: { ...where, deletedAt: null }
    });
  }

  async update(id: string, data: UpdateDto): Promise<T> {
    // @ts-ignore - dynamic model access
    return this.prisma[this.modelName].update({
      where: { id },
      data
    });
  }

  async softDelete(id: string): Promise<T> {
    // @ts-ignore - dynamic model access
    return this.prisma[this.modelName].update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async hardDelete(id: string): Promise<T> {
    // @ts-ignore - dynamic model access
    return this.prisma[this.modelName].delete({
      where: { id }
    });
  }
}