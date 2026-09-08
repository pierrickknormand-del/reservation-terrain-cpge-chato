"use client";

import React, { useState, useMemo } from "react";
import { Calendar, Clock, User, Mail, GraduationCap, Activity, CheckCircle, Download, AlertCircle } from "lucide-react";

// --- TYPES ---
type Slot = { id: string; start: string; end: string };
type ReservationForm = { firstName: string; lastName: string; email: string; track: string; activity: string; };

// --- CONSTANTES & CONFIGURATION ---
const ACADEMIC_YEAR = { start: "2026-09-01", end: "2027-06-30" };
const DAILY_SLOTS: Slot[] = [
  { id: "slot-1", start: "15:00", end: "16:30" },
  { id: "slot-2", start: "16:30", end: "18:00" },
  { id: "slot-3", start: "18:30", end: "20:00" }, // Battement de 18h à 18h30 pour caler le créneau
];

const CPGE_TRACKS = [
  { category: "Scientifiques", options: ["MPSI", "MP2I", "PCSI", "PTSI", "BCPST"] },
  { category: "Économiques & Commerciales", options: ["ECG", "ECT"] },
  { category: "Littéraires", options: ["A/L", "B/L", "Chartes"] },
];

// Mock backend : Créneaux déjà réservés (format: "YYYY-MM-DD" -> ["slot-id"])
const MOCK_BOOKINGS: Record<string, string[]> = {
  "2026-09-10": ["slot-2"],
  "2026-09-15": ["slot-1", "slot-3"],
};

export default function SportsFieldBooking() {
  // --- ETATS ---
  const [date, setDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [formData, setFormData] = useState<ReservationForm>({
    firstName: "", lastName: "", email: "", track: "", activity: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- LOGIQUE METIER ---
  const isWeekend = (dateString: string) => {
    if (!dateString) return false;
    const day = new Date(dateString).getDay();
    return day === 0 || day === 6; // 0 = Dimanche, 6 = Samedi
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setError(null);
    setSelectedSlot(null);

    if (isWeekend(newDate)) {
      setError("Le terrain est strictement fermé le week-end. Veuillez choisir un jour de semaine.");
      setDate("");
      return;
    }
    setDate(newDate);
  };

  const bookedSlotsOnSelectedDate = useMemo(() => MOCK_BOOKINGS[date] || [], [date]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !selectedSlot) {
      setError("Veuillez sélectionner une date et un créneau valide.");
      return;
    }
    setIsModalOpen(true);
  };

  // --- GENERATION ICS ---
  const generateICS = () => {
    if (!selectedSlot || !date) return;
    const [startH, startM] = selectedSlot.start.split(":");
    const [endH, endM] = selectedSlot.end.split(":");
    
    const dStart = new Date(date);
    dStart.setHours(Number(startH), Number(startM));
    const dEnd = new Date(date);
    dEnd.setHours(Number(endH), Number(endM));

    // Format ISO pour iCal (ex: 20260910T150000Z)
    const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Réservation Terrain de Sport - ${formData.activity}
DTSTART:${formatICSDate(dStart)}
DTEND:${formatICSDate(dEnd)}
DESCRIPTION:Responsable : ${formData.firstName} ${formData.lastName} (${formData.track})
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservation-terrain-${date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* EN-TÊTE */}
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Réservation du Terrain Sportif
          </h1>
          <p className="text-slate-500">
            Classes Préparatoires aux Grandes Écoles — Année 2026/2027
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLONNE GAUCHE : SÉLECTION TEMPORELLE */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-slate-400" />
                Date & Créneau
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Jour de réservation
                  </label>
                  <input 
                    type="date"
                    min={ACADEMIC_YEAR.start}
                    max={ACADEMIC_YEAR.end}
                    value={date}
                    onChange={handleDateChange}
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-slate-800 focus:ring-slate-800 p-2 border"
                  />
                </div>

                {date && (
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Créneaux disponibles (1h30)
                    </label>
                    <div className="space-y-2">
                      {DAILY_SLOTS.map((slot) => {
                        const isBooked = bookedSlotsOnSelectedDate.includes(slot.id);
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setSelectedSlot(slot)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                              isBooked 
                                ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                                : isSelected 
                                  ? "bg-slate-900 border-slate-900 text-white shadow-md" 
                                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                            }`}
                          >
                            <span className="flex items-center gap-2 font-medium">
                              <Clock className="w-4 h-4" />
                              {slot.start} - {slot.end}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider">
                              {isBooked ? "Occupé" : isSelected ? "Sélectionné" : "Disponible"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : FORMULAIRE */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-slate-400" />
                Informations du responsable
              </h2>
              
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                    <input 
                      required type="text" 
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-slate-800 focus:ring-slate-800 p-2 border" 
                      placeholder="Jean" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                    <input 
                      required type="text"
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-slate-800 focus:ring-slate-800 p-2 border" 
                      placeholder="Dupont" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email institutionnel
                  </label>
                  <input 
                    required type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-slate-800 focus:ring-slate-800 p-2 border" 
                    placeholder="jean.dupont@lycee.fr" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Filière CPGE
                    </label>
                    <select 
                      required
                      value={formData.track}
                      onChange={e => setFormData({...formData, track: e.target.value})}
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-slate-800 focus:ring-slate-800 p-2 border bg-white"
                    >
                      <option value="">Sélectionner...</option>
                      {CPGE_TRACKS.map(group => (
                        <optgroup key={group.category} label={group.category}>
                          {group.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Activité prévue
                    </label>
                    <input 
                      required type="text"
                      value={formData.activity}
                      onChange={e => setFormData({...formData, activity: e.target.value})}
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-slate-800 focus:ring-slate-800 p-2 border" 
                      placeholder="Ex: Football, Préparation physique..." 
                    />
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-slate-100">
                  <button 
                    type="submit"
                    disabled={!date || !selectedSlot}
                    className="w-full bg-slate-900 text-white font-medium py-3 px-4 rounded-xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmer la réservation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Réservation validée</h3>
              <p className="text-slate-500 text-sm">Votre créneau a été bloqué avec succès.</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-3 border border-slate-100">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-900">{date}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Horaire</span>
                <span className="font-medium text-slate-900">{selectedSlot?.start} - {selectedSlot?.end}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Activité</span>
                <span className="font-medium text-slate-900">{formData.activity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Responsable</span>
                <span className="font-medium text-slate-900">{formData.firstName} {formData.lastName} ({formData.track})</span>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={generateICS}
                className="w-full flex justify-center items-center gap-2 bg-slate-900 text-white font-medium py-2.5 px-4 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Ajouter à l'agenda (.ics)
              </button>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setDate("");
                  setSelectedSlot(null);
                  setFormData({firstName: "", lastName: "", email: "", track: "", activity: ""});
                }}
                className="w-full text-slate-600 font-medium py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Fermer et retourner à l'accueil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
