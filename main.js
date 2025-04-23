/**
 * Hauptskript für die Schulden-Manager-Anwendung
 */

// Globale Variablen
let currentUser = null;
let isEditMode = false;

// Beim Laden der Seite ausführen
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM vollständig geladen und geparst");
  
  // Aktuelle Zeit anzeigen
  updateCurrentTime();
  setInterval(updateCurrentTime, 60000);
  
  // Event-Listener für den Aktionsauswahl-Dropdown
  const actionSelectDropdown = document.getElementById('actionSelect');
  if (actionSelectDropdown) {
    actionSelectDropdown.addEventListener('change', function() {
      const action = this.value;
      handleActionSelection(action);
    });
  }
  
  // Event-Listener für Benutzeraktionen
  const userActionSelect = document.getElementById('userActionSelect');
  if (userActionSelect) {
    userActionSelect.addEventListener('change', function() {
      const action = this.value;
      handleUserActionSelection(action);
    });
  }
  
  // Als Gast anmelden, wenn auf "Als Gast anmelden" geklickt wird
  const guestLoginButton = document.querySelector('.login-note button');
  if (guestLoginButton) {
    guestLoginButton.addEventListener('click', loginAsGuest);
  }
  
  // Initialisierung des Formulars für die Datensatzerstellung
  initCreateForm();
});

/**
 * Aktualisiert die aktuelle Uhrzeit im Header
 */
function updateCurrentTime() {
  const currentDateElement = document.getElementById('currentDate');
  if (currentDateElement) {
    const now = new Date();
    currentDateElement.textContent = 'Datum: ' + formatDateTime(now);
  }
}

// Alias-Funktion für Kompatibilität mit bestehendem Code
function updateCurrentDate() {
  updateCurrentTime();
}

/**
 * Behandelt die Auswahl einer Aktion aus dem Dropdown
 * @param {string} action - Die ausgewählte Aktion
 */
function handleActionSelection(action) {
  // Verstecke alle Abschnitte
  const sections = ['createSection', 'manageSection', 'searchSection', 'userSection'];
  sections.forEach(section => {
    const element = document.getElementById(section);
    if (element) {
      element.classList.add('hidden');
    }
  });
  
  // Zeige den ausgewählten Abschnitt
  if (action === 'create') {
    document.getElementById('createSection').classList.remove('hidden');
    initCreateForm();
  } else if (action === 'manage') {
    document.getElementById('manageSection').classList.remove('hidden');
    // Zurücksetzen der Verwaltungsansicht
    document.getElementById('entryDisplay').innerHTML = '<p class="no-records-message">Kein Datensatz geladen. Bitte laden Sie eine Datensatz-Datei.</p>';
    document.getElementById('deleteButton').classList.add('hidden');
  } else if (action === 'search') {
    document.getElementById('searchSection').classList.remove('hidden');
    // Zurücksetzen der Suchergebnisse
    document.getElementById('results').innerHTML = '';
  } else if (action === 'user') {
    document.getElementById('userSection').classList.remove('hidden');
    // Zurücksetzen der Benutzerauswahl
    document.getElementById('userActionSelect').value = '';
    hideUserSections();
  }
}

/**
 * Behandelt die Auswahl einer Benutzeraktion aus dem Dropdown
 * @param {string} action - Die ausgewählte Benutzeraktion
 */
function handleUserActionSelection(action) {
  // Verstecke alle Benutzerabschnitte
  const userSections = ['userCreateSection', 'userManageSection', 'userDeleteSection'];
  userSections.forEach(section => {
    const element = document.getElementById(section);
    if (element) {
      element.classList.add('hidden');
    }
  });
  
  // Zeige den ausgewählten Benutzerabschnitt
  if (action === 'create') {
    document.getElementById('userCreateSection').classList.remove('hidden');
  } else if (action === 'manage') {
    document.getElementById('userManageSection').classList.remove('hidden');
  } else if (action === 'delete') {
    document.getElementById('userDeleteSection').classList.remove('hidden');
  }
}

/**
 * Versteckt alle Benutzerabschnitte
 */
function hideUserSections() {
  const userSections = ['userCreateSection', 'userManageSection', 'userDeleteSection'];
  userSections.forEach(section => {
    const element = document.getElementById(section);
    if (element) {
      element.classList.add('hidden');
    }
  });
}

/**
 * Meldet den Benutzer als Gast an
 */
function loginAsGuest() {
  // Gast-Benutzer erstellen
  currentUser = {
    id: 'guest-' + Date.now(),
    username: 'Gast',
    permissions: 'readonly'
  };
  
  // Anzeigen des Hauptsystems
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('mainSystem').classList.remove('hidden');
  
  // Benutzername anzeigen
  document.getElementById('loggedInUser').textContent = 'Benutzer: Gast';
  
  // Benutzeraktionen anzeigen
  document.getElementById('userActions').classList.remove('hidden');
  
  // Aktuelles Datum anzeigen - verwende die neue Funktion
  updateCurrentTime();
}

/**
 * Meldet den Benutzer ab
 */
function logout() {
  // Benutzer abmelden
  currentUser = null;
  
  // Zurücksetzen des UI
  document.getElementById('mainSystem').classList.add('hidden');
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('userActions').classList.add('hidden');
  
  // Formulareingaben zurücksetzen
  document.getElementById('pezFileInput').value = '';
  document.getElementById('usernameInput').value = '';
  document.getElementById('pasInput').value = '';
  document.getElementById('loginFormSection').classList.add('hidden');
  document.getElementById('loginErrorMessage').classList.add('hidden');
  
  // Zurücksetzen der Daten
  if (typeof storageManager !== 'undefined' && typeof storageManager.clearCurrentUser === 'function') {
    storageManager.clearCurrentUser();
  }
}

/**
 * Speichert die Auswahl des Aktions-Dropdowns
 */
function saveActionSelection() {
  const actionSelect = document.getElementById('actionSelect');
  if (actionSelect && actionSelect.value) {
    sessionStorage.setItem('lastActionSelection', actionSelect.value);
  }
}

/**
 * Stellt die letzte Auswahl des Aktions-Dropdowns wieder her
 */
function restoreActionSelection() {
  const lastAction = sessionStorage.getItem('lastActionSelection');
  const actionSelect = document.getElementById('actionSelect');
  
  if (lastAction && actionSelect) {
    actionSelect.value = lastAction;
    handleActionSelection(lastAction);
  }
}

/**
 * Formatiert ein Datum mit Uhrzeit
 * @param {Date} date - Das zu formatierende Datum
 * @returns {string} - Das formatierte Datum mit Uhrzeit
 */
function formatDateTime(date) {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Speichert die aktuelle UI-Auswahl beim Verlassen der Seite
 */
window.addEventListener('beforeunload', function() {
  saveActionSelection();
});

/**
 * Stellt die letzte UI-Auswahl beim erneuten Laden der Seite wieder her
 */
window.addEventListener('load', function() {
  // Aktuelle Benutzeranmeldung prüfen
  if (typeof storageManager !== 'undefined' && typeof storageManager.getCurrentUser === 'function') {
    const storedUser = storageManager.getCurrentUser();
    if (storedUser && storedUser !== 'Gast') {
      currentUser = storedUser;
      document.getElementById('loginSection').classList.add('hidden');
      document.getElementById('mainSystem').classList.remove('hidden');
      document.getElementById('loggedInUser').textContent = 'Benutzer: ' + storedUser.username;
      document.getElementById('userActions').classList.remove('hidden');
    }
  }
  
  // Letzte Aktion wiederherstellen
  restoreActionSelection();
});
