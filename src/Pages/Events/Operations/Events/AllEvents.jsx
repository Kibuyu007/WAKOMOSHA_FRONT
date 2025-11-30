import { useEffect, useState } from "react";
import axios from "axios";

// Icons
import { FaSearch, FaEdit } from "react-icons/fa";
import { BsToggleOff, BsToggleOn } from "react-icons/bs";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

// API
import BASE_URL from "../../../../Utils/config.js";

// Modals
import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";
import Loading from "../../../../Components/Loading.jsx";

const AllEvents = () => {
  // State
  const [events, setEvents] = useState([]);
  const [showError, setShowError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5;

  // Modals
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [modifiedEvent, setModifiedEvent] = useState(null);

  // Fetch events from backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/events/getEvents`);
      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data.data); // data.data because backend returns { success, data }
      setIsLoading(false);
      setShowError("");
    } catch (error) {
      setShowError(
        error.message || "Failed to fetch events. Contact System Administrator."
      );
      setIsLoading(false);
      console.error(error);
    }
  };

  // Toggle event status (open/closed)
  const toggleEventStatus = async (eventId, currentStatus) => {
    try {
      if (currentStatus === "closed") return; // Closed events cannot be reopened

      const response = await axios.put(`${BASE_URL}/api/events/${eventId}/close`);

      if (response.status === 200) {
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event._id === eventId ? { ...event, status: "closed" } : event
          )
        );
      }
    } catch (error) {
      console.error("Error updating event status:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter & search
  const filteredEvents = events.filter(
    (event) =>
      (filterStatus === "All" || event.status === filterStatus) &&
      (event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="sm:px-6 w-full h-[85vh] overflow-y-auto">
      {/* Title */}
      <div className="px-4 md:px-10 py-4 md:py-7">
        <div className="flex items-center justify-between">
          <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">
            EVENTS
          </p>
        </div>
      </div>

      {/* Filters & Add */}
      <div className="sm:flex items-center justify-between ml-9 mb-4">
        <div className="flex items-center mb-2 sm:mb-0">
          {["All", "open", "closed"].map((status) => (
            <button
              key={status}
              className={`rounded-full py-2 px-8 mx-2 ${
                filterStatus === status
                  ? "bg-[#dee1fc] text-black"
                  : "bg-gray-200 text-gray-600"
              } hover:text-black hover:bg-indigo-100 border-gray-400`}
              onClick={() => {
                setFilterStatus(status);
                setCurrentPage(1);
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="hidden sm:flex items-center bg-gray-100 rounded-[30px] px-3 sm:px-4 py-1 sm:py-2 w-full max-w-[300px] border border-gray-400">
          <FaSearch className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-black" />
          <input
            type="text"
            placeholder="Search events..."
            className="bg-transparent outline-none px-2 py-1 w-full text-black"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <button
          onClick={() => setShowModalAdd(true)}
          className="ml-4 mt-4 sm:mt-0 inline-flex items-center justify-center px-6 py-3 bg-[#dee1fc] hover:bg-gray-200 focus:outline-none rounded"
        >
          <p className="text-sm font-medium text-black">+ Add Event</p>
        </button>
      </div>

      {/* Error Message */}
      {showError && (
        <div className="mt-2 bg-red-100/70 border border-red-200 text-sm text-red-800 rounded-lg p-4">
          <span className="font-bold">Error: </span>
          {showError}
        </div>
      )}

      {/* Loading */}
      <Loading isLoading={isLoading} message="Loading Events..." />

      {/* Event Table */}
      <div className="mt-7 overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-gray-200 text-black">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">SN</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Event Name</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Change Status</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
 <tr className="h-3" />
          <tbody>
            {currentEvents.map((event, index) => (

              <>
              <tr
                key={event._id}
                className="focus:outline-none h-16 border-gray-500 shadow-md bg-gray-100"
              >
                <td className="pl-5 font-bold">
                  <p className="text-sm text-gray-600">{indexOfFirstEvent + index + 1}</p>
                </td>

                <td className="pl-4 font-bold">
                  <p className="text-sm text-gray-600">{event.name}</p>
                </td>

                <td className="pl-5 font-bold">
                  <p className="text-sm text-gray-600 truncate max-w-xs">{event.description}</p>
                </td>

                <td className="pl-5 font-bold text-center">
                  <span
                    className={`py-2 px-3 text-sm rounded-full ${
                      event.status === "open"
                        ? "text-green-800 bg-green-100"
                        : "text-red-800 bg-red-100"
                    }`}
                  >
                    {event.status}
                  </span>
                </td>

                <td className="pl-5">
                  <button
                    className="focus:ring-1 focus:ring-offset-2 focus:ring-red-300 text-sm text-gray-600 py-2 px-4 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none"
                    onClick={() => toggleEventStatus(event._id, event.status)}
                    disabled={event.status === "closed"}
                  >
                    {event.status === "open" ? <BsToggleOn size={20} /> : <BsToggleOff size={20} />}
                  </button>
                </td>

                <td className="pl-4 gap-2 font-bold">
                  <button
                    onClick={() => {
                      setShowModalEdit(true);
                      setModifiedEvent(event);
                    }}
                    className="focus:ring-1 focus:ring-offset-2 focus:ring-blue-300 text-sm text-gray-600 py-2 px-4 bg-gray-200 rounded hover:bg-gray-100 focus:outline-none"
                  >
                    <FaEdit size={20} />
                  </button>
                </td>
              </tr>

               <tr className="h-4" />
              </>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white py-3 sm:px-6">
          <p className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">{indexOfFirstEvent + 1}</span> to{" "}
            <span className="font-medium">{Math.min(indexOfLastEvent, filteredEvents.length)}</span> of{" "}
            <span className="font-medium">{filteredEvents.length}</span> Events
          </p>

          <nav aria-label="Pagination" className="inline-flex -space-x-px rounded-md shadow-xs">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`px-2 py-2 text-gray-400 border ring-1 ring-gray-300 rounded-l-md hover:bg-gray-50 ${
                currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <IoIosArrowBack size={20} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 text-sm font-semibold text-gray-900 border ring-1 ring-gray-300 hover:bg-gray-50 ${
                  currentPage === page ? "bg-[#dee1fc] text-black" : ""
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`px-2 py-2 text-gray-400 border ring-1 ring-gray-300 rounded-r-md hover:bg-gray-50 ${
                currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <IoIosArrowForward size={20} />
            </button>
          </nav>
        </div>

        {/* Modals */}
        <AddEventModal
          showModal={showModalAdd}
          setShowModal={setShowModalAdd}
          onEventAdded={fetchData}
        />

        <EditEventModal
          showModal={showModalEdit}
          setShowModal={setShowModalEdit}
          onEventUpdated={fetchData}
          event={modifiedEvent}
        />
      </div>
    </div>
  );
};

export default AllEvents;
