export const convertBetweenImages = async (imageFile, options = {}, type = "JPG") => {
  try {
    const { quality = 1.0 } = options;

    // Create image element
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;

          // Fill with white background for transparency
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw image
          ctx.drawImage(img, 0, 0);

          // Convert to JPEG
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error(`Failed to convert image to ${type}`));
              return;
            }

            resolve({
              blob,
              width: img.width,
              height: img.height,
              fileName: `${imageFile.name.replace(/\.[^/.]+$/, "")}.${type.toLocaleLowerCase()}`
            });
          }, `image/${type.toLocaleLowerCase()}`, quality);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for conversion'));
      };

      img.src = URL.createObjectURL(imageFile);
    });
  } catch (error) {
    throw new Error(`Failed to convert image to ${type}: ${error.message}`);
  }
};