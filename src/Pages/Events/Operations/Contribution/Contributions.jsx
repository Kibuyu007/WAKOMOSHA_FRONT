import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiCheckCircle,
  FiCalendar,
  FiChevronRight,
  FiDollarSign,
  FiUsers,
  FiCreditCard,
  FiBarChart2,
  FiPercent,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiMessageSquare,
  FiCheckSquare,
  FiSquare,
  FiUser,
  FiPhone,
  FiMail,
} from "react-icons/fi";

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const res = await axios.get(`${BASE_URL}/api/events/getEvents`);
      const openEvents = res.data.data.filter((e) => e.status === "open");
      setEvents(openEvents);
      return openEvents;
    } catch (err) {
      console.error("Failed to fetch events:", err);
      toast.error("❌ Failed to load events");
      throw err;
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  return {
    events,
    selectedEvent,
    loadingEvents,
    setSelectedEvent,
    fetchEvents,
  };
};

const useContributions = (selectedEvent) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");

  const fetchContributions = useCallback(async (eventId) => {
    if (!eventId) return;

    try {
      setLoadingUsers(true);
      const res = await axios.get(
        `${BASE_URL}/api/contributions/getMchango/${eventId}`
      );

      const usersWithInput = res.data.users.map((user) => ({
        ...user,
        inputAmount: "",
        id: user._id,
        isSelected: false,
      }));

      setUsers(usersWithInput);
      setFilteredUsers(usersWithInput);
      setSearchQuery("");
      setSelectedUsers(new Set());
      return usersWithInput;
    } catch (err) {
      console.error("Failed to fetch contributions:", err);
      toast.error("❌ Failed to load contributions");
      throw err;
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const applyFilters = useCallback(
    (usersList, query, filterType) => {
      let filtered = usersList;

      if (query.trim()) {
        const searchLower = query.toLowerCase();
        filtered = filtered.filter((user) => {
          const fullName = `${user.firstName || ""} ${user.secondName || ""} ${
            user.lastName || ""
          }`.toLowerCase();
          const email = (user.email || "").toLowerCase();
          const contacts = (user.contacts || "").toLowerCase();

          return (
            fullName.includes(searchLower) ||
            email.includes(searchLower) ||
            contacts.includes(searchLower)
          );
        });
      }

      if (filterType !== "all" && selectedEvent) {
        const minAmount = selectedEvent.minAmount || 0;
        filtered = filtered.filter((user) => {
          if (filterType === "paid") return user.paidAmount >= minAmount;
          if (filterType === "partial")
            return user.paidAmount > 0 && user.paidAmount < minAmount;
          if (filterType === "unpaid") return user.paidAmount <= 0;
          return true;
        });
      }

      return filtered;
    },
    [selectedEvent]
  );

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      const filtered = applyFilters(users, query, activeFilter);
      setFilteredUsers(filtered);
    },
    [users, activeFilter, applyFilters]
  );

  const handleFilterChange = useCallback(
    (filterType) => {
      setActiveFilter(filterType);
      const filtered = applyFilters(users, searchQuery, filterType);
      setFilteredUsers(filtered);
    },
    [users, searchQuery, applyFilters]
  );

  const toggleUserSelection = useCallback((userId) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const unpaidPartialUsers = users.filter((user) => {
      const minAmount = selectedEvent?.minAmount || 0;
      return user.paidAmount <= 0 || user.paidAmount < minAmount;
    });

    if (selectedUsers.size === unpaidPartialUsers.length) {
      setSelectedUsers(new Set());
    } else {
      const userIds = unpaidPartialUsers.map((user) => user.id);
      setSelectedUsers(new Set(userIds));
    }
  }, [users, selectedUsers.size, selectedEvent]);

  const getSelectedUserDetails = useCallback(() => {
    return users.filter((user) => selectedUsers.has(user.id));
  }, [users, selectedUsers]);

  return {
    users,
    filteredUsers,
    loadingUsers,
    searchQuery,
    activeFilter,
    viewMode,
    selectedUsers,
    sendingReminders,
    reminderMessage,
    setViewMode,
    setUsers,
    setFilteredUsers,
    setReminderMessage,
    setSendingReminders,
    fetchContributions,
    handleSearch,
    handleFilterChange,
    toggleUserSelection,
    toggleSelectAll,
    getSelectedUserDetails,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getContributionStatus = (user, minAmount) => {
  if (user.paidAmount <= 0) {
    return {
      label: "Unpaid",
      icon: <FiAlertCircle className="w-3 h-3 mr-1" />,
      badgeClass: "bg-red-50 text-red-700 border border-red-100",
      avatarColor: "bg-gradient-to-br from-red-500 to-red-600",
    };
  } else if (user.paidAmount < minAmount) {
    const progress = Math.round((user.paidAmount / minAmount) * 100);
    return {
      label: `${progress}%`,
      icon: <FiTrendingUp className="w-3 h-3 mr-1" />,
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-100",
      avatarColor: "bg-gradient-to-br from-amber-500 to-amber-600",
    };
  } else {
    return {
      label: "Paid",
      icon: <FiCheck className="w-3 h-3 mr-1" />,
      badgeClass: "bg-green-50 text-green-700 border border-green-100",
      avatarColor: "bg-gradient-to-br from-green-500 to-green-600",
    };
  }
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

const ViewToggle = ({ viewMode, onChange }) => (
  <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
    <button
      onClick={() => onChange("table")}
      className={`px-4 py-2.5 text-sm font-medium transition-all ${
        viewMode === "table"
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <FiEye className="inline-block mr-2" size={14} />
      Table
    </button>
    <button
      onClick={() => onChange("compact")}
      className={`px-4 py-2.5 text-sm font-medium transition-all ${
        viewMode === "compact"
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <FiEyeOff className="inline-block mr-2" size={14} />
      Compact
    </button>
  </div>
);

const ProgressIndicator = ({ label, value, color = "indigo" }) => {
  const colorClasses = {
    indigo: "from-indigo-500 to-indigo-600",
    green: "from-green-500 to-green-600",
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-amber-600",
  };

  const textColors = {
    indigo: "text-indigo-700",
    green: "text-green-700",
    blue: "text-blue-700",
    amber: "text-amber-700",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-bold ${textColors[color]}`}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
};

const EventCard = React.memo(({ event, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`
      p-4 rounded-xl border cursor-pointer transition-all duration-200
      ${
        isSelected
          ? "border-indigo-500 bg-gradient-to-r from-indigo-50 to-indigo-25 shadow-sm"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
      }
    `}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FiCalendar className="w-4 h-4 text-indigo-600" />
          </div>
          <h3
            className={`font-medium text-sm ${
              isSelected ? "text-indigo-700" : "text-gray-800"
            }`}
          >
            {event.name}
          </h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-lg text-xs font-medium">
            🎯 {event.minAmount?.toLocaleString()} Tsh
          </span>
          <span className="text-xs text-gray-500">
            {event.participants || 0} participants
          </span>
        </div>
      </div>
      {isSelected && (
        <FiChevronRight className="text-indigo-500 ml-2 flex-shrink-0" />
      )}
    </div>
  </div>
));

const QuickStats = ({ stats }) => (
  <div className="flex items-center gap-6">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm font-semibold text-gray-700">
        {stats.paidCount} paid
      </span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
      <span className="text-sm font-semibold text-gray-700">
        {stats.partialCount} partial
      </span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      <span className="text-sm font-semibold text-gray-700">
        {stats.unpaidCount} unpaid
      </span>
    </div>
  </div>
);

const ExportButtons = ({ onExportExcel, onExportPDF, disabled }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={onExportExcel}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
        transition-all duration-200 transform hover:scale-[1.02]
        ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm hover:shadow"
        }
      `}
    >
      <FiDownload size={16} />
      Excel
    </button>
    <button
      onClick={onExportPDF}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
        transition-all duration-200 transform hover:scale-[1.02]
        ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-sm hover:shadow"
        }
      `}
    >
      <FiFileText size={16} />
      PDF
    </button>
  </div>
);

const FilterTabs = ({ activeFilter, onChange }) => {
  const filters = [
    { key: "all", label: "All", icon: FiBarChart2, color: "gray" },
    { key: "paid", label: "Paid", icon: FiCheck, color: "green" },
    { key: "partial", label: "Partial", icon: FiPercent, color: "amber" },
    { key: "unpaid", label: "Unpaid", icon: FiAlertCircle, color: "red" },
  ];

  return (
    <div className="flex items-center gap-2">
      <FiFilter className="text-gray-500" size={16} />
      <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
        {filters.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.key}
              onClick={() => onChange(filter.key)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                transition-all duration-200
                ${
                  activeFilter === filter.key
                    ? `bg-white text-${filter.color}-700 border border-${filter.color}-200 shadow-sm`
                    : "text-gray-600 hover:text-gray-800 hover:bg-white"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SearchBar = React.memo(({ value, onChange, resultCount }) => (
  <div className="relative max-w-xl">
    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
    <input
      type="text"
      placeholder="Search participants by name, email, or phone..."
      className="w-full pl-12 pr-24 py-3 bg-white border border-gray-200 rounded-xl
                 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                 transition-all duration-200 shadow-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {value && (
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
          {resultCount} found
        </span>
      </div>
    )}
  </div>
));

const UserRow = React.memo(
  ({
    user,
    index,
    minAmount,
    onUpdateInput,
    onSave,
    selectedUsers,
    onToggleSelect,
  }) => {
    const status = getContributionStatus(user, minAmount);
    const isSaveDisabled = !user.inputAmount || Number(user.inputAmount) <= 0;
    const balance = Math.max(0, minAmount - user.paidAmount);
    const progress = minAmount > 0 ? (user.paidAmount / minAmount) * 100 : 0;
    const isFullyPaid = user.paidAmount >= minAmount;
    const canBeSelected = user.paidAmount < minAmount;
    const isSelected = selectedUsers.has(user.id);

    return (
      <tr
        className={`
          border-b border-gray-100 hover:bg-gray-50/80 transition-colors duration-150
          ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
          ${isFullyPaid ? "opacity-90" : ""}
        `}
      >
        {/* Selection Checkbox */}
        <td className="py-4 px-4 w-14">
          <div className="flex items-center justify-center">
            {canBeSelected ? (
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(user.id)}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            ) : (
              isFullyPaid && (
                <div className="p-2 bg-gradient-to-br from-green-100 to-green-50 rounded-lg border border-green-200">
                  <FiCheck className="w-4 h-4 text-green-600" />
                </div>
              )
            )}
          </div>
        </td>

        {/* Participant */}
        <td className="py-4 px-4">
          <div className="flex items-center">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.avatarColor} text-white font-bold text-lg shadow-sm`}
              >
                {user.firstName?.[0] || "U"}
              </div>
              {isFullyPaid && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                  <FiCheck className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="ml-4">
              <div className="font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <FiUser size={12} />
                {user.secondName}
              </div>
            </div>
          </div>
        </td>

        {/* Contact */}
        <td className="py-4 px-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <FiPhone className="text-gray-400" size={14} />
              {user.contacts || "No phone"}
              {!user.contacts && (
                <span className="ml-2 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">
                  No WhatsApp
                </span>
              )}
            </div>
            {user.email && (
              <div className="flex items-center gap-2 text-xs text-gray-500 truncate max-w-[180px]">
                <FiMail size={12} />
                {user.email}
              </div>
            )}
          </div>
        </td>

        {/* Paid Amount */}
        <td className="py-4 px-4">
          <div className="space-y-2">
            <div className="font-bold text-gray-900 text-lg">
              {user.paidAmount.toLocaleString()} Tsh
            </div>
            {balance > 0 && (
              <div className="text-sm text-gray-600">
                Balance:{" "}
                <span className="font-semibold text-indigo-700">
                  {balance.toLocaleString()} Tsh
                </span>
              </div>
            )}
            {progress > 0 && progress < 100 && (
              <div className="w-32">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{progress.toFixed(0)}%</span>
                  <span>{minAmount.toLocaleString()} Tsh</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="py-4 px-4">
          <div className="flex flex-col gap-2">
            <span
              className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-semibold ${status.badgeClass} max-w-[100px]`}
            >
              {status.icon}
              {status.label}
            </span>
            {!isFullyPaid && balance > 0 && (
              <div className="text-xs text-gray-500">
                Need: {balance.toLocaleString()} Tsh
              </div>
            )}
          </div>
        </td>

        {/* New Payment */}
        <td className="py-4 px-4">
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm font-medium">Tsh</span>
              </div>
              <input
                type="number"
                min="0"
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                         text-sm font-medium transition-all duration-200"
                value={user.inputAmount}
                onChange={(e) => onUpdateInput(user.id, e.target.value)}
              />
              {balance > 0 && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    onClick={() => onUpdateInput(user.id, balance.toString())}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Fill
                  </button>
                </div>
              )}
            </div>
            {balance > 0 && (
              <div className="text-xs text-gray-500 text-center">
                Balance: {balance.toLocaleString()} Tsh
              </div>
            )}
          </div>
        </td>

        {/* Action */}
        <td className="py-4 px-4">
          <button
            onClick={() => onSave(user)}
            disabled={isSaveDisabled}
            className={`
              flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
              transition-all duration-200 transform hover:scale-[1.02] w-full
              ${
                isSaveDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-sm hover:shadow-md"
              }
            `}
          >
            <FiCheckCircle size={16} />
            Save
          </button>
        </td>
      </tr>
    );
  }
);

const CompactView = ({
  users,
  minAmount,
  onUpdateInput,
  onSave,
  selectedUsers,
  onToggleSelect,
}) => (
  <div className="p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => {
        const status = getContributionStatus(user, minAmount);
        const isSaveDisabled =
          !user.inputAmount || Number(user.inputAmount) <= 0;
        const isFullyPaid = user.paidAmount >= minAmount;
        const canBeSelected = user.paidAmount < minAmount;
        const isSelected = selectedUsers.has(user.id);
        const balance = Math.max(0, minAmount - user.paidAmount);

        return (
          <div
            key={user.id}
            className="bg-white rounded-xl border border-gray-200 p-4 relative hover:shadow-md transition-shadow duration-200"
          >
            {/* Selection checkbox */}
            <div className="absolute top-4 right-4">
              {canBeSelected ? (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(user.id)}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-lg"
                />
              ) : (
                isFullyPaid && (
                  <div className="p-1.5 bg-green-100 rounded-lg border border-green-200">
                    <FiCheck className="w-4 h-4 text-green-600" />
                  </div>
                )
              )}
            </div>

            <div className="flex items-start gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.avatarColor} text-white font-bold text-lg shadow-sm flex-shrink-0`}
              >
                {user.firstName?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500 truncate mt-1">
                  {user.contacts || "No contact"}
                </div>
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Paid:</span>
                <span className="font-bold text-gray-900">
                  {user.paidAmount.toLocaleString()} Tsh
                </span>
              </div>
              {user.paidAmount < minAmount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Balance:
                  </span>
                  <span className="font-bold text-indigo-700">
                    {balance.toLocaleString()} Tsh
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-xs">Tsh</span>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="Amount"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg
                           focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  value={user.inputAmount}
                  onChange={(e) => onUpdateInput(user.id, e.target.value)}
                />
              </div>

              <button
                onClick={() => onSave(user)}
                disabled={isSaveDisabled}
                className={`
                  w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                  transition-all duration-200
                  ${
                    isSaveDisabled
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-sm hover:shadow"
                  }
                `}
              >
                <FiCheckCircle size={14} />
                Save Payment
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const TableFooter = ({ stats }) => (
  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-6">
        <StatItem
          color="green"
          count={stats.paidCount}
          label="Paid"
          description="Fully paid participants"
        />
        <StatItem
          color="amber"
          count={stats.partialCount}
          label="Partial"
          description="Partially paid"
        />
        <StatItem
          color="red"
          count={stats.unpaidCount}
          label="Unpaid"
          description="No payments yet"
        />
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-500 mb-1">Total Collected</div>
        <div className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
          {stats.totalPaid.toLocaleString()} Tsh
        </div>
        <div className="text-xs text-gray-500">
          Average: {stats.averagePaid.toLocaleString()} Tsh per person
        </div>
      </div>
    </div>
  </div>
);

const StatItem = ({ color, count, label, description }) => {
  const colorClasses = {
    green: "bg-gradient-to-br from-green-500 to-green-600",
    amber: "bg-gradient-to-br from-amber-500 to-amber-600",
    red: "bg-gradient-to-br from-red-500 to-red-600",
    blue: "bg-gradient-to-br from-blue-500 to-blue-600",
  };

  const bgClasses = {
    green: "bg-green-50 border-green-100",
    amber: "bg-amber-50 border-amber-100",
    red: "bg-red-50 border-red-100",
    blue: "bg-blue-50 border-blue-100",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${colorClasses[color]}`}></div>
      <div className={`px-4 py-2 rounded-lg border ${bgClasses[color]}`}>
        <div className="text-sm font-bold text-gray-800">
          {count} <span className="font-semibold">{label}</span>
        </div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </div>
  );
};

const LoadingSkeleton = ({ type = "events" }) => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div
          className={`${
            type === "events" ? "h-16" : "h-20"
          } bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl`}
        ></div>
      </div>
    ))}
  </div>
);

const LoadingSpinner = ({ text }) => (
  <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50">
    <div className="relative">
      <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
      <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-6 text-gray-600 font-medium">{text}</p>
    <p className="text-sm text-gray-400 mt-2">Please wait...</p>
  </div>
);

const EmptyState = ({ icon, title, description, compact = false }) => (
  <div
    className={`flex flex-col items-center justify-center ${
      compact ? "py-8" : "h-full"
    } p-8 bg-gradient-to-b from-white to-gray-50`}
  >
    <div className="text-5xl mb-4 text-gray-300">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
    <p className="text-gray-500 text-center max-w-md">{description}</p>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Contributions = () => {
  const eventsHook = useEvents();
  const contributionsHook = useContributions(eventsHook.selectedEvent);
  const { selectedEvent } = eventsHook;
  const {
    filteredUsers,
    loadingUsers,
    viewMode,
    selectedUsers,
    sendingReminders,
    reminderMessage,
  } = contributionsHook;

  // Default reminder message
  const defaultReminderMessage = useMemo(() => {
    if (!selectedEvent) return "";
    return `Hello! This is a friendly reminder about your contribution for ${
      selectedEvent.name
    }. Target amount: ${selectedEvent.minAmount?.toLocaleString()} Tsh. Please make your payment as soon as possible. Thank you!`;
  }, [selectedEvent]);

  // Initialize reminder message
  useEffect(() => {
    if (selectedEvent && !reminderMessage) {
      contributionsHook.setReminderMessage(defaultReminderMessage);
    }
  }, [selectedEvent, defaultReminderMessage, reminderMessage]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalUsers = contributionsHook.users.length;
    const totalPaid = contributionsHook.users.reduce(
      (sum, user) => sum + user.paidAmount,
      0
    );
    const minAmount = selectedEvent?.minAmount || 0;

    const paidUsers = contributionsHook.users.filter(
      (u) => u.paidAmount >= minAmount
    );
    const partialUsers = contributionsHook.users.filter(
      (u) => u.paidAmount > 0 && u.paidAmount < minAmount
    );
    const unpaidUsers = contributionsHook.users.filter(
      (u) => u.paidAmount <= 0
    );

    const completionRate =
      totalUsers > 0 ? (paidUsers.length / totalUsers) * 100 : 0;
    const amountProgress = minAmount > 0 ? (totalPaid / minAmount) * 100 : 0;

    return {
      totalUsers,
      totalPaid,
      paidCount: paidUsers.length,
      partialCount: partialUsers.length,
      unpaidCount: unpaidUsers.length,
      completionRate,
      amountProgress,
      averagePaid: totalUsers > 0 ? totalPaid / totalUsers : 0,
    };
  }, [contributionsHook.users, selectedEvent]);

  useEffect(() => {
    eventsHook.fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      contributionsHook.fetchContributions(selectedEvent._id);
    }
  }, [selectedEvent]);

  const updateInput = useCallback((id, value) => {
    contributionsHook.setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, inputAmount: value } : user
      )
    );
    contributionsHook.setFilteredUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, inputAmount: value } : user
      )
    );
  }, []);

  const handleSave = useCallback(
    async (user) => {
      const amount = Number(user.inputAmount);

      if (!amount || isNaN(amount) || amount <= 0) {
        toast.warning("⚠️ Please enter a valid amount");
        return;
      }

      try {
        await axios.post(`${BASE_URL}/api/contributions/addMchango`, {
          eventId: selectedEvent._id,
          userId: user._id,
          amount,
        });

        toast.success("✅ Payment saved successfully!");
        contributionsHook.fetchContributions(selectedEvent._id);
      } catch (err) {
        console.error("Failed to save payment:", err);
        toast.error("❌ Failed to save payment");
      }
    },
    [selectedEvent]
  );

  const exportToExcel = useCallback(() => {
    if (!selectedEvent || filteredUsers.length === 0) {
      toast.warning("⚠️ No data to export");
      return;
    }

    const data = filteredUsers.map((user) => ({
      "First Name": user.firstName,
      "Second Name": user.secondName,
      "Last Name": user.lastName,
      Email: user.email || "N/A",
      Phone: user.contacts || "N/A",
      "Amount Paid": user.paidAmount,
      "Amount Paid (Tsh)": `${user.paidAmount.toLocaleString()} Tsh`,
      Status:
        user.paidAmount <= 0
          ? "Not Paid"
          : user.paidAmount < (selectedEvent?.minAmount || 0)
          ? "Partial"
          : "Paid",
      "Payment Date": new Date().toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wscols = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
    ];
    ws["!cols"] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contributions");
    XLSX.writeFile(
      wb,
      `${selectedEvent.name}_Contributions_${Date.now()}.xlsx`
    );

    toast.success("📊 Excel file downloaded!");
  }, [selectedEvent, filteredUsers]);

  const exportToPDF = useCallback(() => {
    if (!selectedEvent || filteredUsers.length === 0) {
      toast.warning("⚠️ No data to export");
      return;
    }

    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(`${selectedEvent.name} - Contributions`, pageWidth / 2, 15, {
      align: "center",
    });
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()} | Participants: ${
        filteredUsers.length
      } | Total: ${stats.totalPaid.toLocaleString()} Tsh`,
      pageWidth / 2,
      25,
      { align: "center" }
    );

    const tableData = filteredUsers.map((user) => [
      `${user.firstName} ${user.lastName}`,
      user.contacts || "N/A",
      `${user.paidAmount.toLocaleString()} Tsh`,
      user.paidAmount <= 0
        ? "Not Paid"
        : user.paidAmount < (selectedEvent?.minAmount || 0)
        ? "Partial"
        : "Paid",
    ]);

    doc.autoTable({
      head: [["Participant", "Contact", "Amount Paid", "Status"]],
      body: tableData,
      startY: 40,
      theme: "grid",
      headStyles: {
        fillColor: [31, 41, 55],
        textColor: 255,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { horizontal: 10 },
    });

    doc.save(`${selectedEvent.name}_Contributions_${Date.now()}.pdf`);
    toast.success("📄 PDF report downloaded!");
  }, [selectedEvent, filteredUsers, stats.totalPaid]);

  const sendWhatsAppReminders = useCallback(async () => {
    if (!selectedEvent) {
      toast.error("❌ No event selected");
      return;
    }

    const selectedUsersList = contributionsHook.getSelectedUserDetails();
    if (selectedUsersList.length === 0) {
      toast.warning("⚠️ Please select at least one participant");
      return;
    }

    const usersWithPhones = selectedUsersList.filter((user) => {
      const phone = user.contacts;
      return phone && phone.trim().length > 0 && /^[0-9+\-\s]+$/.test(phone);
    });

    if (usersWithPhones.length === 0) {
      toast.error("❌ Selected users don't have valid phone numbers");
      return;
    }

    const confirmed = window.confirm(
      `Send WhatsApp reminders to ${
        usersWithPhones.length
      } selected participants?\n\nMessage: ${reminderMessage.substring(
        0,
        100
      )}...`
    );

    if (!confirmed) return;

    try {
      contributionsHook.setSendingReminders(true);
      const response = await axios.post(
        `${BASE_URL}/api/contributions/sendReminders`,
        {
          eventId: selectedEvent._id,
          userIds: usersWithPhones.map((u) => u._id),
          message: reminderMessage,
          phoneNumbers: usersWithPhones.map((u) =>
            u.contacts.replace(/\D/g, "")
          ),
        }
      );

      if (response.data.success) {
        toast.success(
          `✅ WhatsApp reminders sent to ${usersWithPhones.length} participants`
        );
        if (response.data.results) {
          const successCount = response.data.results.filter(
            (r) => r.success
          ).length;
          const failedCount = response.data.results.filter(
            (r) => !r.success
          ).length;
          if (failedCount > 0) {
            toast.info(
              `📊 ${successCount} sent successfully, ${failedCount} failed`
            );
          }
        }
      } else {
        toast.error(
          `❌ Failed to send some reminders: ${response.data.message}`
        );
      }
    } catch (err) {
      console.error("Failed to send reminders:", err);
      toast.error("❌ Failed to send WhatsApp reminders");
    } finally {
      contributionsHook.setSendingReminders(false);
    }
  }, [selectedEvent, reminderMessage, contributionsHook]);

  const handleReminderMessageChange = useCallback((e) => {
    contributionsHook.setReminderMessage(e.target.value);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* HEADER */}
      <header className="px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm">
              <FiCreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Contribution Management
              </h1>
              <p className="text-gray-500 text-sm">
                Track and manage event payments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle
              viewMode={viewMode}
              onChange={contributionsHook.setViewMode}
            />
            <button
              onClick={() => eventsHook.fetchEvents()}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span className="font-medium">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Events */}
        <aside className="w-80 border-r border-gray-200 bg-white overflow-y-auto shadow-inner">
          <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                <FiCalendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">Active Events</h2>
                <p className="text-gray-500 text-sm">
                  Select to manage contributions
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            {eventsHook.loadingEvents ? (
              <LoadingSkeleton type="events" />
            ) : eventsHook.events.length === 0 ? (
              <EmptyState
                icon="📅"
                title="No Open Events"
                description="Create an event to get started"
                compact
              />
            ) : (
              <div className="space-y-3">
                {eventsHook.events.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    isSelected={selectedEvent?._id === event._id}
                    onClick={() => eventsHook.setSelectedEvent(event)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="flex-1 overflow-hidden bg-white">
          {!selectedEvent ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                icon="📊"
                title="No Event Selected"
                description="Select an event from the left panel to manage contributions"
              />
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* TOP BAR */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-sm">
                        <FiCreditCard className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {selectedEvent.name}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                          Manage contributions for this event
                        </p>
                      </div>
                    </div>

                    {/* Progress indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <ProgressIndicator
                          label="Amount Progress"
                          value={stats.amountProgress}
                          color="indigo"
                        />
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <ProgressIndicator
                          label="Completion Rate"
                          value={stats.completionRate}
                          color="green"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FiUsers className="text-gray-500" />
                        <span className="font-semibold">
                          {stats.totalUsers} participants
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-green-700">
                        <FiDollarSign className="text-green-600" />
                        <span className="font-bold text-lg">
                          {stats.totalPaid.toLocaleString()} Tsh
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-gray-100 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium">
                            <span className="font-bold text-gray-800">
                              {filteredUsers.length}
                            </span>{" "}
                            shown
                          </p>
                        </div>
                        {selectedUsers.size > 0 && (
                          <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg font-semibold border border-blue-200">
                            {selectedUsers.size} selected
                          </div>
                        )}
                      </div>
                      <ExportButtons
                        onExportExcel={exportToExcel}
                        onExportPDF={exportToPDF}
                        disabled={filteredUsers.length === 0}
                      />
                    </div>
                  </div>
                </div>

                {/* SEARCH AND FILTERS */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <SearchBar
                      value={contributionsHook.searchQuery}
                      onChange={contributionsHook.handleSearch}
                      resultCount={filteredUsers.length}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <FilterTabs
                      activeFilter={contributionsHook.activeFilter}
                      onChange={contributionsHook.handleFilterChange}
                    />
                    <QuickStats stats={stats} />
                  </div>
                </div>

                {/* REMINDER SECTION */}
                <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <FiMessageSquare className="text-blue-600" size={18} />
                        <h3 className="font-bold text-gray-800">
                          Send WhatsApp Reminders
                        </h3>
                        <span className="text-sm font-semibold text-indigo-700">
                          ({selectedUsers.size} selected)
                        </span>
                      </div>
                      <textarea
                        value={reminderMessage}
                        onChange={handleReminderMessageChange}
                        placeholder="Enter your reminder message here..."
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={contributionsHook.toggleSelectAll}
                        className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200 border border-gray-300"
                      >
                        {selectedUsers.size ===
                        stats.unpaidCount + stats.partialCount ? (
                          <FiCheckSquare className="text-green-600" />
                        ) : (
                          <FiSquare className="text-gray-400" />
                        )}
                        <span className="font-medium">Select All</span>
                      </button>
                      <button
                        onClick={sendWhatsAppReminders}
                        disabled={selectedUsers.size === 0 || sendingReminders}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-sm hover:shadow"
                      >
                        <FiMessageSquare size={16} />
                        <span className="font-semibold">
                          {sendingReminders ? "Sending..." : "Send Reminders"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 overflow-hidden">
                {loadingUsers ? (
                  <LoadingSpinner text="Loading contributions..." />
                ) : filteredUsers.length === 0 ? (
                  <EmptyState
                    icon="🔍"
                    title="No participants found"
                    description="Try adjusting your search or filter"
                  />
                ) : viewMode === "compact" ? (
                  <CompactView
                    users={filteredUsers}
                    minAmount={selectedEvent.minAmount}
                    onUpdateInput={updateInput}
                    onSave={handleSave}
                    selectedUsers={selectedUsers}
                    onToggleSelect={contributionsHook.toggleUserSelection}
                  />
                ) : (
                  <div className="h-full flex flex-col">
                    {/* TABLE */}
                    <div className="flex-1 overflow-auto">
                      <div className="min-w-full">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10 shadow-sm">
                            <tr className="border-b border-gray-200">
                              <th className="py-4 px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-14">
                                Select
                              </th>
                              <th className="py-4 px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">
                                Participant
                              </th>
                              <th className="py-4 px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[180px]">
                                Contact Info
                              </th>
                              <th className="py-4 px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[160px]">
                                Amount Paid
                              </th>
                              <th className="py-4 px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[120px]">
                                Status
                              </th>
                              <th className="py-4 px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">
                                New Payment
                              </th>
                              <th className="py-4 px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[120px]">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map((user, index) => (
                              <UserRow
                                key={user.id}
                                user={user}
                                index={index}
                                minAmount={selectedEvent.minAmount}
                                onUpdateInput={updateInput}
                                onSave={handleSave}
                                selectedUsers={selectedUsers}
                                onToggleSelect={
                                  contributionsHook.toggleUserSelection
                                }
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <TableFooter stats={stats} />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Contributions;