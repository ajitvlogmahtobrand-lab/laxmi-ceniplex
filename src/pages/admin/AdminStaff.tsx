import React, { useState, useEffect } from "react";
import { UserCheck, Plus, Trash2, Edit2, Shield, Phone, Mail, CheckCircle2 } from "lucide-react";
import { storageService } from "../../services/storage";
import { StaffMember } from "../../types";

export const AdminStaff: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>(() => storageService.getStaff());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffMember["role"]>("BOX_OFFICE");
  const [department, setDepartment] = useState("Operations");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const refreshData = () => setStaff(storageService.getStaff());

  useEffect(() => {
    const handleUpdate = () => refreshData();
    window.addEventListener("lxm_storage_update", handleUpdate);
    return () => window.removeEventListener("lxm_storage_update", handleUpdate);
  }, []);

  const openAddModal = () => {
    setEditingStaff(null);
    setName("");
    setEmail("");
    setPhone("");
    setRole("BOX_OFFICE");
    setDepartment("Ticket Counter & Payments");
    setStatus("ACTIVE");
    setIsModalOpen(true);
  };

  const openEditModal = (s: StaffMember) => {
    setEditingStaff(s);
    setName(s.name);
    setEmail(s.email);
    setPhone(s.phone);
    setRole(s.role);
    setDepartment(s.department);
    setStatus(s.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const permissions =
      role === "SUPER_ADMIN"
        ? ["ALL_PERMISSIONS"]
        : role === "MANAGER"
        ? ["MANAGE_MOVIES", "MANAGE_SHOWS", "VERIFY_PAYMENTS", "MANAGE_BANNERS"]
        : role === "BOX_OFFICE"
        ? ["VIEW_BOOKINGS", "VERIFY_PAYMENTS", "COUNTER_TICKETING"]
        : ["SCAN_TICKETS", "VIEW_SCHEDULE"];

    const newStaff: StaffMember = {
      id: editingStaff ? editingStaff.id : "stf-" + Date.now().toString(36),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      department: department.trim(),
      permissions,
      status,
      createdAt: editingStaff ? editingStaff.createdAt : new Date().toISOString(),
      lastLogin: editingStaff ? editingStaff.lastLogin : new Date().toISOString(),
    };

    storageService.saveStaff(newStaff, "rajanbhogta");
    setIsModalOpen(false);
    refreshData();
  };

  const handleDelete = (id: string, name: string) => {
    if (name.includes("Rajan Bhogta")) {
      alert("Super Admin account cannot be deleted.");
      return;
    }
    if (confirm(`Remove staff account for "${name}"?`)) {
      storageService.deleteStaff(id, "rajanbhogta");
      refreshData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-cinema tracking-wide flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-red-500" />
            <span>Staff & Permission Management</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage theatre managers, box office cashiers, turnstile ushers, and administrative access controls.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="self-start sm:self-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((s) => (
          <div key={s.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4 hover:border-zinc-700 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-sm">
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    {s.name}
                    {s.role === "SUPER_ADMIN" && <Shield className="w-3.5 h-3.5 text-amber-400" />}
                  </h3>
                  <p className="text-xs text-zinc-400">{s.department}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-500"}`}>
                {s.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-400 pt-1 border-t border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>{s.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                <span>{s.phone || "No phone added"}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-zinc-800/80 text-xs">
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                {s.role.replace("_", " ")}
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEditModal(s)} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {s.role !== "SUPER_ADMIN" && (
                  <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 hover:bg-red-950/40 text-red-400 rounded-lg transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white">{editingStaff ? "Edit Staff Member" : "New Staff Account"}</h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Mobile Phone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1 font-semibold">Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none">
                    <option value="BOX_OFFICE">Box Office Cashier</option>
                    <option value="USHER">Turnstile Usher</option>
                    <option value="MANAGER">Theatre Manager</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1 font-semibold">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/30">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};