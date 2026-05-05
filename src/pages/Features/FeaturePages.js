import React, { useEffect, useState,useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Truck,
  Map,
  Users,
  UserCog,
  ChevronDown,
  ChevronRight,
  Trash2,
  SquarePen,
  UserCheck,
  User2Icon,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Camera, X 
} from "lucide-react";
import {
  fetchDistributors,
  addDistributor,
  deleteDistributor,
  updateDistributor, // ← changed from updateStatus
} from "../../services/features/distributor/distributorSlice";
import {
  getManagers,
  addManager,
  deleteManager,
  updateManager,
} from "../../services/features/manager/managerSlice";
import {
  getExecutives,
  addExecutive,
  deleteExecutive,
} from "../../services/features/executive/executiveSlice";
import { fetchFSE, addFSE } from "../../services/features/fse/fseSlice";
import {
  fetchTerritory,
  addTerritory,
  updateTerritory,
  deleteState,
  deleteDistrict,
  deleteTaluk,
  assignTaluk,
  addBeat,
} from "../../services/features/Territory/TerritorySlice";
import { selectAuthState } from "../../store/selectors/authSelector";
import {
  SectionHeader,
  Button,
  Badge,
  Modal,
  Input,
  Select,
  DataTable,
  Avatar,
  toast,
  ConfirmDialog,
  EmptyState,
  Spinner,
} from "../../components/ui/UI";
import locationData from "../../assets/json/Location.json";

/* ─── Shared helpers ─────────────────────────────────────────────────────────── */
const statusBadge = (s) => (
  <Badge
    variant={
      s === "Active" ? "active" : s === "Inactive" ? "inactive" : "pending"
    }
  >
    {s || "Pending"}
  </Badge>
);

/* ─── Helper: Status Badge ─────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  let variant = 'pending';
  let icon = null;
  if (status === 'APPROVED') {
    variant = 'success';
    icon = <CheckCircle size={14} style={{ marginRight: 4 }} />;
  } else if (status === 'REJECTED') {
    variant = 'danger';
    icon = <XCircle size={14} style={{ marginRight: 4 }} />;
  } else {
    variant = 'warning';
    icon = <Clock size={14} style={{ marginRight: 4 }} />;
  }
  return (
    <Badge variant={variant} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {icon}
      {status || 'PENDING'}
    </Badge>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   DISTRIBUTORS PAGE (Web - Approval Workflow)
   Replaces old DistributorsPage – now uses PENDING/APPROVED/REJECTED tabs
════════════════════════════════════════════════════════════════════════════════ */
export const DistributorsPage = () => {
  const dispatch = useDispatch();
  const [tab, setTab] = useState("PENDING"); // 'PENDING', 'APPROVED', 'REJECTED'
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState(null);

  const { list, loading, error } = useSelector((state) => state.distributors);

  useEffect(() => {
    dispatch(fetchDistributors());
  }, [dispatch]);

  const filteredList = list.filter((d) => d.status === tab);

  const handleApprove = (id) => {
    dispatch(updateDistributor({ id, status: "APPROVED" }));
    toast.success("Distributor approved");
  };

  const openRejectModal = (distributor) => {
    setSelectedDistributor(distributor);
    setRejectModalOpen(true);
  };

  const confirmReject = () => {
    if (selectedDistributor) {
      dispatch(
        updateDistributor({ id: selectedDistributor._id, status: "REJECTED" }),
      );
      toast.success("Distributor rejected");
    }
    setRejectModalOpen(false);
    setSelectedDistributor(null);
  };

  const handleDelete = (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${name}? This action cannot be undone.`,
      )
    ) {
      dispatch(deleteDistributor(id));
      toast.success("Distributor deleted");
    }
  };

  const StatusBadge = ({ status }) => {
    let variant = "pending";
    let icon = null;
    if (status === "APPROVED") {
      variant = "success";
      icon = <CheckCircle size={14} style={{ marginRight: 4 }} />;
    } else if (status === "REJECTED") {
      variant = "danger";
      icon = <XCircle size={14} style={{ marginRight: 4 }} />;
    } else {
      variant = "warning";
      icon = <Clock size={14} style={{ marginRight: 4 }} />;
    }
    return (
      <Badge
        variant={variant}
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        {icon}
        {status}
      </Badge>
    );
  };

  if (loading && list.length === 0) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "60px" }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ textAlign: "center", padding: "40px", color: "var(--danger)" }}
      >
        <p>Error loading distributors: {error}</p>
        <Button variant="primary" onClick={() => dispatch(fetchDistributors())}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
          Distributor Onboarding Requests
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Review and manage distributor applications
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border)",
          marginBottom: "24px",
        }}
      >
        {["PENDING", "APPROVED", "REJECTED"].map((status) => (
          <button
            key={status}
            onClick={() => setTab(status)}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderBottom:
                tab === status
                  ? "2px solid var(--primary)"
                  : "2px solid transparent",
              color: tab === status ? "var(--primary)" : "var(--text-muted)",
              transition: "all 0.2s",
            }}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
            <span
              style={{
                marginLeft: "8px",
                background: "var(--bg-muted)",
                padding: "2px 6px",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            >
              {list.filter((d) => d.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {filteredList.length === 0 ? (
        <EmptyState
          icon={<Truck size={48} />}
          title={`No ${tab.toLowerCase()} distributors`}
          subtitle={
            tab === "PENDING" ? "New applications will appear here" : ""
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredList.map((distributor) => (
            <div
              key={distributor._id}
              style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                padding: "20px",
                transition: "box-shadow 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                }}
              >
                {distributor.images?.profile ? (
                  <img
                    src={distributor.images.profile}
                    alt={distributor.name}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      background: "#f0f0f0",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: "var(--bg-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User2Icon size={28} color="#999" />
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    {distributor.name}
                  </h3>
                  {distributor.businessName && (
                    <p
                      style={{
                        color: "var(--text-muted)",
                        marginBottom: "4px",
                        fontSize: "14px",
                      }}
                    >
                      {distributor.businessName}
                    </p>
                  )}
                  <p
                    style={{ fontSize: "14px", color: "var(--text-secondary)" }}
                  >
                    📞 {distributor.mobile || distributor.phone || "—"}
                  </p>
                  {distributor.email && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      ✉️ {distributor.email}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "8px",
                  }}
                >
                  <button
                    onClick={() =>
                      handleDelete(distributor._id, distributor.name)
                    }
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "6px",
                      color: "#e01616",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fee2e2")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Trash2 size={20} />
                  </button>
                  <StatusBadge status={distributor.status} />
                </div>
              </div>

              {distributor.status === "PENDING" && (
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "20px",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleApprove(distributor._id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => openRejectModal(distributor)}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Distributor"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReject}>
              Reject
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to reject{" "}
          <strong>{selectedDistributor?.name}</strong>? This will move the
          application to the rejected list.
        </p>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   TERRITORY PAGE (unchanged)
═══════════════════════════════════════════════════════════════════════════════ */
export const TerritoryPage = () => {
  const dispatch = useDispatch();
  const { role } = useSelector(selectAuthState);
  const { data, loading } = useSelector((s) => s.territory);

  const [expandedState, setExpandedState] = useState(null);
  const [expandedDistrict, setExpandedDistrict] = useState(null);

  const [addModal, setAddModal] = useState(false);
  const [addVals, setAddVals] = useState({
    state: "",
    district: "",
    taluk: "",
  });
  const [addSaving, setAddSaving] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editVals, setEditVals] = useState({ taluk: "", beats: "" });
  const [editSaving, setEditSaving] = useState(false);

  const [assignModal, setAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignName, setAssignName] = useState("");
  const [assignSaving, setAssignSaving] = useState(false);

  const [beatModal, setBeatModal] = useState(false);
  const [beatTarget, setBeatTarget] = useState(null);
  const [beatName, setBeatName] = useState("");
  const [beatSaving, setBeatSaving] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    dispatch(fetchTerritory());
  }, [dispatch]);

  const canManage = ["Admin", "Radnus"].includes(role);

  const toggleState = (s) => {
    setExpandedState(expandedState === s ? null : s);
    setExpandedDistrict(null);
  };
  const toggleDistrict = (d) => {
    setExpandedDistrict(expandedDistrict === d ? null : d);
  };

  const handleDeleteClick = (type, payload) => {
    setDeleteType(type);
    setDeleteItem(payload);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === "state")
        await dispatch(deleteState(deleteItem)).unwrap();
      if (deleteType === "district")
        await dispatch(deleteDistrict(deleteItem)).unwrap();
      if (deleteType === "taluk")
        await dispatch(deleteTaluk(deleteItem)).unwrap();
      toast.success("Deleted successfully");
    } catch {
      toast.error("Delete failed");
    }
    setDeleteModal(false);
  };

  const getDeleteMessage = () => {
    if (deleteType === "state") return "Delete this state and all its data?";
    if (deleteType === "district")
      return "Delete this district and all its taluks?";
    if (deleteType === "taluk") return "Delete this taluk?";
    return "Are you sure you want to delete?";
  };

  const handleAdd = async () => {
    if (!addVals.state || !addVals.district || !addVals.taluk) {
      toast.error("All fields are required");
      return;
    }
    setAddSaving(true);
    try {
      await dispatch(
        addTerritory({
          state: addVals.state,
          district: addVals.district,
          taluk: addVals.taluk,
        }),
      ).unwrap();
      setAddModal(false);
      setAddVals({ state: "", district: "", taluk: "" });
      toast.success("Territory added");
    } catch {
      toast.error("Failed to add");
    } finally {
      setAddSaving(false);
    }
  };

  const openEdit = (item, stateName, districtName) => {
    setEditTarget({ ...item, state: stateName, district: districtName });
    setEditVals({
      taluk: item.taluk || "",
      beats: (item.beats || []).join(", "),
    });
    setEditModal(true);
  };

  const handleEdit = async () => {
    setEditSaving(true);
    try {
      const beats = editVals.beats
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean);
      await dispatch(
        updateTerritory({
          id: editTarget._id,
          data: {
            taluk: editVals.taluk,
            beats,
            state: editTarget.state,
            district: editTarget.district,
          },
        }),
      ).unwrap();
      setEditModal(false);
      toast.success("Updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  const openAssign = (item, stateName, districtName) => {
    setAssignTarget({ ...item, state: stateName, district: districtName });
    setAssignName(item.assignedTo || "");
    setAssignModal(true);
  };

  // const handleAssign = async () => {
  //   setAssignSaving(true);
  //   try {
  //     await dispatch(
  //       assignTaluk({ id: assignTarget._id, assignedTo: assignName }),
  //     ).unwrap();
  //     setAssignModal(false);
  //     toast.success("Assigned successfully");
  //   } catch {
  //     toast.error("Assign failed");
  //   } finally {
  //     setAssignSaving(false);
  //   }
  // };

  // --- Assign person ---
const handleAssign = async () => {
  if (!assignTarget) return;
  setAssignSaving(true);
  try {
    // Use the same full-update endpoint as mobile EditTerritory
    await dispatch(
      updateTerritory({
        id: assignTarget._id,
        data: {
          state: assignTarget.state,
          district: assignTarget.district,
          taluk: assignTarget.taluk,
          beats: assignTarget.beats || [],
          assignedTo: assignName.trim() || null,
          active: true,
        },
      }),
    ).unwrap();
    setAssignModal(false);
    toast.success("Assigned successfully");
  } catch (err) {
    toast.error(err || "Assign failed");
  } finally {
    setAssignSaving(false);
  }
};

  const openAddBeat = (item) => {
    setBeatTarget(item);
    setBeatName("");
    setBeatModal(true);
  };

  // const handleAddBeat = async () => {
  //   if (!beatName.trim()) {
  //     toast.error("Beat name required");
  //     return;
  //   }
  //   setBeatSaving(true);
  //   try {
  //     await dispatch(
  //       addBeat({ id: beatTarget._id, beat: beatName.trim() }),
  //     ).unwrap();
  //     setBeatModal(false);
  //     toast.success("Beat added");
  //   } catch {
  //     toast.error("Failed to add beat");
  //   } finally {
  //     setBeatSaving(false);
  //   }
  // };

  const handleAddBeat = async () => {
  if (!beatName.trim()) {
    toast.error("Beat name required");
    return;
  }
  if (!beatTarget) return;
  setBeatSaving(true);
  try {
    const updatedBeats = [...(beatTarget.beats || []), beatName.trim()];
    await dispatch(
      updateTerritory({
        id: beatTarget._id,
        data: {
          state: beatTarget.state,
          district: beatTarget.district,
          taluk: beatTarget.taluk,
          beats: updatedBeats,
          assignedTo: beatTarget.assignedTo || null,
          active: true,
        },
      }),
    ).unwrap();
    setBeatModal(false);
    toast.success("Beat added");
  } catch (err) {
    toast.error(err || "Failed to add beat");
  } finally {
    setBeatSaving(false);
  }
};

  const stateNames = Object.keys(data || {});

  return (
    <div>
      <SectionHeader
        title="Territory Mapping"
        action={
          canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddModal(true)}
            >
              + Add Territory
            </Button>
          )
        }
      />
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
        Manage state, district, taluk, and beat assignments
      </p>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Spinner size="lg" />
        </div>
      ) : stateNames.length === 0 ? (
        <EmptyState
          icon={<Map size={40} />}
          title="No territories configured"
          subtitle="Add states, districts and taluks"
          action={
            canManage && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddModal(true)}
              >
                + Add Territory
              </Button>
            )
          }
        />
      ) : (
        stateNames.map((stateName) => (
          <div key={stateName} className="terr-state-card">
            <div className="terr-state-row">
              <button
                className="terr-expand-btn"
                onClick={() => toggleState(stateName)}
              >
                {expandedState === stateName ? (
                  <ChevronDown size={20} color="var(--red)" />
                ) : (
                  <ChevronRight size={20} color="var(--red)" />
                )}
                <span className="terr-state-name">{stateName}</span>
              </button>
              {canManage && (
                <button
                  className="terr-delete-btn"
                  onClick={() => handleDeleteClick("state", stateName)}
                  title="Delete state"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {expandedState === stateName && (
              <div className="terr-districts-wrap">
                {Object.keys(data[stateName] || {}).map((districtName) => (
                  <div key={districtName} className="terr-district-block">
                    <div className="terr-district-row">
                      <button
                        className="terr-expand-btn"
                        onClick={() => toggleDistrict(districtName)}
                      >
                        {expandedDistrict === districtName ? (
                          <ChevronDown size={18} color="var(--red)" />
                        ) : (
                          <ChevronRight size={18} color="var(--red)" />
                        )}
                        <span className="terr-district-name">
                          {districtName}
                        </span>
                      </button>
                      {canManage && (
                        <button
                          className="terr-delete-btn"
                          onClick={() =>
                            handleDeleteClick("district", {
                              state: stateName,
                              district: districtName,
                            })
                          }
                          title="Delete district"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {expandedDistrict === districtName && (
                      <div className="terr-taluks-wrap">
                        {(data[stateName][districtName] || []).map(
                          (item, idx) => (
                            <div
                              key={item._id || idx}
                              className="terr-taluk-card"
                            >
                              <div className="terr-taluk-header">
                                <span className="terr-taluk-name">
                                  {item.taluk || "N/A"}
                                </span>
                                {canManage && (
                                  <div className="terr-taluk-actions">
                                    <button
                                      className="terr-icon-btn"
                                      onClick={() =>
                                        openEdit(item, stateName, districtName)
                                      }
                                      title="Edit"
                                    >
                                      <SquarePen size={18} />
                                    </button>
                                    <button
                                      className="terr-icon-btn terr-icon-delete"
                                      onClick={() =>
                                        handleDeleteClick("taluk", item._id)
                                      }
                                      title="Delete"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {item.assignedTo ? (
                                <div className="terr-assigned">
                                  <UserCheck size={13} /> Assigned:{" "}
                                  <strong>{item.assignedTo}</strong>
                                </div>
                              ) : (
                                <div className="terr-unassigned">
                                  Unassigned
                                </div>
                              )}

                              <div className="terr-beats-row">
                                {item.beats && item.beats.length > 0 ? (
                                  item.beats.map((beat, bi) => (
                                    <span key={bi} className="terr-beat-chip">
                                      {beat}
                                    </span>
                                  ))
                                ) : (
                                  <span className="terr-no-beats">
                                    No Beats
                                  </span>
                                )}
                              </div>

                              <div className="terr-btn-row">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() =>
                                    openAssign(item, stateName, districtName)
                                  }
                                >
                                  Assign
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => openAddBeat(item)}
                                >
                                  Add Beat
                                </Button>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Add Territory"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={addSaving} onClick={handleAdd}>
              Add Territory
            </Button>
          </>
        }
      >
        <Input
          label="State"
          placeholder="e.g. Tamil Nadu"
          value={addVals.state}
          onChange={(e) => setAddVals((p) => ({ ...p, state: e.target.value }))}
        />
        <Input
          label="District"
          placeholder="e.g. Chennai"
          value={addVals.district}
          onChange={(e) =>
            setAddVals((p) => ({ ...p, district: e.target.value }))
          }
        />
        <Input
          label="Taluk"
          placeholder="e.g. Ambattur"
          value={addVals.taluk}
          onChange={(e) => setAddVals((p) => ({ ...p, taluk: e.target.value }))}
        />
      </Modal>

      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Taluk"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={editSaving} onClick={handleEdit}>
              Save Changes
            </Button>
          </>
        }
      >
        <Input
          label="Taluk Name"
          value={editVals.taluk}
          onChange={(e) =>
            setEditVals((p) => ({ ...p, taluk: e.target.value }))
          }
        />
        <Input
          label="Beats (comma-separated)"
          placeholder="Beat 1, Beat 2"
          value={editVals.beats}
          onChange={(e) =>
            setEditVals((p) => ({ ...p, beats: e.target.value }))
          }
          hint="Enter beat names separated by commas"
        />
      </Modal>

      <Modal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        title={`Assign — ${assignTarget?.taluk || ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={assignSaving}
              onClick={handleAssign}
            >
              Assign
            </Button>
          </>
        }
      >
        <Input
          label="Assigned Person Name / ID"
          placeholder="Enter FSE name or ID"
          value={assignName}
          onChange={(e) => setAssignName(e.target.value)}
          autoFocus
        />
      </Modal>

      <Modal
        open={beatModal}
        onClose={() => setBeatModal(false)}
        title={`Add Beat — ${beatTarget?.taluk || ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBeatModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={beatSaving}
              onClick={handleAddBeat}
            >
              Add Beat
            </Button>
          </>
        }
      >
        <Input
          label="Beat Name"
          placeholder="e.g. Market Area"
          value={beatName}
          onChange={(e) => setBeatName(e.target.value)}
          autoFocus
        />
      </Modal>

      <ConfirmDialog
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Territory"
        message={getDeleteMessage()}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MANAGERS PAGE (unchanged)
════════════════════════════════════════════════════════════════════════════════ */


/* ─── Main Component ──────────────────────────────────────────────────────── */
export const ManagersPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.manager);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Form state matching mobile app fields
  const [formValues, setFormValues] = useState({
    name: '',
    dob: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
  });
  const [profilePhoto, setProfilePhoto] = useState(null); // { uri, name, type }
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    dispatch(getManagers());
  }, [dispatch]);

  const filteredList = list.filter((m) => m.status === activeTab);

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleFormChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview + store for FormData
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto({
          uri: reader.result,
          name: file.name,
          type: file.type,
          file: file,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formValues.name) errors.name = 'Name is required';
    if (!formValues.dob) errors.dob = 'Date of birth is required';
    if (!formValues.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formValues.email)) errors.email = 'Email is invalid';
    if (!formValues.phone) errors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formValues.phone)) errors.phone = 'Enter a valid 10-digit phone number';
    if (formValues.alternatePhone && !/^\d{10}$/.test(formValues.alternatePhone))
      errors.alternatePhone = 'Enter a valid 10-digit phone number';
    if (!formValues.address) errors.address = 'Address is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddManager = async () => {
    if (!validateForm()) return;
    setSaving(true);
    const fd = new FormData();
    // Append all text fields
    Object.entries(formValues).forEach(([k, v]) => v && fd.append(k, v));
    // Append photo if exists
    if (profilePhoto) {
      fd.append('photo', profilePhoto.file, profilePhoto.name);
    }
    try {
      await dispatch(addManager(fd)).unwrap();
      toast.success('Manager submitted for approval');
      setAddModalOpen(false);
      // Reset form
      setFormValues({ name: '', dob: '', email: '', phone: '', alternatePhone: '', address: '' });
      setProfilePhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err?.message || 'Failed to add manager');
    } finally {
      setSaving(false);
    }
  };

  // ── Approve / Reject / Delete ──────────────────────────────────────────────
  const handleApprove = (id) => {
    dispatch(updateManager({ id, data: { status: 'APPROVED' } }))
      .unwrap()
      .then(() => toast.success('Manager approved'))
      .catch(() => toast.error('Approval failed'));
  };

  const handleReject = (id) => {
    dispatch(updateManager({ id, data: { status: 'REJECTED' } }))
      .unwrap()
      .then(() => toast.success('Manager rejected'))
      .catch(() => toast.error('Rejection failed'));
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete ${name}? This action cannot be undone.`)) {
      dispatch(deleteManager(id))
        .unwrap()
        .then(() => toast.success('Manager removed'))
        .catch(() => toast.error('Delete failed'));
    }
  };

  // ── Loading & Empty states ─────────────────────────────────────────────────
  if (loading && list.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
            Marketing Managers
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage and review manager applications</p>
        </div>
        <Button variant="primary" onClick={() => setAddModalOpen(true)}>
          <Plus size={16} style={{ marginRight: 8 }} /> Add Manager
        </Button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === status ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === status ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
            <span
              style={{
                marginLeft: '8px',
                background: 'var(--bg-muted)',
                padding: '2px 6px',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            >
              {list.filter((m) => m.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {filteredList.length === 0 ? (
        <EmptyState
          icon={<UserCog size={48} />}
          title={`No ${activeTab.toLowerCase()} managers`}
          subtitle={activeTab === 'PENDING' ? 'New applications will appear here' : ''}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredList.map((manager) => (
            <div
              key={manager._id}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {/* Avatar / Photo */}
                {manager.photo ? (
                  <img
                    src={manager.photo}
                    alt={manager.name}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      background: '#f0f0f0',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'var(--bg-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User2Icon size={28} color="#999" />
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                    {manager.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    {manager.email || '—'}
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    📞 {manager.phone || '—'}
                  </p>
                  {manager.address && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      📍 {manager.address}
                    </p>
                  )}
                </div>

                {/* Actions & Status */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => handleDelete(manager._id, manager.name)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      color: '#e01616',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Trash2 size={20} />
                  </button>
                  <StatusBadge status={manager.status} />
                </div>
              </div>

              {/* Approve / Reject (only for PENDING) */}
              {manager.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <Button variant="success" size="sm" onClick={() => handleApprove(manager._id)}>
                    Approve
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleReject(manager._id)}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* FULL MANAGER ONBOARDING MODAL (matches mobile app) */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Manager Onboarding"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={handleAddManager}>
              Submit for Approval
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Profile Photo Upload */}
          <div style={{ textAlign: 'center' }}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
              id="manager-photo-input"
            />
            <label htmlFor="manager-photo-input" style={{ cursor: 'pointer' }}>
              {profilePhoto ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={profilePhoto.uri}
                    alt="Preview"
                    style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '55px',
                      objectFit: 'cover',
                      border: '2px solid var(--primary)',
                    }}
                  />
                  <button
                    onClick={() => {
                      setProfilePhoto(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      background: 'white',
                      borderRadius: '50%',
                      border: '1px solid var(--border)',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '55px',
                    background: 'var(--bg-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    border: '1px dashed var(--border)',
                    margin: '0 auto',
                  }}
                >
                  <Camera size={28} color="var(--primary)" />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Take Photo</span>
                </div>
              )}
            </label>
          </div>

          {/* Basic Details Section */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Basic Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                label="Name *"
                placeholder="Manager name"
                value={formValues.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={formErrors.name}
              />
              <Input
                label="Date of Birth *"
                type="date"
                value={formValues.dob}
                onChange={(e) => handleFormChange('dob', e.target.value)}
                error={formErrors.dob}
              />
              <Input
                label="Email *"
                type="email"
                placeholder="Email address"
                value={formValues.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                error={formErrors.email}
              />
              <Input
                label="Phone Number *"
                type="tel"
                placeholder="10-digit mobile"
                value={formValues.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                error={formErrors.phone}
              />
              <Input
                label="Alternate Phone Number"
                type="tel"
                placeholder="Optional"
                value={formValues.alternatePhone}
                onChange={(e) => handleFormChange('alternatePhone', e.target.value)}
                error={formErrors.alternatePhone}
              />
            </div>
          </div>

          {/* Address Details Section */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Address Details</h3>
            <Input
              label="Address *"
              placeholder="Full address"
              value={formValues.address}
              onChange={(e) => handleFormChange('address', e.target.value)}
              error={formErrors.address}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   EXECUTIVES PAGE (unchanged)
════════════════════════════════════════════════════════════════════════════════ */
export const ExecutivesPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.executive);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [vals, setVals] = useState({
    name: "",
    phone: "",
    email: "",
    territory: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [errs, setErrs] = useState({});

  useEffect(() => {
    dispatch(getExecutives());
  }, [dispatch]);

  const set = (k, v) => {
    setVals((p) => ({ ...p, [k]: v }));
    setErrs((p) => ({ ...p, [k]: "" }));
  };

  const handleSave = async () => {
    const e = {};
    if (!vals.name) e.name = "Name required";
    if (!vals.phone) e.phone = "Phone required";
    if (!vals.password || vals.password.length < 6) e.password = "Min 6 chars";
    if (Object.keys(e).length) {
      setErrs(e);
      return;
    }
    setSaving(true);
    const fd = new FormData();
    Object.entries(vals).forEach(([k, v]) => v && fd.append(k, v));
    try {
      await dispatch(addExecutive(fd)).unwrap();
      setModal(false);
      toast.success("Executive added");
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const filtered = list.filter(
    (e) => !search || e.name?.toLowerCase().includes(search.toLowerCase()),
  );
  const columns = [
    {
      key: "name",
      label: "Executive",
      render: (_, e) => (
        <div className="avatar-row">
          <Avatar name={e.name} size="sm" />
          <div className="avatar-row-info">
            <span className="avatar-row-name">{e.name}</span>
            <span className="avatar-row-sub">{e.email}</span>
          </div>
        </div>
      ),
    },
    { key: "phone", label: "Phone", render: (v) => v || "—" },
    {
      key: "territory",
      label: "Territory",
      render: (v) => (v ? <Badge variant="info">{v}</Badge> : "—"),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => statusBadge(v || "Active"),
    },
    {
      key: "_id",
      label: "Actions",
      render: (_, e) => (
        <div className="td-actions">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setDeleteId(e._id)}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Marketing Executives"
        count={list.length}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setVals({
                name: "",
                phone: "",
                email: "",
                territory: "",
                password: "",
              });
              setModal(true);
            }}
          >
            + Add Executive
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchValue={search}
        onSearch={setSearch}
        emptyIcon={<Users size={36} />}
        emptyText="No executives added"
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Add Marketing Executive"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              Add Executive
            </Button>
          </>
        }
      >
        <div className="form-row">
          <Input
            label="Full Name"
            placeholder="Executive name"
            value={vals.name}
            onChange={(e) => set("name", e.target.value)}
            error={errs.name}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="Phone"
            value={vals.phone}
            onChange={(e) => set("phone", e.target.value)}
            error={errs.phone}
          />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="Email"
          value={vals.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Input
          label="Territory"
          placeholder="e.g. Tamil Nadu"
          value={vals.territory}
          onChange={(e) => set("territory", e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min 6 chars"
          value={vals.password}
          onChange={(e) => set("password", e.target.value)}
          error={errs.password}
        />
      </Modal>
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          await dispatch(deleteExecutive(deleteId)).unwrap();
          toast.success("Removed");
        }}
        title="Remove Executive"
        message="Remove this executive?"
        confirmLabel="Remove"
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   FSE PAGE (unchanged)
════════════════════════════════════════════════════════════════════════════════ */
export const FSEPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.fse);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [vals, setVals] = useState({
    name: "",
    phone: "",
    email: "",
    territory: "",
    password: "",
  });
  const [errs, setErrs] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchFSE());
  }, [dispatch]);

  const set = (k, v) => {
    setVals((p) => ({ ...p, [k]: v }));
    setErrs((p) => ({ ...p, [k]: "" }));
  };

  const handleSave = async () => {
    const e = {};
    if (!vals.name) e.name = "Name required";
    if (!vals.phone) e.phone = "Phone required";
    if (!vals.password || vals.password.length < 6) e.password = "Min 6 chars";
    if (Object.keys(e).length) {
      setErrs(e);
      return;
    }
    setSaving(true);
    const fd = new FormData();
    Object.entries(vals).forEach(([k, v]) => v && fd.append(k, v));
    try {
      await dispatch(addFSE(fd)).unwrap();
      setModal(false);
      toast.success("FSE added");
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const filtered = list.filter(
    (f) =>
      !search ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.territory?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <SectionHeader
        title="Field Sales Executives"
        count={list.length}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setVals({
                name: "",
                phone: "",
                email: "",
                territory: "",
                password: "",
              });
              setModal(true);
            }}
          >
            + Add FSE
          </Button>
        }
      />

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={40} />} title="No FSEs found" />
      ) : (
        <div className="fse-grid">
          {filtered.map((f) => (
            <div key={f._id} className="fse-card">
              <div className="fse-card-head">
                <Avatar name={f.name} size="md" />
                <div className="fse-info">
                  <div className="fse-name">{f.name}</div>
                  <div className="fse-territory">{f.territory || "—"}</div>
                </div>
                <div
                  className="fse-status-dot"
                  style={{
                    background: f.isOnline
                      ? "var(--success)"
                      : "var(--text-muted)",
                    boxShadow: f.isOnline ? "0 0 8px var(--success)" : "none",
                  }}
                />
              </div>
              <div className="fse-card-footer">
                <div className="fse-stat">
                  <span className="fse-stat-lbl">Phone</span>
                  <span>{f.phone || "—"}</span>
                </div>
                <div className="fse-stat">
                  <span className="fse-stat-lbl">Status</span>
                  <span
                    style={{
                      color: f.isOnline
                        ? "var(--success)"
                        : "var(--text-muted)",
                    }}
                  >
                    {f.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="fse-stat">
                  <span className="fse-stat-lbl">Today</span>
                  <span>0 visits</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Add Field Sales Executive"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              Add FSE
            </Button>
          </>
        }
      >
        <div className="form-row">
          <Input
            label="Full Name"
            placeholder="FSE name"
            value={vals.name}
            onChange={(e) => set("name", e.target.value)}
            error={errs.name}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="Phone"
            value={vals.phone}
            onChange={(e) => set("phone", e.target.value)}
            error={errs.phone}
          />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="Email"
          value={vals.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Input
          label="Territory"
          placeholder="e.g. Chennai North"
          value={vals.territory}
          onChange={(e) => set("territory", e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min 6 chars"
          value={vals.password}
          onChange={(e) => set("password", e.target.value)}
          error={errs.password}
        />
      </Modal>
    </div>
  );
};
