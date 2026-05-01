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

// --- Firebase 세팅 ---
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

const getKSTDateStr = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (9 * 3600000));
  const yy = kstTime.getFullYear();
  const mm = String(kstTime.getMonth() + 1).padStart(2, '0');
  const dd = String(kstTime.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

const getPaydayStr = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return '';
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10)-1, parseInt(parts[2], 10));
  if (isNaN(d.getTime())) return ''; 
  const day = d.getDay(); 
  const daysToAdd = [5, 4, 3, 9, 8, 7, 6][day];
  d.setDate(d.getDate() + daysToAdd);
  
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

// 💡 6구역 텍스트 자동 크기 축소 컴포넌트
const AutoScaleValue = ({ value, isNet = false }) => {
  let sign = '';
  let color = 'text-gray-800';
  if (isNet) {
      if (value < 0) { sign = '- '; color = 'text-rose-500'; }
      else if (value > 0) { sign = '+ '; color = 'text-blue-500'; }
      else { color = 'text-gray-600'; }
  }
  const absVal = Math.abs(value);
  const str = new Intl.NumberFormat('ko-KR').format(absVal);
  const len = str.length + sign.length;
  
  let sizeClass = 'text-[13px]';
  if (len > 10) sizeClass = 'text-[9px]';
  else if (len > 8) sizeClass = 'text-[11px]';
  
  return <div className={`font-black truncate tracking-tighter ${color} ${sizeClass}`}>{sign}{str}</div>;
};

function AppContent() {
  const [user, setUser] = useState(null);
  const todayStr = getKSTDateStr(); 
  
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('hyunaCurrentUser') || '현아');
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('hyunaDefaultTab') || 'calendar'); 
  
  const defaultTabOrder = ['calendar', 'ledger', 'delivery', 'loans'];
  const [tabOrder, setTabOrder] = useState(() => {
    const saved = localStorage.getItem('hyunaTabOrder');
    return saved ? JSON.parse(saved) : defaultTabOrder;
  });

  const tabConfig = {
    calendar: { id: 'calendar', label: '우리가족', icon: CalendarIcon, colorClass: 'text-emerald-500' },
    ledger: { id: 'ledger', label: '가계부', icon: Wallet, colorClass: 'text-pink-500' },
    delivery: { id: 'delivery', label: '배달수익', icon: Bike, colorClass: 'text-blue-500' },
    loans: { id: 'loans', label: '대출관리', icon: Landmark, colorClass: 'text-indigo-600' },
  };

  const moveTab = (index, direction) => {
    const newOrder = [...tabOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    }
    setTabOrder(newOrder);
    localStorage.setItem('hyunaTabOrder', JSON.stringify(newOrder));
  };
  
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false); 
  const [isMessageHistoryOpen, setIsMessageHistoryOpen] = useState(false); 
  const [isManageMode, setIsManageMode] = useState(false); 
  
  const [settingsTab, setSettingsTab] = useState('menu');

  const [selectedDutyEditDate, setSelectedDutyEditDate] = useState(null);
  const [isDutyEditModalOpen, setIsDutyEditModalOpen] = useState(false);
  const [isDutyEditing, setIsDutyEditing] = useState(false);

  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [newLoanFormData, setNewLoanFormData] = useState({ name: '', principal: '', rate: '', paymentDate: '1', paymentMethod: '이자' });

  const [editingDeliveryId, setEditingDeliveryId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null); 
  const [editingLedgerId, setEditingLedgerId] = useState(null); 

  const [prepayFormData, setPrepayFormData] = useState({ loanId: '', date: todayStr, principalAmount: '', interestAmount: '' });
  const [isPrepayModalOpen, setIsPrepayModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false); 
  
  const [ledgerDateRange, setLedgerDateRange] = useState({ start: '', end: '' });
  const [deliveryDateRange, setDeliveryDateRange] = useState({ start: '', end: '' });
  const [showDeliveryFilters, setShowDeliveryFilters] = useState(false);

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [saveToCategoryList, setSaveToCategoryList] = useState(true);

  const [formData, setFormData] = useState({ date: todayStr, type: '지출', amount: '', category: '식비', note: '', subNote: '' });
  const [eventFormData, setEventFormData] = useState({ date: todayStr, title: '', type: '가족일정', isImportant: false });

  const [messageFormData, setMessageFormData] = useState({ text: '' });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [deliveryFormData, setDeliveryFormData] = useState({ 
    date: todayStr, earner: '정훈', platform: '배민', amount: '', count: '', 
    amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', 
    amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '', 
    startTime: '', endTime: '' 
  });

  const [ledgerSubTab, setLedgerSubTab] = useState('daily'); 
  const [deliverySubTab, setDeliverySubTab] = useState('daily'); 
  const [loanSortBy, setLoanSortBy] = useState(() => localStorage.getItem('hyunaLoanSortBy') || 'date'); 
  const [expandedLedgers, setExpandedLedgers] = useState({}); 

  // 💡 가계부 상세내역 뷰 및 달력 리스트 뷰 상태
  const [selectedLedgerForDetail, setSelectedLedgerForDetail] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // 메모장 상태
  const [isMemoEditorOpen, setIsMemoEditorOpen] = useState(false);
  const [currentMemoId, setCurrentMemoId] = useState(null);
  const [memoText, setMemoText] = useState('');
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const memoTextareaRef = useRef(null);

  const [isDutyBatchModalOpen, setIsDutyBatchModalOpen] = useState(false);
  const [isDutyBatchEditMode, setIsDutyBatchEditMode] = useState(false);
  const [dutyBatchMode, setDutyBatchMode] = useState('touch'); 
  const [dutyBatchYear, setDutyBatchYear] = useState(selectedYear);
  const [dutyBatchMonth, setDutyBatchMonth] = useState(selectedMonth);
  const [batchDuties, setBatchDuties] = useState({}); 
  const [selectedStamp, setSelectedStamp] = useState('DAY');
  const [continuousCursorDateStr, setContinuousCursorDateStr] = useState('');

  const scrollRefLedger = useRef(null);
  const scrollRefDelivery = useRef(null);
  const dutyTimelineRef = useRef(null); 

  useEffect(() => {
    if (!isFirebaseEnabled) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
            console.warn("커스텀 토큰 인증 실패, 익명 로그인으로 전환합니다.", tokenError);
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!isFirebaseEnabled || !user) return;
    const unsubLedger = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'ledger'), (s) => setLedger(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubDelivery = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'delivery'), (s) => setDailyDeliveries(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubAssets = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'assets'), (s) => {
      const data = s.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssets({ loans: data.filter(d => d.assetType === 'loan') });
    });
    const unsubEvents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'events'), (s) => setEvents(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubMessages = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), (s) => setMessages(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubMemos = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'memos'), (s) => setMemos(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    
    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'categories'), (docSnap) => {
      if(docSnap.exists()) setCategories(docSnap.data());
    });
    const unsubPrefs = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'preferences'), (docSnap) => {
      if(docSnap.exists()) setUserSettings(docSnap.data());
    });
    const unsubTimer = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'deliveryTimer'), (docSnap) => {
      if(docSnap.exists()) {
        const data = docSnap.data();
        setTimerActive(data.timerActive || false);
        setTrackingStartTime(data.trackingStartTime || null);
      }
    });

    return () => { unsubLedger(); unsubDelivery(); unsubAssets(); unsubEvents(); unsubMessages(); unsubMemos(); unsubSettings(); unsubPrefs(); unsubTimer(); };
  }, [user]);

  useEffect(() => {
    try {
      const targetRef = activeTab === 'ledger' ? scrollRefLedger : scrollRefDelivery;
      if (targetRef && targetRef.current && targetRef.current.children) {
        const button = targetRef.current.children[selectedMonth - 1];
        if (button && button.scrollIntoView) {
          button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    } catch (error) {}
  }, [selectedMonth, activeTab]);

  useEffect(() => {
    if (activeTab === 'calendar') {
      setTimeout(() => {
        const todayEl = document.getElementById('duty-today');
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 300);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isFirebaseEnabled) {
      const savedTime = localStorage.getItem('hyunaDeliveryStartTime');
      if (savedTime) { setTrackingStartTime(savedTime); setTimerActive(true); }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (timerActive && trackingStartTime) {
      interval = setInterval(() => { setElapsedSeconds(Math.floor((new Date() - new Date(trackingStartTime)) / 1000)); }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, trackingStartTime]);

  const handleSetCurrentUser = (name) => {
    setCurrentUser(name);
    localStorage.setItem('hyunaCurrentUser', name);
  };

  const formatMoney = (v) => {
    if (v === '' || v === undefined || v === null) return '0';
    const num = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : v;
    return isNaN(num) ? '0' : new Intl.NumberFormat('ko-KR').format(num);
  };

  const formatLargeMoney = (val) => {
    return formatMoney(val);
  };

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

  const formatEquation = (eq) => {
    return eq.replace(/[\d.]+/g, (match) => {
        if(match.includes('.')) {
            const [intP, decP] = match.split('.');
            return Number(intP).toLocaleString('ko-KR') + '.' + decP;
        }
        return Number(match).toLocaleString('ko-KR');
    });
  };

  const getWeekOfMonth = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return 1;
    const date = new Date(dateStr);
    if(isNaN(date.getTime())) return 1;
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil((date.getDate() + firstDay) / 7);
  };

  const formatTimeStr = (dateObj) => {
    return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
  };

  const getKSTTimestamp = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (9 * 3600000));
    const yyyy = kst.getFullYear();
    const mm = String(kst.getMonth() + 1).padStart(2, '0');
    const dd = String(kst.getDate()).padStart(2, '0');
    let hh = kst.getHours();
    const ampm = hh >= 12 ? '오후' : '오전';
    hh = hh % 12;
    hh = hh ? hh : 12; 
    const min = String(kst.getMinutes()).padStart(2, '0');
    return `${yyyy}년 ${parseInt(mm)}월 ${parseInt(dd)}일 ${ampm} ${hh}:${min}`;
  };

  const handleCalcBtn = (val) => {
    if (val === 'AC') { setCalcInput(''); }
    else if (val === '⌫') { setCalcInput(prev => prev.slice(0, -1)); }
    else if (val === '=') {
        try {
            let expr = calcInput.replace(/×/g, '*').replace(/÷/g, '/');
            // eslint-disable-next-line no-new-func
            let res = new Function('"use strict";return (' + expr + ')')();
            if(!isFinite(res) || isNaN(res)) throw new Error("Invalid");
            setCalcInput(String(res));
        } catch(e) { setCalcInput('Error'); }
    }
    else if (val === '+/-') {
        try {
            let expr = calcInput.replace(/×/g, '*').replace(/÷/g, '/');
            // eslint-disable-next-line no-new-func
            let res = new Function('"use strict";return (' + expr + ')')();
            setCalcInput(String(-res));
        } catch { }
    }
    else if (val === '%') {
        try {
            let expr = calcInput.replace(/×/g, '*').replace(/÷/g, '/');
            // eslint-disable-next-line no-new-func
            let res = new Function('"use strict";return (' + expr + ')')();
            setCalcInput(String(res / 100));
        } catch { }
    }
    else {
        if (calcInput === 'Error') setCalcInput(val);
        else setCalcInput(prev => prev + val);
    }
  };

  const insertCalcResult = () => {
    if (calcInput && calcInput !== 'Error') {
      const formatted = formatMoney(calcInput);
      setMemoText(prev => prev + formatted);
      setIsCalcOpen(false);
    }
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
    let durationStr = '';
    if (totalMins > 0) {
      if (hours > 0) durationStr += `${hours}시간 `;
      if (mins > 0) durationStr += `${mins}분`;
      durationStr = durationStr.trim();
    }
    let hourlyRate = totalMins > 0 ? Math.round(totalAmt / (totalMins / 60)) : 0;
    let perDelivery = totalCnt > 0 ? Math.round(totalAmt / totalCnt) : 0;
    return { durationStr, hourlyRate, perDelivery, totalCnt, totalAmt };
  };

  const getMonthlyPayment = (loan) => {
    if (loan.status === '완납') return 0;
    const currentRate = parseFloat(loan.rate) || 0;
    if (loan.paymentMethod === '원리금') {
      const duration = parseInt(loan.duration) || 0;
      if (duration > 0 && currentRate > 0) {
        const monthlyRate = currentRate / 100 / 12; 
        const principal = loan.principal || 0;      
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1);
        return Math.floor(payment);
      }
      return loan.customMonthly || 0; 
    }
    return Math.floor((loan.principal * (currentRate / 100)) / 12);
  };

  const getSortedCategories = (type) => {
    let cats = type === 'all' ? [...(categories['지출'] || []), ...(categories['수입'] || [])] : [...(categories[type] || [])];
    return Array.from(new Set(cats)).sort((a, b) => (a||'').localeCompare(b||''));
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

  const yearlyIncome = useMemo(() => {
    return (ledger || []).filter(t => t?.type === '수입' && typeof t?.date === 'string' && t.date.startsWith(String(selectedYear))).reduce((acc, curr) => acc + (curr.amount||0), 0);
  }, [ledger, selectedYear]);

  const filteredLedger = useMemo(() => {
    let data = ledger || [];
    const monthStr = String(selectedMonth).padStart(2, '0');
    if (ledgerDateRange.start || ledgerDateRange.end) {
      if (ledgerDateRange.start) data = data.filter(t => typeof t?.date === 'string' && t.date >= ledgerDateRange.start);
      if (ledgerDateRange.end) data = data.filter(t => typeof t?.date === 'string' && t.date <= ledgerDateRange.end);
    } else {
      data = data.filter(t => typeof t?.date === 'string' && t.date.startsWith(`${selectedYear}-${monthStr}`));
    }
    if (filterType !== 'all') data = data.filter(t => t.type === filterType);
    if (filterCategory !== 'all') data = data.filter(t => t.category === filterCategory);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(t => (t.note && typeof t.note === 'string' && t.note.toLowerCase().includes(query)) || (t.category && typeof t.category === 'string' && t.category.toLowerCase().includes(query)));
    }
    return data;
  }, [ledger, selectedYear, selectedMonth, filterType, filterCategory, searchQuery, ledgerDateRange]);

  const monthUsedCategories = useMemo(() => {
    const cats = filteredLedger.map(t => t.category).filter(Boolean);
    return Array.from(new Set(cats)).sort((a,b) => (a||'').localeCompare(b||''));
  }, [filteredLedger]);

  const ledgerSummary = useMemo(() => {
    const income = (filteredLedger || []).filter(t => t.type === '수입').reduce((a, b) => a + (b.amount||0), 0);
    const expense = (filteredLedger || []).filter(t => t.type === '지출').reduce((a, b) => a + (b.amount||0), 0);
    return { income, expense, net: income - expense };
  }, [filteredLedger]);

  const reviewData = useMemo(() => {
    const expGroup = filteredLedger.filter(t => t.type === '지출').reduce((acc, curr) => { 
      const cat = curr.category || '기타';
      acc[cat] = (acc[cat] || 0) + (curr.amount || 0); return acc; 
    }, {});
    const incGroup = filteredLedger.filter(t => t.type === '수입').reduce((acc, curr) => { 
      const cat = curr.category || '기타';
      acc[cat] = (acc[cat] || 0) + (curr.amount || 0); return acc; 
    }, {});
    return {
      expense: Object.entries(expGroup).sort((a, b) => b[1] - a[1]).slice(0, 5),
      income: Object.entries(incGroup).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [filteredLedger]);

  const financialSummary = useMemo(() => {
    const monthRawLedger = (ledger||[]).filter(t => typeof t?.date==='string' && t.date.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`));
    const rawExpense = monthRawLedger.filter(t => t.type === '지출').reduce((a,b)=>a+(b.amount||0),0);
    const sumPrincipal = monthRawLedger.filter(t => (t.category||'').includes('대출상환') || (t.category||'').includes('대출원금') || (t.category||'').includes('원금상환')).reduce((a,b)=>a+(b.amount||0),0);
    const sumInterest = monthRawLedger.filter(t => (t.category||'').includes('대출이자') || (t.category||'').includes('이자상환')).reduce((a,b)=>a+(b.amount||0),0);
    const sumLiving = rawExpense - sumPrincipal - sumInterest;
    return { sumLiving, sumPrincipal, sumInterest };
  }, [ledger, selectedYear, selectedMonth]);

  const groupedLedger = useMemo(() => {
    return (filteredLedger || []).reduce((acc, curr) => {
      if(!curr.date || typeof curr.date !== 'string') return acc;
      if (!acc[curr.date]) acc[curr.date] = [];
      acc[curr.date].push(curr);
      return acc;
    }, {});
  }, [filteredLedger]);
  const ledgerDates = Object.keys(groupedLedger).sort((a, b) => new Date(b) - new Date(a));

  const filteredDailyDeliveries = useMemo(() => {
    let data = dailyDeliveries || [];
    if (deliveryDateRange.start || deliveryDateRange.end) {
      if (deliveryDateRange.start) data = data.filter(d => typeof d?.date === 'string' && d.date >= deliveryDateRange.start);
      if (deliveryDateRange.end) data = data.filter(d => typeof d?.date === 'string' && d.date <= deliveryDateRange.end);
    } else {
      const monthStr = String(selectedMonth).padStart(2, '0');
      data = data.filter(d => typeof d?.date === 'string' && d.date.startsWith(`${selectedYear}-${monthStr}`));
    }
    return data;
  }, [dailyDeliveries, selectedYear, selectedMonth, deliveryDateRange]);

  const deliveryFilteredTotal = (filteredDailyDeliveries || []).reduce((a,b) => a + (b.amount||0), 0);
  const deliveryFilteredCount = (filteredDailyDeliveries || []).reduce((a,b) => a + (b.count||0), 0);
  const deliveryAvgPerDelivery = deliveryFilteredCount > 0 ? Math.round(deliveryFilteredTotal / deliveryFilteredCount) : 0;
  
  const filteredHyunaItems = (filteredDailyDeliveries || []).filter(d => d.earner === '현아');
  const filteredJunghoonItems = (filteredDailyDeliveries || []).filter(d => d.earner === '정훈');

  const deliveryYearlyTotal = useMemo(() => {
    return (dailyDeliveries || []).filter(d => typeof d?.date === 'string' && d.date.startsWith(String(selectedYear))).reduce((a,b) => a + (b.amount||0), 0);
  }, [dailyDeliveries, selectedYear]);

  const paydayGroups = useMemo(() => {
    const groups = {};
    (dailyDeliveries || []).forEach(d => {
      if(!d.date || typeof d.date !== 'string') return;
      const pd = getPaydayStr(d.date);
      if (!pd) return; 
      if (!groups[pd]) groups[pd] = { paydayStr: pd, total: 0, hyuna: 0, junghoon: 0, items: [] };
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
      if (!groups[pd]) groups[pd] = { total: 0, hyuna: 0, junghoon: 0 };
      groups[pd].total += (d.amount || 0);
      if (d.earner === '현아') groups[pd].hyuna += (d.amount || 0);
      if (d.earner === '정훈') groups[pd].junghoon += (d.amount || 0);
    });
    return groups;
  }, [globalPending]);

  const upcomingPaydays = Object.keys(pendingByPayday).sort();

  const groupedDaily = (filteredDailyDeliveries || []).reduce((acc, curr) => {
    if(!curr.date || typeof curr.date !== 'string') return acc;
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {});
  const dailyDates = Object.keys(groupedDaily).sort((a,b) => new Date(b) - new Date(a));

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
  
  const totalPrincipal = (assets?.loans || []).filter(l=>l.status!=='완납').reduce((a,b)=>a+(b.principal||0), 0);
  const totalMonthlyPayment = (assets?.loans || []).filter(l=>l.status!=='완납').reduce((a,b)=>a+getMonthlyPayment(b), 0);

  const paidLoansThisMonth = sortedLoans.filter(l => l.paidMonths?.includes(currentMonthKey));
  const unpaidLoansThisMonth = sortedLoans.filter(l => !l.paidMonths?.includes(currentMonthKey) && l.status !== '완납');
  const totalPaidThisMonth = paidLoansThisMonth.reduce((sum, l) => sum + getMonthlyPayment(l), 0);
  const totalUnpaidThisMonth = unpaidLoansThisMonth.reduce((sum, l) => sum + getMonthlyPayment(l), 0);

  const extendedDutyDays = useMemo(() => {
    return Array.from({length: 34}, (_, i) => {
      const d = new Date();
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const kst = new Date(utc + (9 * 3600000));
      kst.setDate(kst.getDate() + (i - 3)); 
      
      const yy = kst.getFullYear();
      const mm = String(kst.getMonth() + 1).padStart(2, '0');
      const dd = String(kst.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    });
  }, []);

  const topImportantEvents = useMemo(() => {
    return (events || [])
      .filter(e => e.isImportant && e.date && e.date >= todayStr)
      .sort((a,b) => (a.date||'').localeCompare(b.date||''))
      .slice(0, 3);
  }, [events, todayStr]);

  const sortedEvents = useMemo(() => {
    return (events || []).filter(e => e.date).sort((a, b) => (a.date||'').localeCompare(b.date||''));
  }, [events]);

  const familyEventsList = useMemo(() => {
    return sortedEvents.filter(e => e.type !== '듀티' && e.date);
  }, [sortedEvents]);

  const activeMessages = useMemo(() => {
    return (messages || []).filter(m => !m.isChecked).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }, [messages]);

  const archivedMessages = useMemo(() => {
    return (messages || []).filter(m => m.isChecked && !m.isSystemLog).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }, [messages]);

  const closeModals = () => { 
    setIsModalOpen(false); 
    setIsDeliveryModalOpen(false); 
    setIsEventModalOpen(false); 
    setIsDutyBatchModalOpen(false); 
    setIsMessageHistoryOpen(false);
    setIsPrepayModalOpen(false);
    setIsDutyEditModalOpen(false);
    setIsAddLoanModalOpen(false);
    setEditingEventId(null);
    setEditingDeliveryId(null);
    setEditingLedgerId(null);
    setDutyBatchMode('touch');
    setSelectedLedgerForDetail(null);
    setSelectedCalendarDate(null);
    setNewLoanFormData({ name: '', principal: '', rate: '', paymentDate: '1', paymentMethod: '이자' });
    setFormData({ date: todayStr, type: '지출', amount: '', category: getSortedCategories('지출')[0]||'식비', note: '', subNote: '' });
  };

  const openNewMemo = () => {
    setCurrentMemoId(null);
    setMemoText('');
    setIsCalcOpen(false);
    setIsMemoEditorOpen(true);
  };

  const openEditMemo = (memo) => {
    setCurrentMemoId(memo.id);
    setMemoText(memo.text || '');
    setIsCalcOpen(false);
    setIsMemoEditorOpen(true);
  };

  const closeMemoEditor = () => {
    setIsMemoEditorOpen(false);
    setIsCalcOpen(false);
  };

  const saveMemo = async () => {
    if(!user) return;
    if(!window.confirm("작성한 노트를 저장하시겠습니까?")) return;
    
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
    setIsMemoEditorOpen(false);
  };

  const deleteMemo = async () => {
    if (!currentMemoId || !user) return;
    if (window.confirm("이 메모를 정말 삭제하시겠습니까?")) {
      if (isFirebaseEnabled) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'memos', currentMemoId));
      else setMemos(memos.filter(m => m.id !== currentMemoId));
      closeMemoEditor();
    }
  };
  
  const clearFilters = (e) => { e.preventDefault(); setSearchQuery(''); setFilterType('all'); setFilterCategory('all'); setLedgerDateRange({ start: '', end: '' }); };

  const handleStartDelivery = async () => {
    const nowStr = new Date().toISOString();
    setTrackingStartTime(nowStr);
    setTimerActive(true);
    setElapsedSeconds(0);
    if (isFirebaseEnabled && user) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'deliveryTimer'), { timerActive: true, trackingStartTime: nowStr });
    } else {
      localStorage.setItem('hyunaDeliveryStartTime', nowStr);
    }
  };

  const handleEndDelivery = async () => {
    const end = new Date();
    const startObj = new Date(trackingStartTime);
    setDeliveryFormData({
      date: getKSTDateStr(),
      earner: '정훈', platform: '배민', amount: '', count: '',
      amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', 
      amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '', 
      startTime: formatTimeStr(startObj), endTime: formatTimeStr(end)
    });
    setTimerActive(false); setTrackingStartTime(null); setEditingDeliveryId(null); setIsDeliveryModalOpen(true);
    if (isFirebaseEnabled && user) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'deliveryTimer'), { timerActive: false, trackingStartTime: null });
    } else {
      localStorage.removeItem('hyunaDeliveryStartTime');
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !user) return;
    let finalCategory = formData.category;
    if (isCustomCategory) {
      const catInput = customCategoryInput.trim();
      if (!catInput) return alert("카테고리를 입력해주세요.");
      finalCategory = catInput;
      
      if (saveToCategoryList) {
        const newCats = {...categories, [formData.type]: [...(categories[formData.type]||[]), finalCategory]};
        if (isFirebaseEnabled) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'categories'), newCats);
        else setCategories(newCats);
      }
    }
    const newTx = { ...formData, category: finalCategory, amount: parseInt(String(formData.amount).replace(/,/g, ''), 10) };
    
    if (editingLedgerId) {
      if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ledger', editingLedgerId), newTx);
      else setLedger(ledger.map(t => t.id === editingLedgerId ? {...newTx, id: editingLedgerId} : t));
    } else {
      if (isFirebaseEnabled && user) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ledger'), newTx);
      else setLedger([{...newTx, id: Date.now().toString()}, ...ledger]);
    }
    closeModals();
  };

  const handleEditFromDetail = () => {
    if(!selectedLedgerForDetail) return;
    setFormData({
        date: selectedLedgerForDetail.date,
        type: selectedLedgerForDetail.type,
        amount: String(selectedLedgerForDetail.amount),
        category: selectedLedgerForDetail.category,
        note: selectedLedgerForDetail.note || '',
        subNote: selectedLedgerForDetail.subNote || ''
    });
    setEditingLedgerId(selectedLedgerForDetail.id);
    setIsCustomCategory(false);
    setSelectedLedgerForDetail(null);
    setIsModalOpen(true);
  };

  const toggleLedgerExpand = (id) => {
    setExpandedLedgers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (editingDeliveryId) {
      if (!deliveryFormData.amount) return;
      const parsedAmount = parseInt(String(deliveryFormData.amount).replace(/,/g, ''), 10);
      const newDel = {
        date: deliveryFormData.date, earner: deliveryFormData.earner, platform: deliveryFormData.platform,
        amount: parsedAmount, count: parseInt(deliveryFormData.count) || 0,
        startTime: deliveryFormData.startTime, endTime: deliveryFormData.endTime
      };
      if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery', editingDeliveryId), newDel);
      else setDailyDeliveries(prev => (prev||[]).map(item => item.id === editingDeliveryId ? {...newDel, id: item.id} : item));
    } else {
      const adds = [];
      const jbAmt = parseInt(String(deliveryFormData.amountJunghoonBaemin||0).replace(/,/g, ''), 10);
      const jbCnt = parseInt(deliveryFormData.countJunghoonBaemin) || 0;
      if (jbAmt > 0) adds.push({ date: deliveryFormData.date, earner: '정훈', platform: '배민', amount: jbAmt, count: jbCnt, startTime: deliveryFormData.startTime, endTime: deliveryFormData.endTime });

      const jcAmt = parseInt(String(deliveryFormData.amountJunghoonCoupang||0).replace(/,/g, ''), 10);
      const jcCnt = parseInt(deliveryFormData.countJunghoonCoupang) || 0;
      if (jcAmt > 0) adds.push({ date: deliveryFormData.date, earner: '정훈', platform: '쿠팡', amount: jcAmt, count: jcCnt, startTime: deliveryFormData.startTime, endTime: deliveryFormData.endTime });
      
      const hbAmt = parseInt(String(deliveryFormData.amountHyunaBaemin||0).replace(/,/g, ''), 10);
      const hbCnt = parseInt(deliveryFormData.countHyunaBaemin) || 0;
      if (hbAmt > 0) adds.push({ date: deliveryFormData.date, earner: '현아', platform: '배민', amount: hbAmt, count: hbCnt, startTime: deliveryFormData.startTime, endTime: deliveryFormData.endTime });

      const hcAmt = parseInt(String(deliveryFormData.amountHyunaCoupang||0).replace(/,/g, ''), 10);
      const hcCnt = parseInt(deliveryFormData.countHyunaCoupang) || 0;
      if (hcAmt > 0) adds.push({ date: deliveryFormData.date, earner: '현아', platform: '쿠팡', amount: hcAmt, count: hcCnt, startTime: deliveryFormData.startTime, endTime: deliveryFormData.endTime });

      if (adds.length === 0) return;
      if (isFirebaseEnabled && user) {
        for(const newDel of adds) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'delivery'), newDel);
      } else {
        const newAdds = adds.map(a => ({...a, id: Date.now().toString() + Math.random()}));
        setDailyDeliveries([...newAdds, ...(dailyDeliveries||[])]);
      }
    }
    closeModals();
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventFormData.title.trim() || !user) return;
    const newEvent = { ...eventFormData };
    
    if (editingEventId) {
      if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEventId), newEvent);
      else setEvents(events.map(ev => ev.id === editingEventId ? {...newEvent, id: editingEventId} : ev));
    } else {
      if (isFirebaseEnabled && user) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), newEvent);
      else setEvents([{...newEvent, id: Date.now().toString()}, ...(events||[])]);
    }
    closeModals();
  };

  const deleteEvent = async (id) => {
    if(!window.confirm('이 일정을 삭제하시겠습니까?')) return;
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
    if (!msg) return;
    const newReply = { id: Date.now().toString(), author: currentUser, text: replyText, createdAt: todayStr };
    const updatedReplies = [...(msg.replies || []), newReply];
    
    if (isFirebaseEnabled) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId), { replies: updatedReplies });
    } else {
      setMessages(messages.map(m => m.id === msgId ? { ...m, replies: updatedReplies } : m));
    }
    setReplyText('');
    setReplyingTo(null);
  };

  const handleDeleteSystemMessage = async (msgId) => {
    if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId), { isChecked: true, checkedAt: todayStr });
    else setMessages(messages.map(m => m.id === msgId ? { ...m, isChecked: true, checkedAt: todayStr } : m));
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
      const actionText = newDuty === 'DELETE' ? '삭제됨' : newDuty;
      const msgText = `- ${parseInt(dateStr.slice(5,7))}월 ${parseInt(dateStr.slice(8,10))}일: ${existingEvent ? existingEvent.title : 'OFF'} ➔ ${actionText}`;
      const curTime = new Date();
      const timeStr = `${curTime.getHours()}:${String(curTime.getMinutes()).padStart(2,'0')}`;
      const newMsg = { author: '시스템', title: `${currentUser}님의 듀티변경`, text: msgText, createdAt: todayStr, time: timeStr, isChecked: false, isSystemLog: true };
      
      if (isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), newMsg);
      else setMessages([{...newMsg, id: Date.now().toString()}, ...messages]);
    }

    setIsDutyEditModalOpen(false);
  };

  const openDutyBatchModal = () => {
    setDutyBatchYear(selectedYear);
    setDutyBatchMonth(selectedMonth);
    const current = {};
    events.forEach(e => {
      if(e.type === '듀티' && e.date && e.date.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2,'0')}`)) {
        current[e.date] = e.title;
      }
    });
    setBatchDuties(current);
    setSelectedStamp('DAY');
    setDutyBatchMode('touch'); 
    setIsDutyBatchEditMode(false); 
    setContinuousCursorDateStr(`${selectedYear}-${String(selectedMonth).padStart(2,'0')}-01`);
    setIsDutyBatchModalOpen(true);
  };

  useEffect(() => {
    if(isDutyBatchModalOpen) {
      setContinuousCursorDateStr(`${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}-01`);
      const current = {};
      events.forEach(e => {
        if(e.type === '듀티' && e.date && e.date.startsWith(`${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}`)) {
          current[e.date] = e.title;
        }
      });
      setBatchDuties(current);
    }
  }, [dutyBatchYear, dutyBatchMonth, isDutyBatchModalOpen, events]);

  const handleDutyCellClick = (dateStr) => {
    if(!isDutyBatchEditMode) return;
    setBatchDuties(prev => {
      const next = {...prev};
      if (selectedStamp === 'DELETE') {
        delete next[dateStr];
      } else {
        next[dateStr] = selectedStamp;
      }
      return next;
    });
  };

  const handleContinuousInput = (duty) => {
    if(!isDutyBatchEditMode) return;
    setBatchDuties(prev => ({ ...prev, [continuousCursorDateStr]: duty }));
    
    const [y, m, d] = continuousCursorDateStr.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    if (d < daysInMonth) {
        setContinuousCursorDateStr(`${y}-${String(m).padStart(2,'0')}-${String(d + 1).padStart(2,'0')}`);
    }
  };

  const handleContinuousUndo = () => {
    if(!isDutyBatchEditMode) return;
    const [y, m, d] = continuousCursorDateStr.split('-').map(Number);
    if (d > 1) {
        const prevStr = `${y}-${String(m).padStart(2,'0')}-${String(d - 1).padStart(2,'0')}`;
        setContinuousCursorDateStr(prevStr);
        setBatchDuties(prev => {
            const next = {...prev};
            delete next[prevStr];
            return next;
        });
    }
  };

  const saveBatchDuties = async () => {
    if(!user) return;
    const monthPrefix = `${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}`;
    const oldDuties = events.filter(e => e.type === '듀티' && e.date.startsWith(monthPrefix));
    
    // Diff 계산
    const oldDutyMap = {};
    oldDuties.forEach(e => { oldDutyMap[e.date] = e.title; });
    const allDates = new Set([...Object.keys(oldDutyMap), ...Object.keys(batchDuties)]);
    const changes = [];

    allDates.forEach(date => {
        const oldVal = oldDutyMap[date];
        const newVal = batchDuties[date];
        if (oldVal !== newVal) {
            if (!oldVal && newVal) changes.push(`- ${parseInt(date.slice(8,10))}일: ${newVal} 등록`);
            else if (oldVal && !newVal) changes.push(`- ${parseInt(date.slice(8,10))}일: 삭제됨`);
            else changes.push(`- ${parseInt(date.slice(8,10))}일: ${oldVal} ➔ ${newVal}`);
        }
    });
    
    if (isFirebaseEnabled) {
      for (const e of oldDuties) {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', e.id));
      }
      for (const [date, title] of Object.entries(batchDuties)) {
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), {
            type: '듀티', title, date, isImportant: false
         });
      }
      if (changes.length > 0) {
         const curTime = new Date();
         const timeStr = `${curTime.getHours()}:${String(curTime.getMinutes()).padStart(2,'0')}`;
         
         if (oldDuties.length === 0) {
             const msgText = `${dutyBatchMonth}월 근무표를 최초 등록했습니다.`;
             await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
                author: '시스템', title: '스케줄 최초 등록', text: msgText, createdAt: todayStr, time: timeStr, isChecked: false, isSystemLog: true
             });
         } else {
             const msgText = changes.join('\n');
             await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
                author: '시스템', title: `${currentUser}님의 듀티변경`, text: msgText, createdAt: todayStr, time: timeStr, isChecked: false, isSystemLog: true
             });
         }
      }
    } else {
      const kept = events.filter(e => !(e.type === '듀티' && e.date && e.date.startsWith(monthPrefix)));
      const added = Object.entries(batchDuties).map(([date, title], i) => ({
         id: `batch_${Date.now()}_${i}`, type: '듀티', title, date, isImportant: false
      }));
      setEvents([...added, ...kept]);
    }
    setIsDutyBatchModalOpen(false);
    alert(`${dutyBatchMonth}월 스케쥴이 일괄 저장되었습니다!`);
  };

  const handlePayLoanThisMonth = async (loan) => {
    if(!user) return;
    if(window.confirm(`'${loan.name}' 이번 달 납부를 완료하시겠습니까?`)) {
      const newPaidMonths = [...(loan.paidMonths || []), currentMonthKey];
      if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { paidMonths: newPaidMonths });
      else setAssets(prev => ({ ...prev, loans: (prev.loans||[]).map(l => l.id === loan.id ? { ...l, paidMonths: newPaidMonths } : l) }));
    }
  };

  const handleCancelPayLoanThisMonth = async (loan) => {
    if(!user) return;
    if(window.confirm(`'${loan.name}' 이번 달 납부 완료를 취소하시겠습니까?`)) {
      const newPaidMonths = (loan.paidMonths || []).filter(m => m !== currentMonthKey);
      if (isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { paidMonths: newPaidMonths });
      else setAssets(prev => ({ ...prev, loans: (prev.loans||[]).map(l => l.id === loan.id ? { ...l, paidMonths: newPaidMonths } : l) }));
    }
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
    const newStatus = newPrincipal === 0 ? '완납' : loan.status;
    const newHistoryItem = { id: Date.now().toString(), date: prepayFormData.date, principalAmount: pAmount, interestAmount: iAmount };

    if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { principal: newPrincipal, status: newStatus, prepaymentHistory: [newHistoryItem, ...(loan.prepaymentHistory || [])] });
    else setAssets(prev => ({...prev, loans: (prev.loans||[]).map(l => l.id === loan.id ? { ...l, principal: newPrincipal, status: newStatus, prepaymentHistory: [newHistoryItem, ...(l.prepaymentHistory || [])] } : l)}));
    closeModals();
  };

  const deletePrepaymentHistory = async (loanId, historyId) => {
    if(!user) return;
    if(!window.confirm('이 중도상환 기록을 삭제하고 원금을 다시 복구하시겠습니까?')) return;
    
    const loan = (assets?.loans||[]).find(l => l.id === loanId);
    if (!loan) return;
    const historyItem = (loan.prepaymentHistory||[]).find(h => h.id === historyId);
    if (!historyItem) return;
    const restoredPrincipal = loan.principal + historyItem.principalAmount;
    
    if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { principal: restoredPrincipal, status: restoredPrincipal > 0 ? '상환중' : '완납', prepaymentHistory: (loan.prepaymentHistory||[]).filter(h => h.id !== historyId) });
    else setAssets(prev => ({...prev, loans: (prev.loans||[]).map(l => l.id === loanId ? { ...l, principal: restoredPrincipal, status: restoredPrincipal > 0 ? '상환중' : '완납', prepaymentHistory: (l.prepaymentHistory||[]).filter(h => h.id !== historyId) } : l)}));
  };

  const updateAsset = async (type, id, field, value) => {
    if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', id), { [field]: value });
    else setAssets(prev => ({ ...prev, [type]: (prev[type]||[]).map(item => item.id === id ? { ...item, [field]: value } : item) }));
  }

  const deleteAsset = async (type, id) => {
    if(!window.confirm('선택한 항목을 정말 삭제하시겠습니까?\n(삭제 후에는 복구할 수 없습니다)')) return;
    if (isFirebaseEnabled && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', id));
    else setAssets(prev => ({ ...prev, [type]: (prev[type]||[]).filter(item => item.id !== id) }));
  }

  const deleteTransaction = async (id) => {
    if(!window.confirm('이 가계부 내역을 정말 삭제하시겠습니까?')) return;
    if (isFirebaseEnabled && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ledger', id));
    else setLedger((ledger||[]).filter(t => t.id !== id));
  }

  const deleteDailyDelivery = async (id) => {
    if(!window.confirm('이 배달 기록을 정말 삭제하시겠습니까?')) return;
    if (isFirebaseEnabled && user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery', id));
    else setDailyDeliveries((dailyDeliveries||[]).filter(d => d.id !== id));
  }

  const handleAddAssetItem = async (e) => {
    e.preventDefault();
    if (!newLoanFormData.name.trim() || !newLoanFormData.principal) return;
    const newAsset = { 
      assetType: 'loan', 
      name: newLoanFormData.name, 
      principal: parseInt(String(newLoanFormData.principal).replace(/[^0-9]/g, '')) || 0, 
      rate: newLoanFormData.rate, 
      paymentMethod: newLoanFormData.paymentMethod, 
      paymentDate: newLoanFormData.paymentDate, 
      duration: 0, 
      customMonthly: 0, 
      status: '상환중', 
      prepaymentHistory: [], 
      paidMonths: [] 
    };
    if (isFirebaseEnabled && user) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assets'), newAsset);
    else setAssets(prev => ({ ...prev, loans: [...(prev.loans||[]), {id: Date.now().toString(), ...newAsset}] }));
    setIsAddLoanModalOpen(false);
    setNewLoanFormData({ name: '', principal: '', rate: '', paymentDate: '1', paymentMethod: '이자' });
  };

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

  const updateSettings = async (field, value) => {
    const newSettings = { ...userSettings, [field]: value };
    if(isFirebaseEnabled && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'preferences'), newSettings);
    else setUserSettings(newSettings);
  };

  const appBgColor = activeTab === 'ledger' ? 'bg-pink-50/30' : activeTab === 'delivery' ? 'bg-slate-50' : 'bg-gray-50/80';

  return (
    <div className={`min-h-screen font-sans text-gray-900 select-none pb-32 transition-colors duration-500 ${appBgColor}`}>
      
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl pb-2 shadow-sm border-b border-gray-200/60">
        <header className="pt-10 pb-4 px-6 flex justify-between items-center">
          <div>
            {activeTab === 'ledger' ? (
               <span className="text-[10px] font-black text-pink-500 tracking-widest uppercase block mb-0.5">🌸 Lovely Planner</span>
            ) : activeTab === 'delivery' ? (
               <span className="text-[10px] font-black text-blue-500 tracking-widest uppercase block mb-0.5">🏍️ Delivery Pro</span>
            ) : activeTab === 'calendar' ? (
               <span className="text-[10px] font-black text-emerald-500 tracking-widest uppercase block mb-0.5">🌿 Family Calendar</span>
            ) : (
               <span className="text-[10px] font-black text-indigo-500 tracking-widest uppercase block mb-0.5">Family Planner</span>
            )}
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

        <div ref={scrollRefLedger} className="flex overflow-x-auto no-scrollbar gap-2 py-1 px-5 scroll-smooth">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)} 
              className={`flex-none px-5 py-2 rounded-[1.2rem] font-black text-sm transition-all shadow-sm ${
                selectedMonth === m 
                  ? (activeTab === 'ledger' ? 'bg-pink-500 text-white border border-pink-500' : activeTab === 'delivery' ? 'bg-blue-600 text-white border border-blue-600' : activeTab === 'calendar' ? 'bg-emerald-500 text-white border border-emerald-500' : 'bg-indigo-600 text-white border border-indigo-600')
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}>
              {m}월
            </button>
          ))}
        </div>
      </div>

      {isManageMode && (
        <div className="px-5 my-4 animate-in fade-in space-y-4">
           {/* 설정 탭 선택 (시스템 공통 vs 메뉴별 설정) */}
           <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner">
             <button onClick={() => setSettingsTab('common')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${settingsTab === 'common' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>⚙️ 시스템 설정</button>
             <button onClick={() => setSettingsTab('menu')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${settingsTab === 'menu' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>📂 메뉴별 설정</button>
           </div>

           {settingsTab === 'common' ? (
             <>
               <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md animate-in slide-in-from-left-2">
                 <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><User size={16} className="text-purple-500"/> 내 기기 프로필 설정 (부부 톡 용)</h3>
                 <div className="flex gap-2">
                   <button onClick={() => handleSetCurrentUser('현아')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${currentUser === '현아' ? 'bg-pink-500 text-white shadow-md border-pink-600' : 'bg-pink-50 text-pink-400 border border-pink-100 hover:bg-pink-100'}`}>👩 현아</button>
                   <button onClick={() => handleSetCurrentUser('정훈')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${currentUser === '정훈' ? 'bg-blue-600 text-white shadow-md border-blue-700' : 'bg-blue-50 text-blue-400 border border-blue-100 hover:bg-blue-100'}`}>🧑 정훈</button>
                 </div>
               </div>

               <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md animate-in slide-in-from-left-2">
                 <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><Smartphone size={16} className={activeTab === 'ledger' ? 'text-pink-500' : activeTab === 'delivery' ? 'text-blue-500' : 'text-indigo-500'}/> 앱 시작 시 기본 화면</h3>
                 <div className={`flex justify-between items-center p-3 rounded-xl border ${activeTab === 'ledger' ? 'bg-pink-50/50 border-pink-200/50' : activeTab === 'delivery' ? 'bg-blue-50/50 border-blue-200/50' : activeTab === 'calendar' ? 'bg-emerald-50/50 border-emerald-200/50' : 'bg-indigo-50/50 border-indigo-200/50'}`}>
                   <div>
                     <span className={`text-sm font-black ${activeTab === 'ledger' ? 'text-pink-600' : activeTab === 'delivery' ? 'text-blue-600' : activeTab === 'calendar' ? 'text-emerald-600' : 'text-indigo-700'}`}>{activeTab === 'ledger' ? '가계부' : activeTab === 'delivery' ? '배달수익' : activeTab === 'loans' ? '대출관리' : '우리가족'}</span>
                   </div>
                   <button onClick={() => { localStorage.setItem('hyunaDefaultTab', activeTab); alert('이 기기의 초기화면이 설정되었습니다.'); }} className={`${activeTab === 'ledger' ? 'bg-pink-500' : activeTab === 'delivery' ? 'bg-blue-600' : 'bg-indigo-600'} text-white text-[10px] px-3 py-2 rounded-lg font-bold active:scale-95 transition-transform shadow-sm`}>
                     현재 탭으로 고정
                   </button>
                 </div>
               </div>

               <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md animate-in slide-in-from-left-2">
                 <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><List size={16} className="text-indigo-500"/> 하단 메뉴 순서 변경</h3>
                 <div className="space-y-2">
                   {tabOrder.map((tabId, index) => (
                     <div key={tabId} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                       <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                         <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm text-xs">{index + 1}</span>
                         {tabConfig[tabId].label}
                       </span>
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
                     <div>
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-bold text-pink-500">지출 카테고리</span>
                         <button onClick={() => handleAddCategory('지출')} className="text-[10px] bg-pink-50 text-pink-600 px-2 py-1 rounded font-bold border border-pink-100">+ 추가</button>
                       </div>
                       <div className="flex flex-wrap gap-1.5">
                         {getSortedCategories('지출').map(c => (
                           <span key={c} className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-bold">{c} <button onClick={() => handleDeleteCategory('지출', c)} className="text-gray-400 hover:text-pink-500"><X size={12}/></button></span>
                         ))}
                       </div>
                     </div>
                     <div>
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-bold text-blue-500">수입 카테고리</span>
                         <button onClick={() => handleAddCategory('수입')} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold border border-blue-100">+ 추가</button>
                       </div>
                       <div className="flex flex-wrap gap-1.5">
                         {getSortedCategories('수입').map(c => (
                           <span key={c} className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-bold">{c} <button onClick={() => handleDeleteCategory('수입', c)} className="text-gray-400 hover:text-blue-500"><X size={12}/></button></span>
                         ))}
                       </div>
                     </div>
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

               {activeTab === 'loans' && (
                 <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-md animate-in slide-in-from-right-2 text-center text-sm font-bold text-gray-500">
                   설정에 있던 [대출 추가] 버튼은 메인 화면 상단으로 이동되었습니다.
                 </div>
               )}

               {activeTab === 'calendar' && (
                 <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-md animate-in slide-in-from-right-2 text-center text-sm font-bold text-gray-500">
                   우리가족 메뉴는 별도의 설정이 필요하지 않습니다.
                 </div>
               )}
             </>
           )}
        </div>
      )}

      <main className="px-5 max-w-md mx-auto pt-2">
        {activeTab === 'ledger' && (
          <div className="space-y-3 animate-in fade-in duration-500">
            <div className="bg-gradient-to-r from-pink-400 to-rose-400 rounded-3xl p-4 text-white shadow-md shadow-pink-200/50 relative overflow-hidden flex justify-between items-center">
               <div className="relative z-10">
                 <div className="text-[10px] font-bold opacity-90 mb-0 tracking-wider">🌸 {selectedYear}년 누적 총 수입</div>
                 <div className="text-3xl font-black tracking-tight leading-none mt-1">{formatLargeMoney(yearlyIncome)}<span className="text-lg ml-1 font-bold opacity-80">원</span></div>
               </div>
               <Heart className="w-16 h-16 opacity-20 absolute -right-3 -bottom-3 rotate-12" fill="white" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${showFilters ? 'bg-pink-500 text-white' : 'bg-white text-pink-500 border border-pink-200/60'}`}>
                  <Search size={16} />
                </button>
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1 flex-1">
                  <button onClick={() => { setFilterType('all'); setFilterCategory('all'); }} className={`flex-none px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm ${filterCategory === 'all' && filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-pink-200/50'}`}>전체</button>
                  {monthUsedCategories.map(c => (
                    <button key={c} onClick={() => { setFilterType('all'); setFilterCategory(c === filterCategory ? 'all' : c); }} className={`flex-none px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm ${filterCategory === c ? 'bg-pink-500 text-white' : 'bg-white text-gray-500 border border-pink-200/50'}`}>
                      #{c}
                    </button>
                  ))}
                </div>
              </div>

              {showFilters && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-200/60 animate-in slide-in-from-top-2 space-y-3 mb-3">
                  <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="text" placeholder="검색어 입력" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-pink-50/50 rounded-xl py-2 pl-9 pr-3 h-[44px] text-sm font-bold outline-none border border-pink-100 focus:ring-2 ring-pink-200 text-gray-700 transition-all" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[9px] font-black text-gray-400 uppercase ml-1 block mb-0.5">구분</label><select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterCategory('all'); }} className="w-full bg-pink-50/50 border border-pink-100 rounded-xl px-2 h-[44px] text-sm font-bold outline-none text-gray-700 focus:ring-2 ring-pink-200"><option value="all">전체보기</option><option value="지출">지출만</option><option value="수입">수입만</option></select></div>
                    <div><label className="text-[9px] font-black text-gray-400 uppercase ml-1 block mb-0.5">카테고리</label><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-pink-50/50 border border-pink-100 rounded-xl px-2 h-[44px] text-sm font-bold outline-none text-gray-700 truncate focus:ring-2 ring-pink-200"><option value="all">모든 분류</option>{getSortedCategories(filterType).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex justify-between mb-0.5"><span>조회 기간 (월별 무시)</span></label><div className="flex items-center gap-1.5"><input type="date" value={ledgerDateRange.start} onChange={(e) => setLedgerDateRange({...ledgerDateRange, start: e.target.value})} className="flex-1 bg-pink-50/50 border border-pink-100 rounded-xl px-2 h-[44px] text-xs font-bold outline-none text-gray-700 focus:ring-2 ring-pink-200" /><span className="text-gray-300 text-xs font-bold">~</span><input type="date" value={ledgerDateRange.end} onChange={(e) => setLedgerDateRange({...ledgerDateRange, end: e.target.value})} className="flex-1 bg-pink-50/50 border border-pink-100 rounded-xl px-2 h-[44px] text-xs font-bold outline-none text-gray-700 focus:ring-2 ring-pink-200" /></div></div>
                  <button onClick={clearFilters} className="w-full bg-gray-50 border border-gray-200 text-gray-500 py-3 rounded-xl font-black text-sm active:scale-95 flex items-center justify-center gap-1.5 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-colors shadow-sm"><RefreshCw size={14}/> 모든 검색/필터 초기화</button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-md border border-pink-200/80 relative overflow-hidden">
               <div className="flex justify-between items-center mb-3">
                 <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><PieChart size={16} className="text-pink-500"/> {selectedMonth}월 가계부 요약 🌷</h3>
               </div>
               
               <div className="grid grid-cols-3 gap-2 mb-3">
                 <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100/60 text-center shadow-sm overflow-hidden">
                   <div className="text-[9px] font-bold text-blue-500 mb-1">수입 합계 💰</div>
                   <AutoScaleValue value={ledgerSummary.income} />
                 </div>
                 <div className="bg-rose-50/60 p-3 rounded-2xl border border-rose-100/60 text-center shadow-sm overflow-hidden">
                   <div className="text-[9px] font-bold text-rose-500 mb-1">지출 합계 💸</div>
                   <AutoScaleValue value={ledgerSummary.expense} />
                 </div>
                 <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-100/60 text-center shadow-sm overflow-hidden">
                   <div className="text-[9px] font-bold text-purple-500 mb-1">남은 돈 ✨</div>
                   <AutoScaleValue value={ledgerSummary.net} isNet={true} />
                 </div>
               </div>

               <div className="flex justify-between text-center gap-2">
                 <div className="flex-1 bg-gray-50/80 p-2 rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
                   <div className="text-[9px] font-bold text-gray-500 mb-1">순수 생활비 🍱</div>
                   <AutoScaleValue value={financialSummary.sumLiving} />
                 </div>
                 <div className="flex-1 bg-gray-50/80 p-2 rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
                   <div className="text-[9px] font-bold text-gray-500 mb-1">대출 원금 🏦</div>
                   <AutoScaleValue value={financialSummary.sumPrincipal} />
                 </div>
                 <div className="flex-1 bg-gray-50/80 p-2 rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
                   <div className="text-[9px] font-bold text-gray-500 mb-1">대출 이자 📉</div>
                   <AutoScaleValue value={financialSummary.sumInterest} />
                 </div>
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
              const days = [];
              for (let i = 0; i < firstDay; i++) days.push(null);
              for (let i = 1; i <= daysInMonth; i++) days.push(i);

              const dataByDate = {};
              (filteredLedger || []).forEach(t => {
                if(!dataByDate[t.date]) dataByDate[t.date] = { inc: 0, exp: 0 };
                if(t.type === '수입') dataByDate[t.date].inc += t.amount;
                if(t.type === '지출') dataByDate[t.date].exp += t.amount;
              });

              return (
                <div className="bg-white rounded-[2rem] p-4 shadow-md border border-pink-200/60 animate-in slide-in-from-bottom-2">
                   <div className="grid grid-cols-7 gap-1 text-center mb-2">
                     {['일','월','화','수','목','금','토'].map((d,i) => <div key={d} className={`text-[10px] font-bold ${i===0?'text-pink-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>)}
                   </div>
                   <div className="grid grid-cols-7 gap-1">
                     {days.map((d, i) => {
                       if(!d) return <div key={`empty-${i}`} className="h-[55px] bg-gray-50/30 rounded-xl border border-gray-100"></div>;
                       const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                       const dayData = dataByDate[dateStr] || { inc: 0, exp: 0 };
                       const hasData = dayData.inc > 0 || dayData.exp > 0;
                       
                       return (
                         <div key={`day-${i}`} 
                              onClick={() => { if(hasData) setSelectedCalendarDate(dateStr); }}
                              className={`h-[55px] border rounded-xl p-0.5 flex flex-col items-center justify-start transition-all ${hasData?'border-pink-200 bg-pink-50/40 shadow-sm cursor-pointer active:scale-95 hover:bg-pink-100/50':'border-gray-100 bg-white'}`}>
                           <span className={`text-[10px] font-bold mb-0.5 ${(i%7)===0?'text-pink-500':(i%7)===6?'text-blue-500':'text-gray-600'}`}>{d}</span>
                           {dayData.inc > 0 && <span className="text-[9px] font-black text-blue-500 w-full text-center tracking-tighter overflow-hidden">+{formatCompactMoney(dayData.inc).replace('+','')}</span>}
                           {dayData.exp > 0 && <span className="text-[9px] font-black text-rose-500 w-full text-center tracking-tighter overflow-hidden">-{formatCompactMoney(dayData.exp).replace('-','')}</span>}
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
                    <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center justify-between"><span>💸 지출 TOP 5</span><span className="text-rose-500">{formatLargeMoney(ledgerSummary.expense)}원</span></h3>
                    <div className="space-y-3">
                      {reviewData.expense.map(([cat, amt], idx) => {
                        const pct = ledgerSummary.expense > 0 ? ((amt / ledgerSummary.expense) * 100).toFixed(1) : 0;
                        const colorClass = idx===0?'bg-rose-500':idx===1?'bg-pink-400':idx===2?'bg-fuchsia-400':'bg-gray-300';
                        return (
                          <div key={cat}>
                            <div className="flex justify-between items-end mb-1">
                              <div className="flex items-center gap-1.5"><span className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-black text-white ${colorClass}`}>{idx + 1}</span><span className="text-xs font-bold text-gray-700">{cat}</span></div>
                              <div className="text-right flex items-center gap-1.5"><div className="text-xs font-black text-gray-900">{formatLargeMoney(amt)}원</div><div className="text-[9px] text-gray-500 font-bold bg-pink-50 px-1.5 py-0.5 rounded">{pct}%</div></div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }}></div></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {reviewData.income.length > 0 && (
                  <div className="bg-white rounded-3xl p-5 shadow-md border border-blue-200/60">
                    <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center justify-between"><span>💰 수입 TOP 5</span><span className="text-blue-500">{formatLargeMoney(ledgerSummary.income)}원</span></h3>
                    <div className="space-y-3">
                      {reviewData.income.map(([cat, amt], idx) => {
                        const pct = ledgerSummary.income > 0 ? ((amt / ledgerSummary.income) * 100).toFixed(1) : 0;
                        const colorClass = idx===0?'bg-blue-500':idx===1?'bg-blue-400':idx===2?'bg-cyan-400':'bg-gray-300';
                        return (
                          <div key={cat}>
                            <div className="flex justify-between items-end mb-1">
                              <div className="flex items-center gap-1.5"><span className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-black text-white ${colorClass}`}>{idx + 1}</span><span className="text-xs font-bold text-gray-700">{cat}</span></div>
                              <div className="text-right flex items-center gap-1.5"><div className="text-xs font-black text-gray-900">{formatLargeMoney(amt)}원</div><div className="text-[9px] text-gray-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded">{pct}%</div></div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }}></div></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {reviewData.expense.length === 0 && reviewData.income.length === 0 && <div className="text-center py-20 text-gray-400 font-bold">내역이 없습니다.</div>}
              </div>
            )}

            {ledgerSubTab === 'memo' && (
              <div className="space-y-3 animate-in slide-in-from-right duration-300">
                 <div className="flex justify-between items-center px-1 mb-2">
                    <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><NotebookPen size={16} className="text-pink-500"/> 자유 메모</h3>
                    <button onClick={openNewMemo} className="text-[10px] bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full font-bold border border-pink-200 shadow-sm active:scale-95 transition-transform">+ 새 메모 작성</button>
                 </div>
                 {memos.length === 0 && <div className="text-center py-20 text-gray-400 font-bold text-sm bg-white rounded-[2rem] border border-pink-100 shadow-sm">작성된 메모가 없습니다.</div>}
                 {memos.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).map(memo => (
                    <div key={memo.id} onClick={() => openEditMemo(memo)} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200/80 active:scale-95 transition-transform cursor-pointer relative overflow-hidden">
                       <div className="text-[10px] font-bold text-gray-400 mb-2">{memo.updatedAt}</div>
                       <div className="text-base font-bold text-gray-800 line-clamp-2 leading-relaxed whitespace-pre-wrap">{memo.text || '내용 없음'}</div>
                       <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                    </div>
                 ))}
              </div>
            )}

            {ledgerSubTab === 'daily' && (
              <div className="space-y-3 animate-in slide-in-from-left duration-300">
                {ledgerDates.length === 0 && <div className="text-center py-20 text-gray-400 font-bold">내역이 없습니다.</div>}
                {ledgerDates.map(date => (
                  <div key={date} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200/80">
                     <div className="text-xs font-bold text-gray-400 mb-2.5 ml-1">
                       {typeof date === 'string' && date.length >= 10 ? `${date.slice(0,4)}년 ${parseInt(date.slice(5,7))}월 ${parseInt(date.slice(8,10))}일` : date}
                     </div>
                     <div className="space-y-2.5">
                      {(groupedLedger[date]||[]).map(t => {
                        const isExpanded = expandedLedgers[t.id];
                        return (
                          <div key={t.id} className="bg-gray-50/50 border border-gray-100/50 rounded-2xl hover:bg-pink-50/50 transition-colors shadow-sm mb-2">
                            <div className="flex justify-between items-center p-3 cursor-pointer" onClick={() => setSelectedLedgerForDetail(t)}>
                              <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <div className={`p-2.5 rounded-xl flex-shrink-0 shadow-sm ${t.type === '수입' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                                  {getCategoryIcon(t.category, t.type)}
                                </div>
                                <div className="truncate pr-2">
                                  <div className="text-[10px] font-bold text-gray-500 truncate flex items-center gap-1">
                                    {t.category} 
                                  </div>
                                  <div className="font-bold text-sm text-gray-800 truncate">{t.note || t.category}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 pl-2">
                                <span className={`font-black text-base tracking-tight ${t.type === '수입' ? 'text-blue-500' : 'text-gray-900'}`}>{formatLargeMoney(t.amount)}원</span>
                                {t.subNote && (
                                  <button onClick={(e) => { e.stopPropagation(); toggleLedgerExpand(t.id); }} className="p-1.5 ml-1 text-gray-400 hover:bg-gray-200 rounded-full transition-colors active:scale-95">
                                    <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {isExpanded && t.subNote && (
                               <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                                  <div className="bg-white p-3.5 rounded-xl border border-gray-100 text-[12px] font-bold text-gray-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                                     {t.subNote}
                                  </div>
                               </div>
                            )}
                          </div>
                        )
                      })}
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="flex flex-col gap-2 pb-28 pt-1 animate-in fade-in duration-500">
            
            <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2 ml-1">
                {timerActive ? <Timer className="w-5 h-5 text-blue-500 animate-pulse" /> : <Play className="w-5 h-5 text-slate-400" />}
                <div>
                  <div className="text-sm font-black text-gray-800 flex items-center gap-1">
                    실시간 기록 {timerActive && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>}
                  </div>
                  <div className="text-[10px] text-blue-400 font-bold">
                    {timerActive ? `${formatTimeStr(new Date(trackingStartTime))}부터 근무중` : '시작 버튼을 눌러주세요'}
                  </div>
                </div>
              </div>
              <button 
                onClick={timerActive ? handleEndDelivery : handleStartDelivery} 
                className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm ${timerActive ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-blue-200'}`}
              >
                {timerActive ? `${Math.floor(elapsedSeconds/3600)}:${String(Math.floor((elapsedSeconds%3600)/60)).padStart(2,'0')}:${String(elapsedSeconds%60).padStart(2,'0')} 종료` : '시작하기'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              {upcomingPaydays.length === 0 ? (
                <div className="col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center text-gray-400 text-sm font-bold">대기 중인 정산금이 없습니다.</div>
              ) : (
                upcomingPaydays.slice(0,2).map((pd, idx) => {
                  const group = pendingByPayday[pd];
                  const isClosest = idx === 0;
                  return (
                    <div key={pd} className={`bg-white rounded-2xl p-3.5 shadow-sm border ${isClosest ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200'} flex flex-col justify-between`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[11px] font-black tracking-tighter ${isClosest ? "text-blue-600" : "text-gray-500"}`}>
                          {parseInt(pd.slice(5,7))}/{parseInt(pd.slice(8,10))} ({['일','월','화','수','목','금','토'][new Date(pd).getDay()]})
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-tighter shadow-sm ${isClosest ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {isClosest ? '이번주' : '다음주'}
                        </span>
                      </div>
                      <div className={`text-2xl font-black tracking-tighter ${isClosest ? 'text-blue-600' : 'text-gray-700'}`}>
                        {formatLargeMoney(group.total)}<span className="text-base font-bold opacity-80">원</span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-500 mt-1">
                        정훈 {formatLargeMoney(group.junghoon)}원 | 현아 {formatLargeMoney(group.hyuna)}원
                      </div>
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
                  <div className="text-4xl font-black tracking-tighter leading-none">{formatLargeMoney(deliveryFilteredTotal)}<span className="text-lg ml-1 opacity-80 font-bold">원</span></div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] bg-white/20 px-2 py-1 rounded font-bold tracking-tight mb-1.5 inline-block">{selectedYear}년 누적: {formatLargeMoney(deliveryYearlyTotal)}원</div>
                  <div className="text-[10px] font-bold opacity-90 flex flex-col items-end">
                    <span>총 {formatMoney(deliveryFilteredCount)}건</span>
                    <span>평단 {formatMoney(deliveryAvgPerDelivery)}원</span>
                  </div>
                </div>
              </div>
              
              {(userSettings.deliveryGoals?.[currentMonthKey] || 0) > 0 && !deliveryDateRange.start && !deliveryDateRange.end && (() => {
                 const goal = userSettings.deliveryGoals[currentMonthKey];
                 const pct = Math.min(100, (deliveryFilteredTotal / goal) * 100);
                 return (
                   <div className="mb-2 relative z-10">
                     <div className="flex justify-between text-[10px] font-bold mb-1 opacity-90">
                       <span>목표 {formatLargeMoney(goal)}원</span>
                       <span>{pct.toFixed(1)}% 달성</span>
                     </div>
                     <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                       <div className="bg-white h-full rounded-full transition-all duration-1000" style={{width: `${pct}%`}}></div>
                     </div>
                   </div>
                 );
              })()}

              <div className="flex bg-white/10 rounded-xl p-3 mt-3 divide-x divide-white/20 relative z-10 shadow-sm border border-white/10">
                <div className="flex-1 px-3">
                  <div className="text-[10px] opacity-80 mb-1 flex justify-between font-bold">정훈 <span>{filteredJunghoonItems.reduce((a,b)=>a+(b.count||0),0)}건</span></div>
                  <div className="text-base font-black">{formatLargeMoney(filteredJunghoonItems.reduce((a,b)=>a+(b.amount||0),0))}원</div>
                </div>
                <div className="flex-1 px-3">
                  <div className="text-[10px] opacity-80 mb-1 flex justify-between font-bold">현아 <span>{filteredHyunaItems.reduce((a,b)=>a+(b.count||0),0)}건</span></div>
                  <div className="text-base font-black">{formatLargeMoney(filteredHyunaItems.reduce((a,b)=>a+(b.amount||0),0))}원</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <div className="flex bg-white p-1 rounded-xl flex-1 shadow-sm border border-slate-200">
                <button onClick={() => setDeliverySubTab('daily')} className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${deliverySubTab==='daily'?'bg-blue-50 text-blue-600 shadow-sm border border-blue-100':'text-gray-500'}`}>상세내역</button>
                <button onClick={() => setDeliverySubTab('calendar')} className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${deliverySubTab==='calendar'?'bg-blue-50 text-blue-600 shadow-sm border border-blue-100':'text-gray-500'}`}>달력</button>
                <button onClick={() => setDeliverySubTab('weekly')} className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${deliverySubTab==='weekly'?'bg-blue-50 text-blue-600 shadow-sm border border-blue-100':'text-gray-500'}`}>주차별</button>
              </div>
              <button onClick={() => setShowDeliveryFilters(!showDeliveryFilters)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${showDeliveryFilters ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                <Filter size={18} />
              </button>
            </div>

            {showDeliveryFilters && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-200 animate-in slide-in-from-top-2">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 flex justify-between">
                    <span>임의 기간 지정 (옵션)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={deliveryDateRange.start} onChange={(e) => setDeliveryDateRange({...deliveryDateRange, start: e.target.value})} className="flex-1 bg-slate-50 rounded-xl px-2 h-[44px] text-sm font-bold outline-none text-gray-700 border border-slate-200 focus:ring-2 ring-blue-200" />
                    <span className="text-gray-300 text-sm font-bold">~</span>
                    <input type="date" value={deliveryDateRange.end} onChange={(e) => setDeliveryDateRange({...deliveryDateRange, end: e.target.value})} className="flex-1 bg-slate-50 rounded-xl px-2 h-[44px] text-sm font-bold outline-none text-gray-700 border border-slate-200 focus:ring-2 ring-blue-200" />
                  </div>
                </div>
                <button onClick={() => setDeliveryDateRange({start:'', end:''})} className="w-full mt-3 bg-gray-50 border border-gray-200 text-gray-500 py-3 rounded-xl font-black text-sm active:scale-95 flex items-center justify-center gap-1.5 hover:bg-blue-50 hover:text-blue-600 transition-colors"><RefreshCw size={14}/> 기간 설정 초기화</button>
              </div>
            )}

            {deliverySubTab === 'calendar' && (() => {
              const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
              const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
              const days = [];
              for (let i = 0; i < firstDay; i++) days.push(null);
              for (let i = 1; i <= daysInMonth; i++) days.push(i);

              const dataByDate = {};
              (filteredDailyDeliveries || []).forEach(d => {
                if(!d.date) return;
                if(!dataByDate[d.date]) dataByDate[d.date] = { amt: 0 };
                dataByDate[d.date].amt += (d.amount||0);
              });

              return (
                <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-blue-200 animate-in slide-in-from-bottom-2 mt-1">
                   <div className="grid grid-cols-7 gap-1 text-center mb-2">
                     {['일','월','화','수','목','금','토'].map((d,i) => <div key={d} className={`text-[11px] font-bold ${i===0?'text-red-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>)}
                   </div>
                   <div className="grid grid-cols-7 gap-1">
                     {days.map((d, i) => {
                       if(!d) return <div key={`empty-${i}`} className="h-[60px] bg-gray-50/30 rounded-xl border border-gray-100"></div>;
                       const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                       const dayData = dataByDate[dateStr] || { amt: 0 };
                       const hasData = dayData.amt > 0;
                       
                       return (
                         <div key={`day-${i}`} className={`h-[60px] border rounded-xl p-1 flex flex-col items-center justify-center ${hasData?'border-blue-200 bg-blue-50/40 shadow-sm':'border-gray-100 bg-white'}`}>
                           <span className={`text-[11px] font-bold mb-1 ${(i%7)===0?'text-red-400':(i%7)===6?'text-blue-400':'text-gray-600'}`}>{d}</span>
                           {hasData && (
                             <span className="text-[10px] font-black text-blue-600 w-full text-center tracking-tighter truncate">{formatCompactMoney(dayData.amt).replace('+','')}</span>
                           )}
                         </div>
                       )
                     })}
                   </div>
                </div>
              );
            })()}

            {deliverySubTab === 'weekly' && (
              <div className="space-y-3 animate-in slide-in-from-right duration-300 mt-1">
                {pastPaydays.length === 0 && <p className="text-center text-gray-400 py-10 font-bold">과거 내역이 없습니다.</p>}
                {pastPaydays.map((pDate) => {
                  const group = paydayGroups[pDate];
                  return (
                    <div key={pDate} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-gray-400 font-bold mb-1.5">{typeof pDate === 'string' && pDate.length >= 10 ? `${pDate.slice(0,4)}년 ${pDate.slice(5).replace('-', '/')}` : pDate} 입금완료</div>
                        <div className="font-black text-gray-800 text-base">
                          {parseInt(String(pDate).slice(5,7))}월 {getWeekOfMonth(pDate)}주차
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-blue-600 tracking-tight">{formatLargeMoney(group.total)}원</div>
                        <div className="text-[10px] text-gray-500 font-bold mt-1">정훈 {formatLargeMoney(group.junghoon)}원 | 현아 {formatLargeMoney(group.hyuna)}원</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {deliverySubTab === 'daily' && (
              <div className="space-y-3 animate-in slide-in-from-left duration-300 mt-1">
                {dailyDates.length === 0 && <p className="text-center text-gray-400 py-10 font-bold">내역이 없습니다.</p>}
                {dailyDates.map(date => {
                  const dayMetrics = calcDailyMetrics(groupedDaily[date]);

                  return (
                    <div key={date} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-200">
                       <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                         <div className="overflow-hidden pr-2">
                           <div className="text-sm font-black text-gray-800 flex items-center gap-1.5 mb-1.5 truncate">
                             <CalendarCheck size={14} className="text-blue-500 flex-shrink-0" />
                             {typeof date === 'string' && date.length >= 10 ? `${date.slice(0,4)}년 ${parseInt(date.slice(5,7))}월 ${parseInt(date.slice(8,10))}일` : date}
                           </div>
                           {dayMetrics.durationStr && (
                             <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1 truncate">
                                <Timer size={12} className="flex-shrink-0"/> {dayMetrics.durationStr} 근무
                             </div>
                           )}
                         </div>
                         <div className="text-right flex-shrink-0">
                           <div className="text-lg font-black text-blue-600 mb-1.5 tracking-tight">{formatLargeMoney(dayMetrics.totalAmt)}원</div>
                           <div className="flex gap-1 justify-end items-center flex-nowrap overflow-x-auto no-scrollbar">
                             <span className="bg-slate-50 text-[9px] font-black text-gray-500 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">총 {dayMetrics.totalCnt}건</span>
                             <span className="bg-slate-50 text-[9px] font-black text-gray-500 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">평단 {formatMoney(dayMetrics.perDelivery)}원</span>
                             {dayMetrics.hourlyRate > 0 && <span className="bg-blue-50 text-[9px] font-black text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap">시급 {formatMoney(dayMetrics.hourlyRate)}원</span>}
                           </div>
                         </div>
                       </div>
                       
                       <div className="space-y-2">
                        {(groupedDaily[date]||[]).map(d => {
                          const pDay = getPaydayStr(d.date);
                          const isPending = pDay && pDay >= todayStr;

                          return (
                            <div key={d.id} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl hover:bg-blue-50/50 transition-colors border border-slate-100/50">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs flex-shrink-0 shadow-sm ${d.platform === '배민' ? 'bg-[#2ac1bc]' : d.platform === '쿠팡' ? 'bg-[#111111]' : 'bg-gray-400'}`}>{d.platform}</div>
                                <div className="truncate">
                                  <div className="font-black text-sm text-gray-800 truncate">{d.earner} <span className="text-gray-400 text-[10px] font-bold">| {d.count}건 {d.startTime ? `(${d.startTime}~${d.endTime})` : ''}</span></div>
                                  <div className={`text-[10px] font-bold mt-1 truncate ${isPending ? 'text-blue-500' : 'text-gray-500'}`}>{isPending && typeof pDay === 'string' && pDay.length >= 10 ? `${pDay.slice(5,10).replace('-','/')} 입금 대기` : '정산 완료'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="font-black text-base text-gray-900 tracking-tight">{formatLargeMoney(d.amount)}원</span>
                                <button onClick={() => {
                                  setDeliveryFormData({
                                    date: d.date, earner: d.earner, platform: d.platform, amount: String(d.amount||''),
                                    count: String(d.count || ''), startTime: d.startTime || '', endTime: d.endTime || '',
                                    amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', 
                                    amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '' 
                                  });
                                  setEditingDeliveryId(d.id);
                                  setIsDeliveryModalOpen(true);
                                }} className="text-gray-400 hover:text-blue-500 bg-white p-2 rounded-xl shadow-sm border border-gray-200"><Edit3 size={14}/></button>
                                <button onClick={() => deleteDailyDelivery(d.id)} className="text-gray-400 hover:text-red-500 bg-white p-2 rounded-xl shadow-sm border border-gray-200"><Trash2 size={14}/></button>
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
          </div>
        )}

        {activeTab === 'loans' && (
          <div className="space-y-4 pb-28 pt-4 animate-in slide-in-from-right duration-500">
            <section>
              <div className="flex justify-between items-center mb-3 px-2">
                <h3 className="text-lg font-black text-gray-900">부채 상환 현황</h3>
              </div>
              
              <div className="bg-indigo-600 rounded-[2rem] p-5 text-white shadow-md shadow-indigo-200/50 relative overflow-hidden">
                <Landmark className="absolute -right-6 -bottom-6 w-36 h-36 opacity-10" />
                <div className="relative z-10">
                  <div className="text-indigo-200 text-xs font-bold mb-1 uppercase tracking-widest">총 대출 잔액</div>
                  <div className="text-3xl font-black mb-4 tracking-tight leading-none">{formatLargeMoney(totalPrincipal)}<span className="text-xl ml-1 font-bold opacity-80">원</span></div>
                  
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                    <div className="flex justify-between items-center">
                       <span className="text-[11px] text-indigo-100 font-bold">이번 달 총 납입 예정</span>
                       <span className="text-base font-black text-white">{formatLargeMoney(totalMonthlyPayment)}원</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[11px] text-indigo-100 font-bold">이번 달 납부 완료</span>
                       <span className="text-base font-black text-emerald-300">{formatLargeMoney(totalPaidThisMonth)}원</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-indigo-400/50 mt-1">
                       <span className="text-sm text-white font-bold">이번 달 남은 납입금</span>
                       <span className="text-xl font-black text-white">{formatLargeMoney(totalUnpaidThisMonth)}원</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-3 px-2">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><List size={16} className="text-indigo-500"/> 개별 대출 상세</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsAddLoanModalOpen(true)} className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-black hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100 flex items-center gap-1">
                    <Plus size={12}/> 대출 추가
                  </button>
                  <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg shadow-sm border border-gray-200">
                    <ArrowDownUp size={12} className="text-gray-400" />
                    <select value={loanSortBy} onChange={(e) => {
                      setLoanSortBy(e.target.value);
                      localStorage.setItem('hyunaLoanSortBy', e.target.value);
                    }} className="text-[10px] font-bold text-gray-600 bg-transparent outline-none appearance-none cursor-pointer">
                      <option value="date">납부일 빠른순</option><option value="principal">잔액 많은순</option><option value="rate">금리 높은순</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {sortedLoans.map((loan) => {
                  const isPaidThisMonth = loan.paidMonths?.includes(currentMonthKey);
                  return (
                  <div key={loan.id} className={`bg-white rounded-3xl p-4 shadow-sm border leading-tight ${loan.status === '완납' ? 'opacity-50 border-green-200 bg-green-50/30' : isPaidThisMonth ? 'border-indigo-200 bg-indigo-50/20' : 'border-gray-200'}`}>
                    
                    <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2.5">
                      <span className="font-bold text-gray-800 flex items-center text-base">{loan.name} {loan.status === '완납' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-1.5"/>}</span>
                      
                      <div className="flex items-center gap-1.5">
                        {!isManageMode && <span className="text-[10px] bg-white text-indigo-600 px-2 py-0.5 rounded font-black border border-indigo-100 shadow-sm">금리 {loan.rate}%</span>}
                        {loan.status !== '완납' && (
                          <div className="bg-red-50 text-red-600 px-2.5 py-1 rounded-xl font-black text-[10px] flex items-center gap-1 border border-red-100 shadow-sm">
                             <CalendarDays size={12}/> 매월 {loan.paymentDate}일
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mb-3">
                      <div className="flex-1">
                        <div className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-widest flex justify-between items-center">
                          잔액
                          {isManageMode && (
                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                              <input type="text" value={loan.rate || ''} onChange={(e) => updateAsset('loans', loan.id, 'rate', e.target.value)} className="w-12 text-right text-xs font-black text-indigo-600 outline-none bg-transparent" placeholder="0.0" />
                              <span className="text-[10px] font-bold text-gray-500">%</span>
                            </div>
                          )}
                        </div>
                        {isManageMode ? <input type="text" value={loan.principal ? formatMoney(loan.principal) : ''} onChange={(e) => updateAsset('loans', loan.id, 'principal', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)} className="w-full text-lg font-black bg-gray-50 p-2 rounded-xl outline-none focus:ring-2 ring-indigo-200 border border-gray-200" /> : <div className="text-xl font-black text-gray-900 tracking-tight leading-none">{formatLargeMoney(loan.principal)}<span className="text-sm ml-0.5">원</span></div>}
                      </div>
                      
                      <div className="text-right ml-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 min-w-[100px] shadow-sm">
                        <div className="flex justify-end gap-1 mb-1">
                          {isManageMode && (
                            <div className="text-[9px] font-bold text-gray-500 bg-white px-1 py-0.5 rounded border border-gray-200 flex items-center">
                              <input type="text" value={loan.paymentDate || ''} onChange={(e) => updateAsset('loans', loan.id, 'paymentDate', e.target.value)} className="w-6 text-center outline-none bg-transparent" placeholder="일"/>
                            </div>
                          )}
                          <div className="text-[10px] font-bold text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200 flex items-center shadow-sm">
                            {isManageMode ? <select value={loan.paymentMethod} onChange={(e) => updateAsset('loans', loan.id, 'paymentMethod', e.target.value)} className="outline-none bg-transparent"><option value="이자">이자</option><option value="원리금">원리금</option></select> : loan.paymentMethod}
                          </div>
                        </div>
                        <div className="font-black text-[14px] text-indigo-600 leading-none mt-1.5">{formatMoney(getMonthlyPayment(loan))}원</div>
                      </div>
                    </div>

                    {isManageMode && loan.paymentMethod === '원리금' && (
                      <div className="bg-orange-50/50 p-2.5 rounded-xl mb-3 space-y-1.5 border border-orange-200 shadow-sm">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-orange-800 ml-1 flex items-center gap-1"><Timer size={10}/> 남은 상환 기간 (자동계산)</span>
                          <div className="flex items-center gap-1">
                            <input type="number" value={loan.duration || ''} onChange={(e) => updateAsset('loans', loan.id, 'duration', parseInt(e.target.value)||0)} className="w-16 text-right p-1 rounded border border-orange-200 outline-none font-black text-orange-900 bg-white focus:ring-2 ring-orange-300" placeholder="개월" />
                            <span className="font-bold text-orange-800">개월</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-orange-800 ml-1 flex items-center gap-1"><Settings size={10}/> 또는 직접 금액 입력</span>
                          <div className="flex items-center gap-1">
                            <input type="number" value={loan.customMonthly || ''} onChange={(e) => updateAsset('loans', loan.id, 'customMonthly', parseInt(e.target.value)||0)} className="w-24 text-right p-1 rounded border border-orange-200 outline-none font-black text-orange-900 bg-white focus:ring-2 ring-orange-300" placeholder="금액" />
                            <span className="font-bold text-orange-800">원</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-100 mt-1">
                      <div className="flex justify-between items-center mb-1 gap-2">
                        {loan.status === '완납' ? (
                          <span className="text-xs font-black text-green-500 flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-green-200 shadow-sm w-full justify-center"><CheckCircle2 size={14}/> 완납된 대출입니다</span>
                        ) : isPaidThisMonth ? (
                          <button onClick={() => handleCancelPayLoanThisMonth(loan)} className="text-[11px] bg-green-100 text-green-700 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm flex-1 border border-green-200">
                            <CheckCircle2 size={14}/> {selectedMonth}월 납부 취소
                          </button>
                        ) : (
                          <button onClick={() => handlePayLoanThisMonth(loan)} className="text-[11px] bg-indigo-600 text-white px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md flex-1">
                            <CheckCircle2 size={14}/> 이번 달 납부 처리
                          </button>
                        )}
                        {loan.principal > 0 && (
                          <button onClick={() => { setPrepayFormData({ loanId: loan.id, date: new Date().toISOString().slice(0,10), principalAmount: '', interestAmount: '' }); setIsPrepayModalOpen(true); }} className="text-[10px] bg-white text-gray-600 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform shadow-sm border border-gray-200">
                            <Coins size={12}/> 중도상환
                          </button>
                        )}
                        <button onClick={() => deleteAsset('loans', loan.id)} className="text-gray-400 hover:text-red-500 bg-white p-2 rounded-xl shadow-sm border border-gray-200 ml-1"><Trash2 size={14}/></button>
                      </div>

                      {loan.prepaymentHistory?.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {loan.prepaymentHistory.map(h => (
                            <div key={h.id} className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-100/50 shadow-sm">
                              <div>
                                <div className="text-[9px] text-gray-400 font-bold mb-0.5 flex items-center gap-1 truncate"><CalendarIcon size={10}/> {(h.date || '').replace(/-/g, '.')} 상환 완료</div>
                                <div className="text-xs font-black text-gray-800 truncate">원금 {formatLargeMoney(h.principalAmount)}원{h.interestAmount > 0 && <span className="text-gray-500 font-bold ml-1 text-[9px]"> (+이자 {formatLargeMoney(h.interestAmount)}원)</span>}</div>
                              </div>
                              {isManageMode && <button onClick={() => deletePrepaymentHistory(loan.id, h.id)} className="text-red-300 hover:text-red-500 p-1.5 bg-gray-50 rounded-lg flex-shrink-0 border border-gray-200"><X size={12}/></button>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )})}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-5 pb-28 pt-2 animate-in slide-in-from-right duration-500">
            
            <div className="bg-pink-50/80 rounded-3xl p-5 border border-pink-200/60 shadow-sm relative">
               <h3 className="text-xs font-black text-pink-500 mb-3 flex justify-between items-center">
                  <span className="flex items-center gap-1"><MessageSquareHeart size={14}/> 부부 한줄 톡 💌</span>
                  <button onClick={() => setIsMessageHistoryOpen(true)} className="text-gray-400 font-bold border-b border-gray-300 pb-0.5 active:text-pink-500">과거 보관소</button>
               </h3>
               
               <div className="space-y-3 mb-4">
                  {activeMessages.length === 0 && <div className="text-center text-gray-400 font-bold text-[10px] py-6 bg-white/50 rounded-2xl border border-pink-100/50">새로운 메시지가 없습니다.</div>}
                  {activeMessages.map(m => {
                    if (m.isSystemLog || m.author === '시스템') {
                      return (
                        <div key={m.id} className="bg-emerald-50 p-3.5 rounded-2xl shadow-sm border border-emerald-100/50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col gap-1">
                              <span className="bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-black w-max shadow-sm">시스템 알림</span>
                              <span className="text-[11px] font-black text-emerald-900">{m.title || '근무 변경 알림'}</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600/70 bg-emerald-100/50 px-2 py-1 rounded-lg border border-emerald-100">{m.time || (typeof m.createdAt === 'string' && m.createdAt.slice(5).replace('-','/'))}</span>
                          </div>
                          <div className="text-xs font-bold text-emerald-800 leading-relaxed whitespace-pre-wrap pl-1 border-l-2 border-emerald-200 ml-1">{m.text}</div>
                          <div className="mt-2 text-right">
                             <button onClick={() => handleDeleteSystemMessage(m.id)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-[10px] font-black active:scale-95 transition-transform shadow-sm inline-flex items-center gap-1"><CheckCircle2 size={12}/> 확인</button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={m.id} className={`bg-white p-4 rounded-2xl shadow-sm border ${m.author === '현아' ? 'border-pink-200/50' : 'border-blue-200/50'}`}>
                         <div className="flex justify-between items-start mb-1.5">
                            <div>
                               <div className="text-[10px] text-gray-400 font-bold mb-1.5 flex items-center gap-1">
                                 <span className={`px-1.5 py-0.5 rounded text-white ${m.author === '현아' ? 'bg-pink-400' : 'bg-blue-400'}`}>{m.author}</span>
                                 {typeof m.createdAt === 'string' && m.createdAt.slice(5).replace('-','/')}
                               </div>
                               <div className="text-base font-black text-gray-800 leading-relaxed break-all">{m.text}</div>
                            </div>
                         </div>

                         {(m.replies || []).length > 0 && (
                           <div className="mt-3 space-y-1.5 pl-3 border-l-[3px] border-gray-100 py-1">
                             {m.replies.map(r => (
                               <div key={r.id} className="flex flex-col bg-gray-50/80 p-3 rounded-xl border border-gray-100/50">
                                 <div className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1">
                                   <span className={`${r.author === '현아' ? 'text-pink-500' : 'text-blue-500'}`}>{r.author}</span>
                                 </div>
                                 <div className="text-sm font-black text-gray-700">{r.text}</div>
                               </div>
                             ))}
                           </div>
                         )}

                         {replyingTo === m.id ? (
                           <div className="mt-3 flex gap-1.5 animate-in fade-in bg-gray-50 p-1.5 rounded-2xl border border-gray-200 shadow-inner">
                             <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={`${currentUser}(으)로 답글 달기...`} className="flex-1 bg-white text-sm font-bold rounded-xl px-3 py-2 outline-none border border-gray-200" />
                             <button onClick={() => handleAddReplySubmit(m.id)} className="bg-gray-800 text-white px-3 rounded-xl text-xs font-black active:scale-95">등록</button>
                             <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="bg-white text-gray-500 px-2 rounded-xl text-xs active:scale-95 border border-gray-200"><X size={14}/></button>
                           </div>
                         ) : (
                           <div className="flex justify-end gap-1.5 mt-3 pt-3 border-t border-gray-50">
                              <button onClick={() => setReplyingTo(m.id)} className="text-[11px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform border border-gray-200"><MessageSquareHeart size={14}/> 답글</button>
                              <button onClick={() => handleCheckMessage(m.id)} className="text-[11px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform border border-gray-200"><CheckCircle2 size={14}/> 보관함 이동</button>
                           </div>
                         )}
                      </div>
                    )
                  })}
               </div>

               <div className="flex gap-2 relative mt-2">
                  <div className="absolute -top-7 left-1">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-t-lg text-white shadow-[0_-2px_4px_rgba(0,0,0,0.05)] ${currentUser === '현아' ? 'bg-pink-500' : 'bg-blue-600'}`}>{currentUser} 작성중</span>
                  </div>
                  <input value={messageFormData.text} onChange={e => setMessageFormData({...messageFormData, text: e.target.value})} placeholder="여보 오늘 저녁은 뭐야? 🍗" className="flex-1 bg-white rounded-2xl px-4 py-3.5 text-base font-bold outline-none border border-pink-200 shadow-sm" />
                  <button onClick={handleSendMessage} disabled={!messageFormData.text.trim()} className="bg-pink-500 text-white px-5 rounded-2xl font-black shadow-md border border-pink-600 active:scale-95 disabled:opacity-50">전송</button>
               </div>
            </div>

            <div>
              <div className="flex justify-between items-center px-2 mb-3">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><Stethoscope size={16} className="text-pink-500"/> 현아 근무 스케줄</h3>
                <button onClick={openDutyBatchModal} className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full font-bold border border-emerald-200 shadow-sm active:scale-95 transition-transform">
                  + 한달스케쥴 확인 및 수정
                </button>
              </div>
              
              <div className="relative pt-4">
                <div ref={dutyTimelineRef} className="flex overflow-x-auto no-scrollbar gap-2 px-2 pb-4 pt-5 scroll-smooth">
                  {extendedDutyDays.map((d) => {
                    const dutyEvent = events.find(e => e.date === d && e.type === '듀티');
                    const duty = dutyEvent ? dutyEvent.title : 'OFF';
                    const isToday = d === todayStr;
                    const dayName = ['일','월','화','수','목','금','토'][new Date(d).getDay()];
                    
                    let dutyColor = 'bg-white text-gray-400 border-gray-200';
                    if (duty === 'DAY') dutyColor = 'bg-blue-50 text-blue-600 border-blue-200';
                    else if (duty === 'EVE') dutyColor = 'bg-orange-50 text-orange-600 border-orange-200';
                    else if (duty === 'OFF') dutyColor = 'bg-pink-50 text-pink-600 border-pink-200';

                    return (
                      <div key={d} id={isToday ? 'duty-today' : undefined} 
                           onClick={() => { setSelectedDutyEditDate(d); setIsDutyEditing(false); setIsDutyEditModalOpen(true); }}
                           className={`flex-none w-[64px] p-2.5 rounded-[1.2rem] border shadow-sm flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 relative ${isToday ? 'ring-2 ring-emerald-400 ring-offset-1 bg-emerald-50 text-emerald-700 border-emerald-200' : dutyColor}`}>
                        {isToday && <div className="text-[10px] font-black text-emerald-500 mb-0.5 absolute -top-5 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm whitespace-nowrap z-10">TODAY</div>}
                        <div className="text-[10px] font-bold mb-1 mt-1">{parseInt(d.slice(5,7))}/{parseInt(d.slice(8,10))}</div>
                        <div className="text-xs font-black">{dayName}</div>
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
                    <div key={e.id} className="bg-white/20 p-2.5 rounded-xl flex items-center gap-2 backdrop-blur-sm">
                      <div className="bg-white text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black shrink-0 text-center shadow-sm">
                        <div>{parseInt((e.date||'').slice(5,7))}/{parseInt((e.date||'').slice(8,10))}</div>
                        <div>{['일','월','화','수','목','금','토'][new Date(e.date||todayStr).getDay()]}</div>
                      </div>
                      <div className="font-bold text-base truncate">{e.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><CalendarDays size={16} className="text-emerald-500"/> 가족 일정 타임라인</h3>
              </div>
              
              <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {familyEventsList.length === 0 && (
                  <div className="text-center text-gray-400 py-10 font-bold text-sm">등록된 일정이 없습니다.</div>
                )}
                {familyEventsList.map((e, i, arr) => {
                  const isFirstOfMonth = i === 0 || e.date?.slice(0,7) !== arr[i-1].date?.slice(0,7);
                  return (
                    <div key={e.id}>
                      {isFirstOfMonth && (
                        <div className="relative flex items-center justify-center py-4">
                          <div className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full z-10 border border-gray-200 shadow-sm">
                            {e.date.slice(0,4)}년 {parseInt(e.date.slice(5,7))}월
                          </div>
                        </div>
                      )}
                      <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group py-2 ${e.date < todayStr ? 'opacity-60 grayscale-[50%]' : ''}`}>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-50 shadow shrink-0 z-10">
                          {getEventIcon(e.type)}
                        </div>
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3.5 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm ml-3">
                          <div className="flex justify-between items-start mb-1.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-black text-emerald-600">{parseInt(e.date.slice(5,7))}/{parseInt(e.date.slice(8,10))} ({['일','월','화','수','목','금','토'][new Date(e.date).getDay()]})</span>
                              <span className="text-[9px] bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-bold shadow-sm inline-block w-max">{e.type}</span>
                            </div>
                            <div className="flex justify-end gap-1">
                              <button onClick={() => {
                                setEventFormData({ date: e.date, title: e.title, type: e.type, isImportant: e.isImportant || false });
                                setEditingEventId(e.id);
                                setIsEventModalOpen(true);
                              }} className="text-gray-400 hover:text-blue-500 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm active:scale-95"><Edit3 size={12}/></button>
                              <button onClick={() => deleteEvent(e.id)} className="text-gray-400 hover:text-red-500 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm active:scale-95"><Trash2 size={12}/></button>
                            </div>
                          </div>
                          <div className="font-bold text-gray-800 text-base flex items-center gap-1.5 mt-1.5">
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

      {activeTab === 'ledger' && <button onClick={() => { setEditingLedgerId(null); setFormData({ date: todayStr, type: '지출', amount: '', category: getSortedCategories('지출')[0]||'식비', note: '', subNote: '' }); setIsModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-pink-500 text-white w-14 h-14 rounded-[1.5rem] shadow-xl shadow-pink-300 flex items-center justify-center active:scale-90 transition-all z-40 border border-pink-400"><Plus size={28}/></button>}
      {activeTab === 'delivery' && <button onClick={() => { setEditingDeliveryId(null); setDeliveryFormData({ date: todayStr, earner: '정훈', platform: '배민', amount: '', count: '', amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '', startTime: '', endTime: '' }); setIsDeliveryModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-blue-600 text-white w-14 h-14 rounded-[1.5rem] shadow-xl shadow-blue-300 flex items-center justify-center active:scale-90 transition-all z-40 border border-blue-500"><Plus size={28}/></button>}
      {activeTab === 'calendar' && <button onClick={() => { setEventFormData({ date: todayStr, title: '', type: '가족일정', isImportant: false }); setEditingEventId(null); setIsEventModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-emerald-500 text-white w-14 h-14 rounded-[1.5rem] shadow-xl shadow-emerald-300 flex items-center justify-center active:scale-90 transition-all z-40 border border-emerald-400"><Plus size={28}/></button>}

      {/* 💡 가계부 달력 일일 상세 프리뷰 (캘린더 데이 모달) */}
      {selectedCalendarDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70] overflow-y-auto no-scrollbar">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-5 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 mt-20 flex flex-col max-h-[90vh]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 shrink-0"></div>
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <CalendarDays className="text-pink-500" size={24}/>
                {parseInt(selectedCalendarDate.slice(5,7))}월 {parseInt(selectedCalendarDate.slice(8,10))}일 내역
              </h2>
              <button onClick={() => setSelectedCalendarDate(null)} className="bg-gray-100 text-gray-500 p-2.5 rounded-2xl active:scale-95"><X size={20}/></button>
            </div>
            <div className="space-y-3 overflow-y-auto no-scrollbar flex-1 pb-4">
              {(groupedLedger[selectedCalendarDate]||[]).length === 0 && <div className="text-center py-10 text-gray-400 font-bold">이 날의 내역이 없습니다.</div>}
              {(groupedLedger[selectedCalendarDate]||[]).map(t => (
                <div key={t.id} onClick={() => setSelectedLedgerForDetail(t)} className="bg-gray-50/50 border border-gray-100/50 p-4 rounded-2xl hover:bg-pink-50/50 transition-colors shadow-sm cursor-pointer active:scale-95 flex justify-between items-center">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 shadow-sm ${t.type === '수입' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                      {getCategoryIcon(t.category, t.type)}
                    </div>
                    <div className="truncate pr-2">
                      <div className="text-[10px] font-bold text-gray-500">{t.category}</div>
                      <div className="font-bold text-sm text-gray-800 truncate">{t.note || t.category}</div>
                    </div>
                  </div>
                  <div className={`font-black text-base tracking-tight flex-shrink-0 ${t.type === '수입' ? 'text-blue-500' : 'text-gray-900'}`}>
                    {t.type === '수입' ? '+' : '-'}{formatLargeMoney(t.amount)}원
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 💡 가계부 1화면 상세 뷰 (디지털 영수증) 모달 */}
      {selectedLedgerForDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[80] overflow-y-auto no-scrollbar">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300 mt-20 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div className={`p-3.5 rounded-2xl shadow-sm ${selectedLedgerForDetail.type === '수입' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                 {getCategoryIcon(selectedLedgerForDetail.category, selectedLedgerForDetail.type)}
              </div>
              <button onClick={() => setSelectedLedgerForDetail(null)} className="bg-gray-100 text-gray-500 p-2.5 rounded-full active:scale-95"><X size={20}/></button>
            </div>

            <div className="text-center mb-8 shrink-0">
              <div className="text-[12px] font-bold text-gray-400 mb-1">{selectedLedgerForDetail.category}</div>
              <div className="text-4xl font-black text-gray-900 tracking-tighter mb-2">{formatLargeMoney(selectedLedgerForDetail.amount)}<span className="text-xl ml-1">원</span></div>
              <div className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[11px] font-bold">
                {selectedLedgerForDetail.date.replace(/-/g, '.')}
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 pb-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                <div className="text-[10px] font-bold text-gray-400 mb-1">상세 내용</div>
                <div className="text-base font-black text-gray-800">{selectedLedgerForDetail.note || selectedLedgerForDetail.category}</div>
              </div>

              {selectedLedgerForDetail.subNote && (
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 shadow-inner">
                  <div className="text-[10px] font-bold text-amber-600/70 mb-2">세부 내역 기록</div>
                  <div className="text-[13px] font-bold text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {selectedLedgerForDetail.subNote}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2 shrink-0">
              <button onClick={handleEditFromDetail} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-[1.5rem] font-black text-lg active:scale-95 transition-transform flex justify-center items-center gap-2">
                 <Edit3 size={18}/> 수정
              </button>
              <button onClick={() => {
                 if(window.confirm('이 가계부 내역을 정말 삭제하시겠습니까?')){
                   deleteTransaction(selectedLedgerForDetail.id);
                   setSelectedLedgerForDetail(null);
                 }
              }} className="flex-1 bg-rose-50 text-rose-500 py-4 rounded-[1.5rem] font-black text-lg active:scale-95 transition-transform flex justify-center items-center gap-2 border border-rose-100">
                 <Trash2 size={18}/> 삭제
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl max-w-sm w-full border border-gray-200 text-left">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-full flex items-center justify-center shrink-0">
                <RefreshCw size={20} className="opacity-80" />
              </div>
              <h2 className="text-lg font-black text-gray-900">오류가 발생했습니다</h2>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-4 mb-6 overflow-auto max-h-60 text-[10px] text-green-400 font-mono">
              <p className="font-bold text-red-400 mb-2">{this.state.error && this.state.error.toString()}</p>
              <pre className="whitespace-pre-wrap">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 leading-relaxed font-bold text-center">
              위의 검은색 화면을 캡처해서 전달해주세요!
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-black active:scale-95 transition-transform shadow-md"
            >
              새로고침 (홈으로 복구하기)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
