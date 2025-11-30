import axios from "axios";
import { useState, useEffect } from "react";
import {
  X,
  Upload,
  User,
  Calendar,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { TextField } from "@mui/material";

//API
import BASE_URL from "../../../../Utils/config.js";

const AddEventModal = ({ showModal, setShowModal, onEventAdded }) => {
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    status: "open",
    startDate: null,
    endDate: null,
    minAmount: "",
    associatedPerson: "",
    file: null,
  });

  const [file, setFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [users, setUsers] = useState([]);
  const [showError, setShowError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users for select dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/users/AllUsers`);
        setUsers(res.data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartTimeChange = (date) => {
    setNewEvent((prev) => ({
      ...prev,
      startDate: date,
    }));

    // If end time is before the new start time, update end time too
    if (newEvent.endDate && date && date.isAfter(newEvent.endDate)) {
      setNewEvent((prev) => ({
        ...prev,
        endDate: date.add(1, "hour"),
      }));
    }
  };

  const handleEndTimeChange = (date) => {
    setNewEvent((prev) => ({ ...prev, endDate: date }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPhotoPreview(URL.createObjectURL(selectedFile));
    }
  };

  // Frontend - Update your handleAddNewEvent function
  const handleAddNewEvent = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate dates
    if (!newEvent.startDate || !newEvent.endDate) {
      setShowError("Please select both start and end time");
      setIsLoading(false);
      return;
    }

    if (newEvent.endDate.isBefore(newEvent.startDate)) {
      setShowError("End time cannot be before start time");
      setIsLoading(false);
      return;
    }

    try {
      // Send as JSON instead of FormData
      const eventData = {
        name: newEvent.name,
        associatedPerson: newEvent.associatedPerson, // Match backend field
        description: newEvent.description,
        startDate: newEvent.startDate.toISOString(), // Match backend field
        endDate: newEvent.endDate.toISOString(), // Match backend field
        status: newEvent.status,
        minAmount: newEvent.minAmount,
      };

      await axios.post(`${BASE_URL}/api/events/addEvent`, eventData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      setNewEvent({
        name: "",
        description: "",
        status: "open",
        startDate: null,
        endDate: null,
        minAmount: "",
        associatedPerson: "",
        file: null,
      });
      setFile(null);
      setPhotoPreview(null);
      setShowModal(false);
      setShowError("");
      onEventAdded();
    } catch (error) {
      if (error.response && error.response.data) {
        setShowError(
          error.response.data.error ||
            "Failed to create event. Please check the information."
        );
      } else {
        setShowError(
          "An error occurred. Please contact the system administrator."
        );
      }
      console.error("Event creation failed", error);
    } finally {
      setIsLoading(false);
    }
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
                    Create New Event
                  </h2>
                  <p className="text-sm text-gray-700 mt-1">
                    Fill in the event details below
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2.5 hover:bg-white/60 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <X className="w-5 h-5 text-gray-600 hover:text-gray-800" />
              </button>
            </div>
          </div>

          {/* Form - Horizontal Layout */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleAddNewEvent} className="p-6">
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
                      value={newEvent.name}
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
                      value={newEvent.description}
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
                        value={newEvent.startDate}
                        onChange={handleStartTimeChange}
                        minDateTime={dayjs()}
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
                        value={newEvent.endDate}
                        onChange={handleEndTimeChange}
                        minDateTime={newEvent.startDate || dayjs()}
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
                      value={newEvent.associatedPerson}
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
                        <input
                          type="number"
                          name="minAmount"
                          value={newEvent.minAmount}
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
                        value={newEvent.status}
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
                              onClick={() => {
                                setFile(null);
                                setPhotoPreview(null);
                              }}
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
                            Upload event image
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
                      onClick={() => setShowModal(false)}
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
                          Creating...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4" />
                          Create Event
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

export default AddEventModal;
