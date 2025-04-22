// Variablen für die Datensatzerstellung
let currentDataset = null;

/**
 * Initialisiert das Formular für die Datensatzerstellung
 */
function initCreateForm() {
  document.getElementById('debtId').value = '';
  document.getElementById('debtAmount').value = '';
  document.getElementById('interest').value = '';
  document.getElementById('interestType').value = 'euro';
  document.getElementById('personName').value = '';
  document.getElementById('debtType').value = 'ich_schulde';
  document.getElementById('installmentPlan').value = 'nein';
  document.getElementById('rateInputSection').classList.add('hidden');
  document.getElementById('monthlyRate').value = '';
  
  // Aktuelles Datum plus ein Monat als Standard-Zahlungsziel setzen
  const today = new Date();
  const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
  document.getElementById('paymentDue').value = nextMonth.toISOString().split('T')[0];
  
  document.getElementById('notes').value = '';
  
  // Herunterladen-Bereich zurücksetzen
  const downloadStatus = document.getElementById('downloadStatus');
  if (downloadStatus) {
    downloadStatus.innerHTML = '';
    downloadStatus.classList.add('hidden');
  }
}

/**
 * Speichert einen Datensatz und lädt ihn herunter
 */
function saveDebtEntry() {
  console.log("saveDebtEntry wurde aufgerufen");
  
  // Daten aus dem Formular holen
  const debtId = document.getElementById('debtId').value.trim();
  const debtAmount = parseFloat(document.getElementById('debtAmount').value);
  const interest = parseFloat(document.getElementById('interest').value) || 0;
  const interestType = document.getElementById('interestType').value;
  const personName = document.getElementById('personName').value.trim();
  const debtType = document.getElementById('debtType').value;
  const installmentPlan = document.getElementById('installmentPlan').value;
  const monthlyRate = installmentPlan === 'ja' ? parseFloat(document.getElementById('monthlyRate').value) : 0;
  const paymentDue = document.getElementById('paymentDue').value;
  const notes = document.getElementById('notes').value.trim();
  
  // Validierung
  if (!debtId || !debtAmount || !personName || !paymentDue) {
    alert('Bitte füllen Sie alle Pflichtfelder aus (ID, Summe, Name, Zahlungsziel).');
    return;
  }
  
  if (installmentPlan === 'ja' && (!monthlyRate || monthlyRate <= 0)) {
    alert('Bitte geben Sie eine gültige monatliche Rate ein.');
    return;
  }
  
  // Datensatz erstellen
  const debtEntry = {
    id: debtId,
    amount: debtAmount,
    interest: interest,
    interestType: interestType,
    personName: personName,
    type: debtType,
    installmentPlan: installmentPlan,
    monthlyRate: monthlyRate,
    paymentDue: paymentDue,
    creationDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    notes: notes ? [{ date: new Date().toISOString(), text: notes }] : [],
    paymentHistory: [],
    status: {
      paymentDelay: false,
      paymentDefer: false,
      paymentRefusal: false
    }
  };
  
  // VERSUCHEN, den Datensatz im storageManager zu speichern, aber nicht abbrechen wenn nicht verfügbar
  try {
    if (typeof storageManager !== 'undefined' && typeof storageManager.saveData === 'function') {
      storageManager.saveData(debtEntry);
      console.log("Datensatz wurde im storageManager gespeichert:", debtEntry);
    } else {
      console.warn("storageManager ist nicht verfügbar oder hat keine saveData-Funktion.");
      // Als Fallback im localStorage speichern
      localStorage.setItem(`dataset_${debtId}`, JSON.stringify(debtEntry));
      console.log("Datensatz wurde als Fallback im localStorage gespeichert:", debtEntry);
    }
  } catch (error) {
    console.error("Fehler beim Speichern des Datensatzes:", error);
  }
  
  // Den Datensatz als JSON-Datei herunterladen
  const datasetFilename = `Dataset_${debtId}.json`;
  console.log("Datensatz wird zum Download vorbereitet:", datasetFilename);
  
  // Silent Download versuchen
  if (silentDownload(debtEntry, datasetFilename)) {
    // Erfolg - einfache Nachricht anzeigen
    showSimpleStatus("Datensatz erfolgreich gespeichert und heruntergeladen.", "success");
  } else {
    // Bei Fehler - Sichtbaren Download anbieten
    offerVisibleDownload(debtEntry, datasetFilename);
  }
  
  // Formular zurücksetzen
  initCreateForm();
}

/**
 * Versucht einen stillen Download ohne sichtbare UI-Elemente
 * @param {Object} data - Die zu exportierenden Daten
 * @param {string} filename - Der Dateiname
 * @returns {boolean} - Ob der Download erfolgreich war
 */
function silentDownload(data, filename) {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = 'none';
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Link nach kurzer Verzögerung entfernen
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    }, 100);
    
    // Als Backup im localStorage speichern
    localStorage.setItem(`backup_${filename}`, jsonStr);
    
    return true;
  } catch (error) {
    console.error("Stiller Download fehlgeschlagen:", error);
    return false;
  }
}

/**
 * Bietet einen sichtbaren Download-Button an, falls der stille Download fehlschlägt
 * @param {Object} data - Die zu exportierenden Daten
 * @param {string} filename - Der Dateiname
 */
function offerVisibleDownload(data, filename) {
  const downloadStatus = document.getElementById('downloadStatus');
  if (!downloadStatus) {
    console.error("Download-Status-Element nicht gefunden!");
    return;
  }
  
  // Statusbereich leeren
  downloadStatus.innerHTML = '';
  
  // JSON-String erstellen
  const jsonStr = JSON.stringify(data, null, 2);
  
  // Blob erstellen
  const blob = new Blob([jsonStr], { type: 'application/json' });
  
  // Download-Button erstellen
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = `${filename} herunterladen`;
  downloadBtn.className = 'primary-button';
  downloadBtn.style.marginTop = '10px';
  downloadBtn.onclick = function() {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Hinweistext
  const hinweis = document.createElement('p');
  hinweis.textContent = 'Klicken Sie auf den Button, um den Datensatz herunterzuladen:';
  
  // Zum Statusbereich hinzufügen
  downloadStatus.appendChild(hinweis);
  downloadStatus.appendChild(downloadBtn);
  downloadStatus.classList.remove('hidden');
}

/**
 * Zeigt eine einfache Statusmeldung an
 * @param {string} message - Die anzuzeigende Nachricht
 * @param {string} type - Der Typ der Nachricht (success, error, warning, info)
 */
function showSimpleStatus(message, type = "info") {
  // Alert für sofortige Rückmeldung
  alert(message);
  
  // Das könnte später durch eine diskretere Meldung ersetzt werden
  const downloadStatus = document.getElementById('downloadStatus');
  if (downloadStatus) {
    downloadStatus.innerHTML = '';
    downloadStatus.classList.add('hidden');
  }
}