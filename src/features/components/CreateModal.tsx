import { useNavigate } from "react-router-dom";

async function createTicketApi(
  apiKey: string,
  data: {
    ticket_id: string;
    ticket_type: string;
    user_description: string;
    client_name: string;
    issue_priority: string;
    issue_status: string;
  }
): Promise<{ status: string; message: string } | { detail: any }> {
  const response = await fetch("/gcd/create-ticket", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

type Props = {
  resetCreateForm: () => void;
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedType: string;
  setSelectedType: React.Dispatch<React.SetStateAction<string>>;
  priority: string;
  clientName: string;
  setClientName: React.Dispatch<React.SetStateAction<string>>;
  context: string;
  setContext: React.Dispatch<React.SetStateAction<string>>;
  showToast: (message: string) => void;
  applyFilters: () => void;
  setPriority: (data: string) => void;
  setShowLoadingOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  validateCreateForm: () => boolean;
};

export const CreateModal = ({
  resetCreateForm,
  applyFilters,
  context,
  clientName,
  showToast,
  setClientName,
  setContext,
  setShowCreateModal,
  selectedType,
  setSelectedType,
  priority,
  setPriority,
  setShowLoadingOverlay,
  validateCreateForm,
}: Props) => {
  const navigate = useNavigate();

  const generateTicketId = () => {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `REQ-${yy}${mm}${dd}-${rand}`;
  };

  const handleCreateTicket = async () => {
    setShowCreateModal(false);
    setShowLoadingOverlay(true);
    const ticketId = generateTicketId();
    try {
      // Replace with your actual API key
      const apiKey = import.meta.env.VITE_X_SUPER;

      const response = await createTicketApi(apiKey, {
        ticket_id: ticketId,
        ticket_type: selectedType,
        user_description:
          context.trim().slice(0, 80) || `${selectedType} ticket`,
        client_name: clientName.trim(),
        issue_priority: priority,
        issue_status: "Draft",
      });
      setShowLoadingOverlay(false);
      if ("status" in response) {
        applyFilters();
        showToast("Ticket created successfully. Opening ticket view...");
        navigate(`/ticket/${ticketId}`);
      } else {
        showToast(
          "Failed to create ticket: " + JSON.stringify(response.detail)
        );
      }
    } catch (error) {
      setShowLoadingOverlay(false);
      showToast("Error creating ticket");
    }
  };
  return (
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
            {["Maintenance", "Construction", "EH&S", "Other"].map((type) => (
              <div
                key={type}
                className={`selection-card ${
                  selectedType === type ? "selected" : ""
                }`}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </div>
            ))}
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
  );
};
