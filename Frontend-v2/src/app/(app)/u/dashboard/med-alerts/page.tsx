"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { userApi } from "@/lib/api";
import BackToLogin from "@/components/BackToLogin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

type Category = {
  id: string;
  name: string;
  description?: string;
  color?: string;
};

type Reminder = {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  form: string;
  timeSlot: any[];
  isActive: boolean;
  isPaused: boolean;
  category: Category;
};

export default function MedAlertsPage() {
  const { isLoggedIn } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });
  const [reminderForm, setReminderForm] = useState<any>({
    categoryId: "",
    medicineName: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
    notes: "",
    form: "tablet",
    timeSlot: [],
  });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    type: "category" | "reminder" | null;
    id: string | null;
  }>({ type: null, id: null });

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    Promise.all([
      userApi.get("/api/medalert/categories"),
      userApi.get("/api/medalert/reminders"),
    ])
      .then(([catRes, remRes]) => {
        setCategories(catRes.data.data || catRes.data || []);
        setReminders(remRes.data.data || remRes.data || []);
      })
      .catch(() => toast.error("Failed to load MedAlert data"))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const handleCreateCategory = async () => {
    try {
      const res = await userApi.post("/api/medalert/categories", categoryForm);
      setCategories((prev) => [...prev, res.data.data || res.data]);
      setShowCategoryModal(false);
      setCategoryForm({ name: "", description: "", color: "#3b82f6" });
      toast.success("Category created");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create category");
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    try {
      await userApi.put(
        `/api/medalert/categories/${editingCategory.id}`,
        categoryForm
      );
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategory.id ? { ...cat, ...categoryForm } : cat
        )
      );
      setEditingCategory(null);
      setShowCategoryModal(false);
      setCategoryForm({ name: "", description: "", color: "#3b82f6" });
      toast.success("Category updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setDeleteModal({ type: "category", id });
  };

  const handleCreateReminder = async () => {
    try {
      const res = await userApi.post("/api/medalert/reminders", reminderForm);
      setReminders((prev) => [...prev, res.data.data || res.data]);
      setShowReminderModal(false);
      setReminderForm({
        categoryId: "",
        medicineName: "",
        dosage: "",
        frequency: "",
        startDate: "",
        endDate: "",
        notes: "",
        form: "tablet",
        timeSlot: [],
      });
      toast.success("Reminder created");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create reminder");
    }
  };

  const handleUpdateReminder = async () => {
    if (!editingReminder) return;
    try {
      const res = await userApi.put(
        `/api/medalert/reminders/${editingReminder.id}`,
        reminderForm
      );
      setReminders((prev) =>
        prev.map((rem) =>
          rem.id === editingReminder.id ? res.data.data || res.data : rem
        )
      );
      setEditingReminder(null);
      setShowReminderModal(false);
      setReminderForm({
        categoryId: "",
        medicineName: "",
        dosage: "",
        frequency: "",
        startDate: "",
        endDate: "",
        notes: "",
        form: "tablet",
        timeSlot: [],
      });
      toast.success("Reminder updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update reminder");
    }
  };

  const handleDeleteReminder = async (id: string) => {
    setDeleteModal({ type: "reminder", id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.type || !deleteModal.id) return;
    try {
      if (deleteModal.type === "category") {
        await userApi.delete(`/api/medalert/categories/${deleteModal.id}`);
        setCategories((prev) =>
          prev.filter((cat) => cat.id !== deleteModal.id)
        );
        toast.success("Category deleted");
      } else if (deleteModal.type === "reminder") {
        await userApi.delete(`/api/medalert/reminders/${deleteModal.id}`);
        setReminders((prev) => prev.filter((rem) => rem.id !== deleteModal.id));
        toast.success("Reminder deleted");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteModal({ type: null, id: null });
    }
  };

  const handlePauseReminder = async (reminderId: string) => {
    try {
      await userApi.put(`/api/medalert/reminders/${reminderId}/pause`);
      setReminders((prev) =>
        prev.map((rem) =>
          rem.id === reminderId ? { ...rem, isPaused: true } : rem
        )
      );
      toast.success("Reminder paused");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to pause reminder");
    }
  };

  const handleActivateReminder = async (reminderId: string) => {
    try {
      await userApi.put(`/api/medalert/reminders/${reminderId}/pause`);
      setReminders((prev) =>
        prev.map((rem) =>
          rem.id === reminderId ? { ...rem, isPaused: false } : rem
        )
      );
      toast.success("Reminder activated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to activate reminder");
    }
  };

  const filteredReminders = reminders.filter(
    (rem) =>
      rem.medicineName.toLowerCase().includes(search.toLowerCase()) ||
      rem.dosage.toLowerCase().includes(search.toLowerCase()) ||
      rem.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isLoggedIn) return <BackToLogin />;
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );

  return (
    <motion.section
      className="min-h-screen w-full pl-20 pr-5 pt-15 space-y-10 mb-10"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.6, ease: "anticipate" }}
    >
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ name: "", description: "", color: "#3b82f6" });
              setShowCategoryModal(true);
            }}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Category
          </Button>
          <div className="flex gap-3 flex-wrap">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border shadow-sm"
                style={{ borderTop: `4px solid ${cat.color || "#3b82f6"}` }}
              >
                <span className="font-semibold">{cat.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingCategory(cat);
                    setCategoryForm({
                      name: cat.name,
                      description: cat.description || "",
                      color: cat.color || "#3b82f6",
                    });
                    setShowCategoryModal(true);
                  }}
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteCategory(cat.id)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 justify-center">
          <Button
            onClick={() => {
              setEditingReminder(null);
              setReminderForm({
                categoryId: categories[0]?.id || "",
                medicineName: "",
                dosage: "",
                frequency: "",
                startDate: "",
                endDate: "",
                notes: "",
                form: "tablet",
                timeSlot: [],
              });
              setShowReminderModal(true);
            }}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" /> Create MedAlert
          </Button>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex-1 flex justify-center"
          >
            <div className="relative w-full max-w-md">
              <Input
                type="text"
                placeholder="Search reminders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-blue-400 transition-all bg-white"
                style={{ fontSize: "1rem" }}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
            </div>
          </motion.div>
        </div>
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredReminders.map((rem) => {
              const isPaused = rem.isPaused;
              return (
                <motion.div
                  key={rem.id}
                  layout
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ layout: { duration: 0.4, type: "spring" } }}
                >
                  <Card
                    className={clsx(
                      "relative p-4 shadow-lg border transition-all",
                      isPaused && "opacity-50 grayscale"
                    )}
                    style={{
                      borderTop: `6px solid ${
                        rem.category?.color || "#3b82f6"
                      }`,
                      background: isPaused ? "#f3f4f6" : undefined,
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold text-lg">
                        {rem.medicineName}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingReminder(rem);
                            setReminderForm({
                              categoryId: rem.category?.id || "",
                              medicineName: rem.medicineName,
                              dosage: rem.dosage,
                              frequency: rem.frequency,
                              startDate: rem.startDate?.slice(0, 10),
                              endDate: rem.endDate?.slice(0, 10) || "",
                              notes: rem.notes || "",
                              form: rem.form,
                              timeSlot: rem.timeSlot || [],
                            });
                            setShowReminderModal(true);
                          }}
                          title="Edit"
                          disabled={isPaused}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteReminder(rem.id)}
                          title="Delete"
                          disabled={isPaused}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm mb-2">
                      <div>
                        <span className="font-semibold">Category:</span>{" "}
                        {rem.category?.name}
                      </div>
                      <div>
                        <span className="font-semibold">Form:</span> {rem.form}
                      </div>
                      <div>
                        <span className="font-semibold">Dosage:</span>{" "}
                        {rem.dosage}
                      </div>
                      <div>
                        <span className="font-semibold">Frequency:</span>{" "}
                        {rem.frequency}
                      </div>
                      <div>
                        <span className="font-semibold">Start:</span>{" "}
                        {rem.startDate?.slice(0, 10)}
                      </div>
                      <div>
                        <span className="font-semibold">End:</span>{" "}
                        {rem.endDate?.slice(0, 10) || "-"}
                      </div>
                      <div>
                        <span className="font-semibold">Active:</span>{" "}
                        {rem.isActive ? "Yes" : "No"}
                      </div>
                      <div>
                        <span className="font-semibold">Paused:</span>{" "}
                        {rem.isPaused ? "Yes" : "No"}
                      </div>
                    </div>
                    {rem.notes && (
                      <div className="text-xs text-slate-500 mt-2">
                        <span className="font-semibold">Notes:</span>{" "}
                        {rem.notes}
                      </div>
                    )}
                    {rem.timeSlot && rem.timeSlot.length > 0 && (
                      <div className="text-xs text-slate-500 mt-2">
                        <span className="font-semibold">Time Slots:</span>{" "}
                        {rem.timeSlot
                          .map((slot: any) =>
                            typeof slot === "object"
                              ? `${slot.hour}:${slot.minute} ${slot.period}`
                              : slot
                          )
                          .join(", ")}
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      {!isPaused ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePauseReminder(rem.id)}
                        >
                          Pause
                        </Button>
                      ) : null}
                    </div>
                    {isPaused && (
                      <div
                        className="absolute inset-0 rounded-lg pointer-events-auto z-10 flex items-center justify-center"
                        style={{
                          background: "rgba(255,255,255,0.7)",
                        }}
                      >
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleActivateReminder(rem.id)}
                          className="pointer-events-auto"
                          style={{
                            filter: "none",
                            opacity: 1,
                            zIndex: 20,
                          }}
                        >
                          Activate
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="e.g. Heart Medication"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe this category"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>
            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={categoryForm.color}
                onChange={(e) =>
                  setCategoryForm((f) => ({ ...f, color: e.target.value }))
                }
                className="w-16 h-8 p-0 border-0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={
                editingCategory ? handleUpdateCategory : handleCreateCategory
              }
            >
              {editingCategory ? "Update" : "Create"}
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Drawer open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingReminder ? "Edit MedAlert" : "Create MedAlert"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <select
                className={`w-full border rounded px-2 py-1 ${
                  editingReminder ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                value={reminderForm.categoryId}
                onChange={
                  !editingReminder
                    ? (e) =>
                        setReminderForm((f: any) => ({
                          ...f,
                          categoryId: e.target.value,
                        }))
                    : undefined
                }
                disabled={!!editingReminder}
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Medicine Name</Label>
              <Input
                placeholder="e.g. Aspirin"
                value={reminderForm.medicineName}
                onChange={(e) =>
                  setReminderForm((f: any) => ({
                    ...f,
                    medicineName: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Dosage</Label>
              <Input
                placeholder="e.g. 100mg"
                value={reminderForm.dosage}
                onChange={(e) =>
                  setReminderForm((f: any) => ({
                    ...f,
                    dosage: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Frequency</Label>
              <Input
                placeholder="e.g. Once daily"
                value={reminderForm.frequency}
                onChange={(e) =>
                  setReminderForm((f: any) => ({
                    ...f,
                    frequency: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Form</Label>
              <select
                className="w-full border rounded px-2 py-1"
                value={reminderForm.form}
                onChange={(e) =>
                  setReminderForm((f: any) => ({ ...f, form: e.target.value }))
                }
                required
              >
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="syrup">Syrup</option>
                <option value="injection">Injection</option>
                <option value="ointment">Ointment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={reminderForm.startDate}
                onChange={(e) =>
                  setReminderForm((f: any) => ({
                    ...f,
                    startDate: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={reminderForm.endDate}
                onChange={(e) =>
                  setReminderForm((f: any) => ({
                    ...f,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2 col-span-1 md:col-span-3">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any special instructions or notes"
                value={reminderForm.notes}
                onChange={(e) =>
                  setReminderForm((f: any) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-2 col-span-1 md:col-span-3">
              <Label>
                Time Slots
                <span className="text-xs text-muted-foreground ml-2">
                  (Add one or more times)
                </span>
              </Label>
              <div className="flex flex-row gap-2">
                {reminderForm.timeSlot.map((slot: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1 mb-1">
                    <Input
                      type="time"
                      value={
                        slot.hour && slot.minute
                          ? `${slot.hour}:${slot.minute}`
                          : ""
                      }
                      onChange={(e) => {
                        const [hour, minute] = e.target.value.split(":");
                        setReminderForm((f: any) => {
                          const updated = [...f.timeSlot];
                          updated[idx] = {
                            hour: hour.padStart(2, "0"),
                            minute: minute.padStart(2, "0"),
                            period: Number(hour) >= 12 ? "PM" : "AM",
                          };
                          return { ...f, timeSlot: updated };
                        });
                      }}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setReminderForm((f: any) => ({
                          ...f,
                          timeSlot: f.timeSlot.filter(
                            (_: any, i: number) => i !== idx
                          ),
                        }));
                      }}
                      title="Remove"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReminderForm((f: any) => ({
                      ...f,
                      timeSlot: [
                        ...f.timeSlot,
                        { hour: "09", minute: "00", period: "AM" },
                      ],
                    }));
                  }}
                  className="w-fit"
                >
                  + Add Time Slot
                </Button>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <div className="flex w-full gap-4">
              <Button
                className="flex-1"
                onClick={
                  editingReminder ? handleUpdateReminder : handleCreateReminder
                }
              >
                {editingReminder ? "Update" : "Create"}
              </Button>
              <DrawerClose asChild>
                <Button className="flex-1" variant="outline">
                  Cancel
                </Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Dialog
        open={!!deleteModal.type}
        onOpenChange={() => setDeleteModal({ type: null, id: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div>
            Are you sure you want to delete this{" "}
            {deleteModal.type === "category" ? "category" : "reminder"}?
            <div className="text-xs text-muted-foreground mt-2">
              This action cannot be undone.
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}