import {
  PrismaClient,
  AppStatus,
  WorkSetup,
  EventType,
  LocationType,
  Prisma,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_EMAIL = "richardoalvin9@gmail.com";

const SEED_PASSWORD = "Password123!";

type TimelineSeed = {
  stage: AppStatus;
  detail?: string;
  mode?: LocationType;
  meetLink?: string;
  location?: string;
  notes?: string;
  at: Date;
};

type CalendarSeed = {
  title: string;
  type: EventType;
  company?: string;
  startAt: Date;
  endAt?: Date;
  locationType?: LocationType;
  meetLink?: string;
  place?: string;
  note?: string;
};

type ApplicationSeed = {
  company: string;
  role: string;
  location: string;
  workSetup: WorkSetup;
  status: AppStatus;

  statusDetail?: string;
  source?: string;
  jobLink?: string;
  notes?: string;

  requiredSkills: string[];
  niceToHave: string[];

  appliedAt: Date;
  lastUpdate: Date;
  nextEventAt?: Date;
  nextEventTitle?: string;

  timeline: TimelineSeed[];
  calendar: CalendarSeed[];
};

function randomMeetLink() {
  const codes = [
    "abc-defg-hij",
    "klo-mnop-qrs",
    "tuv-wxyz-123",
    "pqr-stuv-wxy",
  ];
  return `https://meet.google.com/${
    codes[Math.floor(Math.random() * codes.length)]
  }`;
}

async function main() {
  // 1) upsert user (passwordHash wajib)
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEFAULT_EMAIL },
    update: {
      passwordHash,
    },
    create: {
      email: DEFAULT_EMAIL,
      passwordHash,
    },
  });

  await prisma.$transaction([
    prisma.calendarEvent.deleteMany({ where: { userId: user.id } }),
    prisma.application.deleteMany({ where: { userId: user.id } }),
    prisma.profile.deleteMany({ where: { userId: user.id } }),
  ]);

  // 3) profile
  await prisma.profile.create({
    data: {
      userId: user.id,
      name: "Alvin Rikardo",
      headline: "WGN · Work Gantt Navigator",
      location: "Indonesia",
      bio: "Seed data (Neon + Prisma) for recruitment tracker timeline & calendar.",
      avatarUrl: null,
    },
  });

  // 4) seed apps (punya kamu + tambahan dummy lain)
  const apps: ApplicationSeed[] = [
    // A. PT. MMS Group Indonesia
    {
      company: "PT. MMS Group Indonesia",
      role: "IT Programmer",
      location: "Jakarta",
      workSetup: WorkSetup.Onsite,
      status: AppStatus.technical_test,
      statusDetail: "live_code",
      source: "DumbWays Bootcamp",
      jobLink: "https://example.com/jobs/mms-it-programmer",
      notes: "Progress berdasarkan catatan Des 2025.",
      requiredSkills: ["JavaScript", "SQL", "Problem Solving"],
      niceToHave: ["React", "Next.js", "PostgreSQL"],

      appliedAt: new Date("2025-12-05T00:00:00.000Z"),
      lastUpdate: new Date("2025-12-10T00:00:00.000Z"),
      nextEventAt: new Date("2025-12-15T03:00:00.000Z"),
      nextEventTitle: "Live code",

      timeline: [
        {
          stage: AppStatus.interview,
          detail: "hr",
          mode: LocationType.online,
          meetLink: randomMeetLink(),
          notes: "Interview HR ✅ (9 Des'25)",
          at: new Date("2025-12-09T02:00:00.000Z"),
        },
        {
          stage: AppStatus.technical_test,
          detail: "psychotest",
          mode: LocationType.offline,
          location: "Kantor MMS - Jakarta",
          notes: "Test Psikotest ✅ (10 Des'25)",
          at: new Date("2025-12-10T06:00:00.000Z"),
        },
        {
          stage: AppStatus.technical_test,
          detail: "live_code",
          mode: LocationType.online,
          meetLink: randomMeetLink(),
          notes: "Live code ❌ (15 Des'25) - pending",
          at: new Date("2025-12-15T03:00:00.000Z"),
        },
      ],

      calendar: [
        {
          title: "Interview HR · MMS",
          type: EventType.interview_hr,
          company: "PT. MMS Group Indonesia",
          startAt: new Date("2025-12-09T02:00:00.000Z"),
          endAt: new Date("2025-12-09T02:45:00.000Z"),
          locationType: LocationType.online,
          meetLink: randomMeetLink(),
          note: "Interview HR ✅",
        },
        {
          title: "Psikotest · MMS",
          type: EventType.psychotest,
          company: "PT. MMS Group Indonesia",
          startAt: new Date("2025-12-10T06:00:00.000Z"),
          endAt: new Date("2025-12-10T07:00:00.000Z"),
          locationType: LocationType.offline,
          place: "Kantor MMS - Jakarta",
          note: "Psikotest ✅",
        },
        {
          title: "Live Coding · MMS",
          type: EventType.technical_test,
          company: "PT. MMS Group Indonesia",
          startAt: new Date("2025-12-15T03:00:00.000Z"),
          endAt: new Date("2025-12-15T04:30:00.000Z"),
          locationType: LocationType.online,
          meetLink: randomMeetLink(),
          note: "Live code ❌ (pending)",
        },
      ],
    },

    // B. PT. Inovasi Teknologi Kecerdasan (RedPumpkin.AI)
    {
      company: "PT. Inovasi Teknologi Kecerdasan (RedPumpkin.AI)",
      role: "Fullstack Developer",
      location: "Remote",
      workSetup: WorkSetup.Remote,
      status: AppStatus.interview,
      statusDetail: "hr",
      source: "LinkedIn",
      jobLink: "https://example.com/jobs/redpumpkin-fullstack",
      notes: "Interview HR dijadwalkan, belum selesai.",
      requiredSkills: ["TypeScript", "React", "Node.js"],
      niceToHave: ["Next.js", "PostgreSQL", "Docker"],

      appliedAt: new Date("2025-12-06T00:00:00.000Z"),
      lastUpdate: new Date("2025-12-06T00:00:00.000Z"),
      nextEventAt: new Date("2025-12-11T07:00:00.000Z"),
      nextEventTitle: "Interview HR",

      timeline: [
        {
          stage: AppStatus.interview,
          detail: "hr",
          mode: LocationType.online,
          meetLink: randomMeetLink(),
          notes: "Interview HR ❌ (11 Des'25) - belum",
          at: new Date("2025-12-11T07:00:00.000Z"),
        },
      ],

      calendar: [
        {
          title: "Interview HR · RedPumpkin.AI",
          type: EventType.interview_hr,
          company: "PT. Inovasi Teknologi Kecerdasan (RedPumpkin.AI)",
          startAt: new Date("2025-12-11T07:00:00.000Z"),
          endAt: new Date("2025-12-11T07:30:00.000Z"),
          locationType: LocationType.online,
          meetLink: randomMeetLink(),
          note: "Interview HR ❌",
        },
      ],
    },

    // C. PT. Indonesia Indicator (Ebdesk Group)
    {
      company: "PT. Indonesia Indicator (Ebdesk Group)",
      role: "Fullstack Developer",
      location: "Jakarta",
      workSetup: WorkSetup.Hybrid,
      status: AppStatus.technical_test,
      statusDetail: "psychotest",
      source: "Recruiter outreach",
      jobLink: "https://example.com/jobs/ebdesk-fullstack",
      notes: "Interview HR selesai, psikotes belum.",
      requiredSkills: ["React", "TypeScript", "REST API"],
      niceToHave: ["PostgreSQL", "Testing", "CI/CD"],

      appliedAt: new Date("2025-12-12T00:00:00.000Z"),
      lastUpdate: new Date("2025-12-22T00:00:00.000Z"),
      nextEventAt: new Date("2025-12-22T06:00:00.000Z"),
      nextEventTitle: "Psikotes",

      timeline: [
        {
          stage: AppStatus.interview,
          detail: "hr",
          mode: LocationType.online,
          meetLink: randomMeetLink(),
          notes: "Interview HR ✅ (22 Des'25)",
          at: new Date("2025-12-22T03:00:00.000Z"),
        },
        {
          stage: AppStatus.technical_test,
          detail: "psychotest",
          mode: LocationType.offline,
          location: "Kantor Ebdesk - Jakarta",
          notes: "Psikotes ❌ (22 Des'25) - belum",
          at: new Date("2025-12-22T06:00:00.000Z"),
        },
      ],

      calendar: [
        {
          title: "Interview HR · Ebdesk",
          type: EventType.interview_hr,
          company: "PT. Indonesia Indicator (Ebdesk Group)",
          startAt: new Date("2025-12-22T03:00:00.000Z"),
          endAt: new Date("2025-12-22T03:30:00.000Z"),
          locationType: LocationType.online,
          meetLink: randomMeetLink(),
          note: "Interview HR ✅",
        },
        {
          title: "Psikotes · Ebdesk",
          type: EventType.psychotest,
          company: "PT. Indonesia Indicator (Ebdesk Group)",
          startAt: new Date("2025-12-22T06:00:00.000Z"),
          endAt: new Date("2025-12-22T07:00:00.000Z"),
          locationType: LocationType.offline,
          place: "Kantor Ebdesk - Jakarta",
          note: "Psikotes ❌",
        },
      ],
    },

    // D. Westerindo
    {
      company: "Westerindo",
      role: "IT Programmer",
      location: "Jakarta",
      workSetup: WorkSetup.Onsite,
      status: AppStatus.interview,
      statusDetail: "hr",
      source: "Email HR",
      jobLink: "https://example.com/jobs/westerindo-it-programmer",
      notes: "Psikotest selesai, interview HR belum.",
      requiredSkills: ["PHP", "SQL", "Problem Solving"],
      niceToHave: ["Laravel", "Git", "Testing"],

      appliedAt: new Date("2025-12-10T00:00:00.000Z"),
      lastUpdate: new Date("2025-12-19T00:00:00.000Z"),
      nextEventAt: new Date("2025-12-26T02:00:00.000Z"),
      nextEventTitle: "Interview HR",

      timeline: [
        {
          stage: AppStatus.technical_test,
          detail: "psychotest",
          mode: LocationType.offline,
          location: "Kantor Westerindo",
          notes: "Psikotest ✅ (19 Des'25)",
          at: new Date("2025-12-19T02:00:00.000Z"),
        },
        {
          stage: AppStatus.interview,
          detail: "hr",
          mode: LocationType.online,
          meetLink: randomMeetLink(),
          notes: "Interview HR ❌ (26 Des'25) - belum",
          at: new Date("2025-12-26T02:00:00.000Z"),
        },
      ],

      calendar: [
        {
          title: "Psikotest · Westerindo",
          type: EventType.psychotest,
          company: "Westerindo",
          startAt: new Date("2025-12-19T02:00:00.000Z"),
          endAt: new Date("2025-12-19T03:00:00.000Z"),
          locationType: LocationType.offline,
          place: "Kantor Westerindo",
          note: "Psikotest ✅",
        },
        {
          title: "Interview HR · Westerindo",
          type: EventType.interview_hr,
          company: "Westerindo",
          startAt: new Date("2025-12-26T02:00:00.000Z"),
          endAt: new Date("2025-12-26T02:45:00.000Z"),
          locationType: LocationType.online,
          meetLink: randomMeetLink(),
          note: "Interview HR ❌ (link menyusul)",
        },
      ],
    },

    // Tambahan seed lain (kamu minta yang detailnya aku atur sendiri)
    {
      company: "PT Dummy Teknologi Nusantara",
      role: "Frontend Developer",
      location: "Jakarta",
      workSetup: WorkSetup.Hybrid,
      status: AppStatus.screening,
      statusDetail: "cv_review",
      source: "Job Portal",
      jobLink: "https://example.com/jobs/dummy-fe",
      notes: "Masih tahap screening.",
      requiredSkills: ["React", "TypeScript"],
      niceToHave: ["Next.js", "Tailwind"],

      appliedAt: new Date("2025-12-18T00:00:00.000Z"),
      lastUpdate: new Date("2025-12-20T00:00:00.000Z"),
      nextEventAt: new Date("2025-12-27T03:00:00.000Z"),
      nextEventTitle: "Follow up recruiter",

      timeline: [
        {
          stage: AppStatus.screening,
          detail: "cv_review",
          mode: LocationType.online,
          notes: "CV review ongoing",
          at: new Date("2025-12-20T02:00:00.000Z"),
        },
      ],

      calendar: [
        {
          title: "Follow-up recruiter",
          type: EventType.follow_up,
          company: "PT Dummy Teknologi Nusantara",
          startAt: new Date("2025-12-27T03:00:00.000Z"),
          endAt: new Date("2025-12-27T03:15:00.000Z"),
          locationType: LocationType.online,
          note: "Follow up status lamaran via email.",
        },
      ],
    },
  ];

  // 5) insert applications + timeline + calendar
  for (const a of apps) {
    const appData: Prisma.ApplicationCreateInput = {
      user: { connect: { id: user.id } },
      company: a.company,
      role: a.role,
      location: a.location,
      workSetup: a.workSetup,
      status: a.status,

      statusDetail: a.statusDetail ?? null,
      source: a.source ?? null,
      jobLink: a.jobLink ?? null,
      notes: a.notes ?? null,

      requiredSkills: a.requiredSkills,
      niceToHave: a.niceToHave,

      appliedAt: a.appliedAt,
      lastUpdate: a.lastUpdate,
      nextEventAt: a.nextEventAt ?? null,
      nextEventTitle: a.nextEventTitle ?? null,
    };

    const createdApp = await prisma.application.create({ data: appData });

    if (a.timeline.length > 0) {
      const timelineRows: Prisma.ApplicationTimelineEventCreateManyInput[] =
        a.timeline.map((t) => ({
          applicationId: createdApp.id,
          stage: t.stage,
          detail: t.detail ?? null,
          mode: t.mode ?? null,
          meetLink: t.meetLink ?? null,
          location: t.location ?? null,
          notes: t.notes ?? null,
          at: t.at,
        }));

      await prisma.applicationTimelineEvent.createMany({ data: timelineRows });
    }

    if (a.calendar.length > 0) {
      const calendarRows: Prisma.CalendarEventCreateManyInput[] =
        a.calendar.map((c) => ({
          userId: user.id,
          applicationId: createdApp.id,
          title: c.title,
          type: c.type,
          company: c.company ?? null,
          startAt: c.startAt,
          endAt: c.endAt ?? null,
          locationType: c.locationType ?? null,
          meetLink: c.meetLink ?? null,
          place: c.place ?? null,
          note: c.note ?? null,
        }));

      await prisma.calendarEvent.createMany({ data: calendarRows });
    }
  }

  console.log("✅ Seed finished");
  console.log(`✅ Seed user: ${DEFAULT_EMAIL}`);
  console.log(`✅ Seed password: ${SEED_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
