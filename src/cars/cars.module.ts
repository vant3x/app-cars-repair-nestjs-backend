import { Module } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cars, CarsSchema } from './schema/cars.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Cars.name,
        schema: CarsSchema
      },
    ]),
  ],
  controllers: [CarsController],
  providers: [CarsService]
})
export class CarsModule {}
