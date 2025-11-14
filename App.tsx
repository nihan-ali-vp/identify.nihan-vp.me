import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DetectedShape } from './types';

// Helper Icon components defined outside the main component
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const ProcessingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-400"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-400" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-400" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calculateRegularity = (approx: any): number => {
    if (approx.rows < 3) return 0;

    const points: {x: number, y: number}[] = [];
    for (let i = 0; i < approx.rows; i++) {
        points.push({ x: approx.data32S[i * 2], y: approx.data32S[i * 2 + 1] });
    }

    const sideLengths: number[] = [];
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length]; // Wrap around for the last side
        const sideLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        sideLengths.push(sideLength);
    }

    if (sideLengths.length === 0) return 0;

    const sum = sideLengths.reduce((a, b) => a + b, 0);
    const mean = sum / sideLengths.length;

    if (mean === 0) return 0;

    const stdDev = Math.sqrt(
        sideLengths.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / sideLengths.length
    );
    
    const confidence = Math.max(0, 1 - (stdDev / mean));
    return confidence;
};


const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [detectedShapes, setDetectedShapes] = useState<DetectedShape[]>([]);
  const [isCvLoaded, setIsCvLoaded] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkCv = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).cv) {
        setIsCvLoaded(true);
      } else {
        setTimeout(checkCv, 100);
      }
    };
    checkCv();
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setImageSrc(url);
      setDetectedShapes([]);
      setError(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const identifyShape = (approx: any, cnt: any, isConvex: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cv = (window as any).cv;
    const corners = approx.rows;
    const area = cv.contourArea(cnt);
    const perimeter = cv.arcLength(cnt, true);
    
    let confidence = calculateRegularity(approx);

    if (!isConvex && corners > 4) {
      confidence *= 0.8; // Penalize non-convex shapes
    }

    // More robust circle detection based on circularity and vertex count
    if (perimeter > 0) {
      const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
      if (corners > 8 && circularity > 0.9) {
        return { name: 'Circle', corners, confidence: circularity };
      }
    }

    switch (corners) {
      case 3:
        return { name: 'Triangle', corners, confidence };
      case 4: {
        // Use minAreaRect for rotation-invariant aspect ratio calculation
        const rotatedRect = cv.minAreaRect(cnt);
        const size = rotatedRect.size;
        const aspectRatio = Math.max(size.width, size.height) / Math.min(size.width, size.height);
        
        if (aspectRatio >= 0.95 && aspectRatio <= 1.1) {
          const aspectRatioConfidence = 1.0 - (aspectRatio - 1.0) * 10;
          return { name: 'Square', corners, confidence: (confidence + aspectRatioConfidence) / 2 };
        }
        return { name: 'Rectangle', corners, confidence };
      }
      case 5:
        return { name: 'Pentagon', corners, confidence };
      case 6:
        return { name: 'Hexagon', corners, confidence };
      case 7:
        return { name: 'Heptagon', corners, confidence };
      case 8:
        return { name: 'Octagon', corners, confidence };
      case 9:
        return { name: 'Nonagon', corners, confidence };
      case 10:
        return { name: 'Decagon', corners, confidence };
      case 11:
          return { name: 'Hendecagon', corners, confidence };
      case 12:
          return { name: 'Dodecagon', corners, confidence };
      default:
        if (isConvex && corners > 8) {
            return { name: 'Ellipse', corners, confidence };
        }
        return { name: 'Unknown', corners, confidence: 0.1 };
    }
  };

  const detectShapes = useCallback(() => {
    if (!imageRef.current || !canvasRef.current || !isCvLoaded || !imageSrc) {
      setError('Required resources are not loaded or no image is selected.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDetectedShapes([]);
    
    setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cv = (window as any).cv;
        let src: any, gray: any, blurred: any, edges: any, contours: any, hierarchy: any, dst: any;

        try {
            const imgElement = imageRef.current!;
            const canvasElement = canvasRef.current!;

            canvasElement.width = imgElement.naturalWidth;
            canvasElement.height = imgElement.naturalHeight;

            src = cv.imread(imgElement);
            dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
            gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
            
            blurred = new cv.Mat();
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

            edges = new cv.Mat();
            cv.Canny(blurred, edges, 75, 175, 3);
            
            contours = new cv.MatVector();
            hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            const newShapes: DetectedShape[] = [];

            for (let i = 0; i < contours.size(); ++i) {
                const cnt = contours.get(i);
                const area = cv.contourArea(cnt, false);

                if (area < 100) {
                    cnt.delete();
                    continue;
                }

                const peri = cv.arcLength(cnt, true);
                const approx = new cv.Mat();
                cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
                
                const isConvex = cv.isContourConvex(approx);
                const { name, corners, confidence } = identifyShape(approx, cnt, isConvex);
                
                const moments = cv.moments(cnt, false);
                const cX = Math.round(moments.m10 / moments.m00);
                const cY = Math.round(moments.m01 / moments.m00);
                
                newShapes.push({ id: `shape-${i}`, name, corners, area, center: { x: cX, y: cY }, confidence });
                
                const color = new cv.Scalar(Math.random() * 255, Math.random() * 255, Math.random() * 255, 255);
                cv.drawContours(dst, contours, i, color, 2, cv.LINE_8, hierarchy, 0);
                const label = `${name} (${(confidence * 100).toFixed(0)}%)`;
                cv.putText(dst, label, {x: cX - 40, y: cY}, cv.FONT_HERSHEY_SIMPLEX, 0.5, color, 1.5);

                approx.delete();
                cnt.delete();
            }

            cv.imshow(canvasElement, dst);
            setDetectedShapes(newShapes);

        } catch (err) {
            console.error(err);
            setError('An error occurred during shape detection.');
        } finally {
            if (src) src.delete();
            if (gray) gray.delete();
            if (blurred) blurred.delete();
            if (edges) edges.delete();
            if (contours) contours.delete();
            if (hierarchy) hierarchy.delete();
            if (dst) dst.delete();
            setIsProcessing(false);
        }
    }, 100);
  }, [isCvLoaded, imageSrc]);

  useEffect(() => {
    if (imageSrc && isCvLoaded) {
      detectShapes();
    }
  }, [imageSrc, isCvLoaded, detectShapes]);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            Shape Identifier
          </h1>
          <p className="mt-2 text-lg text-gray-400">Upload an image to detect geometric shapes in real-time.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gray-800/50 rounded-lg p-6 shadow-2xl border border-gray-700 h-full flex flex-col">
              <h2 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2">Controls</h2>
              
              <div className="mb-6">
                  <label htmlFor="file-upload" className="w-full cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg inline-flex items-center justify-center transition-colors">
                      <UploadIcon className="w-6 h-6 mr-2" />
                      <span>{imageSrc ? 'Change Image' : 'Select Image'}</span>
                  </label>
                  <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
              
              <button
                  onClick={detectShapes}
                  disabled={!imageSrc || !isCvLoaded || isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                  {isProcessing ? <ProcessingSpinner /> : 'Detect Shapes'}
              </button>

              {!isCvLoaded && (
                  <div className="mt-4 text-center text-yellow-400 animate-pulse">Loading OpenCV Library...</div>
              )}
              {error && (
                  <div className="mt-4 text-center text-red-400">{error}</div>
              )}

              <div className="mt-8 flex-grow">
                  <h3 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">Results</h3>
                  <div className="overflow-y-auto max-h-96 pr-2">
                      {detectedShapes.length > 0 ? (
                          <ul className="space-y-3">
                              {detectedShapes.sort((a, b) => b.confidence - a.confidence).map(shape => (
                                  <li key={shape.id} className="bg-gray-700/50 p-3 rounded-md shadow-md text-sm">
                                      <div className="flex justify-between items-center">
                                        <p className="font-semibold text-blue-300">{shape.name}</p>
                                        <p className="text-xs font-mono text-teal-300">{(shape.confidence * 100).toFixed(1)}%</p>
                                      </div>
                                      <p className="text-gray-400 mt-1">Corners: {shape.corners}, Area: {Math.round(shape.area)}px²</p>
                                  </li>
                              ))}
                          </ul>
                      ) : (
                          <div className="text-center text-gray-500 pt-8">
                              <p>No shapes detected yet.</p>
                              <p>Upload an image and click "Detect Shapes".</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          <div className="lg:col-span-2 bg-gray-800/50 rounded-lg p-6 shadow-2xl border border-gray-700 flex items-center justify-center min-h-[60vh]">
              <div className="w-full h-full relative">
                  {!imageSrc && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xl border-2 border-dashed border-gray-600 rounded-lg">
                          Image preview will appear here
                      </div>
                  )}
                  <img
                      ref={imageRef}
                      src={imageSrc || ''}
                      alt="Uploaded"
                      className={`w-full h-auto max-h-[75vh] object-contain transition-opacity duration-300 ${imageSrc ? 'opacity-100' : 'opacity-0'}`}
                      style={{ visibility: imageSrc ? 'visible' : 'hidden' }}
                  />
                  <canvas 
                      ref={canvasRef} 
                      className="absolute top-0 left-0 w-full h-full object-contain"
                  ></canvas>
              </div>
          </div>
        </main>
        <footer className="text-center text-gray-500 text-sm mt-12">
          &copy; {new Date().getFullYear()}  Shape Identifier. All rights reserved.
          <p>Developed by <a href="https://nihan-vp.me" className="text-gray-400 font-normal transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-400 hover:to-teal-300">Nihan</a></p>
        </footer>
      </div>
    </div>
  );
};

export default App;