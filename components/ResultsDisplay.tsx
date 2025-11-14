
import React from 'react';
import type { Shape } from '../types';
import Spinner from './Spinner';

interface ResultsDisplayProps {
  shapes: Shape[] | null;
  isLoading: boolean;
  error: string | null;
  hasImage: boolean;
}

const ShapeCard: React.FC<{ shape: Shape }> = ({ shape }) => (
  <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between gap-4 transition-transform transform hover:scale-105 hover:bg-gray-700">
    <div className="flex flex-col">
      <span className="font-bold text-lg capitalize text-purple-300">{shape.shape}</span>
      <span className="text-sm text-gray-400 capitalize">{shape.color}</span>
    </div>
    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 shadow-lg"></div>
  </div>
);

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ shapes, isLoading, error, hasImage }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner />
          <p className="mt-4 text-lg text-gray-400">AI is analyzing the image...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
          <p className="font-bold">An error occurred</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      );
    }

    if (shapes) {
      if (shapes.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-lg text-gray-400">No shapes were found in the image.</p>
          </div>
        );
      }
      return (
        <div className="space-y-3">
          {shapes.map((shape, index) => (
            <ShapeCard key={index} shape={shape} />
          ))}
        </div>
      );
    }

    if(hasImage) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-lg text-gray-400">Ready to identify shapes.</p>
                <p className="text-sm text-gray-500">Click the "Identify Shapes" button to start.</p>
            </div>
        );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-lg text-gray-400">Results will be displayed here.</p>
        <p className="text-sm text-gray-500">Upload an image to get started.</p>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-900/30 w-full h-full rounded-lg p-4 flex flex-col border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-300 border-b border-gray-700 pb-2">Analysis Results</h2>
      <div className="flex-grow overflow-y-auto pr-2">
        {renderContent()}
      </div>
    </div>
  );
};

export default ResultsDisplay;
