import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Player, Lobby, TimeInterval, OptimalIntervalResult, TimeSlotAnalysis } from "./types";
import { 
  analyzeTimeSlots, 
  findOptimalIntervals, 
  formatTimeLabel 
} from "./utils/scheduler";
import { 
  Gamepad, 
  Users, 
  UserPlus, 
  Share2, 
  Plus, 
  Tv, 
  Bot, 
  Database, 
  Check, 
  Copy, 
  X, 
  Info, 
  Award,
  CalendarDays,
  Sparkles,
  RefreshCw,
  LogOut
} from "lucide-react";
import { MinecraftHeader } from "./components/MinecraftHeader";
import { TimelineGrid } from "./components/TimelineGrid";
import { HeatmapView } from "./components/HeatmapView";
import { LobbySummary } from "./components/LobbySummary";
import { MinecraftAvatar } from "./components/MinecraftAvatar";

// Import Firebase safely
import { db, firebaseEnabled, OperationType, handleFirestoreError } from "./firebase";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";

// Simulated Preset Friends to spawn realistic data immediately
const PRESET_FRIENDS: Omit<Player, "id">[] = [
  {
    name: "Steve_Builds",
    avatarSeed: "steve",
    intervals: [
      { start: 10.0, end: 14.5 },
      { start: 20.0, end: 23.5 }
    ],
    color: "#38BDF8", // Cyan
    isDemo: true
  },
  {
    name: "Alex_The_Redstone",
    avatarSeed: "alex",
    intervals: [
      { start: 14.0, end: 19.0 },
      { start: 20.5, end: 23.5 }
    ],
    color: "#FB923C", // Orange
    isDemo: true
  },
  {
    name: "Enderman99",
    avatarSeed: "enderman",
    intervals: [
      { start: 11.0, end: 15.0 },
      { start: 17.5, end: 22.0 }
    ],
    color: "#C084FC", // Purple
    isDemo: true
  },
  {
    name: "CreeperHunter",
    avatarSeed: "creeper",
    intervals: [
      { start: 16.0, end: 21.0 }
    ],
    color: "#4ADE80", // Green
    isDemo: true
  },
  {
    name: "GrummPig",
    avatarSeed: "pig",
    intervals: [
      { start: 9.0, end: 12.5 },
      { start: 14.0, end: 17.0 }
    ],
    color: "#F472B6", // Pink
    isDemo: true
  }
];

export default function App() {
  // Navigation & Core States
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [lobbyCodeInput, setLobbyCodeInput] = useState("");
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [lobbyTitleInput, setLobbyTitleInput] = useState("Minecraft Sunday Session");
  
  // HUD alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Exclude some players from the current optimal calculation in the UI for planning "what-ifs"
  const [excludedPlayerIds, setExcludedPlayerIds] = useState<Set<string>>(new Set());

  // Check URL for direct room joining
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) {
      setLobbyCodeInput(room);
    }
  }, []);

  // Sync / Load states
  useEffect(() => {
    const cachedPlayer = localStorage.getItem("mineday-player");
    if (cachedPlayer) {
      try {
        setCurrentPlayer(JSON.parse(cachedPlayer));
      } catch (err) {
        localStorage.removeItem("mineday-player");
      }
    }
  }, []);

  // Firebase subscription for real-time rooms
  useEffect(() => {
    if (!lobby || !firebaseEnabled) return;

    const path = `lobbies/${lobby.id}`;
    const unsubscribe = onSnapshot(
      doc(db, "lobbies", lobby.id),
      (snapshot) => {
        if (snapshot.exists()) {
          setLobby(snapshot.data() as Lobby);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [lobby?.id]);

  // Toast notifier helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Generate unique character codes (e.g. #MIN-92)
  const generateLobbyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Colors for newly added users
  const getRandomGamerColor = () => {
    const colors = ["#F87171", "#60A5FA", "#34D399", "#FBBF24", "#F472B6", "#A78BFA", "#38BDF8", "#F59E0B"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Color options for users
  const AVATAR_SEEDS = ["steve", "alex", "creeper", "enderman", "pig", "random"];

  const [selectedAvatar, setSelectedAvatar] = useState("steve");

  // Create lobby action
  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerNameInput.trim()) {
      triggerToast("Имя игрока обязательно!");
      return;
    }

    const code = generateLobbyCode();
    const mockUid = Math.random().toString(36).substring(2, 10);
    
    const self: Player = {
      id: mockUid,
      name: playerNameInput.trim(),
      avatarSeed: selectedAvatar,
      intervals: [{ start: 14.0, end: 19.5 }], // Default 14:00 - 19:30 slot
      color: getRandomGamerColor()
    };

    const newLobby: Lobby = {
      id: code,
      title: lobbyTitleInput.trim() || "Minecraft Sunday Session",
      targetDuration: 3, // Default 3 hours continuous play
      createdAt: Date.now(),
      players: { [self.id]: self }
    };

    localStorage.setItem("mineday-player", JSON.stringify(self));
    setCurrentPlayer(self);

    if (firebaseEnabled) {
      const path = `lobbies/${code}`;
      try {
        await setDoc(doc(db, "lobbies", code), newLobby);
        triggerToast("Облачное лобби создано!");
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } else {
      // Local Storage room-key save
      localStorage.setItem(`mineday-local-${code}`, JSON.stringify(newLobby));
      triggerToast("Локальное лобби создано!");
    }

    setLobby(newLobby);
    window.history.pushState({}, "", `?room=${code}`);
  };

  // Join Action
  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = lobbyCodeInput.trim().toUpperCase();
    if (!code) {
      triggerToast("Введите код лобби!");
      return;
    }

    let loadedLobby: Lobby | null = null;

    if (firebaseEnabled) {
      const path = `lobbies/${code}`;
      try {
        const docSnap = await getDoc(doc(db, "lobbies", code));
        if (docSnap.exists()) {
          loadedLobby = docSnap.data() as Lobby;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    } else {
      const localStr = localStorage.getItem(`mineday-local-${code}`);
      if (localStr) {
        loadedLobby = JSON.parse(localStr);
      }
    }

    if (!loadedLobby) {
      triggerToast("Лобби не найдено! Проверьте код.");
      return;
    }

    setLobby(loadedLobby);
    window.history.pushState({}, "", `?room=${code}`);

    // If already registered, automatic join is handled or prompted
    const cachedPlayer = localStorage.getItem("mineday-player");
    if (cachedPlayer) {
      const parsed = JSON.parse(cachedPlayer) as Player;
      // If we are not in the lobby, join!
      if (!loadedLobby.players[parsed.id]) {
        await addPlayerToLobby(loadedLobby, parsed);
      } else {
        setCurrentPlayer(loadedLobby.players[parsed.id]);
      }
    }
  };

  // Add a player profile to a target lobby
  const addPlayerToLobby = async (targetLobby: Lobby, playerObj: Player) => {
    const updatedLobby = {
      ...targetLobby,
      players: {
        ...targetLobby.players,
        [playerObj.id]: playerObj
      }
    };

    if (firebaseEnabled) {
      const path = `lobbies/${targetLobby.id}`;
      try {
        await setDoc(doc(db, "lobbies", targetLobby.id), updatedLobby);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      localStorage.setItem(`mineday-local-${targetLobby.id}`, JSON.stringify(updatedLobby));
    }

    setLobby(updatedLobby);
  };

  // Handles submitting player registration to an already loaded lobby
  const handleRegisterPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerNameInput.trim()) {
      triggerToast("Введите имя игрока!");
      return;
    }
    if (!lobby) return;

    const mockUid = Math.random().toString(36).substring(2, 10);
    const self: Player = {
      id: mockUid,
      name: playerNameInput.trim(),
      avatarSeed: selectedAvatar,
      intervals: [{ start: 13.0, end: 17.5 }],
      color: getRandomGamerColor()
    };

    localStorage.setItem("mineday-player", JSON.stringify(self));
    setCurrentPlayer(self);
    await addPlayerToLobby(lobby, self);
    triggerToast(`Привет, ${self.name}! Ты добавлен в сквад.`);
  };

  // Update own schedules intervals
  const handleIntervalsChange = async (intervals: TimeInterval[]) => {
    if (!lobby || !currentPlayer) return;

    const updatedCurrentPlayer = {
      ...currentPlayer,
      intervals
    };

    setCurrentPlayer(updatedCurrentPlayer);
    localStorage.setItem("mineday-player", JSON.stringify(updatedCurrentPlayer));

    const updatedLobby = {
      ...lobby,
      players: {
        ...lobby.players,
        [currentPlayer.id]: updatedCurrentPlayer
      }
    };

    if (firebaseEnabled) {
      const path = `lobbies/${lobby.id}`;
      try {
        await setDoc(doc(db, "lobbies", lobby.id), updatedLobby);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      localStorage.setItem(`mineday-local-${lobby.id}`, JSON.stringify(updatedLobby));
      setLobby(updatedLobby);
    }
  };

  // Change continuous game block duration
  const handleDurationChange = async (duration: number) => {
    if (!lobby) return;

    const updatedLobby = {
      ...lobby,
      targetDuration: duration
    };

    if (firebaseEnabled) {
      const path = `lobbies/${lobby.id}`;
      try {
        await setDoc(doc(db, "lobbies", lobby.id), updatedLobby);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      localStorage.setItem(`mineday-local-${lobby.id}`, JSON.stringify(updatedLobby));
      setLobby(updatedLobby);
    }
  };

  // Spawn simulated player helper for instant fun testing in the preview
  const handleSpawnFriend = async () => {
    if (!lobby) return;

    // Grab next unused preset friend
    const activeNames = (Object.values(lobby.players) as Player[]).map(p => p.name);
    const nextPreset = PRESET_FRIENDS.find(f => !activeNames.includes(f.name));

    if (!nextPreset) {
      triggerToast("Все виртуальные друзья уже призваны в лобби!");
      return;
    }

    const mockId = `mock-friend-${Date.now()}`;
    const spawned: Player = {
      id: mockId,
      name: nextPreset.name,
      avatarSeed: nextPreset.avatarSeed,
      intervals: nextPreset.intervals,
      color: nextPreset.color,
      isDemo: true
    };

    await addPlayerToLobby(lobby, spawned);
    triggerToast(`Игрок ${spawned.name} зашёл на сервер!`);
  };

  // Remove individual player from lobby
  const handleKickPlayer = async (kickId: string) => {
    if (!lobby) return;

    const nextPlayers = { ...lobby.players };
    delete nextPlayers[kickId];

    const updatedLobby = {
      ...lobby,
      players: nextPlayers
    };

    if (firebaseEnabled) {
      const path = `lobbies/${lobby.id}`;
      try {
        await setDoc(doc(db, "lobbies", lobby.id), updatedLobby);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      localStorage.setItem(`mineday-local-${lobby.id}`, JSON.stringify(updatedLobby));
      setLobby(updatedLobby);
    }

    if (currentPlayer && currentPlayer.id === kickId) {
      setCurrentPlayer(null);
    }

    triggerToast("Игрок отключен.");
  };

  // Toggle players in math calculation
  const togglePlayerExclusion = (pid: string) => {
    const next = new Set(excludedPlayerIds);
    if (next.has(pid)) {
      next.delete(pid);
    } else {
      next.add(pid);
    }
    setExcludedPlayerIds(next);
  };

  // Copy lobby shared link
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${lobby?.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Exit lobby
  const handleExitLobby = () => {
    setLobby(null);
    window.history.pushState({}, "", window.location.pathname);
  };

  // Extract active list of players who are currently checked for the scheduler algorithm
  const mathPlayers = lobby 
    ? (Object.values(lobby.players) as Player[]).filter(p => !excludedPlayerIds.has(p.id)) 
    : [];

  const allPlayersList = lobby ? (Object.values(lobby.players) as Player[]) : [];

  // Core schedules crunching
  const timeSlotAnalysis = analyzeTimeSlots(mathPlayers);
  const optimalIntervals = lobby ? findOptimalIntervals(mathPlayers, lobby.targetDuration) : [];
  
  // Best selected interval hours
  const primeStart = optimalIntervals[0]?.start;
  const primeEnd = optimalIntervals[0]?.end;

  return (
    <div className="min-h-screen bg-[#0c0d10] font-sans text-slate-300" id="main-application-frame">
      
      {/* Dynamic Toast HUD Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#7CFF4D] text-black px-4 py-2.5 rounded-lg font-mono font-black text-xs shadow-2xl border border-white/10 flex items-center gap-2"
            id="global-toast-indicator"
          >
            <Sparkles className="w-4 h-4" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main HUD Nav bar */}
      <MinecraftHeader />

      {/* Primary Screens */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        
        <AnimatePresence mode="wait">
          {!lobby ? (
            
            /* SCREEN A: HOME / JOIN / CREATE CARD */
            <motion.div
              key="auth-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch pt-2"
              id="home-setup-view"
            >
              
              {/* Left Column: Description & Instructions card */}
              <div className="md:col-span-5 flex flex-col justify-between bg-[#14161c] border border-white/5 p-6 rounded-2xl shadow-2xl">
                <div className="space-y-4">
                  <span className="px-2.5 py-1 text-[10px] font-mono font-black uppercase bg-[#7CFF4D]/10 border border-[#7CFF4D]/20 text-[#7CFF4D] rounded-full">
                    🗓️ Minecraft Sunday Routine
                  </span>
                  <h2 className="text-2xl font-black font-sans text-white tracking-tight leading-7 uppercase italic">
                    Меньше споров в чатах, больше выживания!
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Надоело каждую неделю проводить бесконечные опросы в Телеграме и выяснять, кто когда освободится? 
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Просто создайте лобби, отправьте ссылку друзьям и укажите ваше свободное время. 
                    Умный алгоритм моментально найдёт идеальный **"Золотой час"** для совместного захода на сервер!
                  </p>
                </div>

                {/* Database Synchronization Status widget */}
                <div className="mt-8 border-t border-white/5 pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Database className={`w-4 h-4 ${firebaseEnabled ? "text-[#7CFF4D]" : "text-slate-500"}`} />
                    <span className="font-mono text-slate-400 font-black">СИНХРОНИЗАЦИЯ:</span>
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      firebaseEnabled 
                        ? "bg-[#7CFF4D]/10 text-[#7CFF4D] border border-[#7CFF4D]/20" 
                        : "bg-[#0c0d10] text-slate-500 border border-white/5"
                    }`}>
                      {firebaseEnabled ? "НЕТВОРК (FIRESTORE)" : "ЛОКАЛЬНАЯ ОФФЛАЙН"}
                    </span>
                  </div>
                  {!firebaseEnabled && (
                    <p className="text-[10px] text-slate-600 font-sans">
                      * Облачные комнаты хранятся через Google Firestore. Лобби работает в вашем браузере, пока вы не подключите Firebase в панели Google Cloud!
                    </p>
                  )}
                </div>

              </div>

              {/* Right Column: Register, Join, Create forms container */}
              <div className="md:col-span-7 space-y-6">
                
                {/* 1. Register Name & Create Room Card */}
                <div className="bg-[#14161c] border border-white/5 p-6 rounded-2xl shadow-2xl space-y-6">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <UserPlus className="w-5 h-5 text-[#7CFF4D]" />
                    <h3 className="font-sans text-lg font-black text-white uppercase italic">Создать Комнату Планирования</h3>
                  </div>

                  <form onSubmit={handleCreateLobby} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Name input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block">Твоё Имя Игрока:</label>
                        <input
                          type="text"
                          required
                          value={playerNameInput}
                          onChange={(e) => {
                            setPlayerNameInput(e.target.value);
                            setLobbyCodeInput(""); // reset input so we don't mix actions
                          }}
                          placeholder="Стивон, Алекс, Кнокер..."
                          className="w-full bg-[#0c0d10] text-[#7CFF4D] border border-white/5 px-3.5 py-2.5 rounded-lg text-sm focus:border-[#7CFF4D] focus:outline-none transition-colors font-bold"
                        />
                      </div>

                      {/* Display Title of room */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block">Название Лобби:</label>
                        <input
                          type="text"
                          value={lobbyTitleInput}
                          onChange={(e) => setLobbyTitleInput(e.target.value)}
                          placeholder="Поход за незеритом, Обычное выживание..."
                          className="w-full bg-[#0c0d10] text-white border border-white/5 px-3.5 py-2.5 rounded-lg text-sm focus:border-[#7CFF4D] focus:outline-none transition-colors font-semibold"
                        />
                      </div>

                    </div>

                    {/* Skin Avatar Selector */}
                    <div className="space-y-2">
                      <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block">Выбери Скин Аватара:</span>
                      <div className="flex flex-wrap gap-2.5">
                        {AVATAR_SEEDS.map((seed) => (
                          <button
                            key={seed}
                            type="button"
                            onClick={() => setSelectedAvatar(seed)}
                            className={`p-1.5 px-2.5 rounded-md border-2 transition-all flex items-center justify-center gap-1.5 capitalize text-xs font-mono font-black cursor-pointer ${
                              selectedAvatar === seed
                                ? "bg-[#7CFF4D] border-white text-black"
                                : "bg-[#0c0d10] border-white/5 text-slate-400 hover:border-white/10"
                            }`}
                          >
                            <MinecraftAvatar name={seed === "random" ? playerNameInput || "guerrio" : seed} size={22} className="shrink-0" />
                            <span>{seed}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#7CFF4D] hover:bg-[#a1ff84] text-black font-black uppercase text-xs tracking-wider italic rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                      id="create-lobby-form-submit-btn"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      Создать Комнату синхронизации
                    </button>
                  </form>
                </div>

                {/* 2. Join Existing Room Card */}
                <div className="bg-[#14161c] border border-white/5 p-6 rounded-2xl shadow-2xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Users className="w-5 h-5 text-slate-400" />
                    <h3 className="font-sans text-lg font-black text-white uppercase italic">Присоединиться по Коду</h3>
                  </div>

                  <form onSubmit={handleJoinLobby} className="flex gap-2.5">
                    <input
                      type="text"
                      value={lobbyCodeInput}
                      onChange={(e) => setLobbyCodeInput(e.target.value)}
                      placeholder="ВВЕДИТЕ КОД (НАПР. MN-349)"
                      className="flex-1 bg-[#0c0d10] text-[#7CFF4D] border border-white/5 px-4 py-2.5 rounded-lg text-sm font-mono font-bold focus:border-[#7CFF4D] focus:outline-none transition-colors uppercase"
                    />
                    <button
                      type="submit"
                      className="px-6 bg-[#1a1c23] hover:bg-white/5 border border-white/5 hover:border-[#7CFF4D]/35 text-slate-300 font-black uppercase text-xs tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                      id="join-lobby-by-code-btn"
                    >
                      Войти
                    </button>
                  </form>
                  <p className="text-[11px] text-slate-550 font-sans">
                    * Скопируйте ссылку с кодом комнаты напрямую, чтобы войти в сессию игры в один клик.
                  </p>
                </div>

              </div>

            </motion.div>
          ) : (
            
            /* SCREEN B: ACTIVE PLANNING LOBBY HUD */
            <motion.div
              key="active-lobby-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6 pt-2"
              id="active-lobby-view"
            >
              
              {/* Top Row: Info card, Lobby Details, Action buttons */}
              <div className="bg-gray-900 border-2 border-gray-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-amber-500 text-gray-950 font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                      ЛОББИ: {lobby.id}
                    </span>
                    <h2 className="font-sans text-xl font-bold text-white tracking-tight">{lobby.title}</h2>
                  </div>
                  <p className="text-xs text-gray-400 font-sans flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-500" />
                    Сбор в следующее воскресенье. Всего игроков подало слоты: <strong className="text-gray-205">{allPlayersList.length}</strong>
                  </p>
                </div>

                {/* Actions group */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto" id="lobby-state-actions">
                  
                  {/* Share button */}
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-xs rounded-lg shadow transition-all cursor-pointer"
                    id="share-lobby-link-btn"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Позвать друзей
                  </button>

                  {/* Simulated Friend Spawning playground button */}
                  <button
                    onClick={handleSpawnFriend}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-amber-500/50 text-gray-300 font-sans font-bold text-xs rounded-lg transition-all cursor-pointer"
                    title="Добавить виртуального NPC игрока для тестирования алгоритма"
                    id="spawn-demo-friend-btn"
                  >
                    <Bot className="w-4 h-4 text-amber-500" />
                    Добавить NPC (+1)
                  </button>

                  {/* Exit Lobby */}
                  <button
                    onClick={handleExitLobby}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 border border-gray-800 hover:border-red-500/40 bg-gray-950 hover:bg-red-950/20 text-gray-400 hover:text-red-400 font-mono text-xs rounded-lg transition-all cursor-pointer"
                    id="leave-lobby-btn"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Выйти
                  </button>
                </div>
              </div>

              {/* GRID WORKSPACE: Two Columns layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Side: Your availability painter & optimal analysis results card (9 columns) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Part 1: Player registration form inside lobby if name cache is empty */}
                  {!currentPlayer ? (
                    <div className="bg-[#14161c] border border-white/5 p-6 rounded-xl shadow-2xl space-y-4">
                      <h3 className="font-sans text-lg font-black text-white uppercase italic">Укажи своё расписание</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        Похоже, вы впервые зашли в это лобби. Зарегистрируйтесь на игровую воскресную сессию:
                      </p>
                      
                      <form onSubmit={handleRegisterPlayer} className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          required
                          value={playerNameInput}
                          onChange={(e) => setPlayerNameInput(e.target.value)}
                          placeholder="Твоё имя в Minecraft"
                          className="flex-1 bg-[#0c0d10] text-[#7CFF4D] border border-white/5 px-3.5 py-2.5 rounded-lg text-sm font-bold focus:border-[#7CFF4D] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-[#7CFF4D] hover:bg-[#a1ff84] text-black font-sans font-black uppercase tracking-wider text-xs rounded-lg shadow hover:shadow-emerald-500/10 cursor-pointer"
                        >
                          Войти в сквад
                        </button>
                      </form>
                    </div>
                  ) : (
                    // Part 1: Painter TimelineGrid
                    <TimelineGrid 
                      intervals={currentPlayer.intervals}
                      onChange={handleIntervalsChange}
                      primaryColor={currentPlayer.color}
                    />
                  )}

                  {/* Part 2: Recommendation & Optimal calculation card */}
                  <LobbySummary 
                    players={mathPlayers}
                    duration={lobby.targetDuration}
                    onDurationChange={handleDurationChange}
                    optimalIntervals={optimalIntervals}
                  />

                  {/* Part 3: Aggregation Heatmap Grid */}
                  <HeatmapView 
                    players={allPlayersList}
                    slotAnalysis={timeSlotAnalysis}
                    optimalStart={primeStart}
                    optimalEnd={primeEnd}
                  />

                </div>

                {/* Right Side Column (4 columns): Registered Friends list */}
                <div className="lg:col-span-4 bg-[#14161c] border border-white/5 rounded-xl p-5 shadow-2xl space-y-5" id="friends-participation-sidebar">
                  
                  {/* Header widget */}
                  <div>
                    <h3 className="font-sans text-base font-black uppercase text-white tracking-widest flex items-center justify-between">
                      <span>Участники</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 bg-[#0c0d10] text-[#7CFF4D] border border-white/5 rounded-full font-bold">
                        {allPlayersList.length} игроков
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Вы можете исключать отдельных игроков из локального расчёта, кликая чекбоксы (симуляция «что, если...»).
                    </p>
                  </div>

                  <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                    {allPlayersList.map((player) => {
                      const isOwner = currentPlayer && currentPlayer.id === player.id;
                      const isExcluded = excludedPlayerIds.has(player.id);

                      return (
                        <div
                          key={player.id}
                          className={`p-3 rounded-lg border flex items-center justify-between gap-2.5 transition-all ${
                            isExcluded 
                              ? "bg-[#0c0d10]/40 border-transparent text-slate-600 opacity-60" 
                              : isOwner
                              ? "bg-[#0c0d10] border-[#7CFF4D]/35 text-white"
                              : "bg-[#0c0d10]/80 border-white/5 text-slate-300 hover:border-white/10"
                          }`}
                          id={`sidebar-friend-${player.id}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            
                            {/* Checkbox toggler to calculate mathematical overlap */}
                            <input
                              type="checkbox"
                              checked={!isExcluded}
                              onChange={() => togglePlayerExclusion(player.id)}
                              className="w-4 h-4 rounded border-white/5 bg-[#14161c] text-[#7CFF4D] focus:ring-[#7CFF4D]/50 cursor-pointer"
                              title="Учитывать ли график игрока в поиске оптимального времени?"
                            />

                            {/* Block avatar */}
                            <MinecraftAvatar name={player.name} size={32} className="shrink-0 border border-white/5" />
                            
                            {/* Metadata */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="text-xs font-bold truncate block max-w-[120px] font-sans"
                                  style={{ color: isExcluded ? "#6B7280" : player.color }}
                                >
                                  {player.name}
                                </span>
                                {isOwner && (
                                  <span className="text-[9px] text-[#7CFF4D] font-mono font-black uppercase">
                                    (ВЫ)
                                  </span>
                                )}
                              </div>
                              
                              {/* Summary hours */}
                              <span className="text-[10px] text-slate-500 font-mono block font-bold">
                                {player.intervals.length === 0 
                                  ? "Не указал часы" 
                                  : `${player.intervals.length} интерв.`}
                              </span>
                            </div>
                          </div>

                          {/* Controls (Kick/Remove) */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleKickPlayer(player.id)}
                              className="p-1 px-1.5 hover:bg-white/5 text-slate-600 hover:text-red-400 rounded-md transition-colors"
                              title="Исключить участника"
                              id={`kick-btn-${player.id}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Simulated Legend guide block */}
                  <div className="bg-[#0c0d10] rounded-lg p-3.5 border border-white/5 text-[11px] text-slate-500 space-y-1.5 font-sans">
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-[9.5px]">Как пользоваться планировщиком:</p>
                    <p>1. Скопируйте ссылку лобби и отправьте её в совместную группу.</p>
                    <p>2. Друзья в реальном времени отметят свои свободные часы.</p>
                    <p>3. **Sunday CraftSync** мгновенно сформирует оптимальное время вещания!</p>
                  </div>

                </div>

              </div>

              {/* COLLAB SHARE MODAL CONTAINER */}
              {isShareModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-45 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#14161c] border border-[#7CFF4D]/30 p-6 rounded-2xl shadow-2xl max-w-md w-full space-y-5 relative"
                    id="alliance-share-modal"
                  >
                    <button
                      onClick={() => setIsShareModalOpen(false)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-[#7CFF4D] text-black rounded-full mx-auto flex items-center justify-center font-bold text-xl animate-bounce">
                        ⛏️
                      </div>
                      <h4 className="font-sans text-lg font-black text-white uppercase italic">Пригласи свой сквад!</h4>
                      <p className="text-xs text-slate-400">Друзья смогут подключиться в реальном времени и отметить своё свободное время на воскресенье.</p>
                    </div>

                    <div className="bg-[#0c0d10] p-3 rounded-lg border border-white/5 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-[#7CFF4D] truncate flex-1 block font-bold">
                        {`${window.location.origin}${window.location.pathname}?room=${lobby.id}`}
                      </span>
                      <button
                        onClick={handleCopyLink}
                        className="p-2 bg-[#7CFF4D] hover:bg-[#a1ff84] text-black rounded-md transition-all uppercase text-xs font-black"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-green-700 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
                      </button>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={() => setIsShareModalOpen(false)}
                        className="px-5 py-2.5 bg-[#1a1c23] hover:bg-white/5 text-slate-350 text-xs font-bold rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                      >
                        Вернуться к сетке
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
