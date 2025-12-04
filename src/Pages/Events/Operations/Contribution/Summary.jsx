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
    <div className="w-full h-full p-4 md:p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-blue-800 bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Events Contribution Summary
            </h1>
            <p className="text-gray-700 text-sm mt-1">Track all event contributions and payment status</p>
          </div>
          <div className="mt-2 md:mt-0">
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-lg border border-blue-200 shadow-sm">
              <span className="text-sm font-medium text-blue-700">Showing:</span>
              <span className="ml-2 font-bold text-blue-800 text-lg">{filteredSummary.length}</span>
              <span className="ml-1 text-sm text-blue-600">events</span>
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTER BAR */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-lg border border-blue-100">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-blue-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search events by name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 text-gray-900 font-medium"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-blue-50 rounded-lg border border-blue-200">
                <FiFilter className="text-blue-600 font-bold" />
                <span className="text-sm font-semibold text-blue-700">Filter by:</span>
              </div>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-3.5 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 text-gray-900 font-medium"
              >
                <option value="all">All Events</option>
                <option value="paid">With Payments</option>
                <option value="unpaid">No Payments</option>
              </select>
            </div>
          </div>
        </div>

        {/* VIBRANT STATUS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-lg border border-blue-300 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Active</p>
                <p className="text-2xl font-extrabold text-blue-700">{eventStats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <FiCalendar className="text-white text-lg" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 shadow-lg border border-amber-300 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Upcoming</p>
                <p className="text-2xl font-extrabold text-amber-700">{eventStats.upcoming}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                <FiClock className="text-white text-lg" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 shadow-lg border border-red-300 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-800 uppercase tracking-wide mb-1">Overdue</p>
                <p className="text-2xl font-extrabold text-red-700">{eventStats.overdue}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <FiClock className="text-white text-lg" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-lg border border-gray-300 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-1">No Deadline</p>
                <p className="text-2xl font-extrabold text-gray-700">{eventStats.noDeadline}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg">
                <FiCalendar className="text-white text-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-100 overflow-hidden">
        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#dee1fc] to-indigo-300">
                <th className="py-4 px-6 text-left">
                  <span className="text-sm font-bold text-black uppercase tracking-wider">#</span>
                </th>
                <th className="py-4 px-6 text-left">
                  <span className="text-sm font-bold text-black uppercase tracking-wider">Event Name</span>
                </th>
                <th className="py-4 px-6 text-left">
                  <span className="text-sm font-bold text-black uppercase tracking-wider">Members</span>
                </th>
                <th className="py-4 px-6 text-left">
                  <span className="text-sm font-bold text-black uppercase tracking-wider">Paid</span>
                </th>
                <th className="py-4 px-6 text-left">
                  <span className="text-sm font-bold text-black uppercase tracking-wider">Unpaid</span>
                </th>
                <th className="py-4 px-6 text-left">
                  <span className="text-sm font-bold text-black uppercase tracking-wider">Amount</span>
                </th>
                <th className="py-4 px-6 text-left">
                  <span className="text-sm font-bold text-black uppercase tracking-wider">Deadline</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="relative mb-6">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-6 w-6 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <p className="text-gray-900 font-bold text-lg mb-2">Loading Events...</p>
                      <p className="text-gray-700">Please wait while we fetch the data</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                        <FiSearch className="h-12 w-12 text-blue-500" />
                      </div>
                      <p className="text-gray-900 font-bold text-xl mb-2">No events found</p>
                      <p className="text-gray-700 max-w-md">
                        {search 
                          ? `No events matching "${search}" were found`
                          : "There are no events in the system yet"}
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
                        border-b border-blue-100 last:border-b-0
                        hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200
                        ${deadlinePassed ? "bg-gradient-to-r from-red-50/70 to-red-100/70 hover:from-red-100 hover:to-red-200" : ""}
                        ${deadlineNear && !deadlinePassed ? "bg-gradient-to-r from-amber-50/70 to-amber-100/70 hover:from-amber-100 hover:to-amber-200" : ""}
                      `}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900 text-md">
                            {indexOfFirstEvent + index + 1}
                          </span>
                          {deadlinePassed && (
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-lg animate-pulse"></div>
                          )}
                          {deadlineNear && !deadlinePassed && (
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg animate-pulse"></div>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-8 h-8 rounded-lg flex items-center justify-center
                              ${deadlinePassed ? "bg-gradient-to-r from-red-500 to-red-600" : 
                                deadlineNear ? "bg-gradient-to-r from-amber-500 to-amber-600" :
                                "bg-gradient-to-r from-blue-500 to-blue-600"}
                            `}>
                              <FiCalendar className="text-white text-lg" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-base">{s.eventName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {s.startDate && (
                                  <span className="text-xs font-medium text-blue-700 bg-blue-100 px-4 py-1 rounded-full">
                                    Starts: {new Date(s.startDate).toLocaleDateString()}
                                  </span>
                                )}
                                {deadlinePassed && (
                                  <span className="text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-700 px-3 py-1 rounded-full shadow">
                                    ⚠️ OVERDUE
                                  </span>
                                )}
                                {deadlineNear && !deadlinePassed && (
                                  <span className="text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 px-3 py-1 rounded-full shadow">
                                    ⏰ SOON
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl border-2 border-blue-300 shadow-sm">
                          <FiUsers className="text-blue-700 font-bold" />
                          <span className="font-bold text-blue-800 text-md">{s.totalUsers}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-green-100 to-green-200 rounded-xl border-2 border-green-300 shadow-sm">
                          <FiCheckCircle className="text-green-700 font-bold" />
                          <span className="font-bold text-green-800 text-md">{s.usersPaidCount}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-red-100 to-red-200 rounded-xl border-2 border-red-300 shadow-sm">
                          <FiXCircle className="text-red-700 font-bold" />
                          <span className="font-bold text-red-800 text-md">{s.usersNotPaidCount}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="  gap-2 px-4 py-1 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl border-2 border-purple-300 shadow-sm">
                          <span className="font-bold text-purple-800 text-md">
                            {s.totalPaid.toLocaleString()} Tsh
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className={`
                          inline-flex items-center gap-2 px-4 py-1 rounded-xl border-2 shadow-sm
                          ${!hasDeadline ? "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400" : 
                            deadlinePassed ? "bg-gradient-to-r from-red-100 to-red-200 border-red-400" :
                            deadlineNear ? "bg-gradient-to-r from-amber-100 to-amber-200 border-amber-400" :
                            "bg-gradient-to-r from-emerald-100 to-emerald-200 border-emerald-400"}
                        `}>
                          <span className={`
                            font-bold text-md
                            ${!hasDeadline ? "text-gray-900" : 
                              deadlinePassed ? "text-red-900" :
                              deadlineNear ? "text-amber-900" :
                              "text-emerald-900"}
                          `}>
                            {hasDeadline 
                              ? new Date(s.endDate).toLocaleDateString() 
                              : 'No deadline'}
                          </span>
                          {hasDeadline && deadlinePassed && (
                            <FiClock className="text-red-700 h-5 w-5 font-bold" />
                          )}
                          {hasDeadline && deadlineNear && !deadlinePassed && (
                            <FiClock className="text-amber-700 h-5 w-5 font-bold animate-pulse" />
                          )}
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-t-2 border-blue-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="text-gray-800 font-semibold">
                  Showing <span className="text-blue-800">{indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, filteredSummary.length)}</span> of{" "}
                  <span className="text-blue-800">{filteredSummary.length}</span> events
                </div>
                <div className="hidden lg:flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow"></div>
                    <span className="text-sm font-medium text-gray-800">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 shadow"></div>
                    <span className="text-sm font-medium text-gray-800">Upcoming (≤3 days)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow"></div>
                    <span className="text-sm font-medium text-gray-800">Overdue</span>
                  </div>
                </div>
              </div>
              
              {/* PAGINATION */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 shadow
                    ${currentPage === 1 
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg border-2 border-blue-400"
                    }
                  `}
                >
                  <IoIosArrowBack className="text-base" />
                  <span>Previous</span>
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
                          w-12 h-12 flex items-center justify-center rounded-xl text-base font-bold transition-all duration-200 shadow
                          ${currentPage === pageNum
                            ? "bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg"
                            : "bg-white text-gray-800 hover:bg-blue-100 border-2 border-blue-300"
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
                    flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 shadow
                    ${currentPage === totalPages 
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg border-2 border-blue-400"
                    }
                  `}
                >
                  <span>Next</span>
                  <IoIosArrowForward className="text-base" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;