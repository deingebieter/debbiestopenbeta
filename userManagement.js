/**
 * userManagement.js
 * 
 * Funktionen zum Verwalten und Authentifizieren von Benutzern
 * Datum: 2025-04-21 17:29:21
 * Benutzer: deingebieter
 */

// Globale Variable für das aktuelle Zertifikat
let currentUserCertificate = null;

// Funktion zum Hochladen und Verarbeiten des PAS-Zertifikats
function handlePEZUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      // Parse das Zertifikat
      const certificate = JSON.parse(e.target.result);
      
      // Validiere das Zertifikat
      if (!certificate.username || !certificate.externalKey) {
        throw new Error('Ungültiges Zertifikat: Benutzername oder PAS-Code fehlt.');
      }
      
      // Speichere das Zertifikat in einer globalen Variable
      currentUserCertificate = certificate;
      
      // Zeige das Login-Formular an
      document.getElementById('loginFormSection').classList.remove('hidden');
      
      // Fülle den Benutzernamen automatisch aus
      document.getElementById('usernameInput').value = certificate.username;
      
      showStatusMessage(`PAS-Zertifikat für ${certificate.username} wurde geladen.`, 'success');
      console.log('PAS-Zertifikat wurde erfolgreich geladen:', certificate.username);
    } catch (error) {
      console.error('Fehler beim Laden des PAS-Zertifikats:', error);
      showStatusMessage('Das hochgeladene Zertifikat ist ungültig.', 'error');
      const errorMessage = document.getElementById('loginErrorMessage');
      errorMessage.textContent = 'Das hochgeladene Zertifikat ist ungültig. Bitte versuchen Sie es erneut.';
      errorMessage.classList.remove('hidden');
    }
  };
  reader.readAsText(file);
}

// Funktion zur Überprüfung des Logins
function verifyLogin() {
  try {
    // Überprüfe, ob ein Zertifikat geladen wurde
    if (!currentUserCertificate) {
      throw new Error('Bitte laden Sie zuerst Ihr PAS-Zertifikat hoch.');
    }
    
    // Hole die Eingabewerte
    const username = document.getElementById('usernameInput').value.trim();
    const pasCode = parseInt(document.getElementById('pasInput').value);
    
    // Validiere die Eingaben
    if (!username || isNaN(pasCode)) {
      throw new Error('Bitte geben Sie einen gültigen Benutzernamen und PAS-Code ein.');
    }
    
    // Überprüfe, ob der Benutzername mit dem im Zertifikat übereinstimmt
    if (username !== currentUserCertificate.username) {
      throw new Error('Der eingegebene Benutzername stimmt nicht mit dem PAS-Zertifikat überein.');
    }
    
    // Prüfe, ob der PAS-Code direkt mit dem externen Schlüssel übereinstimmt
    if (pasCode === currentUserCertificate.externalKey) {
      throw new Error('Bitte geben Sie den vollständigen PAS-Code ein (nicht nur den externen Schlüssel).');
    }
    
    // Versuche, die Benutzerdaten zu laden
    let userData = null;
    try {
      userData = storageManager.getUserData(username);
      console.log('Benutzerdaten geladen:', userData ? 'Erfolgreich' : 'Nicht gefunden');
    } catch (dataError) {
      console.error('Fehler beim Laden der Benutzerdaten:', dataError);
    }
    
    // Verarbeite fehlende Benutzerdaten mit aussagekräftiger Fehlermeldung
    if (!userData) {
      console.error(`Keine Benutzerdaten für ${username} gefunden`);
      throw new Error(`Keine internen Daten für ${username} gefunden. Prüfen Sie, ob das System korrekt eingerichtet ist oder wenden Sie sich an den Administrator.`);
    }
    
    // Überprüfe, ob der interne Schlüssel vorhanden ist
    if (userData.internalKey === undefined || userData.internalKey === null) {
      console.error(`Interner Schlüssel fehlt für Benutzer ${username}`);
      throw new Error('Der interne Schlüssel für diesen Benutzer fehlt. Bitte wenden Sie sich an den Administrator.');
    }
    
    // Berechne den korrekten PAS (internalKey + externalKey)
    const correctPAS = userData.internalKey + currentUserCertificate.externalKey;
    console.log(`PAS-Berechnung: ${userData.internalKey} + ${currentUserCertificate.externalKey} = ${correctPAS}`);
    
    // Prüfe, ob der eingegebene PAS-Code mit dem berechneten PAS übereinstimmt
    if (pasCode !== correctPAS) {
      throw new Error('Falscher PAS-Code. Bitte versuchen Sie es erneut.');
    }
    
    // Login erfolgreich
    console.log(`Benutzer ${username} hat sich erfolgreich angemeldet.`);
    
    // Speichere die Benutzerdaten
    storageManager.setCurrentUser(username);
    sessionStorage.setItem('permissionLevel', currentUserCertificate.permissionLevel);
    sessionStorage.setItem('userName', currentUserCertificate.name);
    
    // Zeige den Hauptbereich an und verstecke den Login-Bereich
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('mainSystem').classList.remove('hidden');
    
    // Aktualisiere die Benutzerinfo
    document.getElementById('loggedInUser').textContent = `Benutzer: ${username}`;
    document.getElementById('userActions').classList.remove('hidden');
    
    // Aktualisiere das aktuelle Datum
    updateCurrentDate();
    
    // Zurücksetzen des Login-Formulars
    document.getElementById('pezFileInput').value = '';
    document.getElementById('loginFormSection').classList.add('hidden');
    document.getElementById('loginErrorMessage').classList.add('hidden');
    document.getElementById('usernameInput').value = '';
    document.getElementById('pasInput').value = '';
    
    showStatusMessage(`Willkommen, ${currentUserCertificate.name}!`, 'success');
    
    return true;
  } catch (error) {
    console.error('Fehler beim Login:', error);
    showStatusMessage(error.message, 'error');
    const errorMessage = document.getElementById('loginErrorMessage');
    errorMessage.textContent = error.message;
    errorMessage.classList.remove('hidden');
    return false;
  }
}

// Funktion zum Ausloggen
function logout() {
  // Lösche die Benutzerdaten
  storageManager.clearCurrentUser();
  sessionStorage.removeItem('permissionLevel');
  sessionStorage.removeItem('userName');
  
  // Zeige den Login-Bereich an und verstecke den Hauptbereich
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('mainSystem').classList.add('hidden');
  
  // Verstecke die Benutzeraktionen
  document.getElementById('userActions').classList.add('hidden');
  
  // Zurücksetzen des aktuellen Zertifikats
  currentUserCertificate = null;
  
  showStatusMessage('Sie wurden erfolgreich abgemeldet.', 'info');
  console.log('Abmeldung erfolgreich.');
}

// Funktion für Gastlogin
function loginAsGuest() {
  try {
    // Aktuelles Datum aktualisieren
    updateCurrentDate();
    
    // Setze den Gastzugang
    storageManager.setCurrentUser('Gast');
    sessionStorage.setItem('permissionLevel', 'guest');
    sessionStorage.setItem('userName', 'Gast');
    
    // Zeige den Hauptbereich an und verstecke den Login-Bereich
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('mainSystem').classList.remove('hidden');
    
    // Aktualisiere die Benutzerinfo
    document.getElementById('loggedInUser').textContent = 'Benutzer: Gast';
    document.getElementById('userActions').classList.remove('hidden');
    
    showStatusMessage('Sie sind als Gast angemeldet.', 'info');
    
    // Erstelle Testdaten, wenn keine vorhanden sind
    storageManager.createTestDataIfEmpty();
    
    return true;
  } catch (error) {
    console.error('Fehler beim Gastlogin:', error);
    showStatusMessage('Fehler beim Gastlogin: ' + error.message, 'error');
    return false;
  }
}

// Funktion zum Laden des Benutzerzertifikats für die Verwaltung
function loadUserCertificate(event, context) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      // Parse das Zertifikat
      const certificate = JSON.parse(e.target.result);
      
      // Validiere das Zertifikat
      if (!certificate.username) {
        throw new Error('Ungültiges Zertifikat: Benutzername fehlt.');
      }
      
      // Speichere das Zertifikat in einer globalen Variable
      currentUserCertificate = certificate;
      
      // Hole die internen Daten für diesen Benutzer
      const internalData = storageManager.getUserData(certificate.username);
      
      if (!internalData) {
        throw new Error(`Benutzer ${certificate.username} nicht gefunden.`);
      }
      
      // Je nach Kontext unterschiedlich verarbeiten
      if (context === 'manage') {
        displayUserDetails(certificate, internalData);
        document.getElementById('userManageContent').classList.remove('hidden');
      } else if (context === 'delete') {
        displayUserDeleteDetails(certificate, internalData);
        document.getElementById('userDeleteContent').classList.remove('hidden');
      }
      
      showStatusMessage(`Zertifikat für ${certificate.username} wurde geladen.`, 'success');
    } catch (error) {
      console.error('Fehler beim Laden des Benutzerzertifikats:', error);
      showStatusMessage(error.message, 'error');
    }
  };
  reader.readAsText(file);
}

// Funktion zum Anzeigen der Benutzerdetails
function displayUserDetails(certificate, internalData) {
  const userDetails = document.getElementById('userDetailsDisplay');
  
  // Formatiere das Erstellungsdatum
  const createdAt = new Date(internalData.createdAt);
  const formattedDate = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}:${String(createdAt.getSeconds()).padStart(2, '0')}`;
  
  // Status des Benutzers bestimmen und anzeigen
  let statusClass = 'status-active';
  let statusText = 'Aktiv';
  
  if (internalData.locked) {
    statusClass = 'status-locked';
    statusText = 'Gesperrt';
  } else if (internalData.suspended) {
    statusClass = 'status-suspended';
    statusText = 'Suspendiert';
  }
  
  // Anzeigen der Buttons je nach Benutzerstatus
  if (internalData.suspended) {
    document.getElementById('suspendUserBtn').classList.add('hidden');
    document.getElementById('unsuspendUserBtn').classList.remove('hidden');
  } else {
    document.getElementById('suspendUserBtn').classList.remove('hidden');
    document.getElementById('unsuspendUserBtn').classList.add('hidden');
  }
  
  if (internalData.locked) {
    document.getElementById('lockUserBtn').classList.add('hidden');
    document.getElementById('unlockUserBtn').classList.remove('hidden');
  } else {
    document.getElementById('lockUserBtn').classList.remove('hidden');
    document.getElementById('unlockUserBtn').classList.add('hidden');
  }
  
  // Aktivitätsverlauf erstellen, falls noch nicht vorhanden
  if (!internalData.activityLog) {
    internalData.activityLog = [];
  }
  
  // Formatiere den Aktivitätsverlauf als HTML
  let activityLogHtml = '';
  if (internalData.activityLog.length > 0) {
    activityLogHtml = '<ul class="activity-log">';
    internalData.activityLog.forEach(entry => {
      activityLogHtml += `<li><span class="activity-date">${entry.date}</span>: ${entry.action}</li>`;
    });
    activityLogHtml += '</ul>';
  } else {
    activityLogHtml = 'Keine Aktivitäten protokolliert';
  }
  
  // HTML für die Benutzerdetails
  userDetails.innerHTML = `
    <div class="detail-row">
      <div class="detail-label">ID</div>
      <div class="detail-value">${certificate.id || 'Nicht angegeben'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Name</div>
      <div class="detail-value">${certificate.name || 'Nicht angegeben'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Benutzername</div>
      <div class="detail-value">${certificate.username}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Berechtigungslevel</div>
      <div class="detail-value">${certificate.permissionLevel || 'Standard'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Interner Schlüssel</div>
      <div class="detail-value">${internalData.internalKey || 'Nicht angegeben'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Externer Schlüssel</div>
      <div class="detail-value">${certificate.externalKey || 'Nicht angegeben'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Erstellungsdatum</div>
      <div class="detail-value">${formattedDate}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Status</div>
      <div class="detail-value">
        <span class="${statusClass}">${statusText}</span>
      </div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Vermerke</div>
      <div class="detail-value">${internalData.notes || 'Keine Vermerke vorhanden'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Aktivitätsverlauf</div>
      <div class="detail-value">${activityLogHtml}</div>
    </div>
  `;
}

// Funktion zum Anzeigen der Benutzerdetails im Löschbereich
function displayUserDeleteDetails(certificate, internalData) {
  const userDetails = document.getElementById('userDeleteDetailsDisplay');
  
  // Formatiere das Erstellungsdatum
  const createdAt = new Date(internalData.createdAt);
  const formattedDate = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}:${String(createdAt.getSeconds()).padStart(2, '0')}`;
  
  // Status des Benutzers bestimmen
  let statusClass = 'status-active';
  let statusText = 'Aktiv';
  
  if (internalData.locked) {
    statusClass = 'status-locked';
    statusText = 'Gesperrt';
  } else if (internalData.suspended) {
    statusClass = 'status-suspended';
    statusText = 'Suspendiert';
  }
  
  // HTML für die Benutzerdetails
  userDetails.innerHTML = `
    <div class="detail-row">
      <div class="detail-label">ID</div>
      <div class="detail-value">${certificate.id || 'Nicht angegeben'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Name</div>
      <div class="detail-value">${certificate.name || 'Nicht angegeben'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Benutzername</div>
      <div class="detail-value">${certificate.username}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Status</div>
      <div class="detail-value">
        <span class="${statusClass}">${statusText}</span>
      </div>
    </div>
  `;
}

// Funktionen zum Bearbeiten von Benutzerdaten
function showEditIdPopup() {
  try {
    // Setze den aktuellen Wert im Popup
    document.getElementById('newUserId').value = currentUserCertificate.id || '';
    
    // Zeige das Popup
    document.getElementById('overlay').classList.add('visible');
    document.getElementById('editIdPopup').classList.add('visible');
  } catch (error) {
    console.error('Fehler beim Anzeigen des ID-Popups:', error);
    showStatusMessage(error.message, 'error');
  }
}

function updateUserId() {
  try {
    const newId = document.getElementById('newUserId').value.trim();
    
    if (!newId) {
      throw new Error('Bitte geben Sie eine gültige ID ein.');
    }
    
    // Aktualisiere die ID im Zertifikat
    currentUserCertificate.id = newId;
    
    // Schließe das Popup
    closePopup('editIdPopup');
    
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Aktivität protokollieren
    logUserActivity(internalData, `ID geändert zu: ${newId}`);
    
    // Speichere die Änderungen
    storageManager.saveUser(currentUserCertificate.username, internalData);
    
    // Aktualisiere die Anzeige
    displayUserDetails(currentUserCertificate, internalData);
    
    showStatusMessage('ID wurde aktualisiert.', 'success');
  } catch (error) {
    console.error('Fehler beim Aktualisieren der ID:', error);
    showStatusMessage(error.message, 'error');
  }
}

function showEditNamePopup() {
  try {
    // Setze den aktuellen Wert im Popup
    document.getElementById('newUserName').value = currentUserCertificate.name || '';
    
    // Zeige das Popup
    document.getElementById('overlay').classList.add('visible');
    document.getElementById('editNamePopup').classList.add('visible');
  } catch (error) {
    console.error('Fehler beim Anzeigen des Name-Popups:', error);
    showStatusMessage(error.message, 'error');
  }
}

function updateUserName() {
  try {
    const newName = document.getElementById('newUserName').value.trim();
    
    if (!newName) {
      throw new Error('Bitte geben Sie einen gültigen Namen ein.');
    }
    
    // Aktualisiere den Namen im Zertifikat
    const oldName = currentUserCertificate.name;
    currentUserCertificate.name = newName;
    
    // Schließe das Popup
    closePopup('editNamePopup');
    
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Aktivität protokollieren
    logUserActivity(internalData, `Name geändert von "${oldName}" zu "${newName}"`);
    
    // Speichere die Änderungen
    storageManager.saveUser(currentUserCertificate.username, internalData);
    
    // Aktualisiere die Anzeige
    displayUserDetails(currentUserCertificate, internalData);
    
    showStatusMessage('Name wurde aktualisiert.', 'success');
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Namens:', error);
    showStatusMessage(error.message, 'error');
  }
}

function showEditUsernamePopup() {
  try {
    // Setze den aktuellen Wert im Popup
    document.getElementById('newUsername').value = currentUserCertificate.username || '';
    
    // Zeige das Popup
    document.getElementById('overlay').classList.add('visible');
    document.getElementById('editUsernamePopup').classList.add('visible');
  } catch (error) {
    console.error('Fehler beim Anzeigen des Username-Popups:', error);
    showStatusMessage(error.message, 'error');
  }
}

function updateUsername() {
  try {
    const newUsername = document.getElementById('newUsername').value.trim();
    
    if (!newUsername) {
      throw new Error('Bitte geben Sie einen gültigen Benutzernamen ein.');
    }
    
    // Prüfe, ob der neue Benutzername bereits existiert
    if (newUsername !== currentUserCertificate.username && storageManager.getUserData(newUsername)) {
      throw new Error(`Der Benutzername ${newUsername} ist bereits vergeben.`);
    }
    
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Aktivität protokollieren
    const oldUsername = currentUserCertificate.username;
    logUserActivity(internalData, `Benutzername geändert von "${oldUsername}" zu "${newUsername}"`);
    
    // Lösche den alten Benutzer
    storageManager.deleteUserData(currentUserCertificate.username);
    
    // Aktualisiere den Benutzernamen im Zertifikat
    currentUserCertificate.username = newUsername;
    
    // Speichere die Daten unter dem neuen Benutzernamen
    storageManager.saveUser(newUsername, internalData);
    
    // Schließe das Popup
    closePopup('editUsernamePopup');
    
    // Aktualisiere die Anzeige
    displayUserDetails(currentUserCertificate, internalData);
    
    showStatusMessage(`Benutzername wurde von ${oldUsername} zu ${newUsername} geändert.`, 'success');
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Benutzernamens:', error);
    showStatusMessage(error.message, 'error');
  }
}

// KORRIGIERTE FUNKTION - Bearbeiten der Schlüssel
function showEditKeysPopup() {
  try {
    console.log('showEditKeysPopup() aufgerufen'); // Debugging-Ausgabe
    
    // Prüfe, ob das Popup-Element existiert
    const popup = document.getElementById('editKeysPopup');
    if (!popup) {
      console.error('Das Popup-Element #editKeysPopup wurde nicht gefunden!');
      showStatusMessage('Fehler: Popup-Element nicht gefunden.', 'error');
      return;
    }
    
    // Prüfe, ob das Overlay-Element existiert
    const overlay = document.getElementById('overlay');
    if (!overlay) {
      console.error('Das Overlay-Element #overlay wurde nicht gefunden!');
      showStatusMessage('Fehler: Overlay-Element nicht gefunden.', 'error');
      return;
    }
    
    // Prüfe, ob ein Benutzerzertifikat geladen ist
    if (!currentUserCertificate) {
      console.error('Kein Benutzerzertifikat geladen!');
      showStatusMessage('Bitte laden Sie zuerst ein Benutzerzertifikat.', 'error');
      return;
    }
    
    // Hole die aktuellen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    if (!internalData) {
      console.error('Keine internen Daten für den Benutzer gefunden!');
      showStatusMessage('Fehler: Keine Benutzerdaten gefunden.', 'error');
      return;
    }
    
    console.log('Aktueller interner Schlüssel:', internalData.internalKey);
    console.log('Aktueller externer Schlüssel:', currentUserCertificate.externalKey);
    
    // Setze die aktuellen Werte im Popup
    document.getElementById('newInternalKey').value = internalData.internalKey || '';
    document.getElementById('newExternalKey').value = currentUserCertificate.externalKey || '';
    
    // Stelle sicher, dass beide Felder sichtbar sind
    document.getElementById('newInternalKey').parentElement.style.display = '';
    document.getElementById('newExternalKey').parentElement.style.display = '';
    
    // Ändere den Titel des Popups und setze die richtige Funktion für den Speichern-Button
    document.querySelector('#editKeysPopup h2').textContent = 'Schlüssel bearbeiten';
    const saveButton = document.querySelector('#editKeysPopup button:first-of-type');
    saveButton.onclick = updateKeys;
    
    // Zeige das Popup
    overlay.classList.add('visible');
    popup.classList.add('visible');
    
    console.log('Popup und Overlay sollten jetzt sichtbar sein');
  } catch (error) {
    console.error('Fehler beim Anzeigen des Schlüssel-Popups:', error);
    showStatusMessage('Fehler beim Anzeigen des Popups: ' + error.message, 'error');
  }
}

// KORRIGIERTE FUNKTION - Bearbeiten des internen Schlüssels
function showEditInternalKeyPopup() {
  try {
    // Entferne vorhandenes Dropdown-Menü
    const existingDropdown = document.querySelector('.dropdown-menu');
    if (existingDropdown) {
      existingDropdown.remove();
    }
    
    // Hole die aktuellen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Setze den aktuellen Wert im Formular
    document.getElementById('newInternalKey').value = internalData.internalKey || '';
    
    // Zeige nur das Feld für den internen Schlüssel
    document.getElementById('newExternalKey').parentElement.style.display = 'none';
    
    // Ändere den Titel des Popups
    document.querySelector('#editKeysPopup h2').textContent = 'Internen Schlüssel bearbeiten';
    
    // Ändere die Speichern-Funktion
    const saveButton = document.querySelector('#editKeysPopup button:first-of-type');
    saveButton.onclick = updateInternalKey;
    
    // Zeige das Popup
    document.getElementById('overlay').classList.add('visible');
    document.getElementById('editKeysPopup').classList.add('visible');
  } catch (error) {
    console.error('Fehler beim Anzeigen des Popups für internen Schlüssel:', error);
    showStatusMessage(error.message, 'error');
  }
}

// KORRIGIERTE FUNKTION - Bearbeiten des externen Schlüssels
function showEditExternalKeyPopup() {
  try {
    // Entferne vorhandenes Dropdown-Menü
    const existingDropdown = document.querySelector('.dropdown-menu');
    if (existingDropdown) {
      existingDropdown.remove();
    }
    
    // Setze den aktuellen Wert im Formular
    document.getElementById('newExternalKey').value = currentUserCertificate.externalKey || '';
    
    // Zeige nur das Feld für den externen Schlüssel
    document.getElementById('newInternalKey').parentElement.style.display = 'none';
    
    // Ändere den Titel des Popups
    document.querySelector('#editKeysPopup h2').textContent = 'Externen Schlüssel bearbeiten';
    
    // Ändere die Speichern-Funktion
    const saveButton = document.querySelector('#editKeysPopup button:first-of-type');
    saveButton.onclick = updateExternalKey;
    
    // Zeige das Popup
    document.getElementById('overlay').classList.add('visible');
    document.getElementById('editKeysPopup').classList.add('visible');
  } catch (error) {
    console.error('Fehler beim Anzeigen des Popups für externen Schlüssel:', error);
    showStatusMessage(error.message, 'error');
  }
}

// KORRIGIERTE FUNKTION - Aktualisieren des internen Schlüssels
function updateInternalKey() {
  try {
    const newInternalKey = parseInt(document.getElementById('newInternalKey').value);
    
    if (isNaN(newInternalKey)) {
      throw new Error('Bitte geben Sie einen gültigen numerischen Wert ein.');
    }
    
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Aktivität protokollieren
    const oldKey = internalData.internalKey;
    logUserActivity(internalData, `Interner Schlüssel geändert von ${oldKey} zu ${newInternalKey}`);
    
    // Aktualisiere den internen Schlüssel
    internalData.internalKey = newInternalKey;
    
    // Speichere die Änderungen
    storageManager.saveUser(currentUserCertificate.username, internalData);
    
    // Schließe das Popup
    closePopup('editKeysPopup');
    
    // Stelle die Anzeige aller Felder im Popup wieder her
    document.getElementById('newInternalKey').parentElement.style.display = '';
    document.getElementById('newExternalKey').parentElement.style.display = '';
    
    // Aktualisiere die Anzeige
    displayUserDetails(currentUserCertificate, internalData);
    
    // Berechne den neuen PAS
    const newPAS = newInternalKey + currentUserCertificate.externalKey;
    
    showStatusMessage(`Interner Schlüssel wurde aktualisiert. Neuer PAS: ${newPAS}`, 'success');
  } catch (error) {
    console.error('Fehler beim Aktualisieren des internen Schlüssels:', error);
    showStatusMessage(error.message, 'error');
  }
}

// KORRIGIERTE FUNKTION - Aktualisieren des externen Schlüssels
function updateExternalKey() {
  try {
    const newExternalKey = parseInt(document.getElementById('newExternalKey').value);
    
    if (isNaN(newExternalKey)) {
      throw new Error('Bitte geben Sie einen gültigen numerischen Wert ein.');
    }
    
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Aktivität protokollieren
    const oldKey = currentUserCertificate.externalKey;
    logUserActivity(internalData, `Externer Schlüssel geändert von ${oldKey} zu ${newExternalKey}`);
    
    // Aktualisiere den externen Schlüssel im Zertifikat
    currentUserCertificate.externalKey = newExternalKey;
    
    // Speichere die Änderungen
    storageManager.saveUser(currentUserCertificate.username, internalData);
    
    // Schließe das Popup
    closePopup('editKeysPopup');
    
    // Stelle die Anzeige aller Felder im Popup wieder her
    document.getElementById('newInternalKey').parentElement.style.display = '';
    document.getElementById('newExternalKey').parentElement.style.display = '';
    
    // Aktualisiere die Anzeige
    displayUserDetails(currentUserCertificate, internalData);
    
    // Berechne den neuen PAS
    const newPAS = internalData.internalKey + newExternalKey;
    
    showStatusMessage(`Externer Schlüssel wurde aktualisiert. Neuer PAS: ${newPAS}`, 'success');
  } catch (error) {
    console.error('Fehler beim Aktualisieren des externen Schlüssels:', error);
    showStatusMessage(error.message, 'error');
  }
}

// KORRIGIERTE FUNKTION - Aktualisieren beider Schlüssel
function updateKeys() {
  try {
    const newInternalKey = parseInt(document.getElementById('newInternalKey').value);
    const newExternalKey = parseInt(document.getElementById('newExternalKey').value);
    
    if (isNaN(newInternalKey) || isNaN(newExternalKey)) {
      throw new Error('Bitte geben Sie gültige numerische Werte ein.');
    }
    
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Aktivität protokollieren
    const oldInternalKey = internalData.internalKey;
    const oldExternalKey = currentUserCertificate.externalKey;
    logUserActivity(internalData, `Beide Schlüssel geändert - Intern: ${oldInternalKey} → ${newInternalKey}, Extern: ${oldExternalKey} → ${newExternalKey}`);
    
    // Aktualisiere den internen Schlüssel
    internalData.internalKey = newInternalKey;
    
    // Aktualisiere den externen Schlüssel im Zertifikat
    currentUserCertificate.externalKey = newExternalKey;
    
    // Speichere die Änderungen
    storageManager.saveUser(currentUserCertificate.username, internalData);
    
    // Schließe das Popup
    closePopup('editKeysPopup');
    
    // Aktualisiere die Anzeige
    displayUserDetails(currentUserCertificate, internalData);
    
    // Berechne den neuen PAS
    const newPAS = newInternalKey + newExternalKey;
    
    showStatusMessage(`Schlüssel wurden aktualisiert. Neuer PAS: ${newPAS}`, 'success');
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Schlüssel:', error);
    showStatusMessage(error.message, 'error');
  }
}

function showEditPermissionPopup() {
  try {
    // Setze den aktuellen Wert im Popup
    document.getElementById('newPermissionLevel').value = currentUserCertificate.permissionLevel || 'standard';
    
    // Zeige das Popup
    document.getElementById('overlay').classList.add('visible');
    document.getElementById('editPermissionPopup').classList.add('visible');
  } catch (error) {
    console.error('Fehler beim Anzeigen des Berechtigungslevel-Popups:', error);
    showStatusMessage(error.message, 'error');
  }
}

function updatePermissionLevel() {
  try {
    const newPermissionLevel = document.getElementById('newPermissionLevel').value;
    const oldPermissionLevel = currentUserCertificate.permissionLevel || 'standard';
    
    // Aktualisiere das Berechtigungslevel im Zertifikat
    currentUserCertificate.permissionLevel = newPermissionLevel;
    
    // Schließe das Popup
    closePopup('editPermissionPopup');
    
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Aktivität protokollieren
    logUserActivity(internalData, `Berechtigungslevel geändert von "${oldPermissionLevel}" zu "${newPermissionLevel}"`);
    
    // Speichere die Änderungen
    storageManager.saveUser(currentUserCertificate.username, internalData);
    
    // Aktualisiere die Anzeige
    displayUserDetails(currentUserCertificate, internalData);
    
    showStatusMessage('Berechtigungslevel wurde aktualisiert.', 'success');
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Berechtigungslevels:', error);
    showStatusMessage(error.message, 'error');
  }
}

// KORRIGIERTE FUNKTION - Popup für Sperren mit Grund anzeigen
function showLockUserPopup() {
  try {
    // Zeige das Popup
    document.getElementById('overlay').classList.add('visible');
    document.getElementById('lockUserPopup').classList.add('visible');
    document.getElementById('lockReason').value = '';
  } catch (error) {
    console.error('Fehler beim Anzeigen des Sperr-Popups:', error);
    showStatusMessage(error.message, 'error');
  }
}

// KORRIGIERTE FUNKTION - Benutzer sperren mit Grund
function lockUser() {
  try {
    // Zeige das Popup für die Eingabe des Grundes
    showLockUserPopup();
  } catch (error) {
    console.error('Fehler beim Vorbereiten der Benutzersperrung:', error);
    showStatusMessage(error.message, 'error');
  }
}

// NEUE FUNKTION - Bestätigen der Sperrung mit Grund
function confirmLockUser() {
  try {
    const lockReason = document.getElementById('lockReason').value.trim() || 'Kein Grund angegeben';
    
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Setze den Status auf gesperrt und speichere den Grund
    internalData.locked = true;
    internalData.lockReason = lockReason;
    
    // Aktivität protokollieren
    logUserActivity(internalData, `Benutzer gesperrt. Grund: ${lockReason}`);
    
    // Speichere die Änderungen
    storageManager.saveUser(currentUserCertificate.username, internalData);
    
    // Schließe das Popup
    closePopup('lockUserPopup');
    
    // Aktualisiere die Anzeige
    displayUserDetails(currentUserCertificate, internalData);
    
    showStatusMessage(`Benutzer ${currentUserCertificate.username} wurde gesperrt.`, 'warning');
  } catch (error) {
    console.error('Fehler beim Sperren des Benutzers:', error);
    showStatusMessage(error.message, 'error');
  }
}

// KORRIGIERTE FUNKTION - Aufheben der Sperrung
function unlockUser() {
  try {
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Hebe die Sperrung auf und entferne den Grund
    internalData.locked = false;
    delete internalData.lockReason;
    
    // Aktivität protokollieren
    logUserActivity(internalData, `Sperrung aufgehoben`);
    
    // Speichere die Änderungen
    storageManager.saveUser(currentUserCertificate.username, internalData);
    
    // Aktualisiere die Anzeige
    displayUserDetails(currentUserCertificate, internalData);
    
    showStatusMessage(`Die Sperrung von Benutzer ${currentUserCertificate.username} wurde aufgehoben.`, 'success');
  } catch (error) {
    console.error('Fehler beim Aufheben der Benutzersperrung:', error);
    showStatusMessage(error.message, 'error');
  }
}

// KORRIGIERTE FUNKTION - Popup für Suspendierung mit Grund anzeigen
function showSuspendUserPopup() {
  try {
    // Zeige das Popup
    document.getElementById('overlay').classList.add('visible');
    document.getElementById('suspendUserPopup').classList.add('visible');
    document.getElementById('suspendReason').value = '';
  } catch (error) {
    console.error('Fehler beim Anzeigen des Suspendierungs-Popups:', error);
    showStatusMessage(error.message, 'error');
  }
}

// KORRIGIERTE FUNKTION - Benutzer suspendieren
function suspendUser() {
  try {
    // Zeige das Popup für die Eingabe des Grundes
    showSuspendUserPopup();
  } catch (error) {
    console.error('Fehler beim Vorbereiten der Benutzersuspendierung:', error);
    showStatusMessage(error.message, 'error');
  }
}

// NEUE FUNKTION - Bestätigen der Suspendierung mit Grund
function confirmSuspendUser() {
  try {
    const suspendReason = document.getElementById('suspendReason').value.trim() || 'Kein Grund angegeben';
    
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Setze den Status auf suspendiert und speichere den Grund
    internalData.suspended = true;
    internalData.suspendReason = suspendReason;
    
    // Aktivität protokollieren
    logUserActivity(internalData, `Benutzer suspendiert. Grund: ${suspendReason}`);
    
    // Speichere die Änderungen
    storageManager.saveUser(currentUserCertificate.username, internalData);
    
    // Schließe das Popup
    closePopup('suspendUserPopup');
    
    // Aktualisiere die Anzeige
    displayUserDetails(currentUserCertificate, internalData);
    
    showStatusMessage(`Benutzer ${currentUserCertificate.username} wurde suspendiert.`, 'warning');
  } catch (error) {
    console.error('Fehler beim Suspendieren des Benutzers:', error);
    showStatusMessage(error.message, 'error');
  }
}

// KORRIGIERTE FUNKTION - Aufheben der Suspendierung
function unsuspendUser() {
  try {
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Hebe die Suspendierung auf und entferne den Grund
    internalData.suspended = false;
    delete internalData.suspendReason;
    
    // Aktivität protokollieren
    logUserActivity(internalData, `Suspendierung aufgehoben`);
    
    // Speichere die Änderungen
    storageManager.saveUser(currentUserCertificate.username, internalData);
    
    // Aktualisiere die Anzeige
    displayUserDetails(currentUserCertificate, internalData);
    
    showStatusMessage(`Die Suspendierung von Benutzer ${currentUserCertificate.username} wurde aufgehoben.`, 'success');
  } catch (error) {
    console.error('Fehler beim Aufheben der Benutzersuspendierung:', error);
    showStatusMessage(error.message, 'error');
  }
}

// VERALTETE FUNKTION - Setzen der Suspendierung mit Grund - für Kompatibilität beibehalten
function setSuspendUser(suspended, reason) {
  if (suspended) {
    document.getElementById('suspendReason').value = reason || '';
    confirmSuspendUser();
  } else {
    unsuspendUser();
  }
}

function showAddNotePopup() {
  try {
    // Setze den Wert im Popup zurück
    document.getElementById('newUserNote').value = '';
    
    // Zeige das Popup
    document.getElementById('overlay').classList.add('visible');
    document.getElementById('addNotePopup').classList.add('visible');
  } catch (error) {
    console.error('Fehler beim Anzeigen des Vermerks-Popups:', error);
    showStatusMessage(error.message, 'error');
  }
}

function addUserNote() {
  try {
    const newNote = document.getElementById('newUserNote').value.trim();
    
    if (!newNote) {
      throw new Error('Bitte geben Sie einen gültigen Vermerk ein.');
    }
    
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Füge den neuen Vermerk hinzu
    if (!internalData.notes) {
      internalData.notes = newNote;
    } else {
      internalData.notes += '\n\n' + newNote;
    }
    
    // Aktivität protokollieren
    logUserActivity(internalData, `Vermerk hinzugefügt: "${newNote.substring(0, 50)}${newNote.length > 50 ? '...' : ''}"`);
    
    // Speichere die Änderungen
    storageManager.saveUser(currentUserCertificate.username, internalData);
    
    // Schließe das Popup
    closePopup('addNotePopup');
    
    // Aktualisiere die Anzeige
    displayUserDetails(currentUserCertificate, internalData);
    
    showStatusMessage('Vermerk wurde hinzugefügt.', 'success');
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Vermerks:', error);
    showStatusMessage(error.message, 'error');
  }
}

// Funktion zum Aktualisieren des Benutzerzertifikats
function updateUserCertificate() {
  try {
    // Hole die internen Daten
    const internalData = storageManager.getUserData(currentUserCertificate.username);
    
    // Aktivität protokollieren
    logUserActivity(internalData, `Zertifikat aktualisiert und heruntergeladen`);
    
    // Speichere die Änderungen
    storageManager.saveUser(currentUserCertificate.username, internalData);
    
    // Speichere das aktualisierte Zertifikat als Download
    saveCertificate(currentUserCertificate);
    
    showStatusMessage('Änderungen wurden gespeichert und ein neues Zertifikat wurde erstellt.', 'success');
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Benutzerzertifikats:', error);
    showStatusMessage(error.message, 'error');
  }
}

// Funktion zum Löschen eines Benutzers
function deleteUser() {
  try {
    if (!currentUserCertificate) {
      throw new Error('Kein Benutzer geladen.');
    }
    
    // Bestätigungsdialog
    const isConfirmed = confirm(`Sind Sie sicher, dass Sie den Benutzer ${currentUserCertificate.username} löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`);
    
    if (!isConfirmed) {
      return;
    }
    
    // Lösche den Benutzer
    storageManager.deleteUserData(currentUserCertificate.username);
    
    // Verstecke den Inhalt
    document.getElementById('userDeleteContent').classList.add('hidden');
    
    // Zurücksetzen des Formulars
    document.getElementById('pezFileDelete').value = '';
    
    // Zurücksetzen des aktuellen Zertifikats
    currentUserCertificate = null;
    
    showStatusMessage('Benutzer wurde erfolgreich gelöscht.', 'success');
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error);
    showStatusMessage(error.message, 'error');
  }
}

// Funktion zum Protokollieren von Aktivitäten
function logUserActivity(userData, action) {
  // Erstelle das Array, falls es noch nicht existiert
  if (!userData.activityLog) {
    userData.activityLog = [];
  }
  
  // Erstelle den neuen Eintrag
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  // Füge den Eintrag hinzu
  userData.activityLog.push({
    date: formattedDate,
    action: action
  });
  
  // Begrenze die Größe des Protokolls auf die letzten 100 Einträge
  if (userData.activityLog.length > 100) {
    userData.activityLog = userData.activityLog.slice(-100);
  }
}

// Hilfsfunktion zum Schließen von Popups
function closePopup(popupId) {
  document.getElementById('overlay').classList.remove('visible');
  document.getElementById(popupId).classList.remove('visible');
}

// Event-Listener zur Initialisierung hinzufügen
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM vollständig geladen - Initialisiere Event-Listener');
  
  // Finde den Button zum Bearbeiten von Schlüsseln
  const editKeysButton = document.querySelector('button[onclick*="showEditKeysPopup"]');
  if (editKeysButton) {
    console.log('Schlüssel-Bearbeiten-Button gefunden, setze Event-Listener');
    // Entferne alle bestehenden onclick-Attribute
    editKeysButton.removeAttribute('onclick');
    // Füge einen neuen Event-Listener hinzu
    editKeysButton.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Schlüssel-Bearbeiten-Button geklickt');
      showEditKeysPopup();
    });
  } else {
    console.warn('Schlüssel-Bearbeiten-Button nicht gefunden!');
  }
  
  // Debug-Funktion zur Überprüfung des Popup-Systems
  window.debugPopupSystem = function() {
    console.log('=== POPUP SYSTEM DEBUG ===');
    
    // Überprüfe Overlay
    const overlay = document.getElementById('overlay');
    console.log('Overlay Element:', overlay);
    console.log('Overlay Sichtbarkeit:', overlay ? getComputedStyle(overlay).display : 'Element nicht gefunden');
    
    // Überprüfe Popup
    const popup = document.getElementById('editKeysPopup');
    console.log('Popup Element:', popup);
    console.log('Popup Sichtbarkeit:', popup ? getComputedStyle(popup).display : 'Element nicht gefunden');
    
    // Überprüfe Button
    const button = document.querySelector('button[onclick*="showEditKeysPopup"], #editKeysButton');
    console.log('Button Element:', button);
    
    // Teste manuelles Öffnen
    console.log('Versuche, das Popup manuell zu öffnen...');
    try {
      if (overlay && popup) {
        overlay.classList.add('visible');
        popup.classList.add('visible');
        console.log('Popup sollte jetzt sichtbar sein');
      }
    } catch (e) {
      console.error('Fehler beim manuellen Öffnen:', e);
    }
    
    console.log('=== DEBUG ENDE ===');
  };
});