import React, { useState, useRef, useEffect } from "react";

const LOCAL_STORAGE_KEY = "react_sticky_board_notes";

const DEFAULT_NOTES = [
  { id: 1, x: 100, y: 150, width: 200, height: 200, text: "Drag me to the bottom-right corner to delete me!", color: "#fef08a" },
  { id: 2, x: 400, y: 200, width: 220, height: 180, text: "Resize or move me around.", color: "#bae6fd" },
];

export default function StickyNotesApp() {
  const [notes, setNotes] = useState(() => {
    try {
      const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedNotes ? JSON.parse(savedNotes) : DEFAULT_NOTES;
    } catch (error) {
      console.error("Failed to parse notes:", error);
      return DEFAULT_NOTES;
    }
  });

  const [activeAction, setActiveAction] = useState(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  
  const boardRef = useRef(null);
  const trashRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const handleBoardDoubleClick = (e) => {
    if (e.target !== boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colors = ["#fef08a", "#bae6fd", "#bbf7d0", "#fbcfe8", "#fed7aa"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newNote = {
      id: Date.now(),
      x: x - 100,
      y: y - 100,
      width: 200,
      height: 200,
      text: "Double click to edit text...",
      color: randomColor,
    };

    setNotes((prev) => [...prev, newNote]);
  };

  const updateNoteText = (id, newText) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text: newText } : n)));
  };

  const clearAllNotes = () => {
    if (window.confirm("Are you sure you want to delete all notes?")) {
      setNotes([]);
    }
  };

  // --- Pointer Handlers ---
  const startMove = (e, note) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);

    // Bring note to front
    setNotes((prev) => {
      const filtered = prev.filter((n) => n.id !== note.id);
      return [...filtered, note];
    });

    setActiveAction({
      type: "move",
      noteId: note.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: note.x,
      initialY: note.y,
    });
  };

  const startResize = (e, note) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);

    setActiveAction({
      type: "resize",
      noteId: note.id,
      startX: e.clientX,
      startY: e.clientY,
      initialW: note.width,
      initialH: note.height,
    });
  };

  const handlePointerMove = (e) => {
    if (!activeAction) return;

    const deltaX = e.clientX - activeAction.startX;
    const deltaY = e.clientY - activeAction.startY;

    if (activeAction.type === "move") {
      const newX = activeAction.initialX + deltaX;
      const newY = activeAction.initialY + deltaY;

      setNotes((prev) =>
        prev.map((n) => (n.id === activeAction.noteId ? { ...n, x: newX, y: newY } : n))
      );

      // Checks if current drag movement goes over trash.
      if (trashRef.current) {
        const trashRect = trashRef.current.getBoundingClientRect();
        const isInTrash =
          e.clientX >= trashRect.left &&
          e.clientX <= trashRect.right &&
          e.clientY >= trashRect.top &&
          e.clientY <= trashRect.bottom;
        
        setIsOverTrash(isInTrash);
      }
    }

    if (activeAction.type === "resize") {
      const newW = Math.max(120, activeAction.initialW + deltaX);
      const newH = Math.max(120, activeAction.initialH + deltaY);

      setNotes((prev) =>
        prev.map((n) => (n.id === activeAction.noteId ? { ...n, width: newW, height: newH } : n))
      );
    }
  };

  const handlePointerUp = (e) => {
    if (!activeAction) return;

    if (activeAction.type === "move" && isOverTrash) {
      setNotes((prev) => prev.filter((n) => n.id !== activeAction.noteId));
    }

    setActiveAction(null);
    setIsOverTrash(false);
  };

  // Determine if a note is actively being moved right now
  const isDraggingANote = activeAction?.type === "move";

  return (
    <div className="w-screen h-screen bg-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Control Banner */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
        <div>
          <h1 class="text-xl font-bold text-blue-600">Stikio</h1>
          <p className="text-xs text-slate-500">Double-click canvas to create a note • Changes auto-save</p>
        </div>
        <button
          onClick={clearAllNotes}
          className="px-1 py-1.5 bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          Clear Board
        </button>
      </header>

      {/* Main Interactive Board Canvas */}
      <main
        ref={boardRef}
        onDoubleClick={handleBoardDoubleClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] touch-none overflow-hidden"
      >
        {/* Sticky Notes Rendering Loop */}
        {notes.map((note) => {
          const isCurrentMovingNote = activeAction?.noteId === note.id && activeAction.type === "move";
          
          return (
            <div
              key={note.id}
              style={{
                position: "absolute",
                left: `${note.x}px`,
                top: `${note.y}px`,
                width: `${note.width}px`,
                height: `${note.height}px`,
                backgroundColor: note.color,
                // Note shrinks and turns transparent as it enters the bottom-right trash area
                transform: isCurrentMovingNote && isOverTrash ? "scale(0.35) translate3d(0,0,0)" : "scale(1) translate3d(0,0,0)",
                opacity: isCurrentMovingNote && isOverTrash ? 0.3 : 1,
              }}
              className={`shadow-md rounded-lg flex flex-col overflow-hidden border border-black/10 group transition-all duration-150 ${
                isCurrentMovingNote ? "shadow-2xl z-40 cursor-grabbing" : "hover:shadow-lg z-20"
              }`}
            >
              
              <div
                onPointerDown={(e) => startMove(e, note)}
                className="h-7 bg-black/5 border-b border-black/5 cursor-grab flex items-center justify-between px-2 active:cursor-grabbing"
              >
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-black/20" />
                  <span className="w-2 h-2 rounded-full bg-black/20" />
                  <span className="w-2 h-2 rounded-full bg-black/20" />
                </div>
              </div>

              {/* Editable Text Area */}
              <textarea
                value={note.text}
                onChange={(e) => updateNoteText(note.id, e.target.value)}
                className="flex-1 p-3 bg-transparent resize-none border-none outline-none text-slate-800 text-sm leading-relaxed font-medium"
                onDoubleClick={(e) => e.stopPropagation()}
              />

              {/* Dragging zone */}
              <div
                onPointerDown={(e) => startResize(e, note)}
                className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end p-0.5 z-30"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" className="text-black/30 fill-current">
                  <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="10" y1="4" x2="4" y2="10" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          );
        })}

        {/* Trash Zone */}
        <div
          ref={trashRef}
          style={{
            pointerEvents: isDraggingANote ? "auto" : "none"
          }}
          className={`absolute top-6 left-6 w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 shadow-xl transition-all duration-300 z-50 ${
            isDraggingANote 
              ? "opacity-100 scale-100 translate-y-0" 
              : "opacity-0 scale-75 translate-y-10"
          } ${
            isOverTrash
              ? "bg-red-500 border-red-600 text-white scale-125 ring-4 ring-red-200"
              : "bg-white border-red-200 text-red-500 hover:scale-105"
          }`}
        >
          {/* Animated Trash Can Icon */}
          <svg 
            xmlns="http://w3.org" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth="2" 
            stroke="currentColor" 
            className={`w-8 h-8 transition-transform duration-200 ${isOverTrash ? "scale-110 animate-bounce" : ""}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          <span className="text-[10px] font-bold tracking-wider uppercase mt-1">
            {isOverTrash ? "Drop!" : "Delete"}
          </span>
        </div>
      </main>
    </div>
  );
}

