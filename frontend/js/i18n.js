// i18n Configuration
const I18N = {
  currentLanguage: localStorage.getItem("language") || "es",
  translations: {},
};

// Initialize translations
async function initI18n() {
  try {
    const [esData, enData] = await Promise.all([
      fetch("./es.json").then((r) => r.json()),
      fetch("./en.json").then((r) => r.json()),
    ]);

    I18N.translations.es = esData;
    I18N.translations.en = enData;

    return true;
  } catch (error) {
    console.error("Error loading translations:", error);
    return false;
  }
}

// Get translation value
function t(key, params = {}) {
  const lang = I18N.currentLanguage;
  const keys = key.split(".");
  let value = I18N.translations[lang];

  for (const k of keys) {
    value = value?.[k];
  }

  if (!value) {
    console.warn(`Translation not found for key: ${key}`);
    return key;
  }

  // Replace parameters if provided
  let result = value;
  Object.keys(params).forEach((param) => {
    result = result.replace(`{${param}}`, params[param]);
  });

  return result;
}

// Change language
function setLanguage(lang) {
  if (lang !== "es" && lang !== "en") return;

  I18N.currentLanguage = lang;
  localStorage.setItem("language", lang);

  // Dispatch event for listeners
  window.dispatchEvent(
    new CustomEvent("languageChanged", { detail: { language: lang } }),
  );

  // Update HTML lang attribute
  document.documentElement.lang = lang;

  // Reload page to apply translations
  location.reload();
}

// Get current language
function getLanguage() {
  return I18N.currentLanguage;
}
