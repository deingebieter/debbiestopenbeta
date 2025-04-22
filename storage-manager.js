/**
 * storage-manager.js
 * 
 * Dateibasierte Speicherlösung ohne LocalStorage
 * Datum: 2025-04-20 23:20:10
 * Benutzer: deingebieter
 */

// StorageManager Klasse für die Datenverwaltung ohne LocalStorage
class StorageManager {
  constructor() {
    // In-Memory-Speicher für die aktuelle Sitzung
    this.datasets = [];
    this.users = {};
    this.currentUser = null;
    this.initialized = false;
    
    // Beim Start temporäre Session-Daten laden
    this.loadFromSession();
  }
  
  // Lädt Daten aus sessionStorage (nur für die aktuelle Browsersitzung)
  loadFromSession() {
    try {
      const sessionDatasets = sessionStorage.getItem('temp_datasets');
      const sessionUsers = sessionStorage.getItem('temp_users');
      const sessionUser = sessionStorage.getItem('currentUser');
      
      if (sessionDatasets) {
        this.datasets = JSON.parse(sessionDatasets);
      }
      
      if (sessionUsers) {
        this.users = JSON.parse(sessionUsers);
      }
      
      if (sessionUser) {
        this.currentUser = sessionUser;
      }
      
      this.initialized = true;
      console.log('Daten aus Sitzung geladen.');
    } catch (error) {
      console.error('Fehler beim Laden aus der Sitzung:', error);
      this.initialized = false;
    }
  }
  
  // Speichert aktuelle Daten temporär in der Session
  saveToSession() {
    try {
      sessionStorage.setItem('temp_datasets', JSON.stringify(this.datasets));
      sessionStorage.setItem('temp_users', JSON.stringify(this.users));
      if (this.currentUser) {
        sessionStorage.setItem('currentUser', this.currentUser);
      }
      console.log('Daten in Sitzung gespeichert.');
    } catch (error) {
      console.error('Fehler beim Speichern in die Sitzung:', error);
      showStatusMessage('Fehler beim temporären Speichern der Daten.', 'error');
    }
  }
  
  // Erstellt eine Exportdatei mit allen Daten
  exportAllData() {
    try {
      const exportData = {
        datasets: this.datasets,
        users: this.users,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const fileName = `Schuldenverwaltung_Export_${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      
      showStatusMessage('Daten wurden erfolgreich exportiert.', 'success');
      return true;
    } catch (error) {
      console.error('Fehler beim Exportieren der Daten:', error);
      showStatusMessage('Fehler beim Exportieren der Daten.', 'error');
      return false;
    }
  }
  
  // Importiert Daten aus einer Datei
  importData(fileContent) {
    try {
      const importData = JSON.parse(fileContent);
      
      // Validiere die importierten Daten
      if (!importData.datasets || !importData.users) {
        throw new Error('Die Datei enthält keine gültigen Schuldenverwaltungsdaten.');
      }
      
      // Speichere die importierten Daten
      this.datasets = importData.datasets;
      this.users = importData.users;
      
      // Speichere in die Session
      this.saveToSession();
      
      showStatusMessage('Daten wurden erfolgreich importiert.', 'success');
      return true;
    } catch (error) {
      console.error('Fehler beim Importieren der Daten:', error);
      showStatusMessage('Fehler beim Importieren der Daten: ' + error.message, 'error');
      return false;
    }
  }
  
  // Speichert einen einzelnen Datensatz und gibt die neue Datensatzliste zurück
  saveDataset(dataset) {
    try {
      // Suche nach einem vorhandenen Datensatz mit derselben ID
      const index = this.datasets.findIndex(item => item.id === dataset.id);
      
      if (index !== -1) {
        // Aktualisiere den vorhandenen Datensatz
        this.datasets[index] = dataset;
      } else {
        // Füge den neuen Datensatz hinzu
        this.datasets.push(dataset);
      }
      
      // Speichere in die Session
      this.saveToSession();
      
      // Erstelle eine Datei zum Herunterladen
      this.exportSingleDataset(dataset);
      
      return this.datasets;
    } catch (error) {
      console.error('Fehler beim Speichern des Datensatzes:', error);
      showStatusMessage('Fehler beim Speichern des Datensatzes.', 'error');
      return this.datasets;
    }
  }
  
  // Exportiert einen einzelnen Datensatz als Datei
  exportSingleDataset(dataset) {
    try {
      const fileName = `Schuld_${dataset.id}_${dataset.personName.replace(/\s+/g, '')}.json`;
      const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Aktualisiere die Anzeige mit einer Erfolgsmeldung
      const formattedData = document.getElementById('formattedData');
      formattedData.innerHTML = `
        <h3>Datensatz erfolgreich gespeichert</h3>
        <p>ID: ${dataset.id}</p>
        <p>Name: ${dataset.personName}</p>
        <p>Betrag: ${dataset.amount} €</p>
        <p><a href="${url}" download="${fileName}" class="download-link">Datensatz herunterladen</a></p>
        <p><strong>Wichtig:</strong> Bitte speichern Sie diese Datei, um Ihre Daten zu sichern!</p>
      `;
      formattedData.classList.remove('hidden');
      
      return url;
    } catch (error) {
      console.error('Fehler beim Exportieren des Datensatzes:', error);
      return null;
    }
  }
  
  // Gibt alle Datensätze zurück
  getAllDatasets() {
    return this.datasets;
  }
  
  // Gibt einen bestimmten Datensatz zurück
  getDatasetById(id) {
    return this.datasets.find(dataset => dataset.id === id) || null;
  }
  
  // Aktualisiert einen Datensatz
  updateDataset(id, updatedData) {
    try {
      const index = this.datasets.findIndex(dataset => dataset.id === id);
      
      if (index === -1) {
        throw new Error(`Datensatz mit ID ${id} nicht gefunden.`);
      }
      
      // Daten aktualisieren
      const updatedDataset = {
        ...this.datasets[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      
      // Datensatz in der Liste aktualisieren
      this.datasets[index] = updatedDataset;
      
      // Speichere in die Session
      this.saveToSession();
      
      return updatedDataset;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Datensatzes:', error);
      throw error;
    }
  }
  
  // Löscht einen Datensatz
  deleteDataset(id) {
    try {
      const initialLength = this.datasets.length;
      this.datasets = this.datasets.filter(dataset => dataset.id !== id);
      
      if (this.datasets.length === initialLength) {
        throw new Error(`Datensatz mit ID ${id} nicht gefunden.`);
      }
      
      // Speichere in die Session
      this.saveToSession();
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen des Datensatzes:', error);
      return false;
    }
  }
  
  // ===== Benutzerverwaltung =====
  
  // Speichert Benutzerdaten
  saveUser(username, userData) {
    try {
      this.users[username] = userData;
      this.saveToSession();
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern des Benutzers:', error);
      return false;
    }
  }
  
  // Gibt die Benutzerdaten für einen bestimmten Benutzer zurück
  getUserData(username) {
    return this.users[username] || null;
  }
  
  // Löscht einen Benutzer
  deleteUser(username) {
    try {
      if (!this.users[username]) {
        throw new Error(`Benutzer ${username} nicht gefunden.`);
      }
      
      delete this.users[username];
      this.saveToSession();
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error);
      return false;
    }
  }
  
  // Alias für deleteUser für Kompatibilität mit bestehendem Code
  deleteUserData(username) {
    return this.deleteUser(username);
  }
  
  // Setzt den aktuellen Benutzer
  setCurrentUser(username) {
    this.currentUser = username;
    sessionStorage.setItem('currentUser', username);
  }
  
  // Gibt den aktuellen Benutzer zurück
  getCurrentUser() {
    return this.currentUser || 'Gast';
  }
  
  // Löscht den aktuellen Benutzer (Logout)
  clearCurrentUser() {
    this.currentUser = null;
    sessionStorage.removeItem('currentUser');
  }
  
  // Erstellt Testdaten, wenn keine Daten vorhanden sind
  createTestDataIfEmpty() {
    // Wenn bereits Daten vorhanden sind, nichts tun
    if (this.datasets.length > 0 || Object.keys(this.users).length > 0) {
      console.log('Es sind bereits Daten vorhanden, keine Testdaten nötig.');
      return;
    }
    
    console.log('Erstelle Testdaten...');
    
    // Testbenutzer erstellen
    const testUserData = {
      internalKey: 333,
      notes: 'Testbenutzer für das System',
      createdAt: new Date().toISOString(),
      suspended: false,
      locked: false
    };
    
    this.users['guehei'] = testUserData;
    
    // Erstelle einen Testdatensatz
    const testDataset = {
      id: 'TEST-2025-001',
      amount: 1500,
      interest: 2.5,
      interestType: 'percent',
      personName: 'Max Mustermann',
      debtType: 'ich_schulde',
      installmentPlan: 'ja',
      monthlyRate: 100,
      paymentDue: '2025-12-31',
      notes: 'Dies ist ein Testdatensatz',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [],
      paymentStatus: {
        delay: false,
        defer: false,
        refusal: false
      }
    };
    
    this.datasets.push(testDataset);
    
    // Speichere in die Session
    this.saveToSession();
    
    console.log('Testdaten wurden erstellt.');
  }
}

// Globale Instanz des StorageManagers erstellen
const storageManager = new StorageManager();