import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { Screen, SeatCategory } from '../../types';
import { Tv, Volume2, Sparkles, CheckCircle, Edit2, Accessibility } from 'lucide-react';

export const AdminScreens: React.FC = () => {
  const [screens, setScreens] = useState<Screen[]>(() => storageService.getScreens());
  const [selectedScreen, setSelectedScreen] = useState<Screen>(screens[0]);
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  // Prices by category for the selected screen
  const [reclinerPrice, setReclinerPrice] = useState(350);
  const [primePrice, setPrimePrice] = useState(240);
  const [classicPrice, setClassicPrice] = useState(180);

  const handleSelectScreen = (screen: Screen) => {
    setSelectedScreen(screen);
    const recRow = screen.rows.find((r) => r.category === 'RECLINER');
    const priRow = screen.rows.find((r) => r.category === 'PRIME');
    const claRow = screen.rows.find((r) => r.category === 'CLASSIC');

    setReclinerPrice(recRow ? recRow.price : 350);
    setPrimePrice(priRow ? priRow.price : 240);
    setClassicPrice(claRow ? claRow.price : 180);
  };

  const handleSavePrices = () => {
    const updatedRows = selectedScreen.rows.map((row) => {
      let price = row.price;
      if (row.category === 'RECLINER') price = reclinerPrice;
      if (row.category === 'PRIME') price = primePrice;
      if (row.category === 'CLASSIC') price = classicPrice;
      return { ...row, price };
    });

    const updatedScreen: Screen = { ...selectedScreen, rows: updatedRows };
    storageService.saveScreen(updatedScreen);
    setScreens(storageService.getScreens());
    setSelectedScreen(updatedScreen);
    setIsEditingPrice(false);
    alert('Base seating tier pricing updated successfully!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white font-cinema">Screen & Seat Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure auditorium layout, acoustic calibration, and seating tier base tariffs.
          </p>
        </div>

        {/* Screen switcher */}
        <div className="flex items-center space-x-2">
          {screens.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectScreen(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedScreen.id === s.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {s.name.split(' - ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Screen Specs & Pricing Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Technical Specs */}
        <div className="p-6 rounded-3xl bg-[#0e1422] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-base font-bold text-white">{selectedScreen.name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
              ACTIVE
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Total Seating:</span>
              <span className="font-mono font-bold text-white">{selectedScreen.totalSeats} Seats</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Sound Engine:</span>
              <span className="text-slate-200">{selectedScreen.soundSystem}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Projection:</span>
              <span className="text-slate-200">{selectedScreen.projection}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Row Matrix:</span>
              <span className="font-mono text-slate-200">{selectedScreen.rows.length} Rows (A - {selectedScreen.rows[selectedScreen.rows.length - 1]?.rowLabel})</span>
            </div>
          </div>
        </div>

        {/* Pricing Editor (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0e1422] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Base Tier Tariffs (INR)</h3>
              <p className="text-xs text-slate-400">Default ticket price per seat category for this auditorium</p>
            </div>
            {!isEditingPrice ? (
              <button
                onClick={() => setIsEditingPrice(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Adjust Prices</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditingPrice(false)}
                  className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePrices}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/30 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase">👑 Royal Recliner</div>
              <div className="text-2xl font-black text-white font-mono">
                {isEditingPrice ? (
                  <input
                    type="number"
                    value={reclinerPrice}
                    onChange={(e) => setReclinerPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-amber-600/50 rounded-lg p-1 text-sm text-white"
                  />
                ) : (
                  `₹${reclinerPrice}`
                )}
              </div>
              <p className="text-[10px] text-slate-400">Motorized leather lounger (Rows A & B)</p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-600/30 space-y-2">
              <div className="text-xs font-bold text-sky-400 uppercase">⭐ Prime VIP</div>
              <div className="text-2xl font-black text-white font-mono">
                {isEditingPrice ? (
                  <input
                    type="number"
                    value={primePrice}
                    onChange={(e) => setPrimePrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-sky-600/50 rounded-lg p-1 text-sm text-white"
                  />
                ) : (
                  `₹${primePrice}`
                )}
              </div>
              <p className="text-[10px] text-slate-400">Cushioned ergonomic comfort</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase">🎟️ Classic Executive</div>
              <div className="text-2xl font-black text-white font-mono">
                {isEditingPrice ? (
                  <input
                    type="number"
                    value={classicPrice}
                    onChange={(e) => setClassicPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-sm text-white"
                  />
                ) : (
                  `₹${classicPrice}`
                )}
              </div>
              <p className="text-[10px] text-slate-400">Standard cinema auditorium seating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seating Layout Visualizer */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1422] border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Auditorium Seating Matrix Visualizer</h3>
            <p className="text-xs text-slate-400">Configured seats, categories, aisle breaks, and accessibility</p>
          </div>
        </div>

        {/* Screen curve banner */}
        <div className="py-4 flex flex-col items-center">
          <div className="w-2/3 max-w-xl h-6 screen-curve bg-gradient-to-b from-sky-400/20 to-transparent flex items-center justify-center">
            <span className="text-[10px] font-bold tracking-widest text-sky-300 uppercase">
              Auditorium Screen Direction
            </span>
          </div>
        </div>

        {/* Seat rows preview */}
        <div className="overflow-x-auto pb-6">
          <div className="min-w-[600px] space-y-4 flex flex-col items-center">
            {selectedScreen.rows.map((row) => (
              <div key={row.rowLabel} className="flex items-center space-x-2">
                <span className="w-6 text-center text-xs font-black text-slate-400 font-mono">
                  {row.rowLabel}
                </span>

                <div className="flex items-center space-x-1.5">
                  {row.seats.map((seat) => (
                    <React.Fragment key={seat.label}>
                      <div
                        className={`w-7 h-7 rounded text-[10px] font-bold flex items-center justify-center border ${
                          row.category === 'RECLINER'
                            ? 'bg-amber-950/60 border-amber-600/50 text-amber-300'
                            : row.category === 'PRIME'
                            ? 'bg-sky-950/60 border-sky-600/50 text-sky-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                        title={`${seat.label} (${row.category})`}
                      >
                        {seat.isAccessible ? (
                          <Accessibility className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <span>{seat.seatNumber}</span>
                        )}
                      </div>
                      {seat.isAisle && <div className="w-4" />}
                    </React.Fragment>
                  ))}
                </div>

                <span className="w-6 text-center text-xs font-black text-slate-400 font-mono">
                  {row.rowLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
