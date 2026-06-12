const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'da6o1jan3',
  api_key: process.env.CLOUDINARY_API_KEY || '974159875633388',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'b0W6PuG_shP4Pb8DJfxF1T7A1w8',
});

const createCloudinaryStorage = (folderName) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `delivery_app/${folderName}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
  });
};

module.exports = {
  cloudinary,
  createCloudinaryStorage,
};
