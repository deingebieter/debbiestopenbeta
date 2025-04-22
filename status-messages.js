/**
 * status-messages.js
 * 
 * Funktionen zur Anzeige von Statusmeldungen
 * Datum: 2025-04-20 23:20:10
 * Benutzer: deingebieter
 */

// Funktion zur Anzeige von Statusmeldungen
function showStatusMessage(message, type = 'info') {
  // Erstelle das Statusmeldungselement
  const statusElement = document.createElement('div');
  statusElement.className = `status-message ${type}`;
  statusElement.textContent = message;
  
  // Füge das Element zum Dokument hinzu
  document.body.appendChild(statusElement);
  
  // Blende die Nachricht nach einer Verzögerung aus
  setTimeout(() => {
    statusElement.classList.add('fade-out');
    setTimeout(() => {
      if (document.body.contains(statusElement)) {
        document.body.removeChild(statusElement);
      }
    }, 500);
  }, 5000);
}

// Globale Funktion zum Zurückgeben eines formatierten Datums
function formatDate(dateString) {
  if (!dateString) return 'Nicht angegeben';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Globale Funktion zum Formatieren von Geldbeträgen
function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

// Handler für den Datenimport von Dateien
function handleDataImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const success = storageManager.importData(e.target.result);
      
      if (success) {
        // Aktualisiere die Anzeige, falls notwendig
        const currentAction = document.getElementById('actionSelect').value;
        if (currentAction === 'search') {
          displayDatasets(storageManager.getAllDatasets(), 'search');
        }
        
        // Setze das Datei-Input-Feld zurück
        event.target.value = '';
      }
    } catch (error) {
      console.error('Fehler beim Importieren der Daten:', error);
      showStatusMessage('Die Datei konnte nicht importiert werden: ' + error.message, 'error');
    }
  };
  reader.readAsText(file);
}