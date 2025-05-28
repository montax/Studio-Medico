# Studio Azzena - Sistema di Prenotazione Visite Mediche

Un'applicazione web per la gestione delle prenotazioni delle visite mediche, sviluppata con Node.js, Express e MySQL.

## Requisiti

- Node.js (versione 16 o superiore)
- MySQL (versione 5.7 o superiore)
- npm (Node Package Manager)

## Installazione

1. Clona il repository:
```bash
git clone https://github.com/montax/Studio-Medico.git
cd [NOME_CARTELLA]
```

2. Installa le dipendenze:
```bash
npm install
```

3. Configura il database:
   - Crea un database MySQL
   - Importa il file `database.sql` nel tuo server MySQL
   - Crea un file `.env` nella root del progetto con le seguenti variabili:
```
DB_HOST=localhost
DB_USER=tuo_username
DB_PASSWORD=tua_password
DB_NAME=medcare
SESSION_SECRET=una_stringa_segreta
```

## Avvio dell'applicazione

Per avviare l'applicazione in modalità sviluppo:
```bash
npm run dev
```

Per avviare l'applicazione in produzione:
```bash
npm start
```

L'applicazione sarà disponibile all'indirizzo: `http://localhost:3000`

## Funzionalità

- Registrazione e login pazienti
- Prenotazione visite mediche
- Gestione delle problematiche mediche
- Visualizzazione storico visite
- Gestione pagamenti
- Reset password

## Credenziali di test

Sono presenti alcuni utenti di test nel database:
- Username: alessandro_l
- Password: password123

## Processo di creazione

Ho crato questa web app partendo da un'analisi approfondita della traccia fornita e del dump del database. Una volta individuate tutte le funzionalità che dovevano essere implementante ho iniziato a codificare il file server.js procedendo pari passo con la codifica di un'interfaccia grafica minimale per svolgere i test delle varie funzionalità.
Per il debugging ho consultato Stack Overflow e per l'implementazione di alcuni fix sono ricorso a Cursor Agent. 
Una volta completato lo scheletro del progetto e testato il corretto funzionamento delle funzionalità di base ho proceduto al miglioramento della UI.
Per la UI mi sono affidato alle librerie di Bootstrap e Font Awesome per le icone.
Per quanto rigurda CSS aggiuntivi e animazioni in JS mi sono fatto aiutare da Claude 4.0 e Lovable.

P.S. Sono riuscito a far partire MariaDB in locale dal Mac senza usare nè Podman nè Docker (godo fes).
C'erano dei problemi con brew, sono riuscito a risolverli analizzandoli con il comando brew doctor