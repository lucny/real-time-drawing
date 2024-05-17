// Kód se spustí, když se celý dokument načte
document.addEventListener('DOMContentLoaded', () => {
  // Získání reference na element canvas a jeho kontext
  const canvas = document.getElementById('drawingCanvas');
  const context = canvas.getContext('2d');
  
  // Inicializace socket.io klienta
  const socket = io();
  
  // Proměnná pro sledování, zda se právě kreslí
  let drawing = false;
  
  // Objekt pro ukládání aktuální barvy a pozice
  const current = {
    color: 'black' // Výchozí barva kreslení
  };

  // Nastavení velikosti canvasu na celou šířku a výšku okna
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Přidání event listenerů pro události myši
  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

  // Přidání listeneru pro příjem kreslení od jiných uživatelů
  socket.on('drawing', onDrawingEvent);

  // Funkce pro vykreslení čáry
  function drawLine(x0, y0, x1, y1, color, emit){
    context.beginPath(); // Začátek cesty
    context.moveTo(x0, y0); // Nastavení výchozího bodu
    context.lineTo(x1, y1); // Nastavení cílového bodu
    context.strokeStyle = color; // Nastavení barvy čáry
    context.lineWidth = 2; // Nastavení tloušťky čáry
    context.stroke(); // Vykreslení čáry
    context.closePath(); // Ukončení cesty

    if (!emit) { return; } // Pokud nemáme emitovat událost, funkce se ukončí
    
    // Normalizace souřadnic pro odeslání na server
    const w = canvas.width;
    const h = canvas.height;

    // Odeslání události kreslení na server
    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });
  }

  // Funkce pro zpracování stisknutí tlačítka myši
  function onMouseDown(e){
    drawing = true; // Nastavení příznaku kreslení
    current.x = e.clientX; // Uložení aktuální x pozice
    current.y = e.clientY; // Uložení aktuální y pozice
  }

  // Funkce pro zpracování uvolnění tlačítka myši
  function onMouseUp(e){
    if (!drawing) { return; } // Pokud se nekreslí, funkce se ukončí
    drawing = false; // Nastavení příznaku kreslení na false
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true); // Vykreslení čáry
  }

  // Funkce pro zpracování pohybu myši
  function onMouseMove(e){
    if (!drawing) { return; } // Pokud se nekreslí, funkce se ukončí
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true); // Vykreslení čáry
    current.x = e.clientX; // Aktualizace x pozice
    current.y = e.clientY; // Aktualizace y pozice
  }

  // Funkce pro omezení frekvence volání jiné funkce (throttling)
  function throttle(callback, delay) {
    let previousCall = new Date().getTime(); // Čas posledního volání
    return function() {
      const time = new Date().getTime(); // Aktuální čas

      if ((time - previousCall) >= delay) { // Pokud uplynulo dostatek času od posledního volání
        previousCall = time; // Aktualizace času posledního volání
        callback.apply(null, arguments); // Volání callback funkce
      }
    };
  }

  // Funkce pro zpracování kreslení od jiných uživatelů
  function onDrawingEvent(data){
    const w = canvas.width; // Šířka canvasu
    const h = canvas.height; // Výška canvasu
    // Vykreslení čáry s normalizovanými souřadnicemi
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }

  // Přidání listeneru pro změnu velikosti okna
  window.addEventListener('resize', onResize, false);
  function onResize() {
    canvas.width = window.innerWidth; // Aktualizace šířky canvasu
    canvas.height = window.innerHeight; // Aktualizace výšky canvasu
  }
});
