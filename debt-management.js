/**
 * Funktionen für die Verwaltung von Datensätzen
 */

// Aktuell geladener Datensatz
let currentEntry = null;

/**
 * Lädt eine einzelne Datensatzdatei und zeigt sie an
 * @param {Event} event - Das Datei-Upload-Event
 */
function loadSingleFileData(event) {
  console.log("loadSingleFileData wurde aufgerufen");
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      console.log("Geladene Daten:", data);
      displayEntry(data);
      document.getElementById('deleteButton').classList.remove('hidden');
    } catch (error) {
      console.error("Fehler beim Lesen der Datei:", error);
      alert('Die Datei konnte nicht gelesen werden: ' + error.message);
    }
  };
  reader.onerror = function(e) {
    console.error("Fehler beim Lesen der Datei:", e.target.error);
    alert('Die Datei konnte nicht gelesen werden: ' + e.target.error);
  };
  reader.readAsText(file);
}

/**
 * Zeigt einen Datensatz im Verwaltungsbereich an
 * @param {Object} entry - Der anzuzeigende Datensatz
 */
function displayEntry(entry) {
  console.log("displayEntry wurde aufgerufen:", entry);
  
  if (!entry) {
    console.error("Kein gültiger Datensatz zum Anzeigen.");
    return;
  }
  
  // Aktuellen Datensatz speichern
  currentEntry = entry;
  
  // Die Container für die Anzeige finden
  const entryDisplay = document.getElementById('entryDisplay');
  if (!entryDisplay) {
    console.error("Element 'entryDisplay' nicht gefunden!");
    return;
  }
  
  // Formatierte Anzeige erstellen
  let html = '<div class="entry-details">';
  
  // Hauptdetails des Datensatzes
  html += `
    <h3>Datensatz: ${escapeHtml(entry.id)}</h3>
    <div class="detail-row">
      <div class="detail-label">Name:</div>
      <div class="detail-value">${escapeHtml(entry.personName)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Summe:</div>
      <div class="detail-value">${entry.amount} €</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Typ:</div>
      <div class="detail-value">${entry.type === 'ich_schulde' ? 'Schuld' : 'Kredit'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Zinsen:</div>
      <div class="detail-value">${entry.interest} ${entry.interestType === 'percent' ? '%' : '€'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Ratenzahlung:</div>
      <div class="detail-value">${entry.installmentPlan === 'ja' ? 'Ja' : 'Nein'}</div>
    </div>
  `;
  
  // Zeigt die monatliche Rate an, falls Ratenzahlung aktiviert ist
  if (entry.installmentPlan === 'ja') {
    html += `
      <div class="detail-row">
        <div class="detail-label">Monatliche Rate:</div>
        <div class="detail-value">${entry.monthlyRate} €</div>
      </div>
      <div class="management-buttons">
        <button onclick="openRatenzahlungsPopup()">Ratenzahlungs-Management</button>
      </div>
    `;
  }
  
  // Zahlungsziel und Datumsangaben
  html += `
    <div class="detail-row">
      <div class="detail-label">Zahlungsziel:</div>
      <div class="detail-value">${formatDate(entry.paymentDue)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Erstellt am:</div>
      <div class="detail-value">${formatDateTime(entry.creationDate)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Letzte Änderung:</div>
      <div class="detail-value">${formatDateTime(entry.lastModified)}</div>
    </div>
  `;
  
  // KORRIGIERTE Anzeige der Status-Indikatoren
  // Eintragsdetails anzeigen (wenn vorhanden)
  html += `
    <div class="entry-section">
      <h4>Status</h4>
      <div class="status-indicators">
        <div class="status-item ${entry.paymentStatus && entry.paymentStatus.delay ? 'active' : ''}">
          <span class="status-icon">⚠️</span>
          <span class="status-text">Zahlungsverzug</span>
        </div>
        <div class="status-item ${entry.paymentStatus && entry.paymentStatus.defer ? 'active' : ''}">
          <span class="status-icon">⏱️</span>
          <span class="status-text">Zahlungsaufschub</span>
        </div>
        <div class="status-item ${entry.paymentStatus && entry.paymentStatus.refusal ? 'active' : ''}">
          <span class="status-icon">❌</span>
          <span class="status-text">Zahlungsverweigerung</span>
        </div>
      </div>
    </div>
  `;
  
  // Vermerke anzeigen
  html += '<div class="entry-section"><h4>Vermerke</h4>';
  
  if (entry.notes && entry.notes.length > 0) {
    html += '<div class="notes-list">';
    entry.notes.forEach(note => {
      html += `
        <div class="note-item">
          <div class="note-date">${formatDateTime(note.date)}</div>
          <div class="note-text">${escapeHtml(note.text)}</div>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += '<p class="no-data">Keine Vermerke vorhanden.</p>';
  }
  
  html += `
    <div class="note-actions">
      <button onclick="openNotePopup()">Vermerk hinzufügen</button>
    </div>
  </div>`;
  
  // Zahlungsverlauf anzeigen
  html += '<div class="entry-section"><h4>Zahlungsverlauf</h4>';
  
  if (entry.paymentHistory && entry.paymentHistory.length > 0) {
    html += `
      <table class="payment-history">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Betrag</th>
            <th>Bemerkung</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    entry.paymentHistory.forEach(payment => {
      html += `
        <tr>
          <td>${formatDateTime(payment.date)}</td>
          <td>${payment.amount} €</td>
          <td>${escapeHtml(payment.note || '')}</td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
  } else {
    html += '<p class="no-data">Kein Zahlungsverlauf vorhanden.</p>';
  }
  
  html += '</div>';
  
  // Exportieren-Button
  html += `
    <div class="entry-actions">
      <button onclick="exportEntry()">Datensatz exportieren</button>
      <button onclick="editEntry()">Datensatz bearbeiten</button>
    </div>
  `;
  
  html += '</div>';
  
  // HTML in den Container einfügen
  entryDisplay.innerHTML = html;
}

/**
 * Löscht den aktuellen Datensatz
 */
function deleteDebtEntry() {
  if (!currentEntry) {
    alert('Kein Datensatz zum Löschen ausgewählt!');
    return;
  }
  
  const confirmation = confirm(`Möchten Sie den Datensatz "${currentEntry.id}" wirklich löschen?`);
  if (confirmation) {
    try {
      // Versuchen, den Datensatz aus dem storageManager zu löschen
      if (typeof storageManager !== 'undefined' && typeof storageManager.deleteData === 'function') {
        storageManager.deleteData(currentEntry.id);
        console.log("Datensatz wurde gelöscht:", currentEntry.id);
      } else {
        // Fallback: Aus dem localStorage löschen
        localStorage.removeItem(`dataset_${currentEntry.id}`);
        console.log("Datensatz wurde aus localStorage gelöscht:", currentEntry.id);
      }
      
      // UI aufräumen
      document.getElementById('entryDisplay').innerHTML = '<p class="success-message">Datensatz wurde erfolgreich gelöscht.</p>';
      document.getElementById('deleteButton').classList.add('hidden');
      currentEntry = null;
      
      // Datei-Input zurücksetzen
      const fileInput = document.getElementById('fileInputManage');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error("Fehler beim Löschen des Datensatzes:", error);
      alert('Fehler beim Löschen des Datensatzes: ' + error.message);
    }
  }
}

/**
 * Öffnet das Ratenzahlungs-Popup
 */
function openRatenzahlungsPopup() {
  console.log("Öffne Ratenzahlungs-Popup");
  
  // Überprüfe, ob die Elemente existieren
  const overlay = document.getElementById('overlay');
  const popup = document.getElementById('ratenzahlungsPopup');
  
  if (!overlay || !popup) {
    console.error('Overlay oder Popup-Element nicht gefunden:');
    console.error('overlay:', overlay);
    console.error('popup:', popup);
    alert('Fehler: Die Popup-Elemente wurden nicht gefunden.');
    return;
  }
  
  // Zeige das Popup
  overlay.classList.remove('hidden');
  popup.classList.remove('hidden');
  
  // Initialisiere die Status-Auswahl basierend auf dem aktuellen Status
  if (currentEntry && currentEntry.paymentStatus) {
    document.getElementById('paymentDelaySelect').value = currentEntry.paymentStatus.delay ? 'set' : 'unset';
    document.getElementById('paymentDeferSelect').value = currentEntry.paymentStatus.defer ? 'set' : 'unset';
    document.getElementById('paymentRefusalSelect').value = currentEntry.paymentStatus.refusal ? 'set' : 'unset';
  } else {
    // Setze Standardwerte, wenn kein Status vorhanden ist
    document.getElementById('paymentDelaySelect').value = '';
    document.getElementById('paymentDeferSelect').value = '';
    document.getElementById('paymentRefusalSelect').value = '';
  }
}

/**
 * Schließt das Ratenzahlungs-Popup
 */
function closeRatenzahlungsPopup() {
  console.log("Schließe Ratenzahlungs-Popup");
  
  // Überprüfe, ob die Elemente existieren
  const overlay = document.getElementById('overlay');
  const popup = document.getElementById('ratenzahlungsPopup');
  
  if (!overlay || !popup) {
    console.error('Overlay oder Popup-Element nicht gefunden.');
    return;
  }
  
  // Verstecke das Popup
  overlay.classList.add('hidden');
  popup.classList.add('hidden');
  
  // Selects zurücksetzen
  document.getElementById('paymentDelaySelect').value = '';
  document.getElementById('paymentDeferSelect').value = '';
  document.getElementById('paymentRefusalSelect').value = '';
}

/**
 * Aktualisiert den Status des aktuellen Datensatzes basierend auf den Popup-Eingaben
 */
function updateDebtStatus() {
  if (!currentEntry) {
    alert('Kein Datensatz ausgewählt!');
    return;
  }
  
  // Status-Werte aus den Select-Elementen abrufen
  const paymentDelay = document.getElementById('paymentDelaySelect').value === 'set';
  const paymentDefer = document.getElementById('paymentDeferSelect').value === 'set';
  const paymentRefusal = document.getElementById('paymentRefusalSelect').value === 'set';
  
  // Wenn kein Status gesetzt ist, nichts tun
  if (document.getElementById('paymentDelaySelect').value === '' &&
      document.getElementById('paymentDeferSelect').value === '' &&
      document.getElementById('paymentRefusalSelect').value === '') {
    closeRatenzahlungsPopup();
    return;
  }
  
  // Status-Objekt initialisieren, falls nicht vorhanden
  if (!currentEntry.paymentStatus) {
    currentEntry.paymentStatus = {};
  }
  
  // Status aktualisieren mit vereinheitlichten Property-Namen
  if (document.getElementById('paymentDelaySelect').value !== '') {
    currentEntry.paymentStatus.delay = paymentDelay;
  }
  if (document.getElementById('paymentDeferSelect').value !== '') {
    currentEntry.paymentStatus.defer = paymentDefer;
  }
  if (document.getElementById('paymentRefusalSelect').value !== '') {
    currentEntry.paymentStatus.refusal = paymentRefusal;
  }
  
  // Datensatz speichern
  saveCurrentEntry();
  
  // Popup schließen
  closeRatenzahlungsPopup();
  
  // Anzeige aktualisieren
  displayEntry(currentEntry);
  
  alert('Status aktualisiert!');
}

/**
 * Speichert den aktuellen Datensatz
 */
function saveCurrentEntry() {
  if (!currentEntry) return;
  
  try {
    if (typeof storageManager !== 'undefined' && typeof storageManager.saveData === 'function') {
      storageManager.saveData(currentEntry);
    } else {
      // Fallback: Im localStorage speichern
      localStorage.setItem(`dataset_${currentEntry.id}`, JSON.stringify(currentEntry));
    }
    console.log("Datensatz gespeichert:", currentEntry);
  } catch (error) {
    console.error("Fehler beim Speichern des Datensatzes:", error);
    alert('Fehler beim Speichern des Datensatzes: ' + error.message);
  }
}

/**
 * Öffnet das Notiz-Popup
 */
function openNotePopup() {
  console.log("Öffne Notiz-Popup");
  
  // Überprüfe, ob die Elemente existieren
  const overlay = document.getElementById('overlay');
  const popup = document.getElementById('notePopup');
  
  if (!overlay || !popup) {
    console.error('Overlay oder Popup-Element nicht gefunden.');
    alert('Fehler: Die Popup-Elemente wurden nicht gefunden.');
    return;
  }
  
  // Zeige das Popup
  overlay.classList.remove('hidden');
  popup.classList.remove('hidden');
  document.getElementById('noteText').value = '';
}

/**
 * Schließt das Notiz-Popup
 */
function closeNotePopup() {
  console.log("Schließe Notiz-Popup");
  
  // Überprüfe, ob die Elemente existieren
  const overlay = document.getElementById('overlay');
  const popup = document.getElementById('notePopup');
  
  if (!overlay || !popup) {
    console.error('Overlay oder Popup-Element nicht gefunden.');
    return;
  }
  
  // Verstecke das Popup
  overlay.classList.add('hidden');
  popup.classList.add('hidden');
}

/**
 * Fügt eine Notiz zum aktuellen Datensatz hinzu
 */
function addNote() {
  if (!currentEntry) {
    alert('Kein Datensatz ausgewählt!');
    closeNotePopup();
    return;
  }
  
  const note = document.getElementById('noteText').value.trim();
  if (!note) {
    alert('Bitte geben Sie einen Text ein.');
    return;
  }
  
  // Notiz erstellen
  const newNote = {
    date: new Date().toISOString(),
    text: note
  };
  
  // Notizen-Array initialisieren, falls nicht vorhanden
  if (!currentEntry.notes) {
    currentEntry.notes = [];
  }
  
  // Notiz hinzufügen
  currentEntry.notes.push(newNote);
  
  // Letzte Änderung aktualisieren
  currentEntry.lastModified = new Date().toISOString();
  
  // Datensatz speichern
  saveCurrentEntry();
  
  // Popup schließen
  closeNotePopup();
  
  // Anzeige aktualisieren
  displayEntry(currentEntry);
  
  alert('Vermerk hinzugefügt!');
}

/**
 * Verarbeitet Ratenzahlungseingaben
 */
function processPayment() {
  if (!currentEntry) {
    alert('Kein Datensatz ausgewählt!');
    closeRatenzahlungsPopup();
    return;
  }
  
  // Überprüfen, ob Ratenzahlung aktiv ist
  if (currentEntry.installmentPlan !== 'ja') {
    alert('Dieser Datensatz hat keine Ratenzahlung aktiviert.');
    closeRatenzahlungsPopup();
    return;
  }
  
  // Betrag aus dem Eingabefeld abrufen
  const receivedAmount = parseFloat(document.getElementById('receivedAmount').value);
  if (isNaN(receivedAmount) || receivedAmount <= 0) {
    alert('Bitte geben Sie einen gültigen Betrag ein.');
    return;
  }
  
  // Zahlungsverlauf initialisieren, falls nicht vorhanden
  if (!currentEntry.paymentHistory) {
    currentEntry.paymentHistory = [];
  }
  
  // Zahlung hinzufügen
  currentEntry.paymentHistory.push({
    date: new Date().toISOString(),
    amount: receivedAmount,
    note: 'Ratenzahlung'
  });
  
  // Letzte Änderung aktualisieren
  currentEntry.lastModified = new Date().toISOString();
  
  // Datensatz speichern
  saveCurrentEntry();
  
  // Popup schließen
  closeRatenzahlungsPopup();
  
  // Anzeige aktualisieren
  displayEntry(currentEntry);
  
  alert(`Zahlung in Höhe von ${receivedAmount}€ erfolgreich verbucht.`);
}

/**
 * Exportiert den aktuellen Datensatz als JSON-Datei
 */
function exportEntry() {
  if (!currentEntry) {
    alert('Kein Datensatz zum Exportieren ausgewählt!');
    return;
  }
  
  try {
    const filename = `Dataset_${currentEntry.id}_${formatDateForFilename(new Date())}.json`;
    downloadObjectAsJsonFile(currentEntry, filename);
  } catch (error) {
    console.error("Fehler beim Exportieren des Datensatzes:", error);
    alert('Fehler beim Exportieren des Datensatzes: ' + error.message);
  }
}

/**
 * Lädt einen Datensatz zur Bearbeitung
 */
function editEntry() {
  if (!currentEntry) {
    alert('Kein Datensatz zum Bearbeiten ausgewählt!');
    return;
  }
  
  alert('Die Bearbeitungsfunktion ist noch nicht implementiert.');
  // Hier würde die Implementierung für die Bearbeitung folgen
}

/**
 * Führt eine Suchabfrage auf den Datensätzen durch
 */
function searchData() {
  const query = document.getElementById('searchQuery').value.trim();
  if (!query) {
    alert('Bitte geben Sie eine Datensatz-ID ein.');
    return;
  }
  
  // Versuchen, den Datensatz zu finden
  try {
    // Falls storageManager verfügbar ist
    if (typeof storageManager !== 'undefined' && typeof storageManager.getData === 'function') {
      const result = storageManager.getData(query);
      if (result) {
        displaySearchResult(result);
      } else {
        document.getElementById('results').innerHTML = '<p class="error-message">Kein Datensatz mit dieser ID gefunden.</p>';
      }
    } else {
      // Fallback: Im localStorage suchen
      const data = localStorage.getItem(`dataset_${query}`);
      if (data) {
        const parsedData = JSON.parse(data);
        displaySearchResult(parsedData);
      } else {
        document.getElementById('results').innerHTML = '<p class="error-message">Kein Datensatz mit dieser ID gefunden.</p>';
      }
    }
  } catch (error) {
    console.error("Fehler bei der Suche:", error);
    document.getElementById('results').innerHTML = `<p class="error-message">Fehler bei der Suche: ${error.message}</p>`;
  }
}

/**
 * Zeigt das Suchergebnis an
 * @param {Object} data - Der gefundene Datensatz
 */
function displaySearchResult(data) {
  const resultsContainer = document.getElementById('results');
  if (!resultsContainer) return;
  
  let html = '<div class="search-result">';
  html += `
    <h3>Gefundener Datensatz: ${escapeHtml(data.id)}</h3>
    <div class="result-details">
      <div class="detail-row">
        <div class="detail-label">Name:</div>
        <div class="detail-value">${escapeHtml(data.personName)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Summe:</div>
        <div class="detail-value">${data.amount} €</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Typ:</div>
        <div class="detail-value">${data.type === 'ich_schulde' ? 'Schuld' : 'Kredit'}</div>
      </div>
    </div>
    <div class="result-actions">
      <button onclick="viewDatasetDetails('${data.id}')">Details anzeigen</button>
    </div>
  `;
  html += '</div>';
  
  resultsContainer.innerHTML = html;
}

/**
 * Lädt die Details eines bestimmten Datensatzes
 * @param {string} id - Die ID des Datensatzes
 */
function viewDatasetDetails(id) {
  // Hier könnte man zur Detailansicht wechseln
  alert('Detailansicht für ' + id + ' wird geladen...');
  
  // Als Beispiel: Zur Verwaltungsansicht wechseln und den Datensatz dort laden
  document.getElementById('actionSelect').value = 'manage';
  hideAllSections();
  document.getElementById('manageSection').classList.remove('hidden');
  
  // Datensatz laden (aus storageManager oder localStorage)
  try {
    let datasetToLoad = null;
    
    if (typeof storageManager !== 'undefined' && typeof storageManager.getData === 'function') {
      datasetToLoad = storageManager.getData(id);
    } else {
      const data = localStorage.getItem(`dataset_${id}`);
      if (data) {
        datasetToLoad = JSON.parse(data);
      }
    }
    
    if (datasetToLoad) {
      displayEntry(datasetToLoad);
      document.getElementById('deleteButton').classList.remove('hidden');
    } else {
      document.getElementById('entryDisplay').innerHTML = '<p class="error-message">Datensatz konnte nicht geladen werden.</p>';
    }
  } catch (error) {
    console.error("Fehler beim Laden des Datensatzes:", error);
    document.getElementById('entryDisplay').innerHTML = `<p class="error-message">Fehler beim Laden des Datensatzes: ${error.message}</p>`;
  }
}

/**
 * Lädt Datensätze aus einer Datei für die Suche
 * @param {Event} event - Das Datei-Upload-Event
 * @param {string} mode - Der Modus (z.B. 'search')
 */
function loadFileData(event, mode) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      if (mode === 'search') {
        if (Array.isArray(data)) {
          displayMultipleSearchResults(data);
        } else {
          displaySearchResult(data);
        }
      }
    } catch (error) {
      console.error("Fehler beim Lesen der Datei:", error);
      alert('Die Datei konnte nicht gelesen werden: ' + error.message);
    }
  };
  reader.readAsText(file);
}

/**
 * Zeigt mehrere Suchergebnisse an
 * @param {Array} dataArray - Die gefundenen Datensätze
 */
function displayMultipleSearchResults(dataArray) {
  const resultsContainer = document.getElementById('results');
  if (!resultsContainer) return;
  
  if (dataArray.length === 0) {
    resultsContainer.innerHTML = '<p class="info-message">Keine Datensätze gefunden.</p>';
    return;
  }
  
  let html = '<div class="search-results">';
  html += `<h3>Gefundene Datensätze: ${dataArray.length}</h3>`;
  html += '<table class="results-table">';
  html += `
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Summe</th>
        <th>Typ</th>
        <th>Zahlungsziel</th>
        <th>Aktionen</th>
      </tr>
    </thead>
    <tbody>
  `;
  
  dataArray.forEach(data => {
    html += `
      <tr>
        <td>${escapeHtml(data.id)}</td>
        <td>${escapeHtml(data.personName)}</td>
        <td>${data.amount} €</td>
        <td>${data.type === 'ich_schulde' ? 'Schuld' : 'Kredit'}</td>
        <td>${formatDate(data.paymentDue)}</td>
        <td>
          <button onclick="viewDatasetDetails('${data.id}')">Details</button>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  
  resultsContainer.innerHTML = html;
}

/**
 * Lädt ein Objekt als JSON-Datei herunter
 * @param {Object} exportObj - Das zu exportierende Objekt
 * @param {string} exportName - Der Dateiname
 */
function downloadObjectAsJsonFile(exportObj, exportName) {
  const jsonStr = JSON.stringify(exportObj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = exportName;
  downloadLink.style.display = 'none';
  
  document.body.appendChild(downloadLink);
  downloadLink.click();
  
  setTimeout(() => {
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Formatiert ein Datum für die Anzeige
 * @param {string} dateString - Das zu formatierende Datum
 * @returns {string} - Das formatierte Datum
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  } catch (e) {
    return dateString;
  }
}

/**
 * Formatiert ein Datum mit Uhrzeit für die Anzeige
 * @param {string} dateString - Das zu formatierende Datum
 * @returns {string} - Das formatierte Datum mit Uhrzeit
 */
function formatDateTime(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } catch (e) {
    return dateString;
  }
}

/**
 * Formatiert ein Datum für Dateinamen
 * @param {Date} date - Das zu formatierende Datum
 * @returns {string} - Das formatierte Datum
 */
function formatDateForFilename(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

/**
 * Escaped HTML-Sonderzeichen
 * @param {string} unsafe - Der zu escapende String
 * @returns {string} - Der escapte String
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
    return '';
  }
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}