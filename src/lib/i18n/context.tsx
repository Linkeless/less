'use client';

import React, { createContext, useState, useEffect } from 'react';
import en from './en';
import zhCN from './zh-CN';

type Language = 'en' | 'zh-CN';
export type TranslationValues = typeof en | typeof zhCN;
type Translations = TranslationValues;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  
  // 首先检查本地存储
  const savedLang = localStorage.getItem('language') as Language;
  if (savedLang && ['en', 'zh-CN'].includes(savedLang)) {
    return savedLang;
  }
  
  // 然后检查浏览器语言设置
  const browserLangs = navigator.languages || [navigator.language];
  
  // 遍历所有浏览器语言设置
  for (const lang of browserLangs) {
    const normalizedLang = lang.toLowerCase();
    
    if (normalizedLang.startsWith('zh')) {
      if (normalizedLang.includes('tw') || normalizedLang.includes('hk')) {
        return 'en';
      }
      return 'zh-CN';
    }
  }
  
  return 'en';
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<Language>(() => {
    // 如果是服务端，返回默认语言
    if (typeof window === 'undefined') return 'en';
    
    // 在客户端，直接从 localStorage 获取语言设置
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && ['en', 'zh-CN'].includes(savedLang)) {
      return savedLang;
    }
    
    return getInitialLanguage();
  });
  
  const [translations, setTranslations] = useState<Translations>(
    language === 'zh-CN' ? zhCN : en
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTranslations(language === 'zh-CN' ? zhCN : en);
    if (mounted) {
      localStorage.setItem('language', language);
    }
  }, [language, mounted]);

  // 在客户端首次渲染完成前不显示内容，避免闪烁
  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations }}>
      {children}
    </LanguageContext.Provider>
  );
}
