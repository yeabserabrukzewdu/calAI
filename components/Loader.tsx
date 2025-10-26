
import type React from 'react';

const Loader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );
};

export default Loader;
