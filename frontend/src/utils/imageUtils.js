import imageCompression from 'browser-image-compression';

export const compressAndUploadImage = async (file) => {
  try {
    // Compression options
    const options = {
      maxSizeMB: 0.1, // Smaller size for base64 storage
      maxWidthOrHeight: 400, // Smaller dimensions for base64
      useWebWorker: true,
      fileType: 'image/jpeg',
      quality: 0.7
    };

    // Compress the image
    const compressedFile = await imageCompression(file, options);
    
    // Convert to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

export const generateImagePath = (clientId, fileName) => {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  return `client-profiles/${clientId}/${timestamp}.${extension}`;
};