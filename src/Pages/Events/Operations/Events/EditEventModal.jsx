import { useState, useEffect } from "react";
import {
  X,
  Upload,
  Calendar,
  FileText,
  User,
  DollarSign,
  Clock,
} from "lucide-react";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { TextField } from "@mui/material";
import axios from "axios";

//API URL
import BASE_URL from "../../../../Utils/config";

const EditEventModal = ({ showModal, setShowModal, onEventUpdated, event }) => {
  const [showError, setShowError] = useState("");
  const [file, setFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const [editEvent, setEditEvent] = useState({
    name: "",
    description: "",
    associatedPerson: "",
    startDate: null,
    endDate: null,
    minAmount: "",
    status: "open",
  });

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/users/AllUsers`);
        setUsers(res.data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };

    if (showModal) {
      fetchUsers();
    }
  }, [showModal]);

  useEffect(() => {
    if (event) {
      setEditEvent({
        name: event.name || "",
        description: event.description || "",
        associatedPerson: event.associatedPerson || "",
        startDate: event.startDate ? dayjs(event.startDate) : null,
        endDate: event.endDate ? dayjs(event.endDate) : null,
        minAmount: event.minAmount || "",
        status: event.status || "open",
      });

      if (event.photo) {
        setPhotoPreview(`${BASE_URL}/uploads/${event.photo}`);
      }
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditEvent((prev) => ({ ...prev, [name]: value }));
    if (showError) setShowError("");
  };

  const handleStartTimeChange = (date) => {
    setEditEvent((prev) => ({
      ...prev,
      startDate: date,
    }));

    // If end time is before the new start time, update end time too
    if (editEvent.endDate && date && date.isAfter(editEvent.endDate)) {
      setEditEvent((prev) => ({
        ...prev,
        endDate: date.add(1, "hour"),
      }));
    }
  };

  const handleEndTimeChange = (date) => {
    setEditEvent((prev) => ({ ...prev, endDate: date }));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      // Validate file type
      if (!selected.type.startsWith("image/")) {
        setShowError("Please select an image file");
        return;
      }

      // Validate file size (5MB max)
      if (selected.size > 5 * 1024 * 1024) {
        setShowError("Image size should be less than 5MB");
        return;
      }

      setFile(selected);
      setPhotoPreview(URL.createObjectURL(selected));
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPhotoPreview(null);
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required fields
    if (!editEvent.name.trim()) {
      setShowError("Event name is required");
      setIsLoading(false);
      return;
    }

    if (!editEvent.startDate || !editEvent.endDate) {
      setShowError("Please select both start and end time");
      setIsLoading(false);
      return;
    }

    if (editEvent.endDate.isBefore(editEvent.startDate)) {
      setShowError("End time cannot be before start time");
      setIsLoading(false);
      return;
    }

    if (!editEvent.associatedPerson) {
      setShowError("Please select an associated user");
      setIsLoading(false);
      return;
    }

    try {
      const eventData = {
        name: editEvent.name.trim(),
        description: editEvent.description.trim(),
        associatedPerson: editEvent.associatedPerson,
        startDate: editEvent.startDate.toISOString(),
        endDate: editEvent.endDate.toISOString(),
        minAmount: parseFloat(editEvent.minAmount) || 0,
        status: editEvent.status,
      };

      await axios.put(
        `${BASE_URL}/api/events/editEvent/${event._id}`,
        eventData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      setShowModal(false);
      onEventUpdated();
    } catch (error) {
      setShowError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update event. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setShowError("");
    setFile(null);
  };

  if (!showModal) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#dee1fc] to-[#c7ccff] px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/90 rounded-xl flex items-center justify-center shadow-sm">
                  <Calendar className="w-7 h-7 text-[#4f46e5]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Edit Event
                  </h2>
                  <p className="text-sm text-gray-700 mt-1">
                    Update event details
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2.5 hover:bg-white/60 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <X className="w-5 h-5 text-gray-600 hover:text-gray-800" />
              </button>
            </div>
          </div>

          {/* Form - Horizontal Layout */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleEditEvent} className="p-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Event Name */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2.5">
                      <FileText className="w-4 h-4 mr-2 text-[#4f46e5]" />
                      Event Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editEvent.name}
                      onChange={handleChange}
                      placeholder="Enter event name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#dee1fc] focus:border-[#dee1fc] transition-all duration-200 bg-white"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2.5">
                      <FileText className="w-4 h-4 mr-2 text-[#4f46e5]" />
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={editEvent.description}
                      onChange={handleChange}
                      placeholder="Describe your event..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#dee1fc] focus:border-[#dee1fc] transition-all duration-200 resize-none bg-white"
                      rows={4}
                      required
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2.5">
                        <Calendar className="w-4 h-4 mr-2 text-[#4f46e5]" />
                        Start Date & Time *
                      </label>
                      <DateTimePicker
                        value={editEvent.startDate}
                        onChange={handleStartTimeChange}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            placeholder="Select start time"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                backgroundColor: "white",
                                "&:hover fieldset": {
                                  borderColor: "#dee1fc",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "#dee1fc",
                                  borderWidth: "2px",
                                },
                              },
                            }}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2.5">
                        <Calendar className="w-4 h-4 mr-2 text-[#4f46e5]" />
                        End Date & Time *
                      </label>
                      <DateTimePicker
                        value={editEvent.endDate}
                        onChange={handleEndTimeChange}
                        minDateTime={editEvent.startDate}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            placeholder="Select end time"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                backgroundColor: "white",
                                "&:hover fieldset": {
                                  borderColor: "#dee1fc",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "#dee1fc",
                                  borderWidth: "2px",
                                },
                              },
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Associated User */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2.5">
                      <User className="w-4 h-4 mr-2 text-[#4f46e5]" />
                      Associated User *
                    </label>
                    <select
                      name="associatedPerson"
                      value={editEvent.associatedPerson}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#dee1fc] focus:border-[#dee1fc] transition-all duration-200 bg-white"
                      required
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount & Status - Side by Side */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2.5">
                        <DollarSign className="w-4 h-4 mr-2 text-[#4f46e5]" />
                        Min Amount *
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="number"
                          name="minAmount"
                          value={editEvent.minAmount}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#dee1fc] focus:border-[#dee1fc] transition-all duration-200 bg-white"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2.5">
                        <FileText className="w-4 h-4 mr-2 text-[#4f46e5]" />
                        Status *
                      </label>
                      <select
                        name="status"
                        value={editEvent.status}
                        onChange={handleChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#dee1fc] focus:border-[#dee1fc] transition-all duration-200 bg-white"
                        required
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                      <Upload className="w-4 h-4 mr-2 text-[#4f46e5]" />
                      Event Image (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 bg-gray-50/50 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex flex-col items-center text-center">
                        {photoPreview ? (
                          <div className="relative mb-3">
                            <img
                              src={photoPreview}
                              alt="Preview"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-300 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-all duration-200 hover:scale-110 shadow-md"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-3">
                            <Upload className="w-8 h-8 text-gray-400" />
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Update event image
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            PNG, JPG up to 5MB
                          </p>
                          <label className="cursor-pointer">
                            <div className="px-5 py-2.5 bg-[#dee1fc] hover:bg-[#c7ccff] text-gray-900 rounded-lg transition-all duration-200 font-medium text-sm inline-flex items-center gap-2 hover:shadow-sm">
                              <Upload className="w-4 h-4" />
                              Choose File
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {showError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <X className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">
                            {showError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-7 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium hover:shadow-sm"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-7 py-3 rounded-xl bg-[#dee1fc] hover:bg-[#c7ccff] text-gray-900 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4" />
                          Update Event
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default EditEventModal;
