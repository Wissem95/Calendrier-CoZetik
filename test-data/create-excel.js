const ExcelJS = require('exceljs');
const path = require('path');

async function createTestExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Calendrier');

  // En-têtes en français
  worksheet.columns = [
    { header: 'Date début', key: 'dateDebut', width: 15 },
    { header: 'Date fin', key: 'dateFin', width: 15 },
    { header: 'Type', key: 'type', width: 20 }
  ];

  // Données de test
  const rows = [
    { dateDebut: new Date('2025-01-13'), dateFin: new Date('2025-01-17'), type: 'École' },
    { dateDebut: new Date('2025-01-20'), dateFin: new Date('2025-01-24'), type: 'Entreprise' },
    { dateDebut: new Date('2025-01-27'), dateFin: new Date('2025-01-31'), type: 'Vacances' },
    { dateDebut: new Date('2025-02-03'), dateFin: new Date('2025-02-07'), type: 'Formation' },
    { dateDebut: new Date('2025-02-10'), dateFin: new Date('2025-02-14'), type: 'Indisponible' },
    { dateDebut: new Date('2025-02-17'), dateFin: new Date('2025-02-21'), type: 'École' },
    { dateDebut: new Date('2025-02-24'), dateFin: new Date('2025-02-28'), type: 'Disponible' },
    { dateDebut: new Date('2025-03-03'), dateFin: new Date('2025-03-07'), type: 'Congé' },
    { dateDebut: new Date('2025-03-10'), dateFin: new Date('2025-03-14'), type: 'Cours HETIC' },
    { dateDebut: new Date('2025-03-17'), dateFin: new Date('2025-03-21'), type: 'Travail' }
  ];

  rows.forEach(row => {
    worksheet.addRow(row);
  });

  // Formater les colonnes de dates
  worksheet.getColumn('dateDebut').numFmt = 'dd/mm/yyyy';
  worksheet.getColumn('dateFin').numFmt = 'dd/mm/yyyy';

  // Style pour l'en-tête
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Sauvegarder
  const filePath = path.join(__dirname, 'test-calendar.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log('✅ Fichier Excel créé:', filePath);
}

createTestExcel().catch(console.error);
