import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./styles.css";

interface Step {
  id: string;
  title: string;
  description: string;
  tag: string;
  assignedTo: string;
  due: string;
  status: string;
  blocker: { reason: string; ts: number } | null;
}

interface Ticket {
  id: string;
  title: string;
  client: string;
  type: string;
  priority: string;
  status: string;
  updatedAt: string;
}

const PERSON_TAGS = [
  "Client Contact",
  "Client Finance",
  "Client Facilities Lead",
  "Client IT/Low Voltage",
  "Landlord PM",
  "Landlord Legal",
  "Landlord Building Ops",
  "Local Council - Permits",
  "Local Council - Fire Dept",
  "Local Council - Health Dept",
  "Local Council - Building Inspection",
  "Local Council - Zoning Board",
  "Environmental Agency",
  "Utility - Power",
  "Utility - Water",
  "Utility - Gas",
  "Utility - Telecom",
  "Contractor - HVAC",
  "Contractor - Plumbing",
  "Contractor - Electrical",
  "Contractor - Carpentry",
  "Contractor - Roofing",
  "Contractor - General Contractor",
  "Contractor - Security Systems",
  "Contractor - Fire Protection",
  "Contractor - Elevator",
  "Contractor - Glass/Windows",
  "Contractor - Painting",
  "Contractor - Flooring",
  "Contractor - Concrete",
  "Contractor - Landscaping",
  "Contractor - Pest Control",
  "Contractor - Cleaning",
  "Contractor - Mechanical",
  "Contractor - Controls/BMS",
  "Contractor - Data Cabling",
  "Contractor - Structural Engineer",
  "Contractor - Civil Engineer",
];

// Mock candidates by tag
const CANDIDATES: {
  [key: string]: Array<{
    id: string;
    name: string;
    rating: string;
    availability: string;
  }>;
} = {};
PERSON_TAGS.forEach((tag, i) => {
  const base = tag.split(" - ").pop();
  CANDIDATES[tag] = [
    {
      id: `${tag}-1`,
      name: `${base} Co. ${i + 1}`,
      rating: 3 + (i % 3) + ".0",
      availability: "Available",
    },
    {
      id: `${tag}-2`,
      name: `${base} Experts ${i + 2}`,
      rating: 3 + ((i + 1) % 3) + ".0",
      availability: "Busy",
    },
  ];
});

export const Ticket = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock ticket from seed
  const [ticket] = useState<Ticket>({
    id: id || "REQ-XXXX",
    title: "Ticket Details",
    client: "A Client",
    type: "Maintenance",
    priority: "Medium",
    status: "Draft",
    updatedAt: new Date().toLocaleString(),
  });

  // Initial LLM-generated steps (mock)
  const [steps, setSteps] = useState<Step[]>([
    {
      id: "s1",
      title: "Initial Assessment",
      description: "Review reported issue and confirm scope.",
      tag: "Client Facilities Lead",
      assignedTo: "",
      due: "",
      status: "Not Started",
      blocker: null,
    },
    {
      id: "s2",
      title: "Dispatch HVAC Contractor",
      description: "Engage HVAC vendor to inspect equipment.",
      tag: "Contractor - HVAC",
      assignedTo: "",
      due: "",
      status: "Not Started",
      blocker: null,
    },
    {
      id: "s3",
      title: "Obtain Work Permit",
      description: "Secure necessary permits from local authorities.",
      tag: "Local Council - Permits",
      assignedTo: "",
      due: "",
      status: "Not Started",
      blocker: null,
    },
    {
      id: "s4",
      title: "Execution and Testing",
      description: "Perform repairs and validate system performance.",
      tag: "Contractor - Mechanical",
      assignedTo: "",
      due: "",
      status: "Not Started",
      blocker: null,
    },
  ]);

  const [activeIndex, setActiveIndex] = useState(-1);
  const [assignIndex, setAssignIndex] = useState(-1);
  const [toasts, setToasts] = useState<
    { id: number; message: string; show: boolean }[]
  >([]);

  // Modal states
  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showProceedModal, setShowProceedModal] = useState(false);

  // Form states
  const [blockerReason, setBlockerReason] = useState("");
  const [deleteContext, setDeleteContext] = useState("");
  const [editContext, setEditContext] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addTag, setAddTag] = useState("");
  const [addDue, setAddDue] = useState("");
  const [addContext, setAddContext] = useState("");

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

  const buildAssigneeOptions = (tag: string, selected: string) => {
    const arr = CANDIDATES[tag] || [];
    const options = ['<option value="">Unassigned</option>'].concat(
      arr.map(
        (a) =>
          `<option value="${a.name}" ${a.name === selected ? "selected" : ""}>${
            a.name
          } • ⭐${a.rating} • ${a.availability}</option>`
      )
    );
    return options.join("");
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (fromIndex === toIndex) return;

    const newSteps = [...steps];
    const moved = newSteps.splice(fromIndex, 1)[0];
    newSteps.splice(toIndex, 0, moved);
    setSteps(newSteps);
  };

  const handleTagChange = (stepIndex: number, newTag: string) => {
    const newSteps = [...steps];
    newSteps[stepIndex].tag = newTag;
    newSteps[stepIndex].assignedTo = "";
    setSteps(newSteps);
  };

  const handleAssigneeChange = (stepIndex: number, newAssignee: string) => {
    const newSteps = [...steps];
    newSteps[stepIndex].assignedTo = newAssignee;
    setSteps(newSteps);
  };

  const handleDueChange = (stepIndex: number, newDue: string) => {
    const newSteps = [...steps];
    newSteps[stepIndex].due = newDue;
    setSteps(newSteps);
  };

  const handleStatusChange = (stepIndex: number, newStatus: string) => {
    const newSteps = [...steps];
    newSteps[stepIndex].status = newStatus;
    setSteps(newSteps);
  };

  const openBlockerModal = (index: number) => {
    setActiveIndex(index);
    setBlockerReason(steps[index].blocker?.reason || "");
    setShowBlockerModal(true);
  };

  const saveBlocker = () => {
    if (!blockerReason.trim()) {
      showToast("Reason required");
      return;
    }
    const newSteps = [...steps];
    newSteps[activeIndex].blocker = { reason: blockerReason, ts: Date.now() };
    setSteps(newSteps);
    setShowBlockerModal(false);
    setBlockerReason("");
  };

  const openDeleteModal = (index: number) => {
    setActiveIndex(index);
    setDeleteContext("");
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!deleteContext.trim()) {
      showToast("Deletion context required");
      return;
    }
    console.log("LEARN_DELETE", {
      step: steps[activeIndex],
      context: deleteContext,
    });
    const newSteps = [...steps];
    newSteps.splice(activeIndex, 1);
    setSteps(newSteps);
    setShowDeleteModal(false);
    setDeleteContext("");
  };

  const openEditModal = (index: number) => {
    setActiveIndex(index);
    setEditContext("");
    setShowEditModal(true);
  };

  const confirmEdit = () => {
    if (!editContext.trim()) {
      showToast("Edit context required");
      return;
    }
    const newSteps = [...steps];
    const s = newSteps[activeIndex];
    s.title = s.title + " (refined)";
    s.description = s.description + `\nUpdate: ${editContext}`;
    console.log("LEARN_EDIT", { step: s, context: editContext });
    setSteps(newSteps);
    setShowEditModal(false);
    setEditContext("");
  };

  const openAddModal = () => {
    setAddTitle("");
    setAddDesc("");
    setAddTag("");
    setAddDue("");
    setAddContext("");
    setShowAddModal(true);
  };

  const confirmAdd = () => {
    if (!addTitle.trim() || !addDesc.trim() || !addContext.trim()) {
      showToast("Title, description, and addition context are required");
      return;
    }
    const newStep: Step = {
      id: "s" + Date.now(),
      title: addTitle,
      description: addDesc,
      tag: addTag,
      assignedTo: "",
      due: addDue,
      status: "Not Started",
      blocker: null,
    };
    console.log("LEARN_ADD", { step: newStep, context: addContext });
    setSteps([...steps, newStep]);
    setShowAddModal(false);
  };

  const openAssignModal = (index: number) => {
    setAssignIndex(index);
    setShowAssignModal(true);
  };

  const handleAssign = (candidateId: string) => {
    const s = steps[assignIndex];
    const candidates = CANDIDATES[s.tag] || [];
    const candidate = candidates.find((c) => c.id === candidateId);
    if (candidate) {
      const newSteps = [...steps];
      newSteps[assignIndex].assignedTo = candidate.name;
      setSteps(newSteps);
    }
    setShowAssignModal(false);
  };

  const handleProceed = () => {
    console.log("PROCEED_SAVE", { ticket, steps });
    setShowProceedModal(false);
    showToast("Plan saved and flagged as accurate. Learning updated.");
  };

  const handleRegenerate = () => {
    showToast("Regenerating steps (demo)...");
    console.log("REGENERATE_REQUEST", { ticket, steps });
  };

  const handleExport = () => {
    showToast("Exported (demo)");
  };

  const handleCloseTicket = () => {
    showToast("Ticket closed (demo)");
    // In a real app, this would update the ticket status
  };

  return (
    <div className="ticket-container">
      <div className="ticket-header">
        <div className="ticket-title-group">
          <button className="ticket-back-btn" onClick={() => navigate("/")}>
            ← Back to Tickets
          </button>
          <div className="ticket-title">Ticket {ticket.id}</div>
          <div className="ticket-meta">
            ID: {ticket.id} • Client: {ticket.client} • Type: {ticket.type} •
            Priority: {ticket.priority}
          </div>
        </div>
        <div className="ticket-header-actions">
          <button className="ticket-btn" onClick={handleRegenerate}>
            Regenerate Steps
          </button>
          <button className="ticket-btn" onClick={handleExport}>
            Export
          </button>
          <button className="ticket-btn" onClick={handleCloseTicket}>
            Close Ticket
          </button>
          <button
            className="ticket-btn ticket-btn-primary"
            onClick={() => setShowProceedModal(true)}
          >
            Proceed
          </button>
        </div>
      </div>

      <div className="ticket-summary">
        <div className="ticket-summary-card">
          <div className="ticket-summary-title">Ticket ID</div>
          <div className="ticket-summary-value">{ticket.id}</div>
        </div>
        <div className="ticket-summary-card">
          <div className="ticket-summary-title">Status</div>
          <div className="ticket-summary-value">{ticket.status}</div>
        </div>
        <div className="ticket-summary-card">
          <div className="ticket-summary-title">Client</div>
          <div className="ticket-summary-value">{ticket.client}</div>
        </div>
        <div className="ticket-summary-card">
          <div className="ticket-summary-title">Type</div>
          <div className="ticket-summary-value">{ticket.type}</div>
        </div>
        <div className="ticket-summary-card">
          <div className="ticket-summary-title">Priority</div>
          <div className="ticket-summary-value">{ticket.priority}</div>
        </div>
        <div className="ticket-summary-card">
          <div className="ticket-summary-title">Updated</div>
          <div className="ticket-summary-value">{ticket.updatedAt}</div>
        </div>
      </div>

      <h2 className="ticket-section-header">Resolution Plan</h2>
      <div className="ticket-steps-toolbar">
        <button className="ticket-btn" onClick={openAddModal}>
          + Add Step
        </button>
        <div className="ticket-hint">
          Drag steps to reorder. Changes save when you click Proceed.
        </div>
      </div>

      <div className="ticket-steps-list">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`ticket-step-card ${
              step.blocker ? "ticket-step-blocker" : ""
            }`}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
          >
            <div className="ticket-drag" title="Drag to reorder">
              ⋮⋮
            </div>
            <div className="ticket-step-content">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div className="ticket-step-title">
                  {idx + 1}. {step.title}
                </div>
                {step.blocker && (
                  <span className="ticket-chip ticket-chip-blocker">
                    BLOCKER
                  </span>
                )}
              </div>
              <div className="ticket-step-desc">{step.description}</div>
              <div className="ticket-step-fields">
                <div className="ticket-field">
                  <span className="ticket-label">Person Tag</span>
                  <select
                    className="ticket-select ticket-step-tag"
                    value={step.tag}
                    onChange={(e) => handleTagChange(idx, e.target.value)}
                  >
                    {PERSON_TAGS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ticket-field">
                  <span className="ticket-label">Assigned To</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <select
                      className="ticket-select ticket-step-assignee"
                      value={step.assignedTo}
                      onChange={(e) =>
                        handleAssigneeChange(idx, e.target.value)
                      }
                      dangerouslySetInnerHTML={{
                        __html: buildAssigneeOptions(step.tag, step.assignedTo),
                      }}
                    />
                    <button
                      className="ticket-btn ticket-step-assign-btn"
                      onClick={() => openAssignModal(idx)}
                    >
                      Find
                    </button>
                  </div>
                </div>
                <div className="ticket-field">
                  <span className="ticket-label">Due Date</span>
                  <input
                    type="date"
                    className="ticket-date ticket-step-due"
                    value={step.due || ""}
                    onChange={(e) => handleDueChange(idx, e.target.value)}
                  />
                </div>
                <div className="ticket-field">
                  <span className="ticket-label">Status</span>
                  <select
                    className="ticket-select ticket-step-status"
                    value={step.status}
                    onChange={(e) => handleStatusChange(idx, e.target.value)}
                  >
                    {["Not Started", "In Progress", "Done", "Skipped"].map(
                      (st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div className="ticket-field">
                  <span className="ticket-label">Blocker</span>
                  <button
                    className="ticket-btn ticket-step-blocker-btn"
                    onClick={() => openBlockerModal(idx)}
                  >
                    {step.blocker ? "Edit" : "Flag"} Blocker
                  </button>
                </div>
              </div>
            </div>
            <div className="ticket-step-actions">
              <button
                className="ticket-btn ticket-step-edit"
                onClick={() => openEditModal(idx)}
              >
                Edit
              </button>
              <button
                className="ticket-btn ticket-step-delete"
                onClick={() => openDeleteModal(idx)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="ticket-note">
        Flag blockers with reasons. Edit/Delete/Add require context to teach the
        system.
      </div>

      {/* Blocker Modal */}
      {showBlockerModal && (
        <div className="ticket-modal" style={{ display: "block" }}>
          <div className="ticket-modal-content">
            <span
              className="ticket-close-modal"
              onClick={() => setShowBlockerModal(false)}
            >
              &times;
            </span>
            <div className="ticket-modal-title">Flag Blocker</div>
            <div className="ticket-modal-row ticket-modal-row-full">
              <div className="ticket-field">
                <span className="ticket-label">Reason (required)</span>
                <textarea
                  id="blocker-reason"
                  className="ticket-input ticket-textarea"
                  placeholder="Explain why this step may be blocked"
                  value={blockerReason}
                  onChange={(e) => setBlockerReason(e.target.value)}
                />
              </div>
            </div>
            <div className="ticket-modal-actions">
              <button
                className="ticket-btn"
                onClick={() => setShowBlockerModal(false)}
              >
                Cancel
              </button>
              <button
                className="ticket-btn ticket-btn-primary"
                onClick={saveBlocker}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="ticket-modal" style={{ display: "block" }}>
          <div className="ticket-modal-content">
            <span
              className="ticket-close-modal"
              onClick={() => setShowDeleteModal(false)}
            >
              &times;
            </span>
            <div className="ticket-modal-title">Delete Step</div>
            <div className="ticket-modal-row ticket-modal-row-full">
              <div className="ticket-field">
                <span className="ticket-label">
                  Deletion Context (required)
                </span>
                <textarea
                  id="delete-context"
                  className="ticket-input ticket-textarea"
                  placeholder="Why is this step being removed?"
                  value={deleteContext}
                  onChange={(e) => setDeleteContext(e.target.value)}
                />
              </div>
            </div>
            <div className="ticket-modal-actions">
              <button
                className="ticket-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="ticket-btn ticket-btn-primary"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="ticket-modal" style={{ display: "block" }}>
          <div className="ticket-modal-content">
            <span
              className="ticket-close-modal"
              onClick={() => setShowEditModal(false)}
            >
              &times;
            </span>
            <div className="ticket-modal-title">Edit Step (LLM Regenerate)</div>
            <div className="ticket-modal-row ticket-modal-row-full">
              <div className="ticket-field">
                <span className="ticket-label">Edit Context (required)</span>
                <textarea
                  id="edit-context"
                  className="ticket-input ticket-textarea"
                  placeholder="Describe the change you want. The AI will regenerate the step."
                  value={editContext}
                  onChange={(e) => setEditContext(e.target.value)}
                />
              </div>
            </div>
            <div className="ticket-modal-actions">
              <button
                className="ticket-btn"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="ticket-btn ticket-btn-primary"
                onClick={confirmEdit}
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="ticket-modal" style={{ display: "block" }}>
          <div className="ticket-modal-content">
            <span
              className="ticket-close-modal"
              onClick={() => setShowAddModal(false)}
            >
              &times;
            </span>
            <div className="ticket-modal-title">Add Step</div>
            <div className="ticket-modal-row ticket-modal-row-full">
              <div className="ticket-field">
                <span className="ticket-label">Title</span>
                <input
                  type="text"
                  id="add-title"
                  className="ticket-input"
                  placeholder="Step title"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                />
              </div>
            </div>
            <div className="ticket-modal-row ticket-modal-row-full">
              <div className="ticket-field">
                <span className="ticket-label">Description</span>
                <textarea
                  id="add-desc"
                  className="ticket-input ticket-textarea"
                  placeholder="Step description"
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="ticket-modal-row">
              <div className="ticket-field">
                <span className="ticket-label">Person Tag</span>
                <select
                  id="add-tag"
                  className="ticket-select"
                  value={addTag}
                  onChange={(e) => setAddTag(e.target.value)}
                >
                  {PERSON_TAGS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ticket-field">
                <span className="ticket-label">Due Date</span>
                <input
                  type="date"
                  id="add-due"
                  className="ticket-date"
                  value={addDue}
                  onChange={(e) => setAddDue(e.target.value)}
                />
              </div>
            </div>
            <div className="ticket-modal-row ticket-modal-row-full">
              <div className="ticket-field">
                <span className="ticket-label">
                  Addition Context (required)
                </span>
                <textarea
                  id="add-context"
                  className="ticket-input ticket-textarea"
                  placeholder="Why is this step being added?"
                  value={addContext}
                  onChange={(e) => setAddContext(e.target.value)}
                />
              </div>
            </div>
            <div className="ticket-modal-actions">
              <button
                className="ticket-btn"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="ticket-btn ticket-btn-primary"
                onClick={confirmAdd}
              >
                Add Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="ticket-modal" style={{ display: "block" }}>
          <div className="ticket-modal-content">
            <span
              className="ticket-close-modal"
              onClick={() => setShowAssignModal(false)}
            >
              &times;
            </span>
            <div className="ticket-modal-title">Assign To</div>
            <div className="ticket-modal-row ticket-modal-row-full">
              <div className="ticket-field">
                <span className="ticket-label">Candidates</span>
                <div className="ticket-assign-list">
                  {(() => {
                    const s = steps[assignIndex];
                    const candidates = CANDIDATES[s.tag] || [];
                    return candidates.length ? (
                      candidates.map((c) => (
                        <div
                          key={c.id}
                          className="ticket-assign-item"
                          onClick={() => handleAssign(c.id)}
                        >
                          <div>{c.name}</div>
                          <div>
                            ⭐{c.rating} • {c.availability}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="ticket-assign-item">No candidates</div>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="ticket-modal-actions">
              <button
                className="ticket-btn"
                onClick={() => setShowAssignModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proceed Modal */}
      {showProceedModal && (
        <div className="ticket-modal" style={{ display: "block" }}>
          <div className="ticket-modal-content">
            <span
              className="ticket-close-modal"
              onClick={() => setShowProceedModal(false)}
            >
              &times;
            </span>
            <div className="ticket-modal-title">Confirm Proceed</div>
            <div className="ticket-modal-row ticket-modal-row-full">
              <div className="ticket-field">
                <span className="ticket-label">Confirmation</span>
                <div className="ticket-hint">
                  Proceed will save order and changes, flag this ticket plan as
                  accurate, and record learning context for future generation.
                </div>
              </div>
            </div>
            <div className="ticket-modal-actions">
              <button
                className="ticket-btn"
                onClick={() => setShowProceedModal(false)}
              >
                Cancel
              </button>
              <button
                className="ticket-btn ticket-btn-primary"
                onClick={handleProceed}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ticket-toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`ticket-toast ${toast.show ? "ticket-toast-show" : ""}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};
