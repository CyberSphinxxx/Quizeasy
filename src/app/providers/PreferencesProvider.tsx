import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { repositories } from '@/data/repositories';
import {
  DEFAULT_PREFERENCES,
  type Preferences,
} from '@/domain/schemas/preferences';
import { applyReducedMotion, applyTheme, watchSystemTheme } from '@/app/theme';

interface PreferencesContextValue {
  preferences: Preferences;
  loading: boolean;
  update: (patch: Partial<Omit<Preferences, 'id'>>) => Promise<void>;
  reload: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined,
);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const stored = await repositories.preferences.get();
    setPreferences(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Loading preferences is an async read: state only changes once it resolves.
    const load = async () => {
      await reload();
    };
    void load();
  }, [reload]);

  const update = useCallback(
    async (patch: Partial<Omit<Preferences, 'id'>>) => {
      // Update the UI immediately, then persist.
      setPreferences((current) => ({ ...current, ...patch }));
      const saved = await repositories.preferences.update(patch);
      setPreferences(saved);
    },
    [],
  );

  useEffect(() => {
    const apply = () => {
      applyTheme(preferences.theme);
      applyReducedMotion(preferences.reducedMotion);
    };
    apply();
    return watchSystemTheme(() => {
      if (preferences.theme === 'system') apply();
    });
  }, [preferences.theme, preferences.reducedMotion]);

  const value = useMemo(
    () => ({ preferences, loading, update, reload }),
    [preferences, loading, update, reload],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used inside PreferencesProvider.');
  }
  return context;
}
