import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";

interface Ticket {
  id: string;
  title: string;
  type: string;
  client: string;
  status: string;
  priority: string;
  resolutionSteps: string;
}

const Home = () => {
  const navigate = useNavigate();

  // Sample data seed (includes title and resolutionSteps for search)
  const [tickets] = useState<Ticket[]>([
    {
      id: "REQ-3105",
      title: "Emergency Generator Maintenance",
      type: "Maintenance",
      client: "Apex Innovations",
      status: "New",
      priority: "High",
      resolutionSteps:
        "Dispatch technician; inspect generator; replace oil; test load.",
    },
    {
      id: "REQ-3104",
      title: "Water leak in main lobby",
      type: "Maintenance",
      client: "Quantum Dynamics",
      status: "New",
      priority: "High",
      resolutionSteps:
        "Shut off valve; place warning signs; call plumber; dry carpets.",
    },
    {
      id: "REQ-2980",
      title: "HVAC Upgrade Proposal",
      type: "Construction",
      client: "Apex Innovations",
      status: "Pending Approval",
      priority: "Medium",
      resolutionSteps: "RFQ to vendors; review bids; approve plan; schedule.",
    },
    {
      id: "REQ-3001",
      title: "Server Room Cooling Failure",
      type: "EH&S",
      client: "Sky Corp Tower",
      status: "In Progress",
      priority: "High",
      resolutionSteps:
        "Escalate to on-call; temporary portable AC; diagnose AHU.",
    },
    {
      id: "REQ-2955",
      title: "Fire Suppression System Test",
      type: "EH&S",
      client: "Quantum Dynamics",
      status: "In Progress",
      priority: "Medium",
      resolutionSteps:
        "Notify occupants; schedule test; log results; reset system.",
    },
    {
      id: "REQ-2850",
      title: "Rooftop Antenna Installation",
      type: "Construction",
      client: "Apex Innovations",
      status: "Pending Approval",
      priority: "Medium",
      resolutionSteps:
        "Engineer review; landlord approval; safety plan; install.",
    },
    {
      id: "REQ-3011",
      title: "Exterior Window Cleaning",
      type: "Other",
      client: "Sky Corp Tower",
      status: "Pending Approval",
      priority: "Low",
      resolutionSteps:
        "Get quotes; schedule lift; notify building; perform work.",
    },
    {
      id: "REQ-3120",
      title: "Safety Audit - West Warehouse",
      type: "EH&S",
      client: "Bio-Genetics Inc.",
      status: "Draft",
      priority: "Medium",
      resolutionSteps:
        "Site walk; checklist; corrective actions; report to client.",
    },
    {
      id: "REQ-3121",
      title: "Replace Lobby Lighting",
      type: "Maintenance",
      client: "Sky Corp Tower",
      status: "Draft",
      priority: "Low",
      resolutionSteps:
        "Inventory bulbs; schedule electrician; replace; dispose safely.",
    },
    {
      id: "REQ-3122",
      title: "Lab Fume Hood Calibration",
      type: "Maintenance",
      client: "Quantum Dynamics",
      status: "New",
      priority: "High",
      resolutionSteps: "Calibrate sensors; verify airflow; document results.",
    },
    {
      id: "REQ-3123",
      title: "Parking Gate Repair",
      type: "Maintenance",
      client: "Apex Innovations",
      status: "In Progress",
      priority: "Medium",
      resolutionSteps: "Diagnose motor; replace belt; test access control.",
    },
    {
      id: "REQ-3124",
      title: "Floor 3 Office Reconfiguration",
      type: "Construction",
      client: "Sky Corp Tower",
      status: "Pending Approval",
      priority: "Medium",
      resolutionSteps: "Space plan; contractor bids; schedule night work.",
    },
    {
      id: "REQ-3125",
      title: "Annual Elevator Inspection",
      type: "EH&S",
      client: "Apex Innovations",
      status: "New",
      priority: "Medium",
      resolutionSteps:
        "Coordinate with elevator vendor; onsite inspection; report.",
    },
    {
      id: "REQ-3126",
      title: "Dock Leveler Maintenance",
      type: "Maintenance",
      client: "Bio-Genetics Inc.",
      status: "Draft",
      priority: "Low",
      resolutionSteps: "Grease hinges; inspect hydraulics; test operations.",
    },
    {
      id: "REQ-3127",
      title: "Lobby Signage Update",
      type: "Other",
      client: "Quantum Dynamics",
      status: "New",
      priority: "Low",
      resolutionSteps: "Design mockups; approve; fabricate; install.",
    },
  ]);

  const [filtered, setFiltered] = useState<Ticket[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClient, setFilterClient] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [clientName, setClientName] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [context, setContext] = useState("");
  const [toasts, setToasts] = useState<
    { id: number; message: string; show: boolean }[]
  >([]);

  const pageSize = 10;

  useEffect(() => {
    applyFilters();
  }, [
    searchQuery,
    filterClient,
    filterStatus,
    filterPriority,
    filterType,
    tickets,
  ]);

  const applyFilters = () => {
    const q = searchQuery.trim().toLowerCase();
    const c = filterClient;
    const s = filterStatus;
    const p = filterPriority;
    const t = filterType;

    const filteredTickets = tickets.filter((ticket) => {
      const searchHit =
        !q ||
        ticket.title.toLowerCase().includes(q) ||
        ticket.resolutionSteps.toLowerCase().includes(q);
      const clientHit = c === "all" || ticket.client === c;
      const statusHit = s === "all" || ticket.status === s;
      const priorityHit = p === "all" || ticket.priority === p;
      const typeHit = t === "all" || ticket.type === t;
      return searchHit && clientHit && statusHit && priorityHit && typeHit;
    });

    setFiltered(filteredTickets);
    setCurrentPage(1);
  };

  const renderTable = () => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = filtered.slice(start, end);

    return pageItems.map((ticket) => {
      const statusClass = getStatusClass(ticket.status);
      const priorityClass = `priority-${ticket.priority.toLowerCase()}`;
      const typeClass = `type-${ticket.type
        .toLowerCase()
        .replace("&", "and")
        .replace(/\s+/g, "")}`;

      return (
        <tr
          key={ticket.id}
          data-id={ticket.id}
          data-title={ticket.title.toLowerCase()}
          data-steps={ticket.resolutionSteps.toLowerCase()}
          onClick={() => handleRowClick(ticket.id)}
          style={{ cursor: "pointer" }}
        >
          <td>
            <span className={`type-tag ${typeClass}`}>{ticket.type}</span>
          </td>
          <td>{ticket.client}</td>
          <td>
            <span className={`status-tag ${statusClass}`}>{ticket.status}</span>
          </td>
          <td>
            <span className={`priority-tag ${priorityClass}`}>
              {ticket.priority}
            </span>
          </td>
        </tr>
      );
    });
  };

  const getStatusClass = (status: string) => {
    const statusMap: { [key: string]: string } = {
      Draft: "draft",
      New: "new",
      "In Progress": "inprogress",
      "Pending Approval": "pending",
    };
    return `status-${
      statusMap[status] || status.toLowerCase().replace(/\s+/g, "")
    }`;
  };

  // const getPriorityClass = (priority: string) => {
  //   return `priority-${priority.toLowerCase()}`;
  // };

  // const getTypeClass = (type: string) => {
  //   return `type-${type.toLowerCase().replace("&", "and").replace(/\s+/g, "")}`;
  // };

  const handleRowClick = (id: string) => {
    console.log("Routing to ticket view:", id);
    navigate(`/ticket/${id}`);
  };

  const generateTicketId = () => {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `REQ-${yy}${mm}${dd}-${rand}`;
  };

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, show: false }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, show: true } : t))
      );
    }, 10);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, show: false } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 400);
    }, 3000);
  };

  const handleCreateTicket = () => {
    const newTicket: Ticket = {
      id: generateTicketId(),
      title: context.trim().slice(0, 80) || `${selectedType} ticket`,
      type: selectedType,
      client: clientName.trim(),
      status: "Draft",
      priority: priority,
      resolutionSteps: "",
    };

    setShowCreateModal(false);
    setShowLoadingOverlay(true);

    setTimeout(() => {
      setShowLoadingOverlay(false);
      // tickets.unshift(newTicket); // In a real app, this would update state
      applyFilters();
      showToast("Ticket created successfully. Opening ticket view...");
      console.log("Routing to ticket view:", newTicket.id);
      navigate(`/ticket/${newTicket.id}`);
    }, 1800);
  };

  const resetCreateForm = () => {
    setSelectedType("");
    setClientName("");
    setPriority("Medium");
    setContext("");
  };

  const validateCreateForm = () => {
    return Boolean(selectedType && clientName.trim() && context.trim());
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const showingStart = filtered.length === 0 ? 0 : start + 1;
  const showingEnd = Math.min(end, filtered.length);

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Tickets</h1>
        <button
          className="action-btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Ticket
        </button>
      </div>

      <section className="section">
        <h2 className="section-header">Find & Organize</h2>
        <div className="search-filter-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Search</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Search title or resolution steps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Client</label>
              <select
                className="filter-select"
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
              >
                <option value="all">All</option>
                {Array.from(new Set(tickets.map((t) => t.client)))
                  .sort()
                  .map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                {Array.from(new Set(tickets.map((t) => t.status)))
                  .sort()
                  .map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Priority</label>
              <select
                className="filter-select"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All</option>
                {Array.from(new Set(tickets.map((t) => t.priority)))
                  .sort()
                  .map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Type</label>
              <select
                className="filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All</option>
                {Array.from(new Set(tickets.map((t) => t.type)))
                  .sort()
                  .map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-header">Master List</h2>
        <div className="tickets-list-container">
          <table className="tickets-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Client</th>
                <th>Status</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>{renderTable()}</tbody>
          </table>
          <div className="pagination-controls">
            <div className="pagination-info">
              Showing {showingStart}-{showingEnd} of {filtered.length}
            </div>
            <div className="pagination-buttons">
              <button
                className="pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      className={`page-number ${
                        pageNum === currentPage ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                )}
              </div>
              <button
                className="pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-content">
            <span
              className="close-modal"
              onClick={() => {
                setShowCreateModal(false);
                resetCreateForm();
              }}
            >
              &times;
            </span>
            <div className="modal-header">
              <h3 className="modal-title">Create New Ticket</h3>
            </div>
            <div className="modal-row full">
              <span className="label">Ticket Type</span>
              <div className="selection-card-grid">
                {["Maintenance", "Construction", "EH&S", "Other"].map(
                  (type) => (
                    <div
                      key={type}
                      className={`selection-card ${
                        selectedType === type ? "selected" : ""
                      }`}
                      onClick={() => setSelectedType(type)}
                    >
                      {type}
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="modal-row">
              <div>
                <label className="label" htmlFor="client-name">
                  Client Name
                </label>
                <input
                  type="text"
                  id="client-name"
                  className="input-field"
                  placeholder="e.g., Apex Innovations"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="priority-select">
                  Priority
                </label>
                <select
                  id="priority-select"
                  className="input-field"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div className="modal-row full">
              <div>
                <label className="label" htmlFor="context-text">
                  Context
                </label>
                <textarea
                  id="context-text"
                  className="input-field"
                  rows={5}
                  placeholder="Describe the issue or request..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={!validateCreateForm()}
                onClick={handleCreateTicket}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {showLoadingOverlay && (
        <div className="loading-overlay" style={{ display: "flex" }}>
          <div className="loading-card">
            <div className="spinner"></div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontSize: "14px",
                }}
              >
                Generating solution plan...
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                This may take a few seconds
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.show ? "show" : ""}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
