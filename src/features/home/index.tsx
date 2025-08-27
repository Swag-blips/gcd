import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";
import { CreateModal } from "../components/CreateModal";

export interface Ticket {
  id: string;
  title: string;
  ticket_type: string;
  client: string;
  ticket_id: string;
  client_name: string;
  issue_status: string;
  issue_priority: string;
  resolutionSteps: string;
}

export async function fetchAllTickets(apiKey: string): Promise<any> {
  const response = await fetch("/gcd/fetch-all-tickets", {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      Accept: "application/json",
    },
  });
  return response.json();
}

const Home = () => {
  const navigate = useNavigate();

  // Tickets state populated from API
  const [tickets, setTickets] = useState<Ticket[]>([]);
  // Fetch tickets from API on mount
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const apiKey = import.meta.env.VITE_X_SUPER;
        const result = await fetchAllTickets(apiKey);
        console.log("result", result);

        if (Array.isArray(result)) {
          setTickets(result);
        } else if (Array.isArray(result.tickets)) {
          setTickets(result.tickets);
        } else {
          setTickets([]);
        }
      } catch (error) {
        setTickets([]);
      }
    };
    fetchTickets();
  }, []);

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
      const title = ticket.title ?? "";
      const resolution = ticket.resolutionSteps ?? "";
      const clientName = ticket.client_name ?? "";
      const type = ticket.ticket_type ?? "";
      const status = ticket.issue_status ?? "";
      const priority = ticket.issue_priority ?? "";
      const id = ticket.ticket_id ?? "";

      // Search hit if query matches any field
      const searchHit =
        !q ||
        title.toLowerCase().includes(q) ||
        resolution.toLowerCase().includes(q) ||
        clientName.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q) ||
        priority.toLowerCase().includes(q) ||
        id.toLowerCase().includes(q);

      const clientHit = c === "all" || clientName === c;
      const statusHit = s === "all" || status === s;
      const priorityHit = p === "all" || priority === p;
      const typeHit = t === "all" || type === t;

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
      const statusClass = getStatusClass(ticket.issue_status);
      const priorityClass = `priority-${ticket.issue_priority.toLowerCase()}`;
      const typeClass = `type-${ticket.ticket_type
        .toLowerCase()
        .replace("&", "and")
        .replace(/\s+/g, "")}`;

      return (
        <tr
          key={ticket.id}
          data-id={ticket.id}
          data-title={ticket.client_name.toLowerCase()}
          onClick={() => handleRowClick(ticket.ticket_id)}
          style={{ cursor: "pointer" }}
        >
          <td>
            <span className={`type-tag ${typeClass}`}>
              {ticket.ticket_type}
            </span>
          </td>
          <td>{ticket.client_name}</td>
          <td>
            <span className={`status-tag ${statusClass}`}>
              {ticket.issue_status}
            </span>
          </td>
          <td>
            <span className={`priority-tag ${priorityClass}`}>
              {ticket.issue_priority}
            </span>
          </td>
        </tr>
      );
    });
  };

  const getStatusClass = (status: string) => {
    console.log("statuss", status);
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
                {Array.from(new Set(tickets.map((t) => t.issue_status)))
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
                {Array.from(new Set(tickets.map((t) => t.issue_priority)))
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
                {Array.from(new Set(tickets.map((t) => t.ticket_type)))
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
        <CreateModal
          setShowCreateModal={setShowCreateModal}
          resetCreateForm={resetCreateForm}
          validateCreateForm={validateCreateForm}
          setSelectedType={setSelectedType}
          selectedType={selectedType}
          priority={priority}
          clientName={clientName}
          setClientName={setClientName}
          context={context}
          setContext={setContext}
          showToast={showToast}
          setPriority={setPriority}
          applyFilters={applyFilters}
          setShowLoadingOverlay={setShowLoadingOverlay}
        />
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
