import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger/dist';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { storage } from '../utils/media.handle';
import { storageExcel, fileFilter } from '../utils/excel.handle';

@ApiBearerAuth()
@ApiTags('cars')
@UseGuards(JwtAuthGuard)
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage }))
  create(
    @Body() createCarDto: CreateCarDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.carsService.create(createCarDto, file);
  }

  @Post('upload-excel')
  @UseInterceptors(
    FileInterceptor('file', { storage: storageExcel, fileFilter }),
  )
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    return this.carsService.uploadExcel(file);
  }

  @Get()
  findAll() {
    return this.carsService.findAll();
  }

  @Get('search')
  searchCar(@Query('query') querySearch: string) {
    return this.carsService.search(querySearch);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', { storage }))
  update(
    @Param('id') id: string,
    @Body() updateCarDto: UpdateCarDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.carsService.update(id, updateCarDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carsService.remove(id);
  }
}
