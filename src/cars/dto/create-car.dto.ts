import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsNumberString, Min } from 'class-validator';

export class CreateCarDto {
  @IsNotEmpty()
  brand: string;
  model: string;
  entryDate: Date;
  @IsNotEmpty()
  year: number;
  description: string;
  mileage?: number;
  color?: string;
  price: number;
  image: string;
  filename: string;
  @IsNotEmpty()
  carRegistrationPlate: string;
  owner: string;
  phoneOwner?: number;
  addressOwner?: string;
  gas?: 'gasoline' | 'electric';
  state: boolean;
}
