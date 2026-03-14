import imageCompression from 'browser-image-compression';

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

export function resizeImageOnCanvas(imageSrc, targetWidth, targetHeight, mimeType = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed during resize"));
        },
        mimeType,
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image for resizing"));
    img.src = imageSrc;
  });
};

export function rotateImageOnCanvas(imageSrc, angleDegrees, mimeType = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => {
    if (angleDegrees === 0) {
      // No rotation — return the source as a blob via fetch
      fetch(imageSrc)
        .then((res) => res.blob())
        .then(resolve)
        .catch(reject);
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const is90or270 = angleDegrees === 90 || angleDegrees === 270;
      canvas.width = is90or270 ? img.height : img.width;
      canvas.height = is90or270 ? img.width : img.height;

      const radians = (angleDegrees * Math.PI) / 180;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed during rotation"));
        },
        mimeType,
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image for rotation"));
    img.src = imageSrc;
  });
};

export const compressImageClient = async (imageFile, options = {}) => {
  const { quality = 0.8, maxWidthOrHeight = 1920 } = options;
  
  const compressionOptions = {
    maxSizeMB: (imageFile.size / 1024 / 1024) * quality, // Estimate target size
    maxWidthOrHeight: maxWidthOrHeight,
    useWebWorker: true,
    initialQuality: quality,
  };

  try {
    const compressedBlob = await imageCompression(imageFile, compressionOptions);
    return {
      blob: compressedBlob,
      fileName: imageFile.name,
      width: 0, // browser-image-compression handles internal dimensions
      height: 0
    };
  } catch (error) {
    console.error("Compression Error:", error);
    throw error;
  }
};