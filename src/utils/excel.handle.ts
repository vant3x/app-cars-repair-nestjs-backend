import { diskStorage } from 'multer';

export const storageExcel = diskStorage({
  destination: './uploads/excel',
  filename: (req, file, cb) => {
    const extension = file.originalname.split('.').pop();
    const name = `cars-excel.${extension}`;
    cb(null, name);
  },
});

export const fileFilter = async (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    cb(null, false);
    return cb(
      new Error(  
        'Tipo de archivo invalido. Solo se permiten  archivos xls, xlsx and csv',
      ),
    );
  } else {
    console.log('archivo correcto');
  }
  cb(null, true);
};
