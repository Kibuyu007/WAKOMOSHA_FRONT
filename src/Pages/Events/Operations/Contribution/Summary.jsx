import { useEffect, useState, useMemo } from "react";
import BASE_URL from "../../../../Utils/config";
import axios from "axios";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FiSearch, FiFilter, FiCalendar, FiUsers, FiCheckCircle, FiXCircle, FiDollarSign, FiClock } from "react-icons/fi";

const Summary = () => {
  const [summary, setSummary] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/contributions/eventsSummary`);
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to load summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  // Helper function to check if deadline has passed
  const isDeadlinePassed = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    const deadline = new Date(endDate);
    deadline.setHours(23, 59, 59, 999);
    return deadline < today;
  };

  // Helper function to check if deadline is within 3 days
  const isDeadlineNear = (endDate) => {
    if (!endDate) return false;
    if (isDeadlinePassed(endDate)) return false;
    
    const today = new Date();
    const deadline = new Date(endDate);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 3 && diffDays >= 0;
  };

  // FILTER + SEARCH
  const filteredSummary = useMemo(() => {
    return summary
      .filter((s) => {
        if (filter === "paid") return s.usersPaidCount > 0;
        if (filter === "unpaid") return s.usersPaidCount === 0;
        return true;
      })
      .filter((s) =>
        s.eventName.toLowerCase().includes(search.toLowerCase())
      );
  }, [summary, search, filter]);

  // PAGINATION CALCULATIONS
  const totalPages = Math.ceil(filteredSummary.length / PAGE_SIZE);
  const indexOfLastEvent = currentPage * PAGE_SIZE;
  const indexOfFirstEvent = indexOfLastEvent - PAGE_SIZE;
  const paginated = filteredSummary.slice(indexOfFirstEvent, indexOfLastEvent);

  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Calculate stats for active/overdue events
  const eventStats = useMemo(() => {
    const stats = {
      active: 0,
      upcoming: 0,
      overdue: 0,
      noDeadline: 0
    };
    
    filteredSummary.forEach(s => {
      if (!s.endDate) {
        stats.noDeadline++;
      } else if (isDeadlinePassed(s.endDate)) {
        stats.overdue++;
      } else if (isDeadlineNear(s.endDate)) {
        stats.upcoming++;
      } else {
        stats.active++;
      }
    });
    
    return stats;
  }, [filteredSummary]);

  return (
    <div className="w-full h-full p-4 md:p-6 bg-gray-50">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-blue-700">Events Contribution Summary</h1>
            <p className="text-gray-600 text-sm mt-1">Track all event contributions and payment status</p>
          </div>
          <div className="mt-2 md:mt-0">
            <div className="inline-flex items-center px-3 py-1.5 bg-white rounded-lg border border-gray-300 shadow-sm">
              <span className="text-xs text-gray-600">Showing:</span>
              <span className="ml-2 font-bold text-blue-600">{filteredSummary.length}</span>
              <span className="ml-1 text-xs text-gray-500">events</span>
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTER BAR */}
        <div className="bg-white rounded-lg p-3 mb-4 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <FiFilter className="text-gray-500 text-sm" />
                <span className="text-xs text-gray-700">Filter:</span>
              </div>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
              >
                <option value="all">All Events</option>
                <option value="paid">With Payments</option>
                <option value="unpaid">No Payments</option>
              </select>
            </div>
          </div>
        </div>

        {/* COMPACT STATUS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-md p-3 shadow-xs border border-gray-200 hover:shadow-sm transition-shadow duration-150">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Active</p>
                <p className="text-base font-bold text-blue-600">{eventStats.active}</p>
              </div>
              <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center">
                <FiCalendar className="text-blue-600 text-sm" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-md p-3 shadow-xs border border-gray-200 hover:shadow-sm transition-shadow duration-150">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Upcoming</p>
                <p className="text-base font-bold text-amber-600">{eventStats.upcoming}</p>
              </div>
              <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center">
                <FiClock className="text-amber-600 text-sm" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-md p-3 shadow-xs border border-gray-200 hover:shadow-sm transition-shadow duration-150">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Overdue</p>
                <p className="text-base font-bold text-red-600">{eventStats.overdue}</p>
              </div>
              <div className="w-8 h-8 rounded-md bg-red-100 flex items-center justify-center">
                <FiClock className="text-red-600 text-sm" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-md p-3 shadow-xs border border-gray-200 hover:shadow-sm transition-shadow duration-150">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">No Deadline</p>
                <p className="text-base font-bold text-gray-600">{eventStats.noDeadline}</p>
              </div>
              <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                <FiCalendar className="text-gray-600 text-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">#</span>
                </th>
                <th className="py-3 px-4 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Event Name</span>
                </th>
                <th className="py-3 px-4 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Members</span>
                </th>
                <th className="py-3 px-4 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Paid</span>
                </th>
                <th className="py-3 px-4 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Unpaid</span>
                </th>
                <th className="py-3 px-4 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</span>
                </th>
                <th className="py-3 px-4 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Deadline</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-3"></div>
                      <p className="text-gray-700 text-sm font-medium">Loading events...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-3 text-gray-300">📊</div>
                      <p className="text-gray-800 font-medium mb-1">No events found</p>
                      <p className="text-gray-600 text-sm">
                        {search ? "Try a different search term" : "No events available"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((s, index) => {
                  const deadlinePassed = isDeadlinePassed(s.endDate);
                  const deadlineNear = isDeadlineNear(s.endDate);
                  const hasDeadline = !!s.endDate;
                  
                  return (
                    <tr
                      key={s.eventId}
                      className={`
                        border-b border-gray-100 last:border-b-0
                        hover:bg-blue-50 transition-colors duration-150
                        ${deadlinePassed ? "bg-red-50 hover:bg-red-100" : ""}
                        ${deadlineNear && !deadlinePassed ? "bg-amber-50 hover:bg-amber-100" : ""}
                      `}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-600">
                            {indexOfFirstEvent + index + 1}
                          </span>
                          {deadlinePassed && (
                            <div className="ml-2 w-2 h-2 rounded-full bg-red-500"></div>
                          )}
                          {deadlineNear && !deadlinePassed && (
                            <div className="ml-2 w-2 h-2 rounded-full bg-amber-500"></div>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{s.eventName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {s.startDate && (
                              <span className="text-xs text-gray-500">
                                Starts: {new Date(s.startDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-200">
                          <FiUsers className="text-blue-600 text-xs" />
                          <span className="font-semibold text-blue-700 text-sm">{s.totalUsers}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded border border-green-200">
                          <FiCheckCircle className="text-green-600 text-xs" />
                          <span className="font-semibold text-green-700 text-sm">{s.usersPaidCount}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 rounded border border-red-200">
                          <FiXCircle className="text-red-600 text-xs" />
                          <span className="font-semibold text-red-700 text-sm">{s.usersNotPaidCount}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 rounded border border-purple-200">
                          <FiDollarSign className="text-purple-600 text-xs" />
                          <span className="font-semibold text-purple-700 text-sm">
                            {s.totalPaid.toLocaleString()} Tsh
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className={`
                          inline-flex items-center gap-1 px-2 py-1 rounded text-xs
                          ${!hasDeadline ? "bg-gray-100 text-gray-700" : 
                            deadlinePassed ? "bg-red-100 text-red-700" :
                            deadlineNear ? "bg-amber-100 text-amber-700" :
                            "bg-green-100 text-green-700"}
                        `}>
                          <span className="font-medium">
                            {hasDeadline 
                              ? new Date(s.endDate).toLocaleDateString() 
                              : 'No deadline'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}
        {!loading && paginated.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="text-xs text-gray-600">
                Showing <span className="font-medium text-gray-800">{indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, filteredSummary.length)}</span> of{" "}
                <span className="font-medium text-gray-800">{filteredSummary.length}</span> events
              </div>
              
              {/* PAGINATION */}
              <div className="flex items-center gap-1">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`
                    flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150
                    ${currentPage === 1 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
                    }
                  `}
                >
                  <IoIosArrowBack className="text-xs" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`
                          w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium transition-all duration-150
                          ${currentPage === pageNum
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                          }
                        `}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`
                    flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150
                    ${currentPage === totalPages 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
                    }
                  `}
                >
                  <span className="hidden sm:inline">Next</span>
                  <IoIosArrowForward className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STATUS LEGEND */}
      {!loading && paginated.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600">Status:</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-700">Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-xs text-gray-700">Upcoming</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-700">Overdue</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export default Summary;