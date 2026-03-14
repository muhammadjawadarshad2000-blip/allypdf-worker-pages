const { PDFDocument } = await import('pdf-lib');
const pdfjsLib = await import('pdfjs-dist');
import JSZip from 'jszip';

// Configure PDF.js worker - Fixed URL (removed space)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const validatePDF = (file) => {
  if (file.type !== 'application/pdf') {
    return 'Please select a valid PDF file';
  }

  return null;
};

export const validateImageForPDF = (file, fileTypeName) => {
  let allowedTypes;

  if (fileTypeName === "JPG" || fileTypeName === "JPEG") {
    allowedTypes = ['image/jpeg', 'image/jpg'];
  } else if (fileTypeName === "PNG") {
    allowedTypes = ['image/png'];
  } else {
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/avif'];
  }

  if (!allowedTypes.includes(file.type)) {
    if (fileTypeName === "JPG" || fileTypeName === "JPEG") {
      return 'Please select a valid JPEG or JPG file'
    } else if (fileTypeName === "PNG") {
      return 'Please select a valid PNG file'
    }
    return 'Please select a valid image file (JPEG, PNG, WebP, GIF, BMP, AVIF)';
  }

  return null;
};

export const isPDFEncrypted = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Try with pdf-lib first
    try {
      await PDFDocument.load(arrayBuffer);
      return { encrypted: false };
    } catch (error) {
      // If pdf-lib fails, try with pdfjs to confirm encryption
      try {
        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          password: '', // Empty password to trigger password callback
        }).promise;

        // If we get here without password, it's not encrypted
        await pdf.destroy();
        return { encrypted: false };
      } catch (pdfjsError) {
        if (pdfjsError.name === 'PasswordException') {
          return { encrypted: true, needsPassword: true };
        }
        throw pdfjsError;
      }
    }
  } catch (error) {
    throw new Error(`Failed to check PDF encryption: ${error.message}`);
  }
};

const pdfPasswords = new Map();

export const setPDFPassword = (fileId, password) => {
  pdfPasswords.set(fileId, password);
};

export const getPDFPassword = (fileId) => {
  return pdfPasswords.get(fileId);
};

export const clearPDFPassword = (fileId) => {
  pdfPasswords.delete(fileId);
};

export const getPDFInfo = async (file, password = null) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const fileId = `${file.name}-${file.size}`;

    let isEncrypted = false;
    let pageCount = 0;

    try {
      // Try with pdf-lib first
      const pdf = await PDFDocument.load(arrayBuffer);
      pageCount = pdf.getPageCount();
      isEncrypted = false;
    } catch (error) {
      // Try with pdfjs for encrypted PDFs
      isEncrypted = true;
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password || getPDFPassword(fileId),
      }).promise;
      pageCount = pdf.numPages;
      await pdf.destroy();
    }

    return {
      pageCount,
      fileSize: file.size,
      fileName: file.name,
      isEncrypted,
      needsPassword: isEncrypted && !password && !getPDFPassword(fileId)
    };
  } catch (error) {
    throw new Error(`Failed to get PDF information: ${error.message}`);
  }
};

// Enhanced PDF loading with password support
export const loadPDFDocument = async (file, fileId, password = null) => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Try to load with pdf-lib first (for non-encrypted PDFs)
    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      return { pdfDoc, pdfjsDoc: null, encrypted: false };
    } catch (error) {
      // If pdf-lib fails, try with pdfjs with password
      console.log('PDF might be encrypted, trying with PDF.js...');

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password || getPDFPassword(fileId),
        onPassword: (callback, reason) => {
          // Handle password request
          if (reason === pdfjsLib.PasswordResponses.NEED_PASSWORD) {
            throw new Error('PDF is encrypted and requires a password');
          }
          callback(password || getPDFPassword(fileId));
        }
      });

      const pdfjsDoc = await loadingTask.promise;
      return { pdfDoc: null, pdfjsDoc, encrypted: true };
    }
  } catch (error) {
    throw new Error(`Failed to load PDF: ${error.message}`);
  }
};

export const setMetadata = async (arrayBuffer, url) => {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    const fileName = `${url.split("/").pop().replace(".", "_") || "website"}.pdf`;

    // Set metadata
    pdfDoc.setTitle(fileName);
    pdfDoc.setProducer('Allypdf');
    const modifiedPdfBytes = await pdfDoc.save();

    const modifiedBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(modifiedBlob);

    return { modifiedBlob, downloadUrl };
  } catch (error) {
    console.error('Error setting PDF metadata:', error);
    throw error;
  }
};

// Convert PDF.js document to PDF-lib document (for encrypted PDFs)
export const convertPdfJsToPdfLib = async (pdfjsDoc) => {
  try {
    const pdfLibDoc = await PDFDocument.create();
    const numPages = pdfjsDoc.numPages;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfjsDoc.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });

      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Convert canvas to image and embed in PDF-lib
      const imageData = canvas.toDataURL('image/png');
      const pngImage = await pdfLibDoc.embedPng(imageData);

      // Add page with same dimensions
      const { width, height } = page.getViewport({ scale: 1.0 });
      const pdfPage = pdfLibDoc.addPage([width, height]);
      pdfPage.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });

      // Clean up
      canvas.width = 0;
      canvas.height = 0;
    }

    return pdfLibDoc;
  } catch (error) {
    throw new Error(`Failed to convert PDF.js to PDF-lib: ${error.message}`);
  }
};

export const testPDFPassword = async (file, password) => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password,
    }).promise;

    await pdf.destroy();
    return { valid: true };
  } catch (error) {
    if (error.name === 'PasswordException') {
      return { valid: false, error: 'Invalid password' };
    }
    return { valid: false, error: error.message };
  }
};

export const getPageCount = async (file, password = null) => {
  try {
    const fileId = `${file.name}-${file.size}`;
    const { pdfDoc, pdfjsDoc, encrypted } = await loadPDFDocument(file, fileId, password);

    if (encrypted && pdfjsDoc) {
      const pageCount = pdfjsDoc.numPages;
      await pdfjsDoc.destroy();
      return pageCount;
    } else if (pdfDoc) {
      return pdfDoc.getPageCount();
    } else {
      throw new Error('Failed to get page count');
    }
  } catch (error) {
    throw new Error(`Failed to get page count: ${error.message}`);
  }
};

export async function generatePDFPreview(file, pageNumber, scale = 0.5, type = "JPEG", password = null) {
  try {
    const arrayBuffer = await file.arrayBuffer?.() ?? await file.blob?.arrayBuffer?.();
    if (!arrayBuffer) throw new Error("Invalid file or blob input");

    const fileId = `${file.name}-${file.size}`;
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password || getPDFPassword(fileId),
    }).promise;

    const pdfPage = await pdf.getPage(pageNumber);
    if (!pdfPage) throw new Error(`Page ${pageNumber} not found`);

    const viewport = pdfPage.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");

    // Render page
    await pdfPage.render({ canvasContext: ctx, viewport }).promise;

    const previewUrl = canvas.toDataURL(`image/${type.toLocaleLowerCase()}`);

    // Clean up
    await pdf.destroy();

    return {
      previewUrl,
      width: viewport.width,
      height: viewport.height
    };
  } catch (err) {
    console.error(`Failed to generate ${type} preview:`, err);
    throw new Error(`Failed to convert page ${pageNumber} to ${type}:  ${err.message}`);
  }
}

export const downloadPDF = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadPDFsAsZip = async (pdfBlobs, baseFilename = 'split_pdfs') => {
  try {
    const zip = new JSZip();

    pdfBlobs.forEach((pdf, index) => {
      if (pdf.blob) {
        zip.file(pdf.name || `${baseFilename}_part${index + 1}.pdf`, pdf.blob);
      }
    });

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    downloadPDF(zipBlob, `${baseFilename}.zip`);

    return {
      success: true,
      fileCount: pdfBlobs.length,
      totalSize: zipBlob.size
    };
  } catch (error) {
    console.error('ZIP creation failed:', error);
    throw new Error(`Failed to create ZIP file: ${error.message}`);
  }
};