import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === "dark" ? "light" : "dark";
          document.documentElement.classList.remove("dark", "light");
          document.documentElement.classList.add(next);
          document.documentElement.classList.add("theme-transition");
          setTimeout(() => {
            document.documentElement.classList.remove("theme-transition");
          }, 400);
          return { theme: next };
        }),
      setTheme: (theme) => {
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(theme);
        document.documentElement.classList.add("theme-transition");
        setTimeout(() => {
          document.documentElement.classList.remove("theme-transition");
        }, 400);
        set({ theme });
      },
    }),
    {
      name: "ub-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.classList.remove("dark", "light");
          document.documentElement.classList.add(state.theme);
          document.documentElement.classList.add("theme-transition");
          setTimeout(() => {
            document.documentElement.classList.remove("theme-transition");
          }, 400);
        }
      },
    }
  )
);
