const Loading = ({ isLoading, message = "Loading..." }) => {
  if (!isLoading) return null;

  return (
    <div className="w-full bg-white overflow-hidden shadow-sm">
      {/* Animated Gradient Bar */}
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]"></div>
      </div>
      
      {/* Loading Text */}
      <div className="px-4 py-2 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
        </div>
        <span className="ml-3 text-sm font-medium text-gray-600">{message}</span>
      </div>
    </div>
  );
};

export default Loading;