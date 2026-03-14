import { getFileSize } from "./sharedUtils";
import { 
  validatePDF,
  validateImageForPDF,
  isPDFEncrypted,
  setPDFPassword,
  getPDFPassword,
  clearPDFPassword, 
  getPDFInfo, 
  loadPDFDocument, 
  setMetadata, 
  convertPdfJsToPdfLib,
  testPDFPassword, 
  getPageCount, 
  generatePDFPreview, 
  downloadPDF,
  downloadPDFsAsZip
} from "./commonPdfUtils";
import {
  mergePDFs,
  splitPDF,
  deletePDFPages,
  extractPDFPages,
  rearrangePDFPages,
  cropPDF,
  convertImageToPDF,
  convertPDFToImage,
  applyPageEdits,
  extractTextFromPDF,
  extractEmbeddedImagesFromPDF
} from "./pdfToolsUtils";
import {
  validateImage,
  fileToDataURL,
  getMimeType,
  getExtension,
  generateImagePreview,
  downloadImage,
  downloadImagesAsZip
} from "./commonImageUtils";
import {
  convertBetweenImages,
  resizeImageOnCanvas,
  rotateImageOnCanvas,
  compressImageClient
} from "./imageToolsUtils"


export {
  getFileSize,
  validatePDF,
  validateImageForPDF,
  isPDFEncrypted,
  setPDFPassword,
  getPDFPassword,
  clearPDFPassword,
  getPDFInfo,
  loadPDFDocument,
  setMetadata,
  convertPdfJsToPdfLib,
  testPDFPassword,
  getPageCount,
  generatePDFPreview,
  downloadPDF,
  downloadPDFsAsZip,
  mergePDFs,
  splitPDF,
  deletePDFPages,
  extractPDFPages,
  rearrangePDFPages,
  cropPDF,
  convertImageToPDF,
  convertPDFToImage,
  applyPageEdits,
  extractTextFromPDF,
  extractEmbeddedImagesFromPDF,

  validateImage,
  fileToDataURL,
  getMimeType,
  getExtension,
  generateImagePreview,
  downloadImage,
  downloadImagesAsZip,
  convertBetweenImages,
  resizeImageOnCanvas,
  rotateImageOnCanvas,
  compressImageClient
}