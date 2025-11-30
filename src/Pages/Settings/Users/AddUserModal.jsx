import axios from "axios";
import { useState } from "react";
import { X, Upload, User, Mail, Phone, MapPin, Calendar, Lock, Eye, EyeOff } from "lucide-react";

//API
import BASE_URL from "../../../Utils/config.js";

const AddUserModal = ({ showModal, setShowModal, onUserAdded }) => {
  const [newUser, setNewUser] = useState({
    firstName: "",
    secondName: "",
    lastName: "",
    userName: "",
    dateOfBirth: "",
    gender: "",
    email: "",
    contacts: "",
    address: "",
    title: "",
    photo: null,
    roles: {
      canAddUsers: false,
      canEditViewReports: false,
      canSeeReports: false,
      canAccessSettings: false,
      canMakeTransaction: false,
      canAccessUserManagement: false,
    },
    password: "",
  });

  const [showError, setShowError] = useState("");
  const [file, setFile] = useState();
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setNewUser((prevUser) => ({
      ...prevUser,
      roles: {
        ...prevUser.roles,
        [name]: checked,
      },
    }));
  };

  const handleAddNewUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("firstName", newUser.firstName);
      formData.append("secondName", newUser.secondName);
      formData.append("lastName", newUser.lastName);
      formData.append("userName", newUser.userName);
      formData.append("dateOfBirth", newUser.dateOfBirth);
      formData.append("gender", newUser.gender);
      formData.append("email", newUser.email);
      formData.append("contacts", newUser.contacts);
      formData.append("title", newUser.title);
      formData.append("address", newUser.address);
      formData.append("file", file);
      formData.append("roles", JSON.stringify(newUser.roles));
      formData.append("password", newUser.password);

      await axios.post(`${BASE_URL}/api/auth/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNewUser({
        firstName: "",
        secondName: "",
        lastName: "",
        userName: "",
        dateOfBirth: "",
        gender: "",
        email: "",
        contacts: "",
        address: "",
        title: "",
        photo: "",
        roles: {
          canAddUsers: false,
          canEditViewReports: false,
          canSeeReports: false,
          canAccessSettings: false,
          canMakeTransaction: false,
          canAccessUserManagement: false,
        },
        password: "",
      });
      setFile(null);
      setPhotoPreview(null);
      setShowModal(false);
      onUserAdded();
    } catch (error) {
      if (error.response && error.response.data) {
        setShowError(
          error.response.data.error ||
            "Failed to create user. Please check the information."
        );
      } else {
        setShowError("An error occurred. Please Contact System Administrator.");
      }
      console.error("User creation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showModal) return null;

  return (
<div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 overflow-y-auto">
  <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-7xl my-8 overflow-hidden transform transition-all border border-white/20">
    {/* Header */}
    <div className="bg-gradient-to-r from-[#dee1fc]/90 to-[#c7ccff]/90 backdrop-blur-sm px-6 py-4 border-b border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/80 rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-[#4f46e5]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
            <p className="text-sm text-gray-700">Create a new user account with roles and permissions</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(false)}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors duration-200"
        >
          <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
        </button>
      </div>
    </div>

    {/* Horizontal Layout */}
    <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
      <form onSubmit={handleAddNewUser} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Personal & Contact Info */}
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-[#dee1fc] pl-3">
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "firstName", label: "First Name", icon: User },
                  { name: "secondName", label: "Second Name", icon: User },
                  { name: "lastName", label: "Last Name", icon: User },
                  { name: "userName", label: "Username", icon: User },
                  { name: "title", label: "Title", icon: User },
                ].map(({ name, label, icon: Icon }) => (
                  <div key={name} className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-800">
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </label>
                    <input
                      type="text"
                      name={name}
                      value={newUser[name]}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dee1fc] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-600"
                      placeholder={`Enter ${label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-800">
                    <Calendar className="w-4 h-4 mr-2" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={newUser.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dee1fc] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-800">
                    <User className="w-4 h-4 mr-2" />
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={newUser.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dee1fc] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900"
                  >
                    <option value="">Select Gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-[#dee1fc] pl-3">
                Contact Information
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-800">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dee1fc] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-600"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-800">
                    <Phone className="w-4 h-4 mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="contacts"
                    value={newUser.contacts}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dee1fc] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-600"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-800">
                    <MapPin className="w-4 h-4 mr-2" />
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={newUser.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dee1fc] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-600"
                    placeholder="Enter full address"
                  />
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-[#dee1fc] pl-3">
                Security
              </h3>
              
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-800">
                  <Lock className="w-4 h-4 mr-2" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={newUser.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dee1fc] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-600 pr-12"
                    placeholder="Enter secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Photo & Permissions */}
          <div className="space-y-6">
            {/* Photo Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-[#dee1fc] pl-3">
                Profile Photo
              </h3>
              
              <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300/80">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-xl object-cover border-2 border-[#dee1fc]"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                <label className="flex items-center justify-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg hover:border-[#dee1fc] hover:bg-[#dee1fc]/20 transition-all duration-200 cursor-pointer">
                  <Upload className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Choose Profile Photo</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </label>
              </div>
            </div>

            {/* Roles and Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-[#dee1fc] pl-3">
                Roles & Permissions
              </h3>
              
              <div className="space-y-3">
                {[
                  "canAddUsers",
                  "canEditViewReports",
                  "canSeeReports",
                  "canAccessSettings",
                  "canMakeTransaction",
                  "canAccessUserManagement",
                ].map((role) => (
                  <label
                    key={role}
                    className="flex items-center justify-between p-4 bg-gray-50/80 backdrop-blur-sm hover:bg-gray-100/80 rounded-lg transition-all duration-200 cursor-pointer group"
                  >
                    <span className="text-sm font-medium text-gray-800 capitalize">
                      {role.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={role}
                        checked={newUser.roles[role]}
                        onChange={handleCheckboxChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#dee1fc] peer-checked:border-[#dee1fc]" />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {showError && (
              <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <X className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{showError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-300/50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#dee1fc] to-[#c7ccff] rounded-lg hover:from-[#c7ccff] hover:to-[#b3b9ff] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#dee1fc] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#dee1fc]/25"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating User...</span>
                  </div>
                ) : (
                  "Create User"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</div>
  );
};

export default AddUserModal;