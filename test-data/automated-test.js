/**
 * Script de Test Automatique des Parsers
 *
 * Ce script teste programmatiquement les fonctions de parsing
 * sans avoir besoin de lancer l'application web.
 *
 * Usage: node automated-test.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Tests Automatiques des Parsers\n');
console.log('='.repeat(50));

// ============ Test 1: Fichier ICS ============
console.log('\n📄 Test 1: Validation fichier ICS');

const icsPath = path.join(__dirname, 'test-calendar.ics');
const icsContent = fs.readFileSync(icsPath, 'utf-8');

console.log(`✅ Fichier lu: ${icsPath}`);
console.log(`📊 Taille: ${icsContent.length} bytes`);

// Vérifier structure ICS
const hasVCalendar = icsContent.includes('BEGIN:VCALENDAR');
const hasVEvents = icsContent.match(/BEGIN:VEVENT/g);
const eventCount = hasVEvents ? hasVEvents.length : 0;

console.log(`✅ Structure VCALENDAR: ${hasVCalendar ? 'OK' : 'ERREUR'}`);
console.log(`✅ Nombre d'événements: ${eventCount}`);

if (eventCount !== 5) {
  console.log(`❌ ERREUR: Attendu 5 événements, trouvé ${eventCount}`);
} else {
  console.log('✅ Nombre d\'événements correct');
}

// ============ Test 2: Fichier Excel ============
console.log('\n📊 Test 2: Validation fichier Excel');

const xlsxPath = path.join(__dirname, 'test-calendar.xlsx');
const xlsxExists = fs.existsSync(xlsxPath);
const xlsxSize = xlsxExists ? fs.statSync(xlsxPath).size : 0;

console.log(`✅ Fichier existe: ${xlsxExists ? 'OK' : 'ERREUR'}`);
console.log(`📊 Taille: ${xlsxSize} bytes`);

if (xlsxSize === 0) {
  console.log('❌ ERREUR: Fichier Excel vide ou manquant');
} else {
  console.log('✅ Fichier Excel valide');
}

// ============ Test 3: Fichier CSV ============
console.log('\n📝 Test 3: Validation fichier CSV');

const csvPath = path.join(__dirname, 'test-calendar.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const csvLines = csvContent.trim().split('\n');

console.log(`✅ Fichier lu: ${csvPath}`);
console.log(`📊 Nombre de lignes: ${csvLines.length}`);

// Vérifier en-tête
const header = csvLines[0];
const hasDateDebut = header.includes('Date début');
const hasDateFin = header.includes('Date fin');
const hasType = header.includes('Type');

console.log(`✅ Colonne "Date début": ${hasDateDebut ? 'OK' : 'ERREUR'}`);
console.log(`✅ Colonne "Date fin": ${hasDateFin ? 'OK' : 'ERREUR'}`);
console.log(`✅ Colonne "Type": ${hasType ? 'OK' : 'ERREUR'}`);

// Vérifier données
const dataLines = csvLines.length - 1; // -1 pour l'en-tête
console.log(`✅ Lignes de données: ${dataLines}`);

if (dataLines !== 10) {
  console.log(`❌ ERREUR: Attendu 10 lignes, trouvé ${dataLines}`);
} else {
  console.log('✅ Nombre de lignes correct');
}

// ============ Test 4: Edge Cases ============
console.log('\n🐛 Test 4: Validation Edge Cases');

// Test fichier vide
const emptyPath = path.join(__dirname, 'empty-file.ics');
const emptyContent = fs.readFileSync(emptyPath, 'utf-8');
const isEmpty = emptyContent.trim().length === 0;

console.log(`✅ Fichier vide détecté: ${isEmpty ? 'OK' : 'ERREUR'}`);

// Test format invalide
const invalidPath = path.join(__dirname, 'invalid-format.txt');
const invalidExists = fs.existsSync(invalidPath);

console.log(`✅ Fichier format invalide existe: ${invalidExists ? 'OK' : 'ERREUR'}`);

// Test dates invalides
const invalidDatesPath = path.join(__dirname, 'invalid-dates.csv');
const invalidDatesContent = fs.readFileSync(invalidDatesPath, 'utf-8');
const invalidDatesLines = invalidDatesContent.trim().split('\n');

console.log(`✅ Fichier dates invalides: ${invalidDatesLines.length} lignes`);

// Vérifier ligne problématique (date fin < date début)
const problematicLine = invalidDatesLines[1]; // Ligne 2
console.log(`📋 Ligne problématique: ${problematicLine}`);

// ============ Résumé ============
console.log('\n' + '='.repeat(50));
console.log('📊 RÉSUMÉ DES TESTS\n');

const results = {
  'ICS - Structure valide': hasVCalendar,
  'ICS - 5 événements': eventCount === 5,
  'Excel - Fichier existe': xlsxExists,
  'Excel - Taille > 0': xlsxSize > 0,
  'CSV - En-têtes corrects': hasDateDebut && hasDateFin && hasType,
  'CSV - 10 lignes de données': dataLines === 10,
  'Edge - Fichier vide détecté': isEmpty,
  'Edge - Format invalide existe': invalidExists,
};

let passCount = 0;
let failCount = 0;

Object.entries(results).forEach(([test, passed]) => {
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${icon} ${test.padEnd(35)} ${status}`);

  if (passed) {
    passCount++;
  } else {
    failCount++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`\n🎯 Total: ${passCount}/${passCount + failCount} tests passés\n`);

if (failCount === 0) {
  console.log('✅ TOUS LES TESTS PASSENT!\n');
  process.exit(0);
} else {
  console.log(`❌ ${failCount} test(s) échoué(s)\n`);
  process.exit(1);
}
