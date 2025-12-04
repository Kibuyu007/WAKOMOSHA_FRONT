import { useEffect, useState } from "react";
import axios from "axios";

// Icons
import { 
  FaSearch, 
  FaEdit, 
  FaCalendarAlt,
  FaFilter,
  FaPlus,
  FaSync,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { BsToggleOff, BsToggleOn } from "react-icons/bs";
import { 
  IoIosCheckmarkCircle,
  IoIosCloseCircle
} from "react-icons/io";
import { 
  FiMoreVertical,
  FiEye,
  FiTrash2,
  FiDownload
} from "react-icons/fi";

// API
import BASE_URL from "../../../../Utils/config.js";

// Modals
import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";
import Loading from "../../../../Components/Loading.jsx";

const AllEvents = () => {
  // State
  const [events, setEvents] = useState([]);
  const [showError, setShowError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 8;

  // Modals
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [modifiedEvent, setModifiedEvent] = useState(null);

  // Dropdown menu
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Fetch events from backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/events/getEvents`);
      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data.data);
      setIsLoading(false);
      setShowError("");
    } catch (error) {
      setShowError(
        error.message || "Failed to fetch events. Contact System Administrator."
      );
      setIsLoading(false);
      console.error(error);
    }
  };

  // Toggle event status (open/closed)
  const toggleEventStatus = async (eventId, currentStatus) => {
    try {
      if (currentStatus === "closed") {
        const confirm = window.confirm("Are you sure you want to reopen this event?");
        if (!confirm) return;
      } else {
        const confirm = window.confirm("Are you sure you want to close this event?");
        if (!confirm) return;
      }

      const response = await axios.put(
        `${BASE_URL}/api/events/closeEvent/${eventId}`
      );

      if (response.status === 200) {
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event._id === eventId ? { ...event, status: currentStatus === "open" ? "closed" : "open" } : event
          )
        );
        toast.success(`Event ${currentStatus === "open" ? "closed" : "reopened"} successfully!`);
      }
    } catch (error) {
      console.error("Error updating event status:", error);
      toast.error("Failed to update event status");
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await axios.delete(`${BASE_URL}/api/events/deleteEvent/${eventId}`);
      if (response.status === 200) {
        setEvents(events.filter(event => event._id !== eventId));
        toast.success("Event deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter & search
  const filteredEvents = events.filter(
    (event) =>
      (filterStatus === "All" || event.status === filterStatus) &&
      (event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(
    indexOfFirstEvent,
    indexOfLastEvent
  );

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Export to CSV
  const exportToCSV = () => {
    const data = filteredEvents.map(event => ({
      'Event Name': event.name,
      'Description': event.description,
      'Status': event.status,
      'Target Amount': event.minAmount ? `${event.minAmount.toLocaleString()} Tsh` : 'N/A',
      'Start Date': event.startDate || 'N/A',
      'End Date': event.endDate || 'N/A',
      'Participants': event.participants || 0,
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("CSV file downloaded!");
  };

  return (
    <div className="w-full h-[85vh] overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm">
              <FaCalendarAlt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Events Management</h1>
              <p className="text-gray-600 text-sm">Create and manage all events</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              <span className="text-sm font-medium">Export CSV</span>
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaSync className="w-4 h-4" />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <button
              onClick={() => setShowModalAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-sm"
            >
              <FaPlus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          {/* Status Filters */}
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <div className="flex flex-wrap gap-2">
              {["All", "open", "closed"].map((status) => (
                <button
                  key={status}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-300"
                  }`}
                  onClick={() => {
                    setFilterStatus(status);
                    setCurrentPage(1);
                  }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <div className="flex items-center bg-white border border-gray-300 rounded-lg px-4 py-2.5">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search events by name or description..."
                className="bg-transparent outline-none flex-1 text-gray-800 placeholder-gray-500"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{events.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaCalendarAlt className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Events</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {events.filter(e => e.status === "open").length}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <IoIosCheckmarkCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed Events</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {events.filter(e => e.status === "closed").length}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <IoIosCloseCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Page</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {currentPage} / {totalPages || 1}
                </p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <span className="text-sm font-bold text-indigo-600">{eventsPerPage}/page</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-2 sm:mb-0">
            Showing <span className="font-bold text-gray-800">{indexOfFirstEvent + 1}</span> to{" "}
            <span className="font-bold text-gray-800">
              {Math.min(indexOfLastEvent, filteredEvents.length)}
            </span> of{" "}
            <span className="font-bold text-gray-800">{filteredEvents.length}</span> events
          </div>
          
          {/* Pagination Controls - Top */}
          {filteredEvents.length > 0 && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                <FaChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum, index) => (
                  <button
                    key={index}
                    onClick={() => typeof pageNum === 'number' ? setCurrentPage(pageNum) : null}
                    className={`px-3 py-2 min-w-[40px] text-sm font-medium rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                        : pageNum === '...'
                        ? "text-gray-400 cursor-default"
                        : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                    disabled={pageNum === '...'}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                Next
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {showError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <IoIosCloseCircle className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <p className="font-medium text-red-800">Error Loading Events</p>
                <p className="text-sm text-red-600 mt-1">{showError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        <Loading isLoading={isLoading} message="Loading Events..." />

        {/* Event Table */}
        {!isLoading && filteredEvents.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Event Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Target Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentEvents.map((event) => (
                    <tr 
                      key={event._id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{event.name}</div>
                         
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {event.description || "No description provided"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {event.minAmount ? `${event.minAmount.toLocaleString()} Tsh` : "Not set"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              event.status === "open"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                            }`}
                          >
                            {event.status === "open" ? (
                              <>
                                <IoIosCheckmarkCircle className="w-3 h-3 mr-1" />
                                Open
                              </>
                            ) : (
                              <>
                                <IoIosCloseCircle className="w-3 h-3 mr-1" />
                                Closed
                              </>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleEventStatus(event._id, event.status)}
                            className={`p-2 rounded-lg transition-colors ${
                              event.status === "open"
                                ? "text-gray-600 hover:bg-red-50 hover:text-red-600 border border-red-200"
                                : "text-gray-600 hover:bg-green-50 hover:text-green-600 border border-green-200"
                            }`}
                            title={event.status === "open" ? "Close Event" : "Reopen Event"}
                          >
                            {event.status === "open" ? (
                              <BsToggleOn className="w-5 h-5" />
                            ) : (
                              <BsToggleOff className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowModalEdit(true);
                              setModifiedEvent(event);
                            }}
                            className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors border border-blue-200"
                            title="Edit Event"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setActiveDropdown(activeDropdown === event._id ? null : event._id)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                            >
                              <FiMoreVertical className="w-4 h-4" />
                            </button>
                            {activeDropdown === event._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(event._id);
                                    toast.success("Event ID copied to clipboard!");
                                    setActiveDropdown(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Copy Event ID
                                </button>
                                <button
                                  onClick={() => {
                                    window.open(`/events/${event._id}`, '_blank');
                                    setActiveDropdown(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <FiEye className="w-4 h-4" />
                                  View Details
                                </button>
                                <hr className="border-gray-200" />
                                <button
                                  onClick={() => {
                                    handleDeleteEvent(event._id);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                  Delete Event
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination - Bottom */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Page <span className="font-bold">{currentPage}</span> of{" "}
                    <span className="font-bold">{totalPages}</span> •{" "}
                    <span className="font-medium">{filteredEvents.length}</span> total events
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? "text-gray-400 cursor-not-allowed border border-gray-300"
                          : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                      }`}
                    >
                      <FaChevronLeft className="w-3 h-3" />
                      Previous
                    </button>
                    
                    <div className="flex items-center">
                      {getPageNumbers().map((pageNum, index) => (
                        <button
                          key={index}
                          onClick={() => typeof pageNum === 'number' ? setCurrentPage(pageNum) : null}
                          className={`px-3 py-2 min-w-[40px] text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                              : pageNum === '...'
                              ? "text-gray-400 cursor-default"
                              : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                          } ${index > 0 ? 'border-l-0' : ''}`}
                          disabled={pageNum === '...'}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? "text-gray-400 cursor-not-allowed border border-gray-300"
                          : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                      }`}
                    >
                      Next
                      <FaChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span>Go to page:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page);
                        }
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredEvents.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="text-4xl mb-4 text-gray-300">📅</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchQuery || filterStatus !== "All" ? "No events found" : "No events created yet"}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery || filterStatus !== "All" 
                ? "Try adjusting your search or filter to find what you're looking for."
                : "Get started by creating your first event to organize contributions."}
            </p>
            <button
              onClick={() => setShowModalAdd(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              Create Your First Event
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddEventModal
        showModal={showModalAdd}
        setShowModal={setShowModalAdd}
        onEventAdded={() => {
          fetchData();
          toast.success("Event created successfully!");
        }}
      />

      <EditEventModal
        showModal={showModalEdit}
        setShowModal={setShowModalEdit}
        onEventUpdated={() => {
          fetchData();
          toast.success("Event updated successfully!");
        }}
        event={modifiedEvent}
      />
    </div>
  );
};

// Add toast notification function
const toast = {
  success: (message) => {
    // Implement your toast notification here
    console.log("Success:", message);
  },
  error: (message) => {
    // Implement your toast notification here
    console.log("Error:", message);
  }
};

export default AllEvents;