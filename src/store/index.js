import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),

      // Language
      lang: 'bn',
      setLang: (lang) => set({ lang }),

      // User goal
      userGoal: '',
      setUserGoal: (g) => set({ userGoal: g }),

      // Exam countdown
      exams: [],
      setExams: (exams) => set({ exams }),
      addExam: (exam) => set((s) => ({ exams: [...s.exams, exam] })),
      removeExam: (id) => set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),

      // Tracking sections
      sections: [],
      setSections: (sections) => set({ sections }),
      addSection: (section) => set((s) => ({ sections: [...s.sections, section] })),
      updateSection: (id, updates) =>
        set((s) => ({
          sections: s.sections.map((sec) => (sec.id === id ? { ...sec, ...updates } : sec)),
        })),
      removeSection: (id) =>
        set((s) => ({ sections: s.sections.filter((sec) => sec.id !== id) })),

      // Daily entries
      entries: {},
      setEntries: (entries) => set({ entries }),
      setEntry: (date, sectionId, value) =>
        set((s) => ({
          entries: {
            ...s.entries,
            [date]: { ...(s.entries[date] || {}), [sectionId]: value },
          },
        })),
      getEntry: (date, sectionId) => {
        return get().entries[date]?.[sectionId] ?? ''
      },

      // To-do
      todos: {},
      setTodos: (todos) => set({ todos }),
      addTodo: (date, item) =>
        set((s) => ({
          todos: {
            ...s.todos,
            [date]: [...(s.todos[date] || []), item],
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
        set((s) => ({
          notifications: [{ ...n, id: Date.now(), read: false }, ...s.notifications.slice(0, 19)],
        })),
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      // Saved Routine
      savedRoutine: null,
      setSavedRoutine: (r) => set({ savedRoutine: r }),

      // Onboarding
      onboardingDone: false,
      setOnboardingDone: () => set({ onboardingDone: true }),
    }),
    { name: 'determind-storage' }
  )
)