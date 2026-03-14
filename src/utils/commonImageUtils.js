import JSZip from "jszip";

export const validateImage = (file) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/bmp', 'image/avif',
  ];

  if (!allowedTypes.includes(file.type)) {
    return 'Please select a valid image file (JPEG, PNG, WebP, GIF, BMP, AVIF)';
  }

  return null;
};

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export function getMimeType(fileName) {
  const ext = fileName.split(".").pop().toLowerCase();
  const map = {
    jpg: "image/jpg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
    avif: "image/avif",
  };
  return map[ext] || "image/png";
}

export function getExtension(fileName) {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot !== -1 ? fileName.substring(lastDot) : ".png";
}

export const generateImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const previewUrl = URL.createObjectURL(file);
      resolve({
        previewUrl,
        width: img.width,
        height: img.height,
        fileName: file.name,
        fileSize: file.size
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for preview'));
    };

    img.src = URL.createObjectURL(file);
  });
};

export const downloadImage = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadImagesIndividually = async (images) => {
  images.forEach((image, index) => {
    if (image.blob) {
      setTimeout(() => {
        downloadPNG(image.blob, image.fileName);
      }, index * 100); // Stagger downloads to avoid browser issues
    }
  });

  return {
    success: true,
    fileCount: images.length,
    individualDownloads: true
  };
};

export const downloadImagesAsZip = async (images, zipFileName) => {
  try {
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error('No images provided for ZIP creation');
    }

    if (typeof JSZip === 'undefined') {
      console.warn('JSZip not available, downloading files individually');
      return downloadImagesIndividually(images);
    }

    const zip = new JSZip();

    images.forEach((image, index) => {
      if (image.blob && image.fileName) {
        zip.file(image.fileName, image.blob);
      }
    });

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${zipFileName || 'converted_images'}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      fileCount: images.length,
      totalSize: zipBlob.size
    };
  } catch (error) {
    console.error('Failed to create images ZIP:', error);
    return downloadImagesIndividually(images);
  }
};