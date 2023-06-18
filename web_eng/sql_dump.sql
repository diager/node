-- Database: userDB

-- Table structure for table contentTable
CREATE TABLE IF NOT EXISTS contentTable (
  themaID INT NOT NULL AUTO_INCREMENT,
  kuerzel VARCHAR(15),
  thema VARCHAR(200),
  aendern VARCHAR(10),
  loeschen VARCHAR(10),
  text VARCHAR(500),
  PRIMARY KEY (themaID)
);

-- Table structure for table userTable
CREATE TABLE IF NOT EXISTS userTable (
  userId INT NOT NULL AUTO_INCREMENT,
  user VARCHAR(45) NOT NULL,
  password VARCHAR(100) NOT NULL,
  PRIMARY KEY (userId)
);

-- Dumping data for table contentTable
INSERT INTO contentTable (themaID, kuerzel, thema, aendern, loeschen, text)
VALUES
  (1, 'kz1', 'Thema 1', 'Ändern', 'Löschen', 'Sample text 1'),
  (2, 'kz2', 'Thema 2', 'Ändern', 'Löschen', 'Sample text 2'),
  (3, 'kz3', 'Thema 3', 'Ändern', 'Löschen', 'Sample text 3');

-- Dumping data for table userTable
INSERT INTO userTable (userId, user, password)
VALUES
  (1, 'John', 'password123'),
  (2, 'Jane', 'password456');
