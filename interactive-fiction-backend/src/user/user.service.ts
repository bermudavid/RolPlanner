import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(username: string, password_plaintext: string, role: UserRole): Promise<User> {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password_plaintext, saltRounds);
    const newUser = this.usersRepository.create({ username, password_hash, role });
    return this.usersRepository.save(newUser);
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }
}
