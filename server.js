const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurazione database
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: process.env.DB_CHARSET
};

const pool = mysql.createPool(dbConfig);

// Configurazione session store
const sessionStore = new MySQLStore({
  ...dbConfig,
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: 86400000
});

// Middleware configuration
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
  key: process.env.SESSION_KEY,
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true'
  }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.pazienteId) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Funzioni database
class DatabaseService {
  
  // medici con le loro specialità
  static async getMediciConSpecialita() {
    const query = `
      SELECT 
        m.id,
        m.nome,
        m.cognome,
        m.data_nascita,
        m.data_laurea,
        s.nome as specialita,
        s.prezzo,
        s.id as id_specialita
      FROM medico m
      INNER JOIN specialita s ON m.id_specialita = s.id
      ORDER BY s.nome ASC, m.cognome ASC
    `;
    
    const [rows] = await pool.execute(query);
    return rows;
  }

  // paziente per autenticazione
  static async getPazienteByUsername(username) {
    const query = 'SELECT * FROM paziente WHERE username = ?';
    const [rows] = await pool.execute(query, [username]);
    return rows[0];
  }

  // nuova visita
  static async createVisita(pazienteId, medicoId, data, oraInizio, note = null) {
    const query = `
      INSERT INTO visita (id_paziente, id_medico, data, ora_inizio, effettuata, saldo, note)
      VALUES (?, ?, ?, ?, 'no', 'no', ?)
    `;
    
    const [result] = await pool.execute(query, [pazienteId, medicoId, data, oraInizio, note]);
    return result.insertId;
  }

  // dettagli medico
  static async getMedicoById(id) {
    const query = `
      SELECT 
        m.*,
        s.nome as specialita,
        s.prezzo
      FROM medico m
      INNER JOIN specialita s ON m.id_specialita = s.id
      WHERE m.id = ?
    `;
    
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  // visite paziente
  static async getVisitePaziente(pazienteId) {
    const query = `
      SELECT 
        v.*,
        m.nome as medico_nome,
        m.cognome as medico_cognome,
        s.nome as specialita,
        s.prezzo
      FROM visita v
      INNER JOIN medico m ON v.id_medico = m.id
      INNER JOIN specialita s ON m.id_specialita = s.id
      WHERE v.id_paziente = ?
      ORDER BY v.data DESC, v.ora_inizio DESC
    `;
    
    const [rows] = await pool.execute(query, [pazienteId]);
    return rows;
  }

  // veri slot orario
  static async isTimeSlotAvailable(medicoId, data, oraInizio) {
    const query = `
      SELECT COUNT(*) as count
      FROM visita
      WHERE id_medico = ? AND data = ? AND ora_inizio = ? AND effettuata = 'no'
    `;
    
    const [rows] = await pool.execute(query, [medicoId, data, oraInizio]);
    return rows[0].count === 0;
  }

  // slot orari prenotati
  static async getBookedTimeSlots(medicoId, data) {
    const query = `
      SELECT ora_inizio
      FROM visita
      WHERE id_medico = ? AND data = ? AND effettuata = 'no'
    `;
    
    const [rows] = await pool.execute(query, [medicoId, data]);
    return rows.map(row => row.ora_inizio);
  }

  // nuovo paziente
  static async createPaziente(pazienteData) {
    const query = `
      INSERT INTO paziente (nome, cognome, data_nascita, codice_fiscale, provincia, username, password)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(query, [
      pazienteData.nome,
      pazienteData.cognome,
      pazienteData.data_nascita,
      pazienteData.codice_fiscale,
      pazienteData.provincia,
      pazienteData.username,
      pazienteData.password
    ]);
    
    return result.insertId;
  }

  // Verifica username
  static async checkUsernameExists(username) {
    const query = 'SELECT COUNT(*) as count FROM paziente WHERE username = ?';
    const [rows] = await pool.execute(query, [username]);
    return rows[0].count > 0;
  }
}

// Routes

// Home page - Display doctors table
app.get('/', requireAuth, async (req, res) => {
  try {
    const medici = await DatabaseService.getMediciConSpecialita();
    
    // raggrupamento doc
    const mediciGrouped = medici.reduce((acc, medico) => {
      if (!acc[medico.specialita]) {
        acc[medico.specialita] = [];
      }
      acc[medico.specialita].push(medico);
      return acc;
    }, {});

    res.render('index', { 
      medici: mediciGrouped,
      paziente: req.session.paziente
    });
  } catch (error) {
    console.error('Error loading doctors:', error);
    res.status(500).render('error', { message: 'Errore nel caricamento dei medici' });
  }
});

// Login
app.get('/login', (req, res) => {
  if (req.session && req.session.pazienteId) {
    return res.redirect('/');
  }
  res.render('login', { 
    error: null,
    title: 'Login',
    currentPage: 'login',
    paziente: null
  });
});

// Login processing
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const paziente = await DatabaseService.getPazienteByUsername(username);
    
    if (!paziente) {
      return res.render('login', { 
        error: 'Username o password non validi',
        title: 'Login',
        currentPage: 'login',
        paziente: null
      });
    }

    if (paziente.password !== password) {
      return res.render('login', { 
        error: 'Username o password non validi',
        title: 'Login',
        currentPage: 'login',
        paziente: null
      });
    }

    req.session.pazienteId = paziente.id;
    req.session.paziente = {
      id: paziente.id,
      nome: paziente.nome,
      cognome: paziente.cognome,
      username: paziente.username
    };

    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'Errore durante il login' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

// Prenotazione
app.get('/prenota/:medicoId', requireAuth, async (req, res) => {
  const { medicoId } = req.params;
  
  try {
    const medico = await DatabaseService.getMedicoById(medicoId);
    
    if (!medico) {
      return res.status(404).render('error', { 
        message: 'Medico non trovato',
        title: 'Errore',
        paziente: req.session.paziente,
        currentPage: 'error'
      });
    }

    res.render('prenota', { 
      medico,
      paziente: req.session.paziente,
      error: null,
      success: null,
      title: 'Prenota Visita',
      currentPage: 'prenota'
    });
  } catch (error) {
    console.error('Error loading booking page:', error);
    res.status(500).render('error', { 
      message: 'Errore nel caricamento della pagina di prenotazione',
      title: 'Errore',
      paziente: req.session.paziente,
      currentPage: 'error'
    });
  }
});

// form prenotazionre - send
app.post('/prenota/:medicoId', requireAuth, async (req, res) => {
  const { medicoId } = req.params;
  const { data, ora, note } = req.body;
  const pazienteId = req.session.pazienteId;

  try {
    const medico = await DatabaseService.getMedicoById(medicoId);
    if (!medico) {
      return res.status(404).render('error', { 
        message: 'Medico non trovato',
        title: 'Errore',
        paziente: req.session.paziente,
        currentPage: 'error'
      });
    }

    const selectedDate = new Date(data);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.render('prenota', {
        medico,
        paziente: req.session.paziente,
        error: 'La data selezionata deve essere futura',
        success: null,
        title: 'Prenota Visita',
        currentPage: 'prenota'
      });
    }

    // Check 
    const isAvailable = await DatabaseService.isTimeSlotAvailable(medicoId, data, ora);
    
    if (!isAvailable) {
      return res.render('prenota', {
        medico,
        paziente: req.session.paziente,
        error: 'Questo orario non è più disponibile. Per favore, seleziona un altro orario.',
        success: null,
        title: 'Prenota Visita',
        currentPage: 'prenota'
      });
    }

    // appuntamento
    await DatabaseService.createVisita(pazienteId, medicoId, data, ora, note);

    res.render('prenota', {
      medico,
      paziente: req.session.paziente,
      error: null,
      success: 'Prenotazione effettuata con successo!',
      title: 'Prenota Visita',
      currentPage: 'prenota'
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).render('error', { 
      message: 'Errore durante la prenotazione della visita',
      title: 'Errore',
      paziente: req.session.paziente,
      currentPage: 'error'
    });
  }
});

// appuntamenti del paziente
app.get('/le-mie-visite', requireAuth, async (req, res) => {
  try {
    const visite = await DatabaseService.getVisitePaziente(req.session.pazienteId);
    
    res.render('visite', {
      visite,
      paziente: req.session.paziente
    });
  } catch (error) {
    console.error('Error loading visits:', error);
    res.status(500).render('error', { message: 'Errore nel caricamento delle visite' });
  }
});

// registrazione
app.get('/register', (req, res) => {
  if (req.session && req.session.pazienteId) {
    return res.redirect('/');
  }
  res.render('register', { 
    error: null,
    success: null,
    title: 'Registrazione',
    currentPage: 'register',
    paziente: null
  });
});

app.post('/register', async (req, res) => {
  const { nome, cognome, data_nascita, codice_fiscale, provincia, username, password } = req.body;

  try {
    // nuovo paziente
    const pazienteId = await DatabaseService.createPaziente({
      nome,
      cognome,
      data_nascita,
      codice_fiscale,
      provincia,
      username,
      password
    });

    req.session.pazienteId = pazienteId;
    req.session.paziente = {
      id: pazienteId,
      nome,
      cognome,
      username
    };

    res.redirect('/');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', {
      error: 'Errore durante la registrazione',
      success: null,
      title: 'Registrazione',
      currentPage: 'register',
      paziente: null
    });
  }
});

// Gestione errori
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).render('error', { message: 'Errore interno del server' });
});

// Gestione 404
app.use((req, res) => {
  res.status(404).render('error', { message: 'Pagina non trovata' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;