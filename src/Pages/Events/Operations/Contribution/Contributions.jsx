import { useEffect, useState } from "react";
import axios from "axios";

//API
import BASE_URL from "../../../../Utils/config";

const Contributions = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch OPEN events
  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/events/getEvents`);
      const openEvents = res.data.data.filter((e) => e.status === "open");
      setEvents(openEvents);
    } catch (err) {
      console.error("Error loading events", err);
    }
  };

  // Fetch all users + contributions for selected event
  const fetchContributions = async (eventId) => {
    try {
      setLoadingUsers(true);
      const res = await axios.get(
        `${BASE_URL}/api/contributions/event/${eventId}`
      );
      setUsersData(res.data); // contains all users + promised + paid
    } catch (err) {
      console.error("Error loading event contributions", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchContributions(selectedEvent._id);
    }
  }, [selectedEvent]);

  // Submit promised amount (one time)
  const handleSetPromised = async (userId, promisedAmount) => {
    if (!promisedAmount || isNaN(promisedAmount)) return;

    try {
      await axios.post(`${BASE_URL}/api/contributions/setPromised`, {
        eventId: selectedEvent._id,
        userId,
        promisedAmount: parseFloat(promisedAmount),
      });

      fetchContributions(selectedEvent._id);
    } catch (err) {
      console.error("Error setting promised amount", err);
      alert(err.response?.data?.message || "Error setting promised amount");
    }
  };

  // Submit paid amount
  const handleAddPaid = async (userId, amount) => {
    if (!amount || isNaN(amount)) return;

    try {
      await axios.post(`${BASE_URL}/api/contributions/addAmount`, {
        eventId: selectedEvent._id,
        userId,
        paidAmount: parseFloat(amount),
      });

      fetchContributions(selectedEvent._id);
    } catch (err) {
      console.error("Error adding paid amount", err);
      alert(err.response?.data?.message || "Error adding payment");
    }
  };

  // Update local input field
  const updateUserInput = (userId, field, value) => {
    setUsersData(prev => 
      prev.map(user => 
        user.userId === userId 
          ? { ...user, [field]: value }
          : user
      )
    );
  };

  return (
    <div className="w-full h-full p-5 flex gap-5">
      {/* LEFT SECTION — Events */}
      <div className="w-[25%] bg-white rounded-xl shadow p-4 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Events</h2>

        {events.map((event) => (
          <div
            key={event._id}
            onClick={() => setSelectedEvent(event)}
            className={`p-4 rounded-lg shadow cursor-pointer transition mt-4
              ${selectedEvent?._id === event._id ? "bg-blue-100" : "bg-gray-100 hover:bg-gray-200"}
            `}
          >
            <h3 className="text-lg font-semibold">{event.name}</h3>
            <p className="text-sm text-gray-600">Minimum: {event.minAmount?.toLocaleString()} Tsh</p>
          </div>
        ))}
      </div>

      {/* RIGHT SECTION — Users Contributions */}
      <div className="w-[75%] bg-white rounded-xl shadow p-4 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">
          {selectedEvent ? selectedEvent.name : "Select Event"}
        </h2>

        {!selectedEvent ? (
          <p className="text-gray-500 italic">Click an event to view contributions</p>
        ) : loadingUsers ? (
          <p className="text-gray-500 italic">Loading...</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">User Name</th>
                <th className="p-2 text-left">Promised Amount</th>
                <th className="p-2 text-left">Payment</th>
                <th className="p-2 text-left">Remaining</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {usersData.map((user) => {
                const promised = user.promisedAmount || 0;
                const paid = user.paidAmount || 0;
                const remain = promised - paid;
                const finished = remain <= 0 && promised > 0;

                return (
                  <tr key={user.userId} className="border-b hover:bg-gray-50">
                    {/* USER NAME */}
                    <td className="p-2">{user.name}</td>

                    {/* PROMISED AMOUNT */}
                    <td className="p-2">
                      {promised > 0 ? (
                        <span className="font-medium">
                          {promised.toLocaleString()} Tsh
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="Enter amount"
                            className="border p-1 rounded w-[110px]"
                            value={user._promisedInput || ""}
                            onChange={(e) => updateUserInput(user.userId, "_promisedInput", e.target.value)}
                          />
                          <button
                            className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                            onClick={() => {
                              handleSetPromised(user.userId, user._promisedInput);
                            }}
                            disabled={!user._promisedInput}
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </td>

                    {/* PAID AMOUNT */}
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="0"
                          className="border p-1 rounded w-[110px]"
                          disabled={!promised || finished}
                          value={user._paidInput || ""}
                          onChange={(e) => updateUserInput(user.userId, "_paidInput", e.target.value)}
                        />

                        <button
                          className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          onClick={() => {
                            handleAddPaid(user.userId, user._paidInput);
                          }}
                          disabled={!user._paidInput || !promised || finished}
                        >
                          Pay
                        </button>
                      </div>

                      {paid > 0 && (
                        <span className="text-xs text-gray-500 block mt-1">
                          Total Paid: {paid.toLocaleString()} Tsh
                        </span>
                      )}
                    </td>

                    {/* REMAINING AMOUNT */}
                    <td className="p-2">
                      {promised > 0 ? (
                        <span
                          className={`font-semibold ${
                            finished ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {remain <= 0
                            ? "Completed"
                            : `${remain.toLocaleString()} Tsh`}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="p-2">
                      {finished ? (
                        <span className="text-green-600 font-semibold">✔ Finished</span>
                      ) : promised > 0 ? (
                        <span className="text-orange-500 text-sm">In progress</span>
                      ) : (
                        <span className="text-gray-500 text-sm">Not started</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Contributions;