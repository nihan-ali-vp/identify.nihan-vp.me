import type { Shape } from '../types';
import { mapRgbToColorName } from '../utils/fileUtils';

// Wait for OpenCV to be ready
export function onOpenCvReady(callback: () => void) {
  const checkCv = () => {
    if (window.cv) {
      callback();
    } else {
      setTimeout(checkCv, 50);
    }
  };
  checkCv();
}

// Declare cv on window for TypeScript
declare global {
  interface Window {
    cv: any;
  }
}

export async function identifyShapesWithOpenCV(imageElement: HTMLImageElement): Promise<Shape[]> {
  return new Promise((resolve, reject) => {
    try {
      const cv = window.cv;
      if (!cv) {
          reject(new Error("OpenCV is not loaded yet."));
          return;
      }
      
      const src = cv.imread(imageElement);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      
      const blurred = new cv.Mat();
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

      const thresholded = new cv.Mat();
      cv.threshold(blurred, thresholded, 120, 255, cv.THRESH_BINARY);
      
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(thresholded, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

      const identifiedShapes: Shape[] = [];

      for (let i = 0; i < contours.size(); ++i) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt);
        
        if (area < 100) { // Filter out small noise
            cnt.delete();
            continue;
        }

        const perimeter = cv.arcLength(cnt, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.04 * perimeter, true);

        let shapeName = 'unknown';
        const vertices = approx.rows;

        if (vertices === 3) {
          shapeName = 'triangle';
        } else if (vertices === 4) {
          const { width, height } = cv.boundingRect(approx);
          const aspectRatio = width / parseFloat(height);
          shapeName = (aspectRatio >= 0.95 && aspectRatio <= 1.05) ? 'square' : 'rectangle';
        } else if (vertices === 5) {
          shapeName = 'pentagon';
        } else if (vertices === 6) {
          shapeName = 'hexagon';
        } else if (vertices > 6) {
          const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
          if (circularity > 0.85) {
              shapeName = 'circle';
          }
        }
        
        if(shapeName !== 'unknown') {
            const mask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
            const contourVec = new cv.MatVector();
            contourVec.push_back(cnt);
            cv.drawContours(mask, contourVec, -1, new cv.Scalar(255, 255, 255, 255), cv.FILLED);
            contourVec.delete();
            
            const meanColor = cv.mean(src, mask);
            mask.delete();
            
            const colorName = mapRgbToColorName(meanColor[0], meanColor[1], meanColor[2]);
            
            identifiedShapes.push({ shape: shapeName, color: colorName });
        }
        
        approx.delete();
        cnt.delete();
      }

      // Clean up OpenCV Mats
      src.delete();
      gray.delete();
      blurred.delete();
      thresholded.delete();
      contours.delete();
      hierarchy.delete();
      
      resolve(identifiedShapes);
    } catch (err) {
      console.error("OpenCV processing error:", err);
      reject(err instanceof Error ? err : new Error("An error occurred during image processing."));
    }
  });
}