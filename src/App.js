import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Calendar as CalendarIcon, PieChart, List, 
  ChevronLeft, ChevronRight, X, ArrowDownCircle, ArrowUpCircle, 
  Bike, Landmark, Wallet, CheckCircle2, 
  Trash2, Settings, Clock, Search, ChevronDown, ChevronUp, CalendarCheck, Coins, Filter, RefreshCw, ArrowDownUp, Timer, Target, Edit3, CalendarDays, Play, Square, Smartphone, Heart,
  Utensils, Home, Car, Shield, User, CreditCard, PiggyBank, GraduationCap, Gift, Plane, FileText, Film, Scissors, ShoppingBag, Tv, Package, Briefcase, Star, Stethoscope, Coffee, MessageSquareHeart,
  NotebookPen, Calculator, ChevronLeftCircle, Lock, Delete, Copy, Building2, Grid, Repeat, ChevronDownSquare, AlertCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';

// 1. FIREBASE SETUP
const firebaseConfig = {
  apiKey: "AIzaSyDmsKLrfvPrJOGTdeW2HseRWiGMGqM6asw",
  authDomain: "hyuna-asset-pro.firebaseapp.com",
  projectId: "hyuna-asset-pro",
  storageBucket: "hyuna-asset-pro.firebasestorage.app",
  messagingSenderId: "571320052451",
  appId: "1:571320052451:web:3ef33254a404675311f3d6"
};

let app, auth, db;
let isFirebaseEnabled = true;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase 초기화 에러", e);
  isFirebaseEnabled = false;
}

const appId = typeof __app_id !== 'undefined' ? String(__app_id).replace(/\//g, '_') : 'hyuna-asset-pro';

// 월별 테마 엔진
const THEME_PALETTES = {
  pink: { bg500: 'bg-pink-500', bg600: 'bg-pink-600', bg50: 'bg-pink-50', bg100: 'bg-pink-100', text500: 'text-pink-500', text600: 'text-pink-600', text400: 'text-pink-400', border500: 'border-pink-500', border200: 'border-pink-200', border100: 'border-pink-100', border600: 'border-pink-600', border300: 'focus:border-pink-300', fill400: 'fill-pink-400', fromColor: 'from-pink-400', toColor: 'to-rose-400' },
  amber: { bg500: 'bg-amber-500', bg600: 'bg-amber-600', bg50: 'bg-amber-50', bg100: 'bg-amber-100', text500: 'text-amber-500', text600: 'text-amber-600', text400: 'text-amber-400', border500: 'border-amber-500', border200: 'border-amber-200', border100: 'border-amber-100', border600: 'border-amber-600', border300: 'focus:border-amber-300', fill400: 'fill-amber-400', fromColor: 'from-amber-400', toColor: 'to-yellow-400' },
  emerald: { bg500: 'bg-emerald-500', bg600: 'bg-emerald-600', bg50: 'bg-emerald-50', bg100: 'bg-emerald-100', text500: 'text-emerald-500', text600: 'text-emerald-600', text400: 'text-emerald-400', border500: 'border-emerald-500', border200: 'border-emerald-200', border100: 'border-emerald-100', border600: 'border-emerald-600', border300: 'focus:border-emerald-300', fill400: 'fill-emerald-400', fromColor: 'from-emerald-400', toColor: 'to-teal-400' },
  violet: { bg500: 'bg-violet-500', bg600: 'bg-violet-600', bg50: 'bg-violet-50', bg100: 'bg-violet-100', text500: 'text-violet-500', text600: 'text-violet-600', text400: 'text-violet-400', border500: 'border-violet-500', border200: 'border-violet-200', border100: 'border-violet-100', border600: 'border-violet-600', border300: 'focus:border-violet-300', fill400: 'fill-violet-400', fromColor: 'from-violet-400', toColor: 'to-purple-400' },
  sky: { bg500: 'bg-sky-500', bg600: 'bg-sky-600', bg50: 'bg-sky-50', bg100: 'bg-sky-100', text500: 'text-sky-500', text600: 'text-sky-600', text400: 'text-sky-400', border500: 'border-sky-500', border200: 'border-sky-200', border100: 'border-sky-100', border600: 'border-sky-600', border300: 'focus:border-sky-300', fill400: 'fill-sky-400', fromColor: 'from-sky-400', toColor: 'to-blue-400' },
  rose: { bg500: 'bg-rose-500', bg600: 'bg-rose-600', bg50: 'bg-rose-50', bg100: 'bg-rose-100', text500: 'text-rose-500', text600: 'text-rose-600', text400: 'text-rose-400', border500: 'border-rose-500', border200: 'border-rose-200', border100: 'border-rose-100', border600: 'border-rose-600', border300: 'focus:border-rose-300', fill400: 'fill-rose-400', fromColor: 'from-rose-400', toColor: 'to-orange-400' },
};

const MONTHLY_THEME_MAP = {
  1: { ledger: 'pink', calendar: 'sky' }, 2: { ledger: 'violet', calendar: 'pink' },
  3: { ledger: 'amber', calendar: 'emerald' }, 4: { ledger: 'pink', calendar: 'amber' },
  5: { ledger: 'emerald', calendar: 'rose' }, 6: { ledger: 'sky', calendar: 'emerald' },
  7: { ledger: 'violet', calendar: 'sky' }, 8: { ledger: 'rose', calendar: 'sky' },
  9: { ledger: 'amber', calendar: 'violet' }, 10: { ledger: 'rose', calendar: 'amber' },
  11: { ledger: 'violet', calendar: 'pink' }, 12: { ledger: 'pink', calendar: 'sky' }
};

const DEFAULT_CATEGORIES = {
  지출: ['식비', '주거/통신', '교통/차량', '보험', '오빠생활비', '대출상환', '카드대금', '저축', '교육', '경조사', '여행경비', '세금', '문화생활', '미용', '쇼핑', '가전', '생필품', '교회', '기타'],
  수입: ['월급', '배달비', '월세', '용돈', '기타수입']
};

const tabConfig = {
  calendar: { id: 'calendar', label: '우리가족', icon: CalendarIcon },
  ledger: { id: 'ledger', label: '가계부', icon: Wallet },
  delivery: { id: 'delivery', label: '배달수익', icon: Bike },
  assets: { id: 'assets', label: '자산관리', icon: Landmark },
};

const KR_HOLIDAYS_FIXED = {
  '01-01': '신정', '03-01': '삼일절', '05-05': '어린이날', '06-06': '현충일', '08-15': '광복절', '10-03': '개천절', '10-09': '한글날', '12-25': '성탄절'
};

const KR_HOLIDAYS_VAR = {
  '2024-02-09':'설연휴','2024-02-10':'설날','2024-02-11':'설연휴','2024-02-12':'대체공휴일','2024-04-10':'국회의원선거','2024-05-06':'대체공휴일','2024-05-15':'부처님오신날','2024-09-16':'추석연휴','2024-09-17':'추석','2024-09-18':'추석연휴',
  '2025-01-28':'설연휴','2025-01-29':'설날','2025-01-30':'설연휴','2025-05-05':'부처님오신날','2025-05-06':'대체공휴일','2025-10-05':'추석연휴','2025-10-06':'추석','2025-10-07':'추석연휴','2025-10-08':'대체공휴일',
  '2026-02-16':'설연휴','2026-02-17':'설날','2026-02-18':'설연휴','2026-03-02':'대체공휴일','2026-05-24':'부처님오신날','2026-05-25':'대체공휴일','2026-08-16':'대체공휴일','2026-09-24':'추석연휴','2026-09-25':'추석','2026-09-26':'추석연휴',
  '2027-02-05':'설연휴','2027-02-06':'설날','2027-02-07':'설연휴','2027-02-08':'대체공휴일','2027-05-13':'부처님오신날','2027-09-14':'추석연휴','2027-09-15':'추석','2027-09-16':'추석연휴',
  '2028-01-26':'설연휴','2028-01-27':'설날','2028-01-28':'설연휴','2028-05-02':'부처님오신날','2028-10-02':'추석연휴','2028-10-03':'추석','2028-10-04':'추석연휴',
  '2029-02-12':'설연휴','2029-02-13':'설날','2029-02-14':'설연휴','2029-05-20':'부처님오신날','2029-05-21':'대체공휴일','2029-09-21':'추석연휴','2029-09-22':'추석','2029-09-23':'추석연휴','2029-09-24':'대체공휴일',
  '2030-02-02':'설연휴','2030-02-03':'설날','2030-02-04':'설연휴','2030-02-05':'대체공휴일','2030-05-09':'부처님오신날','2030-09-11':'추석연휴','2030-09-12':'추석','2030-09-13':'추석연휴'
};

const getHolidayName = (dateStr) => {
  if (!dateStr) return null;
  const md = dateStr.slice(5);
  if (KR_HOLIDAYS_FIXED[md]) return KR_HOLIDAYS_FIXED[md];
  if (KR_HOLIDAYS_VAR[dateStr]) return KR_HOLIDAYS_VAR[dateStr];
  return null;
};

// 2. HELPER FUNCTIONS
const getKSTDateStr = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (9 * 3600000));
  return `${kstTime.getFullYear()}-${String(kstTime.getMonth() + 1).padStart(2, '0')}-${String(kstTime.getDate()).padStart(2, '0')}`;
};

// 💡 [V5.0] 자정 분할 엔진을 위한 정밀 날짜 변환기
const getKSTDateStrFromDate = (dObj) => {
  if (!dObj || isNaN(dObj.getTime())) return '';
  const utc = dObj.getTime() + (dObj.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (9 * 3600000));
  return `${kstTime.getFullYear()}-${String(kstTime.getMonth() + 1).padStart(2, '0')}-${String(kstTime.getDate()).padStart(2, '0')}`;
};

const getKSTTimestamp = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 3600000));
  let hh = kst.getHours();
  const ampm = hh >= 12 ? '오후' : '오전';
  hh = hh % 12;
  hh = hh ? hh : 12; 
  return `${kst.getFullYear()}년 ${kst.getMonth() + 1}월 ${kst.getDate()}일 ${ampm} ${hh}:${String(kst.getMinutes()).padStart(2, '0')}`;
};

const getDDay = (targetDateStr) => {
  if(!targetDateStr) return '';
  const todayStr = getKSTDateStr();
  const today = new Date(todayStr);
  const target = new Date(targetDateStr);
  if(isNaN(target.getTime())) return '';
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'D-Day';
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
};

const formatTimeStr = (dateObj) => `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

const getPaydayStr = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return '';
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10)-1, parseInt(parts[2], 10));
  if (isNaN(d.getTime())) return '';
  const daysToAdd = [5, 4, 3, 9, 8, 7, 6][d.getDay()];
  d.setDate(d.getDate() + daysToAdd);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatMoney = (v) => {
  if (v === '' || v === undefined || v === null) return '0';
  const num = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : v;
  return isNaN(num) ? '0' : new Intl.NumberFormat('ko-KR').format(num);
};

const formatLargeMoney = (val) => formatMoney(val);

const formatCompactMoney = (val) => {
  if (!val || val === 0) return '0';
  const absVal = Math.abs(val);
  if (absVal >= 10000) {
    const v = absVal / 10000;
    if (v >= 100) return Math.floor(v) + '만'; 
    return (Number.isInteger(v) ? v : v.toFixed(1)) + '만';
  }
  return new Intl.NumberFormat('ko-KR').format(absVal);
};

const getWeekOfMonth = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return 1;
  const date = new Date(dateStr);
  if(isNaN(date.getTime())) return 1;
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.ceil((date.getDate() + firstDay) / 7);
};

const formatEquation = (eq) => eq.replace(/[\d.]+/g, (match) => {
  if(match.includes('.')) {
      const [intP, decP] = match.split('.');
      return Number(intP).toLocaleString('ko-KR') + '.' + decP;
  }
  return Number(match).toLocaleString('ko-KR');
});

const getMonthlyPayment = (loan) => {
  if (loan.status === '완납') return 0;
  const currentRate = parseFloat(loan.rate) || 0;
  if (loan.paymentMethod === '원리금') {
    const duration = parseInt(loan.duration) || 0;
    if (duration > 0 && currentRate > 0) {
      const monthlyRate = currentRate / 100 / 12;
      const principal = loan.principal || 0;      
      return Math.floor(principal * (monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1));
    }
    return loan.customMonthly || 0; 
  }
  return Math.floor((loan.principal * (currentRate / 100)) / 12);
};

const calcDailyMetrics = (deliveries) => {
  if (!deliveries || deliveries.length === 0) return { durationStr: '', hourlyRate: 0, perDelivery: 0, totalCnt: 0, totalAmt: 0 };
  let intervals = [];
  deliveries.forEach(d => {
    if(d.startTime && d.endTime && typeof d.startTime === 'string' && typeof d.endTime === 'string') {
      let [sh, sm] = d.startTime.split(':').map(Number);
      let [eh, em] = d.endTime.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        let start = sh * 60 + sm;
        let end = eh * 60 + em;
        if (end <= start) end += 1440; 
        intervals.push({start, end});
      }
    }
  });
  intervals.sort((a,b) => a.start - b.start);
  let merged = [];
  if (intervals.length > 0) {
    let current = {...intervals[0]};
    for(let i=1; i<intervals.length; i++) {
      if (intervals[i].start <= current.end) current.end = Math.max(current.end, intervals[i].end);
      else { merged.push(current); current = {...intervals[i]}; }
    }
    merged.push(current);
  }
  let totalMins = merged.reduce((acc, curr) => acc + (curr.end - curr.start), 0);
  let totalAmt = deliveries.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  let totalCnt = deliveries.reduce((acc, curr) => acc + (curr.count || 0), 0);
  
  let hours = Math.floor(totalMins / 60);
  let mins = totalMins % 60;
  let durationStr = totalMins > 0 ? `${hours > 0 ? hours+'시간 ' : ''}${mins > 0 ? mins+'분' : ''}`.trim() : '';
  let hourlyRate = totalMins > 0 ? Math.round(totalAmt / (totalMins / 60)) : 0;
  let perDelivery = totalCnt > 0 ? Math.round(totalAmt / totalCnt) : 0;
  return { durationStr, hourlyRate, perDelivery, totalCnt, totalAmt };
};

const getCategoryIcon = (category, type) => {
  switch (category) {
    case '식비': return <Utensils size={18} />;
    case '주거/통신': case '월세': return <Home size={18} />;
    case '교통/차량': return <Car size={18} />;
    case '보험': return <Shield size={18} />;
    case '오빠생활비': return <User size={18} />;
    case '대출상환': case '카드대금': return <CreditCard size={18} />;
    case '저축': return <PiggyBank size={18} />;
    case '교육': return <GraduationCap size={18} />;
    case '경조사': return <Gift size={18} />;
    case '여행경비': return <Plane size={18} />;
    case '세금': return <FileText size={18} />;
    case '문화생활': return <Film size={18} />;
    case '미용': return <Scissors size={18} />;
    case '쇼핑': return <ShoppingBag size={18} />;
    case '가전': return <Tv size={18} />;
    case '생필품': return <Package size={18} />;
    case '교회': return <Heart size={18} />;
    case '월급': return <Briefcase size={18} />;
    case '배달비': return <Bike size={18} />;
    case '용돈': case '기타수입': return <Coins size={18} />;
    default: return type === '수입' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />;
  }
};

const AutoScaleValue = ({ value, isNet = false }) => {
  let sign = '';
  let color = 'text-gray-800';
  if (isNet) {
      if (value < 0) { sign = '- '; color = 'text-rose-500'; }
      else if (value > 0) { sign = '+ '; color = 'text-blue-500'; }
      else { color = 'text-gray-600'; }
  }
  const str = new Intl.NumberFormat('ko-KR').format(Math.abs(value));
  const len = str.length + sign.length;
  let sizeClass = len > 10 ? 'text-[9px]' : len > 8 ? 'text-[11px]' : 'text-[13px]';
  return <div className={`font-black truncate tracking-tighter ${color} ${sizeClass}`}>{sign}{str}</div>;
};

export const handleTouchStart = (e) => {
  e.currentTarget.dataset.startY = e.touches[0].clientY;
  e.currentTarget.style.transition = 'none'; 
};

export const handleTouchMove = (e) => {
  const startY = parseFloat(e.currentTarget.dataset.startY || 0);
  const currentY = e.touches[0].clientY;
  const swipeDistance = currentY - startY;
  if (swipeDistance > 0) {
    e.currentTarget.style.transform = `translateY(${swipeDistance}px)`;
  }
};
export const handleTouchEnd = (e, closeFunction) => {
  const startY = parseFloat(e.currentTarget.dataset.startY || 0);
  const currentY = e.changedTouches[0].clientY;
  const swipeDistance = currentY - startY;
  const modalHeight = e.currentTarget.clientHeight;

  e.currentTarget.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
  if (swipeDistance > modalHeight * 0.35) {
    e.currentTarget.style.transform = 'translateY(100%)';
    setTimeout(() => { closeFunction(); e.currentTarget.style.transform = ''; }, 250);
  } else {
    e.currentTarget.style.transform = 'translateY(0)';
    setTimeout(() => { e.currentTarget.style.transform = ''; }, 300);
  }
};

// 3. LOCK SCREEN COMPONENT
function LockScreenView({ correctPin, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handlePress = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === correctPin) onUnlock();
        else { setError(true); setTimeout(() => { setPin(''); setError(false); }, 500); }
      }
    }
  };
  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-slate-800 z-[99999] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="mb-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 shadow-lg border border-white/20"><Lock className="w-8 h-8 text-white" /></div>
        <h2 className="text-2xl font-black text-white tracking-tight">비밀번호를 입력하세요</h2>
        <p className="text-gray-400 text-sm mt-2 font-bold">Hope Fam 플래너 보호 중</p>
      </div>
      <div className={`flex gap-4 mb-16 ${error ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        {[0, 1, 2, 3].map(i => <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${pin.length > i ? 'bg-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/20'}`} />)}
      </div>
      <div className="grid grid-cols-3 gap-x-8 gap-y-6 px-10 max-w-sm w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => <button key={num} onClick={() => handlePress(num.toString())} className="w-16 h-16 rounded-full bg-white/5 text-white text-2xl font-black flex items-center justify-center active:bg-white/20 active:scale-95 transition-all mx-auto border border-white/5">{num}</button>)}
        <div />
        <button onClick={() => handlePress('0')} className="w-16 h-16 rounded-full bg-white/5 text-white text-2xl font-black flex items-center justify-center active:bg-white/20 active:scale-95 transition-all mx-auto border border-white/5">0</button>
        <button onClick={handleDelete} className="w-16 h-16 rounded-full text-white/70 flex items-center justify-center active:bg-white/10 active:scale-95 transition-all mx-auto"><Delete className="w-8 h-8" /></button>
      </div>
    </div>
  );
}

// 4. SETTINGS COMPONENT
function SettingsView({ activeTab, tabOrder, setTabOrder, currentUser, setCurrentUser, categories, setCategories, userSettings, setUserSettings, selectedYear, selectedMonth, currentMonthKey, user, handleClearAllMessages, appFont, setAppFont }) {
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(() => localStorage.getItem('hyunaLockEnabled') === 'true');
  const [lockPin, setLockPin] = useState(() => localStorage.getItem('hyunaLockPin') || '0000');
  const [lockTimeout, setLockTimeout] = useState(() => localStorage.getItem('hyunaLockTimeout') || '0');

  const moveTab = (index, direction) => {
    const newOrder = [...tabOrder];
    if (direction === 'up' && index > 0) [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    else if (direction === 'down' && index < newOrder.length - 1) [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setTabOrder(newOrder);
    localStorage.setItem('hyunaTabOrder', JSON.stringify(newOrder));
  };

  const handleSetCurrentUser = (name) => { setCurrentUser(name); localStorage.setItem('hyunaCurrentUser', name); };
  const updateSettings = async (field, value) => {
    const newSettings = { ...userSettings, [field]: value };
    if(isFirebaseEnabled && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'preferences'), newSettings);
    else setUserSettings(newSettings);
  };
  const toggleLock = (e) => {
    const isChecked = e.target.checked;
    setLockEnabled(isChecked);
    localStorage.setItem('hyunaLockEnabled', isChecked ? 'true' : 'false');
  };

  const changeLockPin = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setLockPin(val);
    if(val.length === 4) localStorage.setItem('hyunaLockPin', val);
  };

  const changeLockTimeout = (e) => {
    setLockTimeout(e.target.value);
    localStorage.setItem('hyunaLockTimeout', e.target.value);
  };
  const getSortedCategories = (type) => [...(categories[type] || [])].sort((a, b) => (a||'').localeCompare(b||''));
  const handleAddCategory = async (type) => {
    const newCat = prompt(`추가할 ${type} 카테고리명을 입력하세요:`);
    if(newCat && newCat.trim() !== '') {
       const newCats = {...categories, [type]: [...(categories[type]||[]), newCat.trim()]};
       if(isFirebaseEnabled && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'categories'), newCats);
       else setCategories(newCats);
    }
  };
  const handleDeleteCategory = async (type, cat) => {
    if(window.confirm(`'${cat}' 카테고리를 정말 삭제하시겠습니까?`)) {
       const newCats = {...categories, [type]: (categories[type]||[]).filter(c => c !== cat)};
       if(isFirebaseEnabled && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'categories'), newCats);
       else setCategories(newCats);
    }
  };
  return (
    <div className="px-5 my-4 animate-in fade-in space-y-4">
      <div className="mb-2 pl-1">
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-1.5"><Settings className="text-gray-500" size={18}/> 메뉴 맞춤 설정</h2>
        <p className="text-xs font-bold text-gray-400 mt-1">자주 사용하는 기능들을 내 입맛에 맞게 관리하세요.</p>
      </div>

      {activeTab === 'ledger' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md animate-in slide-in-from-right-2">
          <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-1.5"><Settings size={16}/> 카테고리 관리 💖</h3>
          <div className="space-y-4">
            {['지출', '수입'].map(type => (
              <div key={type}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-bold ${type==='지출'?'text-gray-500':'text-blue-500'}`}>{type} 카테고리</span>
                  <button onClick={() => handleAddCategory(type)} className={`text-[10px] ${type==='지출'?'bg-gray-50 text-gray-600 border-gray-200':'bg-blue-50 text-blue-600 border-blue-100'} px-2 py-1 rounded font-bold border`}>+ 추가</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {getSortedCategories(type).map(c => (
                    <span key={c} className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-bold">{c} <button onClick={() => handleDeleteCategory(type, c)} className={`text-gray-400 hover:text-gray-800`}><X size={12}/></button></span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'delivery' && (
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-md animate-in slide-in-from-right-2">
          <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><Target size={16} className="text-blue-500"/> {selectedYear}년 {selectedMonth}월 배달 목표</h3>
          <div className="flex items-center gap-2">
            <input type="text" inputMode="numeric" pattern="[0-9,]*" value={userSettings.deliveryGoals?.[currentMonthKey] || ''} onChange={(e) => updateSettings('deliveryGoals', {...(userSettings.deliveryGoals || {}), [currentMonthKey]: parseInt(e.target.value.replace(/[^0-9]/g, ''))||0})} placeholder="목표 금액 입력" className="flex-1 bg-blue-50/50 rounded-xl p-3 h-[48px] text-sm font-black outline-none border border-blue-100 focus:ring-2 ring-blue-300" />
            <span className="text-gray-500 font-bold text-sm">원</span>
          </div>
        </div>
      )}

      {(activeTab === 'assets' || activeTab === 'calendar') && (
        <div className={`bg-white p-5 rounded-2xl border ${activeTab==='assets'?'border-indigo-200':'border-emerald-200'} shadow-md animate-in slide-in-from-right-2 text-center text-sm font-bold text-gray-500`}>
          {activeTab === 'assets' ? '설정에 있던 자산/대출 추가 버튼은 메인 화면으로 이동되었습니다.' : '우리가족 메뉴는 별도의 설정이 필요하지 않습니다.'}
        </div>
      )}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <button onClick={() => setIsSystemSettingsOpen(!isSystemSettingsOpen)} className="w-full flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm active:scale-95 transition-all">
          <span className="font-black text-gray-700 flex items-center gap-2"><Settings size={18}/> 시스템 및 보안 설정</span>
          <div className="bg-gray-100 p-1.5 rounded-full">
            {isSystemSettingsOpen ? <ChevronUp size={18} className="text-gray-500"/> : <ChevronDown size={18} className="text-gray-500"/>}
          </div>
        </button>
      </div>

      {isSystemSettingsOpen && (
        <div className="space-y-4 animate-in slide-in-from-top-2 pt-2">
          
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><Edit3 size={16} className="text-pink-500"/> 내 기기 글씨체 설정</h3>
            <select value={appFont} onChange={(e) => { setAppFont(e.target.value); localStorage.setItem('hyunaFont', e.target.value); }} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 h-[44px] font-bold text-sm outline-none text-slate-700 shadow-inner">
              <option value="Inter">Inter (기본 깔끔 고딕체)</option>
              <option value="Pretendard">프리텐다드 (애플 순정 감성)</option>
              <option value="'KOTRA_HOPE'">코트라 희망체 (따뜻한 손글씨)</option>
              <option value="'Cafe24SsurroundAir'">카페24 써라운드 (둥글둥글 귀여움)</option>
              <option value="'CookieRun'">쿠키런체 (통통 튀는 매력)</option>
              <option value="'Bareun_hipi'">바른히피체 (꾸안꾸 다이어리 감성)</option>
              <option value="'Ownglyph_uiyeon'">온글잎 의연체 (인스타 감성 펜글씨)</option>
            </select>
            <p className="text-[9px] text-gray-400 font-bold mt-2 leading-relaxed">이 설정은 현재 기기에만 저장되어 부부가 서로 다른 폰트를 사용할 수 있습니다.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><User size={16} className="text-purple-500"/> 내 기기 프로필 설정 (부부 톡 용)</h3>
            <div className="flex gap-2">
              <button onClick={() => handleSetCurrentUser('현아')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${currentUser === '현아' ? 'bg-pink-500 text-white shadow-md border-pink-600' : 'bg-pink-50 text-pink-400 border border-pink-100 hover:bg-pink-100'}`}>👩 현아</button>
              <button onClick={() => handleSetCurrentUser('정훈')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${currentUser === '정훈' ? 'bg-blue-600 text-white shadow-md border-blue-700' : 'bg-blue-50 text-blue-400 border border-blue-100 hover:bg-blue-100'}`}>🧑 정훈</button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><Shield size={16} className="text-slate-600"/> 보안 / 앱 잠금</h3>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" className="sr-only peer" checked={lockEnabled} onChange={toggleLock} />
                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700"></div>
               </label>
            </div>
            {lockEnabled && (
              <div className="space-y-3 mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 block mb-1">앱 비밀번호 (4자리 숫자)</label>
                    <input type="password" inputMode="numeric" pattern="[0-9,]*" value={lockPin} onChange={changeLockPin} placeholder="0000" className="w-full bg-gray-50 border rounded-xl px-4 py-2 font-black text-lg outline-none focus:border-slate-400 tracking-widest text-slate-700" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 block mb-1">자동 잠금 유예시간 (세션 유지)</label>
                    <select value={lockTimeout} onChange={changeLockTimeout} className="w-full bg-gray-50 border rounded-xl px-3 h-[44px] font-bold text-sm outline-none text-slate-700">
                       <option value="0">즉시 잠금 (앱을 벗어날 때마다)</option>
                       <option value="5">5분 후 잠금</option>
                       <option value="10">10분 후 잠금</option>
                       <option value="60">1시간 후 잠금</option>
                       <option value="360">6시간 후 잠금</option>
                       <option value="1440">24시간 후 잠금</option>
                    </select>
                    <p className="text-[9px] text-gray-400 font-bold mt-1.5 leading-relaxed">기기에만 저장됩니다. 유예시간 내에 돌아오면 비밀번호를 묻지 않습니다.</p>
                 </div>
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><Smartphone size={16} className={activeTab === 'ledger' ? 'text-gray-500' : activeTab === 'delivery' ? 'text-blue-500' : 'text-indigo-500'}/> 앱 시작 시 기본 화면</h3>
            <div className={`flex justify-between items-center p-3 rounded-xl border ${activeTab === 'ledger' ? 'bg-gray-50/50 border-gray-200/50' : activeTab === 'delivery' ? 'bg-blue-50/50 border-blue-200/50' : activeTab === 'calendar' ? 'bg-emerald-50/50 border-emerald-200/50' : 'bg-indigo-50/50 border-indigo-200/50'}`}>
              <div><span className={`text-sm font-black ${activeTab === 'ledger' ? 'text-gray-600' : activeTab === 'delivery' ? 'text-blue-600' : activeTab === 'calendar' ? 'text-emerald-600' : 'text-indigo-700'}`}>{tabConfig[activeTab].label}</span></div>
              <button onClick={() => { localStorage.setItem('hyunaDefaultTab', activeTab); alert('초기화면이 설정되었습니다.'); }} className={`${activeTab === 'ledger' ? 'bg-gray-500' : activeTab === 'delivery' ? 'bg-blue-600' : 'bg-indigo-600'} text-white text-[10px] px-3 py-2 rounded-lg font-bold shadow-sm active:scale-95`}>현재 탭으로 고정</button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><List size={16} className="text-indigo-500"/> 하단 메뉴 순서 변경</h3>
            <div className="space-y-2">
              {tabOrder.map((tabId, index) => (
                <div key={tabId} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-2"><span className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm text-xs">{index + 1}</span>{tabConfig[tabId].label}</span>
                  <div className="flex gap-1">
                    <button onClick={() => moveTab(index, 'up')} disabled={index === 0} className="p-2 bg-white rounded-lg shadow-sm disabled:opacity-30 border border-gray-100"><ChevronUp size={16}/></button>
                    <button onClick={() => moveTab(index, 'down')} disabled={index === tabOrder.length - 1} className="p-2 bg-white rounded-lg shadow-sm disabled:opacity-30 border border-gray-100"><ChevronDown size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
             <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5">
               <Trash2 size={16} className="text-red-500"/> 데이터 관리
             </h3>
             <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 text-center">
               <p className="text-xs font-bold text-red-600 mb-4 leading-relaxed">모든 한줄톡 채팅 내역과 시스템 알림 로그를<br/>데이터베이스에서 영구적으로 삭제합니다.</p>
               <button onClick={handleClearAllMessages} className="w-full bg-red-500 text-white py-3 rounded-xl text-sm font-black active:scale-95 shadow-sm border border-red-600">
                 채팅 / 로그 전체 초기화
               </button>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. LEDGER TAB COMPONENT
// ==========================================
function LedgerView({ ledger, setLedger, assets, setAssets, memos, setMemos, selectedYear, selectedMonth, currentMonthKey, todayStr, categories, setCategories, user, isManageMode, currentUser, customHolidays }) {
  const [ledgerSubTab, setLedgerSubTab] = useState('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [ledgerDateRange, setLedgerDateRange] = useState({ start: '', end: '' });
  
  const [selectedLedgerDetail, setSelectedLedgerDetail] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  
  // 💡 [V5.4] 리포트 전체보기 및 카테고리 상세 팝업을 위한 상태
  const [isExpenseExpanded, setIsExpenseExpanded] = useState(false);
  const [isIncomeExpanded, setIsIncomeExpanded] = useState(false);
  const [selectedReportCategory, setSelectedReportCategory] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLedgerId, setEditingLedgerId] = useState(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [saveToCategoryList, setSaveToCategoryList] = useState(true);
  
  const [formData, setFormData] = useState({ date: todayStr, type: '지출', amount: '', category: '식비', note: '', subNote: '', isFromSavings: false, linkedAssetId: '' });
  const [isMemoEditorOpen, setIsMemoEditorOpen] = useState(false);
  const [currentMemoId, setCurrentMemoId] = useState(null);
  const [memoText, setMemoText] = useState('');

  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [calcConfirm, setCalcConfirm] = useState({ show: false, count: 0, total: 0 });
  const suggestionRef = useRef(null);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

  const [calYear, setCalYear] = useState(selectedYear);
  const [calMonth, setCalMonth] = useState(selectedMonth);

  useEffect(() => {
    setCalYear(selectedYear);
    setCalMonth(selectedMonth);
  }, [selectedYear, selectedMonth]);
  
  const [isYearlyIncomeOpen, setIsYearlyIncomeOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) setIsSuggestionOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSortedCategories = (type) => {
    let cats = type === 'all' ? [...(categories['지출'] || []), ...(categories['수입'] || [])] : [...(categories[type] || [])];
    return Array.from(new Set(cats)).sort((a, b) => (a||'').localeCompare(b||''));
  };

  const depositAssets = useMemo(() => {
     return [...(assets?.deposits || []), ...(assets?.savings || [])].sort((a,b) => b.balance - a.balance);
  }, [assets]);

  const yearlyIncome = useMemo(() => (ledger || []).filter(t => t?.type === '수입' && typeof t?.date === 'string' && t.date.startsWith(String(selectedYear))).reduce((acc, curr) => acc + (curr.amount||0), 0), [ledger, selectedYear]);

  const filteredLedger = useMemo(() => {
    let data = ledger || [];
    if (ledgerDateRange.start || ledgerDateRange.end) {
      if (ledgerDateRange.start) data = data.filter(t => typeof t?.date === 'string' && t.date >= ledgerDateRange.start);
      if (ledgerDateRange.end) data = data.filter(t => typeof t?.date === 'string' && t.date <= ledgerDateRange.end);
    } else {
      data = data.filter(t => typeof t?.date === 'string' && t.date.startsWith(`${calYear}-${String(calMonth).padStart(2, '0')}`));
    }
    if (filterType !== 'all') data = data.filter(t => t.type === filterType);
    if (filterCategory !== 'all') data = data.filter(t => t.category === filterCategory);
    if (searchQuery.trim()) data = data.filter(t => (t.note||'').toLowerCase().includes(searchQuery.toLowerCase()) || (t.category||'').toLowerCase().includes(searchQuery.toLowerCase()));
    return data;
  }, [ledger, calYear, calMonth, filterType, filterCategory, searchQuery, ledgerDateRange]);

  const monthUsedCategories = useMemo(() => {
    const categoryTotals = {};
    filteredLedger.forEach(t => {
      if (t.category) {
        if (!categoryTotals[t.category]) categoryTotals[t.category] = 0;
        categoryTotals[t.category] += (t.amount || 0);
      }
    });
    return Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]);
  }, [filteredLedger]);

  const isActualExpense = (t) => {
    if (t.type !== '지출') return false;
    if (!t.date) return false;
    if (t.date < '2026-05-01') return !t.isFromSavings;
    return t.category !== '저축'; 
  };

  const ledgerSummary = useMemo(() => ({ 
    income: filteredLedger.filter(t => t.type === '수입').reduce((a, b) => a + (b.amount||0), 0), 
    expense: filteredLedger.filter(isActualExpense).reduce((a, b) => a + (b.amount||0), 0), 
    net: filteredLedger.filter(t => t.type === '수입').reduce((a, b) => a + (b.amount||0), 0) - filteredLedger.filter(isActualExpense).reduce((a, b) => a + (b.amount||0), 0) 
  }), [filteredLedger]);

  // 💡 [V5.4] slice(0, 5) 제거: 전체 데이터를 가지고 있게끔 수정
  const reviewData = useMemo(() => ({
    expense: Object.entries(filteredLedger.filter(isActualExpense).reduce((acc, curr) => { acc[curr.category || '기타'] = (acc[curr.category || '기타'] || 0) + (curr.amount || 0); return acc; }, {})).sort((a, b) => b[1] - a[1]),
    income: Object.entries(filteredLedger.filter(t => t.type === '수입').reduce((acc, curr) => { acc[curr.category || '기타'] = (acc[curr.category || '기타'] || 0) + (curr.amount || 0); return acc; }, {})).sort((a, b) => b[1] - a[1]),
  }), [filteredLedger]);

  const financialSummary = useMemo(() => {
    const monthRawLedger = (ledger||[]).filter(t => typeof t?.date==='string' && t.date.startsWith(`${calYear}-${String(calMonth).padStart(2, '0')}`));
    const rawExpense = monthRawLedger.filter(isActualExpense).reduce((a,b)=>a+(b.amount||0),0);
    const sumPrincipal = monthRawLedger.filter(t => (t.category||'').includes('대출상환') || (t.category||'').includes('대출원금') || (t.category||'').includes('원금상환')).reduce((a,b)=>a+(b.amount||0),0);
    const sumInterest = monthRawLedger.filter(t => (t.category||'').includes('대출이자') || (t.category||'').includes('이자상환')).reduce((a,b)=>a+(b.amount||0),0);
    return { sumLiving: rawExpense - sumPrincipal - sumInterest, sumPrincipal, sumInterest };
  }, [ledger, calYear, calMonth]);

  const groupedLedger = useMemo(() => (filteredLedger || []).reduce((acc, curr) => { if(curr.date){ if (!acc[curr.date]) acc[curr.date] = []; acc[curr.date].push(curr); } return acc; }, {}), [filteredLedger]);
  const ledgerDates = Object.keys(groupedLedger).sort((a, b) => new Date(b) - new Date(a));

  const frequentItems = useMemo(() => {
    const counts = {};
    ledger.forEach(t => {
      if (t.type === formData.type && t.note) {
        const key = `${t.category}|${t.note}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0].split('|'));
  }, [ledger, formData.type]);

  const suggestedNotes = useMemo(() => {
    if (!formData.note) return [];
    const matches = ledger.filter(t => t.type === formData.type && t.note && t.note.includes(formData.note) && t.note !== formData.note);
    const uniqueMatches = [];
    const seen = new Set();
    matches.sort((a,b) => b.date.localeCompare(a.date)).forEach(t => {
       if(!seen.has(t.note)) { seen.add(t.note); uniqueMatches.push({ note: t.note, category: t.category, type: t.type }); }
    });
    return uniqueMatches.slice(0, 5);
  }, [ledger, formData.note, formData.type]);

  const amountPlaceholder = useMemo(() => {
    if (!formData.note) return null;
    const lastTx = [...ledger].filter(t => t.type === formData.type && t.note === formData.note && t.id !== editingLedgerId && t.date).sort((a,b) => b.date.localeCompare(a.date))[0];
    if (lastTx && lastTx.amount) {
      const m = parseInt(lastTx.date.slice(5, 7), 10);
      const d = parseInt(lastTx.date.slice(8, 10), 10);
      const verb = formData.type === '수입' ? '기록한' : '지출한';
      return `최근 ${m}월 ${d}일에 ${verb} 금액은 ${new Intl.NumberFormat('ko-KR').format(lastTx.amount)}원이었어요 😊`;
    }
    return null;
  }, [formData.note, formData.type, ledger, editingLedgerId]);

  const saveTransaction = async () => {
    if (!formData.amount || !user) return false;
    let finalCategory = formData.category;
    if (isCustomCategory) {
      if (!customCategoryInput.trim()) { alert("카테고리를 입력해주세요."); return false; }
      finalCategory = customCategoryInput.trim();
      if (saveToCategoryList) {
        const newCats = {...categories, [formData.type]: [...(categories[formData.type]||[]), finalCategory]};
        if (isFirebaseEnabled) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'categories'), newCats);
        else setCategories(newCats);
      }
    }

    const finalAmount = parseInt(String(formData.amount).replace(/,/g, ''), 10);
    const timestamp = new Date().toISOString();
    const newTx = { 
       ...formData, 
       category: finalCategory, 
       amount: finalAmount,
       isFromSavings: formData.type === '지출' && formData.category !== '저축' ? formData.isFromSavings : false,
       updatedAt: timestamp,
       updatedBy: currentUser
    };

    let assetToUpdate = null;
    let assetUpdates = null;
    if (!editingLedgerId && formData.linkedAssetId) { 
        if (formData.type === '지출' && formData.category === '저축') {
            assetToUpdate = depositAssets.find(a => a.id === formData.linkedAssetId);
            if (assetToUpdate) assetUpdates = { type: 'deposit', amount: finalAmount };
        }
        else if (formData.type === '지출' && formData.isFromSavings) {
            assetToUpdate = depositAssets.find(a => a.id === formData.linkedAssetId);
            if (assetToUpdate) assetUpdates = { type: 'withdraw', amount: finalAmount };
        }
    }

    if (editingLedgerId) {
      if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ledger', editingLedgerId), newTx);
      else setLedger(ledger.map(t => t.id === editingLedgerId ? {...newTx, id: editingLedgerId} : t));
    } else {
      if (isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ledger'), newTx);
      else setLedger([{...newTx, id: Date.now().toString()}, ...ledger]);

      if (assetToUpdate && assetUpdates && isFirebaseEnabled) {
          const newBalance = assetUpdates.type === 'deposit' ? assetToUpdate.balance + assetUpdates.amount : Math.max(0, assetToUpdate.balance - assetUpdates.amount);
          const historyItem = { id: Date.now().toString(), date: formData.date, type: assetUpdates.type, amount: assetUpdates.amount, note: formData.note || finalCategory, category: finalCategory };
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', assetToUpdate.id), { balance: newBalance, history: [historyItem, ...(assetToUpdate.history || [])], updatedAt: timestamp, updatedBy: currentUser });
      }
    }
    return true;
  };

  const handleTransactionSubmit = async (e, isContinuous = false) => {
    e.preventDefault();
    const success = await saveTransaction();
    if (success) {
       if (isContinuous) setFormData({ ...formData, amount: '', note: '', subNote: '' });
       else { setIsModalOpen(false); setEditingLedgerId(null); }
    }
  };

  const handleEditClick = (t) => {
    setSelectedLedgerDetail(null);
    setFormData({ date: t.date, type: t.type, amount: String(t.amount), category: t.category, note: t.note || '', subNote: t.subNote || '', isFromSavings: t.isFromSavings || false, linkedAssetId: '' });
    setEditingLedgerId(t.id);
    setIsModalOpen(true); 
  };

  const handleCopyClick = (t) => {
    setFormData({ date: todayStr, type: t.type, amount: String(t.amount), category: t.category, note: t.note || '', subNote: t.subNote || '', isFromSavings: t.isFromSavings || false, linkedAssetId: '' });
    setEditingLedgerId(null);
    setSelectedLedgerDetail(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if(!window.confirm('이 내역을 정말 삭제하시겠습니까?')) return;
    if (isFirebaseEnabled && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ledger', id));
    else setLedger((ledger||[]).filter(t => t.id !== id));
    setSelectedLedgerDetail(null);
  };

  const saveMemo = async () => {
    if(!user || !window.confirm("메모를 저장하시겠습니까?")) return;
    const stamp = getKSTTimestamp();
    const isoStamp = new Date().toISOString(); 
    if(currentMemoId) {
        if(isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'memos', currentMemoId), { text: memoText, updatedAt: stamp, isoUpdate: isoStamp, updatedBy: currentUser });
        else setMemos(memos.map(m => m.id === currentMemoId ? {...m, text: memoText, updatedAt: stamp, isoUpdate: isoStamp, updatedBy: currentUser} : m));
    } else {
        if(!memoText.trim()) { setIsMemoEditorOpen(false); return; } 
        const newMemo = { text: memoText, createdAt: stamp, updatedAt: stamp, isoUpdate: isoStamp, updatedBy: currentUser };
        if(isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'memos'), newMemo);
        else setMemos([{...newMemo, id: Date.now().toString()}, ...memos]);
    }
    setIsMemoEditorOpen(false); setIsCalcOpen(false);
    setCalcConfirm({show:false, count:0, total:0});
  };

  const deleteMemo = async () => {
    if (!currentMemoId || !user || !window.confirm("메모를 삭제하시겠습니까?")) return;
    if (isFirebaseEnabled) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'memos', currentMemoId));
    else setMemos(memos.filter(m => m.id !== currentMemoId));
    setIsMemoEditorOpen(false); setIsCalcOpen(false);
    setCalcConfirm({show:false, count:0, total:0});
  };

  const handleCalcBtn = (val) => {
    if (val === 'AC') setCalcInput('');
    else if (val === '⌫') setCalcInput(prev => prev.slice(0, -1));
    else if (val === '=') { 
        try { 
            let sanitized = calcInput.replace(/×/g, '*').replace(/÷/g, '/');
            sanitized = sanitized.replace(/[+\-*/]+$/, ''); 
            // eslint-disable-next-line
            setCalcInput(String(new Function('return (' + sanitized + ')')()));
        } catch { setCalcInput('Error'); } 
    }
    else if (val === '+/-') { 
        try { 
            let sanitized = calcInput.replace(/×/g, '*').replace(/÷/g, '/').replace(/[+\-*/]+$/, '');
            // eslint-disable-next-line
            setCalcInput(String(-new Function('return (' + sanitized + ')')()));
        } catch {} 
    }
    else if (val === '%') { 
        try { 
            let sanitized = calcInput.replace(/×/g, '*').replace(/÷/g, '/').replace(/[+\-*/]+$/, '');
            // eslint-disable-next-line
            setCalcInput(String(new Function('return (' + sanitized + ')')() / 100));
        } catch {} 
    }
    else { if (calcInput === 'Error') setCalcInput(val);
    else setCalcInput(prev => prev + val); }
  };

  const handleAutoCalc = () => {
    if (!memoText.trim()) return;
    const lines = memoText.split('\n');
    let total = 0; let hasMath = false;
    try {
        const lastLine = lines[lines.length - 1].replace(/[^\d+\-*/().]/g, '');
        if (/[+\-*/]/.test(lastLine)) {
            let sanitized = lastLine.replace(/[+\-*/]+$/, '');
            // eslint-disable-next-line no-new-func
            total = new Function('return ' + sanitized)();
            hasMath = true;
            if(total > 0) { setCalcConfirm({ show: true, count: 1, total }); return; }
        }
    } catch(e) {}
    if (!hasMath) {
        const matches = memoText.match(/\b\d{1,3}(?:,\d{3})+\b|\b\d+\b/g);
        if (matches) {
            const extractedNums = matches.map(val => parseInt(val.replace(/,/g, ''), 10)).filter(num => num >= 100 && !(num >= 2020 && num <= 2030));
            if (extractedNums.length > 0) {
               total = extractedNums.reduce((a, b) => a + b, 0);
               setCalcConfirm({ show: true, count: extractedNums.length, total });
               return;
            }
        }
    }
    alert("계산할 금액이나 수식을 찾지 못했습니다. 🥲\n(금액이 너무 작거나 연도만 있는 경우 무시됩니다)");
  };

  const isSearchActive = searchQuery || filterType !== 'all' || filterCategory !== 'all' || ledgerDateRange.start || ledgerDateRange.end;
  return (
    <div className="space-y-3 pb-4 pt-2 animate-in fade-in duration-500">
      
      <div className="mb-2">
        {isYearlyIncomeOpen ? (
          <div className="bg-gradient-to-r from-pink-400 to-rose-400 rounded-3xl p-4 text-white shadow-md relative overflow-hidden flex justify-between items-center cursor-pointer animate-in fade-in" onClick={() => setIsYearlyIncomeOpen(false)}>
             <div className="relative z-10">
               <div className="text-[10px] font-bold opacity-90 mb-0 tracking-wider flex items-center gap-1"><ChevronUp size={12}/> {selectedYear}년 누적 총 수입</div>
               <div className="text-3xl font-black tracking-tight leading-none mt-1">{formatMoney(yearlyIncome)}<span className="text-lg ml-1 font-bold opacity-80">원</span></div>
             </div>
             <Heart className="w-16 h-16 opacity-20 absolute -right-3 -bottom-3 rotate-12" fill="white" />
          </div>
        ) : (
          <div className="bg-white border border-pink-200/60 rounded-[1rem] p-3 shadow-sm flex justify-between items-center cursor-pointer text-pink-500 hover:bg-pink-50 transition-colors" onClick={() => setIsYearlyIncomeOpen(true)}>
             <span className="text-xs font-black flex items-center gap-1.5">🌸 {selectedYear}년 누적 총 수입 확인하기</span>
             <ChevronDownSquare size={16} />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${showFilters ? 'bg-pink-500 text-white' : 'bg-white text-pink-500 border border-pink-200'}`}><Search size={16} /></button>
          <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1 flex-1">
            <button onClick={() => { setFilterType('all'); setFilterCategory('all'); }} className={`flex-none px-3 py-1.5 rounded-xl text-xs font-black shadow-sm ${filterCategory === 'all' && filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-pink-100'}`}>전체</button>
            {monthUsedCategories.map(c => (
              <button key={c} onClick={() => { setFilterType('all'); setFilterCategory(c === filterCategory ? 'all' : c); }} className={`flex-none px-3 py-1.5 rounded-xl text-xs font-black shadow-sm ${filterCategory === c ? 'bg-pink-500 text-white' : 'bg-white text-gray-500 border border-pink-100'}`}>#{c}</button>
            ))}
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100 animate-in slide-in-from-top-2 space-y-3 mb-3">
            <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="text" placeholder="검색어 입력" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-pink-50 rounded-xl py-2 pl-9 pr-3 h-[44px] text-sm font-bold outline-none border border-pink-100" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterCategory('all'); }} className="w-full bg-pink-50 border border-pink-100 rounded-xl px-2 h-[44px] text-sm font-bold outline-none"><option value="all">전체보기</option><option value="지출">지출만</option><option value="수입">수입만</option></select></div>
              <div><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-pink-50 border border-pink-100 rounded-xl px-2 h-[44px] text-sm font-bold outline-none truncate"><option value="all">모든 분류</option>{getSortedCategories(filterType).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div><div className="flex items-center gap-1.5"><input type="date" value={ledgerDateRange.start} onChange={(e) => setLedgerDateRange({...ledgerDateRange, start: e.target.value})} className="flex-1 bg-pink-50 border border-pink-100 rounded-xl px-2 h-[44px] text-xs font-bold outline-none" /><span className="text-gray-300 font-bold">~</span><input type="date" value={ledgerDateRange.end} onChange={(e) => setLedgerDateRange({...ledgerDateRange, end: e.target.value})} className="flex-1 bg-pink-50 border border-pink-100 rounded-xl px-2 h-[44px] text-xs font-bold outline-none" /></div></div>
            <button onClick={() => {setSearchQuery(''); setFilterType('all'); setFilterCategory('all'); setLedgerDateRange({start:'',end:''});}} className="w-full bg-gray-50 border border-gray-200 text-gray-500 py-3 rounded-xl font-black text-sm flex justify-center items-center gap-1.5 hover:text-pink-600"><RefreshCw size={14}/> 초기화</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-md border border-pink-200 relative overflow-hidden">
         <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5">
           <PieChart size={16} className="text-pink-500"/> 
           {isSearchActive ? '검색된 내역 요약 🔍' : `${calMonth}월 가계부 요약 🌷`}
         </h3>
         <div className="grid grid-cols-3 gap-2 mb-3">
           <div className="bg-blue-50/60 p-3 rounded-2xl border text-center shadow-sm"><div className="text-[9px] font-bold text-blue-500 mb-1">수입 합계 💰</div><AutoScaleValue value={ledgerSummary.income} /></div>
           <div className="bg-rose-50/60 p-3 rounded-2xl border text-center shadow-sm"><div className="text-[9px] font-bold text-rose-500 mb-1">지출 합계 💸</div><AutoScaleValue value={ledgerSummary.expense} /></div>
           <div className="bg-purple-50/60 p-3 rounded-2xl border text-center shadow-sm"><div className="text-[9px] font-bold text-purple-500 mb-1">남은 돈 ✨</div><AutoScaleValue value={ledgerSummary.net} isNet={true} /></div>
         </div>
         
         {!isSearchActive && (
           <div className="flex justify-between text-center gap-2">
             <div className="flex-1 bg-gray-50/80 p-2 rounded-xl border"><div className="text-[9px] font-bold text-gray-500 mb-1">순수 생활비 🍱</div><AutoScaleValue value={financialSummary.sumLiving} /></div>
             <div className="flex-1 bg-gray-50/80 p-2 rounded-xl border"><div className="text-[9px] font-bold text-gray-500 mb-1">대출 원금 🏦</div><AutoScaleValue value={financialSummary.sumPrincipal} /></div>
             <div className="flex-1 bg-gray-50/80 p-2 rounded-xl border"><div className="text-[9px] font-bold text-gray-500 mb-1">대출 이자 📉</div><AutoScaleValue value={financialSummary.sumInterest} /></div>
           </div>
         )}
      </div>

      <div className="flex bg-pink-100 p-1.5 rounded-2xl mx-1 mb-2 mt-4 shadow-inner border border-pink-200">
        <button onClick={() => setLedgerSubTab('daily')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${ledgerSubTab==='daily'?'bg-white text-pink-600 shadow-sm border border-pink-200':'text-gray-500'}`}><List size={14}/> 상세내역</button>
        <button onClick={() => setLedgerSubTab('calendar')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${ledgerSubTab==='calendar'?'bg-white text-pink-600 shadow-sm border border-pink-200':'text-gray-500'}`}><CalendarDays size={14}/> 달력</button>
        <button onClick={() => setLedgerSubTab('review')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${ledgerSubTab==='review'?'bg-white text-pink-600 shadow-sm border border-pink-200':'text-gray-500'}`}><PieChart size={14}/> 리포트</button>
        <button onClick={() => setLedgerSubTab('memo')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${ledgerSubTab==='memo'?'bg-white text-pink-600 shadow-sm border border-pink-200':'text-gray-500'}`}><NotebookPen size={14}/> 메모장</button>
      </div>

      {ledgerSubTab === 'calendar' && (() => {
        const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth, 0).getDate();
        const days = Array(firstDay).fill(null).concat(Array.from({length:daysInMonth}, (_,i)=>i+1));
        const dataByDate = {};
        const calLedger = (ledger || []).filter(t => typeof t?.date === 'string' && t.date.startsWith(`${calYear}-${String(calMonth).padStart(2, '0')}`));
        calLedger.forEach(t => { 
           if(!dataByDate[t.date]) dataByDate[t.date] = { inc: 0, exp: 0 }; 
           if(t.type === '수입') dataByDate[t.date].inc += t.amount; 
           if(isActualExpense(t)) dataByDate[t.date].exp += t.amount; 
        });
        return (
          <div className="bg-white rounded-[2rem] p-4 shadow-md border border-pink-100 animate-in slide-in-from-bottom-2 mt-1">
             <div className="flex justify-between items-center px-3 mb-4 mt-1">
                <button onClick={() => { if(calMonth===1){setCalMonth(12); setCalYear(calYear-1);} else setCalMonth(calMonth-1); }} className="p-1.5 bg-pink-50 text-pink-500 rounded-xl active:scale-95"><ChevronLeft size={18}/></button>
                <span className="font-black text-gray-800 text-base">{calYear}년 {calMonth}월</span>
                <button onClick={() => { if(calMonth===12){setCalMonth(1); setCalYear(calYear+1);} else setCalMonth(calMonth+1); }} className="p-1.5 bg-pink-50 text-pink-500 rounded-xl active:scale-95"><ChevronRight size={18}/></button>
             </div>

             <div className="grid grid-cols-7 gap-1 text-center mb-2">{['일','월','화','수','목','금','토'].map((d,i) => <div key={d} className={`text-[10px] font-bold ${i===0?'text-red-500':i===6?'text-blue-500':'text-slate-600'}`}>{d}</div>)}</div>
            
             <div className="grid grid-cols-7 gap-1">
               {days.map((d, i) => {
                 if(!d) return <div key={`empty-${i}`} className="h-[55px] bg-gray-50/30 rounded-xl border border-gray-100"></div>;
                 const dateStr = `${calYear}-${String(calMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                 const dayData = dataByDate[dateStr] || { inc: 0, exp: 0 };
                 const hasData = dayData.inc > 0 || dayData.exp > 0;
                 const isToday = dateStr === todayStr;
                 
                 const holidayName = getHolidayName(dateStr);
                 const isCustomHoliday = customHolidays.includes(dateStr);
                 const dayIndex = (i % 7);
                 const isRed = dayIndex === 0 || holidayName || isCustomHoliday;
                 const isBlue = dayIndex === 6 && !holidayName && !isCustomHoliday;
                 const dayColor = isRed ? 'text-red-500' : isBlue ? 'text-blue-500' : 'text-gray-600';
                 
                 return (
                    <div key={`day-${i}`} onClick={() => setSelectedCalendarDate(dateStr)} className={`h-[55px] border rounded-xl p-0.5 flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform ${hasData?'border-pink-200 bg-pink-50 shadow-sm':'border-gray-100 bg-white hover:bg-gray-50'} ${isToday ? 'ring-2 ring-pink-400 ring-offset-1 z-10' : ''}`}>
                     <span className={`text-[10px] font-bold mb-0.5 ${dayColor}`}>{d}</span>
                     {dayData.inc > 0 && <span className="text-[9px] font-black text-blue-500 w-full text-center truncate tracking-tighter">+{formatCompactMoney(dayData.inc).replace('+','')}</span>}
                     {dayData.exp > 0 && <span className="text-[9px] font-black text-rose-500 w-full text-center truncate tracking-tighter">-{formatCompactMoney(dayData.exp).replace('-','')}</span>}
                   </div>
                 )
               })}
              </div>
          </div>
        );
      })()}

      {/* 💡 [V5.4] 리포트 UI 드릴다운 (접기/펴기 + 카테고리 상세 모달 연결) */}
      {ledgerSubTab === 'review' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300 mt-1">
          {reviewData.expense.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-md border border-pink-100">
              <h3 className="text-sm font-black text-gray-800 mb-4 flex justify-between"><span>💸 지출 {isExpenseExpanded ? '전체' : 'TOP 5'}</span></h3>
              <div className="space-y-3">
                 {(isExpenseExpanded ? reviewData.expense : reviewData.expense.slice(0, 5)).map(([cat, amt], idx) => (
                  <div key={cat} onClick={() => setSelectedReportCategory({type: '지출', category: cat})} className="cursor-pointer group active:scale-[0.98] transition-transform p-1.5 -mx-1.5 rounded-xl hover:bg-rose-50">
                    <div className="flex justify-between items-end mb-1">
                       <div className="flex items-center gap-1.5">
                          <span className={`w-4 h-4 rounded-full text-[10px] font-black text-white flex justify-center items-center ${idx===0?'bg-rose-500':idx===1?'bg-pink-400':idx===2?'bg-gray-400':'bg-gray-300'}`}>{idx + 1}</span>
                          <span className="text-xs font-bold text-gray-700 group-hover:text-rose-600 transition-colors">{cat}</span>
                       </div>
                       <div className="flex items-center gap-1">
                          <div className="text-xs font-black text-gray-800">{formatMoney(amt)}원</div>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-rose-400"/>
                       </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5"><div className={`h-full rounded-full ${idx===0?'bg-rose-500':idx===1?'bg-pink-400':idx===2?'bg-gray-400':'bg-gray-300'}`} style={{ width: `${(amt / ledgerSummary.expense) * 100}%` }}></div></div>
                  </div>
                ))}
              </div>
              {reviewData.expense.length > 5 && (
                 <button onClick={() => setIsExpenseExpanded(!isExpenseExpanded)} className="w-full mt-3 bg-rose-50 text-rose-500 font-bold text-[11px] py-2 rounded-xl border border-rose-100 flex items-center justify-center gap-1 active:scale-95 transition-transform">
                    {isExpenseExpanded ? '접기 ▲' : `전체 카테고리 보기 (${reviewData.expense.length}개) ▼`}
                 </button>
              )}
            </div>
          )}
   
        {reviewData.income.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-md border border-blue-100">
              <h3 className="text-sm font-black text-gray-800 mb-4 flex justify-between"><span>💰 수입 {isIncomeExpanded ? '전체' : 'TOP 5'}</span></h3>
              <div className="space-y-3">
                {(isIncomeExpanded ? reviewData.income : reviewData.income.slice(0, 5)).map(([cat, amt], idx) => (
                  <div key={cat} onClick={() => setSelectedReportCategory({type: '수입', category: cat})} className="cursor-pointer group active:scale-[0.98] transition-transform p-1.5 -mx-1.5 rounded-xl hover:bg-blue-50">
                    <div className="flex justify-between items-end mb-1">
                       <div className="flex items-center gap-1.5">
                          <span className={`w-4 h-4 rounded-full text-[10px] font-black text-white flex justify-center items-center ${idx===0?'bg-blue-600':idx===1?'bg-blue-400':idx===2?'bg-sky-400':'bg-gray-300'}`}>{idx + 1}</span>
                          <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{cat}</span>
                       </div>
                       <div className="flex items-center gap-1">
                          <div className="text-xs font-black text-blue-600">{formatMoney(amt)}원</div>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400"/>
                       </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5"><div className={`h-full rounded-full ${idx===0?'bg-blue-600':idx===1?'bg-blue-400':idx===2?'bg-sky-400':'bg-gray-300'}`} style={{ width: `${(amt / ledgerSummary.income) * 100}%` }}></div></div>
                  </div>
                ))}
              </div>
              {reviewData.income.length > 5 && (
                 <button onClick={() => setIsIncomeExpanded(!isIncomeExpanded)} className="w-full mt-3 bg-blue-50 text-blue-500 font-bold text-[11px] py-2 rounded-xl border border-blue-100 flex items-center justify-center gap-1 active:scale-95 transition-transform">
                    {isIncomeExpanded ? '접기 ▲' : `전체 카테고리 보기 (${reviewData.income.length}개) ▼`}
                 </button>
              )}
            </div>
          )}
        </div>
      )}

      {ledgerSubTab === 'memo' && (
        <div className="space-y-3 animate-in slide-in-from-right duration-300 mt-1">
           <div className="flex justify-between items-center px-1 mb-2">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><NotebookPen size={16} className="text-pink-500"/> 자유 메모</h3>
              <button onClick={() => { 
                  const d = new Date();
                  const dayStr = ['일','월','화','수','목','금','토'][d.getDay()];
                  const defaultText = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} (${dayStr})\n`;
                  setCurrentMemoId(null); setMemoText(defaultText); setIsMemoEditorOpen(true); 
              }} className="text-[10px] bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full font-bold border border-pink-200 shadow-sm">+ 새 메모</button>
           </div>
           {memos.sort((a,b) => (b.createdAt).localeCompare(a.createdAt)).map(memo => (
              <div key={memo.id} onClick={() => { setCurrentMemoId(memo.id); setMemoText(memo.text || ''); setIsMemoEditorOpen(true); }} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200/80 cursor-pointer relative hover:bg-gray-50 transition-colors">
                 <div className="text-[10px] font-bold text-pink-500 mb-2 bg-pink-50 px-2 py-1 rounded inline-block">{(memo.updatedAt || memo.createdAt).replace(/-/g, '.')}</div>
                 <div className="text-base font-bold text-gray-800 line-clamp-2 whitespace-pre-wrap">{memo.text || '내용 없음'}</div>
                 <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
              </div>
           ))}
        </div>
      )}

      {ledgerSubTab === 'daily' && (
        <div className="space-y-3 animate-in slide-in-from-left duration-300 mt-1">
          {ledgerDates.map(date => {
             const dObj = new Date(date);
             const dIndex = dObj.getDay();
             const dName = ['일','월','화','수','목','금','토'][dIndex];
             
             const holidayName = getHolidayName(date);
             const isCustomHoliday = customHolidays.includes(date);
             const dColor = (dIndex === 0 || holidayName || isCustomHoliday) ? 'text-red-500' : dIndex === 6 ? 'text-blue-500' : 'text-gray-800';
             
             return (
              <div key={date} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200/80">
                 <div className={`text-sm font-black flex items-center gap-1.5 mb-2.5 ml-1 whitespace-nowrap ${dColor}`}>
                    <CalendarCheck size={14} />{date} ({dName}) {holidayName && <span className="text-[10px] bg-red-50 px-1.5 py-0.5 rounded border border-red-100 ml-1">{holidayName}</span>}
                 </div>
 
                 <div className="space-y-2.5">
                  {(groupedLedger[date]||[]).map(t => (
                    <div key={t.id} onClick={() => setSelectedLedgerDetail(t)} className="bg-gray-50/50 border border-gray-100/50 rounded-2xl cursor-pointer shadow-sm hover:bg-pink-50 transition-colors">
                      <div className="flex justify-between items-center p-3">
                         <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <div className={`p-2.5 rounded-xl shadow-sm ${t.type === '수입' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>{getCategoryIcon(t.category, t.type)}</div>
                          <div className="truncate pr-2">
                            <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1">{t.category}</div>
                            <div className="font-bold text-sm text-gray-800 truncate flex items-center gap-1">
                               {t.note || t.category} 
                               {t.isFromSavings && <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">💳 금고출금</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                          <span className={`font-black text-base flex-shrink-0 pl-2 ${t.type === '수입' ? 'text-blue-500' : (!isActualExpense(t) && t.type === '지출') ? 'text-gray-400 line-through decoration-1' : 'text-gray-900'}`}>{formatLargeMoney(t.amount)}원</span>
                        </div>
                      </div>
                    </div>
                  ))}
                 </div>
              </div>
             );
          })}
        </div>
      )}

      {/* 가계부 플로팅 버튼 */}
      <button onClick={() => { setEditingLedgerId(null); setFormData({ date: todayStr, type: '지출', amount: '', category: getSortedCategories('지출')[0]||'식비', note: '', subNote: '', isFromSavings: false, linkedAssetId: '' }); setIsModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-pink-500 text-white w-14 h-14 rounded-[1.5rem] shadow-xl flex items-center justify-center active:scale-90 transition-all z-40 border border-pink-600"><Plus size={28}/></button>

      {/* 💡 [V5.4] 카테고리 리포트 상세 내역 팝업 모달 */}
      {selectedReportCategory && (() => {
         const isIncome = selectedReportCategory.type === '수입';
         // 선택된 카테고리의 이번 달 내역 긁어와서 최신순 정렬
         const catItems = filteredLedger.filter(t => t.type === selectedReportCategory.type && t.category === selectedReportCategory.category).sort((a,b) => b.date.localeCompare(a.date));
         const totalAmt = catItems.reduce((a,b) => a + (b.amount||0), 0);
         
         return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[75] overflow-hidden p-0">
              <div 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={(e) => handleTouchEnd(e, () => setSelectedReportCategory(null))}
                className={`bg-white w-full max-w-md rounded-t-[2.5rem] p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh] border-t-8 ${isIncome ? 'border-blue-500' : 'border-rose-500'}`}
              >
                 <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
                 <div className="flex justify-between items-start mb-4 shrink-0">
                    <div>
                      <div className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${isIncome ? 'text-blue-500' : 'text-rose-500'}`}>
                         {getCategoryIcon(selectedReportCategory.category, selectedReportCategory.type)} {calMonth}월 {selectedReportCategory.category} 상세내역
                      </div>
                      <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                         {formatLargeMoney(totalAmt)}원 <span className="text-sm font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg border border-gray-200">총 {catItems.length}건</span>
                      </h2>
                    </div>
                    <button onClick={() => setSelectedReportCategory(null)} className="bg-gray-100 text-gray-500 p-2.5 rounded-2xl active:scale-95"><X size={20}/></button>
                 </div>
                 
                 <div className="overflow-y-auto no-scrollbar space-y-2.5 flex-1 pb-4 border-t border-gray-100 pt-4">
                    {catItems.map(t => (
                      <div key={t.id} onClick={() => {
                          // 상세 창을 누르면, 기존의 selectedLedgerDetail 팝업을 상위에 띄워버림 (수정/삭제 연동)
                          setSelectedLedgerDetail(t);
                      }} className="bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer shadow-sm p-3 flex justify-between items-center hover:bg-gray-100 transition-colors active:scale-95">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className={`p-2.5 rounded-xl shadow-sm shrink-0 ${t.type === '수입' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                              {getCategoryIcon(t.category, t.type)}
                           </div>
                           <div className="truncate">
                             <div className="text-[10px] font-bold text-gray-500">{t.date.replace(/-/g, '.')}</div>
                             <div className="font-bold text-sm text-gray-800 truncate flex items-center gap-1">
                               {t.note || t.category}
                               {t.isFromSavings && <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">💳 금고출금</span>}
                             </div>
                           </div>
                        </div>
                        <span className={`font-black text-base shrink-0 ml-2 ${t.type === '수입' ? 'text-blue-500' : (!isActualExpense(t) && t.type === '지출') ? 'text-gray-400 line-through decoration-1' : 'text-gray-900'}`}>{formatLargeMoney(t.amount)}원</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
         );
      })()}

      {/* 달력 날짜 클릭 시 나타나는 리스트 뷰 모달 */}
      {selectedCalendarDate && (() => {
        const dayEvents = (ledger || []).filter(t => t.date === selectedCalendarDate);
        return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70] overflow-hidden p-0">
            <div 
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) => handleTouchEnd(e, () => setSelectedCalendarDate(null))}
              className="bg-white w-full max-w-md rounded-t-[2.5rem] p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[80vh] border-t-8 border-pink-500"
            >
               <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
               <div className="flex justify-between items-center mb-6 shrink-0">
                  <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                     <CalendarCheck className="text-pink-500" size={24}/> {selectedCalendarDate.replace(/-/g, '. ')}
                  </h2>
                  <button onClick={() => setSelectedCalendarDate(null)} className="bg-gray-100 text-gray-500 p-2.5 rounded-2xl active:scale-95"><X size={20}/></button>
               </div>
               
               <div className="overflow-y-auto no-scrollbar space-y-3 flex-1 pb-4">
                  {dayEvents.length > 0 ? (
                      dayEvents.map(t => (
                        <div key={t.id} onClick={() => setSelectedLedgerDetail(t)} className="bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer shadow-sm p-3 flex justify-between items-center hover:bg-pink-50 transition-colors active:scale-95">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <div className={`p-2.5 rounded-xl shadow-sm shrink-0 ${t.type === '수입' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>{getCategoryIcon(t.category, t.type)}</div>
                             <div className="truncate">
                               <div className="text-[10px] font-bold text-gray-500">{t.category}</div>
                               <div className="font-bold text-sm text-gray-800 truncate flex items-center gap-1">
                                  {t.note || t.category} 
                                  {t.isFromSavings && <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">💳 금고출금</span>}
                               </div>
                             </div>
                          </div>
                          <span className={`font-black text-base shrink-0 ml-2 ${t.type === '수입' ? 'text-blue-500' : (!isActualExpense(t) && t.type === '지출') ? 'text-gray-400 line-through decoration-1' : 'text-gray-900'}`}>{formatLargeMoney(t.amount)}원</span>
                        </div>
                      ))
                  ) : (
                      <div className="text-center py-12 text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">이 날짜에는 등록된 내역이 없어요! 🍃</div>
                  )}
               </div>
            </div>
         </div>
        );
      })()}

      {selectedLedgerDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
            <div 
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) => handleTouchEnd(e, () => setSelectedLedgerDetail(null))}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden border border-gray-100"
            >
               <div className={`absolute top-0 left-0 right-0 h-2 ${selectedLedgerDetail.type === '수입' ? 'bg-blue-400' : 'bg-pink-400'}`}></div>
               <div className="flex justify-between items-start mb-6 mt-2">
                  <div className={`p-3 rounded-2xl shadow-sm ${selectedLedgerDetail.type === '수입' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                     {getCategoryIcon(selectedLedgerDetail.category, selectedLedgerDetail.type)}
                  </div>
                  <button onClick={() => setSelectedLedgerDetail(null)} className="text-gray-400 p-2 bg-gray-50 rounded-full active:scale-95 border border-gray-200"><X size={20}/></button>
               </div>
            
               <div className="mb-6">
                  <div className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1.5"><CalendarIcon size={12}/> {selectedLedgerDetail.date}</div>
                  <div className="text-2xl font-black text-gray-900 mb-2 leading-tight flex items-center gap-2">
                     {selectedLedgerDetail.note || selectedLedgerDetail.category} 
                     {selectedLedgerDetail.isFromSavings && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100 flex items-center gap-1"><Coins size={10}/> 금고출금</span>}
                  </div>
                  <div className="text-[11px] font-bold text-gray-500 mb-5 px-2.5 py-1 bg-gray-100 inline-block rounded-lg shadow-inner">{selectedLedgerDetail.category}</div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">{selectedLedgerDetail.type} 금액</div>
                    <div className={`text-4xl font-black tracking-tighter ${selectedLedgerDetail.type === '수입' ? 'text-blue-500' : 'text-rose-500'}`}>
                       {selectedLedgerDetail.type === '수입' ? '+' : '-'}{formatLargeMoney(selectedLedgerDetail.amount)}<span className="text-lg text-gray-800 font-bold ml-1">원</span>
                    </div>
                  </div>
               </div>
               {selectedLedgerDetail.subNote && (
                  <div className="mb-6 border-t border-dashed border-gray-200 pt-4">
                    <span className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest flex items-center gap-1"><FileText size={12}/> 세부 메모</span>
                     <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {selectedLedgerDetail.subNote}
                     </div>
                  </div>
               )}
               <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                  <button onClick={() => handleCopyClick(selectedLedgerDetail)} className="py-3 bg-gray-50 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 text-gray-600 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Copy size={16}/> 내역 복사</button>
                  <button onClick={() => handleEditClick(selectedLedgerDetail)} className="py-3 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-gray-600 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Edit3 size={16}/> 내용 수정</button>
                  <button onClick={() => handleDeleteClick(selectedLedgerDetail.id)} className="py-3 bg-gray-50 border border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-gray-600 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Trash2 size={16}/> 내역 삭제</button>
               </div>
            </div>
         </div>
      )}

      {/* 가계부 입력/수정 메인 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[90] p-0">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, () => setIsModalOpen(false))}
            className="bg-white w-full max-w-md rounded-t-[2.5rem] p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 mt-10 flex flex-col border-t-8 border-pink-500"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 shrink-0"></div>
            
            <div className="flex justify-between items-center mb-3 shrink-0">
               <h2 className="text-xl font-black text-gray-800">✨ {editingLedgerId ? '내역 수정' : '내역 기록'}</h2>
               <button onClick={() => setIsModalOpen(false)} className="bg-gray-50 text-gray-500 p-2 rounded-2xl border border-gray-100 hover:bg-pink-50 hover:text-pink-500"><X size={20}/></button>
            </div>

            <form className="space-y-3 flex-1 pb-2">
              {!editingLedgerId && frequentItems.length > 0 && (
                <div className="mb-1">
                  <div className="text-[10px] font-black text-gray-400 ml-1 mb-1.5 flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400"/> 자주 쓰는 {formData.type} 불러오기</div>
                  <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
                    {frequentItems.map(([cat, note], idx) => (
                       <button key={idx} type="button" onClick={() => {
                          setFormData({...formData, category: cat, note: note, isFromSavings: false});
                          setIsSuggestionOpen(false); 
                      }} className="flex-none bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 active:scale-95 whitespace-nowrap shadow-sm hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200">
                         <span className={`${formData.type === '수입' ? 'text-blue-500' : 'text-pink-500'} mr-1`}>[{cat}]</span>{note}
                       </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-200/60 shadow-inner">
                 <button type="button" onClick={() => setFormData({...formData, type:'지출', category: getSortedCategories('지출')[0], isFromSavings: false})} className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${formData.type==='지출'?'bg-white text-pink-500 shadow-sm border border-pink-100':'text-gray-500'}`}>지출하기</button>
                 <button type="button" onClick={() => setFormData({...formData, type:'수입', category: getSortedCategories('수입')[0], isFromSavings: false})} className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${formData.type==='수입'?'bg-white text-blue-500 shadow-sm border border-blue-100':'text-gray-500'}`}>수입얻기</button>
              </div>

              <div className="relative z-50" ref={suggestionRef}>
                 <label className="text-[10px] font-black text-gray-400 ml-1 mb-1 block">상세 내용 (어디서 쓰셨나요?)</label>
                 <input type="text" value={formData.note} 
                    onChange={e => {
                       setFormData({...formData, note: e.target.value});
                       setIsSuggestionOpen(true);
                    }}
                    onFocus={() => setIsSuggestionOpen(true)}
                    placeholder="내역을 적어주세요" className="w-full bg-gray-50 rounded-xl px-4 h-[56px] font-black text-lg outline-none border focus:border-pink-300 transition-colors shadow-inner" />
                 
                 {isSuggestionOpen && formData.note && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 animate-in slide-in-from-top-1 max-h-[160px] overflow-y-auto">
                       <button type="button" onClick={() => setIsSuggestionOpen(false)} className="w-full text-left px-3 py-2.5 text-sm font-black text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border-b border-gray-100 mb-1">
                          ✨ '{formData.note}' 그대로 사용
                       </button>
                       {suggestedNotes.map(sn => (
                          <button key={`${sn.type}-${sn.category}-${sn.note}`} type="button" onClick={() => {
                                setFormData({...formData, note: sn.note, category: sn.category, type: sn.type, isFromSavings: false});
                                setIsSuggestionOpen(false);
                          }} className="w-full text-left px-3 py-2 text-sm font-bold text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors flex items-center">
                             <span className={`${formData.type === '수입' ? 'text-blue-400 border-blue-200' : 'text-pink-400 border-pink-200'} mr-2 text-[10px] border bg-white px-1.5 py-0.5 rounded shadow-sm`}>[{sn.category}]</span> 
                             {sn.note}
                          </button>
                       ))}
                    </div>
                 )}
              </div>

              <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-sm relative z-40">
                 <div className="relative">
                    <input type="text" inputMode="numeric" pattern="[0-9,]*" value={formData.amount ? formatLargeMoney(formData.amount) : ''} onChange={e => setFormData({...formData, amount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="금액 입력" className={`w-full text-3xl font-black border-b-2 ${formData.type === '수입' ? 'focus:border-blue-400' : 'focus:border-pink-400'} border-gray-100 pb-1 outline-none bg-transparent transition-colors pr-8`} />
                    <span className="absolute right-1 bottom-2 text-xl font-black text-gray-300">원</span>
                 </div>
                 
                 {amountPlaceholder && (
                    <div className="text-[10px] font-bold text-pink-500 bg-pink-50 px-3 py-2 mt-2 rounded-lg border border-pink-100 animate-in fade-in flex items-center gap-1.5">
                       <Star size={12} className="fill-pink-400 text-pink-400 shrink-0"/> {amountPlaceholder}
                    </div>
                 )}
              </div>

              <div className="flex gap-3 w-full relative z-30">
                <div className="flex-[1.2] shrink-0 bg-gray-50 rounded-xl p-2 border border-gray-200">
                   <label className="text-[9px] font-black text-gray-400 ml-1 mb-0.5 flex items-center gap-1"><CalendarIcon size={10} className="text-pink-500"/> 날짜</label>
                   <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} className="w-full bg-transparent px-1 h-[28px] font-bold text-xs outline-none transition-colors" />
                </div>
                <div className="flex-1 shrink-0 bg-gray-50 rounded-xl p-2 border border-gray-200">
                   <label className="text-[9px] font-black text-gray-400 ml-1 mb-0.5 flex items-center gap-1"><Grid size={10} className="text-pink-500"/> 카테고리</label>
                   <select value={isCustomCategory ? '직접입력' : formData.category} onChange={e=>{ if (e.target.value === '직접입력') { setIsCustomCategory(true); setCustomCategoryInput(''); } else { setIsCustomCategory(false); setFormData({...formData, category:e.target.value, isFromSavings: false, linkedAssetId: ''}); } }} className="w-full bg-transparent px-1 h-[28px] font-bold text-xs outline-none transition-colors">
                      {getSortedCategories(formData.type).map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="직접입력">+ 직접입력 (신규)</option>
                   </select>
                </div>
              </div>

              {!editingLedgerId && formData.type === '지출' && formData.category === '저축' && depositAssets.length > 0 && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 animate-in slide-in-from-top-2">
                   <div className="text-xs font-black text-indigo-700 mb-2 flex items-center gap-1.5"><PiggyBank size={14}/> 어느 금고로 모을까요?</div>
                   <div className="grid grid-cols-2 gap-2">
                     {depositAssets.map(a => (
                        <button key={a.id} type="button" onClick={() => setFormData({...formData, linkedAssetId: a.id})} className={`p-2.5 rounded-lg text-left border transition-all ${formData.linkedAssetId === a.id ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200'}`}>
                           <div className="font-black text-xs truncate">{a.name}</div>
                        </button>
                     ))}
                  </div>
                </div>
              )}

              {!editingLedgerId && formData.type === '지출' && formData.category !== '저축' && depositAssets.length > 0 && (
                 <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 animate-in slide-in-from-top-2">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                       <input type="checkbox" checked={formData.isFromSavings} onChange={e => setFormData({...formData, isFromSavings: e.target.checked, linkedAssetId: e.target.checked ? (depositAssets[0]?.id || '') : ''})} className="w-4 h-4 text-indigo-500 rounded border-gray-300" />
                       <div className="text-xs font-black text-gray-800 flex items-center gap-1"><Building2 size={14} className="text-indigo-500"/> 금고/비상금에서 출금 (지출 반영)</div>
                    </label>
                    {formData.isFromSavings && (
                      <div className="grid grid-cols-2 gap-2">
                          {depositAssets.map(a => (
                             <button key={a.id} type="button" onClick={() => setFormData({...formData, linkedAssetId: a.id})} className={`p-2.5 rounded-lg text-left border transition-all ${formData.linkedAssetId === a.id ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200'}`}>
                                <div className="font-black text-xs truncate">{a.name}</div>
                             </button>
                          ))}
                      </div>
                    )}
                 </div>
              )}

              <div className="relative z-20">
                 <input value={formData.subNote} onChange={e=>setFormData({...formData, subNote:e.target.value})} placeholder="세부 메모를 짧게 적어주세요 (선택)" className="w-full bg-gray-50 rounded-xl px-3 h-[40px] font-bold text-xs outline-none border focus:border-pink-300 transition-colors" />
              </div>

              <div className="flex gap-2 pt-1 relative z-10 w-full overflow-hidden">
                 <button type="button" onClick={(e) => handleTransactionSubmit(e, true)} disabled={!formData.amount || !formData.note || (formData.category === '저축' && !formData.linkedAssetId && !editingLedgerId) || (formData.isFromSavings && !formData.linkedAssetId)} className={`flex-1 min-w-0 px-1 whitespace-nowrap bg-white border-2 py-3 rounded-[1.2rem] font-black text-xs active:scale-95 shadow-sm transition-colors ${formData.type === '수입' ? 'border-blue-500 text-blue-500' : 'border-pink-500 text-pink-500'} disabled:opacity-50`}>
                    기록하고 계속
                 </button>
                 <button type="button" onClick={(e) => handleTransactionSubmit(e, false)} disabled={!formData.amount || !formData.note || (formData.category === '저축' && !formData.linkedAssetId && !editingLedgerId) || (formData.isFromSavings && !formData.linkedAssetId)} className={`flex-1 min-w-0 px-1 whitespace-nowrap py-3 rounded-[1.2rem] text-white font-black text-xs active:scale-95 shadow-md transition-colors ${formData.type === '수입' ? 'bg-blue-600 border border-blue-700' : 'bg-pink-500 border border-pink-600'} disabled:opacity-50`}>
                    닫기 및 완료
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMemoEditorOpen && (
        <div className="fixed inset-0 bg-white z-[80] flex flex-col h-[100dvh] animate-in slide-in-from-bottom duration-300">
           <div className="flex justify-between items-center p-4 pt-12 border-b bg-white shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                 <button onClick={() => {setIsMemoEditorOpen(false); setIsCalcOpen(false);}} className="text-gray-500 p-2 bg-gray-50 rounded-full"><ChevronLeftCircle size={24}/></button>
                 <button onClick={() => setIsCalcOpen(!isCalcOpen)} className={`p-2.5 rounded-full shadow-sm transition-colors ${isCalcOpen ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}><Calculator size={22}/></button>
              </div>

              <div className="flex items-center gap-3">
                 {currentMemoId && <button onClick={deleteMemo} className="text-red-500 p-2 rounded-full hover:bg-red-50"><Trash2 size={20}/></button>}
                 <button onClick={saveMemo} className="bg-pink-500 text-white px-5 py-2.5 rounded-full font-black text-sm shadow-md">저장</button>
              </div>
           </div>

           <div className="flex-1 p-5 relative overflow-y-auto no-scrollbar flex flex-col bg-amber-50/20">
              <textarea 
                 value={memoText} 
                 onChange={(e) => setMemoText(e.target.value)} 
                 className="w-full flex-1 bg-transparent resize-none outline-none text-lg font-bold text-gray-800 whitespace-pre-wrap no-scrollbar min-h-[50vh]" 
                 placeholder="내용과 금액을 자유롭게 입력하세요..." 
                 autoFocus 
              />
           </div>
              
           {isCalcOpen && (
              <div className="absolute top-[88px] left-4 right-4 bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 p-4 z-[90] animate-in slide-in-from-top-2">
                 {calcConfirm.show ? (
                     <div className="bg-gray-800/90 rounded-2xl p-5 mb-4 text-center text-white border border-gray-600 shadow-xl animate-in zoom-in-95">
                        <div className="text-sm font-bold text-blue-300 mb-2">총 {calcConfirm.count}건, {formatLargeMoney(calcConfirm.total)}원을 더한 결과입니다.</div>
                        <div className="text-base font-black mb-5">자동입력 하시겠습니까?</div>
                        <div className="flex gap-2">
                           <button onClick={() => { 
                               setMemoText(prev => prev + `\n\nAI 계산합계 : ${formatLargeMoney(calcConfirm.total)}원`); 
                               setCalcConfirm({show:false, count:0, total:0}); 
                               setIsCalcOpen(false); 
                           }} className="flex-1 bg-blue-500 py-3 rounded-xl font-black text-sm active:scale-95 transition-transform shadow-md">✅ 예</button>
                           <button onClick={() => setCalcConfirm({show:false, count:0, total:0})} className="flex-1 bg-gray-600 py-3 rounded-xl font-black text-sm active:scale-95 transition-transform shadow-sm">❌ 아니오</button>
                        </div>
                     </div>
                 ) : (
                     <>
                         <button onClick={() => setIsCalcOpen(false)} className="w-full bg-gray-700/80 text-white py-2 rounded-xl font-bold text-xs mb-3 active:scale-95 shadow-sm border border-gray-600">
                            🔽 계산기 내리기
                         </button>
                         <button onClick={handleAutoCalc} className="w-full bg-pink-500 text-white py-3 rounded-2xl font-black text-sm mb-3 active:scale-95 shadow-sm flex items-center justify-center gap-2 transition-transform">
                            AI 자동합계 계산 🤖
                         </button>
                         
                         <div className="bg-gray-800 rounded-2xl p-4 mb-4 text-right overflow-hidden flex items-center justify-end h-20"><div className="font-black text-white text-3xl">{formatEquation(calcInput || '0')}</div></div>
                         <div className="grid grid-cols-4 gap-2.5 mb-4">
                            {['AC','+/-','%','÷', '7','8','9','×', '4','5','6','-', '1','2','3','+', '⌫','0','.','='].map(btn => (
                               <button key={btn} onClick={() => handleCalcBtn(btn)} className={`h-14 rounded-full font-black text-xl active:scale-90 transition-transform ${['÷','×','-','+','='].includes(btn) ? 'bg-orange-500 text-white' : ['AC','+/-','%','⌫'].includes(btn) ? 'bg-gray-400 text-gray-900' : 'bg-gray-700 text-white'}`}>{btn}</button>
                            ))}
                         </div>
                         <button onClick={() => { if(calcInput && calcInput !== 'Error') { setMemoText(prev => prev + `\n\nAI 계산합계 : ${formatLargeMoney(calcInput)}원`); setIsCalcOpen(false); } }} className="w-full bg-blue-500 text-white py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-transform">금액 메모에 넣기 ✍️</button>
                     </>
                 )}
              </div>
           )}
        </div>
      )}
    </div>
  );
}

                                                                                  
// ==========================================
// 6. DELIVERY TAB COMPONENT
// ==========================================
function DeliveryView({ dailyDeliveries, setDailyDeliveries, selectedYear, selectedMonth, currentMonthKey, todayStr, userSettings, timerActive, trackingStartTime, elapsedSeconds, handleStartDelivery, handleEndDelivery, user, isManageMode, currentUser, customHolidays }) {
  const [deliverySubTab, setDeliverySubTab] = useState('daily');
  const [deliveryDateRange, setDeliveryDateRange] = useState({ start: '', end: '' });
  const [showDeliveryFilters, setShowDeliveryFilters] = useState(false);
  
  const [isDeliverySummaryOpen, setIsDeliverySummaryOpen] = useState(false);
  const [isPendingSummaryOpen, setIsPendingSummaryOpen] = useState(true);
  const [isYearlySummaryOpen, setIsYearlySummaryOpen] = useState(false);
  
  const [isLiveCalcOpen, setIsLiveCalcOpen] = useState(false);
  const [liveData, setLiveData] = useState({
    amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', 
    amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '' 
  });

  const [calYear, setCalYear] = useState(selectedYear);
  const [calMonth, setCalMonth] = useState(selectedMonth);

  const [splitQueue, setSplitQueue] = useState([]);
  const [recoveryShift, setRecoveryShift] = useState(() => {
    const saved = localStorage.getItem('hyunaRecoveryShift');
    return saved ? JSON.parse(saved) : null;
  });

  const [expandedDailyDates, setExpandedDailyDates] = useState({});
  const toggleDailyDate = (date, e) => {
    e.stopPropagation(); 
    setExpandedDailyDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  useEffect(() => {
    setCalYear(selectedYear);
    setCalMonth(selectedMonth);
  }, [selectedYear, selectedMonth]);
  
  const [selectedShiftDetail, setSelectedShiftDetail] = useState(null);
  const [selectedWeeklySummary, setSelectedWeeklySummary] = useState(null);
  const [selectedDailySummary, setSelectedDailySummary] = useState(null);

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingDeliveryShift, setEditingDeliveryShift] = useState(null);
  
  const emptyForm = { date: todayStr, startTime: '', endTime: '', amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '' };
  const [deliveryFormData, setDeliveryFormData] = useState(emptyForm);

  const getTodaySaved = (earner, platform, targetDate) => {
    let amt = 0, cnt = 0;
    (dailyDeliveries || []).forEach(d => {
       if (d.date === targetDate && d.earner === earner && d.platform === platform) {
           amt += (d.amount || 0); cnt += (d.count || 0);
       }
    });
    return { amt, cnt };
  };

  const liveMetrics = useMemo(() => {
    const inputAmt = (parseInt(liveData.amountHyunaBaemin.replace(/,/g, ''))||0) + (parseInt(liveData.amountHyunaCoupang.replace(/,/g, ''))||0) + (parseInt(liveData.amountJunghoonBaemin.replace(/,/g, ''))||0) + (parseInt(liveData.amountJunghoonCoupang.replace(/,/g, ''))||0);
    const inputCnt = (parseInt(liveData.countHyunaBaemin)||0) + (parseInt(liveData.countHyunaCoupang)||0) + (parseInt(liveData.countJunghoonBaemin)||0) + (parseInt(liveData.countJunghoonCoupang)||0);

    let savedAmt = 0, savedCnt = 0;
    if (timerActive && trackingStartTime) {
        const dObj = new Date(trackingStartTime);
        const utc = dObj.getTime() + (dObj.getTimezoneOffset() * 60000);
        const kstTime = new Date(utc + (9 * 3600000));
        const dateStr = `${kstTime.getFullYear()}-${String(kstTime.getMonth() + 1).padStart(2, '0')}-${String(kstTime.getDate()).padStart(2, '0')}`;

        const savedHB = getTodaySaved('현아', '배민', dateStr);
        const savedHC = getTodaySaved('현아', '쿠팡', dateStr);
        const savedJB = getTodaySaved('정훈', '배민', dateStr);
        const savedJC = getTodaySaved('정훈', '쿠팡', dateStr);

        if (liveData.amountHyunaBaemin) { savedAmt += savedHB.amt; savedCnt += savedHB.cnt; }
        if (liveData.amountHyunaCoupang) { savedAmt += savedHC.amt; savedCnt += savedHC.cnt; }
        if (liveData.amountJunghoonBaemin) { savedAmt += savedJB.amt; savedCnt += savedJB.cnt; }
        if (liveData.amountJunghoonCoupang) { savedAmt += savedJC.amt; savedCnt += savedJC.cnt; }
    }

    const currentShiftAmt = Math.max(0, inputAmt - savedAmt);
    const currentShiftCnt = Math.max(0, inputCnt - savedCnt);

    const activeMinutes = Math.floor(elapsedSeconds / 60); const hours = activeMinutes / 60;
    return { 
       totalAmt: currentShiftAmt, 
       totalCnt: currentShiftCnt, 
       avg: currentShiftCnt > 0 ? Math.round(currentShiftAmt / currentShiftCnt) : 0, 
       hourly: hours > 0 ? Math.round(currentShiftAmt / hours) : 0,
       deductedAmt: savedAmt
    };
  }, [liveData, elapsedSeconds, timerActive, trackingStartTime, dailyDeliveries]);

  const filteredDailyDeliveries = useMemo(() => {
    let data = dailyDeliveries || [];
    if (deliveryDateRange.start || deliveryDateRange.end) {
      if (deliveryDateRange.start) data = data.filter(d => typeof d?.date === 'string' && d.date >= deliveryDateRange.start);
      if (deliveryDateRange.end) data = data.filter(d => typeof d?.date === 'string' && d.date <= deliveryDateRange.end);
    } else data = data.filter(d => typeof d?.date === 'string' && d.date.startsWith(`${calYear}-${String(calMonth).padStart(2, '0')}`));
    return data;
  }, [dailyDeliveries, calYear, calMonth, deliveryDateRange]);

  const deliveryFilteredTotal = filteredDailyDeliveries.reduce((a,b) => a + (b.amount||0), 0);
  const deliveryFilteredCount = filteredDailyDeliveries.reduce((a,b) => a + (b.count||0), 0);
  const deliveryAvgPerDelivery = deliveryFilteredCount > 0 ? Math.round(deliveryFilteredTotal / deliveryFilteredCount) : 0;
  const filteredHyunaItems = filteredDailyDeliveries.filter(d => d.earner === '현아');
  const filteredJunghoonItems = filteredDailyDeliveries.filter(d => d.earner === '정훈');

  const dailyShifts = useMemo(() => {
    const shiftsByDate = {};
    filteredDailyDeliveries.forEach(d => {
        if(!d.date) return;
        if(!shiftsByDate[d.date]) shiftsByDate[d.date] = {};
        const shiftKey = (d.startTime && d.endTime) ? `${d.startTime}-${d.endTime}` : `no-time-${d.id}`;
        if(!shiftsByDate[d.date][shiftKey]) { shiftsByDate[d.date][shiftKey] = { id: shiftKey, date: d.date, startTime: d.startTime, endTime: d.endTime, items: [], totalAmt: 0, totalCnt: 0 }; }
        shiftsByDate[d.date][shiftKey].items.push(d);
        shiftsByDate[d.date][shiftKey].totalAmt += (d.amount || 0);
        shiftsByDate[d.date][shiftKey].totalCnt += (d.count || 0);
    });
    const result = {};
    Object.keys(shiftsByDate).sort((a,b)=>new Date(b)-new Date(a)).forEach(date => {
        result[date] = Object.values(shiftsByDate[date]).sort((a,b) => (b.startTime||'').localeCompare(a.startTime||''));
    });
    return result;
  }, [filteredDailyDeliveries]);

  const dailyDates = Object.keys(dailyShifts);
  const clearedPaydays = userSettings.clearedPaydays || [];

  const pendingByPayday = useMemo(() => {
    const groups = {};
    (dailyDeliveries || []).forEach(d => {
      const pd = getPaydayStr(d.date);
      if (!pd || pd < '2026-05-01' || clearedPaydays.includes(pd)) return; 
      if (!groups[pd]) groups[pd] = { total: 0, hyuna: 0, junghoon: 0, items: [] };
      groups[pd].total += (d.amount || 0);
      if (d.earner === '현아') groups[pd].hyuna += (d.amount || 0);
      if (d.earner === '정훈') groups[pd].junghoon += (d.amount || 0);
      groups[pd].items.push(d);
    });
    return groups;
  }, [dailyDeliveries, clearedPaydays]);

  const upcomingPaydays = Object.keys(pendingByPayday).sort();
  const paydayGroups = useMemo(() => {
    const groups = {};
    (dailyDeliveries || []).forEach(d => {
      const pd = getPaydayStr(d.date);
      if (!pd) return; 
      if (!groups[pd]) groups[pd] = { total: 0, hyuna: 0, junghoon: 0, items: [] };
      groups[pd].total += (d.amount||0);
      if (d.earner === '현아') groups[pd].hyuna += (d.amount||0);
      if (d.earner === '정훈') groups[pd].junghoon += (d.amount||0);
      groups[pd].items.push(d);
    });
    return groups;
  }, [dailyDeliveries]);

  const pastPaydays = Object.keys(paydayGroups).filter(pd => clearedPaydays.includes(pd) || pd < '2026-05-01').sort((a,b) => b.localeCompare(a));

  const getGroupMetrics = (items) => {
    let totalMins = 0; const byDate = {};
    items.forEach(d => { if(!d.date) return; if(!byDate[d.date]) byDate[d.date] = []; byDate[d.date].push(d); });
    Object.values(byDate).forEach(dayItems => {
      let intervals = [];
      dayItems.forEach(d => {
        if(d.startTime && d.endTime && typeof d.startTime === 'string' && typeof d.endTime === 'string') {
          let [sh, sm] = d.startTime.split(':').map(Number); let [eh, em] = d.endTime.split(':').map(Number);
          let start = sh * 60 + sm; let end = eh * 60 + em;
          if (end <= start) end += 1440; 
          intervals.push({start, end});
        }
      });
      intervals.sort((a,b) => a.start - b.start); let merged = [];
      if (intervals.length > 0) {
        let current = {...intervals[0]};
        for(let i=1; i<intervals.length; i++) {
          if (intervals[i].start <= current.end) current.end = Math.max(current.end, intervals[i].end);
          else { merged.push(current); current = {...intervals[i]}; }
        }
        merged.push(current);
      }
      totalMins += merged.reduce((acc, curr) => acc + (curr.end - curr.start), 0);
    });
    const totalAmt = items.reduce((acc, curr) => acc + (curr.amount || 0), 0); const totalCnt = items.reduce((acc, curr) => acc + (curr.count || 0), 0);
    let hours = Math.floor(totalMins / 60); let mins = totalMins % 60;
    return { durationStr: totalMins > 0 ? `${hours > 0 ? hours+'시간 ' : ''}${mins > 0 ? mins+'분' : ''}`.trim() : '-', totalCnt, totalAmt, perDelivery: totalCnt > 0 ? Math.round(totalAmt / totalCnt) : 0, hourlyRate: totalMins > 0 ? Math.round(totalAmt / (totalMins / 60)) : 0 };
  };

  const monthlyMetrics = useMemo(() => getGroupMetrics(filteredDailyDeliveries), [filteredDailyDeliveries]);
  const yearlyItems = useMemo(() => (dailyDeliveries || []).filter(d => typeof d?.date === 'string' && d.date.startsWith(String(selectedYear))), [dailyDeliveries, selectedYear]);
  const yearlyMetrics = useMemo(() => getGroupMetrics(yearlyItems), [yearlyItems]);
  const yearlyHyunaItems = useMemo(() => yearlyItems.filter(d => d.earner === '현아'), [yearlyItems]);
  const yearlyJunghoonItems = useMemo(() => yearlyItems.filter(d => d.earner === '정훈'), [yearlyItems]);
  const yearlyHyunaAmt = yearlyHyunaItems.reduce((a,b)=>a+(b.amount||0), 0);
  const yearlyJunghoonAmt = yearlyJunghoonItems.reduce((a,b)=>a+(b.amount||0), 0);

  const handleClearPayday = async (pd) => { if (!user) return; const newCleared = [...clearedPaydays, pd]; if (isFirebaseEnabled) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'preferences'), { ...userSettings, clearedPaydays: newCleared }); } setSelectedWeeklySummary(null); };
  const handleUndoClearPayday = async (pd) => { if (!user || !window.confirm('이 정산 내역을 다시 대기열로 되돌리시겠습니까?')) return; const newCleared = clearedPaydays.filter(p => p !== pd); if (isFirebaseEnabled) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'preferences'), { ...userSettings, clearedPaydays: newCleared }); } setSelectedWeeklySummary(null); };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault(); if (!user) return;
    const timestamp = new Date().toISOString(); const adds = [];

    const createAdd = (inputAmtStr, inputCntStr, earner, platform) => {
      const inputAmt = parseInt(String(inputAmtStr||0).replace(/,/g, ''), 10) || 0;
      const inputCnt = parseInt(String(inputCntStr||0).replace(/,/g, ''), 10) || 0;
      if(inputAmt === 0 && inputCnt === 0) return;
      
      let finalAmt = inputAmt, finalCnt = inputCnt;
      
      if (!editingDeliveryShift) {
         const saved = getTodaySaved(earner, platform, deliveryFormData.date);
         finalAmt = Math.max(0, inputAmt - saved.amt);
         finalCnt = Math.max(0, inputCnt - saved.cnt);
      }
      
      if(finalAmt > 0 || finalCnt > 0) {
         adds.push({ date: deliveryFormData.date, earner, platform, amount: finalAmt, count: finalCnt, startTime: deliveryFormData.startTime, endTime: deliveryFormData.endTime, updatedAt: timestamp, updatedBy: currentUser });
      }
    };

    createAdd(deliveryFormData.amountJunghoonBaemin, deliveryFormData.countJunghoonBaemin, '정훈', '배민');
    createAdd(deliveryFormData.amountJunghoonCoupang, deliveryFormData.countJunghoonCoupang, '정훈', '쿠팡');
    createAdd(deliveryFormData.amountHyunaBaemin, deliveryFormData.countHyunaBaemin, '현아', '배민');
    createAdd(deliveryFormData.amountHyunaCoupang, deliveryFormData.countHyunaCoupang, '현아', '쿠팡');

    if (adds.length > 0) {
      if (editingDeliveryShift) {
        if (isFirebaseEnabled) {
          for(const item of editingDeliveryShift.items) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery', item.id)); }
          for(const newDel of adds) { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'delivery'), newDel); }
        }
      } else {
        if (isFirebaseEnabled) { for(const newDel of adds) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'delivery'), newDel); }
      }
    }
    
    if (splitQueue.length > 0) {
       const nextShift = splitQueue[0];
       setDeliveryFormData({
           ...emptyForm,
           date: nextShift.date,
           startTime: nextShift.startTime,
           endTime: nextShift.endTime
       });
       setSplitQueue(splitQueue.slice(1));
    } else {
       localStorage.removeItem('hyunaRecoveryShift');
       setRecoveryShift(null);
       setIsDeliveryModalOpen(false); 
       setEditingDeliveryShift(null);
       setLiveData({amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: ''}); 
       setIsLiveCalcOpen(false);
    }
  };

  const openEditShiftForm = (shift) => {
    const form = { ...emptyForm, date: shift.date, startTime: shift.startTime || '', endTime: shift.endTime || '' };
    shift.items.forEach(d => {
       const earnerEng = d.earner === '정훈' ? 'Junghoon' : 'Hyuna';
       const platformEng = d.platform === '배민' ? 'Baemin' : 'Coupang';
       form[`amount${earnerEng}${platformEng}`] = String(d.amount || '');
       form[`count${earnerEng}${platformEng}`] = String(d.count || '');
    });
    setDeliveryFormData(form); setEditingDeliveryShift(shift); setSelectedShiftDetail(null); setIsDeliveryModalOpen(true); 
  };

  const deleteShift = async (shift) => {
    if(!window.confirm('이 시간대의 기록을 통째로 모두 삭제하시겠습니까?')) return;
    if (isFirebaseEnabled && user) { for(const item of shift.items) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery', item.id)); } }
    setSelectedShiftDetail(null);
  };

  const handleCloseDeliveryModal = () => {
     if (window.confirm("창을 닫으시면 마감 기록이 날아갑니다. 정말 닫으시겠습니까?\n(타이머를 오래 켰던 경우 메인 화면에 임시 보관됩니다)")) {
         setIsDeliveryModalOpen(false);
         if (!editingDeliveryShift && deliveryFormData.startTime) {
             const recoveryData = { formData: deliveryFormData, splitQueue: splitQueue };
             localStorage.setItem('hyunaRecoveryShift', JSON.stringify(recoveryData));
             setRecoveryShift(recoveryData);
         }
     }
  };

  const NetDiffInfo = ({ earner, platform, inputAmt, inputCnt, date }) => {
     if (editingDeliveryShift) return null;
     const saved = getTodaySaved(earner, platform, date);
     if (saved.amt === 0 && saved.cnt === 0) return null;
     
     const netAmt = Math.max(0, (parseInt(String(inputAmt).replace(/,/g,''))||0) - saved.amt);
     return (
         <div className="text-[11px] text-blue-300 ml-[55px] font-bold flex items-center gap-1 mt-1 pb-1 tracking-tight">
             <span className="opacity-80">↳ 누적 {formatLargeMoney(saved.amt)} ➔</span> <span className="text-rose-400 font-bold">실적: +{formatLargeMoney(netAmt)}</span>
         </div>
     )
  };

  return (
    <div className="flex flex-col gap-2 pb-8 pt-1 animate-in fade-in duration-500 text-slate-800 bg-white min-h-screen">
      
      {recoveryShift && !timerActive && (
         <div className="bg-red-50 border border-red-200 rounded-2xl p-3 shadow-sm flex flex-col gap-2 animate-in slide-in-from-top-2 mx-1">
            <div className="flex items-center gap-2">
               <AlertCircle size={16} className="text-red-600" />
               <span className="text-xs font-black text-red-700">저장 안 된 마감 기록이 있습니다!</span>
            </div>
            <div className="flex gap-2 justify-end">
                <button onClick={() => {
                    if(window.confirm('임시 기록을 영구 삭제하시겠습니까?')) {
                        localStorage.removeItem('hyunaRecoveryShift'); setRecoveryShift(null);
                    }
                }} className="bg-white text-red-500 border border-red-200 text-[10px] px-3 py-1.5 rounded-lg font-bold shadow-sm active:scale-95">삭제</button>
                <button onClick={() => {
                    setDeliveryFormData(recoveryShift.formData);
                    setSplitQueue(recoveryShift.splitQueue || []);
                    setIsDeliveryModalOpen(true);
                }} className="bg-red-600 text-white text-xs px-4 py-1.5 rounded-lg font-black shadow-md active:scale-95">마감 이어쓰기 🚀</button>
            </div>
         </div>
      )}

      {/* 프리미엄 타이머 카드 */}
      <div className={`mx-1 rounded-[2rem] p-5 shadow-lg transition-all duration-700 ${timerActive ? 'bg-gradient-to-br from-blue-600 to-indigo-800 ring-4 ring-blue-100 shadow-[0_10px_20px_rgba(37,99,235,0.3)]' : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-md'}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3 ml-1">
            <div className={`p-3 rounded-2xl ${timerActive ? 'bg-white/20 text-white animate-pulse shadow-inner' : 'bg-slate-700 text-slate-300 shadow-inner'}`}>
               <Timer size={24} />
            </div>
            <div>
              <div className={`text-[11px] font-black flex items-center gap-1.5 mb-0.5 ${timerActive ? 'text-blue-100' : 'text-slate-200'}`}>
                실시간 기록 {timerActive && <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse shadow-sm"></span>}
              </div>
              <div className={`text-[28px] font-black tracking-tighter leading-none text-white drop-shadow-md`}>
                 {timerActive ? `${Math.floor(elapsedSeconds/3600).toString().padStart(2,'0')}:${String(Math.floor((elapsedSeconds%3600)/60)).padStart(2,'0')}:${String(elapsedSeconds%60).padStart(2,'0')}` : '00:00:00'}
              </div>
            </div>
          </div>
          <button onClick={() => { 
            if(timerActive) {
              if(!window.confirm("운행을 마감하시겠습니까?")) return;
              const endObj = new Date();
              const startObj = new Date(trackingStartTime);
              const startDateStr = getKSTDateStrFromDate(startObj);
              const endDateStr = getKSTDateStrFromDate(endObj);
              
              if (startDateStr !== endDateStr) {
                  setDeliveryFormData({ ...emptyForm, date: startDateStr, startTime: formatTimeStr(startObj), endTime: '23:59' });
                  setSplitQueue([{ date: endDateStr, startTime: '00:00', endTime: formatTimeStr(endObj) }]);
              } else {
                  setDeliveryFormData({ ...emptyForm, date: startDateStr, startTime: formatTimeStr(startObj), endTime: formatTimeStr(endObj) });
                  setSplitQueue([]);
              }
              setEditingDeliveryShift(null); handleEndDelivery();
              setLiveData({amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: ''}); setIsLiveCalcOpen(false);
              setIsDeliveryModalOpen(true);
            } else {
              setLiveData({amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: ''}); setIsLiveCalcOpen(false); handleStartDelivery();
            }
          }} className={`px-5 py-3.5 rounded-[1.2rem] font-black text-sm shadow-md transition-all active:scale-95 ${timerActive ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-white/20 text-white border border-white/20 hover:bg-white/30'}`}>
            {timerActive ? '운행 종료' : '배달 시작'}
          </button>
        </div>

        {timerActive && (
          <div className="mb-1 mt-4">
            <div className="flex gap-2 w-full">
               {trackingStartTime && (
                  <div className="bg-white/10 border border-white/20 text-white rounded-xl px-3 flex items-center justify-center shadow-sm text-[12px] font-bold shrink-0 tracking-tight">
                     <Clock size={12} className="mr-1 text-blue-200"/> {new Date(trackingStartTime).getHours().toString().padStart(2,'0')}:{new Date(trackingStartTime).getMinutes().toString().padStart(2,'0')} 시작
                  </div>
               )}
               <button onClick={() => setIsLiveCalcOpen(!isLiveCalcOpen)} className="flex-1 bg-white/20 border border-white/30 rounded-xl p-2.5 flex justify-center items-center gap-1.5 shadow-sm text-xs font-black text-white active:bg-white/30 transition-colors">
                 📊 중간 정산 계산기 {isLiveCalcOpen ? '▲' : '▼'}
               </button>
            </div>
            
            {isLiveCalcOpen && (
               <div className="bg-white rounded-2xl p-4 mt-2 border border-slate-200 shadow-xl animate-in slide-in-from-top-2 text-slate-800">
                  <div className="grid grid-cols-3 gap-2 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-inner relative">
                     {liveMetrics.deductedAmt > 0 && <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-rose-700">이전 누적액 차감됨</div>}
                     <div className="text-center"><div className="text-[10px] font-black text-slate-500 mb-0.5 tracking-tight">이번 타임 수익 ({liveMetrics.totalCnt}건)</div><div className="text-sm font-black text-blue-600">{formatLargeMoney(liveMetrics.totalAmt)}원</div></div>
                     <div className="text-center border-x border-slate-200"><div className="text-[10px] font-black text-slate-500 mb-0.5 tracking-tight">평균 단가</div><div className="text-sm font-black text-slate-800">{formatLargeMoney(liveMetrics.avg)}원</div></div>
                     <div className="text-center"><div className="text-[10px] font-black text-slate-500 mb-0.5 tracking-tight">현재 시급</div><div className="text-sm font-black text-emerald-600">{formatLargeMoney(liveMetrics.hourly)}원</div></div>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border-2 border-[#2ac1bc]/40 shadow-sm mb-2">
                     <div className="font-black text-[#1f938f] text-[12px] mb-2 flex items-center gap-1.5"><Bike size={14}/> 배달의민족 (앱 누적 총액 입력)</div>
                     <div className="space-y-2">
                        <div className="flex gap-1.5 items-center w-full min-w-0">
                           <span className="w-[50px] shrink-0 text-[11px] font-black bg-slate-100 text-[#1f938f] border border-slate-300 rounded-lg text-center flex items-center justify-center h-[38px] shadow-sm">정훈</span>
                           <input type="text" inputMode="numeric" pattern="[0-9,]*" value={liveData.amountJunghoonBaemin ? formatLargeMoney(liveData.amountJunghoonBaemin) : ''} onChange={e => setLiveData({...liveData, amountJunghoonBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="총액" className="flex-[7] min-w-0 text-sm font-black bg-white rounded-lg px-2 h-[38px] outline-none border border-slate-300 focus:border-[#2ac1bc] shadow-inner text-slate-800" />
                           <input type="text" inputMode="numeric" pattern="[0-9,]*" value={liveData.countJunghoonBaemin} onChange={e => setLiveData({...liveData, countJunghoonBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="건수" className="flex-[3] min-w-0 text-sm font-black bg-white rounded-lg px-1 h-[38px] text-center outline-none border border-slate-300 focus:border-[#2ac1bc] shadow-inner text-slate-800" />
                        </div>
                        <div className="flex gap-1.5 items-center w-full min-w-0">
                           <span className="w-[50px] shrink-0 text-[11px] font-black bg-slate-100 text-[#1f938f] border border-slate-300 rounded-lg text-center flex items-center justify-center h-[38px] shadow-sm">현아</span>
                           <input type="text" inputMode="numeric" pattern="[0-9,]*" value={liveData.amountHyunaBaemin ? formatLargeMoney(liveData.amountHyunaBaemin) : ''} onChange={e => setLiveData({...liveData, amountHyunaBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="총액" className="flex-[7] min-w-0 text-sm font-black bg-white rounded-lg px-2 h-[38px] outline-none border border-slate-300 focus:border-[#2ac1bc] shadow-inner text-slate-800" />
                           <input type="text" inputMode="numeric" pattern="[0-9,]*" value={liveData.countHyunaBaemin} onChange={e => setLiveData({...liveData, countHyunaBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="건수" className="flex-[3] min-w-0 text-sm font-black bg-white rounded-lg px-1 h-[38px] text-center outline-none border border-slate-300 focus:border-[#2ac1bc] shadow-inner text-slate-800" />
                        </div>
                     </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-300 shadow-sm">
                     <div className="font-black text-slate-800 text-[12px] mb-2 flex items-center gap-1.5"><Bike size={14}/> 쿠팡이츠 (앱 누적 총액 입력)</div>
                     <div className="space-y-2">
                        <div className="flex gap-1.5 items-center w-full min-w-0">
                           <span className="w-[50px] shrink-0 text-[11px] font-black bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-center flex items-center justify-center h-[38px] shadow-sm">정훈</span>
                           <input type="text" inputMode="numeric" pattern="[0-9,]*" value={liveData.amountJunghoonCoupang ? formatLargeMoney(liveData.amountJunghoonCoupang) : ''} onChange={e => setLiveData({...liveData, amountJunghoonCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="총액" className="flex-[7] min-w-0 text-sm font-black bg-white rounded-lg px-2 h-[38px] outline-none border border-slate-300 focus:border-blue-600 shadow-inner text-slate-800" />
                           <input type="text" inputMode="numeric" pattern="[0-9,]*" value={liveData.countJunghoonCoupang} onChange={e => setLiveData({...liveData, countJunghoonCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="건수" className="flex-[3] min-w-0 text-sm font-black bg-white rounded-lg px-1 h-[38px] text-center outline-none border border-slate-300 focus:border-blue-600 shadow-inner text-slate-800" />
                        </div>
                        <div className="flex gap-1.5 items-center w-full min-w-0">
                           <span className="w-[50px] shrink-0 text-[11px] font-black bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-center flex items-center justify-center h-[38px] shadow-sm">현아</span>
                           <input type="text" inputMode="numeric" pattern="[0-9,]*" value={liveData.amountHyunaCoupang ? formatLargeMoney(liveData.amountHyunaCoupang) : ''} onChange={e => setLiveData({...liveData, amountHyunaCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="총액" className="flex-[7] min-w-0 text-sm font-black bg-white rounded-lg px-2 h-[38px] outline-none border border-slate-300 focus:border-blue-600 shadow-inner text-slate-800" />
                           <input type="text" inputMode="numeric" pattern="[0-9,]*" value={liveData.countHyunaCoupang} onChange={e => setLiveData({...liveData, countHyunaCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="건수" className="flex-[3] min-w-0 text-sm font-black bg-white rounded-lg px-1 h-[38px] text-center outline-none border border-slate-300 focus:border-blue-600 shadow-inner text-slate-800" />
                        </div>
                     </div>
                  </div>
                  <div className="mt-3 text-[10px] text-center text-slate-400 font-bold">운행 종료 시 위 데이터는 자동으로 지워집니다 🧹</div>
               </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-1 mx-1">
        {isYearlySummaryOpen ? (
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden mb-1 animate-in fade-in" onClick={() => setIsYearlySummaryOpen(false)}>
            <Bike className="absolute -right-2 -bottom-2 w-32 h-32 opacity-10 rotate-12" fill="white" />
            <div className="flex justify-between items-end mb-4 relative z-10 cursor-pointer">
              <div>
                <div className="text-[12px] font-black opacity-90 mb-1 flex items-center gap-1 text-slate-300">
                   <ChevronUp size={16}/> {selectedYear}년 누적 배달 수익
                </div>
                {/* 💡 [V5.23] 글자 크기 10% 축소 (text-[34px] -> text-[30px]) */}
                <div className="text-[30px] font-black tracking-tighter leading-none mt-1">{formatLargeMoney(yearlyMetrics.totalAmt)}<span className="text-lg ml-1 opacity-90 font-bold">원</span></div>
              </div>
              <div className="text-right">
                <div className="flex flex-col items-end gap-1.5 text-[10px] font-bold opacity-90 pb-1">
                   <span className="flex gap-2 text-slate-100"><span>총 {formatLargeMoney(yearlyMetrics.totalCnt)}건</span><span>{yearlyMetrics.durationStr} 근무</span></span>
                   <span className="flex gap-2 text-slate-300"><span>평단 {formatLargeMoney(yearlyMetrics.perDelivery)}원</span><span>시급 {formatLargeMoney(yearlyMetrics.hourlyRate)}원</span></span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-3 relative z-10">
               <div className="bg-white/10 rounded-xl p-2.5 flex flex-col gap-1 border border-white/20 shadow-sm">
                 <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-300">정훈</span><span className="text-[13px] font-black text-white">{formatLargeMoney(yearlyJunghoonAmt)}원</span></div>
                 <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-300">현아</span><span className="text-[13px] font-black text-white">{formatLargeMoney(yearlyHyunaAmt)}원</span></div>
               </div>
               <div className="bg-white/10 rounded-xl p-2.5 flex flex-col gap-1 border border-white/20 shadow-sm">
                 <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-[#4cd1cc]">배민</span><span className="text-[13px] font-black text-white">{formatLargeMoney(yearlyItems.filter(d=>d.platform==='배민').reduce((a,b)=>a+(b.amount||0),0))}원</span></div>
                 <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-300">쿠팡</span><span className="text-[13px] font-black text-white">{formatLargeMoney(yearlyItems.filter(d=>d.platform==='쿠팡').reduce((a,b)=>a+(b.amount||0),0))}원</span></div>
               </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-sm flex justify-between items-center cursor-pointer text-slate-700 hover:bg-slate-100 transition-colors" onClick={() => setIsYearlySummaryOpen(true)}>
             <span className="text-sm font-black flex items-center gap-1.5">🗓️ {selectedYear}년 누적 수익 확인</span>
             <ChevronDownSquare size={18} className="text-slate-400" />
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-1 mx-1">
        <button onClick={() => { setIsDeliverySummaryOpen(!isDeliverySummaryOpen); setIsPendingSummaryOpen(false); setIsYearlySummaryOpen(false); }} className={`flex-1 py-3.5 rounded-2xl border text-[13px] font-black transition-colors shadow-sm flex justify-center items-center gap-1.5 ${isDeliverySummaryOpen ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
           🏍️ {calMonth}월 수익 확인 {isDeliverySummaryOpen ? '∧' : '∨'}
        </button>
        <button onClick={() => { setIsPendingSummaryOpen(!isPendingSummaryOpen); setIsDeliverySummaryOpen(false); setIsYearlySummaryOpen(false); }} className={`flex-1 py-3.5 rounded-2xl border text-[13px] font-black transition-colors shadow-sm flex justify-center items-center gap-1.5 ${isPendingSummaryOpen ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
           💰 정산 예정금 {isPendingSummaryOpen ? '∧' : '∨'}
        </button>
      </div>

      <div className="mx-1">
        {isDeliverySummaryOpen && (() => {
            const baeminTotal = filteredDailyDeliveries.filter(d=>d.platform==='배민').reduce((a,b)=>a+(b.amount||0),0);
            const coupangTotal = filteredDailyDeliveries.filter(d=>d.platform==='쿠팡').reduce((a,b)=>a+(b.amount||0),0);

            return (
              <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-[2rem] p-5 text-white shadow-lg relative overflow-hidden mb-2 animate-in slide-in-from-top-2" onClick={() => setIsDeliverySummaryOpen(false)}>
                <Bike className="absolute -right-2 -bottom-2 w-32 h-32 opacity-10 rotate-12" fill="white" />
                
                <div className="flex flex-col mb-4 relative z-10 cursor-pointer">
                    <div className="text-[11px] font-black opacity-90 mb-1 flex items-center gap-1">
                       <ChevronUp size={14}/> {(deliveryDateRange.start || deliveryDateRange.end) ? '지정 기간 수익' : `${calMonth}월 수익 현황`}
                    </div>
                    <div className="flex justify-between items-end">
                       <div className="text-[32px] font-black tracking-tighter leading-none">{formatLargeMoney(deliveryFilteredTotal)}<span className="text-base ml-1 opacity-80 font-bold">원</span></div>
                       <div className="flex flex-col items-end gap-1.5 text-[10px] font-bold opacity-90 pb-1">
                          <span className="flex gap-2"><span>총 {formatLargeMoney(deliveryFilteredCount)}건</span><span>{monthlyMetrics.durationStr} 근무</span></span>
                          <span className="flex gap-2 text-blue-200"><span>평단 {formatLargeMoney(deliveryAvgPerDelivery)}원</span><span>시급 {formatLargeMoney(monthlyMetrics.hourlyRate)}원</span></span>
                       </div>
                    </div>
                </div>
                
                {(userSettings.deliveryGoals?.[currentMonthKey] || 0) > 0 && !deliveryDateRange.start && !deliveryDateRange.end && (() => {
                   const goal = userSettings.deliveryGoals[currentMonthKey];
                   const pct = Math.min(100, (deliveryFilteredTotal / goal) * 100);
                   
                   const today = new Date();
                   let remainingDays = 0;
                   if (calYear === today.getFullYear() && calMonth === (today.getMonth() + 1)) {
                       const daysInMonth = new Date(calYear, calMonth, 0).getDate();
                       remainingDays = daysInMonth - today.getDate();
                   } else if (today.getFullYear() < calYear || (today.getFullYear() === calYear && (today.getMonth() + 1) < calMonth)) {
                       remainingDays = new Date(calYear, calMonth, 0).getDate();
                   }

                   const timeRatio = remainingDays > 0 ? ((new Date(calYear, calMonth, 0).getDate() - remainingDays) / new Date(calYear, calMonth, 0).getDate()) * 100 : 100;
                   const diff = pct - timeRatio;
                   const remainingAmt = Math.max(0, goal - deliveryFilteredTotal);
                   const dailyReq = remainingDays > 0 ? Math.ceil(remainingAmt / remainingDays) : 0;
                   
                   const goalInMan = goal >= 10000 ? Math.floor(goal / 10000) + '만' : formatLargeMoney(goal);
                   const diffStr = diff >= 0 ? `🔥+${diff.toFixed(1)}% 초과` : `🏃${diff.toFixed(1)}% 미달`;

                   return (
                     <div className="mb-4 relative z-10">
                       <div className="w-full bg-slate-900/40 rounded-full h-[24px] relative overflow-hidden shadow-inner border border-white/20">
                           <div className="bg-blue-400 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(96,165,250,0.8)]" style={{width: `${pct}%`}}></div>
                           <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white drop-shadow-md whitespace-nowrap">
                               🎯 목표 {goalInMan} | {pct.toFixed(1)}% 달성 | {diffStr}
                           </div>
                           <div className="absolute top-0 bottom-0 w-[2px] bg-rose-400 z-20 shadow-[0_0_5px_rgba(251,113,133,1)]" style={{left: `${timeRatio}%`}}></div>
                       </div>
                       {remainingDays > 0 && remainingAmt > 0 && (
                           <div className="mt-1.5 text-[11px] font-bold text-blue-100 tracking-tight text-center">
                               🎯 남은 목표: {formatLargeMoney(remainingAmt)}원 (하루 평균 <span className="text-rose-300 font-black">{formatLargeMoney(dailyReq)}</span>원 필요)
                           </div>
                       )}
                     </div>
                   );
                })()}

                <div className="grid grid-cols-2 gap-2 relative z-10">
                   <div className="bg-white/10 rounded-xl p-2.5 flex flex-col gap-1 border border-white/20 shadow-sm">
                     <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-blue-200">정훈</span><span className="text-[13px] font-black text-white">{formatLargeMoney(filteredJunghoonItems.reduce((a,b)=>a+(b.amount||0),0))}원</span></div>
                     <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-blue-200">현아</span><span className="text-[13px] font-black text-white">{formatLargeMoney(filteredHyunaItems.reduce((a,b)=>a+(b.amount||0),0))}원</span></div>
                   </div>
                   <div className="bg-white/10 rounded-xl p-2.5 flex flex-col gap-1 border border-white/20 shadow-sm">
                     <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-[#4cd1cc]">배민</span><span className="text-[13px] font-black text-white">{formatLargeMoney(baeminTotal)}원</span></div>
                     <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-blue-200">쿠팡</span><span className="text-[13px] font-black text-white">{formatLargeMoney(coupangTotal)}원</span></div>
                   </div>
                </div>
              </div>
            );
        })()}
      </div>

      {isPendingSummaryOpen && (() => {
        const upcomingToDisplay = upcomingPaydays.slice(0, 2);
        return (
            <div className="grid grid-cols-2 gap-2 mb-2 animate-in slide-in-from-top-2 mx-1">
              {upcomingToDisplay.length === 0 ? (
                <div className="col-span-2 bg-slate-50 rounded-2xl p-5 shadow-sm border border-slate-200 text-center text-slate-500 text-sm font-black">입금 대기 중인 정산금이 없습니다.</div>
              ) : (
                upcomingToDisplay.map((pd, idx) => {
                  const group = pendingByPayday[pd];
                  const metrics = getGroupMetrics(group.items);
                  const isSingle = upcomingToDisplay.length === 1;
                  
                  const baeminTot = group.items.filter(d=>d.platform==='배민').reduce((a,b)=>a+(b.amount||0),0);
                  const coupangTot = group.items.filter(d=>d.platform==='쿠팡').reduce((a,b)=>a+(b.amount||0),0);

                  return (
                    <div key={pd} onClick={() => setSelectedWeeklySummary(pd)} className={`rounded-[2rem] p-5 shadow-lg border bg-gradient-to-br from-teal-700 to-cyan-800 border-teal-600 flex flex-col justify-between cursor-pointer active:scale-95 transition-transform text-white relative overflow-hidden ${isSingle ? 'col-span-2' : 'col-span-2'}`}>
                      <Bike className="absolute -right-2 -bottom-2 w-32 h-32 opacity-10 rotate-12" fill="white" />
                      
                      <div className="flex flex-col mb-4 relative z-10">
                          <div className="text-[11px] font-black opacity-90 mb-1 flex items-center gap-1">
                             <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm border ${idx === 0 ? 'bg-white text-teal-700 border-white' : 'bg-teal-600 text-white border-teal-500'}`}>{idx === 0 ? '이번주' : '다음주'}</span>
                             <span className="text-teal-50">{pd.slice(5).replace('-','/')} 정산예정</span>
                          </div>
                          <div className="flex justify-between items-end">
                             <div className={`text-[32px] font-black tracking-tighter leading-none mt-1`}>{formatLargeMoney(group.total)}<span className="text-base font-bold ml-1 opacity-80">원</span></div>
                             <div className="flex flex-col items-end gap-1.5 text-[10px] font-bold opacity-90 pb-1">
                                <span className="flex gap-2 text-teal-50"><span>총 {formatLargeMoney(metrics.totalCnt)}건</span><span>{metrics.durationStr} 근무</span></span>
                                <span className="flex gap-2 text-teal-200"><span>평단 {formatLargeMoney(metrics.perDelivery)}원</span><span>시급 {formatLargeMoney(metrics.hourlyRate)}원</span></span>
                             </div>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 relative z-10">
                         <div className="bg-white/10 rounded-xl p-2.5 flex flex-col gap-1 border border-white/20 shadow-sm">
                           <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-teal-100">정훈</span><span className="text-[13px] font-black text-white">{formatLargeMoney(group.junghoon || 0)}원</span></div>
                           <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-teal-100">현아</span><span className="text-[13px] font-black text-white">{formatLargeMoney(group.hyuna || 0)}원</span></div>
                         </div>
                         <div className="bg-white/10 rounded-xl p-2.5 flex flex-col gap-1 border border-white/20 shadow-sm">
                           <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-[#a5f3fc]">배민</span><span className="text-[13px] font-black text-white">{formatLargeMoney(baeminTot)}원</span></div>
                           <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-teal-100">쿠팡</span><span className="text-[13px] font-black text-white">{formatLargeMoney(coupangTot)}원</span></div>
                         </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
        );
      })()}

      <div className="flex items-center gap-2 mt-2 mx-1">
        <div className="flex bg-white p-1 rounded-2xl flex-1 shadow-sm border border-slate-200"><button onClick={() => setDeliverySubTab('daily')} className={`flex-1 py-3 rounded-[1rem] text-[13px] font-black transition-all ${deliverySubTab==='daily'?'bg-blue-600 text-white shadow-md':'text-slate-500 hover:bg-slate-50'}`}>상세내역</button><button onClick={() => setDeliverySubTab('calendar')} className={`flex-1 py-3 rounded-[1rem] text-[13px] font-black transition-all ${deliverySubTab==='calendar'?'bg-blue-600 text-white shadow-md':'text-slate-500 hover:bg-slate-50'}`}>달력</button><button onClick={() => setDeliverySubTab('weekly')} className={`flex-1 py-3 rounded-[1rem] text-[13px] font-black transition-all ${deliverySubTab==='weekly'?'bg-blue-600 text-white shadow-md':'text-slate-500 hover:bg-slate-50'}`}>주차별</button></div>
        <button onClick={() => setShowDeliveryFilters(!showDeliveryFilters)} className={`p-3.5 rounded-2xl transition-colors shadow-sm border ${showDeliveryFilters ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}><Filter size={20} /></button>
      </div>

      {showDeliveryFilters && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-200 animate-in slide-in-from-top-2 mx-1 mt-2">
          <div className="flex items-center gap-2"><input type="date" value={deliveryDateRange.start} onChange={(e) => setDeliveryDateRange({...deliveryDateRange, start: e.target.value})} className="flex-1 bg-slate-50 rounded-xl px-2 h-[44px] text-sm font-black outline-none border border-slate-200 focus:border-blue-500 text-slate-800" /><span className="text-slate-400 font-black">~</span><input type="date" value={deliveryDateRange.end} onChange={(e) => setDeliveryDateRange({...deliveryDateRange, end: e.target.value})} className="flex-1 bg-slate-50 rounded-xl px-2 h-[44px] text-sm font-black outline-none border border-slate-200 focus:border-blue-500 text-slate-800" /></div>
          <button onClick={() => setDeliveryDateRange({start:'', end:''})} className="w-full mt-3 bg-slate-100 border border-slate-200 text-slate-600 py-3 rounded-xl font-black text-sm flex justify-center items-center gap-1.5 active:bg-slate-200 transition-colors"><RefreshCw size={14}/> 초기화</button>
        </div>
      )}

      {deliverySubTab === 'calendar' && (() => {
        const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth, 0).getDate();
        const days = Array(firstDay).fill(null).concat(Array.from({length:daysInMonth}, (_,i)=>i+1));
        const dataByDate = {};
        
        (dailyDeliveries || []).forEach(d => { 
           if(d.date && d.date.startsWith(`${calYear}-${String(calMonth).padStart(2, '0')}`)) { 
               if(!dataByDate[d.date]) dataByDate[d.date] = { amt: 0 }; 
               dataByDate[d.date].amt += (d.amount||0); 
           } 
        });

        return (
          <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-blue-200 animate-in slide-in-from-bottom-2 mt-3 mx-1">
             <div className="flex justify-between items-center px-3 mb-4 mt-1">
                <button onClick={() => { if(calMonth===1){setCalMonth(12); setCalYear(calYear-1);} else setCalMonth(calMonth-1); }} className="p-2 bg-slate-50 text-blue-600 rounded-xl border border-slate-200 shadow-sm active:scale-95"><ChevronLeft size={18}/></button>
                <span className="font-black text-slate-800 text-[17px]">{calYear}년 {calMonth}월</span>
                <button onClick={() => { if(calMonth===12){setCalMonth(1); setCalYear(calYear+1);} else setCalMonth(calMonth+1); }} className="p-2 bg-slate-50 text-blue-600 rounded-xl border border-slate-200 shadow-sm active:scale-95"><ChevronRight size={18}/></button>
             </div>

             <div className="grid grid-cols-7 gap-1 text-center mb-2">{['일','월','화','수','목','금','토'].map((d,i) => <div key={d} className={`text-[11px] font-black ${i===0?'text-red-500':i===6?'text-blue-500':'text-slate-500'}`}>{d}</div>)}</div>
             <div className="grid grid-cols-7 gap-1">
               {days.map((d, i) => {
                 if(!d) return <div key={`empty-${i}`} className="h-[65px] bg-slate-50 rounded-xl border border-slate-100"></div>;
                 const dateStr = `${calYear}-${String(calMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                 const dayData = dataByDate[dateStr] || { amt: 0 };
                 const isToday = dateStr === todayStr;
                 
                 const holidayName = getHolidayName(dateStr);
                 const isCustomHoliday = customHolidays.includes(dateStr);
                 const dayIndex = (i % 7);
                 const isRed = dayIndex === 0 || holidayName || isCustomHoliday;
                 const isBlue = dayIndex === 6 && !holidayName && !isCustomHoliday;
                 const dayColor = isRed ? 'text-red-500' : isBlue ? 'text-blue-500' : 'text-slate-800';

                 return (
                   <div key={`day-${i}`} onClick={() => { if(dayData.amt > 0) setSelectedDailySummary(dateStr); }} className={`h-[65px] border rounded-xl p-1 flex flex-col items-center justify-center ${dayData.amt>0?'border-blue-300 bg-blue-50/80 shadow-sm cursor-pointer active:scale-95 transition-transform':'border-slate-200 bg-white'} ${isToday ? 'ring-2 ring-blue-500 ring-offset-1 z-10 shadow-md' : ''}`}>
                     <span className={`text-[13px] font-black mb-1 ${dayColor}`}>{d}</span>
                     {dayData.amt > 0 && <span className="text-[10px] font-black text-blue-600 w-full text-center truncate tracking-tighter">{formatCompactMoney(dayData.amt).replace('+','')}</span>}
                   </div>
                 )
               })}
             </div>
          </div>
        );
      })()}

      {deliverySubTab === 'weekly' && (
        <div className="space-y-3 animate-in slide-in-from-right duration-300 mt-3 mx-1">
          {pastPaydays.map(pDate => {
             const group = paydayGroups[pDate];
             const metrics = getGroupMetrics(group.items);
             
             const baeminTot = group.items.filter(d=>d.platform==='배민').reduce((a,b)=>a+(b.amount||0),0);
             const coupangTot = group.items.filter(d=>d.platform==='쿠팡').reduce((a,b)=>a+(b.amount||0),0);
             const etcTot = group.total - baeminTot - coupangTot;

             return (
               <div key={pDate} onClick={() => setSelectedWeeklySummary(pDate)} className="bg-white rounded-[1.5rem] py-5 px-5 shadow-sm border border-slate-200 cursor-pointer active:scale-95 transition-transform">
                 <div className="flex justify-between items-end mb-1">
                    <div className="flex items-center gap-2">
                       <span className="font-black text-slate-800 text-lg tracking-tight">{parseInt(pDate.slice(5,7))}월 {getWeekOfMonth(pDate)}주차</span>
                       <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-lg font-bold">{pDate.slice(5).replace('-', '/')} 정산완료</span>
                    </div>
                    <div className="text-[20px] font-black text-slate-700 leading-none tracking-tighter">{formatLargeMoney(group.total)}원</div>
                 </div>
                 
                 <div className="text-[11px] font-bold text-slate-500 mt-1.5 mb-3 flex justify-end gap-3">
                   <span className="text-[#1f938f]">배민 {formatLargeMoney(baeminTot)}</span>
                   <span className="text-slate-600">쿠팡 {formatLargeMoney(coupangTot)}</span>
                   {etcTot > 0 && <span className="text-slate-400">기타 {formatLargeMoney(etcTot)}</span>}
                 </div>

                 <div className="flex justify-between items-center text-[12px] text-slate-500 font-bold bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-inner">
                    <span className="flex items-center gap-1.5"><Timer size={14} className="text-slate-400"/>{metrics.durationStr || '-'}</span>
                    <span className="flex items-center gap-1.5"><Bike size={14} className="text-slate-400"/>총 <span className="font-black text-slate-800">{metrics.totalCnt}</span>건</span>
                    <span className="flex items-center gap-1.5 text-blue-600"><Coins size={14} className="text-blue-500"/>시급 <span className="font-black">{formatLargeMoney(metrics.hourlyRate)}</span>원</span>
                 </div>
               </div>
             )
          })}
        </div>
      )}

      {deliverySubTab === 'daily' && (
        <div className="space-y-3 animate-in slide-in-from-left duration-300 mt-3 mx-1">
          {dailyDates.map(date => {
            const shiftList = dailyShifts[date] || [];
            const allItemsForDay = shiftList.flatMap(s => s.items);
            const dayMetrics = calcDailyMetrics(allItemsForDay);
            
            const dateObj = new Date(date);
            const dayIndex = dateObj.getDay();
            const dayName = ['일','월','화','수','목','금','토'][dayIndex];
            
            const dateColorClass = (dayIndex === 0) ? 'text-red-500' : dayIndex === 6 ? 'text-blue-600' : 'text-slate-900';

            return (
              <div key={date} className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden">
                 
                 <div className="p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setSelectedDailySummary(date)}>
                     <div className="flex justify-between items-end mb-1.5">
                        <div className={`text-[15px] font-black text-slate-800 tracking-tight flex items-center gap-1.5 ${dateColorClass}`}>
                            <span>{date.slice(5).replace('-','/')} ({dayName})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-black text-slate-500">총 {dayMetrics.totalCnt}건</span>
                            <span className="text-[18px] font-black text-blue-600 leading-none">{formatLargeMoney(dayMetrics.totalAmt)}원</span>
                        </div>
                     </div>
                     <div className="flex justify-between items-center mt-2.5">
                        <div className="text-[12px] font-black text-slate-800 flex items-center gap-1">
                            <Clock size={12} className="text-slate-400"/> {dayMetrics.durationStr}
                        </div>
                        <div className="flex gap-1.5 items-center">
                            <span className="bg-slate-50 text-[10px] font-bold text-slate-500 px-2 py-1 rounded border border-slate-200 shadow-sm">평단 {formatLargeMoney(dayMetrics.perDelivery)}</span>
                            {dayMetrics.hourlyRate > 0 && <span className="bg-blue-50 text-[10px] font-bold text-blue-600 px-2 py-1 rounded border border-blue-200 shadow-sm">시급 {formatLargeMoney(dayMetrics.hourlyRate)}</span>}
                        </div>
                     </div>
                 </div>

                 <div className="border-t border-slate-100 bg-slate-50">
                    <button onClick={(e) => toggleDailyDate(date, e)} className="w-full py-3 flex justify-center items-center gap-1 text-[12px] font-black text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors active:bg-slate-100">
                       {expandedDailyDates[date] ? <>▲ 회차별 상세 닫기</> : <>▼ 회차별 상세 보기</>}
                    </button>
                 </div>

                 {expandedDailyDates[date] && (
                     <div className="px-4 pb-4 space-y-2 bg-slate-50 animate-in slide-in-from-top-2 duration-300">
                      {shiftList.map((shift, index) => {
                        const shiftOrder = shiftList.length - index;
                        let shiftDurationStr = '';
                        let shiftHourlyRate = 0;
                        if (shift.startTime && shift.endTime) {
                            let [sh, sm] = shift.startTime.split(':').map(Number);
                            let [eh, em] = shift.endTime.split(':').map(Number);
                            let startMins = sh * 60 + sm;
                            let endMins = eh * 60 + em;
                            if (endMins <= startMins) endMins += 1440;
                            let totalMins = endMins - startMins;
                            let h = Math.floor(totalMins / 60);
                            let m = totalMins % 60;
                            shiftDurationStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
                            shiftHourlyRate = totalMins > 0 ? Math.round(shift.totalAmt / (totalMins / 60)) : 0;
                        }
                        
                        const platforms = Array.from(new Set(shift.items.map(item => item.platform)));

                        return (
                          <div key={shift.id} onClick={(e) => { e.stopPropagation(); setSelectedShiftDetail(shift); }} className="flex justify-between items-center bg-gradient-to-br from-slate-500 to-indigo-600 p-3 rounded-2xl border border-white/10 cursor-pointer active:scale-95 shadow-sm mt-2 text-white transition-all hover:from-slate-600 hover:to-indigo-700">
                              <div className="flex items-center gap-2 overflow-hidden">
                                  <div className="flex flex-col items-center justify-center shrink-0 w-[36px] gap-0.5">
                                      <span className="text-[11px] font-black text-white bg-white/20 px-1.5 py-0.5 rounded border border-white/20 shadow-sm leading-none">{shiftOrder}차</span>
                                      {shiftDurationStr && <span className="text-[9px] font-bold text-indigo-100 tracking-tighter leading-none">({shiftDurationStr})</span>}
                                  </div>
                                  <div className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-white shrink-0 bg-white/20 border border-white/20 shadow-sm">
                                      <div className="text-[18px] font-black leading-none">{shift.totalCnt}</div>
                                  </div>
                                  <div className="pl-1 flex-1 min-w-0 flex flex-col justify-center gap-1">
                                      <div className="font-bold text-[13px] text-white shrink-0 tracking-tight leading-none">
                                         {shift.startTime && shift.endTime ? `${shift.startTime}~${shift.endTime}` : '시간 미지정'}
                                      </div>
                                      <div className="flex gap-1 items-center flex-wrap">
                                         {platforms.map(p => (
                                            <span key={p} className={`text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm leading-none ${p === '배민' ? 'bg-[#2ac1bc]/80 text-white border border-[#2ac1bc]/50' : 'bg-slate-800/50 text-white border border-slate-600'}`}>
                                               {p}
                                            </span>
                                         ))}
                                      </div>
                                  </div>
                              </div>
                              <div className="flex flex-col items-end shrink-0 pl-1 gap-1">
                                 <div className="font-black text-[16px] text-white leading-none tracking-tighter">{formatLargeMoney(shift.totalAmt)}원</div>
                                 {shiftHourlyRate > 0 && <div className="text-[10px] font-black text-indigo-100 bg-white/10 px-1.5 py-0.5 rounded border border-white/20 shadow-sm flex items-center gap-0.5 leading-none"><span className="text-yellow-300">💡</span>시급 {formatLargeMoney(shiftHourlyRate)}원</div>}
                              </div>
                          </div>
                        );
                      })}
                     </div>
                 )}
              </div>
            );
          })}
        </div>
      )}

      {selectedShiftDetail && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-[80] p-0 overflow-y-auto no-scrollbar">
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, () => setSelectedShiftDetail(null))}
              className="bg-white w-full max-w-md rounded-t-[3rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 relative border-t-8 border-blue-600"
            >
               <div className="w-14 h-1.5 bg-slate-300 rounded-full mx-auto mb-6 shrink-0"></div>
               <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-1.5"><Bike size={22} className="text-blue-600"/> 근무 타임 상세</h3>
                  <button onClick={() => setSelectedShiftDetail(null)} className="text-slate-500 p-2 bg-slate-100 rounded-full active:scale-95 border border-slate-200"><X size={20}/></button>
               </div>
               
               <div className="mb-6">
                  <div className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-1.5"><CalendarCheck size={14}/> {selectedShiftDetail.date}</div>
                  <div className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">
                     {selectedShiftDetail.startTime && selectedShiftDetail.endTime ? `${selectedShiftDetail.startTime} ~ ${selectedShiftDetail.endTime}` : '시간 미지정 기록'}
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 mb-6 shadow-inner">
                     {selectedShiftDetail.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                           <div className="flex items-center gap-2.5">
                              <span className={`text-[12px] font-black px-2 py-1 rounded text-white shadow-sm border ${item.platform === '배민' ? 'bg-[#2ac1bc] border-[#1f938f]' : 'bg-[#111111] border-black'}`}>{item.platform}</span>
                              <span className="font-black text-base text-slate-800">{item.earner}</span>
                              <span className="text-[12px] font-bold text-slate-500 ml-1">({item.count}건)</span>
                           </div>
                           <div className="font-black text-slate-900 text-xl tracking-tight">{formatLargeMoney(item.amount)}원</div>
                        </div>
                     ))}
                  </div>

                  {(() => {
                      const shiftStart = selectedShiftDetail.startTime;
                      const shiftEnd = selectedShiftDetail.endTime;
                      let durationStr = '-';
                      let hourlyRate = 0;
                      if (shiftStart && shiftEnd) {
                          let [sh, sm] = shiftStart.split(':').map(Number);
                          let [eh, em] = shiftEnd.split(':').map(Number);
                          let startMins = sh * 60 + sm;
                          let endMins = eh * 60 + em;
                          if (endMins <= startMins) endMins += 1440;
                          let totalMins = endMins - startMins;
                          let h = Math.floor(totalMins / 60);
                          let m = totalMins % 60;
                          durationStr = `${h > 0 ? h+'시간 ' : ''}${m > 0 ? m+'분' : ''}`.trim();
                          hourlyRate = totalMins > 0 ? Math.round(selectedShiftDetail.totalAmt / (totalMins / 60)) : 0;
                      }
                      let avgAmt = selectedShiftDetail.totalCnt > 0 ? Math.round(selectedShiftDetail.totalAmt / selectedShiftDetail.totalCnt) : 0;

                      return (
                         <div className="bg-blue-50/80 rounded-3xl p-5 border border-blue-200 shadow-sm">
                            <div className="grid grid-cols-2 gap-y-5 gap-x-5">
                               <div>
                                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Bike size={12}/>총 배달 건수</div>
                                  <div className="text-xl font-black text-slate-900">{selectedShiftDetail.totalCnt}건</div>
                               </div>
                               <div>
                                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Coins size={12}/>평균 단가</div>
                                  <div className="text-xl font-black text-slate-900">{formatLargeMoney(avgAmt)}원</div>
                               </div>
                               <div>
                                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock size={12}/>근무 시간</div>
                                  <div className="text-xl font-black text-slate-900">{durationStr}</div>
                               </div>
                               <div>
                                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Timer size={12}/>시간당 시급</div>
                                  <div className="text-xl font-black text-blue-600">{formatLargeMoney(hourlyRate)}원</div>
                               </div>
                            </div>
                            <div className="border-t border-blue-200/60 pt-5 mt-5 flex justify-between items-end">
                               <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">총 정산 금액</div>
                               <div className="text-4xl font-black tracking-tighter text-blue-600 leading-none">
                                  {formatLargeMoney(selectedShiftDetail.totalAmt)}<span className="text-lg text-slate-800 font-bold ml-1">원</span>
                               </div>
                            </div>
                         </div>
                      );
                  })()}
               </div>

               <div className="grid grid-cols-2 gap-3 pt-5 border-t border-slate-200">
                  <button onClick={() => openEditShiftForm(selectedShiftDetail)} className="py-4 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-700 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Edit3 size={18}/> 타임 전체 수정</button>
                  <button onClick={() => deleteShift(selectedShiftDetail)} className="py-4 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Trash2 size={18}/> 삭제</button>
               </div>
            </div>
         </div>
      )}

      {selectedDailySummary && (() => {
          const dayItems = (dailyDeliveries || []).filter(d => d.date === selectedDailySummary);
          const metrics = calcDailyMetrics(dayItems);
          
          const baeminTot = dayItems.filter(d=>d.platform==='배민').reduce((a,b)=>a+(b.amount||0),0);
          const coupangTot = dayItems.filter(d=>d.platform==='쿠팡').reduce((a,b)=>a+(b.amount||0),0);
          const etcTot = metrics.totalAmt - baeminTot - coupangTot;

          const junghoonTot = dayItems.filter(d=>d.earner==='정훈').reduce((a,b)=>a+(b.amount||0),0);
          const hyunaTot = dayItems.filter(d=>d.earner==='현아').reduce((a,b)=>a+(b.amount||0),0);

          return (
             <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-[70] p-0">
                <div 
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(e) => handleTouchEnd(e, () => setSelectedDailySummary(null))}
                  className="bg-white w-full max-w-md rounded-t-[3rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col relative overflow-hidden border-t-8 border-blue-600"
                >
                   <div className="w-14 h-1.5 bg-slate-300 rounded-full mx-auto mb-6 shrink-0"></div>
                   <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
                      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Target className="text-blue-600" size={28}/> {selectedDailySummary.slice(5).replace('-','/')} 일일 요약</h2>
                      <button onClick={() => setSelectedDailySummary(null)} className="bg-slate-100 text-slate-500 p-2.5 rounded-full active:scale-95 border border-slate-200"><X size={22}/></button>
                   </div>

                   <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-[2.5rem] p-7 text-white shadow-xl relative overflow-hidden border border-slate-600">
                       <Bike className="absolute -right-4 -bottom-4 w-36 h-36 opacity-10 rotate-12" fill="white" />
                       <div className="relative z-10">
                           <div className="text-slate-300 text-[12px] font-bold mb-1.5 tracking-widest uppercase">오늘 총 정산 금액</div>
                           <div className="text-[40px] font-black tracking-tighter mb-6 text-white leading-none">{formatLargeMoney(metrics.totalAmt)}<span className="text-xl font-bold opacity-80 ml-1">원</span></div>
                           
                           <div className="grid grid-cols-2 gap-5 gap-y-7 border-t border-white/10 pt-6">
                              <div>
                                 <div className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-widest">총 배달 건수</div>
                                 <div className="text-2xl font-black text-white">{formatLargeMoney(metrics.totalCnt)}건</div>
                              </div>
                              <div>
                                 <div className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-widest">평균 단가</div>
                                 <div className="text-2xl font-black text-white">{formatLargeMoney(metrics.perDelivery)}원</div>
                              </div>
                              <div>
                                 <div className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-widest">총 근무 시간</div>
                                 <div className="text-2xl font-black text-white">{metrics.durationStr || '-'}</div>
                              </div>
                              <div>
                                 <div className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-widest">평균 시급</div>
                                 <div className="text-2xl font-black text-blue-400">{formatLargeMoney(metrics.hourlyRate || 0)}원</div>
                              </div>
                           </div>

                           <div className="bg-white/10 rounded-2xl p-4 mt-7 flex flex-col gap-2.5 shadow-sm border border-white/10 relative z-10">
                              <div className="flex divide-x divide-white/20">
                                <div className="flex-1 px-2 flex justify-between items-center"><span className="text-[12px] font-bold text-slate-300">정훈</span><span className="text-base font-black text-white">{formatLargeMoney(junghoonTot)}원</span></div>
                                <div className="flex-1 px-2 flex justify-between items-center"><span className="text-[12px] font-bold text-slate-300">현아</span><span className="text-base font-black text-white">{formatLargeMoney(hyunaTot)}원</span></div>
                              </div>
                              <div className="w-full h-px bg-white/10"></div>
                              <div className="flex divide-x divide-white/20">
                                <div className="flex-1 px-2 flex justify-between items-center"><span className="text-[12px] font-bold text-[#4cd1cc]">배민</span><span className="text-base font-black text-white">{formatLargeMoney(baeminTot)}원</span></div>
                                <div className="flex-1 px-2 flex justify-between items-center"><span className="text-[12px] font-bold text-slate-300">쿠팡</span><span className="text-base font-black text-white">{formatLargeMoney(coupangTot)}원</span></div>
                              </div>
                              {etcTot > 0 && (
                                  <div className="text-right text-[11px] text-slate-400 font-bold mt-1 pr-2">기타 통합수익: {formatLargeMoney(etcTot)}원</div>
                              )}
                           </div>
                       </div>
                   </div>
                </div>
             </div>
          );
      })()}

      {selectedWeeklySummary && (() => {
          const pd = selectedWeeklySummary;
          const isCleared = clearedPaydays.includes(pd);
          const isPaydayReached = todayStr >= pd;
          const items = pendingByPayday[pd]?.items || paydayGroups[pd]?.items || [];
          const metrics = getGroupMetrics(items);
          
          const baeminTot = items.filter(d=>d.platform==='배민').reduce((a,b)=>a+(b.amount||0),0);
          const coupangTot = items.filter(d=>d.platform==='쿠팡').reduce((a,b)=>a+(b.amount||0),0);
          const etcTot = metrics.totalAmt - baeminTot - coupangTot;

          const title = `${pd.slice(5).replace('-','/')} 입금 ${isCleared ? '완료' : isPaydayReached ? '확정 대기중' : '예정'}`;
          const isWeekly = true; 

          return (
             <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-[70] p-0">
                <div 
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(e) => handleTouchEnd(e, () => setSelectedWeeklySummary(null))}
                  className="bg-white w-full max-w-md rounded-t-[3rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col relative overflow-hidden border-t-8 border-blue-600"
                >
                   <div className="w-14 h-1.5 bg-slate-300 rounded-full mx-auto mb-6 shrink-0"></div>
                   <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
                      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Target className="text-blue-600" size={28}/> {title}</h2>
                      <button onClick={() => setSelectedWeeklySummary(null)} className="bg-slate-100 text-slate-500 p-2.5 rounded-full active:scale-95 border border-slate-200"><X size={22}/></button>
                   </div>

                   <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-[2.5rem] p-7 text-white shadow-xl relative overflow-hidden border border-slate-600">
                       <Bike className="absolute -right-4 -bottom-4 w-36 h-36 opacity-10 rotate-12" fill="white" />
                       <div className="relative z-10">
                           <div className="text-slate-300 text-[12px] font-bold mb-1.5 tracking-widest uppercase">총 정산 금액</div>
                           <div className="text-[40px] font-black tracking-tighter mb-6 text-white leading-none">{formatLargeMoney(metrics.totalAmt)}<span className="text-xl font-bold opacity-80 ml-1">원</span></div>
                           
                           <div className="grid grid-cols-2 gap-5 gap-y-7 border-t border-white/10 pt-6">
                              <div>
                                 <div className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-widest">배달 건수</div>
                                 <div className="text-2xl font-black text-white">{formatLargeMoney(metrics.totalCnt)}건</div>
                              </div>
                              <div>
                                 <div className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-widest">근무 시간</div>
                                 <div className="text-2xl font-black text-white">{metrics.durationStr}</div>
                              </div>
                              <div>
                                 <div className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-widest">평균 단가</div>
                                 <div className="text-2xl font-black text-white">{formatLargeMoney(metrics.perDelivery)}원</div>
                              </div>
                              <div>
                                 <div className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-widest">평균 시급</div>
                                 <div className="text-2xl font-black text-blue-400">{formatLargeMoney(metrics.hourlyRate || 0)}원</div>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-5 mt-7 pt-6 border-t border-white/10">
                              <div><div className="text-[11px] text-[#4cd1cc] font-bold mb-0.5">배민 수익</div><div className="text-xl font-black text-white">{formatLargeMoney(baeminTot)}원</div></div>
                              <div><div className="text-[11px] text-slate-300 font-bold mb-0.5">쿠팡 수익</div><div className="text-xl font-black text-white">{formatLargeMoney(coupangTot)}원</div></div>
                           </div>
                           {etcTot > 0 && (
                               <div className="mt-3 text-[11px] text-slate-400 font-bold text-right">기타(통합) 수익: {formatLargeMoney(etcTot)}원</div>
                           )}
                       </div>
                   </div>

                   {isWeekly && (
                      <div className="mt-6 pt-4 border-t border-slate-200">
                         {!isCleared ? (
                            <button 
                               onClick={() => handleClearPayday(pd)} 
                               disabled={!isPaydayReached}
                               className={`w-full py-4 rounded-[1.5rem] font-black text-lg transition-all flex items-center justify-center gap-2 ${isPaydayReached ? 'bg-blue-600 text-white shadow-lg active:scale-95' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}`}
                            >
                               {isPaydayReached ? '💰 주차별 보관함으로 이동 (입금 완료)' : '금요일부터 입금 확정이 가능합니다 ⏳'}
                            </button>
                         ) : (
                            <button 
                               onClick={() => handleUndoClearPayday(pd)} 
                               className="w-full py-4 rounded-[1.5rem] bg-slate-50 border border-slate-300 text-slate-700 font-black text-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5 shadow-sm"
                            >
                               <RefreshCw size={18}/> 다시 대기열로 되돌리기 (실수 방지)
                            </button>
                         )}
                      </div>
                   )}
                </div>
             </div>
          );
      })()}

      <button onClick={() => { setEditingDeliveryShift(null); setDeliveryFormData({ date: todayStr, amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '', startTime: '', endTime: '' }); setIsDeliveryModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-blue-600 text-white w-14 h-14 rounded-[1.5rem] shadow-[0_0_15px_rgba(37,99,235,0.6)] flex items-center justify-center active:scale-90 transition-all z-40 border border-blue-600"><Plus size={28}/></button>

      {/* 💡 [V5.23] 마감 모달: 배경 35% 연하게(bg-black/40), 투명도 조절, 입력폼 네온 컬러 튜닝 */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-end justify-center z-[90] p-0 overflow-y-auto no-scrollbar">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, handleCloseDeliveryModal)}
            className="bg-gradient-to-br from-slate-500/90 to-slate-600/90 w-full max-w-md rounded-t-[2.5rem] p-4 pb-6 shadow-2xl animate-in slide-in-from-bottom duration-300 mt-20 border-t-8 border-slate-700 flex flex-col max-h-[90vh] backdrop-blur-xl"
          >
            <div className="w-12 h-1.5 bg-slate-400 rounded-full mx-auto mb-3 shrink-0"></div>
            <div className="flex justify-between items-center mb-3 shrink-0">
               <h2 className="text-xl font-black text-white tracking-tight">{editingDeliveryShift ? '근무 기록 수정' : splitQueue.length > 0 ? '이전 시간 정산 기록' : '배달 최종 마감'}</h2>
               <button onClick={handleCloseDeliveryModal} className="bg-white/10 text-white p-2 rounded-full shadow-sm border border-white/20 hover:bg-white/20"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleDeliverySubmit} className="space-y-2 overflow-y-auto no-scrollbar pb-2">
              
              <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-400/50 w-full">
                <div className="bg-white/10 rounded-xl p-1.5 border border-white/20 shadow-sm">
                  <label className="text-[10px] font-bold text-slate-200 flex items-center gap-1 mb-0.5 ml-1"><CalendarIcon size={10} className="text-slate-100"/>날짜</label>
                  <input type="date" value={deliveryFormData.date} onChange={e=>setDeliveryFormData({...deliveryFormData, date:e.target.value})} className="w-full bg-transparent px-1 h-[24px] font-black text-[13px] outline-none text-white [color-scheme:dark]" />
                </div>
                <div className="bg-white/10 rounded-xl p-1.5 border border-white/20 shadow-sm">
                  <label className="text-[10px] font-bold text-slate-200 flex items-center gap-1 mb-0.5 ml-1"><Clock size={10} className="text-slate-100"/>시작</label>
                  <input type="time" value={deliveryFormData.startTime} onChange={e=>setDeliveryFormData({...deliveryFormData, startTime:e.target.value})} className="w-full bg-transparent px-1 h-[24px] font-black text-[13px] outline-none text-white [color-scheme:dark]" />
                </div>
                <div className="bg-white/10 rounded-xl p-1.5 border border-white/20 shadow-sm">
                  <label className="text-[10px] font-bold text-slate-200 flex items-center gap-1 mb-0.5 ml-1"><Clock size={10} className="text-slate-100"/>종료</label>
                  <input type="time" value={deliveryFormData.endTime} onChange={e=>setDeliveryFormData({...deliveryFormData, endTime:e.target.value})} className="w-full bg-transparent px-1 h-[24px] font-black text-[13px] outline-none text-white [color-scheme:dark]" />
                </div>
              </div>

              {/* 💡 [V5.23] 배민 카드: 정훈(Blue), 현아(Pink), 금액(Amber), 건수(Emerald) 컬러 분리 */}
              <div className="bg-slate-700/40 p-3 rounded-[1.2rem] shadow-sm border border-slate-500">
                <div className="font-black text-[#4cd1cc] text-[13px] mb-2 flex items-center gap-1.5"><Bike size={14}/> 배달의민족</div>
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                     <div className="flex gap-1 items-center w-full">
                        <span className="w-[50px] shrink-0 text-[15px] font-black text-blue-300 bg-white/10 border border-white/20 rounded-xl text-center flex items-center justify-center h-[44px] shadow-sm">정훈</span>
                        <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.amountJunghoonBaemin ? formatLargeMoney(deliveryFormData.amountJunghoonBaemin) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountJunghoonBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="총액" className="flex-[7] min-w-0 text-[17px] font-black bg-white/10 rounded-xl px-3 h-[44px] outline-none border border-white/20 focus:bg-white/20 focus:border-[#4cd1cc] focus:ring-2 focus:ring-[#4cd1cc]/30 transition-all text-amber-300 placeholder:text-amber-300/40" />
                        <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.countJunghoonBaemin} onChange={e => setDeliveryFormData({...deliveryFormData, countJunghoonBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="건수" className="flex-[3] min-w-0 text-[17px] font-black bg-white/10 rounded-xl px-1 h-[44px] text-center outline-none border border-white/20 focus:bg-white/20 focus:border-[#4cd1cc] focus:ring-2 focus:ring-[#4cd1cc]/30 transition-all text-emerald-300 placeholder:text-emerald-300/40" />
                     </div>
                     <NetDiffInfo earner="정훈" platform="배민" inputAmt={deliveryFormData.amountJunghoonBaemin} inputCnt={deliveryFormData.countJunghoonBaemin} date={deliveryFormData.date} />
                  </div>
                  <div className="w-full border-t border-slate-500/50"></div>
                  <div className="flex flex-col gap-1">
                     <div className="flex gap-1 items-center w-full">
                        <span className="w-[50px] shrink-0 text-[15px] font-black text-pink-300 bg-white/10 border border-white/20 rounded-xl text-center flex items-center justify-center h-[44px] shadow-sm">현아</span>
                        <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.amountHyunaBaemin ? formatLargeMoney(deliveryFormData.amountHyunaBaemin) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountHyunaBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="총액" className="flex-[7] min-w-0 text-[17px] font-black bg-white/10 rounded-xl px-3 h-[44px] outline-none border border-white/20 focus:bg-white/20 focus:border-[#4cd1cc] focus:ring-2 focus:ring-[#4cd1cc]/30 transition-all text-amber-300 placeholder:text-amber-300/40" />
                        <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.countHyunaBaemin} onChange={e => setDeliveryFormData({...deliveryFormData, countHyunaBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="건수" className="flex-[3] min-w-0 text-[17px] font-black bg-white/10 rounded-xl px-1 h-[44px] text-center outline-none border border-white/20 focus:bg-white/20 focus:border-[#4cd1cc] focus:ring-2 focus:ring-[#4cd1cc]/30 transition-all text-emerald-300 placeholder:text-emerald-300/40" />
                     </div>
                     <NetDiffInfo earner="현아" platform="배민" inputAmt={deliveryFormData.amountHyunaBaemin} inputCnt={deliveryFormData.countHyunaBaemin} date={deliveryFormData.date} />
                  </div>
                </div>
              </div>
              
              {/* 💡 [V5.23] 쿠팡 카드: 정훈(Blue), 현아(Pink), 금액(Amber), 건수(Emerald) 컬러 분리 */}
              <div className="bg-slate-700/40 p-3 rounded-[1.2rem] shadow-sm border border-slate-500">
                <div className="font-black text-blue-300 text-[13px] mb-2 flex items-center gap-1.5"><Bike size={14}/> 쿠팡이츠</div>
                <div className="space-y-2">
                   <div className="flex flex-col gap-1">
                     <div className="flex gap-1 items-center w-full">
                        <span className="w-[50px] shrink-0 text-[15px] font-black text-blue-300 bg-white/10 border border-white/20 rounded-xl text-center flex items-center justify-center h-[44px] shadow-sm">정훈</span>
                        <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.amountJunghoonCoupang ? formatLargeMoney(deliveryFormData.amountJunghoonCoupang) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountJunghoonCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="총액" className="flex-[7] min-w-0 text-[17px] font-black bg-white/10 rounded-xl px-3 h-[44px] outline-none border border-white/20 focus:bg-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all text-amber-300 placeholder:text-amber-300/40" />
                        <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.countJunghoonCoupang} onChange={e => setDeliveryFormData({...deliveryFormData, countJunghoonCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="건수" className="flex-[3] min-w-0 text-[17px] font-black bg-white/10 rounded-xl px-1 h-[44px] text-center outline-none border border-white/20 focus:bg-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all text-emerald-300 placeholder:text-emerald-300/40" />
                     </div>
                     <NetDiffInfo earner="정훈" platform="쿠팡" inputAmt={deliveryFormData.amountJunghoonCoupang} inputCnt={deliveryFormData.countJunghoonCoupang} date={deliveryFormData.date} />
                  </div>
                  <div className="w-full border-t border-slate-500/50"></div>
                  <div className="flex flex-col gap-1">
                     <div className="flex gap-1 items-center w-full">
                        <span className="w-[50px] shrink-0 text-[15px] font-black text-pink-300 bg-white/10 border border-white/20 rounded-xl text-center flex items-center justify-center h-[44px] shadow-sm">현아</span>
                        <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.amountHyunaCoupang ? formatLargeMoney(deliveryFormData.amountHyunaCoupang) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountHyunaCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="총액" className="flex-[7] min-w-0 text-[17px] font-black bg-white/10 rounded-xl px-3 h-[44px] outline-none border border-white/20 focus:bg-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all text-amber-300 placeholder:text-amber-300/40" />
                        <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.countHyunaCoupang} onChange={e => setDeliveryFormData({...deliveryFormData, countHyunaCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="건수" className="flex-[3] min-w-0 text-[17px] font-black bg-white/10 rounded-xl px-1 h-[44px] text-center outline-none border border-white/20 focus:bg-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all text-emerald-300 placeholder:text-emerald-300/40" />
                     </div>
                     <NetDiffInfo earner="현아" platform="쿠팡" inputAmt={deliveryFormData.amountHyunaCoupang} inputCnt={deliveryFormData.countHyunaCoupang} date={deliveryFormData.date} />
                  </div>
                </div>
              </div>
              
              <button type="submit" disabled={!(deliveryFormData.amountHyunaBaemin || deliveryFormData.amountHyunaCoupang || deliveryFormData.amountJunghoonBaemin || deliveryFormData.amountJunghoonCoupang)} className="w-full shrink-0 h-[50px] flex items-center justify-center bg-blue-500 mt-2 rounded-[1.2rem] text-white font-black text-lg active:scale-[0.98] shadow-[0_8px_16px_rgba(59,130,246,0.3)] hover:bg-blue-600 transition-all disabled:opacity-50 border border-blue-600">
                {editingDeliveryShift ? '수정 완료' : splitQueue.length > 0 ? '저장하고 다음 타임 쓰기' : '마감 저장'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}                                                     
        
// ==========================================
// 7. ASSETS TAB COMPONENT
// ==========================================
function AssetView({ assets, setAssets, selectedYear, selectedMonth, currentMonthKey, todayStr, user, isManageMode, currentUser }) {
  const [assetTab, setAssetTab] = useState('deposit');
  const [loanSortBy, setLoanSortBy] = useState(() => localStorage.getItem('hyunaLoanSortBy') || 'date'); 
  
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [newAssetFormData, setNewAssetFormData] = useState({ assetType: 'deposit', name: '', balance: '', principal: '', rate: '', paymentDate: '1', paymentMethod: '이자' });
  const [isPrepayModalOpen, setIsPrepayModalOpen] = useState(false);
  const [prepayFormData, setPrepayFormData] = useState({ loanId: '', date: todayStr, principalAmount: '', interestAmount: '' });
  const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);
  
  const [isManualBalanceEdit, setIsManualBalanceEdit] = useState(false);
  const [manualBalanceInput, setManualBalanceInput] = useState('');
  
  const depositAssets = useMemo(() => {
     return [...(assets?.deposits || []), ...(assets?.savings || [])].sort((a,b) => b.balance - a.balance);
  }, [assets]);
  
  const totalDeposit = depositAssets.reduce((a,b) => a + (b.balance || 0), 0);
  
  const sortedLoans = useMemo(() => {
    const loans = assets?.loans || [];
    const active = loans.filter(l => l.status !== '완납');
    const completed = loans.filter(l => l.status === '완납');
    active.sort((a, b) => {
      if (loanSortBy === 'date') return (parseInt(a.paymentDate)||31) - (parseInt(b.paymentDate)||31);
      if (loanSortBy === 'principal') return (b.principal||0) - (a.principal||0);
      if (loanSortBy === 'rate') return (parseFloat(b.rate)||0) - (parseFloat(a.rate)||0);
      return 0;
    });
    return [...active, ...completed]; 
  }, [assets?.loans, loanSortBy]);
  
  const totalPrincipal = sortedLoans.filter(l=>l.status!=='완납').reduce((a,b)=>a+(b.principal||0), 0);
  const totalMonthlyPayment = sortedLoans.filter(l=>l.status!=='완납').reduce((a,b)=>a+getMonthlyPayment(b), 0);
  const paidLoansThisMonth = sortedLoans.filter(l => l.paidMonths?.includes(currentMonthKey));
  const totalPaidThisMonth = paidLoansThisMonth.reduce((sum, l) => sum + getMonthlyPayment(l), 0);
  const totalUnpaidThisMonth = sortedLoans.filter(l => !l.paidMonths?.includes(currentMonthKey) && l.status !== '완납').reduce((sum, l) => sum + getMonthlyPayment(l), 0);
  
  const updateAsset = async (id, field, value) => {
    if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', id), { [field]: value, updatedAt: new Date().toISOString(), updatedBy: currentUser });
  }

  const deleteAsset = async (id) => {
    if(!window.confirm('이 항목을 정말 삭제하시겠습니까?\n(가계부와 연동된 데이터가 있을 경우 주의하세요)')) return;
    if (isFirebaseEnabled && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', id));
  }

  const handlePayLoanThisMonth = async (loan) => {
    if(!user || !window.confirm(`'${loan.name}' 납부를 완료하시겠습니까?`)) return;
    const newPaidMonths = [...(loan.paidMonths || []), currentMonthKey];
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { paidMonths: newPaidMonths, updatedAt: new Date().toISOString(), updatedBy: currentUser });
  };

  const handleCancelPayLoanThisMonth = async (loan) => {
    if(!user || !window.confirm(`'${loan.name}' 납부를 취소하시겠습니까?`)) return;
    const newPaidMonths = (loan.paidMonths || []).filter(m => m !== currentMonthKey);
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { paidMonths: newPaidMonths, updatedAt: new Date().toISOString(), updatedBy: currentUser });
  };
  
  const handleAddAssetItem = async (e) => {
    e.preventDefault();
    if (!newAssetFormData.name.trim() || !user) return;
    let newAsset = { assetType: newAssetFormData.assetType, name: newAssetFormData.name, updatedAt: new Date().toISOString(), updatedBy: currentUser };
    if (newAssetFormData.assetType === 'loan') {
       if (!newAssetFormData.principal) return;
       newAsset = { ...newAsset, principal: parseInt(String(newAssetFormData.principal).replace(/[^0-9]/g, '')) || 0, rate: newAssetFormData.rate, paymentMethod: newAssetFormData.paymentMethod, paymentDate: newAssetFormData.paymentDate, duration: 0, customMonthly: 0, status: '상환중', prepaymentHistory: [], paidMonths: [] };
    } else {
       if (!newAssetFormData.balance && newAssetFormData.balance !== '0') return;
       newAsset = { ...newAsset, balance: parseInt(String(newAssetFormData.balance).replace(/[^0-9]/g, '')) || 0, history: [] };
    }

    if (isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assets'), newAsset);
    
    setIsAddAssetModalOpen(false);
    setNewAssetFormData({ assetType: 'deposit', name: '', balance: '', principal: '', rate: '', paymentDate: '1', paymentMethod: '이자' });
  };
  
  const handlePrepaySubmit = async (e) => {
    e.preventDefault();
    if(!user) return;
    const pAmount = parseInt(String(prepayFormData.principalAmount).replace(/,/g, ''), 10) || 0;
    const iAmount = parseInt(String(prepayFormData.interestAmount).replace(/,/g, ''), 10) || 0;
    if (pAmount === 0 && iAmount === 0) return;
    const loan = (assets?.loans||[]).find(l => l.id === prepayFormData.loanId);
    if (!loan) return;
    const newPrincipal = Math.max(0, loan.principal - pAmount);
    const newHistoryItem = { id: Date.now().toString(), date: prepayFormData.date, principalAmount: pAmount, interestAmount: iAmount };
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { principal: newPrincipal, status: newPrincipal === 0 ? '완납' : loan.status, prepaymentHistory: [newHistoryItem, ...(loan.prepaymentHistory || [])], updatedAt: new Date().toISOString(), updatedBy: currentUser });
    setIsPrepayModalOpen(false);
  };

  const deletePrepaymentHistory = async (loanId, historyId) => {
    if(!user || !window.confirm('이력을 삭제하고 원금을 복구하시겠습니까?')) return;
    const loan = (assets?.loans||[]).find(l => l.id === loanId);
    const historyItem = (loan?.prepaymentHistory||[]).find(h => h.id === historyId);
    if (!loan || !historyItem) return;
    const restoredPrincipal = loan.principal + historyItem.principalAmount;
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { principal: restoredPrincipal, status: restoredPrincipal > 0 ? '상환중' : '완납', prepaymentHistory: (loan.prepaymentHistory||[]).filter(h => h.id !== historyId), updatedAt: new Date().toISOString(), updatedBy: currentUser });
  };

  const handleManualBalanceAdjust = async () => {
    const newBal = parseInt(manualBalanceInput.replace(/[^0-9]/g, '')) || 0;
    const diff = newBal - selectedAssetDetail.balance;
    if (diff === 0) { setIsManualBalanceEdit(false); return; }
    
    if(!window.confirm(`잔액을 ${formatLargeMoney(newBal)}원으로 수정하시겠습니까?\n차액 ${formatLargeMoney(Math.abs(diff))}원은 히스토리에 자동 기록됩니다.`)) return;
    const historyItem = { id: Date.now().toString(), date: todayStr, type: diff > 0 ? 'deposit' : 'withdraw', amount: Math.abs(diff), note: '잔액 수동 조정', category: '기타' };
    const newHistory = [historyItem, ...(selectedAssetDetail.history || [])];
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', selectedAssetDetail.id), { balance: newBal, history: newHistory, updatedAt: new Date().toISOString(), updatedBy: currentUser });
    setSelectedAssetDetail({...selectedAssetDetail, balance: newBal, history: newHistory});
    setIsManualBalanceEdit(false);
  };

  return (
    <div className="space-y-4 pb-4 pt-2 animate-in fade-in duration-500">
      <div className="flex bg-white p-1.5 rounded-2xl mx-1 mb-2 shadow-sm border border-gray-200">
        <button onClick={() => setAssetTab('deposit')} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-1.5 ${assetTab==='deposit'?'bg-indigo-500 text-white shadow-md':'text-gray-500 hover:bg-gray-50'}`}><PiggyBank size={16}/> 나의 자산(예적금)</button>
        <button onClick={() => setAssetTab('loan')} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-1.5 ${assetTab==='loan'?'bg-indigo-500 text-white shadow-md':'text-gray-500 hover:bg-gray-50'}`}><Landmark size={16}/> 나의 부채(대출)</button>
      </div>

      {assetTab === 'deposit' && (
        <section className="animate-in fade-in">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-6 text-white shadow-md relative overflow-hidden mb-4">
            <PiggyBank className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" fill="white" />
            <div className="relative z-10">
              <div className="text-indigo-100 text-[11px] font-bold mb-1 uppercase tracking-widest flex items-center gap-1"><Shield size={12}/> 우리집 총 예적금 자산</div>
              <div className="text-4xl font-black mb-1 tracking-tight leading-none">{formatLargeMoney(totalDeposit)}<span className="text-xl ml-1 font-bold opacity-80">원</span></div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-3 px-2">
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><Wallet size={16} className="text-indigo-500"/> 보유 통장 목록</h3>
            <button onClick={() => { setNewAssetFormData({...newAssetFormData, assetType: 'deposit'}); setIsAddAssetModalOpen(true); }} className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-black border border-indigo-100 flex items-center gap-1"><Plus size={12}/> 통장 추가</button>
          </div>

          <div className="space-y-3">
             {depositAssets.length === 0 && <div className="text-center bg-white py-10 rounded-3xl border border-dashed border-gray-200 text-gray-400 font-bold text-sm">등록된 통장이 없습니다.<br/>[통장 추가]를 눌러 초기 잔액을 설정하세요.</div>}
             {depositAssets.map(asset => (
                <div key={asset.id} onClick={() => setSelectedAssetDetail(asset)} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 cursor-pointer hover:bg-indigo-50/30 transition-colors active:scale-95">
                   <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                         <span className={`text-[10px] px-2 py-0.5 rounded font-black border shadow-sm ${asset.assetType === 'deposit' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{asset.assetType === 'deposit' ? '수시입출금 (예금)' : '묶어둔 돈 (적금)'}</span>
                      </div>
                      {isManageMode && <button onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }} className="text-gray-400 hover:text-red-500 bg-gray-50 p-1.5 rounded-lg shadow-sm border border-gray-200"><Trash2 size={12}/></button>}
                   </div>
                   <div className="font-black text-gray-800 text-lg mb-1 truncate">{asset.name}</div>
                   <div className="text-right">
                      <div className="text-2xl font-black text-indigo-600 tracking-tight">{formatLargeMoney(asset.balance)}<span className="text-sm text-gray-800 ml-0.5">원</span></div>
                   </div>
                </div>
             ))}
          </div>
        </section>
      )}

      {assetTab === 'loan' && (
        <section className="animate-in fade-in">
          <div className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-[2rem] p-6 text-white shadow-md relative overflow-hidden mb-4">
            <Landmark className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" fill="white" />
            <div className="relative z-10">
              <div className="text-orange-100 text-[11px] font-bold mb-1 uppercase tracking-widest">총 대출 잔액</div>
              <div className="text-4xl font-black mb-4 tracking-tight leading-none">{formatLargeMoney(totalPrincipal)}<span className="text-xl ml-1 font-bold opacity-80">원</span></div>
               <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                <div className="flex justify-between items-center"><span className="text-[11px] text-orange-100 font-bold">이번 달 총 납입 예정</span><span className="text-base font-black text-white">{formatLargeMoney(totalMonthlyPayment)}원</span></div>
                <div className="flex justify-between items-center"><span className="text-[11px] text-orange-100 font-bold">이번 달 납부 완료</span><span className="text-base font-black text-emerald-300">{formatLargeMoney(totalPaidThisMonth)}원</span></div>
                <div className="flex justify-between items-center pt-3 border-t border-orange-400/50 mt-1"><span className="text-sm text-white font-bold">이번 달 남은 납입금</span><span className="text-xl font-black text-white">{formatLargeMoney(totalUnpaidThisMonth)}원</span></div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-3 px-2">
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><List size={16} className="text-orange-500"/> 개별 대출 상세</h3>
            <div className="flex items-center gap-2">
               <button onClick={() => { setNewAssetFormData({...newAssetFormData, assetType: 'loan'}); setIsAddAssetModalOpen(true); }} className="text-[10px] bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-black border border-orange-100 flex items-center gap-1"><Plus size={12}/> 대출 추가</button>
              <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg shadow-sm border border-gray-200"><ArrowDownUp size={12} className="text-gray-400" /><select value={loanSortBy} onChange={(e) => { setLoanSortBy(e.target.value); localStorage.setItem('hyunaLoanSortBy', e.target.value); }} className="text-[10px] font-bold text-gray-600 outline-none"><option value="date">납부일순</option><option value="principal">잔액순</option><option value="rate">금리순</option></select></div>
            </div>
          </div>

          <div className="space-y-3">
            {sortedLoans.length === 0 && <div className="text-center bg-white py-10 rounded-3xl border border-dashed border-gray-200 text-gray-400 font-bold text-sm">등록된 대출이 없습니다.</div>}
            {sortedLoans.map((loan) => (
              <div key={loan.id} className={`bg-white rounded-3xl p-4 shadow-sm border ${loan.status === '완납' ? 'opacity-50 border-green-200 bg-green-50/30' : loan.paidMonths?.includes(currentMonthKey) ? 'border-orange-200 bg-orange-50/20' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2.5">
                  <span className="font-bold text-gray-800 flex items-center text-base">{loan.name} {loan.status === '완납' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-1.5"/>}</span>
                  <div className="flex items-center gap-1.5">
                    {!isManageMode && <span className="text-[10px] bg-white text-orange-600 px-2 py-0.5 rounded font-black border border-orange-100 shadow-sm">금리 {loan.rate}%</span>}
                    {loan.status !== '완납' && <div className="bg-red-50 text-red-600 px-2.5 py-1 rounded-xl font-black text-[10px] flex items-center gap-1 border border-red-100"><CalendarDays size={12}/> 매월 {loan.paymentDate}일</div>}
                  </div>
                </div>
                <div className="flex justify-between items-end mb-3">
                  <div className="flex-1">
                    <div className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-widest flex justify-between items-center">잔액
                      {isManageMode && <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200"><input type="text" inputMode="decimal" value={loan.rate || ''} onChange={(e) => updateAsset(loan.id, 'rate', e.target.value)} className="w-12 text-right text-xs font-black text-orange-600 outline-none bg-transparent" placeholder="0.0" /><span className="text-[10px] font-bold text-gray-500">%</span></div>}
                    </div>
                    {isManageMode ? <input type="text" inputMode="numeric" pattern="[0-9,]*" value={loan.principal ? formatLargeMoney(loan.principal) : ''} onChange={(e) => updateAsset(loan.id, 'principal', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)} className="w-full text-lg font-black bg-gray-50 p-2 rounded-xl outline-none border focus:border-orange-300" /> : <div className="text-xl font-black text-gray-900 tracking-tight leading-none">{formatLargeMoney(loan.principal)}<span className="text-sm ml-0.5">원</span></div>}
                  </div>
                  <div className="text-right ml-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 min-w-[100px] shadow-sm">
                    <div className="flex justify-end gap-1 mb-1">
                      {isManageMode && <div className="text-[9px] font-bold text-gray-500 bg-white px-1 py-0.5 rounded border border-gray-200 flex items-center"><input type="text" inputMode="numeric" pattern="[0-9,]*" value={loan.paymentDate || ''} onChange={(e) => updateAsset(loan.id, 'paymentDate', e.target.value)} className="w-6 text-center outline-none bg-transparent" placeholder="일"/></div>}
                      <div className="text-[10px] font-bold text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200 flex items-center shadow-sm">{isManageMode ? <select value={loan.paymentMethod} onChange={(e) => updateAsset(loan.id, 'paymentMethod', e.target.value)} className="outline-none bg-transparent"><option value="이자">이자</option><option value="원리금">원리금</option></select> : loan.paymentMethod}</div>
                    </div>
                    <div className="font-black text-[14px] text-orange-600 leading-none mt-1.5">{formatLargeMoney(getMonthlyPayment(loan))}원</div>
                  </div>
                </div>

                {isManageMode && loan.paymentMethod === '원리금' && (
                  <div className="bg-orange-50/50 p-2.5 rounded-xl mb-3 space-y-1.5 border border-orange-200 shadow-sm">
                    <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-orange-800 ml-1 flex items-center gap-1"><Timer size={10}/> 남은 상환 기간</span><div className="flex items-center gap-1"><input type="text" inputMode="numeric" pattern="[0-9,]*" value={loan.duration || ''} onChange={(e) => updateAsset(loan.id, 'duration', parseInt(e.target.value)||0)} className="w-16 text-right p-1 rounded border border-orange-200 outline-none font-black text-orange-900 bg-white" placeholder="개월" /><span className="font-bold text-orange-800">개월</span></div></div>
                    <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-orange-800 ml-1 flex items-center gap-1"><Settings size={10}/> 직접 금액 입력</span><div className="flex items-center gap-1"><input type="text" inputMode="numeric" pattern="[0-9,]*" value={loan.customMonthly || ''} onChange={(e) => updateAsset(loan.id, 'customMonthly', parseInt(e.target.value)||0)} className="w-24 text-right p-1 rounded border border-orange-200 outline-none font-black text-orange-900 bg-white" placeholder="금액" /><span className="font-bold text-orange-800">원</span></div></div>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100 mt-1">
                  <div className="flex justify-between items-center mb-1 gap-2">
                    {loan.status === '완납' ? (
                      <span className="text-xs font-black text-green-500 flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-green-200 shadow-sm w-full justify-center"><CheckCircle2 size={14}/> 완납된 대출입니다</span>
                    ) : loan.paidMonths?.includes(currentMonthKey) ? (
                      <button onClick={() => handleCancelPayLoanThisMonth(loan)} className="text-[11px] bg-green-100 text-green-700 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm flex-1 border border-green-200"><CheckCircle2 size={14}/> {selectedMonth}월 납부 취소</button>
                    ) : (
                      <button onClick={() => handlePayLoanThisMonth(loan)} className="text-[11px] bg-orange-500 text-white px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md flex-1"><CheckCircle2 size={14}/> 이번 달 납부 처리</button>
                    )}
                    {loan.principal > 0 && <button onClick={() => { setPrepayFormData({ loanId: loan.id, date: todayStr, principalAmount: '', interestAmount: '' }); setIsPrepayModalOpen(true); }} className="text-[10px] bg-white text-gray-600 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform shadow-sm border border-gray-200"><Coins size={12}/> 중도상환</button>}
                    {isManageMode && <button onClick={() => deleteAsset(loan.id)} className="text-gray-400 hover:text-red-500 bg-white p-2 rounded-xl shadow-sm border border-gray-200 ml-1"><Trash2 size={14}/></button>}
                  </div>
                  {loan.prepaymentHistory?.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {loan.prepaymentHistory.map(h => (
                        <div key={h.id} className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-100/50 shadow-sm">
                          <div><div className="text-[9px] text-gray-400 font-bold mb-0.5 flex items-center gap-1 truncate"><CalendarIcon size={10}/> {(h.date || '').replace(/-/g, '.')} 상환 완료</div><div className="text-xs font-black text-gray-800 truncate">원금 {formatLargeMoney(h.principalAmount)}원{h.interestAmount > 0 && <span className="text-gray-500 font-bold ml-1 text-[9px]"> (+이자 {formatLargeMoney(h.interestAmount)}원)</span>}</div></div>
                          {isManageMode && <button onClick={() => deletePrepaymentHistory(loan.id, h.id)} className="text-red-300 hover:text-red-500 p-1.5 bg-gray-50 rounded-lg shrink-0 border"><X size={12}/></button>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {isAddAssetModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70] overflow-y-auto no-scrollbar p-0">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, () => setIsAddAssetModalOpen(false))}
            className="bg-white w-full max-w-md rounded-t-[3rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 border-t-8 border-indigo-500 flex flex-col max-h-[90vh]"
          >
             <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
             <div className="flex justify-between items-center mb-6 shrink-0"><h2 className="text-xl font-black text-gray-800 flex items-center gap-1.5"><Landmark className="text-indigo-500" size={20}/> 새 {newAssetFormData.assetType === 'loan' ? '대출' : '통장'} 추가</h2><button onClick={() => setIsAddAssetModalOpen(false)} className="bg-gray-100 text-gray-500 p-2.5 rounded-2xl"><X size={20}/></button></div>
             <form onSubmit={handleAddAssetItem} className="space-y-4 overflow-y-auto no-scrollbar flex-1 pb-4">
               {assetTab === 'deposit' && (
                 <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-200/60 shadow-inner mb-4">
                   <button type="button" onClick={() => setNewAssetFormData({...newAssetFormData, assetType: 'deposit'})} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${newAssetFormData.assetType==='deposit'?'bg-white text-indigo-600 shadow-sm border border-indigo-100':'text-gray-500'}`}>수시 입출금 (예금)</button>
                   <button type="button" onClick={() => setNewAssetFormData({...newAssetFormData, assetType: 'savings'})} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${newAssetFormData.assetType==='savings'?'bg-white text-emerald-600 shadow-sm border border-emerald-100':'text-gray-500'}`}>묶어둔 돈 (적금)</button>
                 </div>
               )}
               
               <div><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">{newAssetFormData.assetType === 'loan' ? '대출명' : '통장명/은행명'}</label><input type="text" value={newAssetFormData.name} onChange={e => setNewAssetFormData({...newAssetFormData, name: e.target.value})} placeholder={newAssetFormData.assetType === 'loan' ? "예: 주담대, 마통" : "예: 카카오뱅크 비상금, 토스 파킹통장"} className="w-full bg-gray-50 border rounded-xl px-4 h-[48px] font-black text-sm outline-none focus:border-indigo-300" /></div>
               
               <div>
                  <label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">{newAssetFormData.assetType === 'loan' ? '대출 원금 (잔액)' : '현재 잔액 (초기 잔액)'}</label>
                  <div className="relative">
                     <input type="text" inputMode="numeric" pattern="[0-9,]*" value={newAssetFormData.assetType === 'loan' ? (newAssetFormData.principal ? formatLargeMoney(newAssetFormData.principal) : '') : (newAssetFormData.balance ? formatLargeMoney(newAssetFormData.balance) : '')} onChange={e => newAssetFormData.assetType === 'loan' ? setNewAssetFormData({...newAssetFormData, principal: e.target.value.replace(/[^0-9]/g, '')}) : setNewAssetFormData({...newAssetFormData, balance: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className="w-full text-3xl font-black border-b-4 border-gray-100 pb-2 outline-none focus:border-indigo-400 bg-transparent" />
                     <span className="absolute right-2 bottom-3 text-lg font-black text-gray-400">원</span>
                  </div>
                  {newAssetFormData.assetType !== 'loan' && <p className="text-[10px] font-bold text-indigo-500 mt-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100">현재 통장에 있는 돈을 초기 잔액으로 입력하세요.<br/>이후에는 가계부와 연동되어 자동으로 잔액이 계산됩니다.</p>}
               </div>
               
               {newAssetFormData.assetType === 'loan' && (
                 <div className="flex gap-3 w-full pt-2 animate-in fade-in">
                   <div className="flex-1"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">금리 (%)</label><input type="text" inputMode="decimal" value={newAssetFormData.rate} onChange={e => setNewAssetFormData({...newAssetFormData, rate: e.target.value})} placeholder="0.0" className="w-full bg-gray-50 border rounded-xl px-3 h-[48px] font-black text-sm outline-none text-center" /></div>
                   <div className="flex-1"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">매월 납부일</label><input type="text" inputMode="numeric" pattern="[0-9,]*" value={newAssetFormData.paymentDate} onChange={e => setNewAssetFormData({...newAssetFormData, paymentDate: e.target.value.replace(/[^0-9]/g, '')})} placeholder="1" className="w-full bg-gray-50 border rounded-xl px-3 h-[48px] font-black text-sm outline-none text-center" /></div>
                   <div className="flex-1"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">상환 방식</label><select value={newAssetFormData.paymentMethod} onChange={e => setNewAssetFormData({...newAssetFormData, paymentMethod: e.target.value})} className="w-full bg-gray-50 border rounded-xl px-3 h-[48px] font-black text-sm outline-none text-center appearance-none"><option value="이자">이자</option><option value="원리금">원리금</option></select></div>
                 </div>
               )}
               <button type="submit" disabled={!newAssetFormData.name.trim() || (newAssetFormData.assetType === 'loan' ? !newAssetFormData.principal : (!newAssetFormData.balance && newAssetFormData.balance !== '0'))} className={`w-full mt-6 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 shadow-xl border disabled:opacity-50 ${newAssetFormData.assetType === 'loan' ? 'bg-orange-500 border-orange-600' : 'bg-indigo-600 border-indigo-700'}`}>{newAssetFormData.assetType === 'loan' ? '대출 등록 완료' : '통장 등록 완료'}</button>
             </form>
          </div>
        </div>
      )}

      {isPrepayModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[60] overflow-y-auto no-scrollbar p-0">
           <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, () => setIsPrepayModalOpen(false))}
            className="bg-white w-full max-w-md rounded-t-[3rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 mt-20 border-t-8 border-orange-500 flex flex-col max-h-[90vh]"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
            <div className="flex justify-between items-center mb-6 shrink-0"><h2 className="text-2xl font-black flex items-center gap-2 text-gray-800"><Coins size={24} className="text-orange-500"/> 상환 이력 추가</h2><button onClick={() => setIsPrepayModalOpen(false)} className="bg-orange-50 text-orange-500 p-2.5 rounded-2xl"><X size={20}/></button></div>
            <form onSubmit={handlePrepaySubmit} className="space-y-5 overflow-y-auto no-scrollbar flex-1 pb-4">
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100"><span className="text-xs font-bold text-orange-600 block mb-1">상환 대상 대출</span><span className="font-black text-orange-900 text-lg">{(assets?.loans||[]).find(l => l.id === prepayFormData.loanId)?.name}</span></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">상환 원금</label><input type="text" inputMode="numeric" pattern="[0-9,]*" value={prepayFormData.principalAmount ? formatLargeMoney(prepayFormData.principalAmount) : ''} onChange={e => setPrepayFormData({...prepayFormData, principalAmount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className="w-full text-3xl font-black border-b-4 border-gray-100 pb-2 outline-none focus:border-orange-400 bg-transparent" /></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">납부 이자</label><input type="text" inputMode="numeric" pattern="[0-9,]*" value={prepayFormData.interestAmount ? formatLargeMoney(prepayFormData.interestAmount) : ''} onChange={e => setPrepayFormData({...prepayFormData, interestAmount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className="w-full text-3xl font-black border-b-4 border-gray-100 pb-2 outline-none focus:border-orange-400 bg-transparent" /></div>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 ml-2 block uppercase">상환 날짜</label><input type="date" value={prepayFormData.date} onChange={e=>setPrepayFormData({...prepayFormData, date:e.target.value})} className="w-full bg-gray-50 rounded-xl px-3.5 h-[48px] font-bold text-sm outline-none border focus:border-orange-300" /></div>
              <button type="submit" disabled={!prepayFormData.principalAmount && !prepayFormData.interestAmount} className="w-full bg-orange-500 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 shadow-xl border border-orange-600 mt-4">상환 처리 완료</button>
            </form>
          </div>
        </div>
      )}

      {selectedAssetDetail && (() => {
         const monthHistory = (selectedAssetDetail.history || []).filter(h => h.date.startsWith(currentMonthKey));
         const monthIn = monthHistory.filter(h => h.type === 'deposit' && h.note !== '잔액 수동 조정').reduce((acc, curr) => acc + curr.amount, 0);
         const monthOut = monthHistory.filter(h => h.type === 'withdraw' && h.note !== '잔액 수동 조정').reduce((acc, curr) => acc + curr.amount, 0);
         return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[80] overflow-hidden p-0">
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, () => { setSelectedAssetDetail(null); setIsManualBalanceEdit(false); })}
              className={`bg-white w-full max-w-md rounded-t-[3rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom flex flex-col h-[85vh] border-t-8 ${selectedAssetDetail.assetType === 'deposit' ? 'border-blue-500' : 'border-emerald-500'}`}
            >
               <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
               <div className="flex justify-between items-start mb-4 shrink-0">
                  <div className="flex-1">
                     <span className={`text-[10px] px-2 py-0.5 rounded font-black border shadow-sm mb-2 inline-block ${selectedAssetDetail.assetType === 'deposit' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{selectedAssetDetail.assetType === 'deposit' ? '수시입출금 (예금)' : '묶어둔 돈 (적금)'}</span>
                     <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedAssetDetail.name}</h2>
                     
                     {isManualBalanceEdit ? (
                        <div className="flex items-center gap-2 mt-2">
                           <input type="text" inputMode="numeric" pattern="[0-9,]*" autoFocus value={manualBalanceInput ? formatLargeMoney(manualBalanceInput) : ''} onChange={e => setManualBalanceInput(e.target.value.replace(/[^0-9]/g, ''))} placeholder="새로운 잔액" className="w-40 text-2xl font-black bg-gray-50 border-b-2 border-indigo-400 outline-none px-2 py-1" />
                           <button onClick={handleManualBalanceAdjust} className="bg-indigo-500 text-white text-xs font-black px-3 py-2 rounded-lg shadow-sm">저장</button>
                           <button onClick={() => setIsManualBalanceEdit(false)} className="bg-gray-100 text-gray-500 text-xs font-black px-3 py-2 rounded-lg">취소</button>
                        </div>
                     ) : (
                        <div className="text-3xl font-black text-indigo-600 mt-1 flex items-center gap-2">
                           {formatLargeMoney(selectedAssetDetail.balance)}<span className="text-base text-gray-800 ml-0.5">원</span>
                           <button onClick={() => { setIsManualBalanceEdit(true); setManualBalanceInput(String(selectedAssetDetail.balance)); }} className="text-[10px] bg-gray-50 border border-gray-200 text-gray-500 px-2 py-1 rounded shadow-sm hover:bg-gray-100 active:scale-95"><Edit3 size={10} className="inline mr-1"/>수정</button>
                        </div>
                     )}
                  </div>
                  <button onClick={() => { setSelectedAssetDetail(null); setIsManualBalanceEdit(false); }} className="bg-gray-100 text-gray-500 p-2.5 rounded-2xl active:scale-95 shrink-0"><X size={20}/></button>
               </div>
               
               <div className="overflow-y-auto no-scrollbar flex-1 pb-4 border-t border-gray-100 pt-4">
                  <div className="bg-gray-50 rounded-2xl p-3 mb-4 border border-gray-200 flex justify-between items-center shadow-inner">
                     <div className="text-center flex-1 border-r border-gray-200"><div className="text-[10px] font-bold text-blue-500 mb-0.5">{selectedMonth}월 입금</div><div className="text-sm font-black text-blue-600">+{formatLargeMoney(monthIn)}</div></div>
                     <div className="text-center flex-1"><div className="text-[10px] font-bold text-rose-500 mb-0.5">{selectedMonth}월 출금</div><div className="text-sm font-black text-rose-600">-{formatLargeMoney(monthOut)}</div></div>
                  </div>

                  <div className="space-y-3">
                    {monthHistory.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">{selectedMonth}월 입출금 내역이 없습니다 🍃</div>
                    ) : (
                        monthHistory.map(h => (
                          <div key={h.id} className={`bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex justify-between items-center ${h.note === '잔액 수동 조정' ? 'bg-amber-50/30' : ''}`}>
                            <div>
                              <div className="text-[10px] font-bold text-gray-400 mb-1">{h.date.replace(/-/g, '.')}</div>
                              <div className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                                 <span className={`text-[9px] px-1.5 py-0.5 rounded border ${h.type === 'deposit' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>{h.type === 'deposit' ? '입금' : '출금'}</span>
                                 {h.note || h.category}
                              </div>
                            </div>
                            <div className={`font-black text-lg ${h.type === 'deposit' ? 'text-blue-600' : 'text-rose-600'}`}>
                               {h.type === 'deposit' ? '+' : '-'}{formatLargeMoney(h.amount)}원
                            </div>
                          </div>
                        ))
                    )}
                  </div>
               </div>
            </div>
         </div>
         );
      })()}
    </div>
  );
}

// ==========================================
// 8. FAMILY CALENDAR COMPONENT 
// ==========================================
function FamilyCalendarView({ events, setEvents, messages, setMessages, selectedYear, selectedMonth, currentMonthKey, todayStr, currentUser, user, isManageMode, activeTab, customHolidays, updateSettings, userSettings }) {
  const [calendarSubTab, setCalendarSubTab] = useState('timeline');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);

  const [calYear, setCalYear] = useState(selectedYear);
  const [calMonth, setCalMonth] = useState(selectedMonth);
  useEffect(() => {
    setCalYear(selectedYear);
    setCalMonth(selectedMonth);
  }, [selectedYear, selectedMonth]);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  
  const [eventFormData, setEventFormData] = useState({ 
    date: todayStr, endDate: '', title: '', type: '가족일정', isImportant: false, 
    participant: '가족', isYearly: false, calendarType: 'solar' 
  });
  const [isMessageHistoryOpen, setIsMessageHistoryOpen] = useState(false);
  const [messageFormData, setMessageFormData] = useState({ text: '' });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [selectedDutyEditDate, setSelectedDutyEditDate] = useState(null);
  const [isDutyEditModalOpen, setIsDutyEditModalOpen] = useState(false);
  const [isDutyEditing, setIsDutyEditing] = useState(false);
  const [isDutyBatchModalOpen, setIsDutyBatchModalOpen] = useState(false);
  const [isDutyBatchEditMode, setIsDutyBatchEditMode] = useState(false);
  const [dutyBatchMode, setDutyBatchMode] = useState('touch'); 
  const [dutyBatchYear, setDutyBatchYear] = useState(selectedYear);
  const [dutyBatchMonth, setDutyBatchMonth] = useState(selectedMonth);
  const [batchDuties, setBatchDuties] = useState({}); 
  const [selectedStamp, setSelectedStamp] = useState('DAY');
  const [continuousCursorDateStr, setContinuousCursorDateStr] = useState('');
  const dutyTimelineRef = useRef(null); 
  
  const [isAllImportantEventsModalOpen, setIsAllImportantEventsModalOpen] = useState(false);

  // 💡 [V5.21] 타임라인 과거/미래 토글 상태 추가 ('future'가 기본값)
  const [timelineMode, setTimelineMode] = useState('future');

  const extendedDutyDays = useMemo(() => Array.from({length: 32}, (_, i) => { const d = new Date(); d.setDate(d.getDate() + (i - 2)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }), []);
  
  const topImportantEvents = useMemo(() => {
    return (events || [])
      .filter(e => {
        if (!e.isImportant || !e.date) return false;
        const end = e.endDate || e.date;
        if (end < todayStr) return false; 
        
        const today = new Date(todayStr);
        const target = new Date(e.date);
        
        if(isNaN(target.getTime())) return false;
        
        const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 10;
      })
      .sort((a,b) => (a.date||'').localeCompare(b.date||''))
      .slice(0, 3);
  }, [events, todayStr]);

  const allFutureImportantEvents = useMemo(() => {
    return (events || [])
      .filter(e => e.isImportant && e.date && (e.endDate || e.date) >= todayStr)
      .sort((a,b) => (a.date||'').localeCompare(b.date||''));
  }, [events, todayStr]);

  const familyEventsList = useMemo(() => (events || []).filter(e => e.type !== '듀티' && e.date).sort((a, b) => (a.date||'').localeCompare(b.date||'')), [events]);
  
  // 💡 [V5.22] 타임라인 역스크롤 마법
  const timelineEventsList = useMemo(() => {
    if (timelineMode === 'future') {
      return familyEventsList.filter(e => (e.endDate || e.date) >= todayStr);
    } else {
      // 과거 일정: 오름차순 유지 (오래된 게 위로, 최근이 아래로 배치됨)
      return familyEventsList.filter(e => (e.endDate || e.date) < todayStr);
    }
  }, [familyEventsList, todayStr, timelineMode]);

  // 💡 [V5.22] 과거 타임라인 진입 시 스크롤 맨 밑바닥으로 자동 이동시키는 마법
  useEffect(() => {
    if (calendarSubTab === 'timeline' && timelineMode === 'past') {
      const timer = setTimeout(() => {
        const el = document.getElementById('timeline-scroll-area');
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [calendarSubTab, timelineMode, timelineEventsList.length]);

  const activeMessages = useMemo(() => (messages || []).filter(m => !m.isChecked).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [messages]);
  const archivedMessages = useMemo(() => (messages || []).filter(m => m.isChecked && !m.isSystemLog).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [messages]);
  
  const getSmartIcon = (title, type) => {
    const t = title || '';
    if (t.includes('생일') || t.includes('생신') || t.includes('탄생')) return '🎂';
    if (t.includes('여행') || t.includes('휴가') || t.includes('비행기')) return '✈️';
    if (t.includes('병원') || t.includes('검진') || t.includes('치과')) return '🏥';
    if (t.includes('결혼') || t.includes('기념일') || t.includes('웨딩')) return '💍';
    if (t.includes('식사') || t.includes('저녁') || t.includes('외식') || t.includes('파티')) return '🍽️';
    if (t.includes('학교') || t.includes('입학') || t.includes('졸업') || t.includes('학부모')) return '🏫';
    if (t.includes('캠핑') || t.includes('글램핑') || t.includes('차박')) return '⛺';
    if (t.includes('쇼핑') || t.includes('마트') || t.includes('백화점')) return '🛒';
    if (type === '가족일정') return '💖';
    if (type === '회식') return '🍻';
    return '⭐'; 
  };

  useEffect(() => {
    if(isDutyBatchModalOpen) {
      setContinuousCursorDateStr(`${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}-01`);
      const current = {};
      events.forEach(e => { if(e.type === '듀티' && e.date && e.date.startsWith(`${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}`)) current[e.date] = e.title; });
      setBatchDuties(current);
    }
  }, [dutyBatchYear, dutyBatchMonth, isDutyBatchModalOpen, events]);

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventFormData.title.trim() || !user) return;
    const finalData = { ...eventFormData, updatedAt: new Date().toISOString(), updatedBy: currentUser };
    if (!finalData.endDate || finalData.endDate < finalData.date) {
      finalData.endDate = finalData.date;
    }

    if (editingEventId) {
      if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEventId), finalData);
      else setEvents(events.map(ev => ev.id === editingEventId ? {...finalData, id: editingEventId} : ev));
    } else {
      if (isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), finalData);
      else setEvents([{...finalData, id: Date.now().toString()}, ...(events||[])]);
    }
    setIsEventModalOpen(false); setEditingEventId(null); setSelectedEventDetail(null);
  };

  const deleteEvent = async (id) => {
    if(!window.confirm('일정을 삭제하시겠습니까?')) return;
    if (isFirebaseEnabled && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id));
    else setEvents((events||[]).filter(e => e.id !== id));
    setSelectedEventDetail(null); setSelectedCalendarDate(null);
  };

  const handleSendMessage = async () => {
    if(!messageFormData.text.trim() || !user) return;
    const d = new Date();
    let hh = d.getHours();
    const ampm = hh >= 12 ? '오후' : '오전';
    hh = hh % 12 || 12;
    const timeStr = `${ampm} ${hh}:${String(d.getMinutes()).padStart(2,'0')}`;
    
    const newMsg = { author: currentUser, text: messageFormData.text, createdAt: todayStr, time: timeStr, isChecked: false, replies: [], isoUpdate: new Date().toISOString() };
    if (isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), newMsg);
    else setMessages([{...newMsg, id: Date.now().toString()}, ...messages]);
    setMessageFormData({ text: '' });
  };

  const handleAddReplySubmit = async (msgId) => {
    if (!replyText.trim() || !user) return;
    const msg = messages.find(m => m.id === msgId);
    const newReply = { id: Date.now().toString(), author: currentUser, text: replyText, createdAt: todayStr };
    const updatedReplies = [...(msg.replies || []), newReply];
    
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId), { replies: updatedReplies, isoUpdate: new Date().toISOString() });
    else setMessages(messages.map(m => m.id === msgId ? { ...m, replies: updatedReplies, isoUpdate: new Date().toISOString() } : m));
    setReplyText(''); setReplyingTo(null);
  };

  const handleCheckMessage = async (id) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    if (msg.author === '시스템' || msg.isSystemLog) {
      if (isFirebaseEnabled && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', id));
      else setMessages(messages.filter(m => m.id !== id));
    } else {
      if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', id), { isChecked: true, checkedAt: todayStr });
      else setMessages(messages.map(m => m.id === id ? { ...m, isChecked: true, checkedAt: todayStr } : m));
    }
  };

  const handleQuickDutyUpdate = async (dateStr, newDuty) => {
    if (!user) return;
    const existingEvent = events.find(e => e.date === dateStr && e.type === '듀티');
    let changed = false;
    if (newDuty === 'DELETE') {
      if (existingEvent) {
         if (isFirebaseEnabled) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', existingEvent.id));
         else setEvents(events.filter(e => e.id !== existingEvent.id));
         changed = true;
      }
    } else {
      if (existingEvent) {
         if (existingEvent.title !== newDuty) {
           if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', existingEvent.id), { title: newDuty, updatedAt: new Date().toISOString(), updatedBy: currentUser });
           else setEvents(events.map(e => e.id === existingEvent.id ? { ...e, title: newDuty } : e));
           changed = true;
         }
      } else {
         const newEvent = { type: '듀티', title: newDuty, date: dateStr, isImportant: false, updatedAt: new Date().toISOString(), updatedBy: currentUser };
         if (isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), newEvent);
         else setEvents([{...newEvent, id: Date.now().toString()}, ...events]);
         changed = true;
      }
    }
    if (changed) {
      const msgText = `- ${parseInt(dateStr.slice(5,7))}월 ${parseInt(dateStr.slice(8,10))}일: ${existingEvent ? existingEvent.title : 'OFF'} ➔ ${newDuty === 'DELETE' ? '삭제됨' : newDuty}`;
      const d = new Date(); 
      let hh = d.getHours();
      const ampm = hh >= 12 ? '오후' : '오전';
      hh = hh % 12 || 12;
      const timeStr = `${ampm} ${hh}:${String(d.getMinutes()).padStart(2,'0')}`;
      const newMsg = { author: '시스템', title: `${currentUser}님의 듀티변경`, text: msgText, createdAt: todayStr, time: timeStr, isChecked: false, isSystemLog: true };
      if (isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), newMsg);
      else setMessages([{...newMsg, id: Date.now().toString()}, ...messages]);
    }
    setIsDutyEditModalOpen(false);
  };

  const openDutyBatchModal = () => {
    setDutyBatchYear(selectedYear); setDutyBatchMonth(selectedMonth); setDutyBatchMode('touch'); setIsDutyBatchEditMode(false); setSelectedStamp('DAY');
    setContinuousCursorDateStr(`${selectedYear}-${String(selectedMonth).padStart(2,'0')}-01`);
    setIsDutyBatchModalOpen(true);
  };

  const handleContinuousStamp = (duty) => {
    if (duty === 'BACK') {
       const d = new Date(continuousCursorDateStr);
       d.setDate(d.getDate() - 1);
       const prevStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
       if (prevStr.startsWith(`${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}`)) {
          setContinuousCursorDateStr(prevStr);
          setBatchDuties(prev => { const next = {...prev}; delete next[prevStr]; return next; });
       }
       return;
    }
    setBatchDuties(prev => ({...prev, [continuousCursorDateStr]: duty === 'DELETE' ? null : duty}));
    const d = new Date(continuousCursorDateStr);
    d.setDate(d.getDate() + 1);
    const nextStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (nextStr.startsWith(`${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}`)) {
        setContinuousCursorDateStr(nextStr);
    }
  };

  const saveBatchDuties = async () => {
    if(!user) return;
    const monthPrefix = `${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}`;
    const oldDuties = events.filter(e => e.type === '듀티' && e.date.startsWith(monthPrefix));
    if (isFirebaseEnabled) {
      for (const e of oldDuties) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', e.id));
      for (const [date, title] of Object.entries(batchDuties)) {
        if(title) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { type: '듀티', title, date, isImportant: false, updatedAt: new Date().toISOString(), updatedBy: currentUser });
      }
    }
    setIsDutyBatchModalOpen(false); alert(`${dutyBatchMonth}월 스케쥴 저장완료!`);
  };

  const toggleCustomHoliday = async (dateStr) => {
     if (!user) return;
     let newHolidays = [...customHolidays];
     if (newHolidays.includes(dateStr)) {
         newHolidays = newHolidays.filter(d => d !== dateStr);
     } else {
         newHolidays.push(dateStr);
     }
     await updateSettings('customHolidays', newHolidays);
  };

  return (
    <div className="space-y-4 pb-4 pt-2 animate-in fade-in duration-500">
      
      {/* 한줄톡 */}
      <div className="bg-pink-50/80 rounded-3xl p-5 border border-pink-200/60 shadow-sm relative">
         <h3 className="text-xs font-black text-pink-500 mb-3 flex justify-between items-center">
            <span className="flex items-center gap-1"><MessageSquareHeart size={14}/> 현아&정훈 한줄톡 💌</span>
            <button onClick={() => setIsMessageHistoryOpen(true)} className="text-pink-400 font-bold border-b border-pink-300 pb-0.5 active:text-pink-600 transition-colors">📮 지난 톡 꺼내보기</button>
         </h3>
         
         <div className="space-y-3 mb-4">
            {activeMessages.map(m => {
              if (m.isSystemLog || m.author === '시스템') {
                return (
                  <div key={m.id} className="bg-emerald-50 p-3 rounded-2xl shadow-sm border border-emerald-100/50 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-2">
                          <span className="bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-black shrink-0">시스템 알림</span>
                          <span className="text-[10px] font-bold text-emerald-600/70">{typeof m.createdAt === 'string' && m.createdAt.slice(5).replace('-','/')} {m.time}</span>
                       </div>
                       <button onClick={() => handleCheckMessage(m.id)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg text-[9px] font-black active:scale-95 flex items-center gap-1 shrink-0"><CheckCircle2 size={10}/> 확인</button>
                    </div>
                    <div className="text-xs font-bold text-emerald-800 leading-relaxed whitespace-pre-wrap pl-1 border-l-2 border-emerald-200 ml-1">{m.text}</div>
                  </div>
                )
              }
              return (
                <div key={m.id} className={`bg-white p-4 rounded-2xl shadow-sm border ${m.author === '현아' ? 'border-pink-200/50' : 'border-blue-200/50'}`}>
                   <div className="flex justify-between items-start mb-1.5">
                       <div>
                         <div className="text-[10px] text-gray-400 font-bold mb-1.5 flex items-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded text-white ${m.author === '현아' ? 'bg-pink-400' : 'bg-blue-400'}`}>{m.author}</span>
                            {typeof m.createdAt === 'string' && m.createdAt.slice(5).replace('-','/')} {m.time}
                         </div>
                         <div className="text-base font-black text-gray-800 leading-relaxed break-all">{m.text}</div>
                       </div>
                   </div>
                   {(m.replies || []).length > 0 && <div className="mt-3 space-y-1.5 pl-3 border-l-[3px] border-gray-100 py-1">{m.replies.map(r => <div key={r.id} className="flex flex-col bg-gray-50/80 p-3 rounded-xl border border-gray-100/50"><div className="text-[10px] font-bold text-gray-400 mb-1"><span className={`${r.author === '현아' ? 'text-pink-500' : 'text-blue-500'}`}>{r.author}</span></div><div className="text-sm font-black text-gray-700">{r.text}</div></div>)}</div>}
                   {replyingTo === m.id ? (
                     <div className="mt-3 flex gap-1.5 bg-gray-50 p-1.5 rounded-2xl border"><input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={`${currentUser}(으)로 답글...`} className="flex-1 bg-white text-sm font-bold rounded-xl px-3 py-2 outline-none border" /><button onClick={() => handleAddReplySubmit(m.id)} className="bg-gray-800 text-white px-3 rounded-xl text-xs font-black active:scale-95">등록</button><button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="bg-white text-gray-500 px-2 rounded-xl border"><X size={14}/></button></div>
                   ) : (
                     <div className="flex justify-end gap-1.5 mt-3 pt-3 border-t border-gray-50">
                        <button onClick={() => setReplyingTo(m.id)} className="text-[11px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border flex items-center gap-1 hover:bg-gray-100 transition-colors"><MessageSquareHeart size={14}/> 답글</button>
                        <button onClick={() => handleCheckMessage(m.id)} className="text-[11px] font-black text-gray-500 bg-gray-50 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-colors"><CheckCircle2 size={14}/> 💌 다 읽었어!</button>
                     </div>
                   )}
                </div>
              )
            })}
         </div>

         <div className="flex gap-2 relative mt-2 w-full">
            {messageFormData.text.length > 0 && (
              <div className="absolute -top-7 left-1 animate-in slide-in-from-bottom-2 fade-in duration-200">
                <span className={`text-[10px] font-black px-2 py-1 rounded-t-lg text-white ${currentUser === '현아' ? 'bg-pink-500' : 'bg-blue-600'}`}>{currentUser} 작성중</span>
              </div>
            )}
            <input value={messageFormData.text} onChange={e => setMessageFormData({...messageFormData, text: e.target.value})} placeholder={activeMessages.length === 0 ? "새로운 메시지가 없습니다. 첫 톡을 남겨보세요! ✍️" : "여보 오늘 저녁은 뭐야? 🍗"} className="flex-1 min-w-0 bg-white rounded-2xl px-4 py-3.5 text-base font-bold outline-none border border-pink-200 shadow-sm" />
            <button onClick={handleSendMessage} disabled={!messageFormData.text.trim()} className="shrink-0 whitespace-nowrap bg-pink-500 text-white px-4 rounded-2xl font-black shadow-md disabled:opacity-50">전송</button>
         </div>
      </div>

      <div>
        <div className="flex justify-between items-center px-2 mb-1">
          <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><Stethoscope size={16} className="text-pink-500"/> 현아 근무 스케줄</h3>
          <button onClick={openDutyBatchModal} className="text-[10px] bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full font-bold border border-pink-200 shadow-sm">+ 한달스케쥴 확인/수정</button>
        </div>
        
        <div className="relative pt-4">
          <div ref={dutyTimelineRef} className="flex overflow-x-auto no-scrollbar gap-2 px-2 pb-4 pt-1">
            {extendedDutyDays.map((d) => {
              const dutyEvent = events.find(e => e.date === d && e.type === '듀티');
              const duty = dutyEvent ? dutyEvent.title : 'OFF';
              const isToday = d === todayStr;
              let dutyColor = duty === 'DAY' ? 'bg-blue-50 text-blue-600 border-blue-200' : duty === 'EVE' ? 'bg-orange-50 text-orange-600 border-orange-200' : duty === 'OFF' ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-white text-gray-400 border-gray-200';
              return (
                <div key={d} id={isToday ? 'duty-today' : undefined} onClick={() => { setSelectedDutyEditDate(d); setIsDutyEditing(false); setIsDutyEditModalOpen(true); }} 
                     className={`flex-none w-[64px] py-1.5 px-2.5 rounded-[1.2rem] border shadow-sm flex flex-col items-center justify-center cursor-pointer relative transition-all ${dutyColor} ${isToday ? 'ring-2 ring-pink-400 ring-offset-1 scale-105 z-10 shadow-sm' : ''}`}>
                  {isToday && <div className={`text-[10px] font-black text-gray-800 mb-0.5 absolute -top-3.5 bg-white px-2 py-0.5 rounded-full border border-gray-300 shadow-sm whitespace-nowrap z-20`}>TODAY</div>}
                  <div className="text-[10px] font-bold mb-1 mt-1">{parseInt(d.slice(5,7))}/{parseInt(d.slice(8,10))}</div>
                  <div className="text-xs font-black">{['일','월','화','수','목','금','토'][new Date(d).getDay()]}</div>
                  <div className="mt-2 text-sm font-black tracking-tighter">{duty}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {allFutureImportantEvents.length > 0 && (
        <div className="bg-gradient-to-br from-pink-400 to-rose-400 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
          <Star className="absolute -right-2 -bottom-2 w-24 h-24 opacity-10 rotate-12" fill="white" />
          <div className="flex justify-between items-center mb-3 relative z-10">
            <h3 className="text-[11px] font-bold opacity-90 flex items-center gap-1.5"><Target size={14}/> 다가오는 중요 일정</h3>
            <button onClick={() => setIsAllImportantEventsModalOpen(true)} className="text-[9px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg font-bold transition-colors">전체 {allFutureImportantEvents.length}개 보기</button>
          </div>
          <div className="space-y-1.5 relative z-10">
            {topImportantEvents.length > 0 ? (
               topImportantEvents.map(e => (
                  <div key={e.id} onClick={() => setSelectedEventDetail(e)} className="bg-white/20 py-3 px-4 rounded-xl flex items-center justify-between gap-2 cursor-pointer active:scale-95 transition-transform">
                   <div className="flex items-center gap-2.5 truncate">
                     <div className="bg-white text-pink-600 px-2 py-1 rounded-lg text-[10px] font-black shrink-0 text-center shadow-sm"><div>{parseInt((e.date||'').slice(5,7))}/{parseInt((e.date||'').slice(8,10))}</div><div>{['일','월','화','수','목','금','토'][new Date(e.date||todayStr).getDay()]}</div></div>
                     <div className="font-bold text-base truncate">{e.title}</div>
                   </div>
                   <div className="bg-amber-400 text-amber-900 px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 shadow-sm border border-amber-300">
                     {getDDay(e.date)}
                   </div>
                  </div>
               ))
            ) : (
               <div className="text-center py-2 text-[10px] font-bold text-white/80 bg-black/10 rounded-xl">D-10 이내에 예정된 일정이 없습니다.</div>
            )}
          </div>
        </div>
      )}

      {isAllImportantEventsModalOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-end p-0 overflow-hidden">
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, () => setIsAllImportantEventsModalOpen(false))}
              className="bg-white w-full max-w-md rounded-t-[3rem] p-6 shadow-2xl flex flex-col h-[80vh] animate-in slide-in-from-bottom border-t-8 border-pink-500"
            >
               <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
               <div className="flex justify-between items-center mb-4 shrink-0">
                  <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><Star size={20} className="text-amber-400 fill-amber-400"/> 등록된 중요 일정 전체보기</h3>
                  <button onClick={() => setIsAllImportantEventsModalOpen(false)} className="bg-gray-100 p-2 rounded-full active:scale-95"><X size={20}/></button>
               </div>
               <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10 border-t border-gray-100 pt-4">
                  {allFutureImportantEvents.map(e => (
                     <div key={e.id} onClick={() => { setIsAllImportantEventsModalOpen(false); setSelectedEventDetail(e); }} className="bg-gray-50 border border-gray-100 rounded-2xl shadow-sm p-4 flex justify-between items-center hover:bg-pink-50 transition-colors cursor-pointer active:scale-95">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className="text-2xl bg-white w-10 h-10 flex justify-center items-center rounded-full shadow-sm shrink-0 border border-gray-100">{getSmartIcon(e.title, e.type)}</div>
                           <div className="truncate">
                            <div className="flex items-center gap-1 mb-0.5">
                               <span className="text-[10px] font-bold text-gray-500">{e.date.replace(/-/g, '.')}</span>
                            </div>
                            <div className="font-black text-base text-gray-800 flex items-center gap-1 truncate">{e.title}</div>
                          </div>
                        </div>
                        <div className="bg-amber-100 text-amber-600 px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 shadow-sm border border-amber-200">
                           {getDDay(e.date)}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}

      <div className="flex bg-pink-100 p-1.5 rounded-2xl mx-1 mb-2 shadow-inner border border-pink-200">
        <button onClick={() => setCalendarSubTab('timeline')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${calendarSubTab==='timeline'?'bg-white text-pink-600 shadow-sm border border-pink-200':'text-gray-500'}`}><List size={14}/> 타임라인</button>
        <button onClick={() => setCalendarSubTab('calendar')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${calendarSubTab==='calendar'?'bg-white text-pink-600 shadow-sm border border-pink-200':'text-gray-500'}`}><CalendarDays size={14}/> 월간 달력</button>
      </div>

      {calendarSubTab === 'timeline' && (
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-200 animate-in slide-in-from-left duration-300 mt-1">
          <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5 mb-4"><CalendarDays size={16} className="text-pink-500"/> 가족 일정 타임라인</h3>
          
          <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-5 shadow-inner border border-gray-200">
             <button onClick={() => setTimelineMode('future')} className={`flex-1 py-3 rounded-xl text-[13px] font-black transition-all ${timelineMode==='future'?'bg-white text-pink-600 shadow-sm border border-pink-200':'text-gray-500 hover:bg-gray-100'}`}>✨ 함께 걸어갈 길</button>
             <button onClick={() => setTimelineMode('past')} className={`flex-1 py-3 rounded-xl text-[13px] font-black transition-all ${timelineMode==='past'?'bg-white text-blue-600 shadow-sm border border-blue-200':'text-gray-500 hover:bg-gray-100'}`}>👣 우리가 걸어온 길</button>
          </div>

          <div id="timeline-scroll-area" className="max-h-[500px] overflow-y-auto no-scrollbar relative rounded-xl bg-gray-50/30 p-2">
             <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent pb-10">
               
               {timelineEventsList.length === 0 && <div className="text-center text-gray-400 py-10 font-bold text-sm">{timelineMode === 'future' ? '다가오는 일정이 없습니다. 🌿' : '지난 일정이 없습니다. 🍃'}</div>}
               
               {timelineEventsList.map((e, i, arr) => {
                 const isTodayEvent = timelineMode === 'future' && e.date <= todayStr && (e.endDate || e.date) >= todayStr;
                 // 💡 [V5.22] 과거 모드일 때 가장 마지막(최근) 아이템 식별
                 const isMostRecentPast = timelineMode === 'past' && i === arr.length - 1;
                 const isHighlighted = isTodayEvent || isMostRecentPast;
                 
                 return (
                   <div key={e.id} id={isHighlighted ? 'timeline-highlight' : undefined}>
                     {(i === 0 || e.date?.slice(0,7) !== arr[i-1].date?.slice(0,7)) && (
                       <div className="relative flex items-center justify-center py-4">
                         <div className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full z-10 border shadow-sm">
                           {e.date.slice(0,4)}년 {parseInt(e.date.slice(5,7))}월
                         </div>
                       </div>
                     )}
                     
                     <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group py-2 transition-all duration-500 ${isHighlighted ? 'scale-[1.02] z-20' : ''}`}>
                       
                       {/* 💡 [V5.22] 하이라이트 링 색상 변경 */}
                       <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 z-10 ${isTodayEvent ? 'bg-pink-500 text-white ring-2 ring-pink-400 ring-offset-1 shadow-sm' : isMostRecentPast ? 'bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-1 shadow-sm' : 'bg-white'}`}>
                         {isHighlighted ? <Clock size={18} className="animate-pulse" /> : <span className="text-[18px]">{getSmartIcon(e.title, e.type)}</span>}
                       </div>
                       
                       <div onClick={() => setSelectedEventDetail(e)} className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3.5 rounded-2xl border shadow-sm ml-3 transition-colors cursor-pointer active:scale-95 ${isTodayEvent ? 'bg-pink-50 border-pink-200 shadow-pink-100' : isMostRecentPast ? 'bg-blue-50 border-blue-200 shadow-blue-100' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                         <div className="flex justify-between items-start mb-1.5">
                           <div className="flex flex-col gap-0.5">
                             <span className={`text-[10px] font-black ${isTodayEvent ? 'text-pink-600' : isMostRecentPast ? 'text-blue-600' : 'text-gray-400'}`}>
                               {parseInt(e.date.slice(5,7))}/{parseInt(e.date.slice(8,10))} 
                               {e.endDate && e.endDate !== e.date ? ` ~ ${parseInt(e.endDate.slice(5,7))}/${parseInt(e.endDate.slice(8,10))}` : ` (${['일','월','화','수','목','금','토'][new Date(e.date).getDay()]})`}
                               {isTodayEvent && " ✨ 오늘"}
                               {isMostRecentPast && " ⏳ 가장 최근"}
                             </span>
                             <div className="flex items-center mt-0.5">
                               <span className="text-[9px] bg-white border text-gray-500 px-1.5 py-0.5 rounded font-bold shadow-sm inline-block w-max flex items-center gap-1">
                                 {e.participant === '현아' ? '👩 현아' : e.participant === '정훈' ? '🧑 정훈' : '👨‍👩‍👦 가족'} {e.type}
                               </span>
                               {e.isYearly && <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-bold shadow-sm ml-1 flex items-center gap-0.5"><Repeat size={8}/> {e.calendarType === 'lunar' ? '음력' : '양력'}</span>}
                             </div>
                           </div>
                           
                           <div className="flex gap-1 shrink-0 ml-2">
                             <span className={`text-[10px] font-black px-2 py-1 rounded-lg border shadow-sm ${isTodayEvent ? 'text-white bg-pink-500 border-pink-600' : isMostRecentPast ? 'text-white bg-blue-500 border-blue-600' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                                {getDDay(e.date)}
                             </span>
                           </div>
                         </div>
                         <div className={`font-bold text-base flex items-center gap-1.5 mt-1.5 ${isTodayEvent ? 'text-pink-700' : isMostRecentPast ? 'text-blue-700' : 'text-gray-800'}`}>
                           {e.title} {e.isImportant && <Star size={14} className="text-amber-400 fill-amber-400"/>}
                         </div>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      )}

      {calendarSubTab === 'calendar' && (() => {
        const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth, 0).getDate();
        const days = Array(firstDay).fill(null).concat(Array.from({length:daysInMonth}, (_,i)=>i+1));
        
        const eventsByDate = {};
        familyEventsList.forEach(e => { 
          let currentStr = e.date;
          const endStr = e.endDate || e.date;
          let count = 0;
          while (currentStr <= endStr && count < 31) {
              if (currentStr.startsWith(`${calYear}-${String(calMonth).padStart(2,'0')}`)) {
                  if(!eventsByDate[currentStr]) eventsByDate[currentStr] = [];
                  eventsByDate[currentStr].push(e);
              }
              const dObj = new Date(currentStr);
              dObj.setDate(dObj.getDate() + 1);
              currentStr = `${dObj.getFullYear()}-${String(dObj.getMonth()+1).padStart(2,'0')}-${String(dObj.getDate()).padStart(2,'0')}`;
              count++;
          }
        });

        return (
          <div className="bg-white rounded-[2rem] p-4 shadow-md border border-pink-100 animate-in slide-in-from-right mt-1">
             <div className="flex justify-between items-center px-3 mb-4 mt-1">
                <button onClick={() => { if(calMonth===1){setCalMonth(12); setCalYear(calYear-1);} else setCalMonth(calMonth-1); }} className="p-1.5 bg-pink-50 text-pink-500 rounded-xl active:scale-95"><ChevronLeft size={18}/></button>
                <span className="font-black text-gray-800 text-base">{calYear}년 {calMonth}월</span>
                <button onClick={() => { if(calMonth===12){setCalMonth(1); setCalYear(calYear+1);} else setCalMonth(calMonth+1); }} className="p-1.5 bg-pink-50 text-pink-500 rounded-xl active:scale-95"><ChevronRight size={18}/></button>
             </div>

             <div className="grid grid-cols-7 gap-1 text-center mb-2">{['일','월','화','수','목','금','토'].map((d,i) => <div key={d} className={`text-[10px] font-bold ${i===0?'text-red-500':i===6?'text-blue-500':'text-slate-600'}`}>{d}</div>)}</div>
             <div className="grid grid-cols-7 gap-1">
               {days.map((d, i) => {
                 if(!d) return <div key={`empty-${i}`} className="h-[65px] bg-gray-50/30 rounded-xl border border-gray-100"></div>;
                 
                 const dateStr = `${calYear}-${String(calMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                 const dayEvents = eventsByDate[dateStr] || [];
                 const isToday = dateStr === todayStr;
                 const hasEvent = dayEvents.length > 0;
                 const holidayName = getHolidayName(dateStr);
                 const isCustomHoliday = customHolidays.includes(dateStr);
                 const dayIndex = (i % 7);
                 const isRed = dayIndex === 0 || holidayName || isCustomHoliday;
                 const isBlue = dayIndex === 6 && !holidayName && !isCustomHoliday;
                 const dayColor = isRed ? 'text-red-500' : isBlue ? 'text-blue-500' : 'text-gray-600';

                 return (
                   <div key={`day-${i}`} 
                     onClick={() => { 
                         setSelectedCalendarDate(dateStr); 
                     }} 
                     className={`h-[65px] border rounded-xl p-1 flex flex-col items-center justify-start relative ${hasEvent?'border-pink-200 bg-pink-50/50 shadow-sm':'border-gray-100 bg-white hover:bg-gray-50'} cursor-pointer active:scale-95 transition-transform ${isToday ? 'ring-2 ring-pink-400 ring-offset-1 shadow-sm z-10' : ''}`}>
                     <span className={`text-[10px] font-bold mb-1 ${dayColor}`}>{d}</span>
                     
                     {hasEvent && (
                       <div className="flex flex-col items-center justify-center w-full h-full pb-3 relative">
                          <span className="text-[22px] leading-none mb-1">{getSmartIcon(dayEvents[0].title, dayEvents[0].type)}</span>
                          {dayEvents.length > 1 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm border-2 border-white">+{(dayEvents.length - 1)}</span>
                          )}
                          <div className="text-[8px] font-black text-gray-700 w-full text-center truncate px-0.5">{dayEvents[0].title}</div>
                       </div>
                     )}
                   </div>
                 )
               })}
             </div>
          </div>
        );
      })()}

      {/* 달력 날짜 클릭 시 나오는 모달 (일정 추가 버튼 포함) */}
      {selectedCalendarDate && (() => {
        const dayEvents = familyEventsList.filter(e => {
           const start = e.date;
           const end = e.endDate || e.date;
           return selectedCalendarDate >= start && selectedCalendarDate <= end;
        });

        return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70] overflow-hidden p-0">
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, () => setSelectedCalendarDate(null))}
              className="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[80vh] border-t-8 border-pink-500"
            >
               <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
               <div className="flex justify-between items-center mb-6 shrink-0">
                  <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                     <CalendarCheck className="text-pink-500" size={24}/> {selectedCalendarDate.replace(/-/g, '.')}
                  </h2>
                  <button onClick={() => setSelectedCalendarDate(null)} className="bg-gray-100 text-gray-500 p-2.5 rounded-2xl active:scale-95"><X size={20}/></button>
               </div>
               
               <div className="overflow-y-auto no-scrollbar space-y-3 flex-1 pb-4">
                  {dayEvents.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          이 날짜에 등록된 일정이 없습니다. 🍃
                      </div>
                  ) : (
                    dayEvents.map(e => (
                      <div key={e.id} onClick={() => setSelectedEventDetail(e)} className="bg-gray-50 border border-gray-100 rounded-2xl shadow-sm p-4 flex justify-between items-center hover:bg-pink-50 transition-colors cursor-pointer active:scale-95">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className="text-2xl bg-white w-10 h-10 flex justify-center items-center rounded-full shadow-sm shrink-0 border border-gray-100">{getSmartIcon(e.title, e.type)}</div>
                          <div className="truncate">
                            <div className="flex items-center gap-1 mb-0.5">
                               <span className="text-[10px] font-bold text-pink-500">{e.type}</span>
                               {e.participant && <span className="text-[8px] bg-white border text-gray-500 px-1 py-0.5 rounded shadow-sm">{e.participant === '현아' ? '👩' : e.participant === '정훈' ? '🧑' : '👨‍👩‍👦'}</span>}
                            </div>
                            <div className="font-black text-base text-gray-800 flex items-center gap-1">{e.title} {e.isImportant && <Star size={12} className="text-amber-400 fill-amber-400"/>}</div>
                          </div>
                        </div>
                        <ChevronRight className="text-gray-300 w-5 h-5 shrink-0" />
                      </div>
                    ))
                  )}
               </div>

               {/* 💡 일정 추가 버튼 */}
               <button onClick={() => { 
                   setSelectedCalendarDate(null);
                   setEventFormData({ date: selectedCalendarDate, endDate: selectedCalendarDate, title: '', type: '가족일정', isImportant: false, participant: '가족', isYearly: false, calendarType: 'solar' }); 
                   setEditingEventId(null); 
                   setIsEventModalOpen(true);
               }} className="w-full bg-pink-50 text-pink-600 border border-pink-200 mt-4 py-3.5 rounded-[1.5rem] font-black text-sm active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <Plus size={18}/> 이 날짜에 일정 추가하기
               </button>
            </div>
         </div>
        );
      })()}

      {selectedEventDetail && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
            <div 
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) => handleTouchEnd(e, () => setSelectedEventDetail(null))}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden border border-gray-100"
            >
               <div className="absolute top-0 left-0 right-0 h-2 bg-pink-400"></div>
               <div className="flex justify-between items-start mb-5 mt-2">
                  <div className="p-3 rounded-2xl shadow-sm bg-pink-100 text-2xl flex justify-center items-center">
                     {getSmartIcon(selectedEventDetail.title, selectedEventDetail.type)}
                  </div>
                  <button onClick={() => setSelectedEventDetail(null)} className="text-gray-400 p-2 bg-gray-50 rounded-full active:scale-95 border border-gray-200"><X size={20}/></button>
               </div>
               
               <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                     <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5"><CalendarIcon size={12}/> {selectedEventDetail.date} {selectedEventDetail.endDate && selectedEventDetail.endDate !== selectedEventDetail.date ? `~ ${selectedEventDetail.endDate}` : ''}</span>
                     <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">{getDDay(selectedEventDetail.date)}</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 mb-3 leading-tight flex items-center gap-2">
                     {selectedEventDetail.title} {selectedEventDetail.isImportant && <Star size={16} className="text-amber-400 fill-amber-400"/>}
                  </div>
                  
                  <div className="flex gap-2">
                     <div className="text-[11px] font-bold text-gray-500 px-2.5 py-1.5 bg-gray-100 inline-block rounded-lg shadow-inner">{selectedEventDetail.type}</div>
                     {selectedEventDetail.participant && <div className="text-[11px] font-bold text-gray-500 px-2.5 py-1.5 bg-gray-100 inline-block rounded-lg shadow-inner">{selectedEventDetail.participant === '현아' ? '👩 현아' : selectedEventDetail.participant === '정훈' ? '🧑 정훈' : '👨‍👩‍👦 가족 전체'}</div>}
                     {selectedEventDetail.isYearly && <div className="text-[11px] font-bold text-blue-600 px-2.5 py-1.5 bg-blue-50 border border-blue-200 inline-block rounded-lg shadow-sm flex items-center gap-1"><Repeat size={12}/> {selectedEventDetail.calendarType === 'lunar' ? '음력 매년' : '양력 매년'}</div>}
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <button onClick={() => { setEventFormData(selectedEventDetail); setEditingEventId(selectedEventDetail.id); setSelectedEventDetail(null); setIsEventModalOpen(true); }} className="py-3.5 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-gray-600 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Edit3 size={16}/> 내용 수정</button>
                  <button onClick={() => deleteEvent(selectedEventDetail.id)} className="py-3.5 bg-gray-50 border border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-gray-600 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Trash2 size={16}/> 삭제하기</button>
               </div>
            </div>
         </div>
      )}

      <button onClick={() => { setEventFormData({ date: todayStr, endDate: todayStr, title: '', type: '가족일정', isImportant: false, participant: '가족', isYearly: false, calendarType: 'solar' }); setEditingEventId(null); setIsEventModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-pink-500 text-white w-14 h-14 rounded-[1.5rem] shadow-xl flex items-center justify-center active:scale-90 z-40 border border-pink-600"><Plus size={28}/></button>

      {/* 💡 [V5.5] 대폭 압축된 일정 등록/수정 모달창 */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[60] overflow-y-auto no-scrollbar p-0">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, () => setIsEventModalOpen(false))}
            className="bg-white w-full max-w-md rounded-t-[3rem] p-5 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 mt-20 flex flex-col max-h-[90vh] border-t-8 border-pink-500"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
            <div className="flex justify-between items-center mb-5 shrink-0"><h2 className="text-2xl font-black text-gray-900">{editingEventId ? '일정 수정 🌿' : '새 일정 등록 🌿'}</h2><button onClick={() => setIsEventModalOpen(false)} className="bg-pink-50 text-pink-500 p-2.5 rounded-2xl border"><X size={20}/></button></div>
            
            <form onSubmit={handleEventSubmit} className="space-y-4 overflow-y-auto no-scrollbar flex-1 pb-4">
              
              {/* 1. 날짜 설정 */}
              <div className="flex gap-3 w-full">
                <div className="flex-1 shrink-0 bg-gray-50 rounded-2xl p-2.5 border border-gray-200 shadow-sm">
                   <label className="text-[10px] font-black text-gray-400 ml-1 block mb-0.5">시작 날짜</label>
                   <input type="date" value={eventFormData.date} onChange={e=>setEventFormData({...eventFormData, date:e.target.value})} className="w-full bg-transparent px-1 h-[28px] font-bold text-sm outline-none" />
                </div>
                <div className="flex-1 shrink-0 bg-gray-50 rounded-2xl p-2.5 border border-gray-200 shadow-sm">
                   <label className="text-[10px] font-black text-gray-400 ml-1 block mb-0.5">종료 날짜 (선택)</label>
                   <input type="date" value={eventFormData.endDate || ''} onChange={e=>setEventFormData({...eventFormData, endDate:e.target.value})} className="w-full bg-transparent px-1 h-[28px] font-bold text-sm outline-none" />
                </div>
              </div>

              {/* 2. 타이틀 (내용) 입력 - 동선 최우선 배치 */}
              <div>
                 <label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">일정 내용</label>
                 <input type="text" value={eventFormData.title} onChange={e=>setEventFormData({...eventFormData, title:e.target.value})} placeholder="예: 어머님 생신, 결혼기념일, 휴가" className="w-full bg-gray-50 rounded-xl px-4 h-[48px] text-base font-black outline-none border focus:border-pink-300" />
              </div>

              {/* 3. 옵션 초압축 통합 블록 */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4 mt-2">
                
                {/* 3-1. 빨간날 지정 */}
                <label className="flex items-center gap-3 cursor-pointer group">
                   <input type="checkbox" className="w-5 h-5 accent-red-500 rounded border-gray-300 cursor-pointer" checked={customHolidays.includes(eventFormData.date)} onChange={() => toggleCustomHoliday(eventFormData.date)} />
                   <div>
                      <div className="text-sm font-black text-gray-800 group-hover:text-red-500 transition-colors flex items-center gap-1">🔴 달력에 빨간 날로 표시</div>
                      <div className="text-[9px] text-gray-400 font-bold mt-0.5">우리가족 임시휴무, 연차 등 쉬는 날</div>
                   </div>
                </label>

                <div className="h-px bg-gray-200 w-full"></div>

                {/* 3-2. 매년 반복 */}
                <div className="flex items-center justify-between">
                   <label className="flex items-center gap-3 cursor-pointer group">
                     <input type="checkbox" className="w-5 h-5 accent-blue-500 rounded border-gray-300 cursor-pointer" checked={eventFormData.isYearly} onChange={e => setEventFormData({...eventFormData, isYearly: e.target.checked})} />
                     <span className="text-sm font-black text-gray-800 group-hover:text-blue-500 transition-colors flex items-center gap-1">🔄 매년 반복 등록</span>
                   </label>
                   {eventFormData.isYearly && (
                     <select value={eventFormData.calendarType || 'solar'} onChange={e => setEventFormData({...eventFormData, calendarType: e.target.value})} className="text-[10px] font-bold bg-white text-blue-600 px-2.5 py-1.5 rounded-lg border border-blue-200 outline-none shadow-sm cursor-pointer">
                       <option value="solar">양력</option>
                       <option value="lunar">음력</option>
                     </select>
                   )}
                </div>

                <div className="h-px bg-gray-200 w-full"></div>

                {/* 3-3. D-Day 지정 */}
                <label className="flex items-center gap-3 cursor-pointer group">
                   <input type="checkbox" className="w-5 h-5 accent-amber-500 rounded border-gray-300 cursor-pointer" checked={eventFormData.isImportant} onChange={e => setEventFormData({...eventFormData, isImportant: e.target.checked})} />
                   <div>
                      <div className="text-sm font-black text-gray-800 group-hover:text-amber-500 transition-colors flex items-center gap-1">⭐ 중요 일정 (D-Day 표출)</div>
                      <div className="text-[9px] text-gray-400 font-bold mt-0.5">달력 상단 브리핑 카드에 노출됩니다.</div>
                   </div>
                </label>
              </div>
              
              <button type="submit" disabled={!eventFormData.title.trim()} className="w-full bg-pink-500 mt-4 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 shadow-xl disabled:opacity-50 border border-pink-600">{editingEventId ? '수정 완료' : '등록 완료'} 🌿</button>
            </form>
          </div>
        </div>
      )}

      {/* 과거 보관소 모달 */}
      {isMessageHistoryOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-end p-0 overflow-hidden">
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, () => setIsMessageHistoryOpen(false))}
              className="bg-white w-full max-w-md rounded-t-[3rem] p-6 shadow-2xl flex flex-col h-[80vh] animate-in slide-in-from-bottom border-t-8 border-pink-500"
            >
               <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
               <div className="flex justify-between items-center mb-4 shrink-0">
                  <h3 className="text-xl font-black text-gray-800">🗂️ 톡 과거 보관소</h3>
                  <button onClick={() => setIsMessageHistoryOpen(false)} className="bg-gray-100 p-2 rounded-full active:scale-95"><X size={20}/></button>
               </div>
               <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10 border-t border-gray-100 pt-4">
                  {archivedMessages.length === 0 && <div className="text-center text-gray-400 py-10 font-bold text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">보관된 메시지가 없습니다.</div>}
                  {archivedMessages.map(m => (
                     <div key={m.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-1.5">
                           <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 shadow-inner">{m.author}</span>
                              {typeof m.createdAt === 'string' && m.createdAt.slice(5).replace('-','/')} {m.time}
                           </div>
                        </div>
                        <div className="text-sm font-black text-gray-600 leading-relaxed">{m.text}</div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}

      {isDutyEditModalOpen && selectedDutyEditDate && (() => {
         const existingEvent = events.find(e => e.date === selectedDutyEditDate && e.type === '듀티');
         const currentDuty = existingEvent ? existingEvent.title : 'OFF';
         return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70] p-0">
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, () => setIsDutyEditModalOpen(false))}
              className="bg-white w-full max-w-md rounded-t-[3rem] p-5 pb-12 shadow-2xl animate-in slide-in-from-bottom border-t-8 border-pink-400"
            >
               <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
               <div className="flex justify-between items-center mb-6"><div><h2 className="text-xl font-black text-gray-900">{parseInt(selectedDutyEditDate.slice(5,7))}월 {parseInt(selectedDutyEditDate.slice(8,10))}일 스케줄</h2><p className="text-[10px] text-gray-500 font-bold mt-1">{isDutyEditing ? '변경할 근무를 선택하세요.' : '현재 등록된 스케줄입니다.'}</p></div><button onClick={() => setIsDutyEditModalOpen(false)} className="bg-gray-100 text-gray-500 p-2.5 rounded-2xl"><X size={20}/></button></div>
               <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-center border shadow-inner"><span className="text-[10px] font-bold text-gray-400 block mb-1">현재 스케줄</span><span className={`text-4xl font-black ${currentDuty === 'DAY' ? 'text-blue-500' : currentDuty === 'EVE' ? 'text-orange-500' : currentDuty === 'OFF' ? 'text-pink-500' : 'text-gray-400'}`}>{currentDuty}</span></div>
               {!isDutyEditing ? (
                  <button onClick={() => setIsDutyEditing(true)} className="w-full bg-pink-500 text-white py-4 rounded-[1.5rem] font-black text-lg">수정하기</button>
               ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleQuickDutyUpdate(selectedDutyEditDate, 'DAY')} className="bg-blue-50 text-blue-600 border border-blue-200 py-4 rounded-[1.5rem] font-black text-lg">DAY</button>
                    <button onClick={() => handleQuickDutyUpdate(selectedDutyEditDate, 'EVE')} className="bg-orange-50 text-orange-600 border border-orange-200 py-4 rounded-[1.5rem] font-black text-lg">EVE</button>
                    <button onClick={() => handleQuickDutyUpdate(selectedDutyEditDate, 'OFF')} className="bg-pink-50 text-pink-600 border border-pink-200 py-4 rounded-[1.5rem] font-black text-lg">OFF</button>
                    <button onClick={() => handleQuickDutyUpdate(selectedDutyEditDate, 'DELETE')} className="bg-gray-100 text-gray-600 border border-gray-200 py-4 rounded-[1.5rem] font-black text-lg flex justify-center gap-1"><Trash2 size={16}/> 삭제</button>
                  </div>
               )}
            </div>
          </div>
         );
      })()}

      {isDutyBatchModalOpen && (
         <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center p-4 pt-10 border-b shrink-0">
               <button onClick={() => setIsDutyBatchModalOpen(false)} className="text-gray-500 p-2"><ChevronLeft size={24}/></button>
               <span className="font-black text-lg">한달 스케줄 관리</span>
               <div className="w-10 flex justify-end">
                 {isDutyBatchEditMode && <button onClick={saveBatchDuties} className="text-pink-500 font-black text-base">저장</button>}
               </div>
            </div>
            
            <div className="p-4 flex-1 flex flex-col overflow-auto no-scrollbar">
               <div className="border border-gray-200 rounded-[2rem] p-4 shadow-sm shrink-0">
                  <div className="flex justify-center items-center gap-6 mb-4 mt-2">
                     <button onClick={() => setDutyBatchMonth(m => m === 1 ? 12 : m - 1)} className="p-2 text-gray-800 active:scale-95"><ChevronLeft size={20}/></button>
                     <span className="font-black text-lg text-pink-600">{dutyBatchYear}년 {dutyBatchMonth}월</span>
                     <button onClick={() => setDutyBatchMonth(m => m === 12 ? 1 : m + 1)} className="p-2 text-gray-800 active:scale-95"><ChevronRight size={20}/></button>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {['일','월','화','수','목','금','토'].map((d, i) => <div key={d} className={`text-center text-[10px] font-bold pb-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-600'}`}>{d}</div>)}
                    {Array.from({length: new Date(dutyBatchYear, dutyBatchMonth - 1, 1).getDay()}).map((_,i) => <div key={`e-${i}`}/>)}
                    {Array.from({length: new Date(dutyBatchYear, dutyBatchMonth, 0).getDate()}).map((_, i) => {
                       const d = i + 1;
                       const dateStr = `${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                       const duty = batchDuties[dateStr];
                       let cellClass = duty === 'DAY' ? 'text-blue-600 border-blue-200 bg-blue-50' : duty === 'EVE' ? 'text-orange-600 border-orange-200 bg-orange-50' : duty === 'OFF' ? 'text-pink-600 border-pink-200 bg-pink-50' : 'text-gray-400 border-gray-100 bg-white';
                       const isToday = dateStr === todayStr;
                       const isCursor = dutyBatchMode === 'continuous' && isDutyBatchEditMode && dateStr === continuousCursorDateStr;
                       if (isCursor) cellClass += ` border-2 border-gray-800 ring-4 ring-gray-200 z-10 scale-110 shadow-md`;
                       if (isToday) cellClass += ` ring-2 ring-pink-400 ring-offset-1 shadow-sm`;

                       return (
                          <div key={d} onClick={() => { 
                              if(isDutyBatchEditMode) {
                                 if (dutyBatchMode === 'touch') setBatchDuties(prev => ({...prev, [dateStr]: selectedStamp === 'DELETE' ? null : selectedStamp}));
                                 else setContinuousCursorDateStr(dateStr);
                              }
                          }} className={`h-[50px] rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all ${cellClass}`}>
                             <span className="text-[10px] font-bold mb-0.5">{d}</span>
                             <span className="text-xs font-black">{duty || ''}</span>
                          </div>
                       );
                    })}
                  </div>
               </div>

               <div className="flex-1"></div>

               <div className="flex gap-2 mt-4 bg-gray-50 p-1.5 rounded-2xl justify-center border border-gray-100 shadow-inner shrink-0">
                  <button onClick={() => { setIsDutyBatchEditMode(true); setDutyBatchMode('continuous'); }} className={`flex-1 py-3 rounded-xl font-black text-sm transition-colors ${isDutyBatchEditMode && dutyBatchMode === 'continuous' ? `bg-white shadow-sm text-pink-600 border border-gray-200` : 'text-gray-500 hover:bg-gray-100'}`}>⏩ 연속 모드</button>
                  <button onClick={() => { setIsDutyBatchEditMode(true); setDutyBatchMode('touch'); }} className={`flex-1 py-3 rounded-xl font-black text-sm transition-colors ${isDutyBatchEditMode && dutyBatchMode === 'touch' ? `bg-white shadow-sm text-pink-600 border border-gray-200` : 'text-gray-500 hover:bg-gray-100'}`}>👆 터치 모드</button>
               </div>

               {isDutyBatchEditMode && dutyBatchMode === 'continuous' && (
                 <div className="mt-3 flex gap-2 pb-6 shrink-0 animate-in slide-in-from-bottom-2">
                     <button onClick={() => handleContinuousStamp('DAY')} className="flex-1 bg-blue-50 text-blue-600 font-black py-4 rounded-[1.2rem] border border-blue-200 active:scale-95 transition-transform shadow-sm">DAY</button>
                     <button onClick={() => handleContinuousStamp('EVE')} className="flex-1 bg-orange-50 text-orange-600 font-black py-4 rounded-[1.2rem] border border-orange-200 active:scale-95 transition-transform shadow-sm">EVE</button>
                     <button onClick={() => handleContinuousStamp('OFF')} className="flex-1 bg-pink-50 text-pink-600 font-black py-4 rounded-[1.2rem] border border-pink-200 active:scale-95 transition-transform shadow-sm">OFF</button>
                     <button onClick={() => handleContinuousStamp('BACK')} className="flex-none px-4 bg-gray-100 text-gray-600 font-black py-4 rounded-[1.2rem] border border-gray-200 active:scale-95 flex flex-col items-center justify-center gap-1 transition-transform shadow-sm"><RefreshCw size={14}/><span className="text-[10px]">취소</span></button>
                  </div>
               )}

               {isDutyBatchEditMode && dutyBatchMode === 'touch' && (
                 <div className="mt-3 flex gap-2 pb-6 shrink-0 animate-in slide-in-from-bottom-2">
                    {['DAY', 'EVE', 'OFF', 'DELETE'].map(stamp => {
                       let activeBg = stamp === 'DAY' ? 'bg-blue-500' : stamp === 'EVE' ? 'bg-orange-500' : stamp === 'OFF' ? 'bg-pink-500' : 'bg-gray-700';
                       return (
                          <button key={stamp} onClick={() => setSelectedStamp(stamp)} className={`flex-1 py-4 rounded-[1.2rem] font-black text-sm transition-all ${selectedStamp === stamp ? `${activeBg} text-white shadow-md` : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                             {stamp === 'DELETE' ? '지우개' : stamp}
                          </button>
                       )
                    })}
                 </div>
               )}
            </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 9. MAIN APP CONTENT
// ==========================================
function AppContent() {
  const [user, setUser] = useState(null);
  const todayStr = getKSTDateStr();
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('hyunaCurrentUser') || '현아');
  const [appFont, setAppFont] = useState(() => localStorage.getItem('hyunaFont') || 'Inter');

  const defaultTabOrder = ['calendar', 'ledger', 'delivery', 'assets'];
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('hyunaDefaultTab') || 'calendar');
  const [tabOrder, setTabOrder] = useState(() => { const saved = localStorage.getItem('hyunaTabOrder'); return saved ? JSON.parse(saved) : defaultTabOrder; });
  const [isManageMode, setIsManageMode] = useState(false); 
  
  const [ledger, setLedger] = useState([]);
  const [assets, setAssets] = useState({ deposits: [], savings: [], loans: [] }); 
  const [dailyDeliveries, setDailyDeliveries] = useState([]);
  const [events, setEvents] = useState([]); 
  const [messages, setMessages] = useState([]); 
  const [memos, setMemos] = useState([]); 
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [userSettings, setUserSettings] = useState({ deliveryGoals: {}, customHolidays: [] });

  const [selectedYear, setSelectedYear] = useState(parseInt(todayStr.slice(0,4)));
  const [selectedMonth, setSelectedMonth] = useState(parseInt(todayStr.slice(5,7)));
  const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const [timerActive, setTimerActive] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isAppLocked, setIsAppLocked] = useState(false);

  const [lastVisited, setLastVisited] = useState(() => {
    const saved = localStorage.getItem('hyunaLastVisited');
    return saved ? JSON.parse(saved) : { calendar: 0, ledger: 0, delivery: 0, assets: 0 };
  });

  useEffect(() => {
    setLastVisited(prev => {
      const next = { ...prev, [activeTab]: Date.now() };
      localStorage.setItem('hyunaLastVisited', JSON.stringify(next));
      return next;
    });
  }, [activeTab]);

  const hasNew = useMemo(() => {
    if (timerActive) return { calendar: false, ledger: false, delivery: false, assets: false };

    const check = (arr, tab) => {
      if (!arr || !Array.isArray(arr)) return false;
      return arr.some(item => {
        const updateTime = item.updatedAt ? new Date(item.updatedAt).getTime() : (item.isoUpdate ? new Date(item.isoUpdate).getTime() : 0);
        const lastSeen = lastVisited[tab] || 0;
        const author = item.updatedBy || item.author;
        return author && author !== currentUser && updateTime > lastSeen;
      });
    };
    
    return {
      calendar: activeTab !== 'calendar' && (check(events, 'calendar') || check(messages, 'calendar')),
      ledger: activeTab !== 'ledger' && (check(ledger, 'ledger') || check(memos, 'ledger')),
      delivery: activeTab !== 'delivery' && check(dailyDeliveries, 'delivery'),
      assets: activeTab !== 'assets' && (check(assets.deposits, 'assets') || check(assets.savings, 'assets') || check(assets.loans, 'assets'))
    };
  }, [ledger, dailyDeliveries, assets, events, messages, memos, activeTab, lastVisited, currentUser, timerActive]);

  useEffect(() => {
    const checkLockStatus = () => {
      const lockEnabled = localStorage.getItem('hyunaLockEnabled') === 'true';
      if (!lockEnabled) {
         setIsAppLocked(false);
         return;
      }
      const lockTimeout = parseInt(localStorage.getItem('hyunaLockTimeout') || '0', 10);
      const lastActiveStr = localStorage.getItem('hyunaLastActive');
      
      if (lockTimeout === 0 || !lastActiveStr) {
         setIsAppLocked(true);
      } else {
         const lastActive = parseInt(lastActiveStr, 10);
         const now = Date.now();
         const expiredTime = lastActive + (lockTimeout * 60 * 1000);
         if (now > expiredTime) {
            setIsAppLocked(true);
         } else {
            setIsAppLocked(false);
         }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        localStorage.setItem('hyunaLastActive', Date.now().toString());
      } else {
        checkLockStatus();
      }
    };

    checkLockStatus();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleUnlock = () => {
     setIsAppLocked(false);
     localStorage.setItem('hyunaLastActive', Date.now().toString());
  };

  useEffect(() => {
    if (!isFirebaseEnabled) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try { await signInWithCustomToken(auth, __initial_auth_token); } catch (e) { await signInAnonymously(auth); }
        } else await signInAnonymously(auth);
      } catch (err) { console.error(err); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isFirebaseEnabled || !user) return;
    const unsubLedger = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'ledger'), (s) => setLedger(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubDelivery = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'delivery'), (s) => setDailyDeliveries(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubAssets = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'assets'), (s) => {
      const allAssets = s.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssets({
         deposits: allAssets.filter(a => a.assetType === 'deposit'),
         savings: allAssets.filter(a => a.assetType === 'savings'),
         loans: allAssets.filter(a => a.assetType === 'loan')
      });
    });
    const unsubEvents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'events'), (s) => setEvents(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubMessages = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), (s) => setMessages(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubMemos = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'memos'), (s) => setMemos(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'categories'), (s) => { if(s.exists()) setCategories(s.data()); });
    const unsubPrefs = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'preferences'), (s) => { if(s.exists()) setUserSettings(s.data()); });
    const unsubTimer = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'deliveryTimer'), (s) => { if(s.exists()) { setTimerActive(s.data().timerActive || false); setTrackingStartTime(s.data().trackingStartTime || null); }});
    return () => { unsubLedger(); unsubDelivery(); unsubAssets(); unsubEvents(); unsubMessages(); unsubMemos(); unsubSettings(); unsubPrefs(); unsubTimer(); };
  }, [user]);

  useEffect(() => {
    let interval;
    if (timerActive && trackingStartTime) interval = setInterval(() => setElapsedSeconds(Math.floor((new Date() - new Date(trackingStartTime)) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [timerActive, trackingStartTime]);

  const handleStartDelivery = async () => {
    const nowStr = new Date().toISOString();
    setTrackingStartTime(nowStr); setTimerActive(true); setElapsedSeconds(0);
    if (isFirebaseEnabled && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'deliveryTimer'), { timerActive: true, trackingStartTime: nowStr });
  };

  const handleEndDelivery = async () => {
    setTimerActive(false); setTrackingStartTime(null);
    if (isFirebaseEnabled && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'deliveryTimer'), { timerActive: false, trackingStartTime: null });
  };

  const handleClearAllMessages = async () => {
    if(!window.confirm("⚠️ 경고 ⚠️\n\n정말 모든 채팅과 시스템 로그를 영구적으로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;
    if (isFirebaseEnabled && user) {
      for (const m of messages) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', m.id));
      }
      alert("모든 메시지와 로그가 성공적으로 삭제되었습니다.");
    } else {
      setMessages([]);
      alert("모든 메시지와 로그가 삭제되었습니다. (로컬)");
    }
  };

  const updateSettings = async (field, value) => {
    const newSettings = { ...userSettings, [field]: value };
    if(isFirebaseEnabled && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'preferences'), newSettings);
    else setUserSettings(newSettings);
  };

  let appBgColor = 'bg-gray-50/80';
  let headerColor = 'text-indigo-500';
  const currentLedgerTheme = THEME_PALETTES[MONTHLY_THEME_MAP[selectedMonth]?.ledger || 'pink'];
  const currentCalendarTheme = THEME_PALETTES[MONTHLY_THEME_MAP[selectedMonth]?.calendar || 'sky'];

  if (activeTab === 'ledger') {
     appBgColor = `${currentLedgerTheme.bg50}/30`;
     headerColor = currentLedgerTheme.text500;
  } else if (activeTab === 'calendar') {
     appBgColor = `${currentCalendarTheme.bg50}/30`;
     headerColor = currentCalendarTheme.text500;
  } else if (activeTab === 'delivery') {
     appBgColor = 'bg-slate-50';
     headerColor = 'text-blue-500';
  }

  const customHolidays = userSettings.customHolidays || [];

  return (
    <>
      {isAppLocked && <LockScreenView correctPin={localStorage.getItem('hyunaLockPin') || '0000'} onUnlock={handleUnlock} />}
      
      <div 
        className={`min-h-screen text-gray-900 select-none pb-32 transition-colors duration-500 ${appBgColor} ${isAppLocked ? 'hidden' : ''}`}
        style={{ fontFamily: appFont }}
      >
        
        <div className="portrait-lock hidden fixed inset-0 z-[99999] bg-gray-900 flex-col items-center justify-center text-white p-6 text-center">
          <Smartphone className="w-20 h-20 mb-6 text-pink-400 animate-pulse rotate-90" />
          <h2 className="text-2xl font-black mb-3 text-pink-400 tracking-tighter">세로 모드로 돌려주세요! 📱</h2>
          <p className="text-gray-300 font-bold text-sm leading-relaxed">
            이 앱은 세로 화면에 최적화되어 있습니다.<br/>
            가로 모드에서는 정상적인 사용이 어려우니<br/>
            기기를 세로로 세워서 사용해 주세요.
          </p>
        </div>

        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl pb-2 shadow-sm border-b border-gray-200/60">
          <header className="pt-10 pb-4 px-6 flex justify-between items-center">
            <div>
              <span className={`text-[10px] font-black tracking-widest uppercase block mb-0.5 ${headerColor}`}>
                 {activeTab === 'ledger' ? '🌸 Lovely Planner' : activeTab === 'delivery' ? '🏍️ Delivery Pro' : activeTab === 'calendar' ? '🌿 Family Calendar' : 'Family Planner'}
              </span>
              <h1 className="text-xl font-black tracking-tight">현아에셋 PRO</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white rounded-full px-3 py-1.5 text-sm font-black text-gray-700 shadow-sm border border-gray-200">
                <button onClick={() => setSelectedYear(selectedYear - 1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={16}/></button>
                <span className="mx-2">{selectedYear}년</span>
                <button onClick={() => setSelectedYear(selectedYear + 1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={16}/></button>
              </div>
              <button onClick={() => setIsManageMode(!isManageMode)} className={`p-2.5 rounded-full transition-all duration-300 shadow-sm border border-gray-200 ${isManageMode ? (activeTab === 'ledger' ? currentLedgerTheme.bg500 : activeTab === 'delivery' ? 'bg-blue-600' : activeTab === 'calendar' ? currentCalendarTheme.bg500 : 'bg-indigo-600') + ' text-white shadow-md rotate-90' : 'bg-white text-gray-500'}`}><Settings size={20}/></button>
            </div>
          </header>

          <div className="flex overflow-x-auto no-scrollbar gap-2 py-1 px-5 scroll-smooth">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <button key={m} onClick={() => setSelectedMonth(m)} className={`flex-none px-5 py-2 rounded-[1.2rem] font-black text-sm transition-all shadow-sm border ${selectedMonth === m ? (activeTab === 'ledger' ? `${currentLedgerTheme.bg500} text-white border-transparent` : activeTab === 'delivery' ? 'bg-blue-600 text-white border-blue-600' : activeTab === 'calendar' ? `${currentCalendarTheme.bg500} text-white border-transparent` : 'bg-indigo-600 text-white border-indigo-600') : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                {m}월
              </button>
            ))}
          </div>
        </div>

        {isManageMode && <SettingsView activeTab={activeTab} tabOrder={tabOrder} setTabOrder={setTabOrder} currentUser={currentUser} setCurrentUser={setCurrentUser} categories={categories} setCategories={setCategories} userSettings={userSettings} setUserSettings={setUserSettings} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} user={user} handleClearAllMessages={handleClearAllMessages} appFont={appFont} setAppFont={setAppFont} />}

        <main className="px-5 max-w-md mx-auto pt-2">
          {activeTab === 'ledger' && <LedgerView ledger={ledger} setLedger={setLedger} assets={assets} setAssets={setAssets} memos={memos} setMemos={setMemos} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} todayStr={todayStr} categories={categories} setCategories={setCategories} user={user} isManageMode={isManageMode} currentUser={currentUser} customHolidays={customHolidays} />}
          {activeTab === 'delivery' && <DeliveryView dailyDeliveries={dailyDeliveries} setDailyDeliveries={setDailyDeliveries} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} todayStr={todayStr} userSettings={userSettings} timerActive={timerActive} trackingStartTime={trackingStartTime} elapsedSeconds={elapsedSeconds} handleStartDelivery={handleStartDelivery} handleEndDelivery={handleEndDelivery} user={user} isManageMode={isManageMode} currentUser={currentUser} customHolidays={customHolidays} />}
          {activeTab === 'assets' && <AssetView assets={assets} setAssets={setAssets} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} todayStr={todayStr} user={user} isManageMode={isManageMode} currentUser={currentUser} />}
          {activeTab === 'calendar' && <FamilyCalendarView events={events} setEvents={setEvents} messages={messages} setMessages={setMessages} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} todayStr={todayStr} currentUser={currentUser} user={user} isManageMode={isManageMode} activeTab={activeTab} customHolidays={customHolidays} updateSettings={updateSettings} userSettings={userSettings} />}
        </main>

        <nav className="fixed bottom-6 left-4 right-4 h-[72px] bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-200/50 flex justify-around items-center z-50 px-2">
          {tabOrder.map((tabId) => {
            const config = tabConfig[tabId];
            const Icon = config.icon;
            const isActive = activeTab === tabId;
            let activeColor = 'text-indigo-500';
            let badgeColor = 'bg-indigo-500';
            
            if (tabId === 'ledger') { activeColor = currentLedgerTheme.text500; badgeColor = currentLedgerTheme.bg500; }
            if (tabId === 'calendar') { activeColor = currentCalendarTheme.text500; badgeColor = currentCalendarTheme.bg500; }
            if (tabId === 'delivery') { activeColor = 'text-blue-500'; badgeColor = 'bg-blue-500'; }

            return (
              <button key={tabId} onClick={() => setActiveTab(tabId)} className={`flex flex-col items-center w-14 transition-all ${isActive ? `${activeColor} scale-110` : 'text-gray-400 hover:text-gray-500'}`}>
                <div className="relative">
                  <Icon size={22}/>
                  {hasNew[tabId] && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${badgeColor}`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-white ${badgeColor}`}></span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-black mt-1.5">{config.label}</span>
              </button>
            )
           })}
        </nav>

        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
          @font-face { font-family: 'KOTRA_HOPE'; src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_20-10-21@1.0/KOTRA_HOPE.woff') format('woff'); font-weight: normal; font-style: normal; font-display: swap; }
          @font-face { font-family: 'Cafe24SsurroundAir'; src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2105_2@1.0/Cafe24SsurroundAir.woff') format('woff'); font-weight: normal; font-style: normal; font-display: swap; }
          @font-face { font-family: 'CookieRun'; src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/CookieRun-Regular.woff') format('woff'); font-weight: normal; font-style: normal; font-display: swap; }
          @font-face { font-family: 'Bareun_hipi'; src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2207-01@1.0/Bareun_hipi.woff2') format('woff2'); font-weight: normal; font-style: normal; font-display: swap; }
          @font-face { font-family: 'Ownglyph_uiyeon'; src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2402_1@1.0/Ownglyph_uiyeon.woff2') format('woff2'); font-weight: normal; font-style: normal; font-display: swap; }

          body { font-family: ${appFont}, sans-serif !important; background-color: #f9fafb; }
          
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          #csb-edit-btn, a[href*="codesandbox.io"] { display: none !important; }
          
          @media screen and (orientation: landscape) and (max-width: 900px) {
            .portrait-lock { display: flex !important; }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-10px); }
            40%, 80% { transform: translateX(10px); }
          }
        `}} />
      </div>
    </>
  );
}

// 10. ERROR BOUNDARY
class ErrorBoundary extends React.Component {
  constructor(props) { super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error(error, errorInfo);
    this.setState({ errorInfo }); 
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl max-w-sm w-full border text-left">
            <h2 className="text-lg font-black text-gray-900 mb-4">오류가 발생했습니다</h2>
            <div className="bg-gray-900 rounded-xl p-4 mb-6 overflow-auto max-h-60 text-[10px] text-green-400 font-mono"><p>{this.state.error && this.state.error.toString()}</p></div>
            <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-black active:scale-95">새로고침 (홈으로 복구하기)</button>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default function App() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>;
}

        
