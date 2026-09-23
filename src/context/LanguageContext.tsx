import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import i18n from "../i18n/i18n";

export type AppLanguage =
  | "ar"
  | "en";

type LanguageContextValue = {
  language:
    AppLanguage;

  isArabic:
    boolean;

  isLoadingLanguage:
    boolean;

  setLanguage: (
    language:
      AppLanguage,
  ) => Promise<void>;

  toggleLanguage:
    () => Promise<void>;
};

const LANGUAGE_KEY =
  "appLanguage";

const DEFAULT_LANGUAGE:
  AppLanguage =
    "ar";

const LanguageContext =
  createContext<
    LanguageContextValue | undefined
  >(undefined);

type LanguageProviderProps = {
  children:
    React.ReactNode;
};

export function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const [
    language,
    setLanguageState,
  ] =
    useState<AppLanguage>(
      DEFAULT_LANGUAGE,
    );

  const [
    isLoadingLanguage,
    setIsLoadingLanguage,
  ] =
    useState(true);

  useEffect(() => {
    const loadLanguage =
      async () => {
        try {
          const savedLanguage =
            localStorage.getItem(
              LANGUAGE_KEY,
            );

          const nextLanguage:
            AppLanguage =
            savedLanguage ===
            "en"
              ? "en"
              : "ar";

          setLanguageState(
            nextLanguage,
          );

          await i18n.changeLanguage(
            nextLanguage,
          );

          document.documentElement.lang =
            nextLanguage;

          document.documentElement.dir =
            nextLanguage ===
            "ar"
              ? "rtl"
              : "ltr";
        } catch (error) {
          console.warn(
            "[Language] initialization failed:",
            error,
          );

          setLanguageState(
            DEFAULT_LANGUAGE,
          );

          await i18n.changeLanguage(
            DEFAULT_LANGUAGE,
          );

          document.documentElement.lang =
            DEFAULT_LANGUAGE;

          document.documentElement.dir =
            "rtl";
        } finally {
          setIsLoadingLanguage(
            false,
          );
        }
      };

    void loadLanguage();
  }, []);

  const setLanguage =
    useCallback(
      async (
        nextLanguage:
          AppLanguage,
      ) => {
        await i18n.changeLanguage(
          nextLanguage,
        );

        localStorage.setItem(
          LANGUAGE_KEY,
          nextLanguage,
        );

        document.documentElement.lang =
          nextLanguage;

        document.documentElement.dir =
          nextLanguage ===
          "ar"
            ? "rtl"
            : "ltr";

        setLanguageState(
          nextLanguage,
        );
      },
      [],
    );

  const toggleLanguage =
    useCallback(
      async () => {
        await setLanguage(
          language === "ar"
            ? "en"
            : "ar",
        );
      },
      [
        language,
        setLanguage,
      ],
    );

  const value =
    useMemo<LanguageContextValue>(
      () => ({
        language,

        isArabic:
          language ===
          "ar",

        isLoadingLanguage,

        setLanguage,

        toggleLanguage,
      }),
      [
        language,
        isLoadingLanguage,
        setLanguage,
        toggleLanguage,
      ],
    );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(
      LanguageContext,
    );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider",
    );
  }

  return context;
}