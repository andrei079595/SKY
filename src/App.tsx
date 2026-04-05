/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  Filter,
  Save, 
  Edit3, 
  LayoutDashboard, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Plane,
  BarChart3,
  File,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Cloud,
  Thermometer,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Wind,
  CloudDrizzle,
  CloudSun,
  Share2,
  Users,
  Copy,
  Check,
  Mail,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import Chart from 'react-apexcharts';
import { 
  format, 
  addDays, 
  differenceInDays, 
  parseISO, 
  isWithinInterval, 
  eachDayOfInterval,
  isValid,
  isToday,
  isFuture,
  isPast,
  startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TripData, CountryVisit, DayPlan, Activity, Attachment } from './types';
import { TripMap } from './components/TripMap';
import { Logo } from './components/Logo';
import { EUROPE_DATA } from './constants';
import { auth, db, googleProvider } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Componente de botón de Google estándar
const GoogleButton = ({ onClick, className, hideTextOnMobile = false }: { onClick: () => void, className?: string, hideTextOnMobile?: boolean }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] group",
      className
    )}
  >
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
    </svg>
    <span className={cn("text-white font-bold text-sm whitespace-nowrap", hideTextOnMobile && "hidden sm:inline")}>
      Entrar con Google
    </span>
  </button>
);

// Componente de clima
const WeatherWidget = ({ city, country }: { city: string, country: string }) => {
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const countryData = EUROPE_DATA[country];
        if (!countryData) return;
        const coords = countryData.cities[city];
        if (!coords) return;

        const [lng, lat] = coords;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,weathercode`);
        const data = await res.json();
        setWeather(data.current_weather);
        
        // Procesar forecast (próximas 24 horas)
        const now = new Date();
        const currentHour = now.getHours();
        const hourlyData = [];
        
        for (let i = 1; i <= 24; i++) {
          const index = currentHour + i;
          if (data.hourly && data.hourly.time[index]) {
            hourlyData.push({
              time: data.hourly.time[index].split('T')[1],
              temp: data.hourly.temperature_2m[index],
              code: data.hourly.weathercode[index]
            });
          }
        }
        setForecast(hourlyData);
      } catch (e) {
        console.error("Error fetching weather", e);
      } finally {
        setLoading(false);
      }
    };

    if (city && country) {
      fetchWeather();
    }
  }, [city, country]);

  const getWeatherIcon = (code: number, size = 24) => {
    if (code === 0) return <Sun className="text-yellow-400" size={size} />;
    if (code >= 1 && code <= 3) return <CloudSun className="text-stone-400" size={size} />;
    if (code >= 45 && code <= 48) return <Wind className="text-stone-500" size={size} />;
    if (code >= 51 && code <= 67) return <CloudRain className="text-blue-400" size={size} />;
    if (code >= 71 && code <= 77) return <CloudSnow className="text-white" size={size} />;
    if (code >= 80 && code <= 82) return <CloudRain className="text-blue-500" size={size} />;
    if (code >= 95) return <CloudLightning className="text-purple-400" size={size} />;
    return <Cloud className="text-stone-400" size={size} />;
  };

  if (loading) return <div className="h-16 w-32 animate-pulse bg-stone-800 rounded-2xl" />;
  if (!weather) return null;

  return (
    <>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-3 bg-stone-900/80 backdrop-blur-md p-2 pr-4 rounded-2xl border border-stone-800 shadow-lg hover:border-blue-500/50 transition-all"
      >
        <div className="p-2 bg-stone-800 rounded-xl">
          {getWeatherIcon(weather.weathercode, 20)}
        </div>
        <div className="text-left">
          <div className="text-lg font-bold text-white leading-none">{Math.round(weather.temperature)}°C</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mt-1">{city}</div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-stone-900 border border-stone-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-stone-800 flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-stone-800 rounded-2xl">
                    {getWeatherIcon(weather.weathercode, 32)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{city}</h3>
                    <p className="text-blue-400 font-medium">{country}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-stone-800 rounded-full text-stone-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="text-5xl font-bold text-white">{Math.round(weather.temperature)}°C</div>
                    <p className="text-stone-400 mt-1">Temperatura actual</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{weather.windspeed} km/h</div>
                    <p className="text-stone-400 mt-1">Viento</p>
                  </div>
                </div>

                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">Pronóstico 24h</h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {forecast.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center p-3 bg-stone-800/50 rounded-2xl border border-stone-800/50">
                      <span className="text-[10px] font-bold text-stone-500 mb-2">{item.time}</span>
                      {getWeatherIcon(item.code, 20)}
                      <span className="text-sm font-bold text-white mt-2">{Math.round(item.temp)}°</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-stone-800/30 text-center">
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </>
  );
};

// Helper para comprimir imágenes
const compressImage = (base64Str: string, maxWidth = 1000, maxHeight = 1000): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6)); // 60% quality for sync safety
    };
    img.onerror = () => resolve(base64Str);
  });
};

export default function App() {
  const [step, setStep] = useState<'setup' | 'countries' | 'dashboard' | 'table'>('setup');
  const theme = 'dark';
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [trip, setTrip] = useState<TripData>({
    arrivalDate: '',
    departureDate: '',
    countries: [],
    dailyPlans: []
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // Firebase Auth Listener & Real-time Sync
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    // Check for tripId in URL
    const params = new URLSearchParams(window.location.search);
    const sharedTripId = params.get('tripId');

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const targetTripId = sharedTripId || currentUser.uid;
        setCurrentTripId(targetTripId);

        // Real-time listener for trip data
        unsubscribeSnapshot = onSnapshot(doc(db, 'trips', targetTripId), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as TripData;
            console.log("Received update from Firestore:", data.lastUpdated);
            
            // If we are joining a shared trip, add ourselves as collaborator
            if (sharedTripId && sharedTripId !== currentUser.uid) {
              const isCollaborator = data.collaboratorIds?.includes(currentUser.uid);
              if (!isCollaborator) {
                const newCollaborator = {
                  uid: currentUser.uid,
                  displayName: currentUser.displayName || 'Viajero',
                  photoURL: currentUser.photoURL || ''
                };
                const updatedCollaborators = [...(data.collaborators || []), newCollaborator];
                const updatedCollaboratorIds = [...(data.collaboratorIds || []), currentUser.uid];
                setDoc(doc(db, 'trips', sharedTripId), { 
                  ...data, 
                  collaborators: updatedCollaborators,
                  collaboratorIds: updatedCollaboratorIds,
                  lastUpdated: Date.now()
                }, { merge: true });
              }
            }

            setTrip(prev => {
              // Only update if server data is newer or if we don't have local data
              if (!prev.lastUpdated || (data.lastUpdated && data.lastUpdated > prev.lastUpdated)) {
                return data;
              }
              return prev;
            });
            setStep('dashboard');
          } else if (!sharedTripId) {
            // If it's our own trip and it doesn't exist, we'll create it later on setup
            setCurrentTripId(currentUser.uid);
          }
        }, (error) => {
          console.error("Error in real-time sync:", error);
        });
      } else {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Error signing in:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("Este dominio no está autorizado en Firebase. Debes añadirlo en la consola de Firebase (Authentication -> Settings -> Authorized domains).");
      } else {
        alert("Error al iniciar sesión: " + error.message);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setTrip({
        arrivalDate: '',
        departureDate: '',
        countries: [],
        dailyPlans: []
      });
      setStep('setup');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const saveTripToFirestore = async () => {
    if (!user || !currentTripId) return;
    setIsSyncing(true);
    try {
      // Ensure ownerId is set if it's our own trip
      const dataToSave = { ...trip, lastUpdated: Date.now() };
      if (currentTripId === user.uid) {
        if (!dataToSave.ownerId) dataToSave.ownerId = user.uid;
        if (!dataToSave.collaboratorIds) dataToSave.collaboratorIds = [user.uid];
      }
      await setDoc(doc(db, 'trips', currentTripId), dataToSave);
      console.log("Trip saved to Firestore:", dataToSave.lastUpdated);
    } catch (error) {
      console.error("Error saving trip:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadTripFromFirestore = async (uid: string) => {
    try {
      const docRef = doc(db, 'trips', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTrip(docSnap.data() as TripData);
        setStep('dashboard');
      }
    } catch (error) {
      console.error("Error loading trip:", error);
    }
  };

  // Load from localStorage on mount (as fallback)
  useEffect(() => {
    const saved = localStorage.getItem('euro-trip-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTrip(parsed);
        if (parsed.arrivalDate && parsed.departureDate) {
          setStep('dashboard');
        }
      } catch (e) {
        console.error("Error loading saved trip", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (trip.arrivalDate) {
      localStorage.setItem('euro-trip-data', JSON.stringify(trip));
    }
  }, [trip]);

  // Sync daily plans with countries and dates
  const syncDailyPlans = (currentTrip: typeof trip) => {
    if (!currentTrip.arrivalDate || !currentTrip.departureDate) return null;

    const start = startOfDay(parseISO(currentTrip.arrivalDate));
    const end = startOfDay(parseISO(currentTrip.departureDate));
    
    if (!isValid(start) || !isValid(end) || start > end) return null;

    const days = eachDayOfInterval({ start, end });
    
    const syncedPlans: DayPlan[] = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const existingPlan = currentTrip.dailyPlans.find(p => p.date === dateStr);
      
      let countryName = 'Por definir';
      let cityName = 'Por definir';
      // Priority to the last country in the list for overlaps
      for (let i = currentTrip.countries.length - 1; i >= 0; i--) {
        const c = currentTrip.countries[i];
        const cStart = startOfDay(parseISO(c.from));
        const cEnd = startOfDay(parseISO(c.to));
        
        if (isValid(cStart) && isValid(cEnd) && isWithinInterval(day, { start: cStart, end: cEnd })) {
          countryName = c.name;
          cityName = c.city;
          break;
        }
      }

      return {
        date: dateStr,
        country: countryName,
        city: cityName,
        activities: existingPlan?.activities || []
      };
    });

    return syncedPlans;
  };

  useEffect(() => {
    // Automatically update trip dates if countries are outside the current range
    if (trip.countries.length > 0) {
      const dates = trip.countries.flatMap(c => [parseISO(c.from), parseISO(c.to)]).filter(isValid);
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        const minDateStr = format(minDate, 'yyyy-MM-dd');
        const maxDateStr = format(maxDate, 'yyyy-MM-dd');

        if (minDateStr !== trip.arrivalDate || maxDateStr !== trip.departureDate) {
          setTrip(prev => ({
            ...prev,
            arrivalDate: minDateStr,
            departureDate: maxDateStr
          }));
          return; // Let the next effect run with updated dates
        }
      }
    }

    const synced = syncDailyPlans(trip);
    if (!synced) return;

    const currentSummary = trip.dailyPlans.map(p => `${p.date}:${p.country}`).join('|');
    const syncedSummary = synced.map(p => `${p.date}:${p.country}`).join('|');

    if (currentSummary !== syncedSummary || trip.dailyPlans.length !== synced.length) {
      setTrip(prev => ({ ...prev, dailyPlans: synced }));
    }
  }, [trip.countries, trip.arrivalDate, trip.departureDate]);

  const generateDailyPlans = () => {
    // Update trip dates based on countries if available to ensure itinerary matches country visits
    let updatedArrival = trip.arrivalDate;
    let updatedDeparture = trip.departureDate;

    if (trip.countries.length > 0) {
      const dates = trip.countries.flatMap(c => [parseISO(c.from), parseISO(c.to)]).filter(isValid);
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        updatedArrival = format(minDate, 'yyyy-MM-dd');
        updatedDeparture = format(maxDate, 'yyyy-MM-dd');
      }
    }

    const updatedTrip = { 
      ...trip, 
      arrivalDate: updatedArrival, 
      departureDate: updatedDeparture 
    };

    const synced = syncDailyPlans(updatedTrip);
    if (synced) {
      updatedTrip.dailyPlans = synced;
    }
    
    setTrip(updatedTrip);
    setStep('dashboard');
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trip.arrivalDate && trip.departureDate) {
      setStep('countries');
    }
  };

  const addCountry = () => {
    const firstCountry = Object.keys(EUROPE_DATA)[0];
    
    // Try to be smart about the next date
    let nextFrom = trip.arrivalDate;
    if (trip.countries.length > 0) {
      const lastCountry = trip.countries[trip.countries.length - 1];
      try {
        const lastTo = parseISO(lastCountry.to);
        if (isValid(lastTo)) {
          nextFrom = format(addDays(lastTo, 1), 'yyyy-MM-dd');
        }
      } catch (e) {
        nextFrom = trip.arrivalDate;
      }
    }

    const newCountry: CountryVisit = {
      id: Math.random().toString(36).substr(2, 9),
      name: firstCountry,
      city: Object.keys(EUROPE_DATA[firstCountry].cities)[0],
      from: nextFrom,
      to: trip.departureDate
    };
    setTrip(prev => ({ ...prev, countries: [...prev.countries, newCountry] }));
  };

  const updateCountry = (id: string, field: keyof CountryVisit, value: string) => {
    setTrip(prev => {
      const updatedCountries = prev.countries.map(c => {
        if (c.id === id) {
          const updated = { ...c, [field]: value };
          // If country changed, reset city to the first one available
          if (field === 'name') {
            updated.city = Object.keys(EUROPE_DATA[value].cities)[0];
          }
          return updated;
        }
        return c;
      });
      return { ...prev, countries: updatedCountries };
    });
  };

  const removeCountry = (id: string) => {
    setTrip(prev => ({
      ...prev,
      countries: prev.countries.filter(c => c.id !== id)
    }));
  };

  const addActivity = (dateStr: string) => {
    const newActivity: Activity = {
      id: Math.random().toString(36).substr(2, 9),
      time: '10:00',
      description: ''
    };

    setTrip(prev => ({
      ...prev,
      dailyPlans: prev.dailyPlans.map(p => 
        p.date === dateStr ? { ...p, activities: [...p.activities, newActivity] } : p
      )
    }));
  };

  const updateActivity = (dateStr: string, activityId: string, field: keyof Activity, value: string) => {
    setTrip(prev => ({
      ...prev,
      dailyPlans: prev.dailyPlans.map(p => 
        p.date === dateStr ? {
          ...p,
          activities: p.activities.map(a => a.id === activityId ? { ...a, [field]: value } : a)
        } : p
      )
    }));
  };

  const removeActivity = (dateStr: string, activityId: string) => {
    setTrip(prev => ({
      ...prev,
      dailyPlans: prev.dailyPlans.map(p => 
        p.date === dateStr ? {
          ...p,
          activities: p.activities.filter(a => a.id !== activityId)
        } : p
      )
    }));
  };

  const handleFileChange = async (dateStr: string, activityId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) continue;

      const reader = new FileReader();
      let data = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      // Compress if it's an image to avoid Firestore 1MB limit
      if (isImage) {
        data = await compressImage(data);
      }

      newAttachments.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: isImage ? 'image' : 'pdf',
        data
      });
    }

    setTrip(prev => ({
      ...prev,
      dailyPlans: prev.dailyPlans.map(p => 
        p.date === dateStr ? {
          ...p,
          activities: p.activities.map(a => 
            a.id === activityId ? { ...a, attachments: [...(a.attachments || []), ...newAttachments] } : a
          )
        } : p
      )
    }));
  };

  const removeAttachment = (dateStr: string, activityId: string, attachmentId: string) => {
    setTrip(prev => ({
      ...prev,
      dailyPlans: prev.dailyPlans.map(p => 
        p.date === dateStr ? {
          ...p,
          activities: p.activities.map(a => 
            a.id === activityId ? {
              ...a,
              attachments: a.attachments?.filter(att => att.id !== attachmentId)
            } : a
          )
        } : p
      )
    }));
  };

  const confirmReset = () => {
    localStorage.clear();
    setTrip({
      arrivalDate: '',
      departureDate: '',
      countries: [],
      dailyPlans: []
    });
    setStep('setup');
    setShowResetModal(false);
    window.location.reload();
  };

  const todayPlan = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return trip.dailyPlans.find(p => p.date === todayStr);
  }, [trip.dailyPlans]);

  const countdown = useMemo(() => {
    if (!trip.arrivalDate) return null;
    const start = startOfDay(parseISO(trip.arrivalDate));
    const now = startOfDay(new Date());
    const diff = differenceInDays(start, now);
    return diff > 0 ? diff : null;
  }, [trip.arrivalDate]);

  const isTripActive = useMemo(() => {
    if (!trip.arrivalDate || !trip.departureDate) return false;
    const start = parseISO(trip.arrivalDate);
    const end = parseISO(trip.departureDate);
    const now = new Date();
    return isWithinInterval(now, { start, end });
  }, [trip.arrivalDate, trip.departureDate]);

  const countryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    trip.dailyPlans.forEach(day => {
      if (day.country && day.country !== 'Por definir') {
        const parts = day.country.split(', ');
        const countryName = parts.length > 1 ? parts[1] : parts[0];
        stats[countryName] = (stats[countryName] || 0) + 1;
      }
    });
    
    return Object.entries(stats)
      .map(([name, days]) => ({ name, days }))
      .sort((a, b) => b.days - a.days);
  }, [trip.dailyPlans]);

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-20 selection:bg-blue-500/30">
      {/* Header */}
      <header className="bg-[var(--card-bg)] backdrop-blur-xl border-b border-[var(--card-border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 sm:h-32 flex items-center justify-between gap-4">
          <motion.a 
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 sm:gap-4 cursor-pointer shrink-0" 
            onClick={(e) => {
              e.preventDefault();
              trip.arrivalDate ? setStep('dashboard') : setStep('setup');
            }}
          >
            <Logo className="w-16 h-16 sm:w-32 sm:h-32" />
            <span className="font-serif text-lg sm:text-4xl font-bold tracking-tight text-blue-800 dark:text-white italic">
              ¡Tu mejor amigo!
            </span>
          </motion.a>
          
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            {/* Collaborators */}
            {trip.collaborators && trip.collaborators.length > 0 && (
              <div className="hidden md:flex -space-x-2 mr-2">
                {trip.collaborators.map((c) => (
                  <div key={c.uid} className="w-8 h-8 rounded-full border-2 border-stone-900 overflow-hidden" title={c.displayName}>
                    {c.photoURL ? (
                      <img src={c.photoURL} alt={c.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-blue-800 flex items-center justify-center text-[10px] text-white font-bold">
                        {c.displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Invite Button in Header */}
            {user && user.uid === currentTripId && (
              <button 
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/20 shrink-0"
              >
                <Share2 size={18} />
                Invitar a un amigo a tu viaje
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-stone-100 dark:bg-stone-900 p-1 sm:p-1.5 pr-2 sm:pr-4 rounded-2xl border border-stone-200 dark:border-stone-800 shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-xl shadow-sm shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 bg-blue-900 text-white rounded-xl flex items-center justify-center shrink-0">
                    <UserIcon size={16} />
                  </div>
                )}
                <div className="hidden md:block">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Viajero</div>
                  <div className="text-xs font-bold text-white truncate max-w-[100px]">{user.displayName?.split(' ')[0]}</div>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 text-stone-500 hover:text-red-500 transition-colors shrink-0"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <GoogleButton onClick={signIn} hideTextOnMobile className="shrink-0" />
            )}

            <button 
              onClick={() => setShowResetModal(true)}
              className="p-2 sm:p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all shadow-sm shrink-0"
              title="Reiniciar viaje"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 'setup' && (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto"
            >
              <div className="text-center mb-24">
                <motion.a 
                  href="/"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-[12rem] h-[12rem] mx-auto mb-12 block cursor-pointer"
                  onClick={(e) => e.preventDefault()}
                >
                  <Logo className="w-full h-full" />
                </motion.a>
                <p className="text-white text-4xl sm:text-5xl max-w-3xl mx-auto font-bold drop-shadow-lg">Tu compañero de viaje definitivo.</p>
                
                {!user && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 flex flex-col items-center gap-4"
                  >
                    <div className="flex items-center gap-3 text-stone-300 text-sm mb-2 font-bold">
                      <Cloud size={16} className="text-blue-400" />
                      <span>Guarda tu viaje en la nube y accede desde cualquier lugar</span>
                    </div>
                    <GoogleButton onClick={signIn} className="scale-110 sm:scale-125 py-3 px-6 shadow-xl shadow-blue-900/10" />
                  </motion.div>
                )}
              </div>

              <form onSubmit={handleSetupSubmit} className="glass-card p-6 sm:p-10 space-y-8 max-w-md mx-auto">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-blue-300 flex items-center gap-2">
                    <Calendar size={14} className="text-blue-400" /> Fecha de Llegada
                  </label>
                  <input 
                    type="date" 
                    required
                    value={trip.arrivalDate}
                    onChange={e => setTrip(prev => ({ ...prev, arrivalDate: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-blue-300 flex items-center gap-2">
                    <Calendar size={14} className="text-blue-400" /> Fecha de Regreso
                  </label>
                  <input 
                    type="date" 
                    required
                    value={trip.departureDate}
                    onChange={e => setTrip(prev => ({ ...prev, departureDate: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <button 
                  type="submit"
                  className="btn-primary w-full py-5 text-lg"
                >
                  Comenzar Aventura
                  <ChevronRight size={20} />
                </button>
              </form>
            </motion.div>
          )}

          {step === 'countries' && (
            <motion.div 
              key="countries"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-3xl mb-1 text-white">Países a visitar</h2>
                  <p className="text-stone-300 font-medium">Indica qué países visitarás y en qué fechas.</p>
                </div>
                <button 
                  onClick={addCountry}
                  className="btn-secondary text-blue-900 border-blue-100 hover:bg-blue-50 px-6"
                >
                  <Plus size={18} /> Añadir País
                </button>
              </div>

              <div className="grid gap-6">
                {trip.countries.map((country, idx) => (
                  <div key={country.id} className="glass-card p-8 flex flex-col md:flex-row gap-6 items-end md:items-center">
                    <div className="flex-1 w-full space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-blue-300">País</label>
                      <select 
                        value={country.name}
                        onChange={e => updateCountry(country.id, 'name', e.target.value)}
                        className="w-full p-2 border-b-2 border-stone-700 focus:border-blue-400 outline-none transition-all text-xl font-bold bg-stone-900 text-white rounded-t-lg"
                      >
                        {Object.keys(EUROPE_DATA).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 w-full space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Ciudad</label>
                      <select 
                        value={country.city}
                        onChange={e => updateCountry(country.id, 'city', e.target.value)}
                        className="w-full p-2 border-b-2 border-stone-700 focus:border-blue-400 outline-none transition-all text-xl font-bold bg-stone-900 text-white rounded-t-lg"
                      >
                        {Object.keys(EUROPE_DATA[country.name]?.cities || {}).map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full md:w-48 space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Desde</label>
                      <input 
                        type="date" 
                        value={country.from}
                        onChange={e => updateCountry(country.id, 'from', e.target.value)}
                        className="w-full p-3 rounded-xl border border-stone-700 bg-stone-800 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="w-full md:w-48 space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Hasta</label>
                      <input 
                        type="date" 
                        value={country.to}
                        onChange={e => updateCountry(country.id, 'to', e.target.value)}
                        className="w-full p-3 rounded-xl border border-stone-700 bg-stone-800 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <button 
                      onClick={() => removeCountry(country.id)}
                      className="text-stone-300 hover:text-red-500 p-3 transition-colors bg-stone-50 rounded-xl hover:bg-red-50"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}

                {trip.countries.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
                    <p className="text-stone-500 dark:text-stone-400">No has añadido países todavía.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-8">
                <button 
                  onClick={() => setStep('setup')}
                  className="text-stone-400 hover:text-white font-bold flex items-center gap-2 transition-colors"
                >
                  <ChevronLeft size={20} /> Atrás
                </button>
                <div className="flex items-center gap-4">
                  {user && (
                    <button 
                      onClick={saveTripToFirestore}
                      disabled={isSyncing}
                      className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95",
                        isSyncing 
                          ? "bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed" 
                          : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                      )}
                    >
                      {isSyncing ? (
                        <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin" />
                      ) : (
                        <Cloud size={16} />
                      )}
                      {isSyncing ? 'Guardando...' : 'Guardar'}
                    </button>
                  )}
                  <button 
                    onClick={generateDailyPlans}
                    className="btn-primary px-10"
                  >
                    Generar Itinerario
                    <CheckCircle2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-10"
            >
              {/* Hero Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-blue-900 rounded-3xl text-white shadow-xl shadow-blue-200/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Calendar size={20} />
                    </div>
                    {countdown !== null && (
                      <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                        Próximamente
                      </span>
                    )}
                    {isTripActive && (
                      <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                        En curso
                      </span>
                    )}
                  </div>
                  {countdown !== null ? (
                    <div>
                      <div className="text-6xl font-serif font-bold mb-1">{countdown}</div>
                      <div className="text-blue-100 font-medium">Días para el despegue</div>
                    </div>
                  ) : isTripActive ? (
                    <div>
                      <div className="text-3xl font-serif font-bold mb-1">¡Disfruta el viaje!</div>
                      <div className="text-blue-100 font-medium">Estás viviendo tu aventura</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl font-serif font-bold mb-1">Viaje Finalizado</div>
                      <div className="text-blue-100 font-medium">Esperamos que haya sido increíble</div>
                    </div>
                  )}
                </div>

                <div className="glass-card p-8 md:col-span-2 flex flex-col justify-between border-stone-200">
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-3xl text-white">Hoy: {format(new Date(), 'EEEE, d MMMM', { locale: es })}</h3>
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-900 dark:text-blue-400">
                        <Clock size={24} />
                      </div>
                    </div>
                    {todayPlan && todayPlan.city !== 'Por definir' && (
                      <div className="w-fit">
                        <WeatherWidget city={todayPlan.city} country={todayPlan.country} />
                      </div>
                    )}
                  </div>
                  
                  {todayPlan ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400 font-bold text-lg">
                        <MapPin size={18} /> {todayPlan.country}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {todayPlan.activities.length > 0 ? (
                          todayPlan.activities.map(a => (
                            <div key={a.id} className="flex flex-col gap-2">
                              <span className="px-4 py-2 bg-stone-800 border border-stone-700 rounded-2xl text-sm font-semibold text-stone-300 shadow-sm">
                                <span className="text-blue-900 dark:text-blue-400 mr-2">{a.time}</span>
                                {a.description || 'Sin descripción'}
                              </span>
                              {a.attachments && a.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 pl-2">
                                  {a.attachments.map(att => (
                                    <button 
                                      key={att.id}
                                      onClick={() => setViewingAttachment(att)}
                                      className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[10px] font-bold text-blue-900 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                                    >
                                      {att.type === 'image' ? <ImageIcon size={10} /> : <FileText size={10} />}
                                      <span className="max-w-[80px] truncate">{att.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-stone-400 text-base italic font-bold">No hay actividades para hoy</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-stone-400 text-base italic py-4 font-bold">No hay planes registrados para la fecha actual</div>
                  )}
                </div>
              </div>

              {/* Map Section - Full Width */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-3xl text-white">Tu Ruta</h3>
                  <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Visualización Geográfica</div>
                </div>
                <div className="h-[500px] w-full rounded-[2.5rem] overflow-hidden border border-stone-800 shadow-xl bg-stone-900 relative">
                  <TripMap key={`map-${step}-${trip.countries.length}`} countries={trip.countries} theme={theme} />
                </div>
              </div>

              {/* Stats Section - Below Map */}
              <div className="space-y-6 mt-16 relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-3xl flex items-center gap-2 text-white">
                    <BarChart3 className="text-blue-900 dark:text-blue-400" /> Distribución del Viaje
                  </h3>
                  <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Días por País</div>
                </div>
                <div className="glass-card p-8 min-h-[450px]">
                  {countryStats.length > 0 ? (
                    <Chart
                      options={{
                        chart: {
                          id: 'country-stats',
                          toolbar: { show: false },
                          fontFamily: 'Inter, sans-serif',
                          background: 'transparent',
                          foreColor: theme === 'dark' ? '#a8a29e' : '#78716c'
                        },
                        plotOptions: {
                          bar: {
                            borderRadius: 8,
                            horizontal: true,
                            barHeight: '60%',
                            distributed: false,
                            dataLabels: {
                              position: 'top',
                            },
                          }
                        },
                        colors: ['#1e3a8a'], // Blue 900
                        dataLabels: {
                          enabled: true,
                          formatter: function (val) {
                            return val + (val === 1 ? " día" : " días");
                          },
                          offsetX: -20,
                          style: {
                            fontSize: '12px',
                            colors: ['#fff']
                          }
                        },
                        xaxis: {
                          categories: countryStats.map(s => s.name),
                          axisBorder: { show: false },
                          axisTicks: { show: false },
                          labels: {
                            style: {
                              fontSize: '12px'
                            }
                          }
                        },
                        yaxis: {
                          labels: {
                            maxWidth: 160,
                            style: {
                              fontSize: '12px',
                              fontWeight: 600
                            }
                          }
                        },
                        grid: {
                          borderColor: theme === 'dark' ? '#292524' : '#f5f5f4',
                          xaxis: { lines: { show: true } },
                          yaxis: { lines: { show: false } }
                        },
                        tooltip: {
                          theme: theme,
                          y: {
                            formatter: function (val) {
                              return val + (val === 1 ? " día" : " días");
                            }
                          }
                        },
                        theme: {
                          mode: theme as 'light' | 'dark'
                        }
                      }}
                      series={[{
                        name: 'Días',
                        data: countryStats.map(s => s.days)
                      }]}
                      type="bar"
                      height={400}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-stone-400 italic text-sm font-bold">
                      <BarChart3 size={48} className="mb-4 opacity-20" />
                      Define tu ruta para ver estadísticas detalladas
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-stone-200">
                <div className="flex-1">
                  <h2 className="font-serif text-3xl mb-2 text-white">Itinerario Detallado</h2>
                  <div className="flex items-center gap-4 text-stone-300 font-bold text-sm">
                    <span className="flex items-center gap-1"><Calendar size={14} className="text-blue-400" /> {format(parseISO(trip.arrivalDate), 'd MMM yyyy', { locale: es })} - {format(parseISO(trip.departureDate), 'd MMM yyyy', { locale: es })}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-blue-400" /> {trip.countries.length} países</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Filters */}
                  <div className="flex items-center gap-2 bg-stone-800/50 p-1 rounded-2xl border border-stone-700">
                    <div className="px-3 text-stone-300">
                      <Filter size={14} />
                    </div>
                    
                      <select 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-blue-400 outline-none cursor-pointer py-2 pr-2"
                      >
                      <option key="default-date" value="" className="bg-stone-900 text-stone-200">Fecha</option>
                      {trip.dailyPlans.map((day, idx) => (
                        <option key={`date-${day.date}-${idx}`} value={day.date} className="bg-stone-900 text-stone-200">
                          {format(parseISO(day.date), 'd MMM', { locale: es })}
                        </option>
                      ))}
                    </select>

                    <div className="w-px h-4 bg-stone-200 dark:bg-stone-700" />

                    <select 
                      value={filterCountry}
                      onChange={(e) => setFilterCountry(e.target.value)}
                      className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-blue-400 outline-none cursor-pointer py-2 pr-2"
                    >
                      <option key="default-country" value="" className="bg-stone-900 text-stone-200">País</option>
                      {Array.from(new Set(trip.dailyPlans.map(d => d.country))).filter(Boolean).map(country => (
                        <option key={`country-${country}`} value={country} className="bg-stone-900 text-stone-200">{country}</option>
                      ))}
                    </select>

                    <div className="w-px h-4 bg-stone-200 dark:bg-stone-700" />

                    <select 
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-blue-400 outline-none cursor-pointer py-2 pr-2"
                    >
                      <option key="default-city" value="" className="bg-stone-900 text-stone-200">Ciudad</option>
                      {Array.from(new Set(trip.dailyPlans.filter(d => !filterCountry || d.country === filterCountry).map(d => d.city))).filter(Boolean).map(city => (
                        <option key={`city-${city}`} value={city} className="bg-stone-900 text-stone-200">{city}</option>
                      ))}
                    </select>

                    {(filterDate || filterCountry || filterCity) && (
                      <button 
                        onClick={() => {
                          setFilterDate('');
                          setFilterCountry('');
                          setFilterCity('');
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                        title="Limpiar filtros"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {user && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={saveTripToFirestore}
                        disabled={isSyncing}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all active:scale-95 h-[42px]",
                          isSyncing 
                            ? "bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed" 
                            : "bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20"
                        )}
                      >
                        {isSyncing ? (
                          <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin" />
                        ) : (
                          <Cloud size={16} />
                        )}
                        {isSyncing ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => setStep('countries')}
                    className="btn-secondary text-sm px-4 py-2 h-[42px]"
                  >
                    <Edit3 size={16} /> Editar Países
                  </button>
                </div>
              </div>

              <div className="grid gap-8">
                {trip.dailyPlans
                  .filter(day => {
                    const matchesDate = filterDate ? day.date === filterDate : true;
                    const matchesCountry = filterCountry ? day.country === filterCountry : true;
                    const matchesCity = filterCity ? day.city === filterCity : true;
                    return matchesDate && matchesCountry && matchesCity;
                  })
                  .map((day, idx) => {
                    // Find original index for "Día X" label
                    const originalIdx = trip.dailyPlans.findIndex(d => d.date === day.date);
                    return (
                      <div key={day.date} className="relative pl-8 md:pl-0">
                    {/* Timeline line */}
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-stone-200 md:hidden"></div>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Date Sidebar */}
                      <div className="md:w-48 shrink-0">
                        <div className="sticky top-24">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Día {originalIdx + 1}</div>
                          <div className="font-serif text-2xl leading-tight mb-1 text-white">
                            {format(parseISO(day.date), 'EEEE, d', { locale: es })}
                          </div>
                          <div className="text-stone-500 dark:text-stone-300 text-sm capitalize">
                            {format(parseISO(day.date), 'MMMM', { locale: es })}
                          </div>
                          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold shadow-md">
                            <MapPin size={16} /> {day.city}, {day.country}
                          </div>
                        </div>
                      </div>

                      {/* Activities */}
                      <div className="flex-1 space-y-4">
                        <div className="glass-card p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-white flex items-center gap-2">
                              Actividades
                              <span className="text-[10px] font-bold text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full">
                                {day.activities.length}
                              </span>
                            </h4>
                            <button 
                              onClick={() => addActivity(day.date)}
                              className="text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-lg transition-all flex items-center gap-1 text-sm font-bold"
                            >
                              <Plus size={16} /> Añadir
                            </button>
                          </div>

                          <div className="space-y-3">
                            {day.activities.map(activity => (
                              <div key={activity.id} className="group flex gap-3 items-start p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-all border border-transparent hover:border-stone-100 dark:hover:border-stone-700">
                                <div className="shrink-0 pt-1">
                                  <input 
                                    type="time" 
                                    value={activity.time}
                                    onChange={e => updateActivity(day.date, activity.id, 'time', e.target.value)}
                                    className="bg-transparent text-sm font-mono text-stone-500 dark:text-stone-400 outline-none focus:text-blue-900 dark:focus:text-blue-400"
                                  />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <input 
                                    type="text" 
                                    placeholder="¿Qué planes tienes?"
                                    value={activity.description}
                                    onChange={e => updateActivity(day.date, activity.id, 'description', e.target.value)}
                                    className="w-full bg-transparent outline-none text-white placeholder:text-stone-600 focus:placeholder:text-stone-400"
                                  />
                                  
                                  {/* Attachments List */}
                                  {activity.attachments && activity.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {activity.attachments.map(att => (
                                        <div key={att.id} className="group/att relative flex items-center gap-2 px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-[10px] font-medium text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                                          <button 
                                            onClick={() => setViewingAttachment(att)}
                                            className="flex items-center gap-1 hover:text-blue-900 dark:hover:text-blue-400"
                                          >
                                            {att.type === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                                            <span className="max-w-[100px] truncate">{att.name}</span>
                                          </button>
                                          <button 
                                            onClick={() => removeAttachment(day.date, activity.id, att.id)}
                                            className="text-stone-500 dark:text-stone-400 hover:text-red-500 transition-colors"
                                          >
                                            <X size={10} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <label className="cursor-pointer text-stone-500 dark:text-stone-400 md:text-stone-300 hover:text-blue-900 dark:hover:text-blue-400 p-1 transition-all">
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      multiple
                                      accept="image/*,application/pdf"
                                      onChange={(e) => handleFileChange(day.date, activity.id, e)}
                                    />
                                    <Paperclip size={16} />
                                  </label>
                                  <button 
                                    onClick={() => removeActivity(day.date, activity.id)}
                                    className="text-stone-300 hover:text-red-500 transition-all p-1"
                                    title="Eliminar actividad"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {day.activities.length === 0 && (
                              <button 
                                onClick={() => addActivity(day.date)}
                                className="w-full py-4 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-600 hover:border-stone-300 transition-all text-sm flex items-center justify-center gap-2"
                              >
                                <Plus size={16} /> No hay actividades planeadas
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
                
                {trip.dailyPlans.length === 0 && (
                  <div className="glass-card p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto text-stone-500 dark:text-stone-400">
                      <Calendar size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif">Tu itinerario está vacío</h3>
                      <p className="text-stone-500">Define tus fechas y países para generar el plan diario.</p>
                    </div>
                  </div>
                )}

                {trip.dailyPlans.length > 0 && trip.dailyPlans.filter(day => {
                  const matchesDate = filterDate ? day.date === filterDate : true;
                  const matchesCountry = filterCountry ? day.country === filterCountry : true;
                  const matchesCity = filterCity ? day.city === filterCity : true;
                  return matchesDate && matchesCountry && matchesCity;
                }).length === 0 && (
                  <div className="glass-card p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto text-stone-500 dark:text-stone-400">
                      <Filter size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif">No hay resultados</h3>
                      <p className="text-stone-500">Prueba ajustando los filtros seleccionados.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-stone-200 dark:border-stone-800 text-center">
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          SKY &copy; {new Date().getFullYear()} — Tu compañero de viaje definitivo.
        </p>
      </footer>
      {/* Modals */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800"
            >
              <div className="p-8 text-center">
                <div className="w-full h-[380px] mb-6 rounded-[2rem] bg-stone-800 flex items-center justify-center p-10">
                  <img 
                    src="https://i.ibb.co/FLS5N4Zv/skypregunta.png" 
                    alt="Pregunta" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="font-serif text-2xl mb-2 text-stone-200">¿Estás seguro?</h3>
                <p className="text-stone-500 dark:text-stone-400 mb-8">
                  Se borrarán todos los datos de tu viaje y volverás al inicio. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 py-4 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmReset}
                    className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200 dark:shadow-none"
                  >
                    Sí, reiniciar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {viewingAttachment && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingAttachment(null)}
              className="absolute inset-0 bg-stone-900/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-5xl h-[80vh] bg-white dark:bg-stone-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-900 dark:text-blue-400">
                    {viewingAttachment.type === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
                  </div>
                  <h4 className="font-bold text-stone-200">{viewingAttachment.name}</h4>
                </div>
                <button 
                  onClick={() => setViewingAttachment(null)}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-stone-50 dark:bg-stone-950">
                {viewingAttachment.type === 'image' ? (
                  <img 
                    src={viewingAttachment.data} 
                    alt={viewingAttachment.name} 
                    className="max-w-full max-h-full object-contain shadow-xl rounded-xl"
                  />
                ) : (
                  <iframe 
                    src={viewingAttachment.data} 
                    className="w-full h-full rounded-xl border-none"
                    title={viewingAttachment.name}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {showShareModal && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative"
          >
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-stone-800 rounded-full text-stone-400 transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="p-8 pb-0 text-center">
              <div className="w-full h-[320px] mb-6 rounded-[2rem] bg-stone-800 flex items-center justify-center p-8">
                <img 
                  src="https://i.ibb.co/Q3YHCBFv/Skyamigos.png" 
                  alt="Skyamigos" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 italic font-serif">¡Invita a un amigo!</h3>
              <p className="text-stone-400 mb-8 font-medium">
                ¡Comparte este link a un amigo para que juntos puedan editar el viaje!
              </p>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tripId', user?.uid || '');
                    const text = "Te invito a editar mi viaje en SKY conmigo.";
                    const shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url.toString())}`;
                    window.open(shareUrl, '_blank');
                  }}
                  className="w-full py-4 bg-[#25D366] hover:bg-[#22c35e] text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-600/20"
                >
                  <MessageCircle size={20} />
                  Compartir por WhatsApp
                </button>

                <button 
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tripId', user?.uid || '');
                    const text = "Te invito a editar mi viaje en SKY conmigo.";
                    const shareUrl = `mailto:?subject=Invitación a mi viaje en SKY&body=${encodeURIComponent(text + " " + url.toString())}`;
                    window.location.href = shareUrl;
                  }}
                  className="w-full py-4 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all border border-stone-700"
                >
                  <Mail size={20} />
                  Compartir por Correo
                </button>

                <button 
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tripId', user?.uid || '');
                    navigator.clipboard.writeText(url.toString());
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/20"
                >
                  {isCopied ? <Check size={20} /> : <Copy size={20} />}
                  {isCopied ? '¡Enlace Copiado!' : 'Copiar Enlace'}
                </button>

                {navigator.share && (
                  <button 
                    onClick={async () => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('tripId', user?.uid || '');
                      try {
                        await navigator.share({
                          title: 'Mi viaje en SKY',
                          text: 'Te invito a editar mi viaje en SKY conmigo.',
                          url: url.toString(),
                        });
                      } catch (err) {
                        console.error('Error sharing:', err);
                      }
                    }}
                    className="w-full py-4 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all"
                  >
                    <ExternalLink size={20} />
                    Más opciones
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
