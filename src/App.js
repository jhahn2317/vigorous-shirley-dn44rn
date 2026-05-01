import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Calendar as CalendarIcon, PieChart, List, 
  ChevronLeft, ChevronRight, X, ArrowDownCircle, ArrowUpCircle, 
  Bike, Landmark, Wallet, CheckCircle2, 
  Trash2, Settings, Clock, Search, ChevronDown, ChevronUp, CalendarCheck, Coins, Filter, RefreshCw, ArrowDownUp, Timer, Target, Edit3, CalendarDays, Play, Square, Smartphone, Heart,
  Utensils, Home, Car, Shield, User, CreditCard, PiggyBank, GraduationCap, Gift, Plane, FileText, Film, Scissors, ShoppingBag, Tv, Package, Briefcase, Star, Stethoscope, Coffee, MessageSquareHeart,
  NotebookPen, Calculator, ChevronLeftCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';

// ==========================================
// 1. FIREBASE SETUP & CONSTANTS
// ==========================================
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

const DEFAULT_CATEGORIES = {
  지출: ['식비', '주거/통신', '교통/차량', '보험', '오빠생활비', '대출상환', '카드대금', '저축', '교육', '경조사', '여행경비', '세금', '문화생활', '미용', '쇼핑', '가전', '생필품', '교회', '기타'],
  수입: ['월급', '배달비', '월세', '용돈', '기타수입']
};

const tabConfig = {
  calendar: { id: 'calendar', label: '우리가족', icon: CalendarIcon, colorClass: 'text-emerald-500' },
  ledger: { id: 'ledger', label: '가계부', icon: Wallet, colorClass: 'text-pink-500' },
  delivery: { id: 'delivery', label: '배달수익', icon: Bike, colorClass: 'text-blue-500' },
  loans: { id: 'loans', label: '대출관리', icon: Landmark, colorClass: 'text-indigo-600' },
};

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================
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
  hh = hh % 12; hh = hh ? hh : 12; 
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

const formatCompactMoney = (val) => {
  if (!val || val === 0) return '0';
  const absVal = Math.abs(val);
  if (absVal >= 10000) {
    const v = absVal / 10000;
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

const formatEquation = (eq) => eq.replace(/[\d.]+/g, (match) => match.includes('.') ? Number(match.split('.')[0]).toLocaleString('ko-KR') + '.' + match.split('.')[1] : Number(match).toLocaleString('ko-KR'));

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
    if(d.startTime && d.endTime) {
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

// ==========================================
// 3. COMMON COMPONENTS
// ==========================================
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

// ==========================================
// 4. SETTINGS COMPONENT
// ==========================================
function SettingsView({ activeTab, tabOrder, setTabOrder, currentUser, setCurrentUser, categories, setCategories, userSettings, setUserSettings, selectedYear, selectedMonth, currentMonthKey, user }) {
  const [settingsTab, setSettingsTab] = useState('common');

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
      <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner">
        <button onClick={() => setSettingsTab('common')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${settingsTab === 'common' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>⚙️ 시스템 설정</button>
        <button onClick={() => setSettingsTab('menu')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${settingsTab === 'menu' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>📂 메뉴별 설정</button>
      </div>

      {settingsTab === 'common' ? (
        <>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md animate-in slide-in-from-left-2">
            <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><User size={16} className="text-purple-500"/> 내 기기 프로필 설정</h3>
            <div className="flex gap-2">
              <button onClick={() => handleSetCurrentUser('현아')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${currentUser === '현아' ? 'bg-pink-500 text-white shadow-md border-pink-600' : 'bg-pink-50 text-pink-400 border border-pink-100 hover:bg-pink-100'}`}>👩 현아</button>
              <button onClick={() => handleSetCurrentUser('정훈')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${currentUser === '정훈' ? 'bg-blue-600 text-white shadow-md border-blue-700' : 'bg-blue-50 text-blue-400 border border-blue-100 hover:bg-blue-100'}`}>🧑 정훈</button>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md animate-in slide-in-from-left-2">
            <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><Smartphone size={16} className={activeTab === 'ledger' ? 'text-pink-500' : activeTab === 'delivery' ? 'text-blue-500' : 'text-indigo-500'}/> 앱 시작 시 기본 화면</h3>
            <div className={`flex justify-between items-center p-3 rounded-xl border ${activeTab === 'ledger' ? 'bg-pink-50/50 border-pink-200/50' : activeTab === 'delivery' ? 'bg-blue-50/50 border-blue-200/50' : activeTab === 'calendar' ? 'bg-emerald-50/50 border-emerald-200/50' : 'bg-indigo-50/50 border-indigo-200/50'}`}>
              <div><span className={`text-sm font-black ${activeTab === 'ledger' ? 'text-pink-600' : activeTab === 'delivery' ? 'text-blue-600' : activeTab === 'calendar' ? 'text-emerald-600' : 'text-indigo-700'}`}>{tabConfig[activeTab].label}</span></div>
              <button onClick={() => { localStorage.setItem('hyunaDefaultTab', activeTab); alert('초기화면이 설정되었습니다.'); }} className={`${activeTab === 'ledger' ? 'bg-pink-500' : activeTab === 'delivery' ? 'bg-blue-600' : 'bg-indigo-600'} text-white text-[10px] px-3 py-2 rounded-lg font-bold shadow-sm active:scale-95`}>현재 탭으로 고정</button>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md animate-in slide-in-from-left-2">
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
        </>
      ) : (
        <>
          {activeTab === 'ledger' && (
            <div className="bg-white p-5 rounded-2xl border border-pink-200 shadow-md animate-in slide-in-from-right-2">
              <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-1.5"><Settings size={16}/> 카테고리 관리 💖</h3>
              <div className="space-y-4">
                {['지출', '수입'].map(type => (
                  <div key={type}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-bold ${type==='지출'?'text-pink-500':'text-blue-500'}`}>{type} 카테고리</span>
                      <button onClick={() => handleAddCategory(type)} className={`text-[10px] ${type==='지출'?'bg-pink-50 text-pink-600 border-pink-100':'bg-blue-50 text-blue-600 border-blue-100'} px-2 py-1 rounded font-bold border`}>+ 추가</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {getSortedCategories(type).map(c => (
                        <span key={c} className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-bold">{c} <button onClick={() => handleDeleteCategory(type, c)} className={`text-gray-400 hover:${type==='지출'?'text-pink-500':'text-blue-500'}`}><X size={12}/></button></span>
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
                <input type="number" value={userSettings.deliveryGoals?.[currentMonthKey] || ''} onChange={(e) => updateSettings('deliveryGoals', {...(userSettings.deliveryGoals || {}), [currentMonthKey]: parseInt(e.target.value)||0})} placeholder="목표 금액 입력" className="flex-1 bg-blue-50/50 rounded-xl p-3 h-[48px] text-sm font-black outline-none border border-blue-100 focus:ring-2 ring-blue-300" />
                <span className="text-gray-500 font-bold text-sm">원</span>
              </div>
            </div>
          )}
          {(activeTab === 'loans' || activeTab === 'calendar') && (
            <div className={`bg-white p-5 rounded-2xl border ${activeTab==='loans'?'border-indigo-200':'border-emerald-200'} shadow-md animate-in slide-in-from-right-2 text-center text-sm font-bold text-gray-500`}>
              {activeTab === 'loans' ? '설정에 있던 [대출 추가] 버튼은 메인 화면으로 이동되었습니다.' : '우리가족 메뉴는 별도의 설정이 필요하지 않습니다.'}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ==========================================
// 5. LEDGER TAB COMPONENT
// ==========================================
function LedgerView({ ledger, setLedger, memos, setMemos, selectedYear, selectedMonth, currentMonthKey, todayStr, categories, setCategories, user, isManageMode }) {
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
  const [formData, setFormData] = useState({ date: todayStr, type: '지출', amount: '', category: '식비', note: '', subNote: '' });

  const [isMemoEditorOpen, setIsMemoEditorOpen] = useState(false);
  const [currentMemoId, setCurrentMemoId] = useState(null);
  const [memoText, setMemoText] = useState('');
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcInput, setCalcInput] = useState('');

  const getSortedCategories = (type) => {
    let cats = type === 'all' ? [...(categories['지출'] || []), ...(categories['수입'] || [])] : [...(categories[type] || [])];
    return Array.from(new Set(cats)).sort((a, b) => (a||'').localeCompare(b||''));
  };

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
  const ledgerSummary = useMemo(() => ({ income: filteredLedger.filter(t => t.type === '수입').reduce((a, b) => a + (b.amount||0), 0), expense: filteredLedger.filter(t => t.type === '지출').reduce((a, b) => a + (b.amount||0), 0), net: filteredLedger.filter(t => t.type === '수입').reduce((a, b) => a + (b.amount||0), 0) - filteredLedger.filter(t => t.type === '지출').reduce((a, b) => a + (b.amount||0), 0) }), [filteredLedger]);

  const reviewData = useMemo(() => ({
    expense: Object.entries(filteredLedger.filter(t => t.type === '지출').reduce((acc, curr) => { acc[curr.category || '기타'] = (acc[curr.category || '기타'] || 0) + (curr.amount || 0); return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5),
    income: Object.entries(filteredLedger.filter(t => t.type === '수입').reduce((acc, curr) => { acc[curr.category || '기타'] = (acc[curr.category || '기타'] || 0) + (curr.amount || 0); return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5),
  }), [filteredLedger]);

  const financialSummary = useMemo(() => {
    const monthRawLedger = (ledger||[]).filter(t => typeof t?.date==='string' && t.date.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`));
    const rawExpense = monthRawLedger.filter(t => t.type === '지출').reduce((a,b)=>a+(b.amount||0),0);
    const sumPrincipal = monthRawLedger.filter(t => (t.category||'').includes('대출상환') || (t.category||'').includes('대출원금') || (t.category||'').includes('원금상환')).reduce((a,b)=>a+(b.amount||0),0);
    const sumInterest = monthRawLedger.filter(t => (t.category||'').includes('대출이자') || (t.category||'').includes('이자상환')).reduce((a,b)=>a+(b.amount||0),0);
    return { sumLiving: rawExpense - sumPrincipal - sumInterest, sumPrincipal, sumInterest };
  }, [ledger, selectedYear, selectedMonth]);

  const groupedLedger = useMemo(() => (filteredLedger || []).reduce((acc, curr) => { if(curr.date){ if (!acc[curr.date]) acc[curr.date] = []; acc[curr.date].push(curr); } return acc; }, {}), [filteredLedger]);
  const ledgerDates = Object.keys(groupedLedger).sort((a, b) => new Date(b) - new Date(a));

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !user) return;
    let finalCategory = formData.category;
    if (isCustomCategory) {
      if (!customCategoryInput.trim()) return alert("카테고리를 입력해주세요.");
      finalCategory = customCategoryInput.trim();
      if (saveToCategoryList) {
        const newCats = {...categories, [formData.type]: [...(categories[formData.type]||[]), finalCategory]};
        if (isFirebaseEnabled) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'categories'), newCats);
        else setCategories(newCats);
      }
    }
    const newTx = { ...formData, category: finalCategory, amount: parseInt(String(formData.amount).replace(/,/g, ''), 10) };
    if (editingLedgerId) {
      if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ledger', editingLedgerId), newTx);
      else setLedger(ledger.map(t => t.id === editingLedgerId ? {...newTx, id: editingLedgerId} : t));
    } else {
      if (isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ledger'), newTx);
      else setLedger([{...newTx, id: Date.now().toString()}, ...ledger]);
    }
    setIsModalOpen(false); setEditingLedgerId(null);
  };

  const handleEditClick = (t) => {
    setSelectedLedgerDetail(null);
    setFormData({ date: t.date, type: t.type, amount: String(t.amount), category: t.category, note: t.note || '', subNote: t.subNote || '' });
    setEditingLedgerId(t.id);
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
  };

  const deleteMemo = async () => {
    if (!currentMemoId || !user || !window.confirm("메모를 삭제하시겠습니까?")) return;
    if (isFirebaseEnabled) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'memos', currentMemoId));
    else setMemos(memos.filter(m => m.id !== currentMemoId));
    setIsMemoEditorOpen(false); setIsCalcOpen(false);
  };

  const handleCalcBtn = (val) => {
    if (val === 'AC') setCalcInput('');
    else if (val === '⌫') setCalcInput(prev => prev.slice(0, -1));
    else if (val === '=') { try { setCalcInput(String(new Function('return (' + calcInput.replace(/×/g, '*').replace(/÷/g, '/') + ')')())); } catch { setCalcInput('Error'); } }
    else if (val === '+/-') { try { setCalcInput(String(-new Function('return (' + calcInput.replace(/×/g, '*').replace(/÷/g, '/') + ')')())); } catch {} }
    else if (val === '%') { try { setCalcInput(String(new Function('return (' + calcInput.replace(/×/g, '*').replace(/÷/g, '/') + ')')() / 100)); } catch {} }
    else { if (calcInput === 'Error') setCalcInput(val); else setCalcInput(prev => prev + val); }
  };

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
          <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${showFilters ? 'bg-pink-500 text-white' : 'bg-white text-pink-500 border border-pink-200/60'}`}><Search size={16} /></button>
          <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1 flex-1">
            <button onClick={() => { setFilterType('all'); setFilterCategory('all'); }} className={`flex-none px-3 py-1.5 rounded-xl text-xs font-black shadow-sm ${filterCategory === 'all' && filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-pink-200/50'}`}>전체</button>
            {monthUsedCategories.map(c => (
              <button key={c} onClick={() => { setFilterType('all'); setFilterCategory(c === filterCategory ? 'all' : c); }} className={`flex-none px-3 py-1.5 rounded-xl text-xs font-black shadow-sm ${filterCategory === c ? 'bg-pink-500 text-white' : 'bg-white text-gray-500 border border-pink-200/50'}`}>#{c}</button>
            ))}
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-200/60 animate-in slide-in-from-top-2 space-y-3 mb-3">
            <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="text" placeholder="검색어 입력" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-pink-50/50 rounded-xl py-2 pl-9 pr-3 h-[44px] text-sm font-bold outline-none border border-pink-100" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterCategory('all'); }} className="w-full bg-pink-50/50 border border-pink-100 rounded-xl px-2 h-[44px] text-sm font-bold outline-none"><option value="all">전체보기</option><option value="지출">지출만</option><option value="수입">수입만</option></select></div>
              <div><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-pink-50/50 border border-pink-100 rounded-xl px-2 h-[44px] text-sm font-bold outline-none truncate"><option value="all">모든 분류</option>{getSortedCategories(filterType).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div><div className="flex items-center gap-1.5"><input type="date" value={ledgerDateRange.start} onChange={(e) => setLedgerDateRange({...ledgerDateRange, start: e.target.value})} className="flex-1 bg-pink-50/50 border border-pink-100 rounded-xl px-2 h-[44px] text-xs font-bold outline-none" /><span className="text-gray-300 font-bold">~</span><input type="date" value={ledgerDateRange.end} onChange={(e) => setLedgerDateRange({...ledgerDateRange, end: e.target.value})} className="flex-1 bg-pink-50/50 border border-pink-100 rounded-xl px-2 h-[44px] text-xs font-bold outline-none" /></div></div>
            <button onClick={() => {setSearchQuery(''); setFilterType('all'); setFilterCategory('all'); setLedgerDateRange({start:'',end:''});}} className="w-full bg-gray-50 border border-gray-200 text-gray-500 py-3 rounded-xl font-black text-sm flex justify-center items-center gap-1.5 hover:text-pink-600"><RefreshCw size={14}/> 초기화</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-md border border-pink-200/80 relative overflow-hidden">
         <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><PieChart size={16} className="text-pink-500"/> {selectedMonth}월 가계부 요약 🌷</h3>
         <div className="grid grid-cols-3 gap-2 mb-3">
           <div className="bg-blue-50/60 p-3 rounded-2xl border text-center shadow-sm"><div className="text-[9px] font-bold text-blue-500 mb-1">수입 합계 💰</div><AutoScaleValue value={ledgerSummary.income} /></div>
           <div className="bg-rose-50/60 p-3 rounded-2xl border text-center shadow-sm"><div className="text-[9px] font-bold text-rose-500 mb-1">지출 합계 💸</div><AutoScaleValue value={ledgerSummary.expense} /></div>
           <div className="bg-purple-50/60 p-3 rounded-2xl border text-center shadow-sm"><div className="text-[9px] font-bold text-purple-500 mb-1">남은 돈 ✨</div><AutoScaleValue value={ledgerSummary.net} isNet={true} /></div>
         </div>
         <div className="flex justify-between text-center gap-2">
           <div className="flex-1 bg-gray-50/80 p-2 rounded-xl border"><div className="text-[9px] font-bold text-gray-500 mb-1">순수 생활비 🍱</div><AutoScaleValue value={financialSummary.sumLiving} /></div>
           <div className="flex-1 bg-gray-50/80 p-2 rounded-xl border"><div className="text-[9px] font-bold text-gray-500 mb-1">대출 원금 🏦</div><AutoScaleValue value={financialSummary.sumPrincipal} /></div>
           <div className="flex-1 bg-gray-50/80 p-2 rounded-xl border"><div className="text-[9px] font-bold text-gray-500 mb-1">대출 이자 📉</div><AutoScaleValue value={financialSummary.sumInterest} /></div>
         </div>
      </div>

      <div className="flex bg-pink-100/40 p-1.5 rounded-2xl mx-1 mb-2 mt-4 shadow-inner border border-pink-200/50">
        <button onClick={() => setLedgerSubTab('daily')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${ledgerSubTab==='daily'?'bg-white text-pink-600 shadow-sm border border-pink-200/50':'text-gray-500'}`}><List size={14}/> 상세내역</button>
        <button onClick={() => setLedgerSubTab('calendar')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${ledgerSubTab==='calendar'?'bg-white text-pink-600 shadow-sm border border-pink-200/50':'text-gray-500'}`}><CalendarDays size={14}/> 달력</button>
        <button onClick={() => setLedgerSubTab('review')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${ledgerSubTab==='review'?'bg-white text-pink-600 shadow-sm border border-pink-200/50':'text-gray-500'}`}><PieChart size={14}/> 리포트</button>
        <button onClick={() => setLedgerSubTab('memo')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${ledgerSubTab==='memo'?'bg-white text-pink-600 shadow-sm border border-pink-200/50':'text-gray-500'}`}><NotebookPen size={14}/> 메모장</button>
      </div>

      {ledgerSubTab === 'calendar' && (() => {
        const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const days = Array(firstDay).fill(null).concat(Array.from({length:daysInMonth}, (_,i)=>i+1));
        const dataByDate = {};
        (filteredLedger || []).forEach(t => { if(!dataByDate[t.date]) dataByDate[t.date] = { inc: 0, exp: 0 }; if(t.type === '수입') dataByDate[t.date].inc += t.amount; if(t.type === '지출') dataByDate[t.date].exp += t.amount; });

        return (
          <div className="bg-white rounded-[2rem] p-4 shadow-md border border-pink-200/60 animate-in slide-in-from-bottom-2">
             <div className="grid grid-cols-7 gap-1 text-center mb-2">{['일','월','화','수','목','금','토'].map((d,i) => <div key={d} className={`text-[10px] font-bold ${i===0?'text-pink-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>)}</div>
             <div className="grid grid-cols-7 gap-1">
               {days.map((d, i) => {
                 if(!d) return <div key={`empty-${i}`} className="h-[55px] bg-gray-50/30 rounded-xl border border-gray-100"></div>;
                 const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                 const dayData = dataByDate[dateStr] || { inc: 0, exp: 0 };
                 const hasData = dayData.inc > 0 || dayData.exp > 0;
                 return (
                   <div key={`day-${i}`} onClick={() => setSelectedCalendarDate(dateStr)} className={`h-[55px] border rounded-xl p-0.5 flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform ${hasData?'border-pink-200 bg-pink-50/40 shadow-sm':'border-gray-100 bg-white hover:bg-gray-50'}`}>
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
            <div className="bg-white rounded-3xl p-5 shadow-md border border-pink-200/60">
              <h3 className="text-sm font-black text-gray-800 mb-4 flex justify-between"><span>💸 지출 TOP 5</span><span className="text-rose-500">{formatMoney(ledgerSummary.expense)}원</span></h3>
              <div className="space-y-3">
                {reviewData.expense.map(([cat, amt], idx) => (
                  <div key={cat}>
                    <div className="flex justify-between items-end mb-1"><div className="flex items-center gap-1.5"><span className={`w-4 h-4 rounded-full text-[10px] font-black text-white flex justify-center items-center ${idx===0?'bg-rose-500':idx===1?'bg-pink-400':idx===2?'bg-fuchsia-400':'bg-gray-300'}`}>{idx + 1}</span><span className="text-xs font-bold">{cat}</span></div><div className="text-xs font-black">{formatMoney(amt)}원</div></div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5"><div className={`h-full rounded-full ${idx===0?'bg-rose-500':idx===1?'bg-pink-400':idx===2?'bg-fuchsia-400':'bg-gray-300'}`} style={{ width: `${(amt / ledgerSummary.expense) * 100}%` }}></div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {reviewData.income.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-md border border-blue-200/60">
              <h3 className="text-sm font-black text-gray-800 mb-4 flex justify-between"><span>💰 수입 TOP 5</span><span className="text-blue-500">{formatMoney(ledgerSummary.income)}원</span></h3>
              <div className="space-y-3">
                {reviewData.income.map(([cat, amt], idx) => (
                  <div key={cat}>
                    <div className="flex justify-between items-end mb-1"><div className="flex items-center gap-1.5"><span className={`w-4 h-4 rounded-full text-[10px] font-black text-white flex justify-center items-center ${idx===0?'bg-blue-500':idx===1?'bg-blue-400':idx===2?'bg-cyan-400':'bg-gray-300'}`}>{idx + 1}</span><span className="text-xs font-bold">{cat}</span></div><div className="text-xs font-black">{formatMoney(amt)}원</div></div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5"><div className={`h-full rounded-full ${idx===0?'bg-blue-500':idx===1?'bg-blue-400':idx===2?'bg-cyan-400':'bg-gray-300'}`} style={{ width: `${(amt / ledgerSummary.income) * 100}%` }}></div></div>
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
                 <div className="text-base font-bold text-gray-800 line-clamp-2">{memo.text || '내용 없음'}</div>
                 <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
              </div>
           ))}
        </div>
      )}

      {ledgerSubTab === 'daily' && (
        <div className="space-y-3 animate-in slide-in-from-left duration-300">
          {ledgerDates.map(date => (
            <div key={date} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200/80">
               <div className="text-xs font-bold text-gray-400 mb-2.5 ml-1">{date}</div>
               <div className="space-y-2.5">
                {(groupedLedger[date]||[]).map(t => (
                  <div key={t.id} onClick={() => setSelectedLedgerDetail(t)} className="bg-gray-50/50 border border-gray-100/50 rounded-2xl cursor-pointer shadow-sm hover:bg-pink-50/50 transition-colors">
                    <div className="flex justify-between items-center p-3">
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <div className={`p-2.5 rounded-xl shadow-sm ${t.type === '수입' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>{getCategoryIcon(t.category, t.type)}</div>
                        <div className="truncate pr-2">
                          <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1">{t.category}</div>
                          <div className="font-bold text-sm text-gray-800 truncate">{t.note || t.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                        <span className={`font-black text-base ${t.type === '수입' ? 'text-blue-500' : 'text-gray-900'}`}>{formatMoney(t.amount)}원</span>
                      </div>
                    </div>
                  </div>
                ))}
               </div>
            </div>
          ))}
        </div>
      )}

      {/* 가계부 플로팅 버튼 */}
      <button onClick={() => { setEditingLedgerId(null); setFormData({ date: todayStr, type: '지출', amount: '', category: getSortedCategories('지출')[0]||'식비', note: '', subNote: '' }); setIsModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-pink-500 text-white w-14 h-14 rounded-[1.5rem] shadow-xl shadow-pink-300 flex items-center justify-center active:scale-90 transition-all z-40 border border-pink-400"><Plus size={28}/></button>

      {/* 달력 날짜 클릭 시 나타나는 리스트 뷰 모달 */}
      {selectedCalendarDate && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70] overflow-hidden">
            <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[80vh]">
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
                        <div key={t.id} onClick={() => setSelectedLedgerDetail(t)} className="bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer shadow-sm p-3 flex justify-between items-center hover:bg-pink-50/50 transition-colors active:scale-95">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`p-2.5 rounded-xl shadow-sm shrink-0 ${t.type === '수입' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>{getCategoryIcon(t.category, t.type)}</div>
                            <div className="truncate">
                              <div className="text-[10px] font-bold text-gray-500">{t.category}</div>
                              <div className="font-bold text-sm text-gray-800 truncate">{t.note || t.category}</div>
                            </div>
                          </div>
                          <span className={`font-black text-base shrink-0 ml-2 ${t.type === '수입' ? 'text-blue-500' : 'text-gray-900'}`}>{formatMoney(t.amount)}원</span>
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
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden border border-gray-100">
               <div className={`absolute top-0 left-0 right-0 h-2 ${selectedLedgerDetail.type === '수입' ? 'bg-blue-400' : 'bg-pink-400'}`}></div>
               <div className="flex justify-between items-start mb-6 mt-2">
                  <div className={`p-3 rounded-2xl shadow-sm ${selectedLedgerDetail.type === '수입' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                     {getCategoryIcon(selectedLedgerDetail.category, selectedLedgerDetail.type)}
                  </div>
                  <button onClick={() => setSelectedLedgerDetail(null)} className="text-gray-400 p-2 bg-gray-50 rounded-full active:scale-95 border border-gray-200"><X size={20}/></button>
               </div>
               <div className="mb-6">
                  <div className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1.5"><CalendarIcon size={12}/> {selectedLedgerDetail.date}</div>
                  <div className="text-2xl font-black text-gray-900 mb-2 leading-tight">{selectedLedgerDetail.note || selectedLedgerDetail.category}</div>
                  <div className="text-[11px] font-bold text-gray-500 mb-5 px-2.5 py-1 bg-gray-100 inline-block rounded-lg shadow-inner">{selectedLedgerDetail.category}</div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">{selectedLedgerDetail.type} 금액</div>
                    <div className={`text-4xl font-black tracking-tighter ${selectedLedgerDetail.type === '수입' ? 'text-blue-500' : 'text-rose-500'}`}>
                       {selectedLedgerDetail.type === '수입' ? '+' : '-'}{formatMoney(selectedLedgerDetail.amount)}<span className="text-lg text-gray-800 font-bold ml-1">원</span>
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
               <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <button onClick={() => handleEditClick(selectedLedgerDetail)} className="py-3.5 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-gray-600 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Edit3 size={16}/> 수정</button>
                  <button onClick={() => handleDeleteClick(selectedLedgerDetail.id)} className="py-3.5 bg-gray-50 border border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-gray-600 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Trash2 size={16}/> 삭제</button>
               </div>
            </div>
         </div>
      )}

      {/* 가계부 입력/수정 메인 모달 (폼) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[90] overflow-y-auto no-scrollbar">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-5 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 mt-20 flex flex-col max-h-[90vh]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
            <div className="flex justify-between items-center mb-6 shrink-0"><h2 className="text-2xl font-black text-gray-800">✨ {editingLedgerId ? '내역 수정' : '내역 기록'}</h2><button onClick={() => setIsModalOpen(false)} className="bg-pink-50 text-pink-500 p-2.5 rounded-2xl border border-pink-100"><X size={20}/></button></div>
            <form onSubmit={handleTransactionSubmit} className="space-y-4 overflow-y-auto no-scrollbar flex-1 pb-4">
              <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-200/60 shadow-inner"><button type="button" onClick={() => setFormData({...formData, type:'지출', category: getSortedCategories('지출')[0]})} className={`flex-1 py-3 rounded-xl text-base font-black transition-all ${formData.type==='지출'?'bg-white text-pink-500 shadow-sm border border-pink-100':'text-gray-500'}`}>지출하기</button><button type="button" onClick={() => setFormData({...formData, type:'수입', category: getSortedCategories('수입')[0]})} className={`flex-1 py-3 rounded-xl text-base font-black transition-all ${formData.type==='수입'?'bg-white text-blue-500 shadow-sm border border-blue-100':'text-gray-500'}`}>수입얻기</button></div>
              <div><label className="text-[10px] font-black text-gray-400 ml-2 block">금액</label><div className="relative"><input type="text" value={formData.amount ? formatMoney(formData.amount) : ''} onChange={e => setFormData({...formData, amount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className={`w-full text-4xl font-black border-b-4 ${formData.type === '수입' ? 'focus:border-blue-400' : 'focus:border-pink-400'} border-gray-100 pb-2 outline-none bg-transparent`} /><span className="absolute right-2 bottom-4 text-2xl font-black text-gray-300">원</span></div></div>
              <div className="flex gap-4 w-full">
                <div className="w-[110px] shrink-0"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">날짜</label><input type="date" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} className="w-full bg-gray-50 rounded-xl px-2 h-[48px] font-bold text-sm outline-none border" /></div>
                <div className="w-[130px] shrink-0"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">카테고리</label><select value={isCustomCategory ? '직접입력' : formData.category} onChange={e=>{ if (e.target.value === '직접입력') { setIsCustomCategory(true); setCustomCategoryInput(''); } else { setIsCustomCategory(false); setFormData({...formData, category:e.target.value}); } }} className="w-full bg-gray-50 rounded-xl px-2.5 h-[48px] font-bold text-sm outline-none border">{getSortedCategories(formData.type).map(c => <option key={c} value={c}>{c}</option>)}<option value="직접입력">+ 직접입력 (신규)</option></select></div>
              </div>
              {isCustomCategory && <div><input type="text" placeholder="새 카테고리명" value={customCategoryInput} onChange={e => setCustomCategoryInput(e.target.value)} className="w-full bg-white rounded-xl px-4 h-[48px] font-black text-base outline-none border shadow-sm" /><label className="flex items-center gap-2 mt-2 ml-1 cursor-pointer"><input type="checkbox" checked={saveToCategoryList} onChange={e => setSaveToCategoryList(e.target.checked)} className="w-5 h-5 text-pink-500" /><span className="text-xs font-bold text-gray-500">목록에 추가</span></label></div>}
              <div><label className="text-[10px] font-black text-gray-400 ml-1 mb-1 block">상세 내용</label><input type="text" value={formData.note} onChange={e=>setFormData({...formData, note:e.target.value})} placeholder="어디서 쓰셨나요?" className="w-full bg-gray-50 rounded-xl px-4 h-[48px] font-bold text-base outline-none border" /></div>
              <div><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">세부 내역 기록</label><textarea value={formData.subNote} onChange={e=>setFormData({...formData, subNote:e.target.value})} placeholder="상세 품목 메모" className="w-full bg-gray-50 rounded-xl px-4 py-3 h-[80px] font-bold text-sm outline-none border resize-none" /></div>
              <button type="submit" className={`w-full ${formData.type === '수입' ? 'bg-blue-500 border-blue-600' : 'bg-pink-500 border-pink-600'} mt-2 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 shadow-xl`}>기록 완료</button>
            </form>
          </div>
        </div>
      )}

      {/* 메모 에디터 모달 */}
      {isMemoEditorOpen && (
        <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-bottom duration-300">
           <div className="flex justify-between items-center p-4 pt-12 border-b bg-white shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                 <button onClick={() => {setIsMemoEditorOpen(false); setIsCalcOpen(false);}} className="text-gray-500 p-2 bg-gray-50 rounded-full"><ChevronLeftCircle size={24}/></button>
                 <button onClick={() => setIsCalcOpen(!isCalcOpen)} className={`p-2.5 rounded-full shadow-sm transition-colors ${isCalcOpen ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}><Calculator size={22}/></button>
              </div>
              <span className="font-black text-gray-800 text-base">📝 노트 작성</span>
              <div className="flex items-center gap-3">
                 {currentMemoId && <button onClick={deleteMemo} className="text-red-500 p-2 rounded-full hover:bg-red-50"><Trash2 size={20}/></button>}
                 <button onClick={saveMemo} className="bg-pink-500 text-white px-5 py-2.5 rounded-full font-black text-sm shadow-md">저장</button>
              </div>
           </div>
           <div className="flex-1 p-5 relative overflow-hidden flex flex-col bg-amber-50/20">
              <textarea value={memoText} onChange={e => setMemoText(e.target.value)} className="w-full flex-1 bg-transparent resize-none outline-none text-lg font-bold text-gray-800 whitespace-pre-wrap no-scrollbar" placeholder="자유롭게 입력하세요..." autoFocus />
              {isCalcOpen && (
                 <div className="absolute top-[20px] left-4 right-4 bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-4 z-[90]">
                    <div className="bg-gray-800 rounded-2xl p-4 mb-4 text-right overflow-hidden flex items-center justify-end h-20"><div className="font-black text-white text-3xl">{formatEquation(calcInput || '0')}</div></div>
                    <div className="grid grid-cols-4 gap-2.5 mb-4">
                       {['AC','+/-','%','÷', '7','8','9','×', '4','5','6','-', '1','2','3','+', '⌫','0','.','='].map(btn => (
                          <button key={btn} onClick={() => handleCalcBtn(btn)} className={`h-14 rounded-full font-black text-xl ${['÷','×','-','+','='].includes(btn) ? 'bg-orange-500 text-white' : ['AC','+/-','%','⌫'].includes(btn) ? 'bg-gray-400 text-gray-900' : 'bg-gray-700 text-white'}`}>{btn}</button>
                       ))}
                    </div>
                    <button onClick={() => { if(calcInput && calcInput !== 'Error') { setMemoText(prev => prev + formatMoney(calcInput)); setIsCalcOpen(false); } }} className="w-full bg-blue-500 text-white py-3.5 rounded-2xl font-black text-sm">금액 메모에 넣기 ✍️</button>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. DELIVERY TAB COMPONENT
// ==========================================
function DeliveryView({ dailyDeliveries, setDailyDeliveries, selectedYear, selectedMonth, currentMonthKey, todayStr, userSettings, timerActive, trackingStartTime, elapsedSeconds, handleStartDelivery, handleEndDelivery, user, isManageMode }) {
  const [deliverySubTab, setDeliverySubTab] = useState('daily'); 
  const [deliveryDateRange, setDeliveryDateRange] = useState({ start: '', end: '' });
  const [showDeliveryFilters, setShowDeliveryFilters] = useState(false);
  
  // 💡 상세 뷰 및 대시보드를 위한 새로운 상태 추가
  const [selectedDeliveryDetail, setSelectedDeliveryDetail] = useState(null);
  const [selectedWeeklySummary, setSelectedWeeklySummary] = useState(null);
  const [selectedDailySummary, setSelectedDailySummary] = useState(null);

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingDeliveryId, setEditingDeliveryId] = useState(null);
  const [deliveryFormData, setDeliveryFormData] = useState({ 
    date: todayStr, earner: '정훈', platform: '배민', amount: '', count: '', 
    amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', 
    amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '', startTime: '', endTime: '' 
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

  // 💡 paydayGroups와 pendingByPayday에 items 배열을 추가하여 요약 계산에 사용합니다.
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
  
  const groupedDaily = filteredDailyDeliveries.reduce((acc, curr) => { if(curr.date){ if(!acc[curr.date]) acc[curr.date] = []; acc[curr.date].push(curr); } return acc; }, {});
  const dailyDates = Object.keys(groupedDaily).sort((a,b) => new Date(b) - new Date(a));

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (editingDeliveryId) {
      if (!deliveryFormData.amount) return;
      const newDel = { date: deliveryFormData.date, earner: deliveryFormData.earner, platform: deliveryFormData.platform, amount: parseInt(String(deliveryFormData.amount).replace(/,/g, ''), 10), count: parseInt(deliveryFormData.count) || 0, startTime: deliveryFormData.startTime, endTime: deliveryFormData.endTime };
      if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery', editingDeliveryId), newDel);
      else setDailyDeliveries(prev => (prev||[]).map(item => item.id === editingDeliveryId ? {...newDel, id: item.id} : item));
    } else {
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
      if (isFirebaseEnabled) { for(const newDel of adds) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'delivery'), newDel); } 
      else setDailyDeliveries([...adds.map(a => ({...a, id: Date.now().toString() + Math.random()})), ...(dailyDeliveries||[])]);
    }
    setIsDeliveryModalOpen(false); setEditingDeliveryId(null);
  };

  const deleteDailyDelivery = async (id) => {
    if(!window.confirm('기록을 삭제하시겠습니까?')) return;
    if (isFirebaseEnabled && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery', id));
    else setDailyDeliveries((dailyDeliveries||[]).filter(d => d.id !== id));
  };

  return (
    <div className="flex flex-col gap-2 pb-28 pt-1 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2 ml-1">
          {timerActive ? <Timer className="w-5 h-5 text-blue-500 animate-pulse" /> : <Play className="w-5 h-5 text-slate-400" />}
          <div>
            <div className="text-sm font-black text-gray-800">실시간 기록 {timerActive && <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>}</div>
            <div className="text-[10px] text-blue-400 font-bold">{timerActive ? `${formatTimeStr(new Date(trackingStartTime))}부터 근무중` : '시작 버튼을 눌러주세요'}</div>
          </div>
        </div>
        <button onClick={() => { 
          // 💡 타이머 종료 시 시작/종료 시간이 폼에 자동으로 채워지도록 수정되었습니다.
          if(timerActive) {
            const end = new Date();
            const startObj = new Date(trackingStartTime);
            setDeliveryFormData({
              date: getKSTDateStr(),
              earner: '정훈', platform: '배민', amount: '', count: '',
              amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '',
              amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '',
              startTime: formatTimeStr(startObj),
              endTime: formatTimeStr(end)
            });
            setEditingDeliveryId(null);
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
              // 💡 클릭 시 해당 주차(이번주/다음주) 상세 요약 팝업 오픈
              <div key={pd} onClick={() => setSelectedWeeklySummary(pd)} className={`bg-white rounded-2xl p-3.5 shadow-sm border ${idx === 0 ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200'} flex flex-col justify-between cursor-pointer active:scale-95 transition-transform`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[11px] font-black ${idx === 0 ? "text-blue-600" : "text-gray-500"}`}>{pd.slice(5).replace('-','/')}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${idx === 0 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{idx === 0 ? '이번주' : '다음주'}</span>
                </div>
                <div className={`text-2xl font-black ${idx === 0 ? 'text-blue-600' : 'text-gray-700'}`}>{formatMoney(group.total)}<span className="text-base">원</span></div>
              </div>
            )
          })
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-4 text-white shadow-md relative overflow-hidden mt-1">
        <Bike className="absolute -right-2 -bottom-2 w-24 h-24 opacity-10 rotate-12" />
        <div className="flex justify-between items-end mb-3 relative z-10">
          <div>
            <div className="text-[11px] font-bold opacity-90 mb-0.5">{(deliveryDateRange.start || deliveryDateRange.end) ? '지정 기간 배달 수익' : `${selectedMonth}월 배달 수익`}</div>
            <div className="text-4xl font-black tracking-tighter leading-none">{formatMoney(deliveryFilteredTotal)}<span className="text-lg ml-1 opacity-80 font-bold">원</span></div>
          </div>
          <div className="text-right">
            <div className="text-[9px] bg-white/20 px-2 py-1 rounded font-bold mb-1.5 inline-block">{selectedYear}년 누적: {formatMoney(deliveryYearlyTotal)}원</div>
            <div className="text-[10px] font-bold opacity-90 flex flex-col items-end"><span>총 {formatMoney(deliveryFilteredCount)}건</span><span>평단 {formatMoney(deliveryAvgPerDelivery)}원</span></div>
          </div>
        </div>
        
        {(userSettings.deliveryGoals?.[currentMonthKey] || 0) > 0 && !deliveryDateRange.start && !deliveryDateRange.end && (() => {
           const goal = userSettings.deliveryGoals[currentMonthKey];
           const pct = Math.min(100, (deliveryFilteredTotal / goal) * 100);
           return (
             <div className="mb-2 relative z-10">
               <div className="flex justify-between text-[10px] font-bold mb-1 opacity-90"><span>목표 {formatMoney(goal)}원</span><span>{pct.toFixed(1)}% 달성</span></div>
               <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden"><div className="bg-white h-full rounded-full transition-all duration-1000" style={{width: `${pct}%`}}></div></div>
             </div>
           );
        })()}

        <div className="flex bg-white/10 rounded-xl p-3 mt-3 divide-x divide-white/20 relative z-10 shadow-sm border border-white/10">
          <div className="flex-1 px-3"><div className="text-[10px] opacity-80 mb-1 flex justify-between font-bold">정훈 <span>{filteredJunghoonItems.reduce((a,b)=>a+(b.count||0),0)}건</span></div><div className="text-base font-black">{formatMoney(filteredJunghoonItems.reduce((a,b)=>a+(b.amount||0),0))}원</div></div>
          <div className="flex-1 px-3"><div className="text-[10px] opacity-80 mb-1 flex justify-between font-bold">현아 <span>{filteredHyunaItems.reduce((a,b)=>a+(b.count||0),0)}건</span></div><div className="text-base font-black">{formatMoney(filteredHyunaItems.reduce((a,b)=>a+(b.amount||0),0))}원</div></div>
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
                 if(!d) return <div key={`empty-${i}`} className="h-[60px] bg-gray-50/30 rounded-xl border border-gray-100"></div>;
                 const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                 const dayData = dataByDate[dateStr] || { amt: 0 };
                 return (
                   // 💡 달력의 날짜 클릭 시 해당 날짜의 일간 요약 팝업 오픈
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
            // 💡 과거 주간 내역 클릭 시 주간 요약 팝업 오픈
            <div key={pDate} onClick={() => setSelectedWeeklySummary(pDate)} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer active:scale-95 transition-transform">
              <div><div className="text-xs text-gray-400 font-bold mb-1.5">{pDate.slice(5).replace('-', '/')} 입금완료</div><div className="font-black text-gray-800 text-base">{parseInt(pDate.slice(5,7))}월 {getWeekOfMonth(pDate)}주차</div></div>
              <div className="text-right"><div className="text-xl font-black text-blue-600">{formatMoney(paydayGroups[pDate].total)}원</div></div>
            </div>
          ))}
        </div>
      )}

      {deliverySubTab === 'daily' && (
        <div className="space-y-3 animate-in slide-in-from-left duration-300 mt-1">
          {dailyDates.map(date => {
            const dayMetrics = calcDailyMetrics(groupedDaily[date]);
            return (
              <div key={date} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-200">
                 <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                   <div className="overflow-hidden pr-2">
                     <div className="text-sm font-black text-gray-800 flex items-center gap-1.5 mb-1.5 truncate"><CalendarCheck size={14} className="text-blue-500" />{date}</div>
                     {dayMetrics.durationStr && <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1 truncate"><Timer size={12}/> {dayMetrics.durationStr} 근무</div>}
                   </div>
                   <div className="text-right flex-shrink-0">
                     <div className="text-lg font-black text-blue-600 mb-1.5">{formatMoney(dayMetrics.totalAmt)}원</div>
                     <div className="flex gap-1 justify-end items-center flex-nowrap overflow-x-auto no-scrollbar">
                       <span className="bg-slate-50 text-[9px] font-black text-gray-500 px-1.5 py-0.5 rounded border whitespace-nowrap">총 {dayMetrics.totalCnt}건</span>
                       <span className="bg-slate-50 text-[9px] font-black text-gray-500 px-1.5 py-0.5 rounded border whitespace-nowrap">평단 {formatMoney(dayMetrics.perDelivery)}원</span>
                     </div>
                   </div>
                 </div>
                 <div className="space-y-2">
                  {(groupedDaily[date]||[]).map(d => {
                    const pDay = getPaydayStr(d.date);
                    return (
                      // 💡 개별 내역 터치 시 영수증 뷰 오픈 (관리 모드 상관없이 언제든 수정/삭제 가능)
                      <div key={d.id} onClick={() => setSelectedDeliveryDetail(d)} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl hover:bg-blue-50/50 transition-colors border border-slate-100/50 cursor-pointer active:scale-95">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 shadow-sm ${d.platform === '배민' ? 'bg-[#2ac1bc]' : d.platform === '쿠팡' ? 'bg-[#111111]' : 'bg-gray-400'}`}>{d.platform}</div>
                          <div className="truncate">
                            <div className="font-black text-sm text-gray-800 truncate">{d.earner} <span className="text-gray-400 text-[10px] font-bold">| {d.count}건</span></div>
                            <div className={`text-[10px] font-bold mt-1 truncate ${pDay && pDay >= todayStr ? 'text-blue-500' : 'text-gray-500'}`}>{pDay && pDay >= todayStr ? `${pDay.slice(5).replace('-','/')} 입금 대기` : '정산 완료'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-base text-gray-900">{formatMoney(d.amount)}원</span>
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

      {/* 💡 개별 배달 영수증 상세 뷰 모달 */}
      {selectedDeliveryDetail && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden border border-gray-100">
               <div className="absolute top-0 left-0 right-0 h-2 bg-blue-500"></div>
               <div className="flex justify-between items-start mb-6 mt-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm ${selectedDeliveryDetail.platform === '배민' ? 'bg-[#2ac1bc]' : selectedDeliveryDetail.platform === '쿠팡' ? 'bg-[#111111]' : 'bg-gray-400'}`}>
                     {selectedDeliveryDetail.platform}
                  </div>
                  <button onClick={() => setSelectedDeliveryDetail(null)} className="text-gray-400 p-2 bg-gray-50 rounded-full active:scale-95 border border-gray-200"><X size={20}/></button>
               </div>
               <div className="mb-6">
                  <div className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1.5"><CalendarCheck size={12}/> {selectedDeliveryDetail.date}</div>
                  <div className="text-2xl font-black text-gray-900 mb-2">{selectedDeliveryDetail.earner} 수익</div>
                  <div className="flex gap-2 mb-5">
                     <span className="text-[11px] font-bold text-gray-500 px-2.5 py-1 bg-gray-100 rounded-lg shadow-inner">{selectedDeliveryDetail.count}건 배달</span>
                     {selectedDeliveryDetail.startTime && <span className="text-[11px] font-bold text-gray-500 px-2.5 py-1 bg-gray-100 rounded-lg shadow-inner">{selectedDeliveryDetail.startTime} ~ {selectedDeliveryDetail.endTime}</span>}
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">정산 금액</div>
                     <div className="text-4xl font-black tracking-tighter text-blue-600">
                        {formatMoney(selectedDeliveryDetail.amount)}<span className="text-lg text-gray-800 font-bold ml-1">원</span>
                     </div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <button onClick={() => {
                      setDeliveryFormData({...selectedDeliveryDetail, amount: String(selectedDeliveryDetail.amount||''), count: String(selectedDeliveryDetail.count||''), startTime: selectedDeliveryDetail.startTime||'', endTime: selectedDeliveryDetail.endTime||''});
                      setEditingDeliveryId(selectedDeliveryDetail.id);
                      setSelectedDeliveryDetail(null);
                      setIsDeliveryModalOpen(true);
                  }} className="py-3.5 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-gray-600 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Edit3 size={16}/> 수정</button>
                  <button onClick={() => { deleteDailyDelivery(selectedDeliveryDetail.id); setSelectedDeliveryDetail(null); }} className="py-3.5 bg-gray-50 border border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-gray-600 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"><Trash2 size={16}/> 삭제</button>
               </div>
            </div>
         </div>
      )}

      {/* 💡 주간/일간 대시보드 요약 모달 */}
      { (selectedWeeklySummary || selectedDailySummary) && (() => {
          const isWeekly = !!selectedWeeklySummary;
          const pd = selectedWeeklySummary || selectedDailySummary;
          const items = isWeekly ? (pendingByPayday[pd]?.items || paydayGroups[pd]?.items || []) : (groupedDaily[pd] || []);
          const title = isWeekly ? `${pd.slice(5).replace('-','/')} 입금 ${pd >= todayStr ? '예정' : '완료'}` : `${pd.slice(5).replace('-','/')} 일일 정산`;
          const metrics = calcDailyMetrics(items);

          return (
             <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70] overflow-hidden">
                <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]">
                   <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
                   <div className="flex justify-between items-center mb-6 shrink-0">
                      <h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><Target className="text-blue-500" size={24}/> {title}</h2>
                      <button onClick={() => {setSelectedWeeklySummary(null); setSelectedDailySummary(null);}} className="bg-gray-100 text-gray-500 p-2.5 rounded-2xl active:scale-95"><X size={20}/></button>
                   </div>

                   <div className="overflow-y-auto no-scrollbar pb-4 flex-1">
                       <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden border border-slate-700 shrink-0">
                           <Bike className="absolute -right-4 -bottom-4 w-28 h-28 opacity-10 rotate-12" fill="white" />
                           <div className="relative z-10">
                               <div className="text-blue-200 text-xs font-bold mb-1">총 정산 금액</div>
                               <div className="text-4xl font-black tracking-tighter mb-5">{formatMoney(metrics.totalAmt)}<span className="text-lg font-bold opacity-80 ml-1">원</span></div>
                               
                               <div className="grid grid-cols-2 gap-4 gap-y-5 border-t border-white/10 pt-4">
                                  <div>
                                     <div className="text-[10px] text-blue-300 font-bold mb-1 uppercase tracking-widest">배달 건수</div>
                                     <div className="text-lg font-black">{formatMoney(metrics.totalCnt)}건</div>
                                  </div>
                                  <div>
                                     <div className="text-[10px] text-blue-300 font-bold mb-1 uppercase tracking-widest">근무 시간</div>
                                     <div className="text-lg font-black">{metrics.durationStr || '-'}</div>
                                  </div>
                                  <div>
                                     <div className="text-[10px] text-blue-300 font-bold mb-1 uppercase tracking-widest">평균 단가</div>
                                     <div className="text-lg font-black">{formatMoney(metrics.perDelivery)}원</div>
                                  </div>
                                  <div>
                                     <div className="text-[10px] text-blue-300 font-bold mb-1 uppercase tracking-widest">평균 시급</div>
                                     <div className="text-lg font-black">{formatMoney(metrics.hourlyRate)}원</div>
                                  </div>
                               </div>
                           </div>
                       </div>
                       
                       <div className="space-y-2">
                          <div className="text-xs font-black text-gray-500 mb-2 px-1">포함된 개별 내역 ({items.length}건)</div>
                          {items.length === 0 && <div className="text-center py-6 text-gray-400 font-bold text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">내역이 없습니다.</div>}
                          {items.map(d => (
                              // 💡 요약 뷰 안에서도 내역을 누르면 상세 영수증 팝업으로 이동합니다.
                              <div key={d.id} onClick={() => { setSelectedWeeklySummary(null); setSelectedDailySummary(null); setSelectedDeliveryDetail(d); }} className="flex justify-between items-center bg-gray-50 p-3.5 rounded-2xl hover:bg-blue-50 transition-colors border border-gray-200 shadow-sm cursor-pointer active:scale-95">
                                  <div className="flex items-center gap-3">
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-[11px] shrink-0 shadow-sm ${d.platform === '배민' ? 'bg-[#2ac1bc]' : d.platform === '쿠팡' ? 'bg-[#111111]' : 'bg-gray-400'}`}>{d.platform}</div>
                                     <div>
                                        <div className="font-black text-sm text-gray-800">{d.earner} <span className="text-gray-400 text-[10px] font-bold">| {d.count}건</span></div>
                                        <div className="text-[10px] text-gray-500 font-bold mt-0.5">{d.date.slice(5).replace('-','/')} {d.startTime && `(${d.startTime}~${d.endTime})`}</div>
                                     </div>
                                  </div>
                                  <span className="font-black text-base text-blue-600">{formatMoney(d.amount)}원</span>
                              </div>
                          ))}
                       </div>
                   </div>
                </div>
             </div>
          );
      })()}

      <button onClick={() => { setEditingDeliveryId(null); setDeliveryFormData({ date: todayStr, earner: '정훈', platform: '배민', amount: '', count: '', amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '', startTime: '', endTime: '' }); setIsDeliveryModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-blue-600 text-white w-14 h-14 rounded-[1.5rem] shadow-xl shadow-blue-300 flex items-center justify-center active:scale-90 transition-all z-40 border border-blue-500"><Plus size={28}/></button>

      {/* 배달 모달 */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[60] p-4 py-8 overflow-y-auto no-scrollbar">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-7 shadow-2xl animate-in slide-in-from-bottom duration-300 my-auto border-t-8 border-blue-500">
            <div className="flex justify-between items-center mb-5"><h2 className="text-2xl font-black text-gray-900">{editingDeliveryId ? '배달 단건 수정' : '배달 동시 기록 🏍️'}</h2><button onClick={() => setIsDeliveryModalOpen(false)} className="bg-blue-50 text-blue-500 p-2.5 rounded-2xl border"><X size={20}/></button></div>
            <form onSubmit={handleDeliverySubmit} className="space-y-4">
              <div className="flex gap-3 pb-4 border-b border-gray-100 mb-2 w-full">
                <div className="w-[100px] shrink-0"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">날짜</label><input type="date" value={deliveryFormData.date} onChange={e=>setDeliveryFormData({...deliveryFormData, date:e.target.value})} className="w-full bg-gray-50 border rounded-xl px-1.5 h-[40px] font-bold text-xs outline-none" /></div>
                <div className="w-[85px] shrink-0"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">시작</label><input type="time" value={deliveryFormData.startTime} onChange={e=>setDeliveryFormData({...deliveryFormData, startTime:e.target.value})} className="w-full bg-gray-50 border rounded-xl px-1 h-[40px] font-bold text-xs outline-none" /></div>
                <div className="w-[85px] shrink-0"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">종료</label><input type="time" value={deliveryFormData.endTime} onChange={e=>setDeliveryFormData({...deliveryFormData, endTime:e.target.value})} className="w-full bg-gray-50 border rounded-xl px-1 h-[40px] font-bold text-xs outline-none" /></div>
              </div>
              {editingDeliveryId ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-black text-gray-400 ml-1 block">수익자</label><div className="flex bg-gray-50 border p-1 rounded-xl shadow-inner"><button type="button" onClick={() => setDeliveryFormData({...deliveryFormData, earner:'정훈'})} className={`flex-1 h-[40px] rounded-lg text-sm font-black ${deliveryFormData.earner==='정훈'?'bg-white text-blue-600 shadow-sm':'text-gray-500'}`}>정훈</button><button type="button" onClick={() => setDeliveryFormData({...deliveryFormData, earner:'현아'})} className={`flex-1 h-[40px] rounded-lg text-sm font-black ${deliveryFormData.earner==='현아'?'bg-white text-blue-600 shadow-sm':'text-gray-500'}`}>현아</button></div></div>
                    <div><label className="text-[10px] font-black text-gray-400 ml-1 block">플랫폼</label><div className="flex bg-gray-50 border p-1 rounded-xl shadow-inner"><button type="button" onClick={() => setDeliveryFormData({...deliveryFormData, platform:'배민'})} className={`flex-1 h-[40px] rounded-lg text-sm font-black ${deliveryFormData.platform==='배민'?'bg-[#2ac1bc] text-white shadow-sm':'text-gray-500'}`}>배민</button><button type="button" onClick={() => setDeliveryFormData({...deliveryFormData, platform:'쿠팡'})} className={`flex-1 h-[40px] rounded-lg text-sm font-black ${deliveryFormData.platform==='쿠팡'?'bg-[#111111] text-white shadow-sm':'text-gray-500'}`}>쿠팡</button></div></div>
                  </div>
                  <div className="flex gap-4 items-end mt-4 mb-2">
                    <div className="flex-1"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">수익금</label><div className="relative"><input type="text" value={deliveryFormData.amount ? formatMoney(deliveryFormData.amount) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className="w-full text-4xl font-black border-b-4 border-gray-100 pb-2 outline-none focus:border-blue-500 bg-transparent" autoFocus /><span className="absolute right-2 bottom-4 text-xl font-black text-gray-300">원</span></div></div>
                    <div className="w-24"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">건수</label><div className="relative"><input type="number" value={deliveryFormData.count} onChange={e=>setDeliveryFormData({...deliveryFormData, count:e.target.value})} placeholder="0" className="w-full bg-gray-50 border rounded-xl px-3 h-[44px] font-black text-lg outline-none" /><span className="absolute right-3 top-2.5 text-sm font-black text-gray-400">건</span></div></div>
                  </div>
                  <button type="submit" disabled={!deliveryFormData.amount} className="w-full bg-blue-600 mt-2 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 shadow-xl">수정 완료</button>
                </>
              ) : (
                <>
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200 shadow-sm">
                    <div className="font-black text-blue-700 mb-2 flex items-center gap-1.5">🧑 정훈 수익</div>
                    <div className="space-y-2">
                      <div className="flex gap-3 items-center"><span className="text-[11px] font-bold bg-[#2ac1bc] text-white px-2 py-1.5 rounded w-10 text-center shrink-0">배민</span><input type="text" value={deliveryFormData.amountJunghoonBaemin ? formatMoney(deliveryFormData.amountJunghoonBaemin) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountJunghoonBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="금액" className="w-full text-base font-black bg-white rounded-xl px-3 h-[44px] outline-none border border-blue-200" /><input type="number" value={deliveryFormData.countJunghoonBaemin} onChange={e => setDeliveryFormData({...deliveryFormData, countJunghoonBaemin: e.target.value})} placeholder="건수" className="w-[90px] text-base font-black bg-white rounded-xl px-2 h-[44px] text-center outline-none border border-blue-200" /></div>
                      <div className="flex gap-3 items-center"><span className="text-[11px] font-bold bg-[#111111] text-white px-2 py-1.5 rounded w-10 text-center shrink-0">쿠팡</span><input type="text" value={deliveryFormData.amountJunghoonCoupang ? formatMoney(deliveryFormData.amountJunghoonCoupang) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountJunghoonCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="금액" className="w-full text-base font-black bg-white rounded-xl px-3 h-[44px] outline-none border border-blue-200" /><input type="number" value={deliveryFormData.countJunghoonCoupang} onChange={e => setDeliveryFormData({...deliveryFormData, countJunghoonCoupang: e.target.value})} placeholder="건수" className="w-[90px] text-base font-black bg-white rounded-xl px-2 h-[44px] text-center outline-none border border-blue-200" /></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm mb-3">
                    <div className="font-black text-slate-700 mb-2 flex items-center gap-1.5">👩 현아 수익</div>
                    <div className="space-y-2">
                      <div className="flex gap-3 items-center"><span className="text-[11px] font-bold bg-[#2ac1bc] text-white px-2 py-1.5 rounded w-10 text-center shrink-0">배민</span><input type="text" value={deliveryFormData.amountHyunaBaemin ? formatMoney(deliveryFormData.amountHyunaBaemin) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountHyunaBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="금액" className="w-full text-base font-black bg-white rounded-xl px-3 h-[44px] outline-none border border-slate-200" /><input type="number" value={deliveryFormData.countHyunaBaemin} onChange={e => setDeliveryFormData({...deliveryFormData, countHyunaBaemin: e.target.value})} placeholder="건수" className="w-[90px] text-base font-black bg-white rounded-xl px-2 h-[44px] text-center outline-none border border-slate-200" /></div>
                      <div className="flex gap-3 items-center"><span className="text-[11px] font-bold bg-[#111111] text-white px-2 py-1.5 rounded w-10 text-center shrink-0">쿠팡</span><input type="text" value={deliveryFormData.amountHyunaCoupang ? formatMoney(deliveryFormData.amountHyunaCoupang) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountHyunaCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="금액" className="w-full text-base font-black bg-white rounded-xl px-3 h-[44px] outline-none border border-slate-200" /><input type="number" value={deliveryFormData.countHyunaCoupang} onChange={e => setDeliveryFormData({...deliveryFormData, countHyunaCoupang: e.target.value})} placeholder="건수" className="w-[90px] text-base font-black bg-white rounded-xl px-2 h-[44px] text-center outline-none border border-slate-200" /></div>
                    </div>
                  </div>
                  <button type="submit" disabled={!(deliveryFormData.amountHyunaBaemin || deliveryFormData.amountHyunaCoupang || deliveryFormData.amountJunghoonBaemin || deliveryFormData.amountJunghoonCoupang)} className="w-full bg-blue-600 mt-2 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 shadow-xl disabled:opacity-50">동시 저장 완료 🚀</button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. LOAN TAB COMPONENT
// ==========================================
function LoanView({ assets, setAssets, selectedYear, selectedMonth, currentMonthKey, todayStr, user, isManageMode }) {
  const [loanSortBy, setLoanSortBy] = useState(() => localStorage.getItem('hyunaLoanSortBy') || 'date'); 
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [newLoanFormData, setNewLoanFormData] = useState({ name: '', principal: '', rate: '', paymentDate: '1', paymentMethod: '이자' });
  const [isPrepayModalOpen, setIsPrepayModalOpen] = useState(false);
  const [prepayFormData, setPrepayFormData] = useState({ loanId: '', date: todayStr, principalAmount: '', interestAmount: '' });

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

  const updateAsset = async (type, id, field, value) => {
    if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', id), { [field]: value });
    else setAssets(prev => ({ ...prev, [type]: (prev[type]||[]).map(item => item.id === id ? { ...item, [field]: value } : item) }));
  }

  const deleteAsset = async (type, id) => {
    if(!window.confirm('삭제하시겠습니까?')) return;
    if (isFirebaseEnabled && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', id));
    else setAssets(prev => ({ ...prev, [type]: (prev[type]||[]).filter(item => item.id !== id) }));
  }

  const handlePayLoanThisMonth = async (loan) => {
    if(!user || !window.confirm(`'${loan.name}' 납부를 완료하시겠습니까?`)) return;
    const newPaidMonths = [...(loan.paidMonths || []), currentMonthKey];
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { paidMonths: newPaidMonths });
    else setAssets(prev => ({ ...prev, loans: (prev.loans||[]).map(l => l.id === loan.id ? { ...l, paidMonths: newPaidMonths } : l) }));
  };

  const handleCancelPayLoanThisMonth = async (loan) => {
    if(!user || !window.confirm(`'${loan.name}' 납부를 취소하시겠습니까?`)) return;
    const newPaidMonths = (loan.paidMonths || []).filter(m => m !== currentMonthKey);
    if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { paidMonths: newPaidMonths });
    else setAssets(prev => ({ ...prev, loans: (prev.loans||[]).map(l => l.id === loan.id ? { ...l, paidMonths: newPaidMonths } : l) }));
  };

  const handleAddAssetItem = async (e) => {
    e.preventDefault();
    if (!newLoanFormData.name.trim() || !newLoanFormData.principal) return;
    const newAsset = { assetType: 'loan', name: newLoanFormData.name, principal: parseInt(String(newLoanFormData.principal).replace(/[^0-9]/g, '')) || 0, rate: newLoanFormData.rate, paymentMethod: newLoanFormData.paymentMethod, paymentDate: newLoanFormData.paymentDate, duration: 0, customMonthly: 0, status: '상환중', prepaymentHistory: [], paidMonths: [] };
    if (isFirebaseEnabled && user) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assets'), newAsset);
    else setAssets(prev => ({ ...prev, loans: [...(prev.loans||[]), {id: Date.now().toString(), ...newAsset}] }));
    setIsAddLoanModalOpen(false); setNewLoanFormData({ name: '', principal: '', rate: '', paymentDate: '1', paymentMethod: '이자' });
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
    if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { principal: newPrincipal, status: newPrincipal === 0 ? '완납' : loan.status, prepaymentHistory: [newHistoryItem, ...(loan.prepaymentHistory || [])] });
    else setAssets(prev => ({...prev, loans: (prev.loans||[]).map(l => l.id === loan.id ? { ...l, principal: newPrincipal, status: newPrincipal === 0 ? '완납' : loan.status, prepaymentHistory: [newHistoryItem, ...(l.prepaymentHistory || [])] } : l)}));
    setIsPrepayModalOpen(false);
  };

  const deletePrepaymentHistory = async (loanId, historyId) => {
    if(!user || !window.confirm('이력을 삭제하고 원금을 복구하시겠습니까?')) return;
    const loan = (assets?.loans||[]).find(l => l.id === loanId);
    const historyItem = (loan?.prepaymentHistory||[]).find(h => h.id === historyId);
    if (!loan || !historyItem) return;
    const restoredPrincipal = loan.principal + historyItem.principalAmount;
    if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { principal: restoredPrincipal, status: restoredPrincipal > 0 ? '상환중' : '완납', prepaymentHistory: (loan.prepaymentHistory||[]).filter(h => h.id !== historyId) });
    else setAssets(prev => ({...prev, loans: (prev.loans||[]).map(l => l.id === loanId ? { ...l, principal: restoredPrincipal, status: restoredPrincipal > 0 ? '상환중' : '완납', prepaymentHistory: (l.prepaymentHistory||[]).filter(h => h.id !== historyId) } : l)}));
  };

  return (
    <div className="space-y-4 pb-28 pt-4 animate-in slide-in-from-right duration-500">
      <section>
        <div className="flex justify-between items-center mb-3 px-2"><h3 className="text-lg font-black text-gray-900">부채 상환 현황</h3></div>
        <div className="bg-indigo-600 rounded-[2rem] p-5 text-white shadow-md relative overflow-hidden">
          <Landmark className="absolute -right-6 -bottom-6 w-36 h-36 opacity-10" />
          <div className="relative z-10">
            <div className="text-indigo-200 text-xs font-bold mb-1 uppercase tracking-widest">총 대출 잔액</div>
            <div className="text-3xl font-black mb-4 tracking-tight leading-none">{formatMoney(totalPrincipal)}<span className="text-xl ml-1 font-bold opacity-80">원</span></div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
              <div className="flex justify-between items-center"><span className="text-[11px] text-indigo-100 font-bold">이번 달 총 납입 예정</span><span className="text-base font-black text-white">{formatMoney(totalMonthlyPayment)}원</span></div>
              <div className="flex justify-between items-center"><span className="text-[11px] text-indigo-100 font-bold">이번 달 납부 완료</span><span className="text-base font-black text-emerald-300">{formatMoney(totalPaidThisMonth)}원</span></div>
              <div className="flex justify-between items-center pt-3 border-t border-indigo-400/50 mt-1"><span className="text-sm text-white font-bold">이번 달 남은 납입금</span><span className="text-xl font-black text-white">{formatMoney(totalUnpaidThisMonth)}원</span></div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-3 px-2">
          <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><List size={16} className="text-indigo-500"/> 개별 대출 상세</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsAddLoanModalOpen(true)} className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-black border border-indigo-100 flex items-center gap-1"><Plus size={12}/> 대출 추가</button>
            <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg shadow-sm border border-gray-200"><ArrowDownUp size={12} className="text-gray-400" /><select value={loanSortBy} onChange={(e) => { setLoanSortBy(e.target.value); localStorage.setItem('hyunaLoanSortBy', e.target.value); }} className="text-[10px] font-bold text-gray-600 outline-none"><option value="date">납부일순</option><option value="principal">잔액순</option><option value="rate">금리순</option></select></div>
          </div>
        </div>

        <div className="space-y-3">
          {sortedLoans.map((loan) => (
            <div key={loan.id} className={`bg-white rounded-3xl p-4 shadow-sm border ${loan.status === '완납' ? 'opacity-50 border-green-200 bg-green-50/30' : loan.paidMonths?.includes(currentMonthKey) ? 'border-indigo-200 bg-indigo-50/20' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2.5">
                <span className="font-bold text-gray-800 flex items-center text-base">{loan.name} {loan.status === '완납' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-1.5"/>}</span>
                <div className="flex items-center gap-1.5">
                  {!isManageMode && <span className="text-[10px] bg-white text-indigo-600 px-2 py-0.5 rounded font-black border border-indigo-100 shadow-sm">금리 {loan.rate}%</span>}
                  {loan.status !== '완납' && <div className="bg-red-50 text-red-600 px-2.5 py-1 rounded-xl font-black text-[10px] flex items-center gap-1 border border-red-100"><CalendarDays size={12}/> 매월 {loan.paymentDate}일</div>}
                </div>
              </div>
              <div className="flex justify-between items-end mb-3">
                <div className="flex-1">
                  <div className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-widest flex justify-between items-center">잔액
                    {isManageMode && <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200"><input type="text" value={loan.rate || ''} onChange={(e) => updateAsset('loans', loan.id, 'rate', e.target.value)} className="w-12 text-right text-xs font-black text-indigo-600 outline-none bg-transparent" placeholder="0.0" /><span className="text-[10px] font-bold text-gray-500">%</span></div>}
                  </div>
                  {isManageMode ? <input type="text" value={loan.principal ? formatMoney(loan.principal) : ''} onChange={(e) => updateAsset('loans', loan.id, 'principal', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)} className="w-full text-lg font-black bg-gray-50 p-2 rounded-xl outline-none" /> : <div className="text-xl font-black text-gray-900 tracking-tight leading-none">{formatMoney(loan.principal)}<span className="text-sm ml-0.5">원</span></div>}
                </div>
                <div className="text-right ml-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 min-w-[100px] shadow-sm">
                  <div className="flex justify-end gap-1 mb-1">
                    {isManageMode && <div className="text-[9px] font-bold text-gray-500 bg-white px-1 py-0.5 rounded border border-gray-200 flex items-center"><input type="text" value={loan.paymentDate || ''} onChange={(e) => updateAsset('loans', loan.id, 'paymentDate', e.target.value)} className="w-6 text-center outline-none bg-transparent" placeholder="일"/></div>}
                    <div className="text-[10px] font-bold text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200 flex items-center shadow-sm">{isManageMode ? <select value={loan.paymentMethod} onChange={(e) => updateAsset('loans', loan.id, 'paymentMethod', e.target.value)} className="outline-none bg-transparent"><option value="이자">이자</option><option value="원리금">원리금</option></select> : loan.paymentMethod}</div>
                  </div>
                  <div className="font-black text-[14px] text-indigo-600 leading-none mt-1.5">{formatMoney(getMonthlyPayment(loan))}원</div>
                </div>
              </div>

              {isManageMode && loan.paymentMethod === '원리금' && (
                <div className="bg-orange-50/50 p-2.5 rounded-xl mb-3 space-y-1.5 border border-orange-200 shadow-sm">
                  <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-orange-800 ml-1 flex items-center gap-1"><Timer size={10}/> 남은 상환 기간</span><div className="flex items-center gap-1"><input type="number" value={loan.duration || ''} onChange={(e) => updateAsset('loans', loan.id, 'duration', parseInt(e.target.value)||0)} className="w-16 text-right p-1 rounded border border-orange-200 outline-none font-black text-orange-900 bg-white" placeholder="개월" /><span className="font-bold text-orange-800">개월</span></div></div>
                  <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-orange-800 ml-1 flex items-center gap-1"><Settings size={10}/> 직접 금액 입력</span><div className="flex items-center gap-1"><input type="number" value={loan.customMonthly || ''} onChange={(e) => updateAsset('loans', loan.id, 'customMonthly', parseInt(e.target.value)||0)} className="w-24 text-right p-1 rounded border border-orange-200 outline-none font-black text-orange-900 bg-white" placeholder="금액" /><span className="font-bold text-orange-800">원</span></div></div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 mt-1">
                <div className="flex justify-between items-center mb-1 gap-2">
                  {loan.status === '완납' ? (
                    <span className="text-xs font-black text-green-500 flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-green-200 shadow-sm w-full justify-center"><CheckCircle2 size={14}/> 완납된 대출입니다</span>
                  ) : loan.paidMonths?.includes(currentMonthKey) ? (
                    <button onClick={() => handleCancelPayLoanThisMonth(loan)} className="text-[11px] bg-green-100 text-green-700 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm flex-1 border border-green-200"><CheckCircle2 size={14}/> {selectedMonth}월 납부 취소</button>
                  ) : (
                    <button onClick={() => handlePayLoanThisMonth(loan)} className="text-[11px] bg-indigo-600 text-white px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md flex-1"><CheckCircle2 size={14}/> 이번 달 납부 처리</button>
                  )}
                  {loan.principal > 0 && <button onClick={() => { setPrepayFormData({ loanId: loan.id, date: todayStr, principalAmount: '', interestAmount: '' }); setIsPrepayModalOpen(true); }} className="text-[10px] bg-white text-gray-600 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform shadow-sm border border-gray-200"><Coins size={12}/> 중도상환</button>}
                  {isManageMode && <button onClick={() => deleteAsset('loans', loan.id)} className="text-gray-400 hover:text-red-500 bg-white p-2 rounded-xl shadow-sm border border-gray-200 ml-1"><Trash2 size={14}/></button>}
                </div>
                {loan.prepaymentHistory?.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {loan.prepaymentHistory.map(h => (
                      <div key={h.id} className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-100/50 shadow-sm">
                        <div><div className="text-[9px] text-gray-400 font-bold mb-0.5 flex items-center gap-1 truncate"><CalendarIcon size={10}/> {(h.date || '').replace(/-/g, '.')} 상환 완료</div><div className="text-xs font-black text-gray-800 truncate">원금 {formatMoney(h.principalAmount)}원{h.interestAmount > 0 && <span className="text-gray-500 font-bold ml-1 text-[9px]"> (+이자 {formatMoney(h.interestAmount)}원)</span>}</div></div>
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

      {/* 대출 추가 모달 */}
      {isAddLoanModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70] overflow-y-auto no-scrollbar">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300">
             <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
             <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black text-gray-800 flex items-center gap-1.5"><Landmark className="text-indigo-500" size={20}/> 새 대출 추가</h2><button onClick={() => setIsAddLoanModalOpen(false)} className="bg-gray-100 text-gray-500 p-2.5 rounded-2xl"><X size={20}/></button></div>
             <form onSubmit={handleAddAssetItem} className="space-y-4">
               <div><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">대출명</label><input type="text" value={newLoanFormData.name} onChange={e => setNewLoanFormData({...newLoanFormData, name: e.target.value})} placeholder="예: 주담대, 마통" className="w-full bg-gray-50 border rounded-xl px-4 h-[48px] font-black text-sm outline-none" /></div>
               <div><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">대출 원금 (잔액)</label><div className="relative"><input type="text" value={newLoanFormData.principal ? formatMoney(newLoanFormData.principal) : ''} onChange={e => setNewLoanFormData({...newLoanFormData, principal: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className="w-full text-3xl font-black border-b-4 border-gray-100 pb-2 outline-none focus:border-indigo-500 bg-transparent" /><span className="absolute right-2 bottom-3 text-lg font-black text-gray-400">원</span></div></div>
               <div className="flex gap-3 w-full pt-2">
                 <div className="flex-1"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">금리 (%)</label><input type="text" value={newLoanFormData.rate} onChange={e => setNewLoanFormData({...newLoanFormData, rate: e.target.value})} placeholder="0.0" className="w-full bg-gray-50 border rounded-xl px-3 h-[48px] font-black text-sm outline-none text-center" /></div>
                 <div className="flex-1"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">매월 납부일</label><input type="number" value={newLoanFormData.paymentDate} onChange={e => setNewLoanFormData({...newLoanFormData, paymentDate: e.target.value})} placeholder="1" className="w-full bg-gray-50 border rounded-xl px-3 h-[48px] font-black text-sm outline-none text-center" /></div>
                 <div className="flex-1"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">상환 방식</label><select value={newLoanFormData.paymentMethod} onChange={e => setNewLoanFormData({...newLoanFormData, paymentMethod: e.target.value})} className="w-full bg-gray-50 border rounded-xl px-3 h-[48px] font-black text-sm outline-none text-center appearance-none"><option value="이자">이자</option><option value="원리금">원리금</option></select></div>
               </div>
               <button type="submit" disabled={!newLoanFormData.name.trim() || !newLoanFormData.principal} className="w-full bg-indigo-600 mt-6 py-4 rounded-[1.5rem] text-white font-black text-lg active:scale-95 shadow-lg border border-indigo-700 disabled:opacity-50">대출 등록 완료</button>
             </form>
          </div>
        </div>
      )}

      {/* 중도상환 모달 */}
      {isPrepayModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-[60] overflow-y-auto no-scrollbar">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 mt-20 flex flex-col max-h-[90vh]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
            <div className="flex justify-between items-center mb-6 shrink-0"><h2 className="text-2xl font-black flex items-center gap-2 text-gray-800"><Coins size={24} className="text-indigo-500"/> 상환 이력 추가</h2><button onClick={() => setIsPrepayModalOpen(false)} className="bg-indigo-50 text-indigo-500 p-2.5 rounded-2xl"><X size={20}/></button></div>
            <form onSubmit={handlePrepaySubmit} className="space-y-5 overflow-y-auto no-scrollbar flex-1 pb-4">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100"><span className="text-xs font-bold text-indigo-600 block mb-1">상환 대상 대출</span><span className="font-black text-indigo-900 text-lg">{(assets?.loans||[]).find(l => l.id === prepayFormData.loanId)?.name}</span></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">상환 원금</label><input type="text" value={prepayFormData.principalAmount ? formatMoney(prepayFormData.principalAmount) : ''} onChange={e => setPrepayFormData({...prepayFormData, principalAmount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className="w-full text-3xl font-black border-b-4 border-gray-100 pb-2 outline-none focus:border-indigo-500 bg-transparent" /></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">납부 이자</label><input type="text" value={prepayFormData.interestAmount ? formatMoney(prepayFormData.interestAmount) : ''} onChange={e => setPrepayFormData({...prepayFormData, interestAmount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className="w-full text-3xl font-black border-b-4 border-gray-100 pb-2 outline-none focus:border-indigo-500 bg-transparent" /></div>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 ml-2 block uppercase">상환 날짜</label><input type="date" value={prepayFormData.date} onChange={e=>setPrepayFormData({...prepayFormData, date:e.target.value})} className="w-full bg-gray-50 rounded-xl px-3.5 h-[48px] font-bold text-sm outline-none border" /></div>
              <button type="submit" disabled={!prepayFormData.principalAmount && !prepayFormData.interestAmount} className="w-full bg-indigo-600 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 shadow-xl border border-indigo-700">상환 처리 완료</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 8. FAMILY CALENDAR COMPONENT
// ==========================================
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
    const newMsg = { author: currentUser, text: messageFormData.text, createdAt: todayStr, isChecked: false, replies: [] };
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
    if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', id), { isChecked: true, checkedAt: todayStr });
    else setMessages(messages.map(m => m.id === id ? { ...m, isChecked: true, checkedAt: todayStr } : m));
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
      const d = new Date(); const timeStr = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
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
         <h3 className="text-xs font-black text-pink-500 mb-3 flex justify-between items-center"><span className="flex items-center gap-1"><MessageSquareHeart size={14}/> 부부 한줄 톡 💌</span><button onClick={() => setIsMessageHistoryOpen(true)} className="text-gray-400 font-bold border-b border-gray-300 pb-0.5 active:text-pink-500">과거 보관소</button></h3>
         <div className="space-y-3 mb-4">
            {activeMessages.length === 0 && <div className="text-center text-gray-400 font-bold text-[10px] py-6 bg-white/50 rounded-2xl border border-pink-100/50">새로운 메시지가 없습니다.</div>}
            {activeMessages.map(m => {
              if (m.isSystemLog || m.author === '시스템') {
                return (
                  <div key={m.id} className="bg-emerald-50 p-3.5 rounded-2xl shadow-sm border border-emerald-100/50">
                    <div className="flex justify-between items-start mb-2"><div className="flex flex-col gap-1"><span className="bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-black w-max">시스템 알림</span><span className="text-[11px] font-black text-emerald-900">{m.title || '알림'}</span></div><span className="text-[10px] font-bold text-emerald-600/70 bg-emerald-100/50 px-2 py-1 rounded-lg border">{m.time || (typeof m.createdAt === 'string' && m.createdAt.slice(5).replace('-','/'))}</span></div>
                    <div className="text-xs font-bold text-emerald-800 leading-relaxed whitespace-pre-wrap pl-1 border-l-2 border-emerald-200 ml-1">{m.text}</div>
                    <div className="mt-2 text-right"><button onClick={() => handleCheckMessage(m.id)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border px-3 py-1.5 rounded-xl text-[10px] font-black active:scale-95 flex items-center gap-1 ml-auto"><CheckCircle2 size={12}/> 확인</button></div>
                  </div>
                )
              }
              return (
                <div key={m.id} className={`bg-white p-4 rounded-2xl shadow-sm border ${m.author === '현아' ? 'border-pink-200/50' : 'border-blue-200/50'}`}>
                   <div className="flex justify-between items-start mb-1.5">
                      <div>
                         <div className="text-[10px] text-gray-400 font-bold mb-1.5 flex items-center gap-1"><span className={`px-1.5 py-0.5 rounded text-white ${m.author === '현아' ? 'bg-pink-400' : 'bg-blue-400'}`}>{m.author}</span>{typeof m.createdAt === 'string' && m.createdAt.slice(5).replace('-','/')}</div>
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
            <button onClick={handleSendMessage} disabled={!messageFormData.text.trim()} className="bg-pink-500 text-white px-5 rounded-2xl font-black shadow-md disabled:opacity-50">전송</button>
         </div>
      </div>

      <div>
        <div className="flex justify-between items-center px-2 mb-3"><h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><Stethoscope size={16} className="text-pink-500"/> 현아 근무 스케줄</h3><button onClick={openDutyBatchModal} className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full font-bold border border-emerald-200 shadow-sm">+ 한달스케쥴 확인/수정</button></div>
        <div className="relative pt-4">
          <div ref={dutyTimelineRef} className="flex overflow-x-auto no-scrollbar gap-2 px-2 pb-4 pt-5 scroll-smooth">
            {extendedDutyDays.map((d) => {
              const dutyEvent = events.find(e => e.date === d && e.type === '듀티');
              const duty = dutyEvent ? dutyEvent.title : 'OFF';
              const isToday = d === todayStr;
              let dutyColor = duty === 'DAY' ? 'bg-blue-50 text-blue-600 border-blue-200' : duty === 'EVE' ? 'bg-orange-50 text-orange-600 border-orange-200' : duty === 'OFF' ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-white text-gray-400 border-gray-200';
              return (
                <div key={d} onClick={() => { setSelectedDutyEditDate(d); setIsDutyEditing(false); setIsDutyEditModalOpen(true); }} className={`flex-none w-[64px] p-2.5 rounded-[1.2rem] border shadow-sm flex flex-col items-center justify-center cursor-pointer relative ${isToday ? 'ring-2 ring-emerald-400 ring-offset-1 bg-emerald-50 text-emerald-700 border-emerald-200' : dutyColor}`}>
                  {isToday && <div className="text-[10px] font-black text-emerald-500 mb-0.5 absolute -top-5 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm whitespace-nowrap z-10">TODAY</div>}
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
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
          <Star className="absolute -right-2 -bottom-2 w-24 h-24 opacity-10 rotate-12" fill="white" />
          <h3 className="text-[11px] font-bold opacity-90 mb-3 flex items-center gap-1.5"><Target size={14}/> 다가오는 중요 일정</h3>
          <div className="space-y-2 relative z-10">
            {topImportantEvents.map(e => (
              <div key={e.id} className="bg-white/20 p-2.5 rounded-xl flex items-center gap-2">
                <div className="bg-white text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black shrink-0 text-center shadow-sm"><div>{parseInt((e.date||'').slice(5,7))}/{parseInt((e.date||'').slice(8,10))}</div><div>{['일','월','화','수','목','금','토'][new Date(e.date||todayStr).getDay()]}</div></div>
                <div className="font-bold text-base truncate">{e.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-200">
        <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5 mb-4"><CalendarDays size={16} className="text-emerald-500"/> 가족 일정 타임라인</h3>
        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
          {familyEventsList.length === 0 && <div className="text-center text-gray-400 py-10 font-bold text-sm">등록된 일정이 없습니다.</div>}
          {familyEventsList.map((e, i, arr) => (
            <div key={e.id}>
              {(i === 0 || e.date?.slice(0,7) !== arr[i-1].date?.slice(0,7)) && (
                <div className="relative flex items-center justify-center py-4"><div className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full z-10 border shadow-sm">{e.date.slice(0,4)}년 {parseInt(e.date.slice(5,7))}월</div></div>
              )}
              <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group py-2 ${e.date < todayStr ? 'opacity-60 grayscale-[50%]' : ''}`}>
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-50 shadow shrink-0 z-10">{getEventIcon(e.type)}</div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3.5 rounded-2xl bg-gray-50 border shadow-sm ml-3">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex flex-col gap-0.5"><span className="text-[10px] font-black text-emerald-600">{parseInt(e.date.slice(5,7))}/{parseInt(e.date.slice(8,10))} ({['일','월','화','수','목','금','토'][new Date(e.date).getDay()]})</span><span className="text-[9px] bg-white border text-gray-500 px-1.5 py-0.5 rounded font-bold shadow-sm inline-block w-max">{e.type}</span></div>
                    <div className="flex gap-1"><button onClick={() => { setEventFormData(e); setEditingEventId(e.id); setIsEventModalOpen(true); }} className="text-gray-400 hover:text-blue-500 bg-white p-1.5 rounded-lg border shadow-sm"><Edit3 size={12}/></button><button onClick={() => deleteEvent(e.id)} className="text-gray-400 hover:text-red-500 bg-white p-1.5 rounded-lg border shadow-sm"><Trash2 size={12}/></button></div>
                  </div>
                  <div className="font-bold text-gray-800 text-base flex items-center gap-1.5 mt-1.5">{e.title} {e.isImportant && <Star size={14} className="text-amber-400 fill-amber-400"/>}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => { setEventFormData({ date: todayStr, title: '', type: '가족일정', isImportant: false }); setEditingEventId(null); setIsEventModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-emerald-500 text-white w-14 h-14 rounded-[1.5rem] shadow-xl flex items-center justify-center active:scale-90 z-40 border"><Plus size={28}/></button>

      {/* 일정 등록 모달 */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[60] overflow-y-auto no-scrollbar">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-5 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 mt-20 flex flex-col max-h-[90vh]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
            <div className="flex justify-between items-center mb-5 shrink-0"><h2 className="text-2xl font-black text-gray-900">{editingEventId ? '일정 수정 🌿' : '새 일정 등록 🌿'}</h2><button onClick={() => setIsEventModalOpen(false)} className="bg-emerald-50 text-emerald-600 p-2.5 rounded-2xl border"><X size={20}/></button></div>
            <form onSubmit={handleEventSubmit} className="space-y-4 overflow-y-auto no-scrollbar flex-1 pb-4">
              <div className="flex gap-4 w-full">
                <div className="w-[110px] shrink-0"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">날짜</label><input type="date" value={eventFormData.date} onChange={e=>setEventFormData({...eventFormData, date:e.target.value})} className="w-full bg-gray-50 rounded-xl px-2 h-[48px] font-bold text-sm outline-none border" /></div>
                <div className="w-[130px] shrink-0"><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">분류</label><select value={eventFormData.type} onChange={e => setEventFormData({...eventFormData, type: e.target.value})} className="w-full bg-gray-50 rounded-xl px-3 h-[48px] font-bold text-base outline-none border"><option value="가족일정">가족일정</option><option value="회식">회식</option><option value="기타">기타</option></select></div>
              </div>
              <div><label className="text-[10px] font-black text-gray-400 ml-1 block mb-1">일정 내용</label><input type="text" value={eventFormData.title} onChange={e=>setEventFormData({...eventFormData, title:e.target.value})} placeholder="예: 어머님 생신, 팀 회식" className="w-full bg-gray-50 rounded-xl px-4 h-[48px] text-base font-black outline-none border" /></div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between mt-2">
                <div><div className="text-sm font-black text-amber-700 flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400"/> 중요 일정 등록</div><div className="text-[10px] text-amber-600 font-bold mt-0.5">상단 브리핑 카드에 강조되어 표시됩니다.</div></div>
                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={eventFormData.isImportant} onChange={e => setEventFormData({...eventFormData, isImportant: e.target.checked})} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div></label>
              </div>
              <button type="submit" disabled={!eventFormData.title.trim()} className="w-full bg-emerald-500 mt-4 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 shadow-xl disabled:opacity-50 border border-emerald-600">{editingEventId ? '수정 완료' : '등록 완료'} 🌿</button>
            </form>
          </div>
        </div>
      )}

      {/* 듀티 단건 수정 모달 */}
      {isDutyEditModalOpen && selectedDutyEditDate && (() => {
         const existingEvent = events.find(e => e.date === selectedDutyEditDate && e.type === '듀티');
         const currentDuty = existingEvent ? existingEvent.title : 'OFF';
         return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70]">
            <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-5 pb-12 shadow-2xl animate-in slide-in-from-bottom">
               <div className="flex justify-between items-center mb-6"><div><h2 className="text-xl font-black text-gray-900">{parseInt(selectedDutyEditDate.slice(5,7))}월 {parseInt(selectedDutyEditDate.slice(8,10))}일 스케줄</h2><p className="text-[10px] text-gray-500 font-bold mt-1">{isDutyEditing ? '변경할 근무를 선택하세요.' : '현재 등록된 스케줄입니다.'}</p></div><button onClick={() => setIsDutyEditModalOpen(false)} className="bg-gray-100 text-gray-500 p-2.5 rounded-2xl"><X size={20}/></button></div>
               <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-center border shadow-inner"><span className="text-[10px] font-bold text-gray-400 block mb-1">현재 스케줄</span><span className={`text-4xl font-black ${currentDuty === 'DAY' ? 'text-blue-500' : currentDuty === 'EVE' ? 'text-orange-500' : currentDuty === 'OFF' ? 'text-pink-500' : 'text-gray-400'}`}>{currentDuty}</span></div>
               {!isDutyEditing ? (
                  <button onClick={() => setIsDutyEditing(true)} className="w-full bg-emerald-500 text-white py-4 rounded-[1.5rem] font-black text-lg">수정하기</button>
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

      {/* 듀티 일괄 수정 모달 */}
      {isDutyBatchModalOpen && (
         <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center p-4 pt-10 border-b">
               <button onClick={() => setIsDutyBatchModalOpen(false)} className="text-gray-500 p-2"><ChevronLeft size={24}/></button>
               <span className="font-black text-lg">한달 스케줄 관리</span>
               {isDutyBatchEditMode ? <button onClick={saveBatchDuties} className="text-emerald-500 font-black">저장</button> : <button onClick={() => setIsDutyBatchEditMode(true)} className="text-blue-500 font-black">수정</button>}
            </div>
            {/* 이 부분은 너무 길어지므로 원본의 Batch Modal 로직 유지(생략 없이 구현) */}
            <div className="p-4 flex-1 overflow-auto">
               <div className="flex justify-center items-center gap-4 mb-4">
                  <button onClick={() => setDutyBatchMonth(m => m === 1 ? 12 : m - 1)}><ChevronLeft size={20}/></button>
                  <span className="font-black text-xl">{dutyBatchMonth}월</span>
                  <button onClick={() => setDutyBatchMonth(m => m === 12 ? 1 : m + 1)}><ChevronRight size={20}/></button>
               </div>
               
               {isDutyBatchEditMode && (
                 <div className="flex gap-2 mb-4 bg-gray-50 p-2 rounded-xl justify-center">
                    {['DAY', 'EVE', 'OFF', 'DELETE'].map(stamp => (
                       <button key={stamp} onClick={() => setSelectedStamp(stamp)} className={`px-4 py-2 rounded-lg font-black text-xs ${selectedStamp === stamp ? 'bg-emerald-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                          {stamp === 'DELETE' ? '지우개' : stamp}
                       </button>
                    ))}
                 </div>
               )}

               <div className="grid grid-cols-7 gap-1">
                 {['일','월','화','수','목','금','토'].map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-500 py-2">{d}</div>)}
                 {Array.from({length: new Date(dutyBatchYear, dutyBatchMonth - 1, 1).getDay()}).map((_,i) => <div key={`e-${i}`}/>)}
                 {Array.from({length: new Date(dutyBatchYear, dutyBatchMonth, 0).getDate()}).map((_, i) => {
                    const d = i + 1;
                    const dateStr = `${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    const duty = batchDuties[dateStr];
                    let dutyColor = duty === 'DAY' ? 'bg-blue-50 text-blue-600 border-blue-200' : duty === 'EVE' ? 'bg-orange-50 text-orange-600 border-orange-200' : duty === 'OFF' ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-white text-gray-400 border-gray-100';
                    return (
                       <div key={d} onClick={() => { if(isDutyBatchEditMode) setBatchDuties(prev => ({...prev, [dateStr]: selectedStamp === 'DELETE' ? null : selectedStamp})) }} className={`h-16 border rounded-xl flex flex-col items-center justify-center cursor-pointer ${dutyColor} ${isDutyBatchEditMode ? 'active:scale-90' : ''}`}>
                          <span className="text-[10px] font-bold mb-1">{d}</span>
                          <span className="text-sm font-black">{duty || ''}</span>
                       </div>
                    );
                 })}
               </div>
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
  const defaultTabOrder = ['calendar', 'ledger', 'delivery', 'loans'];
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('hyunaDefaultTab') || 'calendar'); 
  const [tabOrder, setTabOrder] = useState(() => { const saved = localStorage.getItem('hyunaTabOrder'); return saved ? JSON.parse(saved) : defaultTabOrder; });
  const [isManageMode, setIsManageMode] = useState(false); 
  
  const [ledger, setLedger] = useState([]);
  const [assets, setAssets] = useState({ loans: [] }); 
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
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!isFirebaseEnabled || !user) return;
    const unsubLedger = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'ledger'), (s) => setLedger(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubDelivery = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'delivery'), (s) => setDailyDeliveries(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubAssets = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'assets'), (s) => setAssets({ loans: s.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(d => d.assetType === 'loan') }));
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

  const appBgColor = activeTab === 'ledger' ? 'bg-pink-50/30' : activeTab === 'delivery' ? 'bg-slate-50' : 'bg-gray-50/80';

  return (
    <div className={`min-h-screen font-sans text-gray-900 select-none pb-32 transition-colors duration-500 ${appBgColor}`}>
      
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl pb-2 shadow-sm border-b border-gray-200/60">
        <header className="pt-10 pb-4 px-6 flex justify-between items-center">
          <div>
            <span className={`text-[10px] font-black tracking-widest uppercase block mb-0.5 ${activeTab === 'ledger' ? 'text-pink-500' : activeTab === 'delivery' ? 'text-blue-500' : activeTab === 'calendar' ? 'text-emerald-500' : 'text-indigo-500'}`}>
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
            <button onClick={() => setIsManageMode(!isManageMode)} className={`p-2.5 rounded-full transition-all duration-300 shadow-sm border border-gray-200 ${isManageMode ? (activeTab === 'ledger' ? 'bg-pink-500' : activeTab === 'delivery' ? 'bg-blue-600' : activeTab === 'calendar' ? 'bg-emerald-500' : 'bg-indigo-600') + ' text-white shadow-md rotate-90' : 'bg-white text-gray-500'}`}><Settings size={20}/></button>
          </div>
        </header>

        <div className="flex overflow-x-auto no-scrollbar gap-2 py-1 px-5 scroll-smooth">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)} className={`flex-none px-5 py-2 rounded-[1.2rem] font-black text-sm transition-all shadow-sm ${selectedMonth === m ? (activeTab === 'ledger' ? 'bg-pink-500 text-white border-pink-500' : activeTab === 'delivery' ? 'bg-blue-600 text-white border-blue-600' : activeTab === 'calendar' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-indigo-600 text-white border-indigo-600') : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'} border`}>
              {m}월
            </button>
          ))}
        </div>
      </div>

      {isManageMode && <SettingsView activeTab={activeTab} tabOrder={tabOrder} setTabOrder={setTabOrder} currentUser={currentUser} setCurrentUser={setCurrentUser} categories={categories} setCategories={setCategories} userSettings={userSettings} setUserSettings={setUserSettings} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} user={user} />}

      <main className="px-5 max-w-md mx-auto pt-2">
        {activeTab === 'ledger' && <LedgerView ledger={ledger} setLedger={setLedger} memos={memos} setMemos={setMemos} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} todayStr={todayStr} categories={categories} setCategories={setCategories} user={user} isManageMode={isManageMode} />}
        {activeTab === 'delivery' && <DeliveryView dailyDeliveries={dailyDeliveries} setDailyDeliveries={setDailyDeliveries} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} todayStr={todayStr} userSettings={userSettings} timerActive={timerActive} trackingStartTime={trackingStartTime} elapsedSeconds={elapsedSeconds} handleStartDelivery={handleStartDelivery} handleEndDelivery={handleEndDelivery} user={user} isManageMode={isManageMode} />}
        {activeTab === 'loans' && <LoanView assets={assets} setAssets={setAssets} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} todayStr={todayStr} user={user} isManageMode={isManageMode} />}
        {activeTab === 'calendar' && <FamilyCalendarView events={events} setEvents={setEvents} messages={messages} setMessages={setMessages} selectedYear={selectedYear} selectedMonth={selectedMonth} currentMonthKey={currentMonthKey} todayStr={todayStr} currentUser={currentUser} user={user} isManageMode={isManageMode} />}
      </main>

      <nav className="fixed bottom-6 left-4 right-4 h-[72px] bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-200/50 flex justify-around items-center z-50 px-2">
        {tabOrder.map((tabId) => {
          const config = tabConfig[tabId];
          const Icon = config.icon;
          const isActive = activeTab === tabId;
          return (
            <button key={tabId} onClick={() => setActiveTab(tabId)} className={`flex flex-col items-center w-14 transition-all ${isActive ? `${config.colorClass} scale-110` : 'text-gray-400 hover:text-gray-500'}`}>
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
      `}} />
    </div>
  );
}

// ==========================================
// 10. ERROR BOUNDARY & EXPORT
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, errorInfo: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error(error, errorInfo); this.setState({ errorInfo }); }
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
