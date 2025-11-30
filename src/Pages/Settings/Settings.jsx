import { useState } from "react";
import { useSelector } from "react-redux";
import SettingsList from "./SettingsList";
import Users from "./Users/Users";
import AllEvents from "../Events/Operations/Events/AllEvents";

const Settings = () => {
  const [selectedSetting, setSelectedSetting] = useState(null);
  const users = useSelector((state) => state.user.user);

  return (
    <section className="h-[90vh] flex flex-col md:flex-row gap-3 pt-24 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 overflow-hidden mt-2">
      {/* Left Section - User Setup */}
      <div className="flex-1 md:flex-[2] bg-white rounded-xl p-4 sm:p-6 shadow-md text-black overflow-y-auto max-h-[80vh] scrollbar-hide">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Settings
        </h2>

        <div className="relative space-y-4">
          {/* Event Management Card */}
          <div className="bg-[#dee1fc] rounded-2xl p-4 shadow-xl border border-blue-300/30">
            <SettingsList
              title="Event Management"
              settings={[
                {
                  group: "Event Configurations",
                  items: ["All Events", "Integrations", "Notifications"],
                },
              ]}
              selectedSetting={selectedSetting}
              handleSelect={setSelectedSetting}
            />
          </div>

          {/* User Administration Card */}
          {users?.roles?.canAddUsers && (
            <div className="bg-[#dee1fc] rounded-2xl p-4 shadow-xl border border-blue-300/30">
              <SettingsList
                title="User Administration"
                settings={["All Users", "Roles & Permissions", "Activity Logs"]}
                selectedSetting={selectedSetting}
                handleSelect={setSelectedSetting}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Display Content */}
      <div className="w-full md:w-4/5 bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-gray-200/80 hover:border-gray-300/90 transition-all duration-500 overflow-hidden relative sm:p-6 text-black overflow-y-auto max-h-[80vh] scrollbar-hide">
        <div className="relative h-full">
          {selectedSetting === "All Users" ? (
            <div className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
              <Users />
            </div>
          ) : selectedSetting === "All Events" ? (
            <AllEvents />
          ) : (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="relative mb-6">
                <img
                  src="https://www.svgrepo.com/show/331488/folder-open.svg"
                  alt="No report selected"
                  className="object-contain opacity-20 w-32 h-32 transform hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100/30 to-purple-100/30 rounded-full blur-md"></div>
              </div>
              <p className="text-lg text-gray-500 font-light">
                Select a report from the settings panel
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Settings;
