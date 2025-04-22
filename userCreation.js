/**
 * userCreation.js
 * 
 * Funktionen zum Erstellen von Benutzern und PEZ-Zertifikaten
 * Datum: 2025-04-20 23:20:10
 * Benutzer: deingebieter
 */

// Funktion zum Erstellen eines neuen Benutzers und dessen PEZ-Zertifikat
function createUser() {
  // Hole die Eingabewerte
  const userId = document.getElementById('userId').value.trim();
  const userName = document.getElementById('userName').value.trim();
  const username = document.getElementById('username').value.trim();
  const permissionLevel = document.getElementById('permissionLevel').value;
  const internalKey = parseInt(document.getElementById('internalKey').value);
  const externalKey = parseInt(document.getElementById('externalKey').value);
  const notes = document.getElementById('userNotes').value.trim();
  
  // Validiere die Eingaben
  if (!userId || !userName || !username || !internalKey || !externalKey) {
    showStatusMessage('Bitte füllen Sie alle Pflichtfelder aus.', 'error');
    return;
  }
  
  // Prüfe, ob der Benutzername bereits existiert
  if (storageManager.getUserData(username)) {
    showStatusMessage(`Der Benutzername ${username} ist bereits vergeben.`, 'error');
    return;
  }
  
  // Erstelle das Benutzer-Zertifikat (PEZ)
  const certificate = {
    id: userId,
    name: userName,
    username: username,
    externalKey: externalKey,
    permissionLevel: permissionLevel,
    createdAt: new Date().toISOString()
  };
  
  // Persönlicher Autorisierungsschlüssel (PAS) = internalKey + externalKey
  const pas = internalKey + externalKey;
  
  // Speichere die internen Daten
  const userData = {
    internalKey: internalKey,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    suspended: false,
    locked: false
  };
  
  // Speichere im StorageManager
  storageManager.saveUser(username, userData);
  
  // Speichere das Zertifikat als JSON zum Herunterladen
  saveCertificate(certificate);
  
  // Zeige eine Erfolgsmeldung an
  showStatusMessage(`Benutzer ${username} wurde erstellt. PAS: ${pas}`, 'success');
  
  // Zurücksetzen des Formulars
  document.getElementById('userId').value = '';
  document.getElementById('userName').value = '';
  document.getElementById('username').value = '';
  document.getElementById('permissionLevel').value = 'standard';
  document.getElementById('internalKey').value = '';
  document.getElementById('externalKey').value = '';
  document.getElementById('userNotes').value = '';
}

// Funktion zum Speichern des Zertifikats als Download
function saveCertificate(certificate) {
  try {
    const fileName = `${certificate.id}_${certificate.name.replace(/\s+/g, '')}.json`;
    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Erstelle einen Link zum Herunterladen
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.textContent = 'Zertifikat herunterladen';
    a.className = 'download-link';
    
    // Zeige den Link im Formular an
    const formattedData = document.getElementById('formattedData');
    formattedData.innerHTML = `
      <h3>Benutzerzertifikat erstellt</h3>
      <p>ID: ${certificate.id}</p>
      <p>Name: ${certificate.name}</p>
      <p>Benutzername: ${certificate.username}</p>
      <p>Berechtigungslevel: ${certificate.permissionLevel}</p>
      <p><a href="${url}" download="${fileName}" class="download-link">Zertifikat herunterladen</a></p>
      <p><strong>Wichtig:</strong> Bewahren Sie dieses Zertifikat sicher auf und teilen Sie es nicht mit unbefugten Personen.</p>
    `;
    formattedData.classList.remove('hidden');
    
    console.log(`Zertifikat für ${certificate.username} wurde erstellt und kann heruntergeladen werden.`);
  } catch (error) {
    console.error('Fehler beim Erstellen des Zertifikats:', error);
    showStatusMessage('Fehler beim Erstellen des Zertifikats.', 'error');
  }
}

// Funktion zum Generieren eines zufälligen internen Schlüssels
function generateInternalKey() {
  // Generiere eine zufällige Zahl zwischen 100 und 999
  return Math.floor(Math.random() * 900) + 100;
}

// Funktion zum Erstellen eines Testbenutzers
function createTestUser() {
  try {
    // Überprüfe, ob bereits Benutzer existieren
    if (storageManager.getUserData('guehei')) {
      console.log('Testbenutzer existiert bereits.');
      return null;
    }
    
    console.log('Erstelle Testbenutzer...');
    
    // Interne Daten für den Testbenutzer
    const testUserData = {
      internalKey: 333,
      notes: 'Testbenutzer für das System',
      createdAt: new Date().toISOString(),
      suspended: false,
      locked: false
    };
    
    // Speichere die internen Daten
    storageManager.saveUser('guehei', testUserData);
    
    // Erstelle das Zertifikat für den Testbenutzer
    const testCertificate = {
      id: "9989",
      name: "Günach Heil",
      username: "guehei",
      externalKey: 222,
      permissionLevel: "standard",
      createdAt: new Date().toISOString()
    };
    
    console.log(`Testbenutzer wurde erstellt: username=guehei, PAS=555 (internalKey=333 + externalKey=222)`);
    
    return {
      certificate: testCertificate,
      internalKey: 333,
      pas: 555
    };
  } catch (error) {
    console.error('Fehler beim Erstellen des Testbenutzers:', error);
    return null;
  }
}