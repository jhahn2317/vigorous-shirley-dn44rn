import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Calendar as CalendarIcon, PieChart, List, 
  ChevronLeft, ChevronRight, X, ArrowDownCircle, ArrowUpCircle, 
  Bike, Landmark, Wallet, CheckCircle2, 
  Trash2, Settings, Clock, Search, ChevronDown, ChevronUp, CalendarCheck, Coins, Filter, RefreshCw, ArrowDownUp, Timer, Target, Edit3, CalendarDays, Play, Square, Smartphone, Heart,
  Utensils, Home, Car, Shield, User, CreditCard, PiggyBank, GraduationCap, Gift, Plane, FileText, Film, Scissors, ShoppingBag, Tv, Package, Briefcase, Star, Stethoscope, Coffee, MessageSquareHeart, History, Info
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// --- 💡 앱 버전 및 업데이트 시간 (버전 확인용) ---
const APP_VERSION = "v5.7 (업데이트: 2026.04.30 12:00 PM)";

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

const appId = typeof __app_id !== 'undefined' ? __app_id : 'hyuna-asset-pro';

const DEFAULT_CATEGORIES = {
  지출: ['식비', '주거/통신', '교통/차량', '보험', '오빠생활비', '대출상환', '카드대금', '저축', '교육', '경조사', '여행경비', '세금', '문화생활', '미용', '쇼핑', '가전', '생필품', '교회', '기타'],
  수입: ['월급', '배달비', '월세', '용돈', '기타수입']
};

const getKSTDateStr = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (9 * 3600000));
  return kstTime.toISOString().slice(0, 10);
};

// 💡 배달 정산 (수-화 주기 -> 다음주 금요일) 로직 완벽 복구!
const getPaydayStr = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return '';
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10)-1, parseInt(parts[2], 10));
  if (isNaN(d.getTime())) return ''; 
  const day = d.getDay(); 
  // 일:0, 월:1, 화:2, 수:3, 목:4, 금:5, 토:6
  // 수(3)->+9(다음주 금), 목(4)->+8(다음주 금), 금(5)->+7(다음주 금), 토(6)->+6(다음주 금)
  // 일(0)->+5(이번주 금), 월(1)->+4(이번주 금), 화(2)->+3(이번주 금)
  const daysToAdd = [5, 4, 3, 9, 8, 7, 6][day];
  d.setDate(d.getDate() + daysToAdd);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

function AppContent() {
  const [user, setUser] = useState(null);
  const todayStr = getKSTDateStr(); 
  
  // 💡 기기 사용자명 등록 (로그 실명제용)
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('hyunaUserName') || '가족');
  
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('hyunaDefaultTab') || 'calendar'); 
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

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
    if (direction === 'up' && index > 0) [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    else if (direction === 'down' && index < newOrder.length - 1) [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setTabOrder(newOrder);
    localStorage.setItem('hyunaTabOrder', JSON.stringify(newOrder));
    showToast("하단 메뉴 순서가 변경되었습니다.");
  };
  
  // 💡 하드코딩된 더미 데이터 영구 삭제 -> 순수 빈 배열로 시작 (파이어베이스가 자동으로 채워줌!)
  const [ledger, setLedger] = useState([]);
  const [assets, setAssets] = useState({ loans: [], stocks: [] }); 
  const [dailyDeliveries, setDailyDeliveries] = useState([]);
  const [events, setEvents] = useState([]); 
  const [messages, setMessages] = useState([]); 
  const [logs, setLogs] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [userSettings, setUserSettings] = useState({ deliveryGoals: {} });
  const [exchangeRate, setExchangeRate] = useState(1380);
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const [selectedYear, setSelectedYear] = useState(parseInt(todayStr.slice(0,4)));
  const [selectedMonth, setSelectedMonth] = useState(parseInt(todayStr.slice(5,7))); 
  const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const [timerActive, setTimerActive] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false); 
  const [isDutyBatchModalOpen, setIsDutyBatchModalOpen] = useState(false);
  const [isDutyBatchEditMode, setIsDutyBatchEditMode] = useState(false);
  
  // 💡 근무표 단건 수정 팝업 상태
  const [singleDutyModal, setSingleDutyModal] = useState({ isOpen: false, date: '', duty: '', eventId: null });

  const [isMessageHistoryOpen, setIsMessageHistoryOpen] = useState(false); 
  const [isManageMode, setIsManageMode] = useState(false); 
  
  const [editingDeliveryId, setEditingDeliveryId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null); 

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

  const [formData, setFormData] = useState({ date: todayStr, type: '지출', amount: '', category: '식비', note: '' });
  const [eventFormData, setEventFormData] = useState({ date: todayStr, title: '', type: '가족일정', isImportant: false });
  const [messageFormData, setMessageFormData] = useState({ author: currentUser !== '가족' ? currentUser : '현아', text: '' });
  const [deliveryFormData, setDeliveryFormData] = useState({ 
    date: todayStr, earner: currentUser === '정훈' ? '정훈' : '현아', platform: '배민', amount: '', count: '', 
    startTime: '', endTime: '' 
  });

  const [dutyBatchYear, setDutyBatchYear] = useState(selectedYear);
  const [dutyBatchMonth, setDutyBatchMonth] = useState(selectedMonth);
  const [batchDuties, setBatchDuties] = useState({});
  const [selectedStamp, setSelectedStamp] = useState('DAY');

  const [ledgerSubTab, setLedgerSubTab] = useState('daily'); 
  const [deliverySubTab, setDeliverySubTab] = useState('daily'); 
  const [loanSortBy, setLoanSortBy] = useState(() => localStorage.getItem('hyunaLoanSortBy') || 'date'); 

  const scrollRefLedger = useRef(null);
  const scrollRefDelivery = useRef(null);
  const dutyTimelineRef = useRef(null); 

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 2500);
  };

  useEffect(() => {
    if (!isFirebaseEnabled) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
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
      setAssets({ loans: data.filter(d => d.assetType === 'loan'), stocks: data.filter(d => d.assetType === 'stock') });
    });
    const unsubEvents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'events'), (s) => setEvents(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubMessages = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), (s) => setMessages(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubLogs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), (s) => setLogs(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'categories'), (docSnap) => { if(docSnap.exists()) setCategories(docSnap.data()); });
    const unsubPrefs = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'preferences'), (docSnap) => { if(docSnap.exists()) setUserSettings(docSnap.data()); });
    const unsubTimer = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'deliveryTimer'), (docSnap) => {
      if(docSnap.exists()) {
        const data = docSnap.data();
        setTimerActive(data.timerActive || false);
        setTrackingStartTime(data.trackingStartTime || null);
      }
    });

    return () => { unsubLedger(); unsubDelivery(); unsubAssets(); unsubEvents(); unsubMessages(); unsubLogs(); unsubSettings(); unsubPrefs(); unsubTimer(); };
  }, [user]);

  // 💡 로그 기록시 이름 포함
  const logEvent = async (action, description) => {
    if (!isFirebaseEnabled || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), {
        timestamp: serverTimestamp(),
        userId: user.uid,
        action,
        description: currentUser !== '가족' ? `[${currentUser}] ${description}` : description
      });
    } catch (e) { console.error("로그 실패", e); }
  };

  useEffect(() => {
    try {
      const targetRef = activeTab === 'ledger' ? scrollRefLedger : scrollRefDelivery;
      if (targetRef && targetRef.current && targetRef.current.children) {
        const button = targetRef.current.children[selectedMonth - 1];
        if (button && button.scrollIntoView) button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    } catch (error) {}
  }, [selectedMonth, activeTab]);

  useEffect(() => {
    if (activeTab === 'calendar' && dutyTimelineRef.current) {
      setTimeout(() => {
        const todayEl = document.getElementById('duty-today');
        if (todayEl) todayEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }, 100);
    }
  }, [activeTab]);

  useEffect(() => {
    let interval;
    if (timerActive && trackingStartTime) {
      interval = setInterval(() => setElapsedSeconds(Math.floor((new Date() - new Date(trackingStartTime)) / 1000)), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, trackingStartTime]);

  const formatMoney = (v) => {
    if (v === '' || v === undefined || v === null) return '0';
    const num = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : v;
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // 💡 기호 오류 완전 해결 (+, - 부호를 함수 자체에서 반환하지 않고 숫자로만 반환)
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

  const formatTimeStr = (dateObj) => {
    return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
  };

  const calcDailyMetrics = (deliveries) => {
    if (!deliveries || deliveries.length === 0) return { durationStr: '', hourlyRate: 0, perDelivery: 0, totalCnt: 0, totalAmt: 0 };
    let intervals = [];
    deliveries.forEach(d => {
      if(d.startTime && d.endTime) {
        let [sh, sm] = d.startTime.split(':').map(Number);
        let [eh, em] = d.endTime.split(':').map(Number);
        let start = sh * 60 + sm;
        let end = eh * 60 + em;
        if (end <= start) end += 1440; 
        intervals.push({start, end});
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
    let durationStr = totalMins > 0 ? `${Math.floor(totalMins/60)}시간 ${totalMins%60}분` : '';
    return { durationStr, hourlyRate: totalMins > 0 ? Math.round(totalAmt / (totalMins / 60)) : 0, perDelivery: totalCnt > 0 ? Math.round(totalAmt / totalCnt) : 0, totalCnt, totalAmt };
  };

  const getMonthlyPayment = (loan) => {
    if (loan.status === '완납') return 0;
    if (loan.paymentMethod === '원리금') return loan.customMonthly || 0;
    return Math.floor((loan.principal * ((parseFloat(loan.rate) || 0) / 100)) / 12);
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
      case '교회': return <Heart size={18} />;
      case '월급': return <Briefcase size={18} />;
      case '배달비': return <Bike size={18} />;
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

  // --- 데이터 연산 ---
  const yearlyIncome = useMemo(() => (ledger || []).filter(t => t?.type === '수입' && t.date?.startsWith(String(selectedYear))).reduce((acc, curr) => acc + (curr.amount||0), 0), [ledger, selectedYear]);
  const deliveryYearlyTotal = useMemo(() => (dailyDeliveries || []).filter(d => d.date?.startsWith(String(selectedYear))).reduce((a,b) => a + (b.amount||0), 0), [dailyDeliveries, selectedYear]);

  const filteredLedger = useMemo(() => {
    let data = ledger || [];
    if (ledgerDateRange.start || ledgerDateRange.end) {
      if (ledgerDateRange.start) data = data.filter(t => t.date >= ledgerDateRange.start);
      if (ledgerDateRange.end) data = data.filter(t => t.date <= ledgerDateRange.end);
    } else data = data.filter(t => t.date?.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`));
    if (filterType !== 'all') data = data.filter(t => t.type === filterType);
    if (filterCategory !== 'all') data = data.filter(t => t.category === filterCategory);
    if (searchQuery.trim()) data = data.filter(t => t.note?.toLowerCase().includes(searchQuery.toLowerCase()) || t.category?.toLowerCase().includes(searchQuery.toLowerCase()));
    return data;
  }, [ledger, selectedYear, selectedMonth, filterType, filterCategory, searchQuery, ledgerDateRange]);

  const ledgerSummary = useMemo(() => {
    const inc = filteredLedger.filter(t => t.type === '수입').reduce((a, b) => a + (b.amount||0), 0);
    const exp = filteredLedger.filter(t => t.type === '지출').reduce((a, b) => a + (b.amount||0), 0);
    return { income: inc, expense: exp, net: inc - exp };
  }, [filteredLedger]);

  const groupedLedger = useMemo(() => filteredLedger.reduce((acc, curr) => { if (!acc[curr.date]) acc[curr.date] = []; acc[curr.date].push(curr); return acc; }, {}), [filteredLedger]);
  const ledgerDates = Object.keys(groupedLedger).sort((a, b) => new Date(b) - new Date(a));

  const filteredDailyDeliveries = useMemo(() => {
    let data = dailyDeliveries || [];
    if (deliveryDateRange.start || deliveryDateRange.end) {
      if (deliveryDateRange.start) data = data.filter(d => d.date >= deliveryDateRange.start);
      if (deliveryDateRange.end) data = data.filter(d => d.date <= deliveryDateRange.end);
    } else data = data.filter(d => d.date?.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`));
    return data;
  }, [dailyDeliveries, selectedYear, selectedMonth, deliveryDateRange]);

  const paydayGroups = useMemo(() => {
    const groups = {};
    (dailyDeliveries || []).forEach(d => {
      const pdStr = getPaydayStr(d.date);
      if (!pdStr) return;
      if (!groups[pdStr]) groups[pdStr] = { total: 0, hyuna: 0, junghoon: 0 };
      groups[pdStr].total += (d.amount||0);
      if (d.earner === '현아') groups[pdStr].hyuna += (d.amount||0);
      else groups[pdStr].junghoon += (d.amount||0);
    });
    return groups;
  }, [dailyDeliveries]);

  const pastPaydays = Object.keys(paydayGroups).sort((a,b) => b.localeCompare(a)).filter(p => p && p < todayStr); 
  
  const globalPending = (dailyDeliveries || []).filter(d => typeof d?.date === 'string' && d.date && getPaydayStr(d.date) >= todayStr);
  const globalExpectedTotal = globalPending.reduce((a,b) => a + (b.amount||0), 0);
  
  let closestGlobalPaydayStr = '';
  if (globalPending.length > 0) {
     const paydays = globalPending.map(d => getPaydayStr(d.date));
     closestGlobalPaydayStr = paydays.sort()[0];
  }
  const paydayDisplay = (closestGlobalPaydayStr && closestGlobalPaydayStr.length >= 10) ? `${parseInt(closestGlobalPaydayStr.slice(5,7))}월 ${parseInt(closestGlobalPaydayStr.slice(8,10))}일` : '예정 없음';

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
      return (parseFloat(b.rate)||0) - (parseFloat(a.rate)||0);
    });
    return [...active, ...completed]; 
  }, [assets?.loans, loanSortBy]);

  const totalPrincipal = (assets?.loans || []).filter(l=>l.status!=='완납').reduce((a,b)=>a+(b.principal||0), 0);
  const totalMonthlyPayment = (assets?.loans || []).filter(l=>l.status!=='완납').reduce((a,b)=>a+getMonthlyPayment(b), 0);

  const extendedDutyDays = useMemo(() => Array.from({length: 34}, (_, i) => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (9 * 3600000));
    kst.setDate(kst.getDate() + (i - 3)); 
    return kst.toISOString().slice(0, 10);
  }), []);

  const activeMessages = useMemo(() => messages.filter(m => !m.isChecked).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [messages]);

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeliveryModalOpen(false);
    setIsEventModalOpen(false);
    setIsDutyBatchModalOpen(false);
    setIsPrepayModalOpen(false);
    setIsMessageHistoryOpen(false);
    setSingleDutyModal({ isOpen: false, date: '', duty: '', eventId: null });
  };

  // --- 핸들러 ---
  const handleStartDelivery = async () => {
    const nowStr = new Date().toISOString();
    setTrackingStartTime(nowStr); setTimerActive(true); setElapsedSeconds(0);
    if (isFirebaseEnabled && user) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'deliveryTimer'), { timerActive: true, trackingStartTime: nowStr });
      logEvent('배달 시작', '실시간 배달 기록을 시작했습니다.');
    }
    showToast("배달 근무를 시작합니다! 안전운전 🛵");
  };

  const handleEndDelivery = async () => {
    const end = new Date();
    const startObj = new Date(trackingStartTime);
    const sTime = `${String(startObj.getHours()).padStart(2, '0')}:${String(startObj.getMinutes()).padStart(2, '0')}`;
    const eTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    
    setDeliveryFormData({ ...deliveryFormData, date: getKSTDateStr(), startTime: sTime, endTime: eTime, amount: '', count: '' });
    setTimerActive(false); setTrackingStartTime(null); setEditingDeliveryId(null); setIsDeliveryModalOpen(true);
    if (isFirebaseEnabled && user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'deliveryTimer'), { timerActive: false, trackingStartTime: null });
    showToast("배달을 종료했습니다. 수익을 기록하세요.");
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !user) return;
    let cat = isCustomCategory ? customCategoryInput.trim() : formData.category;
    const newTx = { ...formData, category: cat, amount: parseInt(String(formData.amount).replace(/,/g, ''), 10) };
    if (isFirebaseEnabled) {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ledger'), newTx);
      logEvent('가계부 추가', `${newTx.date} [${newTx.type}] ${newTx.category} ${formatMoney(newTx.amount)}원`);
    }
    showToast("기록되었습니다."); setIsModalOpen(false);
  };

  const deleteTransaction = async (id) => {
    const target = ledger.find(t => t.id === id);
    if(!window.confirm(`이 ${target?.category} 내역을 정말 삭제하시겠습니까?`)) return;
    if (isFirebaseEnabled) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ledger', id));
      logEvent('가계부 삭제', `${target?.category} ${formatMoney(target?.amount)}원 삭제`);
    }
    showToast("삭제되었습니다.", "error");
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventFormData.title.trim() || !user) return;
    if (isFirebaseEnabled) {
      if (editingEventId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEventId), eventFormData);
        logEvent('일정 수정', `${eventFormData.title} 일정 수정`);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), eventFormData);
        logEvent('일정 추가', `${eventFormData.title} 일정 추가`);
      }
    }
    showToast("일정이 저장되었습니다."); closeModals();
  };

  const deleteEvent = async (id) => {
    const target = events.find(e => e.id === id);
    if(!window.confirm(`'${target?.title}' 일정을 삭제하시겠습니까?`)) return;
    if (isFirebaseEnabled) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id));
      logEvent('일정 삭제', `${target?.title} 일정 삭제`);
    }
    showToast("삭제되었습니다.", "error");
  };

  // 💡 근무표 단건 수정 저장 로직
  const handleSingleDutySave = async (stamp) => {
    if (!user) return;
    const { date, eventId, duty: oldDuty } = singleDutyModal;
    if (isFirebaseEnabled) {
      if (stamp === '삭제' || stamp === 'OFF') {
        if (eventId) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId));
      } else {
        if (eventId) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId), { title: stamp });
        else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { type: '듀티', title: stamp, date: date, isImportant: false });
      }
      logEvent('근무 변경', `${date.slice(5)} 근무를 [${oldDuty} ➔ ${stamp === '삭제' ? 'OFF' : stamp}]로 변경했습니다.`);
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), { author: '시스템', text: `${date.slice(5)} 근무가 [${stamp === '삭제' ? 'OFF' : stamp}]로 변경되었습니다 🏥`, createdAt: todayStr, isChecked: false });
    }
    showToast(`${date.slice(5)} 스케쥴이 수정되었습니다.`);
    setSingleDutyModal({ isOpen: false, date: '', duty: '', eventId: null });
  };

  const handleDutyCellClick = (dateStr) => {
    if (!isDutyBatchEditMode) return; 
    setBatchDuties(prev => {
      const next = {...prev};
      if (selectedStamp === 'DELETE') delete next[dateStr];
      else next[dateStr] = selectedStamp;
      return next;
    });
  };

  const saveBatchDuties = async () => {
    if(!user) return;
    const monthPrefix = `${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}`;
    const eventsToDelete = events.filter(e => e.type === '듀티' && e.date?.startsWith(monthPrefix));
    if (isFirebaseEnabled) {
      for (const e of eventsToDelete) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', e.id));
      for (const [date, title] of Object.entries(batchDuties)) {
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { type: '듀티', title, date, isImportant: false });
      }
      logEvent('근무표 업데이트', `${dutyBatchMonth}월 근무표를 통째로 업데이트했습니다.`);
    }
    showToast("근무표가 한 달 치 저장되었습니다."); setIsDutyBatchModalOpen(false);
  };

  const handleSendMessage = async () => {
    if(!messageFormData.text.trim() || !user) return;
    const newMsg = { ...messageFormData, createdAt: todayStr, isChecked: false };
    if (isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), newMsg);
    setMessageFormData({...messageFormData, text: ''}); showToast("메시지 전송 완료!");
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 select-none pb-32 transition-colors duration-500 bg-gray-50/80">
      
      {/* 토스트 알림 */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border ${toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-indigo-100 text-indigo-600'}`}>
             <Info size={16}/> <span className="text-sm font-black whitespace-nowrap">{toast.message}</span>
          </div>
        </div>
      )}

      <header className="bg-white/90 backdrop-blur-md pt-12 pb-4 px-6 sticky top-0 z-30 flex justify-between items-center border-b border-gray-100 shadow-sm">
        <div>
          <span className="text-[10px] font-black text-indigo-500 tracking-widest uppercase block mb-0.5">Family Pro</span>
          <h1 className="text-xl font-black tracking-tight">현아에셋 PRO</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-full px-3 py-1.5 text-sm font-black shadow-inner">
            <button onClick={() => setSelectedYear(selectedYear - 1)} className="p-1"><ChevronLeft size={16}/></button>
            <span className="mx-2">{selectedYear}</span>
            <button onClick={() => setSelectedYear(selectedYear + 1)} className="p-1"><ChevronRight size={16}/></button>
          </div>
          <button onClick={() => setIsManageMode(!isManageMode)} className={`p-2.5 rounded-full transition-all ${isManageMode ? 'bg-indigo-600 text-white shadow-lg rotate-90' : 'bg-gray-100 text-gray-400'}`}><Settings size={20}/></button>
        </div>
      </header>

      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 py-2">
        <div ref={scrollRefLedger} className="flex overflow-x-auto no-scrollbar gap-2 px-5 scroll-smooth">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)} className={`flex-none px-5 py-2 rounded-[1.2rem] font-black text-sm transition-all ${selectedMonth === m ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}>{m}월</button>
          ))}
        </div>
      </div>

      {isManageMode && (
        <div className="px-5 my-4 space-y-4 animate-in fade-in">
           {/* 💡 사용자 기기 닉네임 설정 */}
           <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md">
             <h3 className="text-sm font-black mb-3 flex items-center gap-1.5"><Smartphone size={16} className="text-indigo-500"/> 이 기기 사용자 설정</h3>
             <div className="flex items-center gap-3">
                <select value={currentUser} onChange={(e) => { setCurrentUser(e.target.value); localStorage.setItem('hyunaUserName', e.target.value); showToast('사용자가 변경되었습니다.'); }} className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold text-gray-700 outline-none border border-gray-100">
                  <option value="가족">선택안함 (기본)</option>
                  <option value="현아">현아 👩</option>
                  <option value="정훈">정훈 🧑</option>
                </select>
             </div>
             <p className="text-[10px] text-gray-400 mt-2 font-bold">* 설정해두면 로그 기록이나 메시지를 남길 때 이름이 자동으로 들어갑니다.</p>
           </div>

           {/* 💡 활동 로그 */}
           <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md">
             <h3 className="text-sm font-black mb-3 flex items-center gap-1.5"><History size={16} className="text-indigo-500"/> 최근 활동 로그</h3>
             <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-40 overflow-y-auto no-scrollbar space-y-2">
                {logs.length === 0 && <div className="text-[10px] text-gray-400 font-bold text-center py-4">활동 내역 없음</div>}
                {logs.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 30).map((log) => (
                   <div key={log.id} className="text-[10px] border-b border-gray-200/50 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">{log.action}</span>
                        <span className="text-gray-400 font-bold">{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString('ko-KR', {hour12: false}).slice(0,8) : '방금'}</span>
                      </div>
                      <div className="text-gray-600 font-medium pl-1">{log.description}</div>
                   </div>
                ))}
             </div>
           </div>

           <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md">
             <h3 className="text-sm font-black mb-3 flex items-center gap-1.5"><List size={16} className="text-indigo-500"/> 메뉴 순서 변경</h3>
             <div className="space-y-2">
               {tabOrder.map((tabId, index) => (
                 <div key={tabId} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                   <span className="text-xs font-bold text-gray-700 flex items-center gap-2"><span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm text-[10px]">{index + 1}</span>{tabConfig[tabId].label}</span>
                   <div className="flex gap-1">
                     <button onClick={() => moveTab(index, 'up')} disabled={index === 0} className="p-1.5 bg-white rounded-lg shadow-sm disabled:opacity-30"><ChevronUp size={14}/></button>
                     <button onClick={() => moveTab(index, 'down')} disabled={index === tabOrder.length - 1} className="p-1.5 bg-white rounded-lg shadow-sm disabled:opacity-30"><ChevronDown size={14}/></button>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* 💡 앱 버전 표시 */}
           <div className="text-[10px] text-gray-400 text-center font-bold tracking-widest mt-6 opacity-70">
              {APP_VERSION}
           </div>
        </div>
      )}

      <main className="px-5 max-w-md mx-auto pt-4">
        {activeTab === 'calendar' && (
          <div className="space-y-5 animate-in fade-in duration-500">
            <div className="bg-pink-50/80 rounded-3xl p-5 border border-pink-200/60 shadow-sm relative">
               <h3 className="text-xs font-black text-pink-500 mb-3 flex justify-between items-center"><span className="flex items-center gap-1"><MessageSquareHeart size={14}/> 부부 한줄 톡 💌</span><button onClick={() => setIsMessageHistoryOpen(true)} className="text-gray-400 font-bold border-b border-gray-300 pb-0.5 active:text-pink-500">과거 내역</button></h3>
               <div className="space-y-2 mb-3">
                  {activeMessages.length === 0 && <div className="text-center text-gray-400 font-bold text-[10px] py-4 bg-white/50 rounded-2xl">메시지가 없습니다.</div>}
                  {activeMessages.map(m => (
                     <div key={m.id} className="bg-white p-3 rounded-2xl flex justify-between items-center shadow-sm border border-pink-100/50">
                        <div><div className="text-[9px] text-gray-400 font-bold mb-0.5"><span className="bg-pink-100 text-pink-600 px-1.5 rounded mr-1">{m.author}</span>{m.createdAt.slice(5).replace('-','/')}</div><div className="text-sm font-black text-gray-800 leading-tight">{m.text}</div></div>
                        <button onClick={async () => { if(isFirebaseEnabled) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', m.id), { isChecked: true }); showToast("확인 완료!"); }} className="bg-gray-50 text-gray-500 border border-gray-200 px-3 py-2 rounded-xl text-[10px] font-black shrink-0 active:scale-90 transition-transform">확인</button>
                     </div>
                  ))}
               </div>
               <div className="flex gap-2 relative pt-4">
                  <div className="absolute top-0 left-1 flex gap-1.5">
                    <button onClick={() => setMessageFormData({...messageFormData, author: '현아'})} className={`text-[9px] font-black px-2 py-0.5 rounded-t-lg transition-colors ${messageFormData.author==='현아' ? 'bg-white text-pink-500 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]' : 'bg-transparent text-gray-400'}`}>현아</button>
                    <button onClick={() => setMessageFormData({...messageFormData, author: '정훈'})} className={`text-[9px] font-black px-2 py-0.5 rounded-t-lg transition-colors ${messageFormData.author==='정훈' ? 'bg-white text-blue-500 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]' : 'bg-transparent text-gray-400'}`}>정훈</button>
                  </div>
                  <input value={messageFormData.text} onChange={e => setMessageFormData({...messageFormData, text: e.target.value})} placeholder="여보 오늘 저녁은 뭐야? 🍗" className="flex-1 bg-white rounded-2xl px-4 py-3 text-sm font-bold outline-none border border-pink-200 shadow-sm" />
                  <button onClick={handleSendMessage} disabled={!messageFormData.text.trim()} className="bg-pink-500 text-white px-4 rounded-2xl font-black shadow-md border border-pink-600 active:scale-95 disabled:opacity-50">전송</button>
               </div>
            </div>

            <div className="pt-4"> 
              <div className="flex justify-between items-center mb-3 px-2">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><Stethoscope size={16} className="text-pink-500"/> 현아 근무 스케줄</h3>
                <button onClick={() => {
                   setDutyBatchYear(selectedYear); setDutyBatchMonth(selectedMonth);
                   const current = {};
                   events.forEach(e => { if(e.type === '듀티' && e.date?.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2,'0')}`)) current[e.date] = e.title; });
                   setBatchDuties(current); setIsDutyBatchModalOpen(true);
                }} className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full font-bold border border-emerald-200 shadow-sm active:scale-95 transition-transform">한달 스케쥴 통째로 등록</button>
              </div>
              <div className="relative">
                <div ref={dutyTimelineRef} className="flex overflow-x-auto no-scrollbar gap-2 px-1 pb-2 pt-8 scroll-smooth"> 
                  {extendedDutyDays.map((d) => {
                    const dutyEvent = events.find(e => e.date === d && e.type === '듀티');
                    const duty = dutyEvent?.title || 'OFF';
                    const isToday = d === todayStr;
                    let color = 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50';
                    if(duty === 'DAY') color = 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100';
                    else if(duty === 'EVE') color = 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100';
                    else if(duty !== 'OFF') color = 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100';
                    
                    return (
                      // 💡 듀티 박스 클릭 시 단건 수정 모달 열기
                      <button 
                        key={d} 
                        id={isToday ? 'duty-today' : undefined} 
                        onClick={() => setSingleDutyModal({ isOpen: true, date: d, duty: duty, eventId: dutyEvent?.id || null })}
                        className={`flex-none w-[60px] p-2.5 rounded-[1.2rem] border shadow-sm flex flex-col items-center justify-center transition-all relative cursor-pointer active:scale-90 ${isToday ? 'ring-2 ring-emerald-400 bg-emerald-50 text-emerald-700 border-emerald-200' : color}`}
                      >
                        {isToday && <div className="text-[8px] font-black text-emerald-500 absolute -top-5 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm z-10 whitespace-nowrap uppercase">Today</div>}
                        <div className="text-[10px] font-bold mb-1">{d.slice(5).replace('-','/')}</div>
                        <div className="text-xs font-black">{['일','월','화','수','목','금','토'][new Date(d).getDay()]}</div>
                        <div className="mt-2 text-sm font-black tracking-tighter">{duty}</div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-center mt-2 text-[10px] font-bold text-gray-400">날짜 박스를 터치하면 해당 일의 근무만 수정할 수 있습니다.</div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-200">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5 mb-4"><CalendarDays size={16} className="text-emerald-500"/> 가족 일정</h3>
              <div className="space-y-3">
                {events.filter(e => e.type !== '듀티' && e.date >= todayStr.slice(0,8)+'01').sort((a,b)=>a.date.localeCompare(b.date)).map(e => (
                   <div key={e.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <div>
                        <div className="text-[10px] font-black text-emerald-600">{e.date.slice(5).replace('-','/')} ({['일','월','화','수','목','금','토'][new Date(e.date).getDay()]})</div>
                        <div className="font-bold text-sm text-gray-800 flex items-center gap-1">{e.title} {e.isImportant && <Star size={12} className="text-amber-400 fill-amber-400"/>}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEventFormData(e); setEditingEventId(e.id); setIsEventModalOpen(true); }} className="p-2 bg-white rounded-xl text-gray-400 shadow-sm border border-gray-100"><Edit3 size={14}/></button>
                        <button onClick={() => deleteEvent(e.id)} className="p-2 bg-white rounded-xl text-gray-400 shadow-sm border border-gray-100"><Trash2 size={14}/></button>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl flex justify-between items-center">
               <div><div className="text-[11px] font-bold opacity-80 mb-1">올해 누적 총 수입</div><div className="text-3xl font-black">{formatMoney(yearlyIncome)}원</div></div>
               <Wallet className="w-12 h-12 opacity-20" />
            </div>
            
            {/* 💡 요약 폰트 크기 조절 적용 */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 grid grid-cols-3 gap-2">
              <div className="text-center overflow-hidden"><div className="text-[10px] font-bold text-blue-500 mb-1">수입</div><div className="text-[11px] font-black text-gray-800 truncate">{formatMoney(ledgerSummary.income)}</div></div>
              <div className="text-center border-x border-gray-100 overflow-hidden"><div className="text-[10px] font-bold text-red-500 mb-1">지출</div><div className="text-[11px] font-black text-gray-800 truncate">{formatMoney(ledgerSummary.expense)}</div></div>
              <div className="text-center overflow-hidden"><div className="text-[10px] font-bold text-indigo-500 mb-1">남은돈</div><div className="text-[11px] font-black text-indigo-600 truncate">{formatMoney(ledgerSummary.net)}</div></div>
            </div>
            
            <div className="flex bg-gray-100 p-1.5 rounded-2xl"><button onClick={()=>setLedgerSubTab('daily')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${ledgerSubTab==='daily'?'bg-white text-indigo-600 shadow-sm':'text-gray-400'}`}>목록</button><button onClick={()=>setLedgerSubTab('calendar')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-1.5 ${ledgerSubTab==='calendar'?'bg-white text-indigo-600 shadow-sm':'text-gray-400'}`}><CalendarDays size={16}/> 달력</button></div>
            
            {ledgerSubTab === 'calendar' && (
              <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 animate-in slide-in-from-bottom-2">
                <div className="grid grid-cols-7 gap-1 text-center mb-2">{['일','월','화','수','목','금','토'].map((d,i)=><div key={d} className={`text-[10px] font-bold ${i===0?'text-red-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>)}</div>
                <div className="grid grid-cols-7 gap-1.5">
                  {(() => {
                    const first = new Date(selectedYear, selectedMonth - 1, 1).getDay();
                    const days = new Date(selectedYear, selectedMonth, 0).getDate();
                    const arr = Array.from({length: first}, () => null).concat(Array.from({length: days}, (_, i) => i + 1));
                    return arr.map((d, i) => {
                      if(!d) return <div key={i} className="h-[65px] bg-gray-50/30 rounded-xl" />;
                      const ds = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                      const inc = (ledger||[]).filter(t => t.date === ds && t.type === '수입').reduce((a,b)=>a+(b.amount||0),0);
                      const exp = (ledger||[]).filter(t => t.date === ds && t.type === '지출').reduce((a,b)=>a+(b.amount||0),0);
                      return (
                        <div key={i} className={`h-[65px] border rounded-xl p-1 flex flex-col items-center justify-start ${(inc||exp)?'border-indigo-100 bg-indigo-50/20':'border-gray-50 bg-white'}`}>
                          <span className="text-[10px] font-bold mb-0.5">{d}</span>
                          {/* 💡 기호 수정 반영: 중복된 +- 제거 */}
                          {inc > 0 && <span className="text-[8px] font-black text-blue-600 w-full text-center truncate">+{formatCompactMoney(inc)}</span>}
                          {exp > 0 && <span className="text-[8px] font-black text-red-500 w-full text-center truncate">-{formatCompactMoney(exp)}</span>}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
            
            {ledgerSubTab === 'daily' && (
              <div className="space-y-4 animate-in slide-in-from-left">
                {ledgerDates.map(date => (
                  <div key={date} className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-50">
                    <div className="text-xs font-bold text-gray-400 mb-3 ml-2">{date.replace(/-/g, '.')}</div>
                    <div className="space-y-2">{(groupedLedger[date]||[]).map(t => (
                      <div key={t.id} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-2xl">
                        <div className="flex items-center gap-3"><div className={`p-2.5 rounded-xl ${t.type==='수입'?'bg-blue-100 text-blue-600':'bg-red-100 text-red-400'}`}>{getCategoryIcon(t.category, t.type)}</div><div><div className="text-[10px] font-bold text-gray-400">{t.category}</div><div className="font-bold text-sm text-gray-800">{t.note||t.category}</div></div></div>
                        <div className="flex items-center gap-3"><span className={`font-black text-[15px] ${t.type==='수입'?'text-blue-600':'text-gray-900'}`}>{formatMoney(t.amount)}</span>{isManageMode && <button onClick={()=>deleteTransaction(t.id)} className="text-gray-300"><Trash2 size={16}/></button>}</div>
                      </div>
                    ))}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="space-y-6 pb-28 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-orange-100">
               <div className="flex justify-between items-center mb-4"><div><h2 className="text-lg font-black text-gray-800">실시간 배달 기록</h2><p className="text-xs text-gray-400 font-bold">터치하여 시급을 자동 계산하세요.</p></div>{timerActive && <span className="text-orange-500 animate-pulse font-black text-sm">배달중</span>}</div>
               <div className="flex gap-4">{timerActive ? <button onClick={handleEndDelivery} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl"><Square size={18} fill="white"/> {Math.floor(elapsedSeconds/3600)}:{String(Math.floor((elapsedSeconds%3600)/60)).padStart(2,'0')} 종료</button> : <button onClick={handleStartDelivery} className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg"><Play size={18} fill="white"/> 배달 시작</button>}</div>
            </div>
            
            <div className="bg-white rounded-[2rem] p-6 shadow-md border-2 border-orange-100 flex flex-col relative overflow-hidden mt-2">
              <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 px-4 py-1.5 rounded-bl-2xl font-black text-xs flex items-center"><Clock className="w-3 h-3 mr-1"/> 곧 입금!</div>
              <h3 className="text-xs font-bold text-gray-400 mb-1"><span className="text-orange-500">{paydayDisplay}</span> 입금 예정</h3>
              <div className="text-gray-800 font-black text-xl mb-3">다음 정산 예정금</div>
              <div className="text-3xl font-black text-orange-500 mb-1">{formatMoney(globalExpectedTotal)}원</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
              <h2 className="text-sm font-bold mb-1 opacity-90">{selectedYear}년 누적 배달 수익</h2>
              <div className="text-4xl font-black mb-4">{formatMoney(deliveryYearlyTotal)}원</div>
              <div className="grid grid-cols-2 gap-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div><div className="text-[10px] font-bold mb-1 opacity-80">현아</div><div className="text-xl font-black">{formatMoney(dailyDeliveries.filter(d=>d.earner==='현아' && d.date?.startsWith(String(selectedYear))).reduce((a,b)=>a+(b.amount||0),0))}</div></div>
                <div className="border-l border-white/20 pl-4"><div className="text-[10px] font-bold mb-1 opacity-80">정훈</div><div className="text-xl font-black">{formatMoney(dailyDeliveries.filter(d=>d.earner==='정훈' && d.date?.startsWith(String(selectedYear))).reduce((a,b)=>a+(b.amount||0),0))}</div></div>
              </div>
            </div>
            <div className="flex bg-gray-100 p-1.5 rounded-2xl"><button onClick={()=>setDeliverySubTab('daily')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${deliverySubTab==='daily'?'bg-white text-orange-500 shadow-sm':'text-gray-400'}`}>내역</button><button onClick={()=>setDeliverySubTab('weekly')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${deliverySubTab==='weekly'?'bg-white text-gray-900 shadow-sm':'text-gray-400'}`}>정산</button></div>
            <div className="space-y-4">
              {deliverySubTab === 'daily' && dailyDates.map(date => (
                <div key={date} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center border-b pb-3 mb-3"><span className="font-black text-gray-800 flex items-center gap-1.5 text-sm"><CalendarCheck size={16} className="text-orange-500"/>{date}</span><span className="text-xl font-black text-orange-500">{formatMoney((groupedDaily[date]||[]).reduce((a,b)=>a+(b.amount||0),0))}원</span></div>
                  <div className="space-y-2">{(groupedDaily[date]||[]).map(d => (
                    <div key={d.id} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-2xl text-xs">
                      <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-800 text-white flex items-center justify-center font-black text-[10px]">{d.earner}</div><div><div className="font-bold text-gray-800">{d.platform} {d.count}건</div><div className="text-[10px] text-gray-400">{d.startTime}~{d.endTime}</div></div></div>
                      <div className="flex items-center gap-2"><span className="font-black text-sm">{formatMoney(d.amount)}원</span>{isManageMode && <button onClick={()=>deleteDailyDelivery(d.id)} className="text-gray-300"><Trash2 size={14}/></button>}</div>
                    </div>
                  ))}</div>
                </div>
              ))}
              {deliverySubTab === 'weekly' && Object.keys(paydayGroups).sort((a,b)=>b.localeCompare(a)).map(pd => (
                <div key={pd} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex justify-between items-center">
                  <div><div className="text-xs text-gray-400 font-bold mb-1">{pd} 입금</div><div className="font-black text-gray-800 text-lg">{parseInt(pd.slice(5,7))}월 {getWeekOfMonth(pd)}주차 정산</div></div>
                  <div className="text-right"><div className="text-xl font-black text-orange-500">{formatMoney(paydayGroups[pd].total)}원</div><div className="text-[10px] text-gray-400 font-bold mt-1">현아 {formatMoney(paydayGroups[pd].hyuna)} | 정훈 {formatMoney(paydayGroups[pd].junghoon)}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'loans' && (
          <div className="space-y-6 pb-28 pt-4 animate-in slide-in-from-right duration-500">
             <section>
              <div className="bg-indigo-600 rounded-[2.5rem] p-7 text-white shadow-xl relative overflow-hidden mb-6">
                <Landmark className="absolute -right-6 -bottom-6 w-36 h-36 opacity-10" />
                <div className="relative z-10">
                  <div className="text-indigo-200 text-xs font-bold mb-1 uppercase tracking-widest">총 대출 잔액</div>
                  <div className="text-4xl font-black mb-6 tracking-tight">{formatMoney(totalPrincipal)}원</div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex justify-between items-center">
                    <span className="text-xs text-indigo-100 font-bold">이번 달 납입 예정</span>
                    <span className="text-xl font-black text-white">{formatMoney(totalMonthlyPayment)}원</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {sortedLoans.map(loan => (
                  <div key={loan.id} className={`bg-white rounded-3xl p-5 shadow-sm border ${loan.status === '완납' ? 'opacity-50 border-green-200' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-3">
                       <span className="font-bold text-gray-800 text-lg">{loan.name} {loan.status === '완납' && <CheckCircle2 className="w-5 h-5 text-green-500 ml-1.5 inline-block"/>}</span>
                       <span className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-lg font-black">매월 {loan.paymentDate}일</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <div><div className="text-[10px] text-gray-400 font-bold mb-1">잔액</div><div className="text-xl font-black">{formatMoney(loan.principal)}원</div></div>
                       <div className="text-right"><div className="text-[10px] text-gray-400 font-bold mb-1">{loan.paymentMethod}</div><div className="text-indigo-600 font-black">{formatMoney(getMonthlyPayment(loan))}원</div></div>
                    </div>
                  </div>
                ))}
              </div>
             </section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-4 right-4 h-[72px] bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-white/50 flex justify-around items-center z-50 px-2">
        {tabOrder.map((tabId) => {
          const config = tabConfig[tabId];
          const Icon = config.icon;
          const isActive = activeTab === tabId;
          return (
            <button key={tabId} onClick={() => setActiveTab(tabId)} className={`flex flex-col items-center w-14 transition-all ${isActive ? `${config.colorClass} scale-110` : 'text-gray-400 hover:text-gray-500'}`}>
              <Icon size={22}/> <span className="text-[9px] font-black mt-1.5">{config.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 💡 플로팅 버튼 */}
      {activeTab === 'ledger' && <button onClick={() => { setFormData({ date: todayStr, type: '지출', amount: '', category: '식비', note: '' }); setIsModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-pink-500 text-white w-14 h-14 rounded-[1.5rem] shadow-xl flex items-center justify-center active:scale-90 z-40 border border-pink-400"><Plus size={28}/></button>}
      {activeTab === 'calendar' && <button onClick={() => { setEventFormData({ date: todayStr, title: '', type: '가족일정', isImportant: false }); setEditingEventId(null); setIsEventModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-emerald-500 text-white w-14 h-14 rounded-[1.5rem] shadow-xl flex items-center justify-center active:scale-90 z-40 border border-emerald-400"><Plus size={28}/></button>}
      {activeTab === 'delivery' && !timerActive && <button onClick={() => { setDeliveryFormData({ date: todayStr, earner: currentUser === '정훈' ? '정훈' : '현아', platform: '배민', amount: '', count: '', startTime: '', endTime: '' }); setEditingDeliveryId(null); setIsDeliveryModalOpen(true); }} className="fixed bottom-[100px] right-6 bg-orange-500 text-white w-14 h-14 rounded-[1.5rem] shadow-xl flex items-center justify-center active:scale-90 z-40 border border-orange-400"><Plus size={28}/></button>}

      {/* 💡 듀티 단건 수정 모달 */}
      {singleDutyModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="text-center mb-6">
                <div className="text-xs font-bold text-gray-400 mb-1">{singleDutyModal.date}</div>
                <h2 className="text-2xl font-black text-gray-800">현아 근무 변경</h2>
             </div>
             <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => handleSingleDutySave('DAY')} className="py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-lg border border-blue-100 shadow-sm active:scale-95">DAY</button>
                <button onClick={() => handleSingleDutySave('EVE')} className="py-4 bg-orange-50 text-orange-600 rounded-2xl font-black text-lg border border-orange-100 shadow-sm active:scale-95">EVE</button>
                <button onClick={() => handleSingleDutySave('NIGHT')} className="py-4 bg-purple-50 text-purple-600 rounded-2xl font-black text-lg border border-purple-100 shadow-sm active:scale-95">NIGHT</button>
                <button onClick={() => handleSingleDutySave('OFF')} className="py-4 bg-pink-50 text-pink-600 rounded-2xl font-black text-lg border border-pink-100 shadow-sm active:scale-95">OFF</button>
             </div>
             <div className="flex gap-2">
               <button onClick={() => handleSingleDutySave('삭제')} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold active:scale-95">기록 삭제</button>
               <button onClick={closeModals} className="flex-1 py-4 bg-gray-800 text-white rounded-2xl font-bold active:scale-95">취소</button>
             </div>
          </div>
        </div>
      )}

      {/* 가계부 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-[60] p-4 pb-8 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black text-gray-800">내역 기록</h2><button onClick={closeModals} className="bg-pink-50 text-pink-500 p-2.5 rounded-2xl"><X size={20}/></button></div>
            <form onSubmit={handleTransactionSubmit} className="space-y-6">
              <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner"><button type="button" onClick={() => setFormData({...formData, type:'지출'})} className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all ${formData.type==='지출'?'bg-white text-pink-500 shadow-sm border border-pink-100':'text-gray-500'}`}>지출하기</button><button type="button" onClick={() => setFormData({...formData, type:'수입'})} className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all ${formData.type==='수입'?'bg-white text-blue-500 shadow-sm border border-blue-100':'text-gray-500'}`}>수입얻기</button></div>
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">금액 (원)</label><div className="relative"><input type="text" value={formData.amount ? formatMoney(formData.amount) : ''} onChange={e => setFormData({...formData, amount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className={`w-full text-5xl font-black border-b-4 border-gray-50 pb-4 outline-none transition-colors bg-transparent ${formData.type === '수입' ? 'focus:border-blue-400' : 'focus:border-pink-400'}`} autoFocus /><span className="absolute right-2 bottom-6 text-2xl font-black text-gray-300">원</span></div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-gray-400 ml-2 block uppercase">날짜</label><input type="date" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-sm outline-none border border-gray-200 focus:ring-2 ring-pink-100" /></div>
                <div><label className="text-[10px] font-black text-gray-400 ml-2 block uppercase">분류</label><select value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})} className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-xs outline-none border border-gray-200">{(CATEGORIES[formData.type]||[]).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <button type="submit" className={`w-full ${formData.type === '수입' ? 'bg-blue-500 border-blue-600' : 'bg-pink-500 border-pink-600'} py-5 rounded-[2rem] text-white font-black text-lg active:scale-95 transition-all shadow-xl`}>기록 완료 ✨</button>
            </form>
          </div>
        </div>
      )}

      {/* 일정 모달 */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-[60] p-4 pb-8">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-7 shadow-2xl animate-in slide-in-from-bottom duration-300 border border-emerald-200">
            <div className="flex justify-between items-center mb-5"><h2 className="text-2xl font-black text-gray-900">{editingEventId ? '일정 수정 🌿' : '새 일정 등록 🌿'}</h2><button onClick={closeModals} className="bg-emerald-50 text-emerald-600 p-2.5 rounded-2xl border border-emerald-100 shadow-sm"><X size={20}/></button></div>
            <form onSubmit={handleEventSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase tracking-tighter">분류</label><select value={eventFormData.type} onChange={(e) => setEventFormData({...eventFormData, type: e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold outline-none border border-gray-200 focus:ring-2 ring-emerald-200"><option value="가족일정">가족일정</option><option value="회식">회식</option><option value="기타">기타</option></select></div><div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase tracking-tighter">날짜</label><input type="date" value={eventFormData.date} onChange={e=>setEventFormData({...eventFormData, date:e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold outline-none border border-gray-200 focus:ring-2 ring-emerald-200" /></div></div>
              <div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase tracking-tighter">일정 내용</label><input type="text" value={eventFormData.title} onChange={e=>setEventFormData({...eventFormData, title:e.target.value})} placeholder="어머님 생신 등" className="w-full bg-white rounded-xl p-3.5 text-lg font-black outline-none border border-gray-200 focus:ring-2 ring-emerald-200 shadow-sm" autoFocus /></div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between"><div><div className="text-sm font-black text-amber-700 flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400"/> 중요 일정</div><div className="text-[10px] text-amber-600 font-bold">강조되어 표시됩니다.</div></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={eventFormData.isImportant} onChange={e => setEventFormData({...eventFormData, isImportant: e.target.checked})} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div></label></div>
              <button type="submit" className="w-full bg-emerald-500 mt-4 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 transition-all shadow-xl shadow-emerald-200 border border-emerald-600">완료 🌿</button>
            </form>
          </div>
        </div>
      )}

      {/* 듀티 일괄 모달 */}
      {isDutyBatchModalOpen && (() => {
        const first = new Date(dutyBatchYear, dutyBatchMonth - 1, 1).getDay();
        const days = new Date(dutyBatchYear, dutyBatchMonth, 0).getDate();
        const arr = Array.from({length: first}, () => null).concat(Array.from({length: days}, (_, i) => i + 1));
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-4"><div><h2 className="text-xl font-black text-gray-900">한달 스케쥴 등록</h2><div className="text-[10px] text-gray-500 font-bold">{isDutyBatchEditMode ? '도장 선택 후 날짜를 터치!' : '수정 버튼을 누르세요.'}</div></div><button onClick={closeModals} className="bg-gray-100 text-gray-500 p-2 rounded-xl active:scale-95"><X size={18}/></button></div>
              {isDutyBatchEditMode && (<div className="flex justify-between gap-1 bg-gray-50 p-1.5 rounded-2xl mb-4 border border-gray-200"><button onClick={() => setSelectedStamp('DAY')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${selectedStamp === 'DAY' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>DAY</button><button onClick={() => setSelectedStamp('EVE')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${selectedStamp === 'EVE' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>EVE</button><button onClick={() => setSelectedStamp('OFF')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${selectedStamp === 'OFF' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>OFF</button><button onClick={() => setSelectedStamp('DELETE')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${selectedStamp === 'DELETE' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>지우개</button></div>)}
              <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm mb-4"><div className="flex justify-between items-center mb-3 px-2"><button onClick={() => setDutyBatchMonth(p => p === 1 ? 12 : p - 1)} className="p-1"><ChevronLeft size={16}/></button><span className="font-black text-emerald-600 text-sm">{dutyBatchYear}년 {dutyBatchMonth}월</span><button onClick={() => setDutyBatchMonth(p => p === 12 ? 1 : p + 1)} className="p-1"><ChevronRight size={16}/></button></div><div className="grid grid-cols-7 gap-1 text-center mb-1.5">{['일','월','화','수','목','금','토'].map((d,i) => <div key={d} className={`text-[9px] font-bold ${i===0?'text-red-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>)}</div><div className="grid grid-cols-7 gap-1">{arr.map((d, i) => { if(!d) return <div key={i} className="h-10 bg-transparent rounded-lg"></div>; const ds = `${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const duty = batchDuties[ds]; let bg = 'bg-gray-50 border-gray-100 text-gray-800'; if (duty === 'DAY') bg = 'bg-blue-50 border-blue-200 text-blue-600'; if (duty === 'EVE') bg = 'bg-orange-50 border-orange-200 text-orange-600'; if (duty === 'OFF') bg = 'bg-pink-50 border-pink-200 text-pink-600'; return (<button key={ds} onClick={() => handleDutyCellClick(ds)} className={`h-10 border rounded-xl flex flex-col items-center justify-center transition-transform ${isDutyBatchEditMode ? 'active:scale-90' : 'cursor-default'} ${bg}`}><span className="text-[10px] font-bold opacity-80">{d}</span>{duty && <span className="text-[11px] font-black tracking-tighter leading-tight mt-0.5">{duty}</span>}</button>)})}</div></div>
              {isDutyBatchEditMode ? (<button onClick={saveBatchDuties} className="w-full bg-emerald-500 py-4 rounded-[1.5rem] text-white font-black text-lg active:scale-95 transition-transform shadow-lg shadow-emerald-200 border border-emerald-600">변경사항 저장</button>) : (<button onClick={() => setIsDutyBatchEditMode(true)} className="w-full bg-gray-100 py-4 rounded-[1.5rem] text-gray-600 font-black text-lg active:scale-95 transition-transform border border-gray-200">수정 모드 켜기</button>)}
            </div>
          </div>
        );
      })()}

      {/* 배달 모달 */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[60] p-4 py-8 overflow-y-auto no-scrollbar">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-7 shadow-2xl animate-in slide-in-from-bottom duration-300 my-auto border-t-8 border-blue-500">
            <div className="flex justify-between items-center mb-5"><h2 className="text-2xl font-black text-gray-900">{editingDeliveryId ? '배달 기록 수정' : '배달 수익 기록 🛵'}</h2><button onClick={closeModals} className="bg-blue-50 text-blue-500 p-2.5 rounded-2xl border border-blue-100 shadow-sm"><X size={20}/></button></div>
            <form onSubmit={async (e) => {
               e.preventDefault();
               if (!deliveryFormData.amount || !user) return;
               const newDel = { ...deliveryFormData, amount: parseInt(String(deliveryFormData.amount).replace(/,/g, ''), 10), count: parseInt(deliveryFormData.count) || 0 };
               if (isFirebaseEnabled) {
                  if (editingDeliveryId) {
                     await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery', editingDeliveryId), newDel);
                     logEvent('배달 수정', `${newDel.date} 수익 수정`);
                  } else {
                     await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'delivery'), newDel);
                     logEvent('배달 완료', `${newDel.date} ${newDel.earner} ${formatMoney(newDel.amount)}원 기록`);
                  }
               }
               showToast("수익이 기록되었습니다! 수고하셨습니다 👏"); closeModals();
            }} className="space-y-4">
              <div className="bg-gradient-to-br from-blue-900 to-slate-800 p-4 rounded-2xl text-white shadow-md flex justify-around mb-2"><div className="text-center"><div className="text-[10px] font-bold text-blue-200 mb-1">예상 통합 시급</div><div className="font-black text-cyan-400 text-lg">{formatMoney(calcDailyMetrics([deliveryFormData]).hourlyRate)}<span className="text-[10px] ml-0.5 font-normal text-blue-100">원</span></div></div><div className="w-px bg-blue-700/50 mx-2"></div><div className="text-center"><div className="text-[10px] font-bold text-blue-200 mb-1">건당 평단</div><div className="font-black text-blue-300 text-lg">{formatMoney(calcDailyMetrics([deliveryFormData]).perDelivery)}<span className="text-[10px] ml-0.5 font-normal text-blue-100">원</span></div></div></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase">수익자</label><div className="flex bg-gray-50 border border-gray-200 p-1 rounded-xl"><button type="button" onClick={()=>setDeliveryFormData({...deliveryFormData, earner:'정훈'})} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${deliveryFormData.earner==='정훈'?'bg-white text-blue-600 shadow-sm border border-blue-100':'text-gray-500'}`}>정훈</button><button type="button" onClick={()=>setDeliveryFormData({...deliveryFormData, earner:'현아'})} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${deliveryFormData.earner==='현아'?'bg-white text-blue-600 shadow-sm border border-blue-100':'text-gray-500'}`}>현아</button></div></div><div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase">플랫폼</label><div className="flex bg-gray-50 border border-gray-200 p-1 rounded-xl"><button type="button" onClick={()=>setDeliveryFormData({...deliveryFormData, platform:'배민'})} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${deliveryFormData.platform==='배민'?'bg-[#2ac1bc] text-white':'text-gray-500'}`}>배민</button><button type="button" onClick={()=>setDeliveryFormData({...deliveryFormData, platform:'쿠팡'})} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${deliveryFormData.platform==='쿠팡'?'bg-[#111111] text-white':'text-gray-500'}`}>쿠팡</button></div></div></div>
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">오늘 총 수익금</label><div className="relative"><input type="text" value={deliveryFormData.amount ? formatMoney(deliveryFormData.amount) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className="w-full text-4xl font-black border-b-4 border-gray-100 pb-2 outline-none focus:border-blue-500 bg-transparent text-gray-900" autoFocus /><span className="absolute right-2 bottom-4 text-xl font-black text-gray-300">원</span></div></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-3"><div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase">시작</label><input type="time" value={deliveryFormData.startTime} onChange={e=>setDeliveryFormData({...deliveryFormData, startTime:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-xs outline-none focus:ring-2 ring-blue-200" /></div><div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase">종료</label><input type="time" value={deliveryFormData.endTime} onChange={e=>setDeliveryFormData({...deliveryFormData, endTime:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-xs outline-none focus:ring-2 ring-blue-200" /></div></div><div className="space-y-3"><div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase">날짜</label><input type="date" value={deliveryFormData.date} onChange={e=>setDeliveryFormData({...deliveryFormData, date:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-xs outline-none focus:ring-2 ring-blue-200" /></div><div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase">건수</label><div className="relative"><input type="number" value={deliveryFormData.count} onChange={e=>setDeliveryFormData({...deliveryFormData, count:e.target.value})} placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-black text-sm outline-none focus:ring-2 ring-blue-200" /><span className="absolute right-3 top-3.5 text-sm font-black text-gray-400">건</span></div></div></div></div>
              <button type="submit" disabled={!deliveryFormData.amount} className="w-full bg-blue-600 mt-2 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 transition-all shadow-xl shadow-blue-200 border border-blue-700">저장 완료 🚀</button>
            </form>
          </div>
        </div>
      )}

      {/* 중도상환 모달 */}
      {isPrepayModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-[60] p-4 pb-8">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-7 shadow-2xl animate-in slide-in-from-bottom duration-300 border border-indigo-100">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black flex items-center gap-2 text-gray-800"><Coins size={24} className="text-indigo-500"/> 상환 이력 추가</h2><button onClick={closeModals} className="bg-indigo-50 text-indigo-500 p-2.5 rounded-2xl border border-indigo-100 shadow-sm"><X size={20}/></button></div>
            <form onSubmit={handlePrepaySubmit} className="space-y-5">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shadow-sm"><span className="text-xs font-bold text-indigo-600 block mb-1">상환 대상 대출</span><span className="font-black text-indigo-900 text-lg">{(assets?.loans||[]).find(l => l.id === prepayFormData.loanId)?.name}</span></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">상환 원금</label><input type="text" value={prepayFormData.principalAmount ? formatMoney(prepayFormData.principalAmount) : ''} onChange={e => setPrepayFormData({...prepayFormData, principalAmount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className="w-full text-2xl font-black border-b-4 border-gray-100 pb-2 outline-none focus:border-indigo-500 bg-transparent text-gray-900" autoFocus /></div><div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">납부 이자</label><input type="text" value={prepayFormData.interestAmount ? formatMoney(prepayFormData.interestAmount) : ''} onChange={e => setPrepayFormData({...prepayFormData, interestAmount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className="w-full text-2xl font-black border-b-4 border-gray-100 pb-2 outline-none focus:border-indigo-500 bg-transparent text-gray-900" /></div></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 ml-2 block uppercase">상환 날짜</label><input type="date" value={prepayFormData.date} onChange={e=>setPrepayFormData({...prepayFormData, date:e.target.value})} className="w-full bg-gray-50 rounded-xl p-3.5 font-bold text-sm outline-none border border-gray-200 focus:ring-2 ring-indigo-200" /></div>
              <button type="submit" disabled={!prepayFormData.principalAmount && !prepayFormData.interestAmount} className="w-full bg-indigo-600 py-4 rounded-[2rem] text-white font-black text-lg active:scale-95 transition-all shadow-xl shadow-indigo-200 border border-indigo-700">상환 처리 완료</button>
            </form>
          </div>
        </div>
      )}

      {/* 메시지 기록 */}
      {isMessageHistoryOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-[70] p-4 pb-8 overflow-y-auto no-scrollbar">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-7 shadow-2xl animate-in slide-in-from-bottom duration-300 border border-pink-100">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black text-gray-800">💌 메시지 기록 보관소</h2><button onClick={closeModals} className="bg-gray-100 text-gray-500 p-2.5 rounded-2xl border border-gray-200 shadow-sm"><X size={20}/></button></div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar pb-4">
               {messages.length === 0 && <div className="text-center text-gray-400 font-bold py-10">과거 내역이 없습니다.</div>}
               {messages.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(m => (
                 <div key={m.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative">
                   <div className="flex justify-between items-start mb-1">
                      <div className="text-[10px] text-gray-400 font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-white mr-1.5 ${m.author === '시스템' ? 'bg-emerald-400' : m.author === '현아' ? 'bg-pink-400' : 'bg-blue-400'}`}>{m.author}</span>
                        {typeof m.createdAt === 'string' && m.createdAt.replace(/-/g,'.')} 발송
                      </div>
                      {m.isChecked ? <span className="text-[9px] font-black text-gray-300 flex items-center gap-0.5"><CheckCircle2 size={10}/> 읽음</span> : <span className="text-[9px] font-black text-pink-500 flex items-center gap-0.5"><Clock size={10}/> 안읽음</span>}
                   </div>
                   <div className="text-sm font-bold text-gray-700 leading-relaxed">{m.text}</div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// 💡 오류 화면(ErrorBoundary) 완벽 복구
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
