import { diskStorage } from 'multer';

export const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const extension = file.originalname.split('.').pop();
    const name = `${file.originalname
      .split('.')[0]
      .trim()}-${Date.now()}.${extension}`;
    cb(null, name);
  },
});
