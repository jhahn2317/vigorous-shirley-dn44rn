import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Calendar as CalendarIcon, PieChart, List, 
  ChevronLeft, ChevronRight, X, ArrowDownCircle, ArrowUpCircle, 
  Bike, Landmark, Wallet, CheckCircle2, 
  Trash2, Settings, Clock, Search, ChevronDown, ChevronUp, CalendarCheck, Coins, Filter, RefreshCw, ArrowDownUp, Timer, Target, Edit3, CalendarDays, Play, Square, Smartphone, Heart,
  Utensils, Home, Car, Shield, User, CreditCard, PiggyBank, GraduationCap, Gift, Plane, FileText, Film, Scissors, ShoppingBag, Tv, Package, Briefcase, Star, Stethoscope, Coffee, MessageSquareHeart,
  NotebookPen, Calculator, ChevronLeftCircle, Lock, Delete, Copy, Building2, Grid
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

// 🚀 [V3.0] 월별 감성 파스텔 테마 엔진 구축
const THEME_PALETTES = {
  pink: { bg500: 'bg-pink-500', bg600: 'bg-pink-600', bg50: 'bg-pink-50', bg100: 'bg-pink-100', text500: 'text-pink-500', text600: 'text-pink-600', text400: 'text-pink-400', border500: 'border-pink-500', border200: 'border-pink-200', border100: 'border-pink-100', border600: 'border-pink-600', border300: 'focus:border-pink-300', fill400: 'fill-pink-400', fromColor: 'from-pink-400', toColor: 'to-rose-400' },
  amber: { bg500: 'bg-amber-500', bg600: 'bg-amber-600', bg50: 'bg-amber-50', bg100: 'bg-amber-100', text500: 'text-amber-500', text600: 'text-amber-600', text400: 'text-amber-400', border500: 'border-amber-500', border200: 'border-amber-200', border100: 'border-amber-100', border600: 'border-amber-600', border300: 'focus:border-amber-300', fill400: 'fill-amber-400', fromColor: 'from-amber-400', toColor: 'to-yellow-400' },
  emerald: { bg500: 'bg-emerald-500', bg600: 'bg-emerald-600', bg50: 'bg-emerald-50', bg100: 'bg-emerald-100', text500: 'text-emerald-500', text600: 'text-emerald-600', text400: 'text-emerald-400', border500: 'border-emerald-500', border200: 'border-emerald-200', border100: 'border-emerald-100', border600: 'border-emerald-600', border300: 'focus:border-emerald-300', fill400: 'fill-emerald-400', fromColor: 'from-emerald-400', toColor: 'to-teal-400' },
  violet: { bg500: 'bg-violet-500', bg600: 'bg-violet-600', bg50: 'bg-violet-50', bg100: 'bg-violet-100', text500: 'text-violet-500', text600: 'text-violet-600', text400: 'text-violet-400', border500: 'border-violet-500', border200: 'border-violet-200', border100: 'border-violet-100', border600: 'border-violet-600', border300: 'focus:border-violet-300', fill400: 'fill-violet-400', fromColor: 'from-violet-400', toColor: 'to-purple-400' },
  sky: { bg500: 'bg-sky-500', bg600: 'bg-sky-600', bg50: 'bg-sky-50', bg100: 'bg-sky-100', text500: 'text-sky-500', text600: 'text-sky-600', text400: 'text-sky-400', border500: 'border-sky-500', border200: 'border-sky-200', border100: 'border-sky-100', border600: 'border-sky-600', border300: 'focus:border-sky-300', fill400: 'fill-sky-400', fromColor: 'from-sky-400', toColor: 'to-blue-400' },
  rose: { bg500: 'bg-rose-500', bg600: 'bg-rose-600', bg50: 'bg-rose-50', bg100: 'bg-rose-100', text500: 'text-rose-500', text600: 'text-rose-600', text400: 'text-rose-400', border500: 'border-rose-500', border200: 'border-rose-200', border100: 'border-rose-100', border600: 'border-rose-600', border300: 'focus:border-rose-300', fill400: 'fill-rose-400', fromColor: 'from-rose-400', toColor: 'to-orange-400' },
};

const MONTHLY_THEME_MAP = {
  1: { ledger: 'pink', calendar: 'sky' },
  2: { ledger: 'violet', calendar: 'pink' },
  3: { ledger: 'amber', calendar: 'emerald' },
  4: { ledger: 'pink', calendar: 'amber' },
  5: { ledger: 'emerald', calendar: 'rose' },
  6: { ledger: 'sky', calendar: 'emerald' },
  7: { ledger: 'violet', calendar: 'sky' },
  8: { ledger: 'rose', calendar: 'sky' },
  9: { ledger: 'amber', calendar: 'violet' },
  10: { ledger: 'rose', calendar: 'amber' },
  11: { ledger: 'violet', calendar: 'pink' },
  12: { ledger: 'pink', calendar: 'sky' }
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

// 2. HELPER FUNCTIONS
const getKSTDateStr = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
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

const getEventIcon = (type) => {
  switch (type) {
    case '듀티': return <Stethoscope size={16} className="text-pink-500" />;
    case '가족일정': return <Heart size={16} className="text-rose-500" />;
    case '회식': return <Coffee size={16} className="text-amber-500" />;
    default: return <Star size={16} className="text-indigo-500" />;
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

// 🚀 [V2.5] 쫀득 스와이프 물리엔진 공통 함수 (화면이 손가락 따라 움직임!)
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

  if (swipeDistance > modalHeight * 0.28) {
    e.currentTarget.style.transform = 'translateY(100%)';
    setTimeout(() => {
      closeFunction();
      e.currentTarget.style.transform = '';
    }, 250);
  } else {
    e.currentTarget.style.transform = 'translateY(0)';
    setTimeout(() => {
      e.currentTarget.style.transform = '';
    }, 300);
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
        if (newPin === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => { setPin(''); setError(false); }, 500);
        }
      }
    }
  };
  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-slate-800 z-[99999] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="mb-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 shadow-lg border border-white/20">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">비밀번호를 입력하세요</h2>
        <p className="text-gray-400 text-sm mt-2 font-bold">Hope Fam 플래너 보호 중</p>
      </div>

      <div className={`flex gap-4 mb-16 ${error ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${pin.length > i ? 'bg-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/20'}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-x-8 gap-y-6 px-10 max-w-sm w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} onClick={() => handlePress(num.toString())} className="w-16 h-16 rounded-full bg-white/5 text-white text-2xl font-black flex items-center justify-center active:bg-white/20 active:scale-95 transition-all mx-auto border border-white/5">
            {num}
          </button>
        ))}
        <div />
        <button onClick={() => handlePress('0')} className="w-16 h-16 rounded-full bg-white/5 text-white text-2xl font-black flex items-center justify-center active:bg-white/20 active:scale-95 transition-all mx-auto border border-white/5">
          0
        </button>
        <button onClick={handleDelete} className="w-16 h-16 rounded-full text-white/70 flex items-center justify-center active:bg-white/10 active:scale-95 transition-all mx-auto">
          <Delete className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

// 4. SETTINGS COMPONENT
function SettingsView({ activeTab, tabOrder, setTabOrder, currentUser, setCurrentUser, categories, setCategories, userSettings, setUserSettings, selectedYear, selectedMonth, currentMonthKey, user, handleClearAllMessages }) {
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

// 5. LEDGER TAB COMPONENT
function LedgerView({ ledger, setLedger, assets, setAssets, memos, setMemos, selectedYear, selectedMonth, currentMonthKey, todayStr, categories, setCategories, user, isManageMode }) {
  const [ledgerSubTab, setLedgerSubTab] = useState('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [ledgerDateRange, setLedgerDateRange] = useState({ start: '', end: '' });
  
  const [selectedLedgerDetail, setSelectedLedgerDetail] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
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
      data = data.filter(t => typeof t?.date === 'string' && t.date.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`));
    }
    if (filterType !== 'all') data = data.filter(t => t.type === filterType);
    if (filterCategory !== 'all') data = data.filter(t => t.category === filterCategory);
    if (searchQuery.trim()) data = data.filter(t => (t.note||'').toLowerCase().includes(searchQuery.toLowerCase()) || (t.category||'').toLowerCase().includes(searchQuery.toLowerCase()));
    return data;
  }, [ledger, selectedYear, selectedMonth, filterType, filterCategory, searchQuery, ledgerDateRange]);

  const monthUsedCategories = useMemo(() => Array.from(new Set(filteredLedger.map(t => t.category).filter(Boolean))).sort((a,b) => (a||'').localeCompare(b||'')), [filteredLedger]);

  const ledgerSummary = useMemo(() => ({ 
    income: filteredLedger.filter(t => t.type === '수입').reduce((a, b) => a + (b.amount||0), 0), 
    expense: filteredLedger.filter(t => t.type === '지출' && !t.isFromSavings).reduce((a, b) => a + (b.amount||0), 0), 
    net: filteredLedger.filter(t => t.type === '수입').reduce((a, b) => a + (b.amount||0), 0) - filteredLedger.filter(t => t.type === '지출' && !t.isFromSavings).reduce((a, b) => a + (b.amount||0), 0) 
  }), [filteredLedger]);

  const reviewData = useMemo(() => ({
    expense: Object.entries(filteredLedger.filter(t => t.type === '지출').reduce((acc, curr) => { acc[curr.category || '기타'] = (acc[curr.category || '기타'] || 0) + (curr.amount || 0); return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5),
    income: Object.entries(filteredLedger.filter(t => t.type === '수입').reduce((acc, curr) => { acc[curr.category || '기타'] = (acc[curr.category || '기타'] || 0) + (curr.amount || 0); return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5),
  }), [filteredLedger]);

  const financialSummary = useMemo(() => {
    const monthRawLedger = (ledger||[]).filter(t => typeof t?.date==='string' && t.date.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`));
    const rawExpense = monthRawLedger.filter(t => t.type === '지출' && !t.isFromSavings).reduce((a,b)=>a+(b.amount||0),0);
    const sumPrincipal = monthRawLedger.filter(t => (t.category||'').includes('대출상환') || (t.category||'').includes('대출원금') || (t.category||'').includes('원금상환')).reduce((a,b)=>a+(b.amount||0),0);
    const sumInterest = monthRawLedger.filter(t => (t.category||'').includes('대출이자') || (t.category||'').includes('이자상환')).reduce((a,b)=>a+(b.amount||0),0);
    return { sumLiving: rawExpense - sumPrincipal - sumInterest, sumPrincipal, sumInterest };
  }, [ledger, selectedYear, selectedMonth]);

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
    const newTx = { 
       ...formData, 
       category: finalCategory, 
       amount: finalAmount,
       isFromSavings: formData.type === '지출' && formData.category !== '저축' ? formData.isFromSavings : false
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
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', assetToUpdate.id), { balance: newBalance, history: [historyItem, ...(assetToUpdate.history || [])] });
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
    if(currentMemoId) {
        if(isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'memos', currentMemoId), { text: memoText, updatedAt: stamp });
        else setMemos(memos.map(m => m.id === currentMemoId ? {...m, text: memoText, updatedAt: stamp} : m));
    } else {
        if(!memoText.trim()) { setIsMemoEditorOpen(false); return; } 
        const newMemo = { text: memoText, createdAt: stamp, updatedAt: stamp };
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
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-pink-400 to-rose-400 rounded-3xl p-4 text-white shadow-md relative overflow-hidden flex justify-between items-center">
         <div className="relative z-10">
           <div className="text-[10px] font-bold opacity-90 mb-0 tracking-wider">🌸 {selectedYear}년 누적 총 수입</div>
           <div className="text-3xl font-black tracking-tight leading-none mt-1">{formatMoney(yearlyIncome)}<span className="text-lg ml-1 font-bold opacity-80">원</span></div>
         </div>
         <Heart className="w-16 h-16 opacity-20 absolute -right-3 -bottom-3 rotate-12" fill="white" />
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
           {isSearchActive ? '검색된 내역 요약 🔍' : `${selectedMonth}월 가계부 요약 🌷`}
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
        const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const days = Array(firstDay).fill(null).concat(Array.from({length:daysInMonth}, (_,i)=>i+1));
        const dataByDate = {};
        (filteredLedger || []).forEach(t => { if(!dataByDate[t.date]) dataByDate[t.date] = { inc: 0, exp: 0 }; if(t.type === '수입') dataByDate[t.date].inc += t.amount; if(t.type === '지출' && !t.isFromSavings) dataByDate[t.date].exp += t.amount; });
        return (
          <div className="bg-white rounded-[2rem] p-4 shadow-md border border-pink-100 animate-in slide-in-from-bottom-2">
             <div className="grid grid-cols-7 gap-1 text-center mb-2">{['일','월','화','수','목','금','토'].map((d,i) => <div key={d} className={`text-[10px] font-bold ${i===0?'text-pink-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>)}</div>
             <div className="grid grid-cols-7 gap-1">
               {days.map((d, i) => {
                 if(!d) return <div key={`empty-${i}`} className="h-[55px] bg-gray-50/30 rounded-xl border border-gray-100"></div>;
                 const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                 const dayData = dataByDate[dateStr] || { inc: 0, exp: 0 };
                 const hasData = dayData.inc > 0 || dayData.exp > 0;
                 return (
                    <div key={`day-${i}`} onClick={() => setSelectedCalendarDate(dateStr)} className={`h-[55px] border rounded-xl p-0.5 flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform ${hasData?'border-pink-200 bg-pink-50 shadow-sm':'border-gray-100 bg-white hover:bg-gray-50'}`}>
                     <span className={`text-[10px] font-bold mb-0.5 ${(i%7)===0?'text-pink-500':(i%7)===6?'text-blue-500':'text-gray-600'}`}>{d}</span>
                     {dayData.inc > 0 && <span className="text-[9px] font-black text-blue-500 w-full text-center truncate tracking-tighter">+{formatCompactMoney(dayData.inc).replace('+','')}</span>}
                     {dayData.exp > 0 && <span className="text-[9px] font-black text-rose-500 w-full text-center truncate tracking-tighter">-{formatCompactMoney(dayData.exp).replace('-','')}</span>}
                   </div>
                 )
               })}
             </div>
          </div>
        );
      })()}

      {ledgerSubTab === 'review' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          {reviewData.expense.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-md border border-pink-100">
              <h3 className="text-sm font-black text-gray-800 mb-4 flex justify-between"><span>💸 지출 TOP 5</span></h3>
              <div className="space-y-3">
                {reviewData.expense.map(([cat, amt], idx) => (
                  <div key={cat}>
                    <div className="flex justify-between items-end mb-1"><div className="flex items-center gap-1.5"><span className={`w-4 h-4 rounded-full text-[10px] font-black text-white flex justify-center items-center ${idx===0?'bg-rose-500':idx===1?'bg-pink-400':idx===2?'bg-gray-400':'bg-gray-300'}`}>{idx + 1}</span><span className="text-xs font-bold">{cat}</span></div><div className="text-xs font-black">{formatMoney(amt)}원</div></div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5"><div className={`h-full rounded-full ${idx===0?'bg-rose-500':idx===1?'bg-pink-400':idx===2?'bg-gray-400':'bg-gray-300'}`} style={{ width: `${(amt / ledgerSummary.expense) * 100}%` }}></div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {ledgerSubTab === 'memo' && (
        <div className="space-y-3 animate-in slide-in-from-right duration-300">
           <div className="flex justify-between items-center px-1 mb-2">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><NotebookPen size={16} className="text-pink-500"/> 자유 메모</h3>
              <button onClick={() => { setCurrentMemoId(null); setMemoText(''); setIsMemoEditorOpen(true); }} className="text-[10px] bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full font-bold border border-pink-200 shadow-sm">+ 새 메모</button>
           </div>
           {memos.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).map(memo => (
              <div key={memo.id} onClick={() => { setCurrentMemoId(memo.id); setMemoText(memo.text || ''); setIsMemoEditorOpen(true); }} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200/80 cursor-pointer relative hover:bg-gray-50 transition-colors">
                 <div className="text-[10px] font-bold text-gray-400 mb-2">{memo.updatedAt}</div>
                 <div className="text-base font-bold text-gray-800 line-clamp-2 whitespace-pre-wrap">{memo.text || '내용 없음'}</div>
                 <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
              </div>
           ))}
        </div>
      )}

      {ledgerSubTab === 'daily' && (
        <div className="space-y-3 animate-in slide-in-from-left duration-300">
          {ledgerDates.map(date => {
             const dObj = new Date(date);
             const dIndex = dObj.getDay();
             const dName = ['일','월','화','수','목','금','토'][dIndex];
             const dColor = dIndex === 0 ? 'text-red-500' : dIndex === 6 ? 'text-blue-500' : 'text-gray-800';
             return (
              <div key={date} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200/80">
                 <div className={`text-sm font-black flex items-center gap-1.5 mb-2.5 ml-1 whitespace-nowrap ${dColor}`}>
                    <CalendarCheck size={14} />{date} ({dName})
                 </div>
                 <div className="space-y-2.5">
                  {(groupedLedger[date]||[]).map(t => (
                    <div key={t.id} onClick={() => setSelectedLedgerDetail(t)} className="bg-gray-50/50 border border-gray-100/50 rounded-2xl cursor-pointer shadow-sm hover:bg-pink-50 transition-colors">
                      <div className="flex justify-between items-center p-3">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <div className={`p-2.5 rounded-xl shadow-sm ${t.type === '수입' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>{getCategoryIcon(t.category, t.type)}</div>
                          <div className="truncate pr-2">
                            <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1">{t.category}</div>
                            <div className="font-bold text-sm text-gray-800 truncate flex items-center gap-1">{t.note || t.category} {t.isFromSavings && <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">💳 예금사용</span>}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                          <span className={`font-black text-base ${t.type === '수입' ? 'text-blue-500' : t.isFromSavings ? 'text-gray-400 line-through decoration-1' : 'text-gray-900'}`}>{formatLargeMoney(t.amount)}원</span>
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

      {/* 달력 날짜 클릭 시 나타나는 리스트 뷰 모달 */}
      {selectedCalendarDate && (
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
                  {groupedLedger[selectedCalendarDate]?.length > 0 ? (
                      groupedLedger[selectedCalendarDate].map(t => (
                        <div key={t.id} onClick={() => setSelectedLedgerDetail(t)} className="bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer shadow-sm p-3 flex justify-between items-center hover:bg-pink-50 transition-colors active:scale-95">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`p-2.5 rounded-xl shadow-sm shrink-0 ${t.type === '수입' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>{getCategoryIcon(t.category, t.type)}</div>
                            <div className="truncate">
                              <div className="text-[10px] font-bold text-gray-500">{t.category}</div>
                              <div className="font-bold text-sm text-gray-800 truncate flex items-center gap-1">{t.note || t.category} {t.isFromSavings && <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">💳 예금사용</span>}</div>
                            </div>
                          </div>
                          <span className={`font-black text-base shrink-0 ml-2 ${t.type === '수입' ? 'text-blue-500' : t.isFromSavings ? 'text-gray-400 line-through decoration-1' : 'text-gray-900'}`}>{formatLargeMoney(t.amount)}원</span>
                        </div>
                      ))
                  ) : (
                      <div className="text-center py-12 text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">이 날짜에는 등록된 내역이 없어요! 🍃</div>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* 영수증 형태의 상세 뷰 모달 */}
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
                  <div className="text-2xl font-black text-gray-900 mb-2 leading-tight flex items-center gap-2">{selectedLedgerDetail.note || selectedLedgerDetail.category} {selectedLedgerDetail.isFromSavings && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100 flex items-center gap-1"><Coins size={10}/> 예금사용</span>}</div>
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

      {/* 가계부 입력/수정 메인 모달 (오리지널 핑크/블루로 복구) */}
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
                       <div className="text-xs font-black text-gray-800 flex items-center gap-1"><Building2 size={14} className="text-indigo-500"/> 금고 돈 쓰기 (생활비 제외)</div>
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

              <div className="flex gap-2 pt-1 relative z-10">
                 <button type="button" onClick={(e) => handleTransactionSubmit(e, true)} disabled={!formData.amount || !formData.note || (formData.category === '저축' && !formData.linkedAssetId && !editingLedgerId) || (formData.isFromSavings && !formData.linkedAssetId)} className={`flex-1 bg-white border-2 py-3 rounded-[1.2rem] font-black text-xs active:scale-95 shadow-sm transition-colors ${formData.type === '수입' ? 'border-blue-500 text-blue-500' : 'border-pink-500 text-pink-500'} disabled:opacity-50`}>
                    기록하고 계속
                 </button>
                 <button type="button" onClick={(e) => handleTransactionSubmit(e, false)} disabled={!formData.amount || !formData.note || (formData.category === '저축' && !formData.linkedAssetId && !editingLedgerId) || (formData.isFromSavings && !formData.linkedAssetId)} className={`flex-1 py-3 rounded-[1.2rem] text-white font-black text-xs active:scale-95 shadow-md transition-colors ${formData.type === '수입' ? 'bg-blue-600 border border-blue-700' : 'bg-pink-500 border border-pink-600'} disabled:opacity-50`}>
                    닫기 및 완료
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 메모 에디터 모달 */}
      {isMemoEditorOpen && (
        <div className="fixed inset-0 bg-white z-[80] flex flex-col h-[100dvh] animate-in slide-in-from-bottom duration-300">
           <div className="flex justify-between items-center p-4 pt-12 border-b bg-white shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                 <button onClick={() => {setIsMemoEditorOpen(false); setIsCalcOpen(false);}} className="text-gray-500 p-2 bg-gray-50 rounded-full"><ChevronLeftCircle size={24}/></button>
                 <button onClick={() => setIsCalcOpen(!isCalcOpen)} className={`p-2.5 rounded-full shadow-sm transition-colors ${isCalcOpen ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}><Calculator size={22}/></button>
              </div>
              <span className="font-black text-gray-800 text-base">📝 노트 작성</span>
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
} // End of LedgerView

// ==========================================
// 6. DELIVERY TAB COMPONENT
// ==========================================
function DeliveryView({ dailyDeliveries, setDailyDeliveries, selectedYear, selectedMonth, currentMonthKey, todayStr, userSettings, timerActive, trackingStartTime, elapsedSeconds, handleStartDelivery, handleEndDelivery, user, isManageMode }) {
  const [deliverySubTab, setDeliverySubTab] = useState('daily');
  const [deliveryDateRange, setDeliveryDateRange] = useState({ start: '', end: '' });
  const [showDeliveryFilters, setShowDeliveryFilters] = useState(false);
  
  const [selectedShiftDetail, setSelectedShiftDetail] = useState(null);
  const [selectedWeeklySummary, setSelectedWeeklySummary] = useState(null);
  const [selectedDailySummary, setSelectedDailySummary] = useState(null);

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingDeliveryShift, setEditingDeliveryShift] = useState(null);
  const [deliveryFormData, setDeliveryFormData] = useState({ 
    date: todayStr, startTime: '', endTime: '', 
    amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', 
    amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '' 
  });

  const filteredDailyDeliveries = useMemo(() => {
    let data = dailyDeliveries || [];
    if (deliveryDateRange.start || deliveryDateRange.end) {
      if (deliveryDateRange.start) data = data.filter(d => typeof d?.date === 'string' && d.date >= deliveryDateRange.start);
      if (deliveryDateRange.end) data = data.filter(d => typeof d?.date === 'string' && d.date <= deliveryDateRange.end);
    } else data = data.filter(d => typeof d?.date === 'string' && d.date.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`));
    return data;
  }, [dailyDeliveries, selectedYear, selectedMonth, deliveryDateRange]);

  const deliveryFilteredTotal = filteredDailyDeliveries.reduce((a,b) => a + (b.amount||0), 0);
  const deliveryFilteredCount = filteredDailyDeliveries.reduce((a,b) => a + (b.count||0), 0);
  const deliveryAvgPerDelivery = deliveryFilteredCount > 0 ? Math.round(deliveryFilteredTotal / deliveryFilteredCount) : 0;

  const filteredHyunaItems = filteredDailyDeliveries.filter(d => d.earner === '현아');
  const filteredJunghoonItems = filteredDailyDeliveries.filter(d => d.earner === '정훈');

  const deliveryYearlyTotal = useMemo(() => (dailyDeliveries || []).filter(d => typeof d?.date === 'string' && d.date.startsWith(String(selectedYear))).reduce((a,b) => a + (b.amount||0), 0), [dailyDeliveries, selectedYear]);

  const dailyShifts = useMemo(() => {
    const shiftsByDate = {};
    filteredDailyDeliveries.forEach(d => {
        if(!d.date) return;
        if(!shiftsByDate[d.date]) shiftsByDate[d.date] = {};
        
        const shiftKey = (d.startTime && d.endTime) ? `${d.startTime}-${d.endTime}` : `no-time-${d.id}`;
        
        if(!shiftsByDate[d.date][shiftKey]) {
            shiftsByDate[d.date][shiftKey] = {
                id: shiftKey,
                date: d.date,
                startTime: d.startTime,
                endTime: d.endTime,
                items: [],
                totalAmt: 0,
                totalCnt: 0
            };
        }
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

  const pastPaydays = Object.keys(paydayGroups).sort((a,b) => b.localeCompare(a)).filter(p => p && p < todayStr);

  const globalPending = (dailyDeliveries || []).filter(d => typeof d?.date === 'string' && d.date && getPaydayStr(d.date) >= todayStr);

  const pendingByPayday = useMemo(() => {
    const groups = {};
    globalPending.forEach(d => {
      const pd = getPaydayStr(d.date);
      if (!pd) return; 
      if (!groups[pd]) groups[pd] = { total: 0, hyuna: 0, junghoon: 0, items: [] };
      groups[pd].total += (d.amount || 0);
      if (d.earner === '현아') groups[pd].hyuna += (d.amount || 0);
      if (d.earner === '정훈') groups[pd].junghoon += (d.amount || 0);
      groups[pd].items.push(d);
    });
    return groups;
  }, [globalPending]);

  const upcomingPaydays = Object.keys(pendingByPayday).sort();

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const adds = [];
    const createAdd = (amountStr, countStr, earner, platform) => {
      const amt = parseInt(String(amountStr||0).replace(/,/g, ''), 10);
      if(amt > 0) adds.push({ date: deliveryFormData.date, earner, platform, amount: amt, count: parseInt(countStr) || 0, startTime: deliveryFormData.startTime, endTime: deliveryFormData.endTime });
    };

    createAdd(deliveryFormData.amountJunghoonBaemin, deliveryFormData.countJunghoonBaemin, '정훈', '배민');
    createAdd(deliveryFormData.amountJunghoonCoupang, deliveryFormData.countJunghoonCoupang, '정훈', '쿠팡');
    createAdd(deliveryFormData.amountHyunaBaemin, deliveryFormData.countHyunaBaemin, '현아', '배민');
    createAdd(deliveryFormData.amountHyunaCoupang, deliveryFormData.countHyunaCoupang, '현아', '쿠팡');

    if (adds.length === 0) return;

    if (editingDeliveryShift) {
      if (isFirebaseEnabled) {
        for(const item of editingDeliveryShift.items) {
           await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery', item.id));
        }
        for(const newDel of adds) {
           await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'delivery'), newDel);
        }
      } else {
        setDailyDeliveries(prev => {
           const filtered = (prev||[]).filter(p => !editingDeliveryShift.items.find(old => old.id === p.id));
           const newItems = adds.map(a => ({...a, id: Date.now().toString() + Math.random()}));
           return [...newItems, ...filtered];
        });
      }
    } else {
      if (isFirebaseEnabled) {
        for(const newDel of adds) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'delivery'), newDel);
      } else {
        setDailyDeliveries(prev => [...adds.map(a => ({...a, id: Date.now().toString() + Math.random()})), ...(prev||[])]);
      }
    }
    
    setIsDeliveryModalOpen(false); 
    setEditingDeliveryShift(null);
  };

  const openEditShiftForm = (shift) => {
    const form = {
      date: shift.date,
      startTime: shift.startTime || '',
      endTime: shift.endTime || '',
      amountHyunaBaemin: '', countHyunaBaemin: '',
      amountHyunaCoupang: '', countHyunaCoupang: '',
      amountJunghoonBaemin: '', countJunghoonBaemin: '',
      amountJunghoonCoupang: '', countJunghoonCoupang: '',
    };

    shift.items.forEach(d => {
       const earnerEng = d.earner === '정훈' ? 'Junghoon' : 'Hyuna';
       const platformEng = d.platform === '배민' ? 'Baemin' : 'Coupang';
       form[`amount${earnerEng}${platformEng}`] = String(d.amount || '');
       form[`count${earnerEng}${platformEng}`] = String(d.count || '');
    });

    setDeliveryFormData(form);
    setEditingDeliveryShift(shift);
    setSelectedShiftDetail(null); 
    setIsDeliveryModalOpen(true); 
  };

  const deleteShift = async (shift) => {
    if(!window.confirm('이 시간대의 기록을 통째로 모두 삭제하시겠습니까?')) return;
    if (isFirebaseEnabled && user) {
        for(const item of shift.items) {
           await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery', item.id));
        }
    } else {
        setDailyDeliveries(prev => (prev||[]).filter(p => !shift.items.find(old => old.id === p.id)));
    }
    setSelectedShiftDetail(null);
  };

  return (
    <div className="flex flex-col gap-2 pb-28 pt-1 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2 ml-1">
          {timerActive ? <Timer className="w-5 h-5 text-blue-500 animate-pulse" /> : <Play className="w-5 h-5 text-slate-400" />}
          <div>
            <div className="text-sm font-black text-gray-800">실시간 기록 {timerActive && <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>}</div>
            <div className="text-[10px] text-blue-400 font-bold">
               {timerActive ? (() => {
                  const sd = new Date(trackingStartTime);
                  const dayName = ['일','월','화','수','목','금','토'][sd.getDay()];
                  return `${String(sd.getMonth()+1).padStart(2,'0')}-${String(sd.getDate()).padStart(2,'0')}(${dayName}) ${formatTimeStr(sd)}분부터 근무중`;
               })() : '시작 버튼을 눌러주세요'}
            </div>
          </div>
        </div>
        <button onClick={() => { 
          if(timerActive) {
            const end = new Date();
            const startObj = new Date(trackingStartTime);
            setDeliveryFormData({
              date: getKSTDateStr(),
              amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '',
              amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '',
              startTime: formatTimeStr(startObj),
              endTime: formatTimeStr(end)
            });
            setEditingDeliveryShift(null);
            handleEndDelivery();
            setIsDeliveryModalOpen(true);
          } else {
            handleStartDelivery();
          }
        }} className={`px-5 py-2.5 rounded-xl font-black text-sm shadow-sm ${timerActive ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white'}`}>
          {timerActive ? `${Math.floor(elapsedSeconds/3600)}:${String(Math.floor((elapsedSeconds%3600)/60)).padStart(2,'0')}:${String(elapsedSeconds%60).padStart(2,'0')} 종료` : '시작하기'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
        {upcomingPaydays.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl p-4 shadow-sm border text-center text-gray-400 text-sm font-bold">대기 중인 정산금이 없습니다.</div>
        ) : (
          upcomingPaydays.slice(0,2).map((pd, idx) => {
            const group = pendingByPayday[pd];
            return (
              <div key={pd} onClick={() => setSelectedWeeklySummary(pd)} className={`bg-white rounded-2xl p-3.5 shadow-sm border ${idx === 0 ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200'} flex flex-col justify-between cursor-pointer active:scale-95 transition-transform`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[11px] font-black ${idx === 0 ? "text-blue-600" : "text-gray-500"}`}>{pd.slice(5).replace('-','/')}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${idx === 0 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{idx === 0 ? '이번주' : '다음주'}</span>
                </div>
                <div className={`text-2xl font-black ${idx === 0 ? 'text-blue-600' : 'text-gray-700'}`}>{formatLargeMoney(group.total)}<span className="text-base">원</span></div>
              </div>
            )
          })
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-4 text-white shadow-md relative overflow-hidden mt-1">
        <Bike className="absolute -right-2 -bottom-2 w-24 h-24 opacity-10 rotate-12" fill="white" />
        <div className="flex justify-between items-end mb-3 relative z-10">
          <div>
            <div className="text-[11px] font-bold opacity-90 mb-0.5">{(deliveryDateRange.start || deliveryDateRange.end) ? '지정 기간 배달 수익' : `${selectedMonth}월 배달 수익`}</div>
            <div className="text-4xl font-black tracking-tighter leading-none">{formatLargeMoney(deliveryFilteredTotal)}<span className="text-lg ml-1 opacity-80 font-bold">원</span></div>
          </div>
          <div className="text-right">
            <div className="text-[9px] bg-white/20 px-2 py-1 rounded font-bold mb-1.5 inline-block">{selectedYear}년 누적: {formatLargeMoney(deliveryYearlyTotal)}원</div>
            <div className="text-[10px] font-bold opacity-90 flex flex-col items-end"><span>총 {formatLargeMoney(deliveryFilteredCount)}건</span><span>평단 {formatLargeMoney(deliveryAvgPerDelivery)}원</span></div>
          </div>
        </div>
        
        {(userSettings.deliveryGoals?.[currentMonthKey] || 0) > 0 && !deliveryDateRange.start && !deliveryDateRange.end && (() => {
           const goal = userSettings.deliveryGoals[currentMonthKey];
           const pct = Math.min(100, (deliveryFilteredTotal / goal) * 100);
           return (
             <div className="mb-2 relative z-10">
               <div className="flex justify-between text-[10px] font-bold mb-1 opacity-90"><span>목표 {formatLargeMoney(goal)}원</span><span>{pct.toFixed(1)}% 달성</span></div>
               <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden"><div className="bg-white h-full rounded-full transition-all duration-1000" style={{width: `${pct}%`}}></div></div>
             </div>
           );
        })()}

        <div className="flex bg-white/10 rounded-xl p-3 mt-3 divide-x divide-white/20 relative z-10 shadow-sm border border-white/10">
          <div className="flex-1 px-3"><div className="text-[10px] opacity-80 mb-1 flex justify-between font-bold">정훈 <span>{filteredJunghoonItems.reduce((a,b)=>a+(b.count||0),0)}건</span></div><div className="text-base font-black">{formatLargeMoney(filteredJunghoonItems.reduce((a,b)=>a+(b.amount||0),0))}원</div></div>
          <div className="flex-1 px-3"><div className="text-[10px] opacity-80 mb-1 flex justify-between font-bold">현아 <span>{filteredHyunaItems.reduce((a,b)=>a+(b.count||0),0)}건</span></div><div className="text-base font-black">{formatLargeMoney(filteredHyunaItems.reduce((a,b)=>a+(b.amount||0),0))}원</div></div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <div className="flex bg-white p-1 rounded-xl flex-1 shadow-sm border"><button onClick={() => setDeliverySubTab('daily')} className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${deliverySubTab==='daily'?'bg-blue-50 text-blue-600 shadow-sm':'text-gray-500'}`}>상세내역</button><button onClick={() => setDeliverySubTab('calendar')} className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${deliverySubTab==='calendar'?'bg-blue-50 text-blue-600 shadow-sm':'text-gray-500'}`}>달력</button><button onClick={() => setDeliverySubTab('weekly')} className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${deliverySubTab==='weekly'?'bg-blue-50 text-blue-600 shadow-sm':'text-gray-500'}`}>주차별</button></div>
        <button onClick={() => setShowDeliveryFilters(!showDeliveryFilters)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${showDeliveryFilters ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 border'}`}><Filter size={18} /></button>
      </div>

      {showDeliveryFilters && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-200 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2"><input type="date" value={deliveryDateRange.start} onChange={(e) => setDeliveryDateRange({...deliveryDateRange, start: e.target.value})} className="flex-1 bg-slate-50 rounded-xl px-2 h-[44px] text-sm font-bold outline-none border" /><span className="text-gray-300">~</span><input type="date" value={deliveryDateRange.end} onChange={(e) => setDeliveryDateRange({...deliveryDateRange, end: e.target.value})} className="flex-1 bg-slate-50 rounded-xl px-2 h-[44px] text-sm font-bold outline-none border" /></div>
          <button onClick={() => setDeliveryDateRange({start:'', end:''})} className="w-full mt-3 bg-gray-50 border text-gray-500 py-3 rounded-xl font-black text-sm flex justify-center items-center gap-1.5"><RefreshCw size={14}/> 초기화</button>
        </div>
      )}

      {deliverySubTab === 'calendar' && (() => {
        const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const days = Array(firstDay).fill(null).concat(Array.from({length:daysInMonth}, (_,i)=>i+1));
        const dataByDate = {};
        filteredDailyDeliveries.forEach(d => { if(d.date) { if(!dataByDate[d.date]) dataByDate[d.date] = { amt: 0 }; dataByDate[d.date].amt += (d.amount||0); } });

        return (
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-blue-200 animate-in slide-in-from-bottom-2 mt-1">
             <div className="grid grid-cols-7 gap-1 text-center mb-2">{['일','월','화','수','목','금','토'].map((d,i) => <div key={d} className={`text-[11px] font-bold ${i===0?'text-red-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>)}</div>
             <div className="grid grid-cols-7 gap-1">
               {days.map((d, i) => {
                 if(!d) return <div key={`empty-${i}`} className="h-[60px] bg-white rounded-xl border border-gray-100"></div>;
                 const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                 const dayData = dataByDate[dateStr] || { amt: 0 };
                 return (
                   <div key={`day-${i}`} onClick={() => { if(dayData.amt > 0) setSelectedDailySummary(dateStr); }} className={`h-[60px] border rounded-xl p-1 flex flex-col items-center justify-center ${dayData.amt>0?'border-blue-200 bg-blue-50/40 shadow-sm cursor-pointer active:scale-95 transition-transform':'border-gray-100 bg-white'}`}>
                     <span className={`text-[11px] font-bold mb-1 ${(i%7)===0?'text-red-400':(i%7)===6?'text-blue-400':'text-gray-600'}`}>{d}</span>
                     {dayData.amt > 0 && <span className="text-[10px] font-black text-blue-600 w-full text-center truncate tracking-tighter">{formatCompactMoney(dayData.amt).replace('+','')}</span>}
                   </div>
                 )
               })}
             </div>
          </div>
        );
      })()}

      {deliverySubTab === 'weekly' && (
        <div className="space-y-3 animate-in slide-in-from-right duration-300 mt-1">
          {pastPaydays.map(pDate => (
            <div key={pDate} onClick={() => setSelectedWeeklySummary(pDate)} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer active:scale-95 transition-transform">
              <div><div className="text-xs text-gray-400 font-bold mb-1.5">{pDate.slice(5).replace('-', '/')} 입금완료</div><div className="font-black text-gray-800 text-base">{parseInt(pDate.slice(5,7))}월 {getWeekOfMonth(pDate)}주차</div></div>
              <div className="text-right"><div className="text-xl font-black text-blue-600">{formatLargeMoney(paydayGroups[pDate].total)}원</div></div>
            </div>
          ))}
        </div>
      )}

      {deliverySubTab === 'daily' && (
        <div className="space-y-3 animate-in slide-in-from-left duration-300 mt-1">
          {dailyDates.map(date => {
            const shiftList = dailyShifts[date] || [];
            const allItemsForDay = shiftList.flatMap(s => s.items);
            const dayMetrics = calcDailyMetrics(allItemsForDay);
            
            const dateObj = new Date(date);
            const dayIndex = dateObj.getDay();
            const dayName = ['일','월','화','수','목','금','토'][dayIndex];
            const dateColorClass = dayIndex === 0 ? 'text-red-500' : dayIndex === 6 ? 'text-blue-500' : 'text-gray-800';

            return (
              <div key={date} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-200">
                 <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                   <div className="overflow-hidden pr-2 flex-1">
                     <div className={`text-sm font-black flex items-center gap-1.5 mb-1.5 whitespace-nowrap ${dateColorClass}`}>
                        <CalendarCheck size={14} className="shrink-0" />
                        <span>{date} ({dayName})</span>
                     </div>
                     {dayMetrics.durationStr && <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1 truncate"><Timer size={12}/> {dayMetrics.durationStr} 근무</div>}
                   </div>
                   <div className="text-right shrink-0">
                     <div className="text-lg font-black text-blue-600 mb-1.5">{formatLargeMoney(dayMetrics.totalAmt)}원</div>
                     <div className="flex gap-1 justify-end items-center flex-wrap max-w-[150px]">
                       <span className="bg-slate-50 text-[9px] font-black text-gray-500 px-1.5 py-0.5 rounded border whitespace-nowrap">총 {dayMetrics.totalCnt}건</span>
                       <span className="bg-slate-50 text-[9px] font-black text-gray-500 px-1.5 py-0.5 rounded border whitespace-nowrap">평단 {formatLargeMoney(dayMetrics.perDelivery)}원</span>
                       {dayMetrics.hourlyRate > 0 && <span className="bg-blue-50 text-[9px] font-black text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap">시급 {formatLargeMoney(dayMetrics.hourlyRate)}원</span>}
                     </div>
                   </div>
                 </div>

                 <div className="space-y-2">
                  {shiftList.map(shift => {
                    const pDay = getPaydayStr(shift.date);
                    return (
                      <div key={shift.id} onClick={() => setSelectedShiftDetail(shift)} className="flex justify-between items-center bg-slate-50/50 p-3.5 rounded-2xl hover:bg-blue-50/50 transition-colors border border-slate-100/50 cursor-pointer active:scale-95">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-black text-white text-[10px] shrink-0 shadow-sm bg-blue-500`}>
                             <div className="text-lg leading-none">{shift.totalCnt}</div>
                             <div className="font-normal opacity-80 mt-0.5 text-[9px]">건</div>
                          </div>
                          <div className="truncate">
                            <div className="font-black text-sm text-gray-800 truncate">
                               {shift.startTime && shift.endTime ? `${shift.startTime} ~ ${shift.endTime}` : '시간 미지정 기록'}
                            </div>
                            <div className="text-[10px] font-bold mt-1 flex gap-1 items-center">
                               {shift.items.map(item => (
                                  <span key={item.id} className={`px-1.5 py-0.5 rounded border shadow-sm ${item.platform === '배민' ? 'bg-[#2ac1bc]/10 text-[#2ac1bc] border-[#2ac1bc]/20' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                     {item.earner} {item.platform}
                                  </span>
                               ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                             <div className="font-black text-base text-gray-900">{formatLargeMoney(shift.totalAmt)}원</div>
                             <div className={`text-[9px] font-bold mt-0.5 ${pDay && pDay >= todayStr ? 'text-blue-500' : 'text-gray-500'}`}>{pDay && pDay >= todayStr ? `${pDay.slice(5).replace('-','/')} 입금 대기` : '정산 완료'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                 </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedShiftDetail && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[80] p-0 overflow-y-auto no-scrollbar">
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, () => setSelectedShiftDetail(null))}
              className="bg-white w-full max-w-md rounded-t-[3rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 relative border-t-8 border-blue-500"
            >
               <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5 shrink-0"></div>
               <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-1.5"><Bike size={20} className="text-blue-500"/> 근무 타임 상세</h3>
                  <button onClick={() => setSelectedShiftDetail(null)} className="text-gray-400 p-2 bg-gray-50 rounded-full active:scale-95 border border-gray-200"><X size={20}/></button>
               </div>
               
               <div className="mb-5">
                  <div className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1.5"><CalendarCheck size={12}/> {selectedShiftDetail.date}</div>
                  <div className="text-2xl font-black text-gray-900 mb-3 tracking-tighter">
                     {selectedShiftDetail.startTime && selectedShiftDetail.endTime ? `${selectedShiftDetail.startTime} ~ ${selectedShiftDetail.endTime}` : '시간 미지정 기록'}
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 mb-5">
                     {selectedShiftDetail.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-sm ${item.platform === '배민' ? 'bg-[#2ac1bc]' : 'bg-[#111111]'}`}>{item.platform}</span>
                              <span className="font-black text-sm text-gray-700">{item.earner}</span>
                              <span className="text-[10px] font-bold text-gray-400 ml-1">({item.count}건)</span>
                           </div>
                           <div className="font-black text-gray-900">{formatLargeMoney(item.amount)}원</div>
                        </div>
                     ))}
                  </div>

                  <div className="flex justify-between items-end border-t border-gray-100 pt-4 mt-2">
                     <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">총 배달 건수</div>
                        <div className="text-lg font-black text-gray-800">{selectedShiftDetail.totalCnt}건</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">총 정산 금액</div>
                        <div className="text-3xl font-black tracking-tighter text-blue-600">
                           {formatLargeMoney(selectedShiftDetail.totalAmt)}<span className="text-base text-gray-800 font-bold ml-1">원</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <button onClick={() => openEditShiftForm(selectedShiftDetail)} className="py-3.5 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-gray-600 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Edit3 size={16}/> 타임 전체 수정</button>
                  <button onClick={() => deleteShift(selectedShiftDetail)} className="py-3.5 bg-gray-50 border border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-gray-600 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Trash2 size={16}/> 삭제</button>
               </div>
            </div>
         </div>
      )}

      { (selectedWeeklySummary || selectedDailySummary) && (() => {
          const isWeekly = !!selectedWeeklySummary;
          const pd = selectedWeeklySummary || selectedDailySummary;
          const items = isWeekly ? (pendingByPayday[pd]?.items || paydayGroups[pd]?.items || []) 
                                 : (dailyShifts[pd] ? dailyShifts[pd].flatMap(s => s.items) : []);
        
          const title = isWeekly ? `${pd.slice(5).replace('-','/')} 입금 ${pd >= todayStr ? '예정' : '완료'}` : `${pd.slice(5).replace('-','/')} 일일 정산`;
          const metrics = calcDailyMetrics(items);

          return (
             <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70] p-0">
                <div 
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(e) => handleTouchEnd(e, () => { setSelectedWeeklySummary(null); setSelectedDailySummary(null); })}
                  className="bg-white w-full max-w-md rounded-t-[3rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col relative overflow-hidden"
                >
                   <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5 shrink-0"></div>
                   <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
                      <h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><Target className="text-blue-500" size={24}/> {title}</h2>
                      <button onClick={() => {setSelectedWeeklySummary(null); setSelectedDailySummary(null);}} className="bg-gray-100 text-gray-500 p-2 rounded-full active:scale-95"><X size={20}/></button>
                   </div>

                   <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden border border-slate-700">
                       <Bike className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" fill="white" />
                       <div className="relative z-10">
                           <div className="text-blue-200 text-xs font-bold mb-1">총 정산 금액</div>
                           <div className="text-4xl font-black tracking-tighter mb-6">{formatLargeMoney(metrics.totalAmt)}<span className="text-lg font-bold opacity-80 ml-1">원</span></div>
                    
                           <div className="grid grid-cols-2 gap-4 gap-y-6 border-t border-white/10 pt-5">
                              <div>
                                 <div className="text-[10px] text-blue-300 font-bold mb-1 uppercase tracking-widest">배달 건수</div>
                                 <div className="text-xl font-black">{formatLargeMoney(metrics.totalCnt)}건</div>
                              </div>
                              <div>
                                 <div className="text-[10px] text-blue-300 font-bold mb-1 uppercase tracking-widest">근무 시간</div>
                                 <div className="text-xl font-black">{metrics.durationStr || '-'}</div>
                              </div>
                              <div>
                                 <div className="text-[10px] text-blue-300 font-bold mb-1 uppercase tracking-widest">평균 단가</div>
                                 <div className="text-xl font-black">{formatLargeMoney(metrics.perDelivery)}원</div>
                              </div>
                              <div>
                                 <div className="text-[10px] text-blue-300 font-bold mb-1 uppercase tracking-widest">평균 시급</div>
                                 <div className="text-xl font-black">{formatLargeMoney(metrics.hourlyRate)}원</div>
                              </div>
                           </div>
                       </div>
                   </div>
                </div>
             </div>
          );
      })()}

      <button onClick={() => { setEditingDeliveryShift(null); setDeliveryFormData({ date: todayStr, amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '', startTime: '', endTime: '' }); setIsDeliveryModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-blue-600 text-white w-14 h-14 rounded-[1.5rem] shadow-xl shadow-blue-300 flex items-center justify-center active:scale-90 transition-all z-40 border border-blue-500"><Plus size={28}/></button>

      {/* 🚀 [V2.0] 배달 동시 기록 팝업 모달 (바텀시트 적용) */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[90] p-0 overflow-y-auto no-scrollbar">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, () => setIsDeliveryModalOpen(false))}
            className="bg-white w-full max-w-md rounded-t-[3rem] p-7 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 mt-20 border-t-8 border-blue-500 flex flex-col max-h-[90vh]"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 shrink-0"></div>
            <div className="flex justify-between items-center mb-5 shrink-0"><h2 className="text-2xl font-black text-gray-900">{editingDeliveryShift ? '근무 기록 수정 🏍️' : '배달 동시 기록 🏍️'}</h2><button onClick={() => setIsDeliveryModalOpen(false)} className="bg-blue-50 text-blue-500 p-2.5 rounded-2xl border"><X size={20}/></button></div>
            <form onSubmit={handleDeliverySubmit} className="space-y-4 overflow-y-auto no-scrollbar pb-4">
              
              <div className="flex gap-4 pb-4 border-b border-gray-100 mb-2 w-full">
                <div className="flex-[1.2] shrink-0 bg-gray-50 rounded-2xl p-2.5 border border-gray-200">
                  <label className="text-[10px] font-black text-gray-400 ml-1 block mb-1 flex items-center gap-1.5"><CalendarIcon size={12} className="text-blue-500"/>날짜</label>
                  <input type="date" value={deliveryFormData.date} onChange={e=>setDeliveryFormData({...deliveryFormData, date:e.target.value})} className="w-full bg-transparent px-1 h-[32px] font-bold text-xs outline-none" />
                </div>
                <div className="flex-1 shrink-0 bg-gray-50 rounded-2xl p-2.5 border border-gray-200">
                  <label className="text-[10px] font-black text-gray-400 ml-1 block mb-1 flex items-center gap-1.5"><Clock size={12} className="text-blue-500"/>시작</label>
                  <input type="time" value={deliveryFormData.startTime} onChange={e=>setDeliveryFormData({...deliveryFormData, startTime:e.target.value})} className="w-full bg-transparent px-1 h-[32px] font-bold text-xs outline-none" />
                </div>
                <div className="flex-1 shrink-0 bg-gray-50 rounded-2xl p-2.5 border border-gray-200">
                  <label className="text-[10px] font-black text-gray-400 ml-1 block mb-1 flex items-center gap-1.5"><Clock size={12} className="text-blue-500"/>종료</label>
                  <input type="time" value={deliveryFormData.endTime} onChange={e=>setDeliveryFormData({...deliveryFormData, endTime:e.target.value})} className="w-full bg-transparent px-1 h-[32px] font-bold text-xs outline-none" />
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200 shadow-sm">
                <div className="font-black text-blue-700 mb-2 flex items-center gap-1.5">🧑 정훈 수익</div>
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                     <span className="text-[11px] font-bold bg-[#2ac1bc] text-white px-2 py-1.5 rounded w-10 text-center shrink-0">배민</span>
                     <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.countJunghoonBaemin} onChange={e => setDeliveryFormData({...deliveryFormData, countJunghoonBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="건수" className="w-[70px] shrink-0 text-base font-black bg-white rounded-xl px-2 h-[44px] text-center outline-none border border-blue-200 focus:border-blue-400" />
                     <div className="flex-1 relative">
                        <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.amountJunghoonBaemin ? formatLargeMoney(deliveryFormData.amountJunghoonBaemin) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountJunghoonBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="정산 금액" className="w-full text-base font-black bg-white rounded-xl px-3 h-[44px] outline-none border border-blue-200 focus:border-blue-400" />
                     </div>
                  </div>
                  <div className="flex gap-2 items-center">
                     <span className="text-[11px] font-bold bg-[#111111] text-white px-2 py-1.5 rounded w-10 text-center shrink-0">쿠팡</span>
                     <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.countJunghoonCoupang} onChange={e => setDeliveryFormData({...deliveryFormData, countJunghoonCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="건수" className="w-[70px] shrink-0 text-base font-black bg-white rounded-xl px-2 h-[44px] text-center outline-none border border-blue-200 focus:border-blue-400" />
                     <div className="flex-1 relative">
                        <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.amountJunghoonCoupang ? formatLargeMoney(deliveryFormData.amountJunghoonCoupang) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountJunghoonCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="정산 금액" className="w-full text-base font-black bg-white rounded-xl px-3 h-[44px] outline-none border border-blue-200 focus:border-blue-400" />
                     </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm mb-3">
                <div className="font-black text-slate-700 mb-2 flex items-center gap-1.5">👩 현아 수익</div>
                <div className="space-y-2">
                   <div className="flex gap-2 items-center">
                     <span className="text-[11px] font-bold bg-[#2ac1bc] text-white px-2 py-1.5 rounded w-10 text-center shrink-0">배민</span>
                     <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.countHyunaBaemin} onChange={e => setDeliveryFormData({...deliveryFormData, countHyunaBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="건수" className="w-[70px] shrink-0 text-base font-black bg-white rounded-xl px-2 h-[44px] text-center outline-none border border-slate-200 focus:border-blue-400" />
                     <div className="flex-1 relative">
                        <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.amountHyunaBaemin ? formatLargeMoney(deliveryFormData.amountHyunaBaemin) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountHyunaBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="정산 금액" className="w-full text-base font-black bg-white rounded-xl px-3 h-[44px] outline-none border border-slate-200 focus:border-blue-400" />
                     </div>
                  </div>
                  <div className="flex gap-2 items-center">
                     <span className="text-[11px] font-bold bg-[#111111] text-white px-2 py-1.5 rounded w-10 text-center shrink-0">쿠팡</span>
                     <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.countHyunaCoupang} onChange={e => setDeliveryFormData({...deliveryFormData, countHyunaCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="건수" className="w-[70px] shrink-0 text-base font-black bg-white rounded-xl px-2 h-[44px] text-center outline-none border border-slate-200 focus:border-blue-400" />
                     <div className="flex-1 relative">
                        <input type="text" inputMode="numeric" pattern="[0-9,]*" value={deliveryFormData.amountHyunaCoupang ? formatLargeMoney(deliveryFormData.amountHyunaCoupang) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountHyunaCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="정산 금액" className="w-full text-base font-black bg-white rounded-xl px-3 h-[44px] outline-none border border-slate-200 focus:border-blue-400" />
                     </div>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={!(deliveryFormData.amountHyunaBaemin || deliveryFormData.amountHyunaCoupang || deliveryFormData.amountJunghoonBaemin || deliveryFormData.amountJunghoonCoupang)} className="w-full bg-blue-600 mt-2 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 shadow-xl disabled:opacity-50">
                {editingDeliveryShift ? '수정 완료 🚀' : '동시 저장 완료 🚀'}
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
function AssetView({ assets, setAssets, selectedYear, selectedMonth, currentMonthKey, todayStr, user, isManageMode }) {
  const [assetTab, setAssetTab] = useState('deposit');
  const [loanSortBy, setLoanSortBy] = useState(() => localStorage.getItem('hyunaLoanSortBy') || 'date'); 
  
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [newAssetFormData, setNewAssetFormData] = useState({ assetType: 'deposit', name: '', balance: '', principal: '', rate: '', paymentDate: '1', paymentMethod: '이자' });
  const [isPrepayModalOpen, setIsPrepayModalOpen] = useState(false);
  const [prepayFormData, setPrepayFormData] = useState({ loanId: '', date: todayStr, principalAmount: '', interestAmount: '' });
  const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);

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
    if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', id), { [field]: value });
  }

  const deleteAsset = async (id) => {
    if(!window.confirm('이 항목을 정말 삭제하시겠습니까?\n(가계부와 연동된 데이터가 있을 경우 주의하세요)')) return;
    if (isFirebaseEnabled && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', id));
  }

  const handlePayLoanThisMonth = async (loan) => {
    if(!user || !window.confirm(`'${loan.name}' 납부를 완료하시겠습니까?`)) return;
    const newPaidMonths = [...(loan.paidMonths || []), currentMonthKey];
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { paidMonths: newPaidMonths });
  };

  const handleCancelPayLoanThisMonth = async (loan) => {
    if(!user || !window.confirm(`'${loan.name}' 납부를 취소하시겠습니까?`)) return;
    const newPaidMonths = (loan.paidMonths || []).filter(m => m !== currentMonthKey);
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { paidMonths: newPaidMonths });
  };

  const handleAddAssetItem = async (e) => {
    e.preventDefault();
    if (!newAssetFormData.name.trim() || !user) return;
    let newAsset = { assetType: newAssetFormData.assetType, name: newAssetFormData.name };
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
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { principal: newPrincipal, status: newPrincipal === 0 ? '완납' : loan.status, prepaymentHistory: [newHistoryItem, ...(loan.prepaymentHistory || [])] });
    setIsPrepayModalOpen(false);
  };

  const deletePrepaymentHistory = async (loanId, historyId) => {
    if(!user || !window.confirm('이력을 삭제하고 원금을 복구하시겠습니까?')) return;
    const loan = (assets?.loans||[]).find(l => l.id === loanId);
    const historyItem = (loan?.prepaymentHistory||[]).find(h => h.id === historyId);
    if (!loan || !historyItem) return;
    const restoredPrincipal = loan.principal + historyItem.principalAmount;
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { principal: restoredPrincipal, status: restoredPrincipal > 0 ? '상환중' : '완납', prepaymentHistory: (loan.prepaymentHistory||[]).filter(h => h.id !== historyId) });
  };

  return (
    <div className="space-y-4 pb-28 pt-2 animate-in slide-in-from-right duration-500">
      
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

      {/* 🚀 [V2.5] 자산/대출 추가 모달 스와이프 물리엔진 바텀시트 적용 */}
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

      {/* 🚀 [V2.5] 중도상환 모달 스와이프 물리엔진 바텀시트 적용 */}
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

      {/* 🚀 [V2.5] 예적금 상세(히스토리) 모달 스와이프 물리엔진 바텀시트 적용 */}
      {selectedAssetDetail && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[80] overflow-hidden p-0">
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, () => setSelectedAssetDetail(null))}
              className={`bg-white w-full max-w-md rounded-t-[3rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom flex flex-col h-[85vh] border-t-8 ${selectedAssetDetail.assetType === 'deposit' ? 'border-blue-500' : 'border-emerald-500'}`}
            >
               <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
               <div className="flex justify-between items-start mb-4 shrink-0">
                  <div>
                     <span className={`text-[10px] px-2 py-0.5 rounded font-black border shadow-sm mb-2 inline-block ${selectedAssetDetail.assetType === 'deposit' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{selectedAssetDetail.assetType === 'deposit' ? '수시입출금 (예금)' : '묶어둔 돈 (적금)'}</span>
                     <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedAssetDetail.name}</h2>
                     <div className="text-3xl font-black text-indigo-600 mt-1">{formatLargeMoney(selectedAssetDetail.balance)}<span className="text-base text-gray-800 ml-1">원</span></div>
                  </div>
                  <button onClick={() => setSelectedAssetDetail(null)} className="bg-gray-100 text-gray-500 p-2.5 rounded-2xl active:scale-95"><X size={20}/></button>
               </div>
               
               <div className="overflow-y-auto no-scrollbar space-y-3 flex-1 pb-4 border-t border-gray-100 pt-4">
                  {(!selectedAssetDetail.history || selectedAssetDetail.history.length === 0) ? (
                      <div className="text-center py-16 text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">입출금 내역이 없습니다.<br/>가계부에서 저축하거나 예금사용을 체크하면<br/>여기에 자동으로 기록됩니다! ✨</div>
                  ) : (
                      selectedAssetDetail.history.map(h => (
                        <div key={h.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex justify-between items-center">
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
      )}
    </div>
  );
}

// ==========================================
// 8. FAMILY CALENDAR COMPONENT
function FamilyCalendarView({ events, setEvents, messages, setMessages, selectedYear, selectedMonth, currentMonthKey, todayStr, currentUser, user, isManageMode }) {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventFormData, setEventFormData] = useState({ date: todayStr, title: '', type: '가족일정', isImportant: false });
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

  const extendedDutyDays = useMemo(() => Array.from({length: 34}, (_, i) => { const d = new Date(); d.setDate(d.getDate() + (i - 3)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }), []);
  const topImportantEvents = useMemo(() => (events || []).filter(e => e.isImportant && e.date && e.date >= todayStr).sort((a,b) => (a.date||'').localeCompare(b.date||'')).slice(0, 3), [events, todayStr]);
  const familyEventsList = useMemo(() => (events || []).filter(e => e.type !== '듀티' && e.date).sort((a, b) => (a.date||'').localeCompare(b.date||'')), [events]);
  const activeMessages = useMemo(() => (messages || []).filter(m => !m.isChecked).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [messages]);
  const archivedMessages = useMemo(() => (messages || []).filter(m => m.isChecked && !m.isSystemLog).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [messages]);

// 💡 듀티 캘린더 & 가족 일정 타임라인 동시 자동 스크롤 엔진
  useEffect(() => {
    setTimeout(() => {
      // 1. 현아 근무 스케줄(가로)
      const dutyTodayEl = document.getElementById('duty-today');
      if (dutyTodayEl) dutyTodayEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

      // 2. 가족 일정 타임라인 (상단에서 약간 띄워서 2번째 칸에 오도록 설정)
      const timelineTodayEl = document.getElementById('timeline-today');
      if (timelineTodayEl) {
        // scrollIntoView 대신 window.scrollTo나 parent의 scrollTop을 조절할 수도 있지만, 
        // 가장 깔끔한 건 엘리먼트 위치로 이동 후 약간의 오프셋을 주는 겁니다.
        const yOffset = -100; // 이 값을 조절해서 위쪽 일정이 보이는 정도를 맞춥니다.
        const y = timelineTodayEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
      }
    }, 300);
  }, [activeTab]); // 탭 전환 시에도 작동하도록 의존성 추가

  // 💡 오늘 또는 오늘 이후의 가장 가까운 일정의 위치(Index)를 찾는 로직 (없으면 맨 마지막 과거 일정으로)
  const upcomingEventIndex = useMemo(() => {
    const idx = familyEventsList.findIndex(e => e.date >= todayStr);
    return idx !== -1 ? idx : familyEventsList.length - 1;
  }, [familyEventsList, todayStr]);

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
    if (editingEventId) {
      if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEventId), eventFormData);
      else setEvents(events.map(ev => ev.id === editingEventId ? {...eventFormData, id: editingEventId} : ev));
    } else {
      if (isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), eventFormData);
      else setEvents([{...eventFormData, id: Date.now().toString()}, ...(events||[])]);
    }
    setIsEventModalOpen(false); setEditingEventId(null);
  };

  const deleteEvent = async (id) => {
    if(!window.confirm('일정을 삭제하시겠습니까?')) return;
    if (isFirebaseEnabled && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id));
    else setEvents((events||[]).filter(e => e.id !== id));
  };

  const handleSendMessage = async () => {
    if(!messageFormData.text.trim() || !user) return;
    
    const d = new Date();
    let hh = d.getHours();
    const ampm = hh >= 12 ? '오후' : '오전';
    hh = hh % 12 || 12;
    const timeStr = `${ampm} ${hh}:${String(d.getMinutes()).padStart(2,'0')}`;

    const newMsg = { author: currentUser, text: messageFormData.text, createdAt: todayStr, time: timeStr, isChecked: false, replies: [] };
    if (isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), newMsg);
    else setMessages([{...newMsg, id: Date.now().toString()}, ...messages]);
    setMessageFormData({ text: '' });
  };

  const handleAddReplySubmit = async (msgId) => {
    if (!replyText.trim() || !user) return;
    const msg = messages.find(m => m.id === msgId);
    const newReply = { id: Date.now().toString(), author: currentUser, text: replyText, createdAt: todayStr };
    const updatedReplies = [...(msg.replies || []), newReply];
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId), { replies: updatedReplies });
    else setMessages(messages.map(m => m.id === msgId ? { ...m, replies: updatedReplies } : m));
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
           if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', existingEvent.id), { title: newDuty });
           else setEvents(events.map(e => e.id === existingEvent.id ? { ...e, title: newDuty } : e));
           changed = true;
         }
      } else {
         const newEvent = { type: '듀티', title: newDuty, date: dateStr, isImportant: false };
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
      for (const [date, title] of Object.entries(batchDuties)) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { type: '듀티', title, date, isImportant: false });
    } else {
      const kept = events.filter(e => !(e.type === '듀티' && e.date && e.date.startsWith(monthPrefix)));
      const added = Object.entries(batchDuties).map(([date, title], i) => ({ id: `batch_${Date.now()}_${i}`, type: '듀티', title, date, isImportant: false }));
      setEvents([...added, ...kept]);
    }
    setIsDutyBatchModalOpen(false); alert(`${dutyBatchMonth}월 스케쥴이 일괄 저장되었습니다!`);
  };

  return (
    <div className="space-y-5 pb-28 pt-2 animate-in slide-in-from-right duration-500">
      
      <div className="bg-pink-50/80 rounded-3xl p-5 border border-pink-200/60 shadow-sm relative">
         <h3 className="text-xs font-black text-pink-500 mb-3 flex justify-between items-center"><span className="flex items-center gap-1"><MessageSquareHeart size={14}/> 현아&정훈 한줄톡 💌</span><button onClick={() => setIsMessageHistoryOpen(true)} className="text-gray-400 font-bold border-b border-gray-300 pb-0.5 active:text-pink-500">과거 보관소</button></h3>
         <div className="space-y-3 mb-4">
            {activeMessages.length === 0 && <div className="text-center text-gray-400 font-bold text-[10px] py-6 bg-white/50 rounded-2xl border border-pink-100/50">새로운 메시지가 없습니다.</div>}
            {activeMessages.map(m => {
              if (m.isSystemLog || m.author === '시스템') {
                return (
                  <div key={m.id} className="bg-emerald-50 p-3.5 rounded-2xl shadow-sm border border-emerald-100/50">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex flex-col gap-1"><span className="bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-black w-max">시스템 알림</span><span className="text-[11px] font-black text-emerald-900">{m.title || '알림'}</span></div>
                       <span className="text-[10px] font-bold text-emerald-600/70 bg-emerald-100/50 px-2 py-1 rounded-lg border">
                          {typeof m.createdAt === 'string' && m.createdAt.slice(5).replace('-','/')} {m.time}
                       </span>
                    </div>
                    <div className="text-xs font-bold text-emerald-800 leading-relaxed whitespace-pre-wrap pl-1 border-l-2 border-emerald-200 ml-1">{m.text}</div>
                    <div className="mt-2 text-right"><button onClick={() => handleCheckMessage(m.id)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border px-3 py-1.5 rounded-xl text-[10px] font-black active:scale-95 flex items-center gap-1 ml-auto"><CheckCircle2 size={12}/> 확인</button></div>
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
                     <div className="flex justify-end gap-1.5 mt-3 pt-3 border-t border-gray-50"><button onClick={() => setReplyingTo(m.id)} className="text-[11px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border flex items-center gap-1"><MessageSquareHeart size={14}/> 답글</button><button onClick={() => handleCheckMessage(m.id)} className="text-[11px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border flex items-center gap-1"><CheckCircle2 size={14}/> 보관함</button></div>
                   )}
                </div>
              )
           })}
         </div>
         <div className="flex gap-2 relative mt-2">
            <div className="absolute -top-7 left-1"><span className={`text-[10px] font-black px-2 py-1 rounded-t-lg text-white ${currentUser === '현아' ? 'bg-pink-500' : 'bg-blue-600'}`}>{currentUser} 작성중</span></div>
            <input value={messageFormData.text} onChange={e => setMessageFormData({...messageFormData, text: e.target.value})} placeholder="여보 오늘 저녁은 뭐야? 🍗" className="flex-1 bg-white rounded-2xl px-4 py-3.5 text-base font-bold outline-none border border-pink-200 shadow-sm" />
            <button onClick={handleSendMessage} disabled={!messageFormData.text.trim()} className="bg-pink-500 text-white px-4 rounded-2xl font-black shadow-md disabled:opacity-50 whitespace-nowrap">전송</button>
         </div>
      </div>

      <div>
        <div className="flex justify-between items-center px-2 mb-3">
          <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><Stethoscope size={16} className="text-pink-500"/> 현아 근무 스케줄</h3>
          <button onClick={openDutyBatchModal} className="text-[10px] bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full font-bold border border-pink-200 shadow-sm">+ 한달스케쥴 확인/수정</button>
        </div>
        
        <div className="relative pt-4">
          <div ref={dutyTimelineRef} className="flex overflow-x-auto no-scrollbar gap-2 px-2 pb-4 pt-5 scroll-smooth">
            {extendedDutyDays.map((d) => {
              const dutyEvent = events.find(e => e.date === d && e.type === '듀티');
              const duty = dutyEvent ? dutyEvent.title : 'OFF';
              const isToday = d === todayStr;
              let dutyColor = duty === 'DAY' ? 'bg-blue-50 text-blue-600 border-blue-200' : duty === 'EVE' ? 'bg-orange-50 text-orange-600 border-orange-200' : duty === 'OFF' ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-white text-gray-400 border-gray-200';
              
              return (
                <div key={d} id={isToday ? 'duty-today' : undefined} onClick={() => { setSelectedDutyEditDate(d); setIsDutyEditing(false); setIsDutyEditModalOpen(true); }} 
                     className={`flex-none w-[64px] py-1.5 px-2.5 rounded-[1.2rem] border shadow-sm flex flex-col items-center justify-center cursor-pointer relative transition-all ${dutyColor} ${isToday ? 'ring-2 ring-gray-800 ring-offset-2 scale-105 z-10' : ''}`}>
                  {isToday && <div className={`text-[10px] font-black text-gray-800 mb-0.5 absolute -top-4 bg-white px-2 py-0.5 rounded-full border border-gray-300 shadow-sm whitespace-nowrap z-20`}>TODAY</div>}
                  <div className="text-[10px] font-bold mb-1 mt-1">{parseInt(d.slice(5,7))}/{parseInt(d.slice(8,10))}</div>
                  <div className="text-xs font-black">{['일','월','화','수','목','금','토'][new Date(d).getDay()]}</div>
                  <div className="mt-2 text-sm font-black tracking-tighter">{duty}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {topImportantEvents.length > 0 && (
        <div className="bg-gradient-to-br from-pink-400 to-rose-400 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
          <Star className="absolute -right-2 -bottom-2 w-24 h-24 opacity-10 rotate-12" fill="white" />
          <h3 className="text-[11px] font-bold opacity-90 mb-3 flex items-center gap-1.5"><Target size={14}/> 다가오는 중요 일정</h3>
          <div className="space-y-2 relative z-10">
            {topImportantEvents.map(e => (
              <div key={e.id} className="bg-white/20 p-2.5 rounded-xl flex items-center gap-2">
                <div className="bg-white text-pink-600 px-2 py-1 rounded-lg text-[10px] font-black shrink-0 text-center shadow-sm"><div>{parseInt((e.date||'').slice(5,7))}/{parseInt((e.date||'').slice(8,10))}</div><div>{['일','월','화','수','목','금','토'][new Date(e.date||todayStr).getDay()]}</div></div>
                <div className="font-bold text-base truncate">{e.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-200">
        <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5 mb-4"><CalendarDays size={16} className="text-pink-500"/> 가족 일정 타임라인</h3>
        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
          {familyEventsList.length === 0 && <div className="text-center text-gray-400 py-10 font-bold text-sm">등록된 일정이 없습니다.</div>}
{familyEventsList.map((e, i, arr) => {
            const isTodayEvent = i === upcomingEventIndex;
            return (
              <div key={e.id} id={isTodayEvent ? 'timeline-today' : undefined}>
                {(i === 0 || e.date?.slice(0,7) !== arr[i-1].date?.slice(0,7)) && (
                  <div className="relative flex items-center justify-center py-4">
                    <div className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full z-10 border shadow-sm">
                      {e.date.slice(0,4)}년 {parseInt(e.date.slice(5,7))}월
                    </div>
                  </div>
                )}
                
                {/* 💡 오늘 일정일 경우 scale을 살짝 키우고 투명도 조절 제외 */}
                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group py-2 transition-all duration-500 ${isTodayEvent ? 'scale-[1.02] z-20' : ''} ${e.date < todayStr && !isTodayEvent ? 'opacity-60 grayscale-[50%]' : ''}`}>
                  
                  {/* 💡 아이콘 부분: 오늘이면 핑크색 시계 아이콘으로 강조 */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 z-10 ${isTodayEvent ? 'bg-pink-500 text-white ring-4 ring-pink-100' : 'bg-gray-50'}`}>
                    {isTodayEvent ? <Clock size={18} className="animate-pulse" /> : getEventIcon(e.type)}
                  </div>
                  
                  {/* 💡 내용 박스: 오늘이면 bg-pink-50 음영 추가 */}
                  <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3.5 rounded-2xl border shadow-sm ml-3 transition-colors ${isTodayEvent ? 'bg-pink-50 border-pink-200 shadow-pink-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-[10px] font-black ${isTodayEvent ? 'text-pink-600' : 'text-gray-400'}`}>
                          {parseInt(e.date.slice(5,7))}/{parseInt(e.date.slice(8,10))} ({['일','월','화','수','목','금','토'][new Date(e.date).getDay()]})
                          {isTodayEvent && " ✨ 오늘"}
                        </span>
                        <span className="text-[9px] bg-white border text-gray-500 px-1.5 py-0.5 rounded font-bold shadow-sm inline-block w-max">{e.type}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEventFormData(e); setEditingEventId(e.id); setIsEventModalOpen(true); }} className="text-gray-400 hover:text-blue-500 bg-white p-1.5 rounded-lg border shadow-sm"><Edit3 size={12}/></button>
                        <button onClick={() => deleteEvent(e.id)} className="text-gray-400 hover:text-red-500 bg-white p-1.5 rounded-lg border shadow-sm"><Trash2 size={12}/></button>
                      </div>
                    </div>
                    <div className={`font-bold text-base flex items-center gap-1.5 mt-1.5 ${isTodayEvent ? 'text-pink-700' : 'text-gray-800'}`}>
                      {e.title} {e.isImportant && <Star size={14} className="text-amber-400 fill-amber-400"/>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

      <button onClick={() => { setEventFormData({ date: todayStr, title: '', type: '가족일정', isImportant: false }); setEditingEventId(null); setIsEventModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-pink-500 text-white w-14 h-14 rounded-[1.5rem] shadow-xl flex items-center justify-center active:scale-90 z-40 border border-pink-600"><Plus size={28}/></button>

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
              
              <div className="flex gap-3 w-full">
                <div className="flex-[1.1] shrink-0 bg-gray-50 rounded-2xl p-2.5 border border-gray-200 shadow-sm">
                   <label className="text-[10px] font-black text-gray-400 ml-1 block mb-0.5">날짜</label>
                   <input type="date" value={eventFormData.date} onChange={e=>setEventFormData({...eventFormData, date:e.target.value})} className="w-full bg-transparent px-1 h-[28px] font-bold text-sm outline-none" />
                </div>
                <div className="flex-1 shrink-0 bg-gray-50 rounded-2xl p-2.5 border border-gray-200 shadow-sm">
                   <label className="text-[10px] font-black text-gray-400 ml-1 block mb-0.5">분류</label>
                   <select value={eventFormData.type} onChange={e => setEventFormData({...eventFormData, type: e.target.value})} className="w-full bg-transparent px-1 h-[28px] font-bold text-base outline-none appearance-none">
                      <option value="가족일정">가족일정</option>
                      <option value="회식">회식</option>
                      <option value="기타">기타</option>
                   </select>
                </div>
              </div>

              <div><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">일정 내용</label><input type="text" value={eventFormData.title} onChange={e=>setEventFormData({...eventFormData, title:e.target.value})} placeholder="예: 어머님 생신, 팀 회식" className="w-full bg-gray-50 rounded-xl px-4 h-[48px] text-base font-black outline-none border" /></div>
              
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between mt-2">
                <div><div className="text-sm font-black text-amber-700 flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400"/> 중요 일정 등록</div><div className="text-[10px] text-amber-600 font-bold mt-0.5">상단 브리핑 카드에 강조되어 표시됩니다.</div></div>
                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={eventFormData.isImportant} onChange={e => setEventFormData({...eventFormData, isImportant: e.target.checked})} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div></label>
              </div>
              
              <button type="submit" disabled={!eventFormData.title.trim()} className="w-full bg-pink-500 mt-4 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 shadow-xl disabled:opacity-50 border border-pink-600">{editingEventId ? '수정 완료' : '등록 완료'} 🌿</button>
            </form>
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
                    {['일','월','화','수','목','금','토'].map((d, i) => <div key={d} className={`text-center text-[10px] font-bold pb-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>{d}</div>)}
                    {Array.from({length: new Date(dutyBatchYear, dutyBatchMonth - 1, 1).getDay()}).map((_,i) => <div key={`e-${i}`}/>)}
                    {Array.from({length: new Date(dutyBatchYear, dutyBatchMonth, 0).getDate()}).map((_, i) => {
                       const d = i + 1;
                       const dateStr = `${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                       const duty = batchDuties[dateStr];
                       let cellClass = duty === 'DAY' ? 'text-blue-600 border-blue-200 bg-blue-50' : duty === 'EVE' ? 'text-orange-600 border-orange-200 bg-orange-50' : duty === 'OFF' ? 'text-pink-600 border-pink-200 bg-pink-50' : 'text-gray-400 border-gray-100 bg-white';
                       
                       const isCursor = dutyBatchMode === 'continuous' && isDutyBatchEditMode && dateStr === continuousCursorDateStr;
                       if (isCursor) cellClass += ` border-2 border-gray-800 ring-4 ring-gray-200 z-10 scale-110 shadow-md`;
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
} // End of FamilyCalendarView

// 9. MAIN APP CONTENT
function AppContent() {
  const [user, setUser] = useState(null);
  const todayStr = getKSTDateStr();
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('hyunaCurrentUser') || '현아');
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
  const [userSettings, setUserSettings] = useState({ deliveryGoals: {} });

  const [selectedYear, setSelectedYear] = useState(parseInt(todayStr.slice(0,4)));
  const [selectedMonth, setSelectedMonth] = useState(parseInt(todayStr.slice(5,7)));
  const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const [timerActive, setTimerActive] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isAppLocked, setIsAppLocked] = useState(false);

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

  // 🚀 [V3.0] 앱 전체 배경색 및 폰트 컬러 동적 적용
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

  return (
    <>
      {isAppLocked && <LockScreenView correctPin={localStorage.getItem('hyunaLockPin') || '0000'} onUnlock={handleUnlock} />}
      
      <div className={`min-h-screen font-sans text-gray-900 select-none pb-32 transition-colors duration-500 ${appBgColor} ${isAppLocked ? 'hidden' : ''}`}>
        
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

        {isManageMode && <SettingsView activeTab={activeTab} tabOrder={tabOrder} setTabOrder={setTabOrder} currentUser={currentUser} setCurrentUser={setCurrentUser} categories={categories} setCategories={setCategories} userSettings={userSettings} setUserSettings={setUserSettings} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} user={user} handleClearAllMessages={handleClearAllMessages} />}

        <main className="px-5 max-w-md mx-auto pt-2">
          {activeTab === 'ledger' && <LedgerView ledger={ledger} setLedger={setLedger} assets={assets} setAssets={setAssets} memos={memos} setMemos={setMemos} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} todayStr={todayStr} categories={categories} setCategories={setCategories} user={user} isManageMode={isManageMode} />}
          {activeTab === 'delivery' && <DeliveryView dailyDeliveries={dailyDeliveries} setDailyDeliveries={setDailyDeliveries} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} todayStr={todayStr} userSettings={userSettings} timerActive={timerActive} trackingStartTime={trackingStartTime} elapsedSeconds={elapsedSeconds} handleStartDelivery={handleStartDelivery} handleEndDelivery={handleEndDelivery} user={user} isManageMode={isManageMode} />}
          {activeTab === 'assets' && <AssetView assets={assets} setAssets={setAssets} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} todayStr={todayStr} user={user} isManageMode={isManageMode} />}
          {activeTab === 'calendar' && <FamilyCalendarView events={events} setEvents={setEvents} messages={messages} setMessages={setMessages} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} todayStr={todayStr} currentUser={currentUser} user={user} isManageMode={isManageMode} />}
        </main>

        <nav className="fixed bottom-6 left-4 right-4 h-[72px] bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-200/50 flex justify-around items-center z-50 px-2">
          {tabOrder.map((tabId) => {
            const config = tabConfig[tabId];
            const Icon = config.icon;
            const isActive = activeTab === tabId;
            
            // 🚀 [V3.0] 하단 네비게이션 액티브 컬러 동적 적용
            let activeColor = 'text-indigo-500';
            if (tabId === 'ledger') activeColor = currentLedgerTheme.text500;
            if (tabId === 'calendar') activeColor = currentCalendarTheme.text500;
            if (tabId === 'delivery') activeColor = 'text-blue-500';

            return (
              <button key={tabId} onClick={() => setActiveTab(tabId)} className={`flex flex-col items-center w-14 transition-all ${isActive ? `${activeColor} scale-110` : 'text-gray-400 hover:text-gray-500'}`}>
                <Icon size={22}/>
                <span className="text-[10px] font-black mt-1.5">{config.label}</span>
              </button>
            )
           })}
        </nav>

        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; background-color: #f9fafb; }
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
    this.setState({ errorInfo }); }
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
