import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.trim().toLowerCase() });
  }

  findById(id: string) {
    return this.userModel.findById(id);
  }

  async create(data: {
    displayName: string;
    email: string;
    passwordHash: string;
    role: Role;
  }) {
    try {
      return await this.userModel.create(data);
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new ConflictException('Пользователь с таким email уже существует');
      }
      throw e;
    }
  }
}