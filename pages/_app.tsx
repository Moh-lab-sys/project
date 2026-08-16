import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { Language, translations } from '../lib/i18n';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'ar' : 'en';
    setLang(nextLang);
    localStorage.setItem('app_lang', nextLang);
  };

  const t = translations[lang];

  return (
    <div dir={t.dir} className="min-h-screen bg-gray-50 text-gray-900">
      <Head>
        <title>{t.title}</title>
      </Head>

      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <button
          onClick={toggleLanguage}
          className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
        >
          {t.langToggle}
        </button>
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="font-bold text-lg text-blue-600">{t.title}</span>
          {/* Logo Placed Here Top-Right */}
          <img src="/logo.png" alt="Company Logo" className="h-8 w-auto object-contain" />
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-4xl mx-auto">
        <Component {...pageProps} lang={lang} t={t} />
      </main>
    </div>
  );
}