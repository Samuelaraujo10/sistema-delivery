const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: 'da6o1jan3', // ← replace this if needed
  api_key: '974159875633388', // ← replace this if needed
  api_secret: 'b0W6PuG_shP4Pb8DJfxF1T7A1w8' // ← replace this
});

async function run() {
  try {
    console.log("Uploading image...");
    
    // 2. Upload an image
    const uploadResult = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg", {
      public_id: "delivery_sample"
    });
    
    console.log("Upload successful!");
    console.log("Secure URL:", uploadResult.secure_url);
    console.log("Public ID:", uploadResult.public_id);
    console.log("--------------------------------------");

    // 3. Get image details
    console.log("Image metadata:");
    console.log(`Width: ${uploadResult.width}px`);
    console.log(`Height: ${uploadResult.height}px`);
    console.log(`Format: ${uploadResult.format}`);
    console.log(`File size: ${uploadResult.bytes} bytes`);
    console.log("--------------------------------------");

    // 4. Transform the image
    // f_auto: Automatically chooses the best image format for the requesting browser (e.g., WebP/AVIF instead of JPG).
    // q_auto: Automatically adjusts the image quality to reduce file size without losing visual quality.
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto',
      quality: 'auto'
    });

    console.log("Done! Click link below to see optimized version of the image. Check the size and the format.");
    console.log("Transformed URL:", transformedUrl);
    
  } catch (error) {
    console.error("Error during Cloudinary setup:", error);
  }
}

run();
