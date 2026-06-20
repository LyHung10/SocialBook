import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const args = process.argv.slice(2);
  const isRevert = args.includes('--revert');

  const app = await NestFactory.createApplicationContext(DatabaseSeedModule);

  const seeder = app.get(SeederService);

  try {
    if (isRevert) {
      await seeder.clear();
      console.log('🎉 Seed data reverted successfully!');
    } else {
      await seeder.clear();
      await seeder.seed();
      console.log('🎉 Database seeding completed!');
    }

    process.exit(0);
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void bootstrap();
