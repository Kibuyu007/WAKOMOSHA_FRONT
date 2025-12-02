import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../../Utils/config";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  FiDownload,
  FiFileText,
  FiTrendingUp,
  FiUserCheck,
  FiAlertCircle,
  FiSearch,
} from "react-icons/fi";

const Contributions = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ========== EVENT HANDLERS ==========
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await axios.get(`${BASE_URL}/api/events/getEvents`);
      setEvents(res.data.data.filter((e) => e.status === "open"));
    } catch (err) {
      console.error("Failed to fetch events:", err);
      toast.error("❌ Failed to load events");
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchContributions = async (eventId) => {
    if (!eventId) return;

    try {
      setLoadingUsers(true);
      const res = await axios.get(
        `${BASE_URL}/api/contributions/getMchango/${eventId}`
      );

      const withInput = res.data.users.map((user) => ({
        ...user,
        inputAmount: "",
      }));

      setUsers(withInput);
      setFilteredUsers(withInput);
      setSearchQuery(""); // Reset search when new event is selected
    } catch (err) {
      console.error("Failed to fetch contributions:", err);
      toast.error("❌ Failed to load contributions");
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateInput = (id, value) => {
    setUsers((prev) =>
      prev.map((user) =>
        user._id === id ? { ...user, inputAmount: value } : user
      )
    );

    // Also update filtered users
    setFilteredUsers((prev) =>
      prev.map((user) =>
        user._id === id ? { ...user, inputAmount: value } : user
      )
    );
  };

  const handleSave = async (user) => {
    const amount = Number(user.inputAmount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return toast.warning("⚠️ Please enter a valid amount");
    }

    try {
      await axios.post(`${BASE_URL}/api/contributions/addMchango`, {
        eventId: selectedEvent._id,
        userId: user._id,
        amount,
      });

      toast.success("✅ Payment saved successfully!");
      fetchContributions(selectedEvent._id);
    } catch (err) {
      console.error("Failed to save payment:", err);
      toast.error("❌ Failed to save payment");
    }
  };

  // ========== SEARCH HANDLER ==========
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter((user) => {
      const searchLower = query.toLowerCase();
      const fullName = `${user.firstName || ""} ${user.secondName || ""} ${
        user.lastName || ""
      }`.toLowerCase();
      const email = (user.email || "").toLowerCase();

      return fullName.includes(searchLower) || email.includes(searchLower);
    });

    setFilteredUsers(filtered);
  };

  // ========== STATUS CHECK ==========
  const getContributionStatus = (user) => {
    if (user.paidAmount <= 0) {
      return {
        label: "Not Paid",
        color: "from-red-500 to-rose-500",
        bgColor: "bg-gradient-to-r from-red-50 to-rose-50",
        textColor: "text-red-700",
        icon: <FiAlertCircle className="mr-1" />,
      };
    } else if (user.paidAmount < (selectedEvent?.minAmount || 0)) {
      return {
        label: "Partial",
        color: "from-amber-500 to-orange-500",
        bgColor: "bg-gradient-to-r from-amber-50 to-orange-50",
        textColor: "text-amber-700",
        icon: <FiTrendingUp className="mr-1" />,
      };
    } else {
      return {
        label: "Paid",
        color: "from-emerald-500 to-green-500",
        bgColor: "bg-gradient-to-r from-emerald-50 to-green-50",
        textColor: "text-emerald-700",
        icon: <FiUserCheck className="mr-1" />,
      };
    }
  };

  // ========== EXPORT FUNCTIONS ==========
  const exportToExcel = () => {
    if (!selectedEvent || filteredUsers.length === 0) {
      toast.warning("⚠️ No data to export");
      return;
    }

    const data = filteredUsers.map((user) => ({
      "First Name": user.firstName,
      "Second Name": user.secondName,
      "Last Name": user.lastName,
      Email: user.email || "N/A",
      "Amount Paid": user.paidAmount,
      "Amount Paid (Tsh)": `${user.paidAmount.toLocaleString()} Tsh`,
      Status:
        user.paidAmount <= 0
          ? "Not Paid"
          : user.paidAmount < (selectedEvent?.minAmount || 0)
          ? "Partial"
          : "Paid",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contributions");

    XLSX.writeFile(wb, `${selectedEvent.name}_Contributions.xlsx`);
    toast.success("📊 Excel file downloaded!");
  };

  const exportToPDF = () => {
    if (!selectedEvent || filteredUsers.length === 0) {
      toast.warning("⚠️ No data to export");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`${selectedEvent.name} - Contributions Report`, 14, 20);

    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()} | Total: ${
        filteredUsers.length
      } participants`,
      14,
      28
    );

    const tableData = filteredUsers.map((user) => [
      `${user.firstName} ${user.lastName}`,
      user.email || "N/A",
      `${user.paidAmount.toLocaleString()} Tsh`,
      user.paidAmount <= 0
        ? "Not Paid"
        : user.paidAmount < (selectedEvent?.minAmount || 0)
        ? "Partial"
        : "Paid",
    ]);

    doc.autoTable({
      head: [["Participant", "Email", "Amount Paid", "Status"]],
      body: tableData,
      startY: 35,
      theme: "grid",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      margin: { top: 35 },
    });

    doc.save(`${selectedEvent.name}_Report.pdf`);
    toast.success("📄 PDF report downloaded!");
  };

  // ========== USE EFFECTS ==========
  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchContributions(selectedEvent._id);
    }
  }, [selectedEvent]);

  // ========== RENDER ==========
  return (
    <div className="w-full h-full p-5 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50/30">
      <div className="flex flex-col lg:flex-row gap-5 h-full">
        {/* Events Panel */}
        <div className="lg:w-1/4 h-full">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow p-4 h-full border border-white/20">
            <div className="mb-5">
              <h2 className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                📅 Active Events
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Select to manage contributions
              </p>
            </div>

            {loadingEvents ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2 text-gray-300">📭</div>
                <p className="text-gray-400 text-sm">No open events</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
                {events.map((event) => (
                  <div
                    key={event._id}
                    onClick={() => setSelectedEvent(event)}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all duration-200 
                      border backdrop-blur-sm group
                      ${
                        selectedEvent?._id === event._id
                          ? "bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-300 shadow-md"
                          : "bg-gradient-to-r from-red-100/20 to-indigo-200/20 border-gray-200/30 hover:border-blue-200 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30"
                      }
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3
                          className={`text-sm font-medium ${
                            selectedEvent?._id === event._id
                              ? "text-blue-700"
                              : "text-gray-700 group-hover:text-blue-600"
                          }`}
                        >
                          {event.name}
                        </h3>
                        <div className="mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                              selectedEvent?._id === event._id
                                ? "bg-gradient-to-r from-blue-200 to-indigo-100 text-blue-700"
                                : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 group-hover:text-blue-600"
                            }`}
                          >
                            🎯 {event.minAmount?.toLocaleString()} Tsh
                          </span>
                        </div>
                      </div>
                      {selectedEvent?._id === event._id && (
                        <div className="ml-1">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contributions Panel */}
        <div className="lg:w-3/4 h-full">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow p-5 h-full border border-white/20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {selectedEvent ? `💰 ${selectedEvent.name}` : "Contributions"}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {selectedEvent
                    ? `Manage payments for selected event`
                    : "Select an event to get started"}
                </p>
              </div>

              {selectedEvent && (
                <div className="flex flex-wrap items-center gap-2 mt-3 lg:mt-0">
                  {/* Stats */}
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-lg border border-blue-200/50 backdrop-blur-sm">
                      <p className="text-sm">
                        <span className="font-bold text-blue-600">
                          {filteredUsers.length}
                        </span>{" "}
                        {searchQuery ? "found" : "participants"}
                      </p>
                    </div>
                    <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-50/80 to-green-50/80 rounded-lg border border-emerald-200/50 backdrop-blur-sm">
                      <p className="text-sm">
                        Total:{" "}
                        <span className="font-bold text-emerald-600">
                          {filteredUsers
                            .reduce((sum, user) => sum + user.paidAmount, 0)
                            .toLocaleString()}{" "}
                          Tsh
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={exportToExcel}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all duration-200 shadow text-sm"
                    >
                      <FiDownload className="text-sm" />
                      <span className="font-medium">Excel</span>
                    </button>

                    <button
                      onClick={exportToPDF}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow text-sm"
                    >
                      <FiFileText className="text-sm" />
                      <span className="font-medium">PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content */}
            {!selectedEvent ? (
              <div className="flex flex-col items-center justify-center h-60">
                <div className="text-5xl mb-3 text-gray-300">📊</div>
                <h3 className="text-base font-medium text-gray-500 mb-1">
                  No Event Selected
                </h3>
                <p className="text-gray-400 text-sm">
                  Choose an event from the left panel
                </p>
              </div>
            ) : loadingUsers ? (
              <div className="flex flex-col items-center justify-center h-60">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-3"></div>
                <p className="text-gray-500 text-sm">
                  Loading contributions...
                </p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60">
                <div className="text-5xl mb-3 text-gray-300">👥</div>
                <h3 className="text-base font-medium text-gray-500 mb-1">
                  No Contributions Yet
                </h3>
                <p className="text-gray-400 text-sm">
                  Start adding contributions below
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200/50 bg-white/60 backdrop-blur-sm">
                {/* Search Bar - STYLISH */}
                <div className="px-4 py-3 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search participant by name..."
                      className="w-full pl-10 pr-4 py-2 bg-white/80 border border-gray-300/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                    {searchQuery && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        {filteredUsers.length} found
                      </span>
                    )}
                  </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 backdrop-blur-sm">
                        <th className="py-3 px-4 text-left">
                          <span className="font-bold text-gray-700 text-sm">
                            👤 Participant
                          </span>
                        </th>
                        <th className="py-3 px-4 text-left">
                          <span className="font-bold text-gray-700 text-sm">
                            💰 Paid Amount
                          </span>
                        </th>
                        <th className="py-3 px-4 text-left">
                          <span className="font-bold text-gray-700 text-sm">
                            📊 Status
                          </span>
                        </th>
                        <th className="py-3 px-4 text-left">
                          <span className="font-bold text-gray-700 text-sm">
                            💸 New Payment
                          </span>
                        </th>
                        <th className="py-3 px-4 text-left">
                          <span className="font-bold text-gray-700 text-sm">
                            🚀 Action
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-3xl mb-2 text-gray-300">
                                🔍
                              </div>
                              <p className="text-gray-500 font-medium">
                                No participants found
                              </p>
                              <p className="text-gray-400 text-sm mt-1">
                                Try a different search term
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user, index) => {
                          const status = getContributionStatus(user);
                          return (
                            <>
                              {/* DATA ROW */}
                              <tr
                                key={user._id}
                                className={`
                                  transition-all duration-150 hover:scale-[1.002]
                                  ${
                                    index % 2 === 0
                                      ? ""
                                      : "bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 backdrop-blur-sm"
                                  }
                                  hover:bg-gradient-to-r hover:from-blue-50/30 hover:via-indigo-50/30 hover:to-purple-50/30
                                `}
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center">
                                    <div
                                      className={`w-8 h-8 rounded-full bg-gradient-to-r ${status.color} flex items-center justify-center text-white font-bold mr-3 shadow`}
                                    >
                                      {user.firstName?.[0] || "U"}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-800 text-sm">
                                        {user.firstName} {user.secondName}{" "}
                                        {user.lastName}
                                      </p>
                                      <p className="text-gray-500 text-xs truncate max-w-[150px]">
                                        {user.contacts || "No email"}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 rounded border border-emerald-200/50 shadow-sm">
                                    <span className="font-bold text-emerald-700 text-sm">
                                      {user.paidAmount.toLocaleString()} Tsh
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <div
                                    className={`inline-flex items-center px-3 py-1.5 ${
                                      status.bgColor
                                    } rounded border ${status.textColor.replace(
                                      "text",
                                      "border"
                                    )}/30`}
                                  >
                                    {status.icon}
                                    <span
                                      className={`font-medium ${status.textColor} text-sm`}
                                    >
                                      {status.label}
                                    </span>
                                    {status.label === "Not Paid" && (
                                      <div className="ml-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                                      Tsh
                                    </div>
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="Amount"
                                      className="w-36 pl-10 pr-3 py-2 border border-gray-300/50 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-200/30 transition-all duration-150 bg-white/80 backdrop-blur-sm text-sm"
                                      value={user.inputAmount}
                                      onChange={(e) =>
                                        updateInput(user._id, e.target.value)
                                      }
                                    />
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <button
                                    className={`
                                    px-3 py-2 rounded-lg font-medium transition-all duration-150 
                                    shadow hover:shadow-sm text-sm
                                    ${
                                      !user.inputAmount ||
                                      Number(user.inputAmount) <= 0
                                        ? "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                                    }
                                  `}
                                    onClick={() => handleSave(user)}
                                    disabled={
                                      !user.inputAmount ||
                                      Number(user.inputAmount) <= 0
                                    }
                                  >
                                    {!user.inputAmount ||
                                    Number(user.inputAmount) <= 0 ? (
                                      <span>Enter Amount</span>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <span>💾</span>
                                        <span>Save</span>
                                      </div>
                                    )}
                                  </button>
                                </td>
                              </tr>
                              
                              {/* SPACER ROW - Creates separation between rows */}
                              <tr key={`spacer-${user._id}`} className="h-4">
                                <td colSpan="5" className="p-0"></td>
                              </tr>
                            </>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* FOOTER */}
                <div className="bg-gradient-to-r from-gray-50/80 via-blue-50/80 to-indigo-50/80 px-4 py-3 border-t border-gray-200/30 backdrop-blur-sm">
                  <div className="flex flex-col lg:flex-row justify-between items-center gap-2">
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400 shadow"></div>
                        <span className="text-gray-700 text-sm">
                          <span className="font-bold text-blue-600">
                            {filteredUsers.length}
                          </span>{" "}
                          {searchQuery ? "found" : "total"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow"></div>
                        <span className="text-gray-700 text-sm">
                          Paid:{" "}
                          <span className="font-bold text-emerald-600">
                            {
                              filteredUsers.filter((u) => u.paidAmount > 0)
                                .length
                            }
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400 shadow"></div>
                        <span className="text-gray-700 text-sm">
                          Not Paid:{" "}
                          <span className="font-bold text-red-600">
                            {
                              filteredUsers.filter((u) => u.paidAmount <= 0)
                                .length
                            }
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contributions;