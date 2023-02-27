import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Decimal128, HydratedDocument } from 'mongoose';

export type CarsDocument = HydratedDocument<Cars>;

@Schema()
export class Cars {
  @Prop({
    required: true,
  })
  brand: string;

  @Prop()
  model: string;

  @Prop({
    required: true,
  })
  year: number;

  @Prop()
  price: number;

  @Prop()
  image: string;

  @Prop()
  filename: string;

  @Prop()
  description: string;

  @Prop({
    type: Date,
    required: true,
    default: Date.now(),
  })
  entryDate: Date;

  @Prop({
    default: 0,
  })
  mileage: number;

  @Prop()
  owner: string;

  @Prop()
  phoneOwner: number;

  @Prop()
  addressOwner: string;

  @Prop({ enum: ['gasoline', 'electric'], default: 'gasoline' })
  gas: string;

  @Prop({
    default: true,
  })
  state: boolean;

  @Prop({
    required: false,
    type: Date,
    default: Date.now(),
  })
  createdAt: Date;
  @Prop({
    required: true,
    unique: true,
  })
  carRegistrationPlate: string;

  @Prop({
    required: false,
    type: Date,
    default: Date.now(),
  })
  updatedAt: Date;
}

export const CarsSchema = SchemaFactory.createForClass(Cars);
