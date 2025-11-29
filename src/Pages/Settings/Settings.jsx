
import { useState } from "react";
import { useSelector } from "react-redux";
import SettingsList from "./SettingsList";

import Users from "./Users/Users";


const Settings = () => {

   const [selectedSetting, setSelectedSetting] = useState(null);
  const users = useSelector((state) => state.users.users);


  return (
    <section className="h-[90vh] flex flex-col md:flex-row gap-3 pt-24 px-4 overflow-hidden">
      {/* Left Section - User Setup */}
      <div className="w-full md:w-1/5 bg-secondary rounded-xl p-6 shadow-md overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Settings</h2>

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


        {users?.roles?.canAccessUsers && (
          <SettingsList
            title="User Aministration"
            settings={["All Users", "Roles & Permissions", "Activity Logs"]}
            selectedSetting={selectedSetting}
            handleSelect={setSelectedSetting}
          />
        )}
      </div>

      {/* Right Section - Display Content */}
      <div className="w-full md:w-4/5 bg-secondary rounded-xl p-6 shadow-md text-white overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Selected Report:</h2>
        {selectedSetting === "All Users" ? (
          <Users/>
        )  : (
          <div className="flex flex-col items-center justify-center h-full">
            <img
              src='https://www.svgrepo.com/show/331488/folder-open.svg'
              alt="No report selected"
              className="object-contain opacity-20"
            />
            <p className="text-lg text-gray-300">No report selected</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Settings