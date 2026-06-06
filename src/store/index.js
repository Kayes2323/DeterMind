import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),

      // Theme
      darkMode: true,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      // Language
      lang: 'bn', // 'bn' or 'en'
      setLang: (lang) => set({ lang }),

      // User goal (shown on front page)
      userGoal: '',
      setUserGoal: (g) => set({ userGoal: g }),

      // Exam countdown
      exams: [],
      addExam: (exam) => set((s) => ({ exams: [...s.exams, { ...exam, id: Date.now() }] })),
      removeExam: (id) => set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),

      // Tracking sections (dynamic)
      sections: [],
      setSections: (sections) => set({ sections }),
      addSection: (section) =>
        set((s) => ({ sections: [...s.sections, { ...section, id: Date.now().toString() }] })),
      updateSection: (id, updates) =>
        set((s) => ({
          sections: s.sections.map((sec) => (sec.id === id ? { ...sec, ...updates } : sec)),
        })),
      removeSection: (id) =>
        set((s) => ({ sections: s.sections.filter((sec) => sec.id !== id) })),

      // Daily entries
      entries: {}, // { 'YYYY-MM-DD': { sectionId: value } }
      setEntry: (date, sectionId, value) =>
        set((s) => ({
          entries: {
            ...s.entries,
            [date]: { ...(s.entries[date] || {}), [sectionId]: value },
          },
        })),
      getEntry: (date, sectionId) => {
        const entries = get().entries
        return entries[date]?.[sectionId] ?? ''
      },

      // To-do
      todos: {}, // { 'YYYY-MM-DD': [{ id, text, done, reason, progress }] }
      addTodo: (date, text) =>
        set((s) => ({
          todos: {
            ...s.todos,
            [date]: [...(s.todos[date] || []), { id: Date.now(), text, done: false, progress: 0, reason: '' }],
          },
        })),
      updateTodo: (date, id, updates) =>
        set((s) => ({
          todos: {
            ...s.todos,
            [date]: (s.todos[date] || []).map((t) => (t.id === id ? { ...t, ...updates } : t)),
          },
        })),
      removeTodo: (date, id) =>
        set((s) => ({
          todos: {
            ...s.todos,
            [date]: (s.todos[date] || []).filter((t) => t.id !== id),
          },
        })),

      // Notifications
      notifications: [],
      addNotification: (n) =>
        set((s) => ({ notifications: [{ ...n, id: Date.now(), read: false }, ...s.notifications.slice(0, 19)] })),
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      // Onboarding
      onboardingDone: false,
      setOnboardingDone: () => set({ onboardingDone: true }),
    }),
    { name: 'determind-storage' }
  )
)
