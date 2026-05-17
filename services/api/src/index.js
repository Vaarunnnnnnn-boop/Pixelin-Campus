import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import multipart from "@fastify/multipart";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { startAutomation } from "./automation.js";

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

// Groq client (OpenAI-compatible)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

app.register(cors, {
  origin: [
    "http://localhost:3000",
    "https://pixelin-campus-web.vercel.app/"
  ],
  credentials: true
});

await app.register(cookie, {
  secret: "pixelin-dev-secret-change-me"
});

await app.register(multipart);


const SESSION_COOKIE = "pixelin_session";

// ---------- helpers ----------
function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function toUtcDateOnly(yyyyMmDd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) throw new Error("date must be YYYY-MM-DD");
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

async function getCurrentUser(req) {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (!sid) return null;

  const session = await prisma.session.findUnique({
    where: { id: sid },
    include: { user: true }
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;

  return session.user;
}

function requireRole(user, roles) {
  if (!user) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
  if (!roles.includes(user.role)) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
}

function safeTrim(s) {
  const t = (s || "").toString().trim();
  return t.length ? t : null;
}

// nice JSON errors
app.setErrorHandler((err, req, reply) => {
  const code = err.statusCode || 500;
  reply.code(code).send({ error: err.message || "Server error" });
});

// ---------- health ----------
app.get("/health", async () => ({ ok: true }));

// ---------- AI Assistant (Groq + tool calling) ----------
const LLM_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function isAdmin(user) {
  return user?.role === "ADMIN";
}

async function findDepartmentByNameInsensitive(name) {
  const n = (name || "").trim();
  if (!n) return null;

  const all = await prisma.department.findMany({
    select: { id: true, name: true, building: { select: { id: true, name: true } } }
  });

  return all.find((d) => d.name.toLowerCase() === n.toLowerCase()) || null;
}

async function findBuildingByNameInsensitive(name) {
  const n = (name || "").trim();
  if (!n) return null;

  const all = await prisma.building.findMany({ select: { id: true, name: true } });
  return all.find((b) => b.name.toLowerCase() === n.toLowerCase()) || null;
}

async function getOrCreateBuildingByName(buildingName) {
  const n = safeTrim(buildingName);
  if (!n) return null;

  const found = await findBuildingByNameInsensitive(n);
  if (found) return found;

  const created = await prisma.building.create({
    data: { name: n }
  });

  return { id: created.id, name: created.name };
}

async function runTool({ name, args, user }) {
  // Admin-only mutating tools:
  if (["createDepartment", "createSection", "createSubject", "createRoom", "createBuilding"].includes(name)) {
    if (!isAdmin(user)) {
      const err = new Error("Only admin can create data.");
      err.statusCode = 403;
      throw err;
    }
  }

  switch (name) {
    // ---------- CREATE ----------
    case "createBuilding": {
      const { buildingName, headName } = args || {};
      if (!buildingName) throw Object.assign(new Error("buildingName required"), { statusCode: 400 });

      const data = await prisma.building.create({
        data: { name: buildingName.trim(), headName: safeTrim(headName) }
      });

      return { ok: true, data };
    }

    case "createDepartment": {
      const { buildingName, deptName, hodName } = args || {};
      if (!deptName) throw Object.assign(new Error("deptName required"), { statusCode: 400 });

      const b = await getOrCreateBuildingByName(buildingName || "Main Building");
      const data = await prisma.department.create({
        data: {
          buildingId: b.id,
          name: deptName.trim(),
          hodName: safeTrim(hodName)
        }
      });

      return { ok: true, data };
    }

    case "createSection": {
      const { departmentName, sectionName } = args || {};
      if (!departmentName || !sectionName) {
        throw Object.assign(new Error("departmentName and sectionName required"), { statusCode: 400 });
      }

      const dept = await findDepartmentByNameInsensitive(departmentName);
      if (!dept) return { ok: false, error: `Department '${departmentName}' not found.` };

      const data = await prisma.section.create({
        data: { departmentId: dept.id, name: sectionName.trim() }
      });
      return { ok: true, data };
    }

    case "createSubject": {
      const { departmentName, subjectCode, subjectName } = args || {};
      if (!departmentName || !subjectCode || !subjectName) {
        throw Object.assign(new Error("departmentName, subjectCode, subjectName required"), { statusCode: 400 });
      }

      const dept = await findDepartmentByNameInsensitive(departmentName);
      if (!dept) return { ok: false, error: `Department '${departmentName}' not found.` };

      const data = await prisma.subject.create({
        data: {
          departmentId: dept.id,
          code: subjectCode.trim().toUpperCase(),
          name: subjectName.trim()
        }
      });

      return { ok: true, data };
    }

    case "createRoom": {
      const { buildingName, roomName, label, departmentName } = args || {};
      if (!roomName) throw Object.assign(new Error("roomName required"), { statusCode: 400 });

      const b = await getOrCreateBuildingByName(buildingName || "Main Building");

      let departmentId = null;
      if (departmentName) {
        const dept = await findDepartmentByNameInsensitive(departmentName);
        if (dept) departmentId = dept.id;
      }

      const data = await prisma.room.create({
        data: {
          buildingId: b.id,
          name: roomName.trim(),
          label: safeTrim(label),
          departmentId
        }
      });

      return { ok: true, data };
    }

    // ---------- LIST ----------
    case "listBuildings": {
      const data = await prisma.building.findMany({
        orderBy: { name: "asc" },
        include: { departments: true, rooms: true }
      });
      return { ok: true, data };
    }

    case "listDepartments": {
      const data = await prisma.department.findMany({
        include: { building: true },
        orderBy: [{ building: { name: "asc" } }, { name: "asc" }]
      });
      return { ok: true, data };
    }

    case "listSections": {
      const data = await prisma.section.findMany({
        include: { department: true },
        orderBy: [{ department: { name: "asc" } }, { name: "asc" }]
      });
      return { ok: true, data };
    }

    case "listSubjects": {
      const data = await prisma.subject.findMany({
        include: { department: true },
        orderBy: [{ department: { name: "asc" } }, { code: "asc" }]
      });
      return { ok: true, data };
    }

    // ---------- READ/QUERY ----------
    case "myTimetableTomorrow": {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const day = tomorrow.getDay();

      if (user.role === "FACULTY") {
        const data = await prisma.timetableEntry.findMany({
          where: { facultyId: user.id, dayOfWeek: day },
          include: { subject: true, room: { include: { building: true } }, section: true },
          orderBy: [{ startTime: "asc" }]
        });
        return { ok: true, data, meta: { dayOfWeek: day } };
      }

      if (user.role === "STUDENT") {
        const enrollment = await prisma.enrollment.findFirst({ where: { studentId: user.id } });
        if (!enrollment) return { ok: true, data: [], note: "Not enrolled in any section." };

        const data = await prisma.timetableEntry.findMany({
          where: { sectionId: enrollment.sectionId, dayOfWeek: day },
          include: { subject: true, room: { include: { building: true } }, faculty: true, section: true },
          orderBy: [{ startTime: "asc" }]
        });
        return { ok: true, data, meta: { dayOfWeek: day } };
      }

      const data = await prisma.timetableEntry.findMany({
        where: { dayOfWeek: day },
        include: { subject: true, room: { include: { building: true } }, faculty: true, section: true },
        orderBy: [{ startTime: "asc" }]
      });
      return { ok: true, data, meta: { dayOfWeek: day } };
    }

    case "search": {
      const { q } = args || {};
      if (!q) return { ok: true, data: [] };

      const kw = q.trim();

      const [buildings, departments, sections, subjects] = await Promise.all([
        prisma.building.findMany({ where: { name: { contains: kw } } }),
        prisma.department.findMany({ where: { name: { contains: kw } }, include: { building: true } }),
        prisma.section.findMany({ where: { name: { contains: kw } }, include: { department: true } }),
        prisma.subject.findMany({
          where: { OR: [{ code: { contains: kw } }, { name: { contains: kw } }] },
          include: { department: true }
        })
      ]);

      return { ok: true, data: { buildings, departments, sections, subjects } };
    }

    default:
      return { ok: false, error: `Unknown tool: ${name}` };
  }
}

const toolSpecs = [
  {
    type: "function",
    function: {
      name: "createBuilding",
      description: "Create a new building (ADMIN only).",
      parameters: {
        type: "object",
        properties: {
          buildingName: { type: "string" },
          headName: { type: "string" }
        },
        required: ["buildingName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "createDepartment",
      description: "Create a new department under a building (ADMIN only).",
      parameters: {
        type: "object",
        properties: {
          buildingName: { type: "string" },
          deptName: { type: "string" },
          hodName: { type: "string" }
        },
        required: ["deptName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "createSection",
      description: "Create a section under a department by department name (ADMIN only).",
      parameters: {
        type: "object",
        properties: {
          departmentName: { type: "string" },
          sectionName: { type: "string" }
        },
        required: ["departmentName", "sectionName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "createSubject",
      description: "Create a subject under a department by department name (ADMIN only).",
      parameters: {
        type: "object",
        properties: {
          departmentName: { type: "string" },
          subjectCode: { type: "string" },
          subjectName: { type: "string" }
        },
        required: ["departmentName", "subjectCode", "subjectName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "createRoom",
      description:
        "Create a room inside a building; optionally assign it to a department (ADMIN only).",
      parameters: {
        type: "object",
        properties: {
          buildingName: { type: "string" },
          roomName: { type: "string" },
          label: { type: "string" },
          departmentName: { type: "string" }
        },
        required: ["roomName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "listBuildings",
      description: "List buildings with departments and rooms.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "listDepartments",
      description: "List all departments.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "listSections",
      description: "List all sections with their departments.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "listSubjects",
      description: "List all subjects with their departments.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "myTimetableTomorrow",
      description: "Get tomorrow timetable for the current user.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "search",
      description: "Search buildings/departments/sections/subjects by keyword.",
      parameters: {
        type: "object",
        properties: { q: { type: "string" } },
        required: ["q"]
      }
    }
  }
];

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

app.post("/ai/chat", async (req, reply) => {
  const user = await getCurrentUser(req);
  if (!user) return reply.code(401).send({ error: "Unauthorized" });

  if (!process.env.GROQ_API_KEY) {
    return reply.code(500).send({ error: "GROQ_API_KEY not configured on server" });
  }

  const { message, pendingAction } = req.body || {};

  // Confirm -> execute tool
  if (pendingAction?.confirm === true) {
    const result = await runTool({
      name: pendingAction.name,
      args: pendingAction.args,
      user
    });

    return reply.send({
      mode: "executed",
      result,
      text: "Action completed successfully."
    });
  }

  if (!message) return reply.code(400).send({ error: "message required" });

  // ============================================================
  // SMART DIRECT QUERY ROUTING
  // Prevents hallucinations and wrong answers
  // ============================================================

  const lower = message.toLowerCase().trim();

  // ---------- EVENTS ----------
  if (
    lower.includes("event") ||
    lower.includes("events") ||
    lower.includes("upcoming")
  ) {
    const events = await prisma.event.findMany({
      orderBy: {
        startsAt: "asc"
      },
      take: 5
    });

    if (!events.length) {
      return reply.send({
        mode: "answered",
        text: "No upcoming events found."
      });
    }

    return reply.send({
      mode: "answered",
      text:
        "Upcoming Events:\n\n" +
        events
          .map(
            (e, i) =>
              `${i + 1}. ${e.title}\n📍 ${e.location || "Campus"}\n📅 ${new Date(
                e.startsAt
              ).toLocaleString()}`
          )
          .join("\n\n")
    });
  }

  // ---------- BUILDINGS ----------
  if (
    (
      lower.includes("building") ||
      lower.includes("buildings")
    ) &&

    !lower.startsWith("create building") &&
    !lower.startsWith("create a building") &&
    !lower.startsWith("add building")
  ) {
    const buildings =
      await prisma.building.findMany({
        include: {
          departments: true,
          rooms: true
        },
        orderBy: {
          name: "asc"
        }
      });

    if (!buildings.length) {
      return reply.send({
        mode: "answered",
        text: "No buildings found."
      });
    }

    return reply.send({
      mode: "answered",
      text:
        "Campus Buildings:\n\n" +
        buildings
          .map(
            (b, i) =>
              `${i + 1}. ${b.name}\nDepartments: ${
                b.departments.length
              }\nRooms: ${b.rooms.length}`
          )
          .join("\n\n")
    });
  }

  // =====================================
  // CREATE DEPARTMENT
  // =====================================

  if (
    lower.includes("create") &&
    lower.includes("department")
  ) {

    // ADMIN CHECK
    if (user.role !== "ADMIN") {
      return reply.send({
        mode: "answered",
        text: "Only admin can create departments."
      });
    }

    // EXTRACT NAME
    const match =
      message.match(
        /department\s+(.+)/i
      );

    const deptName =
      match?.[1]?.trim();

    if (!deptName) {
      return reply.send({
        mode: "answered",
        text:
          "Please provide department name."
      });
    }

    // ASK CONFIRMATION
    return reply.send({
      mode: "pending",
      text:
        `Do you want to create department "${deptName}"?`,
      pendingAction: {
        name: "createDepartment",
        args: {
          deptName
        }
      }
    });
  }

  // ---------- DEPARTMENTS ----------
  if (
    (
      lower.includes("department") ||
      lower.includes("departments")
    ) &&

    !lower.startsWith("create department") &&
    !lower.startsWith("create a department") &&
    !lower.startsWith("create new department") &&
    !lower.startsWith("add department") &&
    !lower.startsWith("make department")
  ) {

    const departments =
      await prisma.department.findMany({
        include: {
          building: true
        },
        orderBy: {
          name: "asc"
        }
      });

    if (!departments.length) {
      return reply.send({
        mode: "answered",
        text: "No departments found."
      });
    }

    return reply.send({
      mode: "answered",
      text:
        "Departments:\n\n" +
        departments
          .map(
            (d, i) =>
              `${i + 1}. ${d.name}\n🏢 ${d.building?.name || "Unknown Building"}`
          )
          .join("\n\n")
    });
  }

  // ---------- ROOMS ----------
  if (
    (
      lower.includes("room") ||
      lower.includes("lab") ||
      lower.includes("classroom")
    ) &&

    !lower.startsWith("create room") &&
    !lower.startsWith("add room")
  ) {
    const rooms =
      await prisma.room.findMany({
        include: {
          building: true,
          department: true
        },
        orderBy: {
          name: "asc"
        },
        take: 20
      });

    if (!rooms.length) {
      return reply.send({
        mode: "answered",
        text: "No rooms found."
      });
    }

    return reply.send({
      mode: "answered",
      text:
        "Campus Rooms:\n\n" +
        rooms
          .map(
            (r, i) =>
              `${i + 1}. ${r.name}\n🏢 ${r.building?.name || ""}\n📘 ${
                r.department?.name || "General"
              }`
          )
          .join("\n\n")
    });
  }

  // ---------- FACULTY TIMETABLE ----------
  if (
    user.role === "FACULTY" &&
    (
      lower.includes("timetable") ||
      lower.includes("lecture") ||
      lower.includes("class")
    )
  ) {
    const data =
      await prisma.timetableEntry.findMany({
        where: {
          facultyId: user.id
        },
        include: {
          subject: true,
          section: true,
          room: true
        },
        orderBy: [
          {
            dayOfWeek: "asc"
          },
          {
            startTime: "asc"
          }
        ]
      });

    if (!data.length) {
      return reply.send({
        mode: "answered",
        text: "No timetable assigned yet."
      });
    }

    return reply.send({
      mode: "answered",
      text:
        "Your Timetable:\n\n" +
        data
          .map(
            (t) =>
              `📘 ${t.subject?.name}\n👨‍🎓 Section: ${t.section?.name}\n🏢 Room: ${t.room?.name}\n⏰ ${t.startTime} - ${t.endTime}`
          )
          .join("\n\n")
    });
  }

  // ---------- STUDENT TIMETABLE ----------
  if (
    user.role === "STUDENT" &&
    (
      lower.includes("timetable") ||
      lower.includes("lecture") ||
      lower.includes("class")
    )
  ) {
    const enrollment =
      await prisma.enrollment.findFirst({
        where: {
          studentId: user.id
        }
      });

    if (!enrollment) {
      return reply.send({
        mode: "answered",
        text: "You are not enrolled in any section."
      });
    }

    const data =
      await prisma.timetableEntry.findMany({
        where: {
          sectionId: enrollment.sectionId
        },
        include: {
          subject: true,
          faculty: true,
          room: true
        },
        orderBy: [
          {
            dayOfWeek: "asc"
          },
          {
            startTime: "asc"
          }
        ]
      });

    if (!data.length) {
      return reply.send({
        mode: "answered",
        text: "No timetable found."
      });
    }

    return reply.send({
      mode: "answered",
      text:
        "Your Timetable:\n\n" +
        data
          .map(
            (t) =>
              `📘 ${t.subject?.name}\n👨‍🏫 ${t.faculty?.name}\n🏢 ${t.room?.name}\n⏰ ${t.startTime} - ${t.endTime}`
          )
          .join("\n\n")
    });
  }

  // ---------- ATTENDANCE ----------
  if (
    lower.includes("attendance")
  ) {

    if (user.role !== "STUDENT") {
      return reply.send({
        mode: "answered",
        text: "Attendance summary is available only for students."
      });
    }

    const records =
      await prisma.attendance.findMany({
        where: {
          studentId: user.id
        }
      });

    if (!records.length) {
      return reply.send({
        mode: "answered",
        text: "No attendance records found."
      });
    }

    const present =
      records.filter(
        (r) => r.status === "PRESENT"
      ).length;

    const total = records.length;

    const percentage =
      Math.round(
        (present / total) * 100
      );

    return reply.send({
      mode: "answered",
      text:
        `Your attendance is ${percentage}%.\n\nPresent: ${present}\nTotal Classes: ${total}`
    });
  }

  const system = `
You are Pixelin Assistant.

Rules:
- Current user role: ${user.role}
- If user is not ADMIN: never call mutating tools.
- For ADMIN: you MAY propose create tools, but the server will require confirmation before execution.
- If user asks for counts/lists, use list tools.
- Keep responses concise.
When you call a tool, do NOT repeat the tool call again after receiving tool results. Provide the final answer.
`;

  const messages = [
    { role: "system", content: system },
    { role: "user", content: message }
  ];

  for (let step = 0; step < 3; step++) {
    const completion = await groq.chat.completions.create({
      model: LLM_MODEL,
      messages,
      tools: toolSpecs,
      tool_choice: "auto",
      temperature: 0.2
    });

    const assistantMsg = completion.choices?.[0]?.message;

    const toolCalls = assistantMsg?.tool_calls || [];
    if (toolCalls.length > 0) {
      const first = toolCalls[0];
      const name = first.function?.name;
      const args = safeJsonParse(first.function?.arguments || "{}");

      const mutating = ["createBuilding", "createDepartment", "createSection", "createSubject", "createRoom"].includes(
        name
      );

      if (mutating && user.role !== "ADMIN") {
        return reply.send({ mode: "answered", text: "Only ADMIN can create or edit data." });
      }

      if (mutating) {
        return reply.send({
          mode: "pending",
          text: `I will run: ${name} with ${JSON.stringify(args)}. Confirm?`,
          pendingAction: { name, args }
        });
      }

      const toolResult = await runTool({ name, args, user });

      messages.push({
        role: "assistant",
        content: "",
        tool_calls: toolCalls
      });

      messages.push({
        role: "tool",
        tool_call_id: first.id,
        name,
        content: JSON.stringify(toolResult)
      });

      continue;
    }

    const text = assistantMsg?.content?.trim();
    return reply.send({ mode: "answered", text: text || "OK" });
  }

  return reply.send({
    mode: "answered",
    text: "I tried to fetch that, but the assistant got stuck. Please try again or rephrase."
  });
});

// ---------- DEV seed: first admin (optional) ----------
app.post("/seed/admin", async (req, reply) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return reply.code(400).send({ error: "email, password, name required" });
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) {
    return reply.code(400).send({ error: "Admin already exists." });
  }

  const user = await prisma.user.create({
    data: {
      email: normalizeEmail(email),
      name: name.trim(),
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 10)
    },
    select: { id: true, email: true, name: true, role: true }
  });

  return { data: user };
});

// ---------- AUTH ----------
app.post("/auth/register", async (req, reply) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password || !role) {
    return reply.code(400).send({ error: "name, email, password, role required" });
  }

  const allowed = ["ADMIN", "FACULTY", "STUDENT"];
  if (!allowed.includes(role)) {
    return reply.code(400).send({ error: "role must be ADMIN, FACULTY, or STUDENT" });
  }

  const normalizedEmail = normalizeEmail(email);
  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) return reply.code(400).send({ error: "Email already registered" });

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      role,
      passwordHash: await bcrypt.hash(password, 10)
    },
    select: { id: true, name: true, email: true, role: true }
  });

  return { data: user };
});

app.post("/auth/login", async (req, reply) => {
  const { email, password } = req.body || {};
  if (!email || !password) return reply.code(400).send({ error: "email and password required" });

  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user) return reply.code(401).send({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return reply.code(401).send({ error: "Invalid credentials" });

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const session = await prisma.session.create({ data: { userId: user.id, expiresAt } });

  reply.setCookie(SESSION_COOKIE, session.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax"
  });

  return { data: { id: user.id, name: user.name, role: user.role, email: user.email } };
});

app.get("/auth/me", async (req) => {
  const user = await getCurrentUser(req);
  if (!user) return { data: null };
  return { data: { id: user.id, name: user.name, role: user.role, email: user.email } };
});

app.post("/auth/logout", async (req, reply) => {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (sid) await prisma.session.delete({ where: { id: sid } }).catch(() => {});
  reply.clearCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true };
});

// ---------- Admin CRUD (Infrastructure) ----------
app.get("/admin/buildings", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const data = await prisma.building.findMany({
    orderBy: { name: "asc" },
    include: {
      departments: { orderBy: { name: "asc" } },
      rooms: { orderBy: { name: "asc" } }
    }
  });

  return { data };
});

app.post("/admin/buildings", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const { name, headName, code } = req.body || {};

  if (!name) {
    throw Object.assign(
      new Error("name required"),
      { statusCode: 400 }
    );
  }

  const data = await prisma.building.create({
    data: {
      name: name.trim()
    }
  });

  return { data };
});

app.put("/admin/buildings/:id", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const { id } = req.params;
  const { name, headName, code } = req.body || {};

  if (!name) throw Object.assign(new Error("name required"), { statusCode: 400 });

  const data = await prisma.building.update({
    where: { id: parseInt(id) },
    data: {
      name: name.trim()
    }
  });

  return { data };
});

app.delete("/admin/buildings/:id", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const { id } = req.params;

  await prisma.building.delete({
    where: { id: parseInt(id) }
  });

  return { data: { success: true } };
});



app.post("/admin/departments", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const { buildingId, name, hodName } = req.body || {};
  if (!buildingId || !name) {
    throw Object.assign(new Error("buildingId and name required"), { statusCode: 400 });
  }

  const data = await prisma.department.create({
    data: {
      buildingId,
      name: name.trim(),
      hodName: safeTrim(hodName)
    }
  });

  return { data };
});



app.get("/admin/departments", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const buildingId = req.query?.buildingId;

  const data = await prisma.department.findMany({
    where: buildingId
      ? { buildingId: parseInt(buildingId) }
      : undefined,

    include: { building: true },

    orderBy: [
      { building: { name: "asc" } },
      { name: "asc" }
    ]
  });

  return { data };
});

app.get("/admin/rooms", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const buildingId = req.query?.buildingId?.toString();

  const data = await prisma.room.findMany({
    where: buildingId
      ? { buildingId: parseInt(buildingId) }
      : undefined,
    include: { building: true, department: true },
    orderBy: [{ building: { name: "asc" } }, { name: "asc" }]
  });

  return { data };
});

app.post("/admin/rooms", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const {
    buildingId,
    name,
    departmentId
  } = req.body || {};

  if (!buildingId || !name) {
    throw Object.assign(
      new Error("buildingId and name required"),
      { statusCode: 400 }
    );
  }

  const data = await prisma.room.create({
    data: {
      buildingId,
      name: name.trim(),
      departmentId: departmentId || null
    }
  });

  return { data };
});


app.put("/admin/rooms/:id", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const { id } = req.params;

  const {
    buildingId,
    name,
    departmentId
  } = req.body || {};

  const data = await prisma.room.update({
    where: { id },

    data: {
      buildingId,
      name: name.trim(),
      departmentId: departmentId || null
    },

    include: {
      building: true,
      department: true
    }
  });

  return { data };
});

app.delete("/admin/rooms/:id", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const { id } = req.params;

  await prisma.room.delete({
    where: { id: parseInt(id) }
  });

  return { data: { success: true } };
});

// ---------- Infrastructure (read-only for any logged-in user) ----------
app.get("/infra/buildings", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN", "FACULTY", "STUDENT"]);

  const data = await prisma.building.findMany({
    orderBy: { name: "asc" },
    include: {
      departments: { orderBy: { name: "asc" } },
      rooms: { orderBy: { name: "asc" }, include: { department: true } }
    }
  });

  return { data };
});

app.get("/infra/departments", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN", "FACULTY", "STUDENT"]);

  const data = await prisma.department.findMany({
    include: { building: true },
    orderBy: [{ building: { name: "asc" } }, { name: "asc" }]
  });

  return { data };
});

app.get("/infra/rooms", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN", "FACULTY", "STUDENT"]);

  const data = await prisma.room.findMany({
    include: { building: true, department: true },
    orderBy: [{ building: { name: "asc" } }, { name: "asc" }]
  });

  return { data };
});

// ---------- EVENTS ----------

app.get("/events", async () => {
  const data = await prisma.event.findMany({
    orderBy: {
      startsAt: "asc"
    }
  });

  return { data };
});

app.post("/admin/events", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const parts = req.parts();

  let title = "";
  let details = "";
  let description = "";
  let location = "";
  let startsAt = "";
  let poster = null;

  for await (const part of parts) {
    if (part.type === "file") {
      const ext = path.extname(part.filename || "");

      const fileName = `${Date.now()}${ext}`;

      const savePath = path.join(
        process.cwd(),
        "uploads/events",
        fileName
      );

      await pipeline(part.file, fs.createWriteStream(savePath));

      poster = `/uploads/events/${fileName}`;
    } else {
      if (part.fieldname === "title") title = part.value;
      if (part.fieldname === "details") details = part.value;
      if (part.fieldname === "description") description = part.value;
      if (part.fieldname === "location") location = part.value;
      if (part.fieldname === "startsAt") startsAt = part.value;
    }
  }

  if (!title || !startsAt) {
    throw Object.assign(
      new Error("title and startsAt required"),
      { statusCode: 400 }
    );
  }

  const data = await prisma.event.create({
    data: {
      title: title.trim(),
      details: details?.trim() || null,
      description: description?.trim() || null,
      location: location?.trim() || null,
      startsAt: new Date(startsAt),
      poster
    }
  });

  return { data };
});

app.delete("/admin/events/:id", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const { id } = req.params;

  await prisma.event.delete({
    where: { id }
  });

  return {
    data: {
      success: true
    }
  };
});

// ---------- Admin CRUD (existing: sections/subjects/users/enrollments/assignments/timetable) ----------
app.get("/admin/sections", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);
  const data = await prisma.section.findMany({
    include: { department: { include: { building: true } } },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }]
  });
  return { data };
});

app.post("/admin/sections", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);
  const { departmentId, name } = req.body || {};
  if (!departmentId || !name) {
    throw Object.assign(new Error("departmentId and name required"), { statusCode: 400 });
  }
  const data = await prisma.section.create({ data: { departmentId, name: name.trim() } });
  return { data };
});

app.get("/admin/subjects", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);
  const data = await prisma.subject.findMany({
    include: { department: { include: { building: true } } },
    orderBy: [{ department: { name: "asc" } }, { code: "asc" }]
  });
  return { data };
});

app.post("/admin/subjects", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);
  const { departmentId, code, name } = req.body || {};
  if (!departmentId || !code || !name) {
    throw Object.assign(new Error("departmentId, code, name required"), { statusCode: 400 });
  }
  const data = await prisma.subject.create({
    data: { departmentId, code: code.trim().toUpperCase(), name: name.trim() }
  });
  return { data };
});

app.get("/admin/users", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);
  const data = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });
  return { data };
});

app.post("/admin/users", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);
  const { name, email, role, password } = req.body || {};
  if (!name || !email || !role || !password) {
    throw Object.assign(new Error("name, email, role, password required"), { statusCode: 400 });
  }

  const allowed = ["ADMIN", "FACULTY", "STUDENT"];
  if (!allowed.includes(role)) {
    throw Object.assign(new Error("role must be ADMIN, FACULTY, or STUDENT"), { statusCode: 400 });
  }

  const data = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizeEmail(email),
      role,
      passwordHash: await bcrypt.hash(password, 10)
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  return { data };
});

app.get("/admin/enrollments", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);
  const data = await prisma.enrollment.findMany({
    include: { section: { include: { department: { include: { building: true } } } }, student: true }
  });
  return { data };
});

app.post("/admin/enrollments", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);
  const { sectionId, studentId } = req.body || {};
  if (!sectionId || !studentId) {
    throw Object.assign(new Error("sectionId, studentId required"), { statusCode: 400 });
  }

  const stu = await prisma.user.findUnique({ where: { id: studentId } });
  if (!stu || stu.role !== "STUDENT") {
    throw Object.assign(new Error("studentId must be a STUDENT user"), { statusCode: 400 });
  }

  const data = await prisma.enrollment.create({ data: { sectionId, studentId } });
  return { data };
});

app.get("/admin/assignments", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);
  const data = await prisma.facultyAssignment.findMany({
    include: {
      section: { include: { department: { include: { building: true } } } },
      subject: true,
      faculty: true
    }
  });
  return { data };
});

app.post("/admin/assignments", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);
  const { sectionId, subjectId, facultyId } = req.body || {};
  if (!sectionId || !subjectId || !facultyId) {
    throw Object.assign(new Error("sectionId, subjectId, facultyId required"), { statusCode: 400 });
  }

  const fac = await prisma.user.findUnique({ where: { id: facultyId } });
  if (!fac || fac.role !== "FACULTY") {
    throw Object.assign(new Error("facultyId must be a FACULTY user"), { statusCode: 400 });
  }

  const data = await prisma.facultyAssignment.create({ data: { sectionId, subjectId, facultyId } });
  return { data };
});

app.post("/student/leave", async (req) => {
  const user = await getCurrentUser(req);

  requireRole(user, ["STUDENT"]);

  const parts = req.parts();

  let title = "";
  let description = "";
  let department = "";
  let enrollmentNo = "";
  let studentName = "";
  let requestedDays = "1";
  let startDate = "";
  let medicalFile = null;

  for await (const part of parts) {
    if (part.type === "file") {
      const ext = path.extname(part.filename || "");

      const fileName = `${Date.now()}${ext}`;

      const savePath = path.join(
        process.cwd(),
        "uploads/leave-certificates",
        fileName
      );

      await pipeline(part.file, fs.createWriteStream(savePath));

      medicalFile = `/uploads/leave-certificates/${fileName}`;
    } else {
      if (part.fieldname === "title") title = part.value;
      if (part.fieldname === "description") description = part.value;
      if (part.fieldname === "department") department = part.value;
      if (part.fieldname === "enrollmentNo") enrollmentNo = part.value;
      if (part.fieldname === "studentName") studentName = part.value;
      if (part.fieldname === "requestedDays") requestedDays = part.value;
      if (part.fieldname === "startDate") startDate = part.value;
    }
  }

  const data = await prisma.leaveApplication.create({
    data: {
      studentId: user.id,
      title,
      description,
      department,
      enrollmentNo,
      studentName,
      requestedDays: parseInt(requestedDays),
      startDate: new Date(startDate),
      medicalFile
    }
  });

  return { data };
});

app.get("/student/leave", async (req) => {
  const user = await getCurrentUser(req);

  requireRole(user, ["STUDENT"]);

  const data = await prisma.leaveApplication.findMany({
    where: {
      studentId: user.id
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return { data };
});

app.get("/admin/leaves", async (req) => {
  const user = await getCurrentUser(req);

  requireRole(user, ["ADMIN"]);

  const data = await prisma.leaveApplication.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  return { data };
});

app.put("/admin/leaves/:id/approve", async (req) => {
  const user = await getCurrentUser(req);

  requireRole(user, ["ADMIN"]);

  const { id } = req.params;

  const { approvedDays } = req.body || {};

  const leave = await prisma.leaveApplication.findUnique({
    where: { id }
  });

  if (!leave) {
    throw new Error("Leave not found");
  }

  const updated = await prisma.leaveApplication.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedDays: parseInt(approvedDays)
    }
  });

  for (let i = 0; i < parseInt(approvedDays); i++) {
    const d = new Date(leave.startDate);

    d.setDate(d.getDate() + i);

    await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: leave.studentId,
          date: d
        }
      },

      update: {
        status: "PRESENT"
      },
      create: {
        studentId: leave.studentId,
        date: d,
        status: "PRESENT"
      }
    });
  }

  return { data: updated };
});

app.put("/admin/leaves/:id/reject", async (req) => {
  const user = await getCurrentUser(req);

  requireRole(user, ["ADMIN"]);

  const { id } = req.params;

  const data = await prisma.leaveApplication.update({
    where: { id },
    data: {
      status: "REJECTED",
      approvedDays: 0
    }
  });

  return { data };
});

app.post("/faculty/attendance", async (req) => {
  const user = await getCurrentUser(req);

  requireRole(user, ["FACULTY"]);

  const {
    studentId,
    status,
    subject,
    date
  } = req.body || {};

  const data = await prisma.attendance.upsert({
    where: {
      studentId_date: {
        studentId,
        date: new Date(date)
      }
    },

    update: {
      status,
      facultyId: user.id,
      subject
    },

    create: {
      studentId,
      facultyId: user.id,
      status,
      subject,
      date: new Date(date)
    }
  });

  return { data };
});

app.get("/student/attendance", async (req) => {
  const user = await getCurrentUser(req);

  requireRole(user, ["STUDENT"]);

  const data = await prisma.attendance.findMany({
    where: {
      studentId: user.id
    },
    orderBy: {
      date: "desc"
    }
  });

  return { data };
});

// ---------- Timetable ----------
app.get("/admin/timetable", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);
  const data = await prisma.timetableEntry.findMany({
    include: { section: true, subject: true, room: { include: { building: true } }, faculty: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });
  return { data };
});

app.post("/admin/timetable", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);
  const { sectionId, subjectId, facultyId, roomId, dayOfWeek, startTime, endTime } = req.body || {};
  if (!sectionId || !subjectId || !facultyId || !roomId || dayOfWeek === undefined || !startTime || !endTime) {
    throw Object.assign(
      new Error("sectionId, subjectId, facultyId, roomId, dayOfWeek, startTime, endTime required"),
      { statusCode: 400 }
    );
  }

  const data = await prisma.timetableEntry.create({
    data: {
      sectionId,
      subjectId,
      facultyId,
      roomId,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime
    }
  });

  return { data };
});

// ============================================================
// ADD THIS to services/api/src/index.js
// Place it RIGHT AFTER your existing app.post("/admin/timetable", ...) route
// ============================================================

app.delete("/admin/timetable/:id", async (req, reply) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN"]);

  const { id } = req.params;
  await prisma.timetableEntry.delete({ where: { id } });
  return { ok: true };
});

// Student timetable (based on enrollment)
app.get("/student/timetable", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["STUDENT"]);

  const enrollment = await prisma.enrollment.findFirst({ where: { studentId: user.id } });
  if (!enrollment) return { data: [] };

  const data = await prisma.timetableEntry.findMany({
    where: { sectionId: enrollment.sectionId },
    include: { subject: true, room: { include: { building: true } }, faculty: true, section: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });

  return { data };
});

// Faculty timetable
app.get("/faculty/timetable", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["FACULTY"]);

  const data = await prisma.timetableEntry.findMany({
    where: { facultyId: user.id },
    include: { subject: true, room: { include: { building: true } }, section: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });

  return { data };
});

// ---------- Attendance ----------
app.post("/attendance/session", async (req, reply) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["FACULTY"]);

  const { sectionId, subjectId, date } = req.body || {};
  if (!sectionId || !subjectId || !date) {
    return reply.code(400).send({ error: "sectionId, subjectId, date required" });
  }

  const assignment = await prisma.facultyAssignment.findFirst({
    where: { sectionId, subjectId, facultyId: user.id }
  });
  if (!assignment) return reply.code(403).send({ error: "Not assigned to this class" });

  const day = toUtcDateOnly(date);

  const session = await prisma.attendanceSession.upsert({
    where: { sectionId_subjectId_date: { sectionId, subjectId, date: day } },
    update: {},
    create: { sectionId, subjectId, facultyId: user.id, date: day }
  });

  return { data: session };
});

app.get("/sections/roster", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["ADMIN", "FACULTY"]);

  const sectionId = req.query?.sectionId?.toString();
  if (!sectionId) throw Object.assign(new Error("sectionId required"), { statusCode: 400 });

  const enrollments = await prisma.enrollment.findMany({
    where: { sectionId },
    include: { student: true }
  });

  const students = enrollments
    .map((e) => e.student)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => ({ id: s.id, name: s.name, email: s.email }));

  return { data: students };
});

app.post("/attendance/mark", async (req, reply) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["FACULTY"]);

  const { sessionId, records } = req.body || {};
  if (!sessionId || !Array.isArray(records)) {
    return reply.code(400).send({ error: "sessionId and records[] required" });
  }

  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!session || session.facultyId !== user.id) return reply.code(403).send({ error: "Forbidden" });

  await prisma.$transaction(
    records.map((r) => {
      if (!r.studentId || !r.status) throw new Error("record needs studentId, status");
      return prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId, studentId: r.studentId } },
        update: { status: r.status },
        create: { sessionId, studentId: r.studentId, status: r.status }
      });
    })
  );

  return { ok: true };
});

app.get("/student/attendance/summary", async (req) => {
  const user = await getCurrentUser(req);
  requireRole(user, ["STUDENT"]);

  const enrollment = await prisma.enrollment.findFirst({ where: { studentId: user.id } });
  if (!enrollment) return { data: [] };

  const sectionId = enrollment.sectionId;

  const sessions = await prisma.attendanceSession.findMany({
    where: { sectionId },
    include: { subject: true }
  });

  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: user.id, session: { sectionId } },
    include: { session: { include: { subject: true } } }
  });

  const bySubject = new Map();

  for (const s of sessions) {
    const key = s.subjectId;
    if (!bySubject.has(key)) bySubject.set(key, { subject: s.subject, total: 0, present: 0 });
    bySubject.get(key).total += 1;
  }

  for (const r of records) {
    const key = r.session.subjectId;
    if (!bySubject.has(key)) continue;
    if (r.status === "PRESENT") bySubject.get(key).present += 1;
  }

  const out = Array.from(bySubject.values()).map((x) => ({
    subjectCode: x.subject.code,
    subjectName: x.subject.name,
    total: x.total,
    present: x.present,
    percentage: x.total === 0 ? 0 : Math.round((x.present / x.total) * 100)
  }));

  return { data: out };
});

// ---------- start ----------
app.listen({ port: 4000, host: "0.0.0.0" });
