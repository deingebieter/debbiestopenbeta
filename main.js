/**
 * main.js
 * 
 * Hauptfunktionen für das Schuldenverwaltungssystem
 * Datum: 2025-04-20 23:41:03
 * Benutzer: deingebieter
 */

// Vorhandene Funktionen...

// Funktion zur Aktualisierung des aktuellen Datums
function updateCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  document.getElementById('currentDate').textContent = `Datum: ${formattedDate}`;
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
  // Falls das Datum nicht in der Seite enthalten ist, initialisiere es
  updateCurrentDate();
  
  // Event-Listener für Action Select
  const actionSelect = document.getElementById('actionSelect');
  if (actionSelect) {
    actionSelect.addEventListener('change', function() {
      // Verstecke alle Sektionen
      document.getElementById('createSection').classList.add('hidden');
      document.getElementById('manageSection').classList.add('hidden');
      document.getElementById('searchSection').classList.add('hidden');
      document.getElementById('userSection').classList.add('hidden');
      
      // Zeige die gewählte Sektion
      switch(this.value) {
        case 'create':
          document.getElementById('createSection').classList.remove('hidden');
          break;
        case 'manage':
          document.getElementById('manageSection').classList.remove('hidden');
          break;
        case 'search':
          document.getElementById('searchSection').classList.remove('hidden');
          break;
        case 'user':
          document.getElementById('userSection').classList.remove('hidden');
          break;
      }
    });
  }
  
  // Event-Listener für User Action Select
  const userActionSelect = document.getElementById('userActionSelect');
  if (userActionSelect) {
    userActionSelect.addEventListener('change', function() {
      // Verstecke alle Benutzer-Sektionen
      document.getElementById('userCreateSection').classList.add('hidden');
      document.getElementById('userManageSection').classList.add('hidden');
      document.getElementById('userDeleteSection').classList.add('hidden');
      
      // Zeige die gewählte Sektion
      switch(this.value) {
        case 'create':
          document.getElementById('userCreateSection').classList.remove('hidden');
          break;
        case 'manage':
          document.getElementById('userManageSection').classList.remove('hidden');
          break;
        case 'delete':
          document.getElementById('userDeleteSection').classList.remove('hidden');
          break;
      }
    });
  }
});

// Weitere Funktionen...