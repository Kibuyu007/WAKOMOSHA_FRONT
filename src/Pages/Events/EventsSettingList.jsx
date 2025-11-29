

const EventsSettingList = ({title,selectedOperation,handleSelect,operations}) => {
  return (
     <div className="mb-8 last:mb-0">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pl-2 border-l-2 border-blue-400">
        {title}
      </h3>
      
      <div className="space-y-2">
        {operations.map((operation, idx) => {
          // Check if setting is a group
          if (typeof operation === "object" && operation.group && operation.items) {
            return (
              <div key={idx} className="space-y-2">
                <h4 className="font-semibold text-xs text-gray-400 uppercase tracking-wider px-2">
                  {operation.group}
                </h4>
                <div className="space-y-1">
                  {operation.items.map((subItem, subIdx) => (
                    <button
                      key={subIdx}
                      onClick={() => handleSelect(subItem)}
                      className={`w-full flex items-center cursor-pointer px-4 py-3 rounded-full transition-all duration-300 transform hover:translate-x-2 border ${
                        selectedOperation === subItem
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-md"
                          : " border-gray-200 hover:bg-white/30 hover:border-gray-300"
                      }`}
                    >
                      <svg 
                        className={`w-4 h-4 mr-3 transition-all duration-300 ${
                          selectedOperation === subItem ? "text-blue-500 scale-110" : "text-gray-400"
                        }`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                      </svg>
                      <span className={`font-medium ${
                        selectedOperation === subItem ? "text-gray-800" : "text-gray-600"
                      }`}>
                        {subItem}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          } else {
            // Simple flat item
            return (
              <button
                key={idx}
                onClick={() => handleSelect(operation)}
                className={`w-full flex items-center cursor-pointer px-4 py-3 rounded-full transition-all duration-300 transform hover:translate-x-2 border ${
                  selectedOperation === operation
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-md"
                    : " border-gray-200 hover:bg-white/30 hover:border-gray-300"
                }`}
              >
                <svg 
                  className={`w-4 h-4 mr-3 transition-all duration-300 ${
                    selectedOperation === operation ? "text-blue-500 scale-110" : "text-gray-400"
                  }`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                </svg>
                <span className={`font-medium ${
                  selectedOperation === operation ? "text-gray-800" : "text-gray-600"
                }`}>
                  {operation}
                </span>
              </button>
            );
          }
        })}
      </div>
    </div>
  )
}

export default EventsSettingList