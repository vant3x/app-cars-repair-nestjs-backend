import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { User, UserDocument } from 'src/users/schema/user.schema';
import { hash, compare } from 'bcrypt';

import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt/dist';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(userObject: RegisterAuthDto) {
    const { password } = userObject;
    const plainToHash = await hash(password, 10);
    userObject = { ...userObject, password: plainToHash };
    return this.userModel.create(userObject);
  }

  async login(userLoginObject: LoginAuthDto) {
    const { email, password } = userLoginObject;
    const findUser = await this.userModel.findOne({ email });
    if (!findUser) throw new HttpException('El usuario no se encontró', 404);

    const checkPassword = await compare(password, findUser.password);

    if (!checkPassword) throw new HttpException('Contraseña incorrecta', 403);

    const payload = {
      _id: findUser,
      email,
      name: `${findUser.firstname} ${findUser.lastname}`,
    };
    const token = await this.jwtService.sign(payload);

    const data = {
      user: findUser._id,
      token,
    };

    return data;
  }

  findAll() {
    return `This action returns all auth`;
  }
}
  