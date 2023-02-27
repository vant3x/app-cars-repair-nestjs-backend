import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import * as csv from 'csv-parser';

import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { Cars, CarsDocument } from './schema/cars.schema';

@Injectable()
export class CarsService {
  private readonly imageUrl = 'http://localhost:3000/uploads/';
  private readonly percentIncreaseByDay = 5;
  private readonly percentIncreaseByModelYear = 20;
  private readonly yearThreshold = 1997;

  constructor(@InjectModel(Cars.name) private carsModel: Model<CarsDocument>) {}

  private calculatePrice = (value: number, percent: number): number => {
    return (value * percent) / 100;
  };

  async create(createCarDto: CreateCarDto, file?: Express.Multer.File) {
    // añadir el path de la imagen
    if (file) {
      createCarDto.image = `${this.imageUrl}${file.filename}`;
      createCarDto.filename = file.filename;
    }

    createCarDto.price = Number(createCarDto.price);
    // calcular el precio de acuerdo a la fecha de entrada
    const entryDay = new Date(createCarDto.entryDate).getDate();
    if (entryDay % 2 === 0) {
      createCarDto.price += this.calculatePrice(
        createCarDto.price,
        this.percentIncreaseByDay,
      );
    }

    // calcular el precio por el año del vehiculo
    if (createCarDto.year <= this.yearThreshold) {
      createCarDto.price += this.calculatePrice(
        createCarDto.price,
        this.percentIncreaseByModelYear,
      );
    }

    const carCreatedResponse = await this.carsModel.create(createCarDto);
    return carCreatedResponse;
  }

  async uploadExcel(file: Express.Multer.File) {
    const filePathCsv = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      'excel',
      'cars-excel.csv',
    );
    const filePathXlsx = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      'excel',
      'cars-excel.xlsx',
    );

    const filesPath = [filePathCsv, filePathXlsx];

    for (const filePath of filesPath) {
      try {
        const fileExists = await fs.existsSync(path.normalize(filePath));
        const extension = filePath.split('.')[1];
        const fileExtension = file.filename.split('.')[1];

        if (fileExists && extension !== fileExtension) {
          await fs.promises.unlink(filePath);
        }
        if (fileExists && extension === fileExtension) {
          this.readExcelFile(filePath, extension);
        }
      } catch (error) {
        throw new HttpException(
          'Error al subir el archivo de excel',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return {
      msg: 'archivo subido',
      file,
      status: 201,
    };
  }

  readExcelFile(filePath: string, extension: string) {
    try {
      let excelCars = [];
      if (extension === 'csv') {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => {
            excelCars = data;
          })
          .on('end', () => {
            console.log('Archivo leido');
          });
      }

      if (extension === 'xlsx') {
        // Leer el archivo
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Parsear a JSON
        const json = XLSX.utils.sheet_to_json(sheet);
        excelCars = json;
      }

      this.compareCars(excelCars);
    } catch (err) {}
  }

  async compareCars(excelCars) {
    const dbCars = await this.carsModel.find();
    // 1. Crear un hash table para almacenar los carros de la base de datos
    const dbCarsMap = dbCars.forEach((car) => {
      dbCarsMap.set(car.carRegistrationPlate, car);
    });
    // 2. Iterar sobre los carros del excel usando el método map()
    const updatedCarsPromises = excelCars.map(async (excelCar) => {
      // 3. Buscar el carro en la base de datos usando el campo carRegistrationPlate
      const dbCar = dbCarsMap.get(excelCar.carRegistrationPlate);
      if (!dbCar) {
        // Si el carro no existe en la base de datos, insertarlo
        if (!excelCar.carRegistrationPlate) {
          return { message: 'La placa es requerida' };
        } else {
          excelCar.entryDate = new Date();
          await this.carsModel.create(excelCar);
        }
      }

      if (
        dbCar &&
        excelCar &&
        excelCar.carRegistrationPlate === dbCar.carRegistrationPlate
      ) {
        // Si el carro existe en las dos fuentes, actualizarlo
        dbCar.entryDate = new Date();
        await this.carsModel.updateOne({ _id: dbCar._id }, excelCar);
      }
    });

    await Promise.all(updatedCarsPromises);

    //  Si el carro existe en la base de datos pero no en el excel, deshabilitarlo
    const carsToUpdate = dbCars.filter(
      (dbCar) =>
        !excelCars.some(
          (excelCar) =>
            excelCar.carRegistrationPlate === dbCar.carRegistrationPlate,
        ),
    );
    for (const car of carsToUpdate) {
      car.state = false;
      //car.entryDate = new Date();
      await this.carsModel.updateOne({ _id: car._id }, car);
    }
  }

  async findAll() {
    const allCarsResponse = await this.carsModel
      .find({})
      .sort({ createdAt: -1 });

    return allCarsResponse;
  }

  async findOne(id: string) {
    const carResponse = await this.carsModel.findOne({ _id: id });
    return carResponse;
  }

  async search(query: string) {
    const cars = await this.carsModel
      .find({
        $or: [
          { brand: new RegExp('^' + query, 'i') },
          { model: new RegExp('^' + query, 'i') },
          { carRegistrationPlate: new RegExp('^' + query, 'i') },
        ],
      })
      .sort({ createdAt: -1 });
    return cars;
  }

  async update(
    id: string,
    updateCarDto: UpdateCarDto,
    file: Express.Multer.File,
  ) {
    // Obtener el documento de la base de datos antes de actualizarlo
    const car = await this.carsModel.findById(id);
    // Verificar si se subió una nueva imagen
    if (file) {
      // Asignar la nueva URL a la propiedad image del objeto updateCarDto
      updateCarDto.image = `${this.imageUrl}${file.filename}`;
      updateCarDto.filename = file.filename;
      // Eliminar la imagen anterior
      if (car.filename) {
        fs.unlinkSync(
          path.join(__dirname, '..', '..', '..', 'uploads', car.filename),
        );
      }
    }
    const carUpdatedResponse = await this.carsModel.findByIdAndUpdate(
      { _id: id },
      updateCarDto,
      {
        new: true,
      },
    );
    return carUpdatedResponse;
  }

  async remove(id: string) {
    try {
      const carResponseDelete = await this.carsModel.findByIdAndDelete({
        _id: id,
      });

      if (carResponseDelete && carResponseDelete.filename) {
        const filePath = `${__dirname}/../../uploads/${carResponseDelete?.filename}`;
        await fs.promises.unlink(filePath);
      }
      return carResponseDelete;
    } catch (e) {
      throw new HttpException(
        'Error al eliminar el auto',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
