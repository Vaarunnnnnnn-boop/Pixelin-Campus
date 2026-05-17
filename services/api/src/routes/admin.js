import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// ─── Auth middleware ──────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
  if (req.session?.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  next();
}

// =============================================================================
// BUILDINGS
// =============================================================================

router.get("/buildings", requireAdmin, async (req, res) => {
  try {
    const buildings = await prisma.building.findMany({
      orderBy: { name: "asc" },
    });
    res.json(buildings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/buildings", requireAdmin, async (req, res) => {
  try {
    const { name, address } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

    const building = await prisma.building.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
      },
    });
    res.json(building);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/buildings/:id", requireAdmin, async (req, res) => {
  try {
    const { name, address, headName } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

    const building = await prisma.building.update({
      where: { id: req.params.id },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        headName: headName?.trim() || null,
      },
    });
    res.json(building);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/buildings/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.building.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================================
// DEPARTMENTS
// =============================================================================

router.get("/departments", requireAdmin, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: { building: true },
      orderBy: { name: "asc" },
    });
    res.json(departments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/departments", requireAdmin, async (req, res) => {
  try {
    const { buildingId, name, hodName } = req.body;
    if (!buildingId) return res.status(400).json({ error: "buildingId is required" });
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

    const department = await prisma.department.create({
      data: {
        buildingId,
        name: name.trim(),
        hodName: hodName?.trim() || null,
      },
      include: { building: true },
    });
    res.json(department);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/departments/:id", requireAdmin, async (req, res) => {
  try {
    const { name, hodName, buildingId } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: {
        name: name.trim(),
        hodName: hodName?.trim() || null,
        ...(buildingId ? { buildingId } : {}),
      },
      include: { building: true },
    });
    res.json(department);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/departments/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================================
// ROOMS
// =============================================================================

router.get("/rooms", requireAdmin, async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: { building: true, department: true },
      orderBy: { name: "asc" },
    });
    res.json(rooms);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/rooms", requireAdmin, async (req, res) => {
  try {
    const { buildingId, departmentId, name, label } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Room name/number is required" });
    if (!buildingId) return res.status(400).json({ error: "buildingId is required" });

    const room = await prisma.room.create({
      data: {
        buildingId,
        departmentId: departmentId || null,
        name: name.trim(),
        label: label?.trim() || null,
      },
      include: { building: true, department: true },
    });
    res.json(room);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/rooms/:id", requireAdmin, async (req, res) => {
  try {
    const { name, label, buildingId, departmentId } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Room name/number is required" });

    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: {
        name: name.trim(),
        label: label?.trim() || null,
        ...(buildingId ? { buildingId } : {}),
        departmentId: departmentId || null,
      },
      include: { building: true, department: true },
    });
    res.json(room);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/rooms/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.room.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================================
// SECTIONS
// =============================================================================

router.get("/sections", requireAdmin, async (req, res) => {
  try {
    const sections = await prisma.section.findMany({
      include: { department: { include: { building: true } } },
      orderBy: { name: "asc" },
    });
    res.json(sections);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/sections", requireAdmin, async (req, res) => {
  try {
    const { departmentId, name } = req.body;
    if (!departmentId) return res.status(400).json({ error: "departmentId is required" });
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

    const section = await prisma.section.create({
      data: { departmentId, name: name.trim() },
      include: { department: true },
    });
    res.json(section);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================================
// SUBJECTS
// =============================================================================

router.get("/subjects", requireAdmin, async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: { department: true },
      orderBy: { code: "asc" },
    });
    res.json(subjects);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/subjects", requireAdmin, async (req, res) => {
  try {
    const { departmentId, code, name } = req.body;
    if (!departmentId) return res.status(400).json({ error: "departmentId is required" });
    if (!code?.trim() || !name?.trim()) return res.status(400).json({ error: "Code and name are required" });

    const subject = await prisma.subject.create({
      data: { departmentId, code: code.trim(), name: name.trim() },
      include: { department: true },
    });
    res.json(subject);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================================
// USERS
// =============================================================================

router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/users", requireAdmin, async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash(password, 10);

    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.trim().toLowerCase(), role, passwordHash },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================================
// ENROLLMENTS
// =============================================================================

router.get("/enrollments", requireAdmin, async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        section: { include: { department: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(enrollments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/enrollments", requireAdmin, async (req, res) => {
  try {
    const { sectionId, studentId } = req.body;
    if (!sectionId || !studentId) return res.status(400).json({ error: "sectionId and studentId required" });

    const enrollment = await prisma.enrollment.create({
      data: { sectionId, studentId },
      include: {
        section: { include: { department: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(enrollment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================================
// FACULTY ASSIGNMENTS
// =============================================================================

router.get("/assignments", requireAdmin, async (req, res) => {
  try {
    const assignments = await prisma.facultyAssignment.findMany({
      include: {
        section: { include: { department: true } },
        subject: true,
        faculty: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(assignments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/assignments", requireAdmin, async (req, res) => {
  try {
    const { sectionId, subjectId, facultyId } = req.body;
    if (!sectionId || !subjectId || !facultyId) {
      return res.status(400).json({ error: "sectionId, subjectId, facultyId required" });
    }

    const assignment = await prisma.facultyAssignment.create({
      data: { sectionId, subjectId, facultyId },
      include: {
        section: { include: { department: true } },
        subject: true,
        faculty: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(assignment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================================
// TIMETABLE
// =============================================================================

router.get("/timetable", requireAdmin, async (req, res) => {
  try {
    const entries = await prisma.timetableEntry.findMany({
      include: {
        section: true,
        subject: true,
        room: { include: { building: true } },
        faculty: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    res.json(entries);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/timetable", requireAdmin, async (req, res) => {
  try {
    const { sectionId, subjectId, facultyId, roomId, dayOfWeek, startTime, endTime } = req.body;
    if (!sectionId || !subjectId || !facultyId || !roomId) {
      return res.status(400).json({ error: "sectionId, subjectId, facultyId, roomId required" });
    }
    if (!startTime || !endTime) return res.status(400).json({ error: "startTime and endTime required" });

    const entry = await prisma.timetableEntry.create({
      data: { sectionId, subjectId, facultyId, roomId, dayOfWeek: Number(dayOfWeek), startTime, endTime },
      include: {
        section: true,
        subject: true,
        room: { include: { building: true } },
        faculty: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;