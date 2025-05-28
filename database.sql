-- Create database
CREATE DATABASE IF NOT EXISTS `medcare` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;

USE `medcare`;

-- Table structure for table `specialita`
CREATE TABLE `specialita` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `prezzo` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- Table structure for table `medico`
CREATE TABLE `medico` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `cognome` varchar(50) NOT NULL,
  `data_nascita` date NOT NULL,
  `codice_fiscale` varchar(17) NOT NULL,
  `data_laurea` date NOT NULL,
  `id_specialita` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_specialita` (`id_specialita`),
  CONSTRAINT `medico_ibfk_1` FOREIGN KEY (`id_specialita`) REFERENCES `specialita` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- Table structure for table `paziente`
CREATE TABLE `paziente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `cognome` varchar(50) NOT NULL,
  `data_nascita` date NOT NULL,
  `codice_fiscale` varchar(17) NOT NULL,
  `provincia` varchar(50) NOT NULL,
  `username` varchar(30) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- Table structure for table `problematica`
CREATE TABLE `problematica` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `descrizione` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- Table structure for table `storico_problematica`
CREATE TABLE `storico_problematica` (
  `id_paziente` int(11) NOT NULL,
  `id_problematica` int(11) NOT NULL,
  `data_insorgenza` date DEFAULT NULL,
  PRIMARY KEY (`id_paziente`,`id_problematica`),
  KEY `id_problematica` (`id_problematica`),
  CONSTRAINT `storico_problematica_ibfk_1` FOREIGN KEY (`id_paziente`) REFERENCES `paziente` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `storico_problematica_ibfk_2` FOREIGN KEY (`id_problematica`) REFERENCES `problematica` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- Table structure for table `visita`
CREATE TABLE `visita` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_paziente` int(11) NOT NULL,
  `id_medico` int(11) NOT NULL,
  `data` date NOT NULL,
  `ora_inizio` time NOT NULL,
  `effettuata` enum('si','no') NOT NULL DEFAULT 'no',
  `saldo` enum('si','no') NOT NULL DEFAULT 'no',
  `note` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_medico` (`id_medico`),
  KEY `id_paziente` (`id_paziente`),
  CONSTRAINT `visita_ibfk_1` FOREIGN KEY (`id_medico`) REFERENCES `medico` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `visita_ibfk_2` FOREIGN KEY (`id_paziente`) REFERENCES `paziente` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- Table structure for table `password_reset`
CREATE TABLE `password_reset` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_paziente` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `id_paziente` (`id_paziente`),
  CONSTRAINT `password_reset_ibfk_1` FOREIGN KEY (`id_paziente`) REFERENCES `paziente` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- Insert initial data for specialita
INSERT INTO `specialita` VALUES
(1,'Cardiologia',100.00),
(2,'Oculistica',90.00),
(3,'Dermatologia',80.00),
(4,'Ortopedia',70.00),
(5,'Neurologia',110.00);

-- Insert initial data for medico
INSERT INTO `medico` VALUES
(1,'Giovanni','Rossi','1980-05-15','RSSGNN80E15H501Z','2005-07-20',1),
(2,'Maria','Bianchi','1990-08-22','BNCMRA90M62F205X','2012-10-15',2),
(3,'Luca','Verdi','1985-11-30','VRDLCA85S10Z404Y','2010-06-30',3),
(4,'Anna','Neri','1975-03-10','NRNANNA75C50Z404W','2000-03-12',4),
(5,'Marco','Gialli','1982-07-25','GLLMRC82L15Z404X','2008-09-18',5);

-- Insert initial data for paziente
INSERT INTO `paziente` VALUES
(1,'Alessandro','Luca','1990-05-20','LCALSS90E15H501Y','Milano','alessandro_l','password123'),
(2,'Elena','Rossi','1985-03-10','RSSLNA85C50Z404M','Roma','elena_rossi','mypassword456'),
(3,'Francesco','Bianchi','1988-12-12','BNCFNC88T12F205W','Napoli','francesco_b','securepass789'),
(4,'Sara','Verde','1995-07-15','VRDSRA95M55F205Z','Torino','sara_verde','password987'),
(5,'Giulia','Gialli','1992-02-18','GLLGLL92B58F205P','Venezia','giulia_gialli','password1234');

-- Insert initial data for problematica
INSERT INTO `problematica` VALUES
(1,'Ipertensione','Aumento cronico della pressione sanguigna.'),
(2,'Diabete','Disturbo metabolico caratterizzato da elevati livelli di glucosio nel sangue.'),
(3,'Psoriasi', 'Malattia della pelle che causa squame e lesioni.'),
(4,'Osteoporosi','Malattia caratterizzata da ossa fragili e suscettibili a fratture.'),
(5,'Emicrania', 'Mal di testa forte con nausea e sensibilità alla luce.');

-- Insert initial data for storico_problematica
INSERT INTO `storico_problematica` VALUES
(1,1,'2022-03-10'),
(1,4,'2021-06-15'),
(2,2,'2019-08-22'),
(3,3,'2020-02-17'),
(4,5,'2023-01-10');

-- Insert initial data for visita
INSERT INTO `visita` VALUES
(1,1,1,'2025-05-01','10:00:00','si','si','Controllo cardiologico, prossimo controllo fra 6 mesi.'),
(2,2,2,'2025-05-10','11:00:00','si','si','Visita per controllo della vista, appuntamento tra 3 mesi.'),
(3,3,3,'2025-05-15','09:00:00','si','no',NULL),
(4,4,4,'2025-05-20','14:00:00','no','no','Visita per problemi articolari, programma riabilitativo avviato.'),
(5,5,5,'2025-05-25','16:00:00','no','no','Controllo neurologico, esami da ripetere fra 6 mesi.'); 