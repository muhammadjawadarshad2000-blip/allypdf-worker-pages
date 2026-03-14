const { PDFDocument, degrees } = await import('pdf-lib');
const pdfjsLib = await import('pdfjs-dist');
import {
  getPDFPassword,
  loadPDFDocument,
  convertPdfJsToPdfLib,
} from "./index"

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;


export const mergePDFs = async (files, passwords = {}) => {
  try {
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${file.name}-${file.size}`;
      const password = passwords[fileId] || getPDFPassword(fileId);

      const { pdfDoc, pdfjsDoc, encrypted } = await loadPDFDocument(file, fileId, password);

      if (encrypted && pdfjsDoc) {
        // Convert encrypted PDF to images and add to merged PDF
        const convertedDoc = await convertPdfJsToPdfLib(pdfjsDoc);
        const pageIndices = convertedDoc.getPageIndices();
        const pages = await mergedPdf.copyPages(convertedDoc, pageIndices);
        pages.forEach((page) => mergedPdf.addPage(page));

        // Clean up
        await pdfjsDoc.destroy();
      } else if (pdfDoc) {
        // Standard non-encrypted PDF processing
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      } else {
        throw new Error('Failed to load PDF for merging');
      }
    }

    const mergedPdfBytes = await mergedPdf.save();
    return new Blob([mergedPdfBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to merge PDFs: ${error.message}`);
  }
};

export async function splitPDF(file, ranges = [], password = null) {
  try {
    if (!file) throw new Error("Missing PDF file input");
    if (!Array.isArray(ranges) || ranges.length === 0)
      throw new Error("Invalid or empty ranges");

    const fileId = `${file.name}-${file.size}`;
    const { pdfDoc, pdfjsDoc, encrypted } = await loadPDFDocument(file, fileId, password);

    const results = [];
    let baseName = "document";
    if (file.name && typeof file.name === "string") {
      baseName = file.name.replace(/\.pdf$/i, "");
    }

    if (encrypted && pdfjsDoc) {
      const convertedDoc = await convertPdfJsToPdfLib(pdfjsDoc);
      const pageCount = convertedDoc.getPageCount();

      for (let i = 0; i < ranges.length; i++) {
        const { start, end } = ranges[i];
        const safeStart = Math.max(1, Math.min(start, pageCount));
        const safeEnd = Math.max(safeStart, Math.min(end, pageCount));

        const newPdf = await PDFDocument.create();
        const pageIndexes = Array.from(
          { length: safeEnd - safeStart + 1 },
          (_, idx) => safeStart - 1 + idx
        );
        const copiedPages = await newPdf.copyPages(convertedDoc, pageIndexes);
        copiedPages.forEach((p) => newPdf.addPage(p));

        const bytes = await newPdf.save();
        const blob = new Blob([bytes], { type: "application/pdf" });

        Object.defineProperty(blob, "name", {
          value: `${baseName}_part${i + 1}.pdf`,
          writable: false,
        });

        results.push({
          range: { start: safeStart, end: safeEnd },
          blob,
        });
      }

      await pdfjsDoc.destroy();
    } else if (pdfDoc) {
      const pageCount = pdfDoc.getPageCount();

      for (let i = 0; i < ranges.length; i++) {
        const { start, end } = ranges[i];
        const safeStart = Math.max(1, Math.min(start, pageCount));
        const safeEnd = Math.max(safeStart, Math.min(end, pageCount));

        const newPdf = await PDFDocument.create();
        const pageIndexes = Array.from(
          { length: safeEnd - safeStart + 1 },
          (_, idx) => safeStart - 1 + idx
        );
        const copiedPages = await newPdf.copyPages(pdfDoc, pageIndexes);
        copiedPages.forEach((p) => newPdf.addPage(p));

        const bytes = await newPdf.save();
        const blob = new Blob([bytes], { type: "application/pdf" });

        Object.defineProperty(blob, "name", {
          value: `${baseName}_part${i + 1}.pdf`,
          writable: false,
        });

        results.push({
          range: { start: safeStart, end: safeEnd },
          blob,
        });
      }
    } else {
      throw new Error("Failed to load PDF for splitting");
    }

    return results;
  } catch (err) {
    console.error("splitPDF failed:", err);
    throw err;
  }
}

export const deletePDFPages = async (file, pagesToDelete, password = null) => {
  try {
    const fileId = `${file.name}-${file.size}`;
    const { pdfDoc, pdfjsDoc, encrypted } = await loadPDFDocument(file, fileId, password);

    if (encrypted && pdfjsDoc) {
      // For encrypted PDFs, convert to images and recreate without deleted pages
      const convertedDoc = await convertPdfJsToPdfLib(pdfjsDoc);
      const totalPages = convertedDoc.getPageCount();

      if (pagesToDelete.length === 0) {
        throw new Error('No valid pages specified for deletion');
      }

      if (pagesToDelete.length >= totalPages) {
        throw new Error('Cannot delete all pages from the document');
      }

      const newPdf = await PDFDocument.create();

      // Copy all pages except the ones to delete
      for (let i = 0; i < totalPages; i++) {
        const pageNumber = i + 1;
        if (!pagesToDelete.includes(pageNumber)) {
          const [copiedPage] = await newPdf.copyPages(convertedDoc, [i]);
          newPdf.addPage(copiedPage);
        }
      }

      const pdfBytes = await newPdf.save();
      await pdfjsDoc.destroy();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } else if (pdfDoc) {
      // Original non-encrypted processing
      const totalPages = pdfDoc.getPageCount();

      if (pagesToDelete.length === 0) {
        throw new Error('No valid pages specified for deletion');
      }

      if (pagesToDelete.length >= totalPages) {
        throw new Error('Cannot delete all pages from the document');
      }

      const newPdf = await PDFDocument.create();

      // Copy all pages except the ones to delete
      for (let i = 0; i < totalPages; i++) {
        const pageNumber = i + 1;
        if (!pagesToDelete.includes(pageNumber)) {
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(copiedPage);
        }
      }

      const pdfBytes = await newPdf.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } else {
      throw new Error('Failed to load PDF for page deletion');
    }
  } catch (error) {
    throw new Error(`Failed to delete pages: ${error.message}`);
  }
};

export async function extractPDFPages(file, pageNumbers = [], password = null) {
  try {
    if (!file) throw new Error("Missing PDF file");
    if (!Array.isArray(pageNumbers) || pageNumbers.length === 0)
      throw new Error("No pages selected");

    const fileId = `${file.name}-${file.size}`;
    const { pdfDoc, pdfjsDoc, encrypted } = await loadPDFDocument(file, fileId, password);

    if (encrypted && pdfjsDoc) {
      const convertedDoc = await convertPdfJsToPdfLib(pdfjsDoc);
      const maxPages = convertedDoc.getPageCount();
      const validPages = pageNumbers.filter((p) => p >= 1 && p <= maxPages);

      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(
        convertedDoc,
        validPages.map((p) => p - 1)
      );
      copied.forEach((p) => newPdf.addPage(p));

      const bytes = await newPdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });

      const baseName = file.name?.replace(/\.pdf$/i, "") || "document";
      Object.defineProperty(blob, "name", {
        value: `${baseName}_extracted.pdf`,
        writable: false,
      });

      await pdfjsDoc.destroy();
      return blob;
    } else if (pdfDoc) {
      const maxPages = pdfDoc.getPageCount();
      const validPages = pageNumbers.filter((p) => p >= 1 && p <= maxPages);

      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(
        pdfDoc,
        validPages.map((p) => p - 1)
      );
      copied.forEach((p) => newPdf.addPage(p));

      const bytes = await newPdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });

      const baseName = file.name?.replace(/\.pdf$/i, "") || "document";
      Object.defineProperty(blob, "name", {
        value: `${baseName}_extracted.pdf`,
        writable: false,
      });

      return blob;
    } else {
      throw new Error("Failed to load PDF for extraction");
    }
  } catch (err) {
    console.error("extractPDFPages failed:", err);
    throw err;
  }
}

export async function rearrangePDFPages(file, order = [], password = null) {
  try {
    if (!file) throw new Error("Missing PDF file");
    if (!Array.isArray(order) || order.length === 0)
      throw new Error("Invalid page order array");

    const fileId = `${file.name}-${file.size}`;
    const { pdfDoc, pdfjsDoc, encrypted } = await loadPDFDocument(file, fileId, password);

    if (encrypted && pdfjsDoc) {
      // For encrypted PDFs, convert to images and rearrange
      const convertedDoc = await convertPdfJsToPdfLib(pdfjsDoc);
      const pageCount = convertedDoc.getPageCount();
      const validOrder = order.filter((n) => n >= 1 && n <= pageCount);

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(
        convertedDoc,
        validOrder.map((n) => n - 1)
      );
      copiedPages.forEach((p) => newPdf.addPage(p));

      const bytes = await newPdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });

      const baseName = file.name?.replace(/\.pdf$/i, "") || "document";
      Object.defineProperty(blob, "name", {
        value: `${baseName}_rearranged.pdf`,
        writable: false,
      });

      await pdfjsDoc.destroy();
      return blob;
    } else if (pdfDoc) {
      // Original non-encrypted processing
      const pageCount = pdfDoc.getPageCount();
      const validOrder = order.filter((n) => n >= 1 && n <= pageCount);

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(
        pdfDoc,
        validOrder.map((n) => n - 1)
      );
      copiedPages.forEach((p) => newPdf.addPage(p));

      const bytes = await newPdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });

      const baseName = file.name?.replace(/\.pdf$/i, "") || "document";
      Object.defineProperty(blob, "name", {
        value: `${baseName}_rearranged.pdf`,
        writable: false,
      });

      return blob;
    } else {
      throw new Error("Failed to load PDF for rearrangement");
    }
  } catch (err) {
    console.error("rearrangePDFPages failed:", err);
    throw err;
  }
}

export async function cropPDF(file, edits = [], password = null) {
  try {
    if (!file) throw new Error("Missing PDF file");
    if (!Array.isArray(edits) || edits.length === 0)
      throw new Error("No crop data provided");

    const arrayBuffer = await file.arrayBuffer();
    const fileId = `${file.name}-${file.size}`;

    // Load PDF with PDF.js for rendering
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password || getPDFPassword(fileId),
    }).promise;

    const totalPages = pdf.numPages;

    // Create new PDF document
    const newPdfDoc = await PDFDocument.create();

    // Create a map of page numbers to their crop data
    const cropMap = new Map();
    edits.forEach(edit => {
      cropMap.set(edit.pageNumber, edit);
    });

    // Process each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const cropData = cropMap.get(pageNum);

      if (!cropData) {
        // No crop data for this page, copy as-is using higher quality render
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        const imageDataUrl = canvas.toDataURL('image/png', 1.0);
        const pngImage = await newPdfDoc.embedPng(imageDataUrl);

        const { width, height } = page.getViewport({ scale: 1.0 });
        const newPage = newPdfDoc.addPage([width, height]);
        newPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });

        canvas.width = 0;
        canvas.height = 0;
        continue;
      }

      const { left, top, width, height, canvasWidth, canvasHeight } = cropData;

      // Get the page
      const page = await pdf.getPage(pageNum);

      // Get original page dimensions
      const originalViewport = page.getViewport({ scale: 1.0 });
      const pageWidth = originalViewport.width;
      const pageHeight = originalViewport.height;

      // Calculate scale ratios between canvas (preview) and actual PDF page
      const scaleX = pageWidth / canvasWidth;
      const scaleY = pageHeight / canvasHeight;

      // Calculate crop area in PDF coordinates
      const pdfCropLeft = left * scaleX;
      const pdfCropTop = top * scaleY;
      const pdfCropWidth = width * scaleX;
      const pdfCropHeight = height * scaleY;

      // Render at higher resolution for quality
      const renderScale = 3.0;
      const viewport = page.getViewport({ scale: renderScale });

      // Create canvas for full page render
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Set white background
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Render the full page
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Calculate crop coordinates at render scale
      const scaledCropLeft = pdfCropLeft * renderScale;
      const scaledCropTop = pdfCropTop * renderScale;
      const scaledCropWidth = pdfCropWidth * renderScale;
      const scaledCropHeight = pdfCropHeight * renderScale;

      // Create a new canvas for the cropped area
      const croppedCanvas = document.createElement('canvas');
      const croppedContext = croppedCanvas.getContext('2d');
      croppedCanvas.width = scaledCropWidth;
      croppedCanvas.height = scaledCropHeight;

      // Set white background for cropped canvas
      croppedContext.fillStyle = 'white';
      croppedContext.fillRect(0, 0, croppedCanvas.width, croppedCanvas.height);

      // Draw only the cropped portion
      croppedContext.drawImage(
        canvas,
        scaledCropLeft, scaledCropTop, scaledCropWidth, scaledCropHeight,  // Source rectangle
        0, 0, scaledCropWidth, scaledCropHeight  // Destination rectangle
      );

      // Convert cropped canvas to PNG
      const croppedImageDataUrl = croppedCanvas.toDataURL('image/png', 1.0);
      const croppedPngImage = await newPdfDoc.embedPng(croppedImageDataUrl);

      // Add new page with cropped dimensions (in PDF points)
      const newPage = newPdfDoc.addPage([pdfCropWidth, pdfCropHeight]);

      // Draw the cropped image
      newPage.drawImage(croppedPngImage, {
        x: 0,
        y: 0,
        width: pdfCropWidth,
        height: pdfCropHeight,
      });

      // Clean up canvases
      canvas.width = 0;
      canvas.height = 0;
      croppedCanvas.width = 0;
      croppedCanvas.height = 0;
    }

    // Save the new PDF
    const pdfBytes = await newPdfDoc.save();

    // Clean up
    await pdf.destroy();

    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (err) {
    console.error("cropPDF failed:", err);
    throw err;
  }
}

const getPageDimensions = (pageSize, orientation) => {
  // Dimensions in points (1 point = 1/72 inch)
  const sizes = {
    a4: [595.28, 841.89], // A4 in points
    letter: [612, 792],    // Letter in points
    legal: [612, 1008],    // Legal in points
    a3: [841.89, 1190.55], // A3 in points
    a5: [420.94, 595.28]   // A5 in points
  };

  let [width, height] = sizes[pageSize] || sizes.a4;

  if (orientation === 'landscape') {
    [width, height] = [height, width];
  }

  return { width, height };
};

const convertToJPEG = async (imageBlob) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image on canvas
        ctx.drawImage(img, 0, 0);

        // Convert to JPEG
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image to JPEG'));
            return;
          }
          resolve(blob);
        }, 'image/jpeg', 0.92);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for conversion'));
    };

    img.src = URL.createObjectURL(imageBlob);
  });
};

export const convertImageToPDF = async (imageFiles, options = {}, fileTypeName) => {
  try {
    const {
      pageSize = 'a4',
      orientation = 'portrait',
      margin = 20
    } = options;

    const pdfDoc = await PDFDocument.create();

    for (const imageFile of imageFiles) {
      // Convert image file to array buffer
      const arrayBuffer = await imageFile.arrayBuffer();

      // Embed the image in the PDF
      let image;
      const mimeType = imageFile.type;

      try {
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (mimeType === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else if (mimeType === 'image/webp' || 'image/gif' || 'image/bmp' || 'image/avif') {
          const blob = new Blob([arrayBuffer], { type: mimeType });
          const jpegBlob = await convertToJPEG(blob);
          const jpegArrayBuffer = await jpegBlob.arrayBuffer();
          image = await pdfDoc.embedJpg(jpegArrayBuffer);
        } else {
          throw new Error(`Unsupported image format: ${mimeType}`);
        }
      } catch (embedError) {
        console.error('Failed to embed image:', embedError);
        throw new Error(`Failed to process image ${imageFile.name}: ${embedError.message}`);
      }

      // Get page dimensions based on selected size and orientation
      const { width, height } = getPageDimensions(pageSize, orientation);

      // Calculate image dimensions to fit page with margins
      const maxWidth = width - (margin * 2);
      const maxHeight = height - (margin * 2);

      let imageWidth = image.width;
      let imageHeight = image.height;

      // Scale image to fit within page margins while maintaining aspect ratio
      const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
      imageWidth *= scale;
      imageHeight *= scale;

      // Center image on page
      const x = (width - imageWidth) / 2;
      const y = (height - imageHeight) / 2;

      // Add page and draw image
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(image, {
        x,
        y,
        width: imageWidth,
        height: imageHeight,
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error(`${fileTypeName} to PDF conversion error:`, error);
    throw new Error(`Failed to convert ${fileTypeName} to PDF: ${error.message}`);
  }
};

export const convertPDFToImage = async (file, options = {}, imageFormat, password = null) => {
  try {
    const {
      scale = 2.0,
      pageNumbers = 'all',
      quality = 1.0
    } = options;

    const arrayBuffer = await file.arrayBuffer();
    const fileId = `${file.name}-${file.size}`;

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password || getPDFPassword(fileId),
      worker: null
    }).promise;

    const totalPages = pdf.numPages;

    // Determine which pages to convert
    let pagesToConvert = [];
    if (pageNumbers === 'all') {
      pagesToConvert = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (Array.isArray(pageNumbers)) {
      pagesToConvert = pageNumbers.filter(page => page >= 1 && page <= totalPages);
    } else {
      throw new Error('Invalid page numbers specified');
    }

    if (pagesToConvert.length === 0) {
      throw new Error('No valid pages to convert');
    }

    const imageBlobs = [];

    for (const pageNumber of pagesToConvert) {
      try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Set white background
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Convert canvas to image blob
        const imageBlob = await new Promise((resolve) => {
          canvas.toBlob(resolve, `image/${imageFormat === "PNG" ? "png" : "jpeg"}`, quality);
        });

        imageBlobs.push({
          pageNumber,
          blob: imageBlob,
          width: viewport.width,
          height: viewport.height,
          fileName: `${file.name.replace('.pdf', '')}-page-${pageNumber}.${imageFormat === "PNG" ? "png" : "jpeg"}`
        });

        // Clean up
        canvas.width = 0;
        canvas.height = 0;
      } catch (pageError) {
        console.error(`Failed to convert page ${pageNumber}:`, pageError);
        throw new Error(`Failed to convert page ${pageNumber}: ${pageError.message}`);
      }
    }

    // Clean up PDF document
    await pdf.destroy();

    return imageBlobs;
  } catch (error) {
    console.error('PDF to PNG conversion error:', error);
    throw new Error(`Failed to convert PDF to PNG: ${error.message}`);
  }
};

export const applyPageEdits = async (file, edits = [], password = null) => {
  try {
    if (!file || !edits?.length) throw new Error("Missing PDF or crop data");

    if (!edits || !Array.isArray(edits) || edits.length === 0) {
      throw new Error('No edits provided');
    }

    const fileId = `${file.name}-${file.size}`;
    const { pdfDoc, pdfjsDoc, encrypted } = await loadPDFDocument(file, fileId, password);

    if (encrypted && pdfjsDoc) {
      const convertedDoc = await convertPdfJsToPdfLib(pdfjsDoc);
      const totalPages = convertedDoc.getPageCount();

      for (const e of edits) {
        if (
          typeof e.sourcePage !== 'number' ||
          e.sourcePage < 1 ||
          e.sourcePage > totalPages ||
          ![0, 90, 180, 270].includes(e.rotation || 0)
        ) {
          throw new Error(`Invalid edit entry: ${JSON.stringify(e)}`);
        }
      }

      const outPdf = await PDFDocument.create();

      for (let i = 0; i < edits.length; i++) {
        const srcIndex = edits[i].sourcePage - 1;
        const [copied] = await outPdf.copyPages(convertedDoc, [srcIndex]);
        outPdf.addPage(copied);

        const rotation = edits[i].rotation || 0;
        if (rotation !== 0) {
          const page = outPdf.getPage(outPdf.getPageCount() - 1);
          page.setRotation(degrees(rotation % 360));
        }
      }

      const outBytes = await outPdf.save();
      await pdfjsDoc.destroy();
      return new Blob([outBytes], { type: 'application/pdf' });
    } else if (pdfDoc) {
      const totalPages = pdfDoc.getPageCount();

      for (const e of edits) {
        if (
          typeof e.sourcePage !== 'number' ||
          e.sourcePage < 1 ||
          e.sourcePage > totalPages ||
          ![0, 90, 180, 270].includes(e.rotation || 0)
        ) {
          throw new Error(`Invalid edit entry: ${JSON.stringify(e)}`);
        }
      }

      const outPdf = await PDFDocument.create();

      for (let i = 0; i < edits.length; i++) {
        const srcIndex = edits[i].sourcePage - 1;
        const [copied] = await outPdf.copyPages(pdfDoc, [srcIndex]);
        outPdf.addPage(copied);

        const rotation = edits[i].rotation || 0;
        if (rotation !== 0) {
          const page = outPdf.getPage(outPdf.getPageCount() - 1);
          page.setRotation(degrees(rotation % 360));
        }
      }

      const outBytes = await outPdf.save();
      return new Blob([outBytes], { type: 'application/pdf' });
    } else {
      throw new Error('Failed to load PDF for editing');
    }
  } catch (error) {
    throw new Error(`Failed to apply page edits: ${error.message}`);
  }
};

export const extractTextFromPDF = async (file, password = null) => {
  const arrayBuffer = await file.arrayBuffer();
  const fileId = `${file.name}-${file.size}`;

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    password: password || getPDFPassword(fileId),
    worker: null
  }).promise;

  const numPages = pdf.numPages;
  let combinedText = "";

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((item) => item.str);
    combinedText += strings.join(" ") + "\n";
  }

  let info = {};
  let creationDate = null;
  let modDate = null;

  try {
    const meta = await pdf.getMetadata();
    info = meta?.info || {};
    creationDate = info.CreationDate || meta?.metadata?.get("xmp:CreateDate") || null;
    modDate = info.ModDate || meta?.metadata?.get("xmp:ModifyDate") || null;
  } catch (e) {
    // metadata optional
  }

  await pdf.destroy();

  return {
    text: combinedText,
    numPages,
    info,
    creationDate,
    modDate
  }
};

export const extractEmbeddedImagesFromPDF = async (file, password = null) => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    password: password,
    stopAtErrors: false, // Prevents total failure on one bad image
  });

  const pdf = await loadingTask.promise;
  const extractedImages = [];
  let imageCounter = 1;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);

    // 1. Force PDF.js to parse the page content fully to populate caches
    const operatorList = await page.getOperatorList();

    // 2. Iterate through operators to find image keys
    for (let j = 0; j < operatorList.fnArray.length; j++) {
      const fn = operatorList.fnArray[j];

      if (
        fn === pdfjsLib.OPS.paintImageXObject ||
        fn === pdfjsLib.OPS.paintInlineImageXObject ||
        fn === pdfjsLib.OPS.paintImageMaskXObject // Added for logos/stamps
      ) {
        const imageKey = operatorList.argsArray[j][0];

        try {
          // 3. Try to get image from Page-specific objects first, then Common objects
          let image = null;

          // Use a wrapped promise to handle the callback-based .get()
          image = await new Promise((resolve) => {
            // First check page-specific objects
            page.objs.get(imageKey, (img) => {
              if (img) resolve(img);
              else {
                // If not found, check common objects (shared images/logos)
                page.commonObjs.get(imageKey, (commonImg) => {
                  resolve(commonImg);
                });
              }
            });
          });

          if (image && (image.data || image.bitmap)) {
            const blob = await convertToImageBlob(image);
            extractedImages.push({
              blob,
              fileName: `img_p${i}_${imageCounter++}.png`,
              pageNumber: i,
            });
          }
        } catch (err) {
          console.warn(`Skipping image key ${imageKey}:`, err);
        }
      }
    }
  }

  return extractedImages;
};

async function convertToImageBlob(image) {
  // Handle different data formats (Uint8ClampedArray vs ImageBitmap)
  const width = image.width;
  const height = image.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (image.bitmap) {
    // Some newer PDF.js versions return an ImageBitmap directly
    ctx.drawImage(image.bitmap, 0, 0);
  } else {
    const imageData = ctx.createImageData(width, height);
    const rawData = image.data;

    // Determine if data is RGB or RGBA
    // If RGB (3 bytes per pixel), convert to RGBA
    if (rawData.length === width * height * 3) {
      let j = 0;
      for (let i = 0; i < rawData.length; i += 3) {
        imageData.data[j++] = rawData[i];     // R
        imageData.data[j++] = rawData[i + 1]; // G
        imageData.data[j++] = rawData[i + 2]; // B
        imageData.data[j++] = 255;            // A
      }
    } else {
      // If already RGBA (4 bytes per pixel) or grayscale, copy directly
      imageData.data.set(rawData);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}