import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Calendar as CalendarIcon, PieChart, List, 
  ChevronLeft, ChevronRight, X, ArrowDownCircle, ArrowUpCircle, 
  Bike, Landmark, Wallet, CheckCircle2, 
  Trash2, Settings, Clock, Search, ChevronDown, ChevronUp, CalendarCheck, Coins, Filter, RefreshCw, ArrowDownUp, Timer, Target, Edit3, CalendarDays, Play, Square, Smartphone, Heart,
  Utensils, Home, Car, Shield, User, CreditCard, PiggyBank, GraduationCap, Gift, Plane, FileText, Film, Scissors, ShoppingBag, Tv, Package, Briefcase, Star, Stethoscope, Coffee, MessageSquareHeart, History, Info, MessageCircle, Archive
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// --- 💡 앱 버전 및 업데이트 시간 ---
const APP_VERSION = "v7.5 (바텀시트 & 톡 개편 & 모바일 최적화: 2026.05.01)";

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

function AppContent() {
  const [user, setUser] = useState(null);
  const todayStr = getKSTDateStr(); 
  
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
  
  const [ledger, setLedger] = useState([]);
  const [assets, setAssets] = useState({ loans: [], stocks: [] }); 
  const [dailyDeliveries, setDailyDeliveries] = useState([]);
  const [events, setEvents] = useState([]); 
  const [messages, setMessages] = useState([]); 
  const [logs, setLogs] = useState([]);
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
  const [isDutyBatchModalOpen, setIsDutyBatchModalOpen] = useState(false);
  const [isDutyBatchEditMode, setIsDutyBatchEditMode] = useState(false);
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
  
  // 💡 부부 톡 댓글(답글) 상태 추가
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [deliveryFormData, setDeliveryFormData] = useState({ 
    date: todayStr, earner: currentUser === '정훈' ? '정훈' : '현아', platform: '배민', amount: '', count: '', 
    amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', 
    amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '', 
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

  // --- 데이터 연산 ---
  const yearlyIncome = useMemo(() => {
    return (ledger || []).filter(t => t?.type === '수입' && typeof t?.date === 'string' && t.date.startsWith(String(selectedYear))).reduce((acc, curr) => acc + (curr.amount||0), 0);
  }, [ledger, selectedYear]);

  const deliveryYearlyTotal = useMemo(() => {
    return (dailyDeliveries || []).filter(d => typeof d?.date === 'string' && d.date.startsWith(String(selectedYear))).reduce((a,b) => a + (b.amount||0), 0);
  }, [dailyDeliveries, selectedYear]);

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

  const paydayGroups = useMemo(() => {
    const groups = {};
    (dailyDeliveries || []).forEach(d => {
      if(!d.date || typeof d.date !== 'string') return;
      const pdStr = getPaydayStr(d.date);
      if (!pdStr) return; 
      if (!groups[pdStr]) groups[pdStr] = { paydayStr: pdStr, total: 0, hyuna: 0, junghoon: 0, items: [] };
      groups[pdStr].total += (d.amount||0);
      if (d.earner === '현아') groups[pdStr].hyuna += (d.amount||0);
      if (d.earner === '정훈') groups[pdStr].junghoon += (d.amount||0);
      groups[pdStr].items.push(d);
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
      return kst.toISOString().slice(0, 10);
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

  const activeMessages = useMemo(() => {
    return (messages || []).filter(m => {
      if (m.isChecked) return false;
      const d1 = new Date(m.createdAt);
      const d2 = new Date(todayStr);
      const diffDays = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }, [messages, todayStr]);

  const closeModals = () => { 
    setIsModalOpen(false); 
    setIsDeliveryModalOpen(false); 
    setIsEventModalOpen(false); 
    setIsDutyBatchModalOpen(false); 
    setIsMessageHistoryOpen(false);
    setIsPrepayModalOpen(false);
    setEditingEventId(null);
    setEditingDeliveryId(null);
    setSingleDutyModal({ isOpen: false, date: '', duty: '', eventId: null });
    setReplyingTo(null);
  };
  
  const clearFilters = (e) => { e.preventDefault(); setSearchQuery(''); setFilterType('all'); setFilterCategory('all'); setLedgerDateRange({ start: '', end: '' }); showToast("필터가 초기화되었습니다."); };

  const handleStartDelivery = async () => {
    const nowStr = new Date().toISOString();
    setTrackingStartTime(nowStr);
    setTimerActive(true);
    setElapsedSeconds(0);
    if (isFirebaseEnabled && user) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'deliveryTimer'), { timerActive: true, trackingStartTime: nowStr });
      logEvent('배달 시작', '실시간 배달 기록을 시작했습니다.');
    } else {
      localStorage.setItem('hyunaDeliveryStartTime', nowStr);
    }
    showToast("배달 근무를 시작합니다! 안전운전 🛵", "info");
  };

  const handleEndDelivery = async () => {
    const end = new Date();
    const startObj = new Date(trackingStartTime);
    setDeliveryFormData({
      date: getKSTDateStr(),
      earner: currentUser === '정훈' ? '정훈' : '현아', platform: '배민', amount: '', count: '',
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
      if (!window.confirm(`'${catInput}' 항목을 새로운 카테고리로 등록하시겠습니까?`)) return;
      finalCategory = catInput;
      const newCats = {...categories, [formData.type]: [...(categories[formData.type]||[]), finalCategory]};
      if (isFirebaseEnabled) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'categories'), newCats);
      else setCategories(newCats);
    }
    const newTx = { ...formData, category: finalCategory, amount: parseInt(String(formData.amount).replace(/,/g, ''), 10) };
    if (isFirebaseEnabled && user) {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ledger'), newTx);
      logEvent('가계부 추가', `${newTx.date} [${newTx.type}] ${newTx.category} ${formatMoney(newTx.amount)}원`);
    } else setLedger([{...newTx, id: Date.now().toString()}, ...ledger]);
    showToast("기록이 저장되었습니다.");
    closeModals();
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
      if (isFirebaseEnabled && user) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery', editingDeliveryId), newDel);
        logEvent('배달 수정', `${newDel.date} ${newDel.earner} 배달 데이터 수정`);
      } else setDailyDeliveries(prev => (prev||[]).map(item => item.id === editingDeliveryId ? {...newDel, id: item.id} : item));
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
        logEvent('배달 일괄 기록', `${deliveryFormData.date} 배달 수익 동시 기록 완료`);
      } else {
        const newAdds = adds.map(a => ({...a, id: Date.now().toString() + Math.random()}));
        setDailyDeliveries([...newAdds, ...(dailyDeliveries||[])]);
      }
    }
    showToast("수익 기록이 완료되었습니다! 수고하셨습니다 👏");
    closeModals();
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventFormData.title.trim() || !user) return;
    const newEvent = { ...eventFormData };
    
    if (editingEventId) {
      if (isFirebaseEnabled && user) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEventId), newEvent);
        logEvent('일정 수정', `${newEvent.date} ${newEvent.title} 일정 수정`);
      } else setEvents(events.map(ev => ev.id === editingEventId ? {...newEvent, id: editingEventId} : ev));
    } else {
      if (isFirebaseEnabled && user) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), newEvent);
        logEvent('일정 추가', `${newEvent.date} ${newEvent.title} 일정 등록`);
      } else setEvents([{...newEvent, id: Date.now().toString()}, ...(events||[])]);
    }
    showToast("일정이 저장되었습니다.");
    closeModals();
  };

  // 💡 삭제 시 안전장치(팝업) 추가됨
  const deleteEvent = async (id) => {
    const target = events.find(e => e.id === id);
    if(!window.confirm(`'${target?.title}' 일정을 삭제하시겠습니까?`)) return;
    if (isFirebaseEnabled && user) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id));
      logEvent('일정 삭제', `${target?.title} 삭제`);
    } else setEvents((events||[]).filter(e => e.id !== id));
    showToast("삭제되었습니다.", "error");
  };

  // 💡 부부 톡: 새 메시지 등록
  const handleSendMessage = async () => {
    if(!messageFormData.text.trim() || !user) return;
    const newMsg = { ...messageFormData, createdAt: todayStr, isChecked: false, replies: [] };
    if (isFirebaseEnabled) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), newMsg);
    setMessageFormData({...messageFormData, text: ''}); showToast("메시지 전송 완료!");
  };

  // 💡 부부 톡: 댓글(답글) 달기 로직
  const handleReplyMessage = async (m) => {
    if(!replyText.trim() || !user) return;
    const newReply = { author: currentUser !== '가족' ? currentUser : '상대방', text: replyText, createdAt: todayStr };
    if (isFirebaseEnabled) {
       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', m.id), { replies: [...(m.replies || []), newReply] });
    }
    setReplyingTo(null); setReplyText(''); showToast("댓글이 달렸습니다!");
  };

  // 💡 부부 톡: 확인/보관 로직
  const handleArchiveOrDeleteMessage = async (m) => {
    if (isFirebaseEnabled && user) {
       if (m.author === '시스템') {
          // 시스템 메시지는 완전 삭제
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', m.id));
          showToast("알림이 삭제되었습니다.");
       } else {
          // 일반 대화는 보관
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', m.id), { isChecked: true, checkedAt: todayStr });
          showToast("보관소로 이동되었습니다.");
       }
    }
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
    setIsDutyBatchEditMode(false); 
    setIsDutyBatchModalOpen(true);
  };

  useEffect(() => {
    if(!isDutyBatchModalOpen) return;
    const current = {};
    events.forEach(e => {
      if(e.type === '듀티' && e.date && e.date.startsWith(`${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}`)) {
        current[e.date] = e.title;
      }
    });
    setBatchDuties(current);
  }, [dutyBatchYear, dutyBatchMonth, isDutyBatchModalOpen, events]);

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
      // 시스템 알림
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), { author: '시스템', text: `${date.slice(5)} 근무가 [${stamp === '삭제' ? 'OFF' : stamp}]로 변경되었습니다 🏥`, createdAt: todayStr, isChecked: false });
    }
    showToast(`${date.slice(5)} 스케쥴이 수정되었습니다.`);
    setSingleDutyModal({ isOpen: false, date: '', duty: '', eventId: null });
  };

  const handleDutyCellClick = (dateStr) => {
    if (!isDutyBatchEditMode) return; 
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

  const saveBatchDuties = async () => {
    if(!user) return;
    const monthPrefix = `${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}`;
    const eventsToDelete = events.filter(e => e.type === '듀티' && e.date && e.date.startsWith(monthPrefix));
    
    if (isFirebaseEnabled) {
      for (const e of eventsToDelete) {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', e.id));
      }
      for (const [date, title] of Object.entries(batchDuties)) {
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), {
            type: '듀티', title, date, isImportant: false
         });
      }
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
         author: '시스템', text: `현아가 ${dutyBatchMonth}월 근무표를 통째로 업데이트했어요! 🗓️`, createdAt: todayStr, isChecked: false
      });
      logEvent('근무표 일괄 업데이트', `${dutyBatchMonth}월 근무표를 통째로 업데이트했습니다.`);
    } else {
      const kept = events.filter(e => !(e.type === '듀티' && e.date && e.date.startsWith(monthPrefix)));
      const added = Object.entries(batchDuties).map(([date, title], i) => ({
         id: `batch_${Date.now()}_${i}`, type: '듀티', title, date, isImportant: false
      }));
      setEvents([...added, ...kept]);
    }
    setIsDutyBatchModalOpen(false);
    showToast(`${dutyBatchMonth}월 스케쥴이 한 달 치 저장되었습니다!`);
  };

  const handlePayLoanThisMonth = async (loan) => {
    if(!user) return;
    if(window.confirm(`'${loan.name}' 이번 달 납부를 완료하시겠습니까?`)) {
      const newPaidMonths = [...(loan.paidMonths || []), currentMonthKey];
      if (isFirebaseEnabled) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { paidMonths: newPaidMonths });
        logEvent('대출 납부', `${loan.name} ${selectedMonth}월 납입 처리`);
      } else setAssets(prev => ({ ...prev, loans: (prev.loans||[]).map(l => l.id === loan.id ? { ...l, paidMonths: newPaidMonths } : l) }));
      showToast("납부 처리가 완료되었습니다.");
    }
  };

  const handleCancelPayLoanThisMonth = async (loan) => {
    if(!user) return;
    if(window.confirm(`'${loan.name}' 이번 달 납부 완료를 취소하시겠습니까?`)) {
      const newPaidMonths = (loan.paidMonths || []).filter(m => m !== currentMonthKey);
      if (isFirebaseEnabled) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { paidMonths: newPaidMonths });
        logEvent('대출 납부 취소', `${loan.name} ${selectedMonth}월 납입 취소`);
      } else setAssets(prev => ({ ...prev, loans: (prev.loans||[]).map(l => l.id === loan.id ? { ...l, paidMonths: newPaidMonths } : l) }));
      showToast("납부 취소가 완료되었습니다.");
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

    if (isFirebaseEnabled && user) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { principal: newPrincipal, status: newStatus, prepaymentHistory: [newHistoryItem, ...(loan.prepaymentHistory || [])] });
      logEvent('중도 상환', `${loan.name} 원금 ${formatMoney(pAmount)}원 상환 기록`);
    } else setAssets(prev => ({...prev, loans: (prev.loans||[]).map(l => l.id === loan.id ? { ...l, principal: newPrincipal, status: newStatus, prepaymentHistory: [newHistoryItem, ...(l.prepaymentHistory || [])] } : l)}));
    showToast("중도상환 내역이 기록되었습니다.");
    closeModals();
  };

  // 💡 삭제 시 안전장치(팝업) 추가됨
  const deletePrepaymentHistory = async (loanId, historyId) => {
    if(!user) return;
    if(!window.confirm('이 중도상환 기록을 삭제하고 원금을 다시 복구하시겠습니까?')) return;
    
    const loan = (assets?.loans||[]).find(l => l.id === loanId);
    if (!loan) return;
    const historyItem = (loan.prepaymentHistory||[]).find(h => h.id === historyId);
    if (!historyItem) return;
    const restoredPrincipal = loan.principal + historyItem.principalAmount;
    
    if (isFirebaseEnabled && user) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', loan.id), { principal: restoredPrincipal, status: restoredPrincipal > 0 ? '상환중' : '완납', prepaymentHistory: (loan.prepaymentHistory||[]).filter(h => h.id !== historyId) });
      logEvent('중도 상환 취소', `${loan.name} 원금 ${formatMoney(historyItem.principalAmount)}원 상환 복구`);
    } else setAssets(prev => ({...prev, loans: (prev.loans||[]).map(l => l.id === loanId ? { ...l, principal: restoredPrincipal, status: restoredPrincipal > 0 ? '상환중' : '완납', prepaymentHistory: (l.prepaymentHistory||[]).filter(h => h.id !== historyId) } : l)}));
    showToast("상환 기록이 취소되고 원금이 복구되었습니다.");
  };

  const updateAsset = async (type, id, field, value) => {
    if (isFirebaseEnabled && user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', id), { [field]: value });
    else setAssets(prev => ({ ...prev, [type]: (prev[type]||[]).map(item => item.id === id ? { ...item, [field]: value } : item) }));
  }

  // 💡 삭제 시 안전장치(팝업) 추가됨
  const deleteAsset = async (type, id) => {
    const target = assets[type].find(a => a.id === id);
    if(!window.confirm(`'${target?.name}' 항목을 정말 삭제하시겠습니까?\n(삭제 후에는 복구할 수 없습니다)`)) return;
    if (isFirebaseEnabled && user) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', id));
      logEvent('자산 삭제', `${target?.name} 정보 삭제`);
    } else setAssets(prev => ({ ...prev, [type]: (prev[type]||[]).filter(item => item.id !== id) }));
    showToast("삭제되었습니다.", "error");
  }

  const deleteTransaction = async (id) => {
    const target = ledger.find(t => t.id === id);
    if(!window.confirm(`이 ${target?.category} 내역(${formatMoney(target?.amount)}원)을 정말 삭제하시겠습니까?`)) return;
    if (isFirebaseEnabled && user) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ledger', id));
      logEvent('가계부 삭제', `${target?.category} ${formatMoney(target?.amount)}원 삭제`);
    } else setLedger((ledger||[]).filter(t => t.id !== id));
    showToast("삭제되었습니다.", "error");
  }

  const deleteDailyDelivery = async (id) => {
    const target = dailyDeliveries.find(d => d.id === id);
    if(!window.confirm('이 배달 기록을 정말 삭제하시겠습니까?')) return;
    if (isFirebaseEnabled && user) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery', id));
      logEvent('배달 기록 삭제', `${target?.date} ${target?.earner} 수익 삭제`);
    } else setDailyDeliveries((dailyDeliveries||[]).filter(d => d.id !== id));
    showToast("삭제되었습니다.", "error");
  }

  const addAssetItem = async (typeStr) => {
    if (typeStr === 'loan') {
      const name = prompt(`대출명을 입력하세요:`);
      if (!name) return;
      const newAsset = { assetType: 'loan', name, principal: 0, rate: '', paymentMethod: '이자', paymentDate: '1', duration: 0, customMonthly: 0, status: '상환중', prepaymentHistory: [], paidMonths: [] };
      if (isFirebaseEnabled && user) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assets'), newAsset);
        logEvent('대출 추가', `${name} 신규 대출 등록`);
      } else setAssets(prev => ({ ...prev, loans: [...(prev.loans||[]), {id: Date.now().toString(), ...newAsset}] }));
      showToast("신규 항목이 추가되었습니다.");
    }
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

  // 💡 앱 탭별 테마 색상 
  const appBgColor = activeTab === 'ledger' ? 'bg-pink-50/30' : activeTab === 'delivery' ? 'bg-blue-50/30' : 'bg-gray-50/80';

  return (
    <div className={`min-h-screen font-sans text-gray-900 select-none pb-32 transition-colors duration-500 ${appBgColor}`}>
      
      {/* 💡 상단 토스트 알림 컴포넌트 */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border ${toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-indigo-100 text-indigo-600'}`}>
             <Info size={16}/>
             <span className="text-sm font-black whitespace-nowrap">{toast.message}</span>
          </div>
        </div>
      )}

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

      {/* 💡 관리자 모드 (설정) UI */}
      {isManageMode && (
        <div className="px-5 my-4 animate-in fade-in space-y-4">
           
           <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md">
             <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><Smartphone size={16} className={activeTab === 'ledger' ? 'text-pink-500' : activeTab === 'delivery' ? 'text-blue-500' : 'text-indigo-500'}/> 내 기기 설정</h3>
             
             <div className="space-y-3">
               <div className={`flex justify-between items-center p-3 rounded-xl border ${activeTab === 'ledger' ? 'bg-pink-50/50 border-pink-200/50' : activeTab === 'delivery' ? 'bg-blue-50/50 border-blue-200/50' : activeTab === 'calendar' ? 'bg-emerald-50/50 border-emerald-200/50' : 'bg-indigo-50/50 border-indigo-200/50'}`}>
                 <div>
                   <span className="text-[11px] font-bold text-gray-600 block mb-0.5">앱 시작 시 화면</span>
                   <span className={`text-sm font-black ${activeTab === 'ledger' ? 'text-pink-600' : activeTab === 'delivery' ? 'text-blue-600' : activeTab === 'calendar' ? 'text-emerald-600' : 'text-indigo-700'}`}>{activeTab === 'ledger' ? '가계부' : activeTab === 'delivery' ? '배달수익' : activeTab === 'loans' ? '대출관리' : '우리가족'}</span>
                 </div>
                 <button onClick={() => { localStorage.setItem('hyunaDefaultTab', activeTab); showToast('이 기기의 초기화면이 설정되었습니다.'); }} className={`${activeTab === 'ledger' ? 'bg-pink-500' : activeTab === 'delivery' ? 'bg-blue-600' : 'bg-indigo-600'} text-white text-[10px] px-3 py-2 rounded-lg font-bold active:scale-95 transition-transform shadow-sm`}>
                   현재 탭으로 고정
                 </button>
               </div>
               
               <div className="p-3 rounded-xl border bg-gray-50 border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-gray-600 block mb-0.5">기기 사용자 (로그 실명제)</span>
                    <span className="text-xs font-black text-gray-800">{currentUser === '가족' ? '선택안함' : currentUser}</span>
                  </div>
                  <select value={currentUser} onChange={(e) => { setCurrentUser(e.target.value); localStorage.setItem('hyunaUserName', e.target.value); showToast('사용자가 변경되었습니다.'); }} className="bg-white border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none text-gray-700">
                    <option value="가족">선택안함 (기본)</option>
                    <option value="현아">현아 👩</option>
                    <option value="정훈">정훈 🧑</option>
                  </select>
               </div>
             </div>
           </div>

           {/* 💡 최근 활동 로그 카드 */}
           <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md">
             <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><History size={16} className={activeTab === 'ledger' ? 'text-pink-500' : activeTab === 'delivery' ? 'text-blue-500' : 'text-indigo-500'}/> 최근 활동 로그</h3>
             <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-40 overflow-y-auto no-scrollbar space-y-2">
                {logs.length === 0 && <div className="text-[10px] text-gray-400 font-bold text-center py-4">최근 활동 내역이 없습니다.</div>}
                {logs.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 30).map((log, idx) => (
                   <div key={log.id} className="text-[10px] border-b border-gray-200/50 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`font-black px-1.5 py-0.5 rounded-md ${activeTab === 'ledger' ? 'bg-pink-50 text-pink-600' : activeTab === 'delivery' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>{log.action}</span>
                        <span className="text-gray-400 font-bold">{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString('ko-KR', {hour12: false}).slice(11, 21) : '방금 전'}</span>
                      </div>
                      <div className="text-gray-600 font-medium pl-1">{log.description}</div>
                   </div>
                ))}
             </div>
           </div>

           {/* 가계부 탭일 때만 보이는 설정 */}
           {activeTab === 'ledger' && (
             <div className="bg-white p-5 rounded-2xl border border-pink-200 shadow-md animate-in slide-in-from-top-2">
               <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-1.5"><Settings size={16}/> 카테고리 관리 💖</h3>
               <div className="space-y-4">
                 <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-bold text-pink-500">지출 카테고리</span>
                     <button onClick={() => handleAddCategory('지출')} className="text-[10px] bg-pink-50 text-pink-600 px-2 py-1 rounded font-bold border border-pink-100">+ 추가</button>
                   </div>
                   <div className="flex flex-wrap gap-1.5">
                     {getSortedCategories('지출').map(c => (
                       <span key={c} className="bg-gray-50 border border-gray-200 text-gray-600 text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-bold">{c} <button onClick={() => handleDeleteCategory('지출', c)} className="text-gray-400 hover:text-pink-500"><X size={10}/></button></span>
                     ))}
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-bold text-blue-500">수입 카테고리</span>
                     <button onClick={() => handleAddCategory('수입')} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold border border-blue-100">+ 추가</button>
                   </div>
                   <div className="flex flex-wrap gap-1.5">
                     {getSortedCategories('수입').map(c => (
                       <span key={c} className="bg-gray-50 border border-gray-200 text-gray-600 text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-bold">{c} <button onClick={() => handleDeleteCategory('수입', c)} className="text-gray-400 hover:text-blue-500"><X size={10}/></button></span>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* 배달 탭일 때만 보이는 설정 */}
           {activeTab === 'delivery' && (
             <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-md animate-in slide-in-from-top-2">
               <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><Target size={16} className="text-blue-500"/> {selectedYear}년 {selectedMonth}월 배달 목표</h3>
               <div className="flex items-center gap-2">
                 <input type="number" value={userSettings.deliveryGoals?.[currentMonthKey] || ''} onChange={(e) => updateSettings('deliveryGoals', {...(userSettings.deliveryGoals || {}), [currentMonthKey]: parseInt(e.target.value)||0})} placeholder="목표 금액 입력" className="flex-1 bg-blue-50/50 rounded-xl p-3 text-sm font-black outline-none border border-blue-100 focus:ring-2 ring-blue-300" />
                 <span className="text-gray-500 font-bold text-sm">원</span>
               </div>
             </div>
           )}

           {/* 대출 탭일 때만 보이는 설정 */}
           {activeTab === 'loans' && (
             <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-md animate-in slide-in-from-top-2">
               <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><ArrowDownUp size={16} className="text-indigo-500"/> 대출 목록 기본 정렬</h3>
               <select value={loanSortBy} onChange={(e) => { setLoanSortBy(e.target.value); localStorage.setItem('hyunaLoanSortBy', e.target.value); }} className="w-full bg-indigo-50/50 rounded-xl p-3 text-sm font-black text-indigo-900 outline-none border border-indigo-100 focus:ring-2 ring-indigo-300">
                 <option value="date">납부일 빠른순</option><option value="principal">잔액 많은순</option><option value="rate">금리 높은순</option>
               </select>
             </div>
           )}

           <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md animate-in slide-in-from-top-2">
             <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><List size={16} className={activeTab === 'ledger' ? 'text-pink-500' : activeTab === 'delivery' ? 'text-blue-500' : 'text-indigo-500'}/> 하단 메뉴 순서 변경</h3>
             <div className="space-y-2">
               {tabOrder.map((tabId, index) => (
                 <div key={tabId} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                   <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                     <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm text-[10px]">{index + 1}</span>
                     {tabConfig[tabId].label}
                   </span>
                   <div className="flex gap-1">
                     <button onClick={() => moveTab(index, 'up')} disabled={index === 0} className="p-1.5 bg-white rounded-lg shadow-sm disabled:opacity-30 border border-gray-100"><ChevronUp size={14}/></button>
                     <button onClick={() => moveTab(index, 'down')} disabled={index === tabOrder.length - 1} className="p-1.5 bg-white rounded-lg shadow-sm disabled:opacity-30 border border-gray-100"><ChevronDown size={14}/></button>
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

      <main className="px-4 max-w-md mx-auto pt-4">
        {/* ==========================================
            1. 캘린더 탭 (우리가족) - 여백(Padding) 축소
            ========================================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-4 animate-in fade-in duration-500 pb-20">
            {/* 💡 개편된 부부 한줄 톡 (댓글 기능 & 시스템 자동 삭제) */}
            <div className="bg-emerald-50/80 rounded-[2rem] p-4 border border-emerald-200/60 shadow-sm relative">
               <h3 className="text-xs font-black text-emerald-600 mb-3 flex justify-between items-center">
                 <span className="flex items-center gap-1"><MessageSquareHeart size={14}/> 부부 한줄 톡 💌</span>
                 <button onClick={() => setIsMessageHistoryOpen(true)} className="text-gray-400 font-bold border-b border-gray-300 pb-0.5 active:text-emerald-500">보관소</button>
               </h3>
               
               <div className="space-y-2 mb-3">
                  {activeMessages.length === 0 && <div className="text-center text-gray-400 font-bold text-[10px] py-4 bg-white/50 rounded-2xl">메시지가 없습니다.</div>}
                  {activeMessages.map(m => (
                     <div key={m.id} className="bg-white p-3 rounded-2xl shadow-sm border border-emerald-100/50">
                        <div className="flex justify-between items-start mb-1">
                           <div className="text-[9px] text-gray-400 font-bold"><span className={`px-1.5 py-0.5 rounded mr-1 ${m.author==='시스템' ? 'bg-gray-100 text-gray-500' : m.author==='현아' ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'}`}>{m.author}</span>{m.createdAt.slice(5).replace('-','/')}</div>
                           {m.author === '시스템' ? (
                             <button onClick={() => handleArchiveOrDeleteMessage(m)} className="text-[9px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200 active:scale-90">확인(삭제)</button>
                           ) : (
                             <div className="flex gap-1">
                               <button onClick={() => setReplyingTo(replyingTo === m.id ? null : m.id)} className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 active:scale-90 flex items-center gap-0.5"><MessageCircle size={10}/> 답글</button>
                               <button onClick={() => handleArchiveOrDeleteMessage(m)} className="text-[9px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200 active:scale-90 flex items-center gap-0.5"><Archive size={10}/> 보관</button>
                             </div>
                           )}
                        </div>
                        <div className="text-sm font-black text-gray-800 leading-tight mb-2">{m.text}</div>
                        
                        {/* 댓글 렌더링 */}
                        {m.replies && m.replies.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-2.5 mt-2 space-y-1.5 border border-gray-100">
                             {m.replies.map((rep, idx) => (
                               <div key={idx} className="text-xs font-bold text-gray-700 flex gap-1.5">
                                 <span className="text-[9px] text-gray-400 shrink-0 mt-0.5">↳ {rep.author}:</span> <span>{rep.text}</span>
                               </div>
                             ))}
                          </div>
                        )}
                        
                        {/* 댓글 입력 폼 */}
                        {replyingTo === m.id && (
                          <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-100 animate-in slide-in-from-top-2">
                            <input value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="답글을 남겨주세요" className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold outline-none border border-gray-200" />
                            <button onClick={() => handleReplyMessage(m)} disabled={!replyText.trim()} className="bg-emerald-500 text-white px-3 rounded-xl text-xs font-black shadow-sm disabled:opacity-50">등록</button>
                          </div>
                        )}
                     </div>
                  ))}
               </div>
               
               <div className="flex gap-2 relative pt-3">
                  <div className="absolute -top-1 left-1 flex gap-1.5">
                    <button onClick={() => setMessageFormData({...messageFormData, author: '현아'})} className={`text-[9px] font-black px-2 py-0.5 rounded-t-lg transition-colors ${messageFormData.author==='현아' ? 'bg-white text-emerald-600 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]' : 'bg-transparent text-gray-400'}`}>현아</button>
                    <button onClick={() => setMessageFormData({...messageFormData, author: '정훈'})} className={`text-[9px] font-black px-2 py-0.5 rounded-t-lg transition-colors ${messageFormData.author==='정훈' ? 'bg-white text-emerald-600 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]' : 'bg-transparent text-gray-400'}`}>정훈</button>
                  </div>
                  <input value={messageFormData.text} onChange={e => setMessageFormData({...messageFormData, text: e.target.value})} placeholder="새로운 대화 시작하기" className="flex-1 bg-white rounded-xl px-3 py-2.5 text-sm font-bold outline-none border border-emerald-200 shadow-sm" />
                  <button onClick={handleSendMessage} disabled={!messageFormData.text.trim()} className="bg-emerald-500 text-white px-3.5 rounded-xl font-black shadow-md border border-emerald-600 active:scale-95 disabled:opacity-50">전송</button>
               </div>
            </div>

            <div className="pt-2"> 
              <div className="flex justify-between items-center mb-2 px-1">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5"><Stethoscope size={16} className="text-emerald-500"/> 현아 근무 스케줄</h3>
                <button onClick={() => {
                   setDutyBatchYear(selectedYear); setDutyBatchMonth(selectedMonth);
                   const current = {};
                   events.forEach(e => { if(e.type === '듀티' && e.date?.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2,'0')}`)) current[e.date] = e.title; });
                   setBatchDuties(current); setIsDutyBatchModalOpen(true);
                }} className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full font-bold border border-emerald-200 shadow-sm active:scale-95">한달 통째로 등록</button>
              </div>
              <div className="relative">
                <div ref={dutyTimelineRef} className="flex overflow-x-auto no-scrollbar gap-2 px-1 pb-2 pt-6 scroll-smooth"> 
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
                        key={d} id={isToday ? 'duty-today' : undefined} 
                        onClick={() => setSingleDutyModal({ isOpen: true, date: d, duty: duty, eventId: dutyEvent?.id || null })}
                        className={`flex-none w-[56px] p-2 rounded-2xl border shadow-sm flex flex-col items-center justify-center transition-all relative cursor-pointer active:scale-90 ${isToday ? 'ring-2 ring-emerald-400 bg-emerald-50 text-emerald-700 border-emerald-200' : color}`}
                      >
                        {isToday && <div className="text-[8px] font-black text-emerald-500 absolute -top-4 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm z-10 uppercase">Today</div>}
                        <div className="text-[9px] font-bold mb-1">{d.slice(5).replace('-','/')}</div>
                        <div className="text-[11px] font-black">{['일','월','화','수','목','금','토'][new Date(d).getDay()]}</div>
                        <div className="mt-1.5 text-xs font-black tracking-tighter">{duty}</div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-center mt-1 text-[9px] font-bold text-gray-400">날짜 박스를 터치하면 해당 일의 근무만 수정할 수 있습니다.</div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-200">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5 mb-3"><CalendarDays size={16} className="text-emerald-500"/> 가족 일정</h3>
              <div className="space-y-2">
                {events.filter(e => e.type !== '듀티' && e.date >= todayStr.slice(0,8)+'01').sort((a,b)=>a.date.localeCompare(b.date)).map(e => (
                   <div key={e.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <div>
                        <div className="text-[9px] font-black text-emerald-600">{e.date.slice(5).replace('-','/')} ({['일','월','화','수','목','금','토'][new Date(e.date).getDay()]})</div>
                        <div className="font-bold text-sm text-gray-800 flex items-center gap-1 mt-0.5">{e.title} {e.isImportant && <Star size={10} className="text-amber-400 fill-amber-400"/>}</div>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setEventFormData(e); setEditingEventId(e.id); setIsEventModalOpen(true); }} className="p-2 bg-white rounded-xl text-gray-400 shadow-sm border border-gray-100"><Edit3 size={12}/></button>
                        <button onClick={() => deleteEvent(e.id)} className="p-2 bg-white rounded-xl text-gray-400 shadow-sm border border-gray-100"><Trash2 size={12}/></button>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            2. 가계부 탭 (핑크 테마) - 여백 축소 및 폰트 조절
            ========================================== */}
        {activeTab === 'ledger' && (
          <div className="space-y-4 animate-in fade-in duration-500 pb-20">
            <div className="bg-gradient-to-r from-pink-400 to-rose-400 rounded-3xl p-5 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
               <div className="relative z-10">
                 <div className="text-[10px] font-bold opacity-90 mb-0.5">🌸 {selectedYear}년 누적 총 수입</div>
                 <div className="text-2xl font-black">{formatMoney(yearlyIncome)}<span className="text-sm ml-1 opacity-80">원</span></div>
               </div>
               <Heart className="w-14 h-14 opacity-20 absolute -right-2 -bottom-2 rotate-12" fill="white" />
            </div>
            
            {/* 💡 요약 폰트 크기 조절 (text-[11px] 유지) */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-pink-100">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-blue-50/60 p-2.5 rounded-2xl border border-blue-100 text-center overflow-hidden">
                  <div className="text-[9px] font-bold text-blue-500 mb-0.5">수입 합계 💰</div>
                  <div className="text-[11px] font-black text-gray-800 truncate">{formatMoney(ledgerSummary.income)}</div>
                </div>
                <div className="bg-rose-50/60 p-2.5 rounded-2xl border border-rose-100 text-center overflow-hidden">
                  <div className="text-[9px] font-bold text-rose-500 mb-0.5">지출 합계 💸</div>
                  <div className="text-[11px] font-black text-gray-800 truncate">{formatMoney(ledgerSummary.expense)}</div>
                </div>
                <div className="bg-purple-50/60 p-2.5 rounded-2xl border border-purple-100 text-center overflow-hidden">
                  <div className="text-[9px] font-bold text-purple-500 mb-0.5">남은 돈 ✨</div>
                  <div className="text-[11px] font-black text-purple-600 truncate">{formatMoney(ledgerSummary.net)}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 overflow-hidden">
                  <div className="text-[8px] font-bold text-gray-400 mb-0.5">순수 생활비 🍱</div>
                  <div className="text-[10px] font-black text-rose-500 truncate">{formatMoney(financialSummary.sumLiving)}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 overflow-hidden">
                  <div className="text-[8px] font-bold text-gray-400 mb-0.5">대출 원금 🏦</div>
                  <div className="text-[10px] font-black text-pink-500 truncate">{formatMoney(financialSummary.sumPrincipal)}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 overflow-hidden">
                  <div className="text-[8px] font-bold text-gray-400 mb-0.5">대출 이자 📉</div>
                  <div className="text-[10px] font-black text-purple-500 truncate">{formatMoney(financialSummary.sumInterest)}</div>
                </div>
              </div>
            </div>
            
            <div className="flex bg-pink-100/40 p-1.5 rounded-2xl"><button onClick={()=>setLedgerSubTab('daily')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${ledgerSubTab==='daily'?'bg-white text-pink-600 shadow-sm border border-pink-200/50':'text-gray-500'}`}>상세내역</button><button onClick={()=>setLedgerSubTab('calendar')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${ledgerSubTab==='calendar'?'bg-white text-pink-600 shadow-sm border border-pink-200/50':'text-gray-500'}`}><CalendarDays size={14}/> 달력</button><button onClick={()=>setLedgerSubTab('review')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${ledgerSubTab==='review'?'bg-white text-pink-600 shadow-sm border border-pink-200/50':'text-gray-500'}`}><PieChart size={14}/> 리포트</button></div>
            
            {ledgerSubTab === 'calendar' && (
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-pink-100 animate-in slide-in-from-bottom-2">
                <div className="grid grid-cols-7 gap-1 text-center mb-1.5">{['일','월','화','수','목','금','토'].map((d,i)=><div key={d} className={`text-[9px] font-bold ${i===0?'text-pink-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>)}</div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const first = new Date(selectedYear, selectedMonth - 1, 1).getDay();
                    const days = new Date(selectedYear, selectedMonth, 0).getDate();
                    const arr = Array.from({length: first}, () => null).concat(Array.from({length: days}, (_, i) => i + 1));
                    return arr.map((d, i) => {
                      if(!d) return <div key={i} className="h-[55px] bg-gray-50/30 rounded-xl" />;
                      const ds = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                      const inc = (ledger||[]).filter(t => t.date === ds && t.type === '수입').reduce((a,b)=>a+(b.amount||0),0);
                      const exp = (ledger||[]).filter(t => t.date === ds && t.type === '지출').reduce((a,b)=>a+(b.amount||0),0);
                      return (
                        <div key={i} className={`h-[55px] border rounded-xl p-0.5 flex flex-col items-center justify-start ${(inc||exp)?'border-pink-200 bg-pink-50/40 shadow-sm':'border-gray-50 bg-white'}`}>
                          <span className="text-[9px] font-bold mb-0.5">{d}</span>
                          {/* 💡 기호 수정 반영: 중복된 +- 제거 및 +,- 기호 직접 추가 */}
                          {inc > 0 && <span className="text-[8px] font-black text-blue-600 w-full text-center truncate">+{formatCompactMoney(inc)}</span>}
                          {exp > 0 && <span className="text-[8px] font-black text-rose-500 w-full text-center truncate">-{formatCompactMoney(exp)}</span>}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
            
            {ledgerSubTab === 'daily' && (
              <div className="space-y-3 animate-in slide-in-from-left">
                {ledgerDates.length === 0 && <div className="text-center py-20 text-gray-400 font-bold">내역이 없습니다.</div>}
                {ledgerDates.map(date => (
                  <div key={date} className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 mb-2 ml-1">{date.replace(/-/g, '.')}</div>
                    <div className="space-y-1.5">{(groupedLedger[date]||[]).map(t => (
                      <div key={t.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-2xl hover:bg-pink-50 transition-colors">
                        <div className="flex items-center gap-2"><div className={`p-2 rounded-xl ${t.type==='수입'?'bg-blue-100 text-blue-600':'bg-pink-100 text-pink-500'}`}>{getCategoryIcon(t.category, t.type)}</div><div><div className="text-[9px] font-bold text-gray-400">{t.category}</div><div className="font-bold text-xs text-gray-800">{t.note||t.category}</div></div></div>
                        <div className="flex items-center gap-2"><span className={`font-black text-[15px] ${t.type==='수입'?'text-blue-600':'text-gray-900'}`}>{formatMoney(t.amount)}</span>{isManageMode && <button onClick={()=>deleteTransaction(t.id)} className="text-gray-300 hover:text-red-500 bg-white p-1.5 rounded-lg shadow-sm border border-gray-100"><Trash2 size={12}/></button>}</div>
                      </div>
                    ))}</div>
                  </div>
                ))}
              </div>
            )}

            {ledgerSubTab === 'review' && (
              <div className="space-y-4 animate-in slide-in-from-right duration-300">
                {reviewData.expense.length > 0 && (
                  <div className="bg-white rounded-3xl p-5 shadow-md border border-pink-200/60">
                    <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center justify-between"><span>💸 지출 TOP 5</span><span className="text-rose-500">{formatMoney(ledgerSummary.expense)}원</span></h3>
                    <div className="space-y-3">
                      {reviewData.expense.map(([cat, amt], idx) => {
                        const pct = ledgerSummary.expense > 0 ? ((amt / ledgerSummary.expense) * 100).toFixed(1) : 0;
                        const colorClass = idx===0?'bg-rose-500':idx===1?'bg-pink-400':idx===2?'bg-fuchsia-400':'bg-gray-300';
                        return (
                          <div key={cat}>
                            <div className="flex justify-between items-end mb-1">
                              <div className="flex items-center gap-1.5"><span className={`w-3.5 h-3.5 flex items-center justify-center rounded-full text-[8px] font-black text-white ${colorClass}`}>{idx + 1}</span><span className="text-[11px] font-bold text-gray-700">{cat}</span></div>
                              <div className="text-right flex items-center gap-1.5"><div className="text-[11px] font-black text-gray-900">{formatMoney(amt)}원</div><div className="text-[8px] text-gray-400 font-bold bg-pink-50 px-1 py-0.5 rounded">{pct}%</div></div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden"><div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }}></div></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {reviewData.income.length > 0 && (
                  <div className="bg-white rounded-3xl p-5 shadow-md border border-blue-200/60">
                    <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center justify-between"><span>💰 수입 TOP 5</span><span className="text-blue-500">{formatMoney(ledgerSummary.income)}원</span></h3>
                    <div className="space-y-3">
                      {reviewData.income.map(([cat, amt], idx) => {
                        const pct = ledgerSummary.income > 0 ? ((amt / ledgerSummary.income) * 100).toFixed(1) : 0;
                        const colorClass = idx===0?'bg-blue-500':idx===1?'bg-blue-400':idx===2?'bg-cyan-400':'bg-gray-300';
                        return (
                          <div key={cat}>
                            <div className="flex justify-between items-end mb-1">
                              <div className="flex items-center gap-1.5"><span className={`w-3.5 h-3.5 flex items-center justify-center rounded-full text-[8px] font-black text-white ${colorClass}`}>{idx + 1}</span><span className="text-[11px] font-bold text-gray-700">{cat}</span></div>
                              <div className="text-right flex items-center gap-1.5"><div className="text-[11px] font-black text-gray-900">{formatMoney(amt)}원</div><div className="text-[8px] text-gray-400 font-bold bg-blue-50 px-1 py-0.5 rounded">{pct}%</div></div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden"><div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }}></div></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {reviewData.expense.length === 0 && reviewData.income.length === 0 && <div className="text-center py-20 text-gray-400 font-bold">내역이 없습니다.</div>}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            3. 배달 탭 (블루 테마) - 여백 축소
            ========================================== */}
        {activeTab === 'delivery' && (
          <div className="space-y-4 animate-in fade-in duration-500 pb-20">
            <div className="bg-white rounded-3xl p-4 shadow-md border border-blue-100">
               <div className="flex justify-between items-center mb-3"><div><h2 className="text-base font-black text-gray-800 flex items-center gap-1.5"><Play size={16} className="text-blue-500"/> 실시간 기록</h2><p className="text-[10px] text-blue-400 font-bold mt-0.5">시작 버튼을 눌러주세요</p></div>{timerActive && <span className="text-blue-500 animate-pulse font-black text-xs">배달중</span>}</div>
               <div className="flex gap-3">{timerActive ? <button onClick={handleEndDelivery} className="flex-1 bg-gray-900 text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 shadow-md"><Square size={14} fill="white"/> {Math.floor(elapsedSeconds/3600)}:{String(Math.floor((elapsedSeconds%3600)/60)).padStart(2,'0')} 종료</button> : <button onClick={handleStartDelivery} className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-200"><Play size={14} fill="white"/> 시작하기</button>}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {upcomingPaydays.length === 0 ? (
                <div className="col-span-2 bg-white rounded-2xl p-3 shadow-sm border border-blue-100 text-center text-gray-400 text-xs font-bold">대기 중인 정산금이 없습니다.</div>
              ) : (
                upcomingPaydays.slice(0,2).map((pd, idx) => {
                  const group = pendingByPayday[pd];
                  const isClosest = idx === 0;
                  return (
                    <div key={pd} className={`bg-white rounded-2xl p-3 shadow-sm border ${isClosest ? 'border-blue-300 bg-blue-50/50' : 'border-blue-100'} flex flex-col justify-between`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-black tracking-tighter ${isClosest ? "text-blue-600" : "text-gray-500"}`}>
                          {parseInt(pd.slice(5,7))}/{parseInt(pd.slice(8,10))} ({['일','월','화','수','목','금','토'][new Date(pd).getDay()]})
                        </span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-tighter shadow-sm ${isClosest ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {isClosest ? '이번주' : '다음주'}
                        </span>
                      </div>
                      <div className={`text-xl font-black tracking-tighter ${isClosest ? 'text-blue-600' : 'text-gray-700'} mb-1`}>
                        {formatMoney(group.total)}
                      </div>
                      <div className="text-[8px] font-bold text-gray-400 flex justify-between">
                        <span>훈 {formatMoney(group.junghoon)}</span>
                        <span>현 {formatMoney(group.hyuna)}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <h2 className="text-[11px] font-bold mb-1 opacity-90">{selectedMonth}월 배달 수익</h2>
              <div className="text-3xl font-black mb-1">{formatMoney(deliveryFilteredTotal)}<span className="text-sm opacity-80 ml-1">원</span></div>
              <div className="flex gap-2 text-[9px] font-bold mb-4 opacity-90">
                 <span>2026 누적: +{formatCompactMoney(deliveryYearlyTotal)}</span>
                 <span>총 {formatMoney(deliveryFilteredCount)}건</span>
                 <span>평단 {formatMoney(deliveryAvgPerDelivery)}원</span>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <div><div className="text-[9px] font-bold mb-0.5 opacity-80 flex justify-between">정훈 <span>{filteredJunghoonItems.reduce((a,b)=>a+(b.count||0),0)}건</span></div><div className="text-lg font-black">{formatMoney(filteredJunghoonItems.reduce((a,b)=>a+(b.amount||0),0))}</div></div>
                <div className="border-l border-white/20 pl-3"><div className="text-[9px] font-bold mb-0.5 opacity-80 flex justify-between">현아 <span>{filteredHyunaItems.reduce((a,b)=>a+(b.count||0),0)}건</span></div><div className="text-lg font-black">{formatMoney(filteredHyunaItems.reduce((a,b)=>a+(b.amount||0),0))}</div></div>
              </div>
            </div>
            
            <div className="flex bg-blue-50/50 p-1.5 rounded-2xl"><button onClick={()=>setDeliverySubTab('daily')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${deliverySubTab==='daily'?'bg-white text-blue-600 shadow-sm':'text-gray-400'}`}>상세내역</button><button onClick={()=>setDeliverySubTab('calendar')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${deliverySubTab==='calendar'?'bg-white text-blue-600 shadow-sm':'text-gray-400'}`}>달력</button><button onClick={()=>setDeliverySubTab('weekly')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${deliverySubTab==='weekly'?'bg-white text-blue-600 shadow-sm':'text-gray-400'}`}>주차별</button></div>
            
            <div className="space-y-3">
              {deliverySubTab === 'daily' && dailyDates.map(date => {
                const dayMetrics = calcDailyMetrics(groupedDaily[date]);
                return (
                  <div key={date} className="bg-white rounded-3xl p-4 shadow-sm border border-blue-50">
                    <div className="flex justify-between items-start border-b border-gray-50 pb-2 mb-2">
                      <div>
                        <span className="font-black text-gray-800 flex items-center gap-1 text-[11px] mb-0.5"><CalendarCheck size={12} className="text-blue-500"/>{date}</span>
                        {dayMetrics.durationStr && <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1"><Timer size={10}/> {dayMetrics.durationStr} 근무</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-blue-600 mb-0.5">{formatMoney(dayMetrics.totalAmt)}원</div>
                        <div className="text-[8px] text-gray-400 font-bold flex gap-1 justify-end"><span className="bg-gray-50 px-1 py-0.5 rounded">총 {dayMetrics.totalCnt}건</span>{dayMetrics.hourlyRate > 0 && <span className="bg-blue-50 text-blue-500 px-1 py-0.5 rounded">시급 {formatMoney(dayMetrics.hourlyRate)}</span>}</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">{(groupedDaily[date]||[]).map(d => {
                      const pDay = getPaydayStr(d.date);
                      const isPending = pDay && pDay >= todayStr;
                      return (
                        <div key={d.id} className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-2xl text-xs hover:bg-blue-50 transition-colors">
                          <div className="flex items-center gap-2.5"><div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-black text-[9px] ${d.platform === '배민' ? 'bg-[#2ac1bc]' : d.platform === '쿠팡' ? 'bg-[#111111]' : 'bg-gray-400'}`}>{d.platform}</div><div><div className="font-bold text-gray-800 text-xs">{d.earner} <span className="text-gray-400 text-[9px]">| {d.count}건 {d.startTime ? `(${d.startTime}~${d.endTime})` : ''}</span></div><div className={`text-[9px] font-bold mt-0.5 ${isPending ? 'text-blue-400' : 'text-gray-400'}`}>{isPending && typeof pDay === 'string' && pDay.length >= 10 ? `${pDay.slice(5,10).replace('-','/')} 입금 대기` : '정산 완료'}</div></div></div>
                          <div className="flex items-center gap-2"><span className="font-black text-[15px]">{formatMoney(d.amount)}원</span>{isManageMode && <button onClick={() => {
                            setDeliveryFormData({
                              date: d.date, earner: d.earner, platform: d.platform, amount: String(d.amount||''),
                              count: String(d.count || ''), startTime: d.startTime || '', endTime: d.endTime || '',
                              amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', 
                              amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '' 
                            });
                            setEditingDeliveryId(d.id);
                            setIsDeliveryModalOpen(true);
                          }} className="text-gray-400 hover:text-blue-500 bg-white p-1.5 rounded-lg shadow-sm border border-gray-100"><Edit3 size={12}/></button>}{isManageMode && <button onClick={()=>deleteDailyDelivery(d.id)} className="text-gray-300 hover:text-red-500 bg-white p-1.5 rounded-lg shadow-sm border border-gray-100"><Trash2 size={12}/></button>}</div>
                        </div>
                      );
                    })}</div>
                  </div>
                )
              })}
              {deliverySubTab === 'weekly' && Object.keys(paydayGroups).sort((a,b)=>b.localeCompare(a)).map(pd => (
                <div key={pd} className="bg-white rounded-3xl p-4 shadow-sm border border-blue-50 flex justify-between items-center">
                  <div><div className="text-[9px] text-gray-400 font-bold mb-1">{pd} 입금완료</div><div className="font-black text-gray-800 text-sm">{parseInt(pd.slice(5,7))}월 {getWeekOfMonth(pd)}주차 정산</div></div>
                  <div className="text-right"><div className="text-lg font-black text-blue-600">{formatMoney(paydayGroups[pd].total)}원</div><div className="text-[9px] text-gray-400 font-bold mt-0.5">훈 {formatMoney(paydayGroups[pd].junghoon)} | 현 {formatMoney(paydayGroups[pd].hyuna)}</div></div>
                </div>
              ))}
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
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-blue-100 animate-in slide-in-from-bottom-2 mt-1">
                   <div className="grid grid-cols-7 gap-1 text-center mb-2">
                     {['일','월','화','수','목','금','토'].map((d,i) => <div key={d} className={`text-[9px] font-bold ${i===0?'text-red-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>)}
                   </div>
                   <div className="grid grid-cols-7 gap-1">
                     {days.map((d, i) => {
                       if(!d) return <div key={`empty-${i}`} className="h-12 bg-gray-50/30 rounded-xl border border-gray-50"></div>;
                       const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                       const dayData = dataByDate[dateStr] || { amt: 0 };
                       const hasData = dayData.amt > 0;
                       
                       return (
                         <div key={`day-${i}`} className={`h-12 border rounded-xl flex flex-col items-center justify-center ${hasData?'border-blue-200 bg-blue-50/40 shadow-sm':'border-gray-100 bg-white'}`}>
                           <span className={`text-[9px] font-bold mb-0.5 ${(i%7)===0?'text-red-400':(i%7)===6?'text-blue-400':'text-gray-600'}`}>{d}</span>
                           {hasData && (
                             <span className="text-[8px] font-black text-blue-600 w-full text-center truncate">{formatCompactMoney(dayData.amt).replace('+','')}</span>
                           )}
                         </div>
                       )
                     })}
                   </div>
                </div>
              );
            })()}
            </div>
          </div>
        )}

        {/* ==========================================
            4. 자산 및 대출 탭 
            ========================================== */}
        {activeTab === 'loans' && (
          <div className="space-y-5 pb-28 pt-2 animate-in slide-in-from-right duration-500">
             <section>
              <div className="flex justify-between items-center mb-3 px-2">
                <h3 className="text-base font-black text-gray-900">부채 상환 현황</h3>
              </div>
              
              <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden mb-4">
                <Landmark className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10" />
                <div className="relative z-10">
                  <div className="text-indigo-200 text-[10px] font-bold mb-1 uppercase tracking-widest">총 대출 잔액</div>
                  <div className="text-3xl font-black mb-5 tracking-tight">{formatMoney(totalPrincipal)}원</div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-[11px] text-indigo-100 font-bold">이번 달 납입 예정</span>
                    <span className="text-lg font-black text-white">{formatMoney(totalMonthlyPayment)}원</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {sortedLoans.map(loan => (
                  <div key={loan.id} className={`bg-white rounded-3xl p-5 shadow-sm border ${loan.status === '완납' ? 'opacity-50 border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-3">
                       <span className="font-bold text-gray-800 text-base">{loan.name} {loan.status === '완납' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-1 inline-block"/>}</span>
                       <span className="text-[9px] bg-red-50 text-red-500 px-2 py-1 rounded-md font-black">매월 {loan.paymentDate}일</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <div><div className="text-[9px] text-gray-400 font-bold mb-0.5">잔액</div><div className="text-lg font-black">{formatMoney(loan.principal)}원</div></div>
                       <div className="text-right"><div className="text-[9px] text-gray-400 font-bold mb-0.5">{loan.paymentMethod}</div><div className="text-indigo-600 font-black text-sm">{formatMoney(getMonthlyPayment(loan))}원</div></div>
                    </div>
                  </div>
                ))}
              </div>
             </section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-4 right-4 h-[68px] bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 flex justify-around items-center z-40 px-2">
        {tabOrder.map((tabId) => {
          const config = tabConfig[tabId];
          const Icon = config.icon;
          const isActive = activeTab === tabId;
          return (
            <button key={tabId} onClick={() => setActiveTab(tabId)} className={`flex flex-col items-center w-14 transition-all ${isActive ? `${config.colorClass} scale-110` : 'text-gray-400 hover:text-gray-500'}`}>
              <Icon size={20}/> <span className="text-[9px] font-black mt-1">{config.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 💡 플로팅 버튼 (모달 열 때 키보드 올라오는 버그 방지를 위해 autoFocus 속성 제거) */}
      {activeTab === 'ledger' && <button onClick={() => { setFormData({ date: todayStr, type: '지출', amount: '', category: getSortedCategories('지출')[0]||'식비', note: '' }); setIsModalOpen(true); }} className="fixed bottom-[96px] right-5 bg-pink-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 z-30 border border-pink-400"><Plus size={24}/></button>}
      {activeTab === 'calendar' && <button onClick={() => { setEventFormData({ date: todayStr, title: '', type: '가족일정', isImportant: false }); setEditingEventId(null); setIsEventModalOpen(true); }} className="fixed bottom-[96px] right-5 bg-emerald-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 z-30 border border-emerald-400"><Plus size={24}/></button>}
      {activeTab === 'delivery' && !timerActive && <button onClick={() => { setDeliveryFormData({ date: todayStr, earner: currentUser === '정훈' ? '정훈' : '현아', platform: '배민', amount: '', count: '', startTime: '', endTime: '', amountHyunaBaemin: '', countHyunaBaemin: '', amountHyunaCoupang: '', countHyunaCoupang: '', amountJunghoonBaemin: '', countJunghoonBaemin: '', amountJunghoonCoupang: '', countJunghoonCoupang: '' }); setEditingDeliveryId(null); setIsDeliveryModalOpen(true); }} className="fixed bottom-[96px] right-5 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 z-30 border border-blue-500"><Plus size={24}/></button>}

      {/* 💡 듀티 단건 수정 모달 (바텀시트) */}
      {singleDutyModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70]">
          <div className="bg-white w-full max-w-sm rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-emerald-100 pb-safe">
             <div className="text-center mb-5">
                <div className="text-[10px] font-bold text-emerald-500 mb-1">{singleDutyModal.date}</div>
                <h2 className="text-xl font-black text-gray-800">현아 근무 변경</h2>
             </div>
             <div className="grid grid-cols-2 gap-2 mb-5">
                <button onClick={() => handleSingleDutySave('DAY')} className="py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-base border border-blue-100 shadow-sm active:scale-95">DAY</button>
                <button onClick={() => handleSingleDutySave('EVE')} className="py-3 bg-orange-50 text-orange-600 rounded-xl font-black text-base border border-orange-100 shadow-sm active:scale-95">EVE</button>
                <button onClick={() => handleSingleDutySave('NIGHT')} className="py-3 bg-purple-50 text-purple-600 rounded-xl font-black text-base border border-purple-100 shadow-sm active:scale-95">NIGHT</button>
                <button onClick={() => handleSingleDutySave('OFF')} className="py-3 bg-pink-50 text-pink-600 rounded-xl font-black text-base border border-pink-100 shadow-sm active:scale-95">OFF</button>
             </div>
             <div className="flex gap-2">
               <button onClick={() => handleSingleDutySave('삭제')} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm active:scale-95">기록 삭제</button>
               <button onClick={closeModals} className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-bold text-sm active:scale-95">취소</button>
             </div>
          </div>
        </div>
      )}

      {/* 💡 가계부 기록 모달 (바텀시트 & 입력폼 겹침 방지 수정) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[60]">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 pb-12">
            <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-black text-gray-800">내역 기록</h2><button onClick={closeModals} className="bg-gray-100 p-2 rounded-xl"><X size={18}/></button></div>
            <form onSubmit={handleTransactionSubmit} className="space-y-5">
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-inner"><button type="button" onClick={() => setFormData({...formData, type:'지출'})} className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${formData.type==='지출'?'bg-white text-pink-500 shadow-sm border border-pink-100':'text-gray-500'}`}>지출하기</button><button type="button" onClick={() => setFormData({...formData, type:'수입'})} className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${formData.type==='수입'?'bg-white text-blue-500 shadow-sm border border-blue-100':'text-gray-500'}`}>수입얻기</button></div>
              <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">금액 (원)</label><div className="relative"><input type="text" value={formData.amount ? formatMoney(formData.amount) : ''} onChange={e => setFormData({...formData, amount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className={`w-full text-4xl font-black border-b-2 border-gray-100 pb-2 outline-none transition-colors bg-transparent ${formData.type === '수입' ? 'focus:border-blue-400' : 'focus:border-pink-400'}`} /><span className="absolute right-2 bottom-3 text-lg font-black text-gray-300">원</span></div></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase">날짜</label><input type="date" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 font-bold text-[11px] outline-none border border-gray-200 focus:ring-2 ring-pink-100" /></div>
                <div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase">분류</label><select value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 font-bold text-[11px] outline-none border border-gray-200">{(CATEGORIES[formData.type]||[]).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <button type="submit" className={`w-full ${formData.type === '수입' ? 'bg-blue-500 border-blue-600' : 'bg-pink-500 border-pink-600'} py-4 rounded-xl text-white font-black text-lg active:scale-95 transition-all shadow-md`}>기록 완료 ✨</button>
            </form>
          </div>
        </div>
      )}

      {/* 💡 일정 등록 모달 (바텀시트) */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[60]">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-emerald-100 pb-12">
            <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-black text-gray-900">{editingEventId ? '일정 수정 🌿' : '새 일정 등록 🌿'}</h2><button onClick={closeModals} className="bg-gray-100 p-2 rounded-xl"><X size={18}/></button></div>
            <form onSubmit={handleEventSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase">분류</label><select value={eventFormData.type} onChange={(e) => setEventFormData({...eventFormData, type: e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold outline-none border border-gray-200 focus:ring-2 ring-emerald-200"><option value="가족일정">가족일정</option><option value="회식">회식</option><option value="기타">기타</option></select></div><div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase">날짜</label><input type="date" value={eventFormData.date} onChange={e=>setEventFormData({...eventFormData, date:e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold outline-none border border-gray-200 focus:ring-2 ring-emerald-200" /></div></div>
              <div><label className="text-[10px] font-black text-gray-400 ml-1 block uppercase">일정 내용</label><input type="text" value={eventFormData.title} onChange={e=>setEventFormData({...eventFormData, title:e.target.value})} placeholder="어머님 생신 등" className="w-full bg-white rounded-xl p-3 text-sm font-black outline-none border border-gray-200 focus:ring-2 ring-emerald-200 shadow-sm" /></div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center justify-between"><div><div className="text-xs font-black text-amber-700 flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400"/> 중요 일정</div><div className="text-[9px] text-amber-600 font-bold">강조되어 표시됩니다.</div></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={eventFormData.isImportant} onChange={e => setEventFormData({...eventFormData, isImportant: e.target.checked})} /><div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div></label></div>
              <button type="submit" className="w-full bg-emerald-500 mt-2 py-4 rounded-xl text-white font-black text-base active:scale-95 transition-all shadow-md shadow-emerald-200 border border-emerald-600">완료 🌿</button>
            </form>
          </div>
        </div>
      )}

      {/* 💡 듀티 한달 일괄 등록 모달 (바텀시트) */}
      {isDutyBatchModalOpen && (() => {
        const first = new Date(dutyBatchYear, dutyBatchMonth - 1, 1).getDay();
        const days = new Date(dutyBatchYear, dutyBatchMonth, 0).getDate();
        const arr = Array.from({length: first}, () => null).concat(Array.from({length: days}, (_, i) => i + 1));
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end justify-center z-[70]">
            <div className="bg-white w-full max-w-md rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto pb-12">
              <div className="flex justify-between items-center mb-4"><div><h2 className="text-xl font-black text-gray-900">한달 스케쥴 등록</h2><div className="text-[10px] text-gray-500 font-bold">{isDutyBatchEditMode ? '도장 선택 후 날짜를 터치!' : '수정 버튼을 누르세요.'}</div></div><button onClick={closeModals} className="bg-gray-100 text-gray-500 p-2 rounded-xl active:scale-95"><X size={18}/></button></div>
              {isDutyBatchEditMode && (<div className="flex justify-between gap-1 bg-gray-50 p-1.5 rounded-xl mb-3 border border-gray-200"><button onClick={() => setSelectedStamp('DAY')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${selectedStamp === 'DAY' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>DAY</button><button onClick={() => setSelectedStamp('EVE')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${selectedStamp === 'EVE' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>EVE</button><button onClick={() => setSelectedStamp('OFF')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${selectedStamp === 'OFF' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>OFF</button><button onClick={() => setSelectedStamp('DELETE')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${selectedStamp === 'DELETE' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>지우개</button></div>)}
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-4"><div className="flex justify-between items-center mb-3 px-2"><button onClick={() => setDutyBatchMonth(p => p === 1 ? 12 : p - 1)} className="p-1"><ChevronLeft size={16}/></button><span className="font-black text-emerald-600 text-sm">{dutyBatchYear}년 {dutyBatchMonth}월</span><button onClick={() => setDutyBatchMonth(p => p === 12 ? 1 : p + 1)} className="p-1"><ChevronRight size={16}/></button></div><div className="grid grid-cols-7 gap-1 text-center mb-1.5">{['일','월','화','수','목','금','토'].map((d,i) => <div key={d} className={`text-[9px] font-bold ${i===0?'text-red-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>)}</div><div className="grid grid-cols-7 gap-1">{arr.map((d, i) => { if(!d) return <div key={i} className="h-10 bg-transparent rounded-lg"></div>; const ds = `${dutyBatchYear}-${String(dutyBatchMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const duty = batchDuties[ds]; let bg = 'bg-gray-50 border-gray-100 text-gray-800'; if (duty === 'DAY') bg = 'bg-blue-50 border-blue-200 text-blue-600'; if (duty === 'EVE') bg = 'bg-orange-50 border-orange-200 text-orange-600'; if (duty === 'OFF') bg = 'bg-pink-50 border-pink-200 text-pink-600'; return (<button key={ds} onClick={() => handleDutyCellClick(ds)} className={`h-10 border rounded-lg flex flex-col items-center justify-center transition-transform ${isDutyBatchEditMode ? 'active:scale-90' : 'cursor-default'} ${bg}`}><span className="text-[9px] font-bold opacity-80">{d}</span>{duty && <span className="text-[10px] font-black tracking-tighter leading-tight mt-0.5">{duty}</span>}</button>)})}</div></div>
              {isDutyBatchEditMode ? (<button onClick={saveBatchDuties} className="w-full bg-emerald-500 py-3.5 rounded-xl text-white font-black text-base active:scale-95 transition-transform shadow-md shadow-emerald-200">변경사항 저장</button>) : (<button onClick={() => setIsDutyBatchEditMode(true)} className="w-full bg-gray-100 py-3.5 rounded-xl text-gray-600 font-black text-base active:scale-95 transition-transform border border-gray-200">수정 모드 켜기</button>)}
            </div>
          </div>
        );
      })()}

      {/* 💡 배달 기록 모달 (바텀시트 & 입력 폼 겹침 방지 세로 배열) */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[60]">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-blue-500 max-h-[90vh] overflow-y-auto pb-12">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-black text-gray-900">{editingDeliveryId ? '배달 기록 수정' : '배달 수익 기록 🛵'}</h2><button onClick={closeModals} className="bg-gray-100 p-2 rounded-xl"><X size={18}/></button></div>
            <form onSubmit={async (e) => {
               e.preventDefault();
               if (!deliveryFormData.amount && !deliveryFormData.amountJunghoonBaemin && !deliveryFormData.amountHyunaCoupang && !deliveryFormData.amountJunghoonCoupang && !deliveryFormData.amountHyunaBaemin) return;
               
               if (editingDeliveryId) {
                  const newDel = { ...deliveryFormData, amount: parseInt(String(deliveryFormData.amount).replace(/,/g, ''), 10), count: parseInt(deliveryFormData.count) || 0 };
                  if (isFirebaseEnabled) {
                     await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'delivery', editingDeliveryId), newDel);
                     logEvent('배달 수정', `${newDel.date} 수익 수정`);
                  }
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

                  if (adds.length > 0 && isFirebaseEnabled) {
                     for(const newDel of adds) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'delivery'), newDel);
                     logEvent('배달 일괄 기록', `${deliveryFormData.date} 배달 수익 동시 기록`);
                  }
               }
               showToast("수익이 기록되었습니다! 수고하셨습니다 👏"); closeModals();
            }} className="space-y-4">
              <div className="bg-gradient-to-br from-blue-900 to-slate-800 p-3 rounded-xl text-white shadow-md flex justify-around">
                <div className="text-center"><div className="text-[9px] font-bold text-blue-200 mb-0.5">예상 시급</div><div className="font-black text-cyan-400 text-base">{formatMoney(calcDailyMetrics([deliveryFormData]).hourlyRate)}원</div></div>
                <div className="w-px bg-blue-700/50 mx-2"></div>
                <div className="text-center"><div className="text-[9px] font-bold text-blue-200 mb-0.5">건당 평단</div><div className="font-black text-blue-300 text-base">{formatMoney(calcDailyMetrics([deliveryFormData]).perDelivery)}원</div></div>
              </div>

              {editingDeliveryId ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[9px] font-black text-gray-400 ml-1 block uppercase">수익자</label><div className="flex bg-gray-50 border border-gray-200 p-1 rounded-lg"><button type="button" onClick={()=>setDeliveryFormData({...deliveryFormData, earner:'정훈'})} className={`flex-1 py-1.5 rounded-md text-xs font-black transition-all ${deliveryFormData.earner==='정훈'?'bg-white text-blue-600 shadow-sm border border-blue-100':'text-gray-500'}`}>정훈</button><button type="button" onClick={()=>setDeliveryFormData({...deliveryFormData, earner:'현아'})} className={`flex-1 py-1.5 rounded-md text-xs font-black transition-all ${deliveryFormData.earner==='현아'?'bg-white text-blue-600 shadow-sm border border-blue-100':'text-gray-500'}`}>현아</button></div></div>
                    <div><label className="text-[9px] font-black text-gray-400 ml-1 block uppercase">플랫폼</label><div className="flex bg-gray-50 border border-gray-200 p-1 rounded-lg"><button type="button" onClick={()=>setDeliveryFormData({...deliveryFormData, platform:'배민'})} className={`flex-1 py-1.5 rounded-md text-xs font-black transition-all ${deliveryFormData.platform==='배민'?'bg-[#2ac1bc] text-white':'text-gray-500'}`}>배민</button><button type="button" onClick={()=>setDeliveryFormData({...deliveryFormData, platform:'쿠팡'})} className={`flex-1 py-1.5 rounded-md text-xs font-black transition-all ${deliveryFormData.platform==='쿠팡'?'bg-[#111111] text-white':'text-gray-500'}`}>쿠팡</button></div></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1"><label className="text-[9px] font-black text-gray-400 ml-1 block">수익금</label><div className="relative"><input type="text" value={deliveryFormData.amount ? formatMoney(deliveryFormData.amount) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amount: e.target.value.replace(/[^0-9]/g, '')})} placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-black text-sm outline-none focus:ring-2 ring-blue-200" /><span className="absolute right-3 top-3 text-xs font-black text-gray-400">원</span></div></div>
                    <div className="w-24"><label className="text-[9px] font-black text-gray-400 ml-1 block">건수</label><div className="relative"><input type="number" value={deliveryFormData.count} onChange={e=>setDeliveryFormData({...deliveryFormData, count:e.target.value})} placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-black text-sm outline-none focus:ring-2 ring-blue-200" /><span className="absolute right-3 top-3 text-xs font-black text-gray-400">건</span></div></div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <div className="font-black text-blue-700 mb-1.5 text-xs">🧑 정훈 수익</div>
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center"><span className="text-[9px] font-bold bg-[#2ac1bc] text-white px-1.5 py-1 rounded w-8 text-center shrink-0">배민</span><input type="text" value={deliveryFormData.amountJunghoonBaemin ? formatMoney(deliveryFormData.amountJunghoonBaemin) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountJunghoonBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="금액" className="flex-1 text-xs font-black bg-white rounded-lg p-2 outline-none border border-blue-200" /><input type="number" value={deliveryFormData.countJunghoonBaemin} onChange={e => setDeliveryFormData({...deliveryFormData, countJunghoonBaemin: e.target.value})} placeholder="건" className="w-12 text-xs font-black bg-white rounded-lg p-2 outline-none border border-blue-200" /></div>
                      <div className="flex gap-2 items-center"><span className="text-[9px] font-bold bg-[#111111] text-white px-1.5 py-1 rounded w-8 text-center shrink-0">쿠팡</span><input type="text" value={deliveryFormData.amountJunghoonCoupang ? formatMoney(deliveryFormData.amountJunghoonCoupang) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountJunghoonCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="금액" className="flex-1 text-xs font-black bg-white rounded-lg p-2 outline-none border border-blue-200" /><input type="number" value={deliveryFormData.countJunghoonCoupang} onChange={e => setDeliveryFormData({...deliveryFormData, countJunghoonCoupang: e.target.value})} placeholder="건" className="w-12 text-xs font-black bg-white rounded-lg p-2 outline-none border border-blue-200" /></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="font-black text-slate-700 mb-1.5 text-xs">👩 현아 수익</div>
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center"><span className="text-[9px] font-bold bg-[#2ac1bc] text-white px-1.5 py-1 rounded w-8 text-center shrink-0">배민</span><input type="text" value={deliveryFormData.amountHyunaBaemin ? formatMoney(deliveryFormData.amountHyunaBaemin) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountHyunaBaemin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="금액" className="flex-1 text-xs font-black bg-white rounded-lg p-2 outline-none border border-slate-200" /><input type="number" value={deliveryFormData.countHyunaBaemin} onChange={e => setDeliveryFormData({...deliveryFormData, countHyunaBaemin: e.target.value})} placeholder="건" className="w-12 text-xs font-black bg-white rounded-lg p-2 outline-none border border-slate-200" /></div>
                      <div className="flex gap-2 items-center"><span className="text-[9px] font-bold bg-[#111111] text-white px-1.5 py-1 rounded w-8 text-center shrink-0">쿠팡</span><input type="text" value={deliveryFormData.amountHyunaCoupang ? formatMoney(deliveryFormData.amountHyunaCoupang) : ''} onChange={e => setDeliveryFormData({...deliveryFormData, amountHyunaCoupang: e.target.value.replace(/[^0-9]/g, '')})} placeholder="금액" className="flex-1 text-xs font-black bg-white rounded-lg p-2 outline-none border border-slate-200" /><input type="number" value={deliveryFormData.countHyunaCoupang} onChange={e => setDeliveryFormData({...deliveryFormData, countHyunaCoupang: e.target.value})} placeholder="건" className="w-12 text-xs font-black bg-white rounded-lg p-2 outline-none border border-slate-200" /></div>
                    </div>
                  </div>
                </>
              )}

              {/* 💡 좁은 화면 글씨 겹침을 방지하기 위한 가로 3분할 폼 */}
              <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
                 <div><label className="text-[9px] font-black text-gray-400 ml-1 block">시작</label><input type="time" value={deliveryFormData.startTime} onChange={e=>setDeliveryFormData({...deliveryFormData, startTime:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-bold text-[10px] outline-none" /></div>
                 <div><label className="text-[9px] font-black text-gray-400 ml-1 block">종료</label><input type="time" value={deliveryFormData.endTime} onChange={e=>setDeliveryFormData({...deliveryFormData, endTime:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-bold text-[10px] outline-none" /></div>
                 <div><label className="text-[9px] font-black text-gray-400 ml-1 block">날짜</label><input type="date" value={deliveryFormData.date} onChange={e=>setDeliveryFormData({...deliveryFormData, date:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-bold text-[10px] outline-none" /></div>
              </div>
              <button type="submit" disabled={!editingDeliveryId && !(deliveryFormData.amountHyunaBaemin || deliveryFormData.amountHyunaCoupang || deliveryFormData.amountJunghoonBaemin || deliveryFormData.amountJunghoonCoupang)} className="w-full bg-blue-600 mt-2 py-3.5 rounded-xl text-white font-black text-base active:scale-95 transition-all shadow-md disabled:opacity-50">저장 완료 🚀</button>
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

      {/* 💡 과거 메시지 보관소 (모달 디자인 통일) */}
      {isMessageHistoryOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-[70] pb-8">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border border-pink-100 max-h-[85vh] overflow-y-auto no-scrollbar pb-12">
            <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-black text-gray-800">💌 메시지 기록 보관소</h2><button onClick={closeModals} className="bg-gray-100 p-2 rounded-xl"><X size={16}/></button></div>
            <div className="space-y-3">
               {messages.filter(m => m.isChecked).length === 0 && <div className="text-center text-gray-400 font-bold py-10 text-xs">보관된 내역이 없습니다.</div>}
               {messages.filter(m => m.isChecked).sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(m => (
                 <div key={m.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
                   <div className="flex justify-between items-start mb-1">
                      <div className="text-[9px] text-gray-400 font-bold">
                        <span className={`px-1.5 py-0.5 rounded mr-1 ${m.author === '시스템' ? 'bg-gray-200 text-gray-600' : m.author === '현아' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>{m.author}</span>
                        {typeof m.createdAt === 'string' && m.createdAt.replace(/-/g,'.')}
                      </div>
                      <span className="text-[8px] font-black text-gray-400 flex items-center gap-0.5"><Archive size={10}/> 보관됨</span>
                   </div>
                   <div className="text-xs font-bold text-gray-700 leading-relaxed mb-1">{m.text}</div>
                   {m.replies && m.replies.length > 0 && (
                      <div className="bg-white rounded-lg p-2 mt-2 space-y-1 border border-gray-100">
                         {m.replies.map((rep, idx) => (
                           <div key={idx} className="text-[10px] font-bold text-gray-600 flex gap-1">
                             <span className="text-gray-300 shrink-0 mt-0.5">↳ {rep.author}:</span> <span>{rep.text}</span>
                           </div>
                         ))}
                      </div>
                   )}
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// 💡 오류 화면(ErrorBoundary) - 버그 방어막 완벽 복구
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
            <p className="text-xs text-gray-500 mb-4 leading-relaxed font-bold text-center">위의 검은색 화면을 캡처해서 전달해주세요!</p>
            <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-black active:scale-95 transition-transform shadow-md">새로고침 (홈으로 복구하기)</button>
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
