import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { Role } from './users/user.schema';

const DEMO_PASSWORD = 'Password12345';

const DEMO_USERS = [
  { displayName: 'Организатор', email: 'organizer@test.kz', role: Role.ORGANIZER },
  { displayName: 'Судья Один', email: 'referee1@test.kz', role: Role.REFEREE },
  { displayName: 'Судья Два', email: 'referee2@test.kz', role: Role.REFEREE },
  { displayName: 'Капитан 1', email: 'captain1@test.kz', role: Role.CAPTAIN },
  { displayName: 'Капитан 2', email: 'captain2@test.kz', role: Role.CAPTAIN },
  { displayName: 'Капитан 3', email: 'captain3@test.kz', role: Role.CAPTAIN },
  { displayName: 'Капитан 4', email: 'captain4@test.kz', role: Role.CAPTAIN },
  { displayName: 'Посторонний', email: 'outsider@test.kz', role: Role.CAPTAIN },
];

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  const users = app.get(UsersService);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const u of DEMO_USERS) {
    if (await users.findByEmail(u.email)) {
      console.log('exists :', u.email);
      continue;
    }
    await users.create({ ...u, passwordHash });
    console.log('created:', u.email, `(${u.role})`);
  }
  await app.close();
}
run();