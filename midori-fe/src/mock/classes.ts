import type { DetailedClassInfo } from "@/types/class-detail";

export const mockClasses: DetailedClassInfo[] = [
  // ==================== ACTIVE CLASSES ====================
  {
    id: "class-1",
    name: "N5A - Midori",
    teacher: "Nguyễn Ngân",
    teacherAvatarInitials: "NN",
    level: "N5",
    members: 25,
    assignmentCount: 18,
    unfinishedCount: 3,
    nextDeadline: "2026-06-20",
    createdDate: "2026-06-15",
    joinDate: "2026-06-16",
    status: "active",
    progress: {
      vocabulary: 80,
      grammar: 65,
      listening: 45,
      reading: 50,
      shadowing: 35,
      writing: 20,
    },
    weakPoints: {
      listening: ["Numbers", "Time expressions"],
      grammar: ["～ている", "～ながら"],
      vocabularyCount: 32,
    },
    classmates: [
      { name: "Sakura Ito", avatar: "S" },
      { name: "Hiroshi Tanaka", avatar: "H" },
      { name: "Mei Lin", avatar: "M" },
      { name: "Daniel Kim", avatar: "D" },
    ],
    assignments: [
      {
        id: "a1",
        title: "Vocabulary Quiz Lesson 1",
        moduleType: "Vocabulary",
        assignedDate: "2026-06-15",
        deadline: "2026-06-20",
        timeLimit: 15,
        maxScore: 100,
        status: "Not Started",
      },
      {
        id: "a2",
        title: "Grammar Particles practice",
        moduleType: "Grammar",
        assignedDate: "2026-06-15",
        deadline: "2026-06-21",
        timeLimit: 30,
        maxScore: 100,
        status: "In Progress",
      },
      {
        id: "a3",
        title: "Listening Test 03",
        moduleType: "Listening",
        assignedDate: "2026-06-16",
        deadline: "2026-06-22",
        timeLimit: 20,
        maxScore: 100,
        status: "Submitted",
      },
      {
        id: "a4",
        title: "Kanji Basics N5 Test",
        moduleType: "Vocabulary",
        assignedDate: "2026-06-10",
        deadline: "2026-06-14",
        timeLimit: 45,
        maxScore: 100,
        score: 95,
        status: "Graded",
      },
      {
        id: "a5",
        title: "Reading Practice Part 1",
        moduleType: "Reading",
        assignedDate: "2026-06-08",
        deadline: "2026-06-12",
        timeLimit: 20,
        maxScore: 50,
        status: "Overdue",
      },
    ],
    materials: {
      vocabulary: [
        {
          level: "N5",
          lessons: [
            {
              lessonId: "vocab-n5-l1",
              title: "Lesson 1: Greetings",
              items: [
                { id: "v-item1", title: "N5 Greetings Vocabulary PDF", content: "List of common Japanese greetings like Ohayou, Konnichiwa, Arigatou." },
                { id: "v-item2", title: "Pronunciation Audio Guide", content: "MP3 listening material for basic speech patterns." }
              ]
            }
          ]
        },
        {
          level: "N4",
          lessons: []
        }
      ],
      grammar: [
        {
          level: "N5",
          lessons: [
            {
              lessonId: "gram-n5-l1",
              title: "Lesson 1: Wa & Ga Particles",
              items: [
                { id: "g-item1", title: "Grammar Note: Subject Markers", content: "Explanation of topic marker Wa and identifier Ga with context sentences." }
              ]
            }
          ]
        }
      ],
      listening: [],
      reading: [],
      shadowing: [],
      writing: []
    },
    scores: [
      {
        assignmentId: "a4",
        assignmentName: "Kanji Basics N5 Test",
        module: "Vocabulary",
        score: 95,
        maxScore: 100,
        submissionTime: "2026-06-13T10:15:30Z",
        aiFeedback: "Excellent understanding of basic kanji. You recognized 19 out of 20 correctly. Focus on stroke orders for time-related kanji.",
        wrongAnswers: [
          { question: "What is the kanji for 'Time'?", userAnswer: "日", correctAnswer: "時" }
        ],
        strengths: ["Numbers", "Days of the week", "Action verbs"],
        weaknesses: ["Complex stroke counts", "Time representations"]
      }
    ],
    calendarEvents: [
      { id: "c-e1", title: "Vocabulary Quiz Lesson 1", date: "2026-06-20", type: "deadline" },
      { id: "c-e2", title: "Grammar Particles practice", date: "2026-06-21", type: "deadline" },
      { id: "c-e3", title: "Listening Test 03", date: "2026-06-22", type: "deadline" },
      { id: "c-e4", title: "Overdue: Reading Practice Part 1", date: "2026-06-12", type: "overdue" },
    ],
    announcements: [
      {
        id: "ann-1",
        title: "Reading Test 03 Assigned",
        content: "Please pay attention to the deadline of Reading Test 03. It will count towards your midterm grade.",
        date: "2026-06-16",
        teacherName: "Nguyễn Ngân",
        read: false
      },
      {
        id: "ann-2",
        title: "Welcome to N5A Class!",
        content: "Happy to start this journey with all of you. Check the materials tab for Lesson 1 notes.",
        date: "2026-06-15",
        teacherName: "Nguyễn Ngân",
        read: true
      }
    ]
  },
  {
    id: "class-2",
    name: "Japanese Basic N5 - Class A",
    teacher: "Kenji Sensei",
    teacherAvatarInitials: "KS",
    level: "N5",
    members: 18,
    assignmentCount: 8,
    unfinishedCount: 1,
    nextDeadline: "2026-06-24",
    createdDate: "2026-06-01",
    joinDate: "2026-06-02",
    status: "active",
    progress: {
      vocabulary: 40,
      grammar: 30,
      listening: 25,
      reading: 20,
      shadowing: 15,
      writing: 10,
    },
    weakPoints: {
      listening: [],
      grammar: [],
      vocabularyCount: 0,
    },
    classmates: [
      { name: "Aiko Mori", avatar: "A" },
      { name: "Takeshi Sato", avatar: "T" },
      { name: "Yuka Nakajima", avatar: "Y" },
    ],
    assignments: [
      {
        id: "a6",
        title: "Vocabulary Match Lesson 3",
        moduleType: "Vocabulary",
        assignedDate: "2026-06-01",
        deadline: "2026-06-24",
        timeLimit: 20,
        maxScore: 100,
        status: "Not Started",
      }
    ],
    materials: { vocabulary: [], grammar: [], listening: [], reading: [], shadowing: [], writing: [] },
    scores: [],
    calendarEvents: [],
    announcements: []
  },

  // ==================== COMPLETED CLASSES ====================
  {
    id: "class-3",
    name: "N5 Complete Course",
    teacher: "Yuki Tanaka",
    teacherAvatarInitials: "YT",
    level: "N5",
    members: 32,
    assignmentCount: 24,
    unfinishedCount: 0,
    nextDeadline: "-",
    createdDate: "2026-01-15",
    joinDate: "2026-01-15",
    status: "completed",
    completionDate: "2026-05-30",
    finalScore: 92,
    hasCertificate: true,
    progress: {
      vocabulary: 100,
      grammar: 95,
      listening: 88,
      reading: 90,
      shadowing: 85,
      writing: 82,
    },
    weakPoints: {
      listening: [],
      grammar: [],
      vocabularyCount: 0,
    },
    classmates: [
      { name: "Akira Sato", avatar: "A" },
      { name: "Hana Suzuki", avatar: "H" },
    ],
    assignments: [
      {
        id: "c3-a1",
        title: "Final N5 Examination",
        moduleType: "Vocabulary",
        assignedDate: "2026-05-20",
        deadline: "2026-05-30",
        timeLimit: 120,
        maxScore: 200,
        score: 184,
        status: "Graded",
      }
    ],
    materials: {
      vocabulary: [{ level: "N5", lessons: [{ lessonId: "l1", title: "All Lessons", items: [] }] }],
      grammar: [{ level: "N5", lessons: [{ lessonId: "l1", title: "All Lessons", items: [] }] }],
      listening: [],
      reading: [],
      shadowing: [],
      writing: []
    },
    scores: [
      {
        assignmentId: "c3-a1",
        assignmentName: "Final N5 Examination",
        module: "All Modules",
        score: 184,
        maxScore: 200,
        submissionTime: "2026-05-30T14:30:00Z",
        aiFeedback: "Outstanding performance! You have successfully completed the N5 level. Ready for N4!",
        wrongAnswers: [],
        strengths: ["Vocabulary", "Grammar fundamentals", "Reading comprehension"],
        weaknesses: ["Kanji writing speed"]
      }
    ],
    calendarEvents: [],
    announcements: []
  },
  {
    id: "class-4",
    name: "Beginner Japanese N5",
    teacher: "Sakura Yamamoto",
    teacherAvatarInitials: "SY",
    level: "N5",
    members: 20,
    assignmentCount: 15,
    unfinishedCount: 0,
    nextDeadline: "-",
    createdDate: "2026-02-01",
    joinDate: "2026-02-01",
    status: "completed",
    completionDate: "2026-05-15",
    finalScore: 85,
    hasCertificate: true,
    progress: {
      vocabulary: 100,
      grammar: 88,
      listening: 80,
      reading: 85,
      shadowing: 75,
      writing: 70,
    },
    weakPoints: {
      listening: [],
      grammar: [],
      vocabularyCount: 0,
    },
    classmates: [],
    assignments: [
      {
        id: "c4-a1",
        title: "Course Completion Test",
        moduleType: "Grammar",
        assignedDate: "2026-05-10",
        deadline: "2026-05-15",
        timeLimit: 90,
        maxScore: 100,
        score: 85,
        status: "Graded",
      }
    ],
    materials: {
      vocabulary: [{ level: "N5", lessons: [{ lessonId: "l1", title: "Basics", items: [] }] }],
      grammar: [],
      listening: [],
      reading: [],
      shadowing: [],
      writing: []
    },
    scores: [],
    calendarEvents: [],
    announcements: []
  },

  // ==================== COMPLETED CLASSES ====================
  {
    id: "class-5",
    name: "Japanese Trial Class",
    teacher: "Kenji Sensei",
    teacherAvatarInitials: "KS",
    level: "N5",
    members: 15,
    assignmentCount: 5,
    unfinishedCount: 0,
    nextDeadline: "-",
    createdDate: "2025-11-01",
    joinDate: "2025-11-01",
    status: "completed",
    completionDate: "2025-11-15",
    finalScore: 78,
    hasCertificate: false,
    progress: {
      vocabulary: 60,
      grammar: 55,
      listening: 50,
      reading: 45,
      shadowing: 40,
      writing: 35,
    },
    weakPoints: {
      listening: ["Basic sounds"],
      grammar: ["Verb conjugations"],
      vocabularyCount: 15,
    },
    classmates: [],
    assignments: [],
    materials: {
      vocabulary: [],
      grammar: [],
      listening: [],
      reading: [],
      shadowing: [],
      writing: []
    },
    scores: [],
    calendarEvents: [],
    announcements: []
  }
];
