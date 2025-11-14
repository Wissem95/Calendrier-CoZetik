/**
 * Team Calendar - Calendar Parser (ICS, Excel, CSV, PDF)
 *
 * Parses calendar files and converts them to CalendarEvent objects.
 * Supports:
 * - iCalendar (.ics) files using ical.js
 * - Excel (.xlsx, .xls) files using ExcelJS
 * - CSV files using ExcelJS
 * - PDF files using pdf-parse with intelligent text analysis
 *
 * Implements keyword-based status detection for all formats.
 */

import ICAL from 'ical.js';
import ExcelJS from 'exceljs';
import { startOfDay, endOfDay } from 'date-fns';
import {
  CalendarParseResult,
  CalendarEvent,
  AvailabilityStatus,
} from './types';

/**
 * Detect availability status from event summary using keyword matching
 *
 * Uses French keywords to categorize events into different availability statuses.
 * Checks are performed in priority order: vacation > school > unavailable > available.
 *
 * @param {string} summary - Event summary/title from the calendar
 * @returns {AvailabilityStatus} Detected status ('vacation', 'school', 'unavailable', or 'available')
 *
 * @example
 * detectStatusFromSummary('Vacances d\'été') // Returns: 'vacation'
 * detectStatusFromSummary('Cours HETIC') // Returns: 'school'
 * detectStatusFromSummary('Disponible entreprise') // Returns: 'available'
 */
function detectStatusFromSummary(summary: string): AvailabilityStatus {
  const lowerSummary = summary.toLowerCase();

  // Priority 1: Vacation keywords
  if (
    lowerSummary.includes('vacances') ||
    lowerSummary.includes('congé') ||
    lowerSummary.includes('conge')
  ) {
    return 'vacation';
  }

  // Priority 2: School/Education keywords
  if (
    lowerSummary.includes('école') ||
    lowerSummary.includes('ecole') ||
    lowerSummary.includes('cours') ||
    lowerSummary.includes('hetic') ||
    lowerSummary.includes('formation') ||
    lowerSummary.includes('étude') ||
    lowerSummary.includes('etude')
  ) {
    return 'school';
  }

  // Priority 3: Unavailable keywords
  if (
    lowerSummary.includes('absent') ||
    lowerSummary.includes('indisponible')
  ) {
    return 'unavailable';
  }

  // Priority 4: Available keywords
  if (
    lowerSummary.includes('entreprise') ||
    lowerSummary.includes('disponible') ||
    lowerSummary.includes('travail') ||
    lowerSummary.includes('work')
  ) {
    return 'available';
  }

  // Default: school (most common case for student calendar)
  return 'school';
}

/**
 * Parse an iCalendar (.ics) file and convert it to CalendarEvent objects
 *
 * This function reads an ICS file, parses all VEVENT components, and converts them
 * to the application's CalendarEvent format. It automatically detects the availability
 * status based on event summary keywords.
 *
 * @param {File} file - The ICS file to parse (from file input or drag & drop)
 * @param {string} memberId - ID of the team member this calendar belongs to
 * @returns {Promise<CalendarParseResult>} Parse result with events or errors
 *
 * @example
 * const result = await parseICSFile(file, 'member-123');
 * if (result.success) {
 *   console.log(`Parsed ${result.events.length} events`);
 * } else {
 *   console.error('Errors:', result.errors);
 * }
 *
 * @throws Never throws - all errors are returned in CalendarParseResult.errors
 */
export async function parseICSFile(
  file: File,
  memberId: string
): Promise<CalendarParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Step 1: Read file as text
    const text = await file.text();

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        events: [],
        errors: ['Le fichier est vide'],
      };
    }

    // Step 2: Parse ICS with ical.js
    let jcalData;
    try {
      jcalData = ICAL.parse(text);
    } catch (parseError) {
      return {
        success: false,
        events: [],
        errors: [
          `Format ICS invalide: ${
            parseError instanceof Error ? parseError.message : String(parseError)
          }`,
        ],
      };
    }

    // Step 3: Extract VEVENT components
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    if (vevents.length === 0) {
      return {
        success: false,
        events: [],
        errors: ['Aucun événement trouvé dans le fichier ICS'],
      };
    }

    // Step 4: Convert to CalendarEvent objects
    const events: CalendarEvent[] = [];

    for (const veventComp of vevents) {
      try {
        // Create ICAL.Event wrapper for easier access
        const event = new ICAL.Event(veventComp);

        // Validate required fields
        if (!event.startDate || !event.endDate) {
          warnings.push(
            `Événement ignoré (dates manquantes): ${event.summary || 'Sans titre'}`
          );
          continue;
        }

        // Convert dates to JavaScript Date objects
        let startDate: Date;
        let endDate: Date;

        try {
          // ical.js returns ICAL.Time objects with toJSDate() method
          startDate = event.startDate.toJSDate();
          endDate = event.endDate.toJSDate();

          // Validate dates
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Date invalide');
          }

          // Ensure end date is after start date
          if (endDate < startDate) {
            warnings.push(
              `Événement ignoré (date de fin avant date de début): ${event.summary || 'Sans titre'}`
            );
            continue;
          }
        } catch (dateError) {
          warnings.push(
            `Événement ignoré (erreur de date): ${event.summary || 'Sans titre'}`
          );
          continue;
        }

        // Detect status from summary
        const summary = event.summary || '';
        const status = detectStatusFromSummary(summary);

        // Create CalendarEvent
        // Note: ID will be auto-generated by the store when adding
        const calendarEvent: CalendarEvent = {
          id: `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          memberId,
          startDate: startOfDay(startDate),
          endDate: endOfDay(endDate),
          status,
          note: summary,
          isImported: true,
        };

        events.push(calendarEvent);
      } catch (eventError) {
        warnings.push(
          `Événement ignoré (erreur de traitement): ${veventComp.getFirstPropertyValue('summary') || 'Sans titre'}`
        );
      }
    }

    // Step 5: Return result
    if (events.length === 0) {
      return {
        success: false,
        events: [],
        errors: ['Aucun événement valide trouvé'],
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    return {
      success: true,
      events,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    // Catch-all for unexpected errors
    return {
      success: false,
      events: [],
      errors: [
        `Erreur lors de la lecture du fichier: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }
}

/**
 * Get a summary of what will be imported from an ICS file
 * Useful for preview before actual import
 *
 * @param {File} file - The ICS file to analyze
 * @returns {Promise<{total: number, byStatus: Record<AvailabilityStatus, number>}>}
 *
 * @example
 * const summary = await getICSFileSummary(file);
 * console.log(`Total: ${summary.total}, École: ${summary.byStatus.school}`);
 */
export async function getICSFileSummary(file: File): Promise<{
  total: number;
  byStatus: Record<AvailabilityStatus, number>;
}> {
  const result = await parseICSFile(file, 'temp');

  const byStatus: Record<AvailabilityStatus, number> = {
    company: 0,
    available: 0,
    unavailable: 0,
    school: 0,
    vacation: 0,
  };

  result.events.forEach((event) => {
    byStatus[event.status]++;
  });

  return {
    total: result.events.length,
    byStatus,
  };
}

/**
 * Helper function to get cell value from a row with flexible column name matching
 *
 * @param {ExcelJS.Row} row - The Excel row to read from
 * @param {string[]} possibleNames - Array of possible column names (case-insensitive)
 * @param {Map<string, number>} columnMap - Map of normalized column names to column indexes
 * @returns {any} The cell value or undefined
 */
function getCellValue(
  row: ExcelJS.Row,
  possibleNames: string[],
  columnMap: Map<string, number>
): any {
  for (const name of possibleNames) {
    const normalizedName = name.toLowerCase().trim();
    const colIndex = columnMap.get(normalizedName);
    if (colIndex !== undefined) {
      const cell = row.getCell(colIndex);
      return cell.value;
    }
  }
  return undefined;
}

/**
 * Convert Excel serial date number to JavaScript Date
 * Excel stores dates as days since 1900-01-01 (with a bug for 1900 being a leap year)
 *
 * @param {number} excelDate - Excel date serial number
 * @returns {Date} JavaScript Date object
 */
function excelDateToJSDate(excelDate: number): Date {
  // Excel epoch starts at 1900-01-01, but Excel incorrectly treats 1900 as a leap year
  // Days before 1900-03-01 need correction
  const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return new Date(excelEpoch.getTime() + excelDate * millisecondsPerDay);
}

/**
 * Parse weekly calendar format (each row = 1 week with 7 day columns)
 *
 * Format: N° Semaine | Date du lundi | LU | MA | ME | JE | VE | SA | DI
 * Each cell contains: "7" = École, empty/blue = Entreprise, "Férié" = Vacation
 */
function parseWeeklyCalendarFormat(
  worksheet: ExcelJS.Worksheet,
  columnMap: Map<string, number>,
  dataStartRow: number,
  memberId: string,
  extractCellText: (cell: ExcelJS.Cell) => string
): CalendarParseResult {
  const events: CalendarEvent[] = [];
  const warnings: string[] = [];

  // Find column indexes
  const semaineColIndex = Array.from(columnMap.entries()).find(([key]) =>
    key.includes('semaine') || key.includes('n°')
  )?.[1];

  const dateColIndex = Array.from(columnMap.entries()).find(([key]) =>
    key.includes('date') || key.includes('lundi')
  )?.[1];

  // Find weekday columns (LU, MA, ME, JE, VE, SA, DI)
  const weekdayColumns: { day: string; colIndex: number; dayOffset: number }[] = [];
  const dayMapping: Record<string, number> = { 'lu': 0, 'ma': 1, 'me': 2, 'je': 3, 've': 4, 'sa': 5, 'di': 6 };

  for (const [colName, colIndex] of columnMap.entries()) {
    const dayOffset = dayMapping[colName];
    if (dayOffset !== undefined) {
      weekdayColumns.push({ day: colName, colIndex, dayOffset });
    }
  }

  weekdayColumns.sort((a, b) => a.dayOffset - b.dayOffset);

  console.log(`📅 Weekly format: semaine col=${semaineColIndex}, date col=${dateColIndex}, weekdays=${weekdayColumns.length}`);

  if (!dateColIndex || weekdayColumns.length === 0) {
    return {
      success: false,
      events: [],
      errors: ['Format calendrier hebdomadaire invalide : colonnes date ou jours manquantes'],
    };
  }

  // Parse each week row
  for (let rowNum = dataStartRow; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    if (!row.hasValues) continue;

    try {
      // Get Monday date
      const dateCell = row.getCell(dateColIndex);
      const dateText = extractCellText(dateCell);

      if (!dateText || dateText.includes('synthèse') || dateText.includes('période')) {
        continue; // Skip summary rows
      }

      // Parse date (DD/MM/YYYY format)
      const dateParts = dateText.split('/');
      if (dateParts.length !== 3) {
        warnings.push(`Ligne ${rowNum}: Format de date invalide "${dateText}"`);
        continue;
      }

      const [day, month, year] = dateParts.map(Number);
      const mondayDate = new Date(year, month - 1, day);

      if (isNaN(mondayDate.getTime())) {
        warnings.push(`Ligne ${rowNum}: Date invalide "${dateText}"`);
        continue;
      }

      // Parse each day of the week
      for (const { colIndex, dayOffset } of weekdayColumns) {
        const cell = row.getCell(colIndex);
        const cellValue = extractCellText(cell);

        // Calculate date for this day
        const currentDate = new Date(mondayDate);
        currentDate.setDate(currentDate.getDate() + dayOffset);

        // Detect status from cell content
        let status: AvailabilityStatus;

        if (cellValue === '7' || cellValue === '7.00') {
          status = 'school'; // École (gris avec "7")
        } else if (cellValue.toLowerCase().includes('férié') || cellValue.toLowerCase().includes('ferie')) {
          status = 'vacation'; // Jour férié
        } else if (cellValue.toLowerCase().includes('vacances') || cellValue.toLowerCase().includes('exam')) {
          status = 'vacation'; // Vacances
        } else if (cellValue.toLowerCase().includes('disponible')) {
          status = 'available'; // Disponible explicite
        } else if (cellValue.toLowerCase().includes('indisponible')) {
          status = 'unavailable'; // Indisponible
        } else {
          status = 'company'; // Entreprise (cellules bleues par défaut)
        }

        // Create event for this day
        events.push({
          id: `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          memberId,
          startDate: startOfDay(currentDate),
          endDate: endOfDay(currentDate),
          status,
          note: cellValue || undefined,
          isImported: true,
        });
      }
    } catch (error) {
      warnings.push(`Ligne ${rowNum}: Erreur de parsing - ${error}`);
    }
  }

  console.log(`✅ Parsed ${events.length} days from weekly calendar`);

  if (events.length === 0) {
    return {
      success: false,
      events: [],
      errors: ['Aucun événement trouvé dans le calendrier hebdomadaire'],
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  return {
    success: true,
    events,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Parse an Excel file (.xlsx, .xls) and convert it to CalendarEvent objects
 *
 * This function reads an Excel file, parses the first sheet, and converts rows
 * to the application's CalendarEvent format. It supports flexible column naming
 * in French and English, and automatically detects availability status.
 *
 * Expected columns (flexible naming):
 * - Date début / Date de début / Start Date / Date / date_debut
 * - Date fin / Date de fin / End Date / date_fin (optional, defaults to start date)
 * - Type / Statut / Status / type (optional, defaults to 'école')
 *
 * @param {File} file - The Excel file to parse
 * @param {string} memberId - ID of the team member this calendar belongs to
 * @returns {Promise<CalendarParseResult>} Parse result with events or errors
 *
 * @example
 * const result = await parseExcelFile(file, 'member-123');
 * if (result.success) {
 *   console.log(`Parsed ${result.events.length} events`);
 * } else {
 *   console.error('Errors:', result.errors);
 * }
 */
export async function parseExcelFile(
  file: File,
  memberId: string
): Promise<CalendarParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Step 1: Read file as ArrayBuffer
    const buffer = await file.arrayBuffer();

    // Step 2: Load workbook with ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Step 3: Get first worksheet
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return {
        success: false,
        events: [],
        errors: ['Le fichier Excel ne contient aucune feuille'],
      };
    }

    // Step 4: Smart header detection - try multiple rows to find real headers
    // (handles merged cells, title rows, etc.)

    let columnMap = new Map<string, number>();
    let headerRowNumber = 1;
    let dataStartRow = 2;

    // Helper function to extract text from Excel cell (handles richText, formulas, etc.)
    const extractCellText = (cell: ExcelJS.Cell): string => {
      if (!cell.value) return '';

      if (typeof cell.value === 'string' || typeof cell.value === 'number') {
        return String(cell.value);
      }

      if (cell.value instanceof Date) {
        return cell.value.toLocaleDateString('fr-FR');
      }

      if (typeof cell.value === 'object') {
        const cellObj = cell.value as any;

        if (cellObj.richText && Array.isArray(cellObj.richText)) {
          return cellObj.richText
            .map((segment: any) => {
              if (typeof segment === 'string') return segment;
              if (segment && typeof segment === 'object' && segment.text) return segment.text;
              return '';
            })
            .filter((t: string) => t)
            .join('');
        }

        if (cellObj.result !== undefined) return String(cellObj.result);
        if (cellObj.text) return cellObj.text;
        if (cell.text && cell.text !== '[object Object]') return cell.text;
      }

      return cell.text || '';
    };

    // Try up to 10 rows to find valid headers
    console.log('🔍 Searching for header row...');

    for (let rowNum = 1; rowNum <= Math.min(10, worksheet.rowCount); rowNum++) {
      const row = worksheet.getRow(rowNum);
      const tempMap = new Map<string, number>();
      const rowValues: string[] = [];

      row.eachCell((cell, colNumber) => {
        const text = extractCellText(cell).toLowerCase().trim();
        if (text && text !== '[object object]') {
          tempMap.set(text, colNumber);
          rowValues.push(text);
        }
      });

      console.log(`  Row ${rowNum}: Found ${tempMap.size} columns, unique values: ${new Set(rowValues).size}, values: ${rowValues.slice(0, 5).join(', ')}...`);

      // Check if this row has diverse column names (not a merged cell/title)
      const uniqueValues = new Set(rowValues).size;

      // Check for calendar-specific patterns
      const hasSemaineColumn = Array.from(tempMap.keys()).some(col =>
        col.includes('semaine') || col.includes('week') || col === 'n°' || col.includes('n° semaine')
      );

      const hasDateColumn = Array.from(tempMap.keys()).some(col =>
        col.includes('date') || col.includes('lundi')
      );

      const hasWeekdayColumns = Array.from(tempMap.keys()).some(col =>
        col === 'lu' || col === 'ma' || col === 'me' || col === 'je' || col === 've'
      );

      // Valid header row criteria for calendar format:
      // 1. Has "semaine" AND "date/lundi" columns
      // 2. OR has weekday columns (lu, ma, me...)
      // 3. OR Multiple unique column names (not all the same = merged cell)
      if ((hasSemaineColumn && hasDateColumn) || hasWeekdayColumns || uniqueValues > 3) {
        columnMap = tempMap;
        headerRowNumber = rowNum;
        dataStartRow = rowNum + 1;
        console.log(`✅ Using row ${rowNum} as headers (calendar format detected)`);
        break;
      }
    }

    console.log('📋 Excel columns detected:', Array.from(columnMap.keys()));

    if (columnMap.size === 0) {
      return {
        success: false,
        events: [],
        errors: [
          'Aucune colonne d\'en-tête valide détectée dans les 10 premières lignes.',
          'Format attendu: Le fichier doit contenir une ligne d\'en-têtes avec : Date début | Date fin | Type',
          'Ou un format calendrier hebdomadaire avec : N° Semaine | Date | LU | MA | ME...'
        ],
      };
    }

    // Step 5: Detect calendar format (weekly grid vs classic table)
    const hasSemaineColumn = Array.from(columnMap.keys()).some(col =>
      col.includes('semaine') || col.includes('week') || col === 'n°'
    );

    const hasWeekdayColumns = Array.from(columnMap.keys()).some(col =>
      col === 'lu' || col === 'ma' || col === 'me'
    );

    // If it's a weekly calendar format (row = week), use specialized parser
    if (hasSemaineColumn && hasWeekdayColumns) {
      console.log('📅 Weekly calendar format detected - using specialized parser');
      return parseWeeklyCalendarFormat(worksheet, columnMap, dataStartRow, memberId, extractCellText);
    }

    // Otherwise, validate columns for classic table format
    const hasDateColumn = Array.from(columnMap.keys()).some(col =>
      col.includes('date') || col.includes('début') || col.includes('debut') || col.includes('start')
    );

    if (!hasDateColumn) {
      return {
        success: false,
        events: [],
        errors: [
          `Colonne "date début" ou "date" non trouvée. Colonnes détectées: ${Array.from(columnMap.keys()).join(', ')}`,
          'Format attendu: Le fichier doit contenir une colonne "Date début" ou "Date"'
        ],
      };
    }

    // Step 6: Parse data rows
    const events: CalendarEvent[] = [];
    const rowCount = worksheet.rowCount;

    console.log(`📊 Parsing data rows from ${dataStartRow} to ${rowCount}...`);

    // Start from data row (skip headers and title rows)
    for (let rowNumber = dataStartRow; rowNumber <= rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Skip empty rows
      if (!row.hasValues) {
        continue;
      }

      try {
        // Get date début (required)
        const dateDebutValue = getCellValue(
          row,
          [
            'date début',
            'date de début',
            'start date',
            'date',
            'date_debut',
            'début',
            'debut',
          ],
          columnMap
        );

        if (!dateDebutValue) {
          warnings.push(`Ligne ${rowNumber}: Date de début manquante`);
          continue;
        }

        // Get date fin (optional, defaults to date début)
        const dateFinValue =
          getCellValue(
            row,
            [
              'date fin',
              'date de fin',
              'end date',
              'date_fin',
              'fin',
            ],
            columnMap
          ) || dateDebutValue;

        // Get type/statut (optional, defaults to 'école')
        const typeValue =
          getCellValue(
            row,
            ['type', 'statut', 'status', 'état', 'etat'],
            columnMap
          ) || 'école';

        // Convert dates
        let startDate: Date;
        let endDate: Date;

        // Handle Excel serial date numbers
        if (typeof dateDebutValue === 'number') {
          startDate = excelDateToJSDate(dateDebutValue);
        } else if (dateDebutValue instanceof Date) {
          startDate = dateDebutValue;
        } else {
          // Try parsing as string
          startDate = new Date(String(dateDebutValue));
        }

        if (typeof dateFinValue === 'number') {
          endDate = excelDateToJSDate(dateFinValue);
        } else if (dateFinValue instanceof Date) {
          endDate = dateFinValue;
        } else {
          endDate = new Date(String(dateFinValue));
        }

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          warnings.push(`Ligne ${rowNumber}: Date invalide`);
          continue;
        }

        if (endDate < startDate) {
          warnings.push(
            `Ligne ${rowNumber}: Date de fin avant date de début`
          );
          continue;
        }

        // Detect status from type value
        const typeStr = String(typeValue);
        const status = detectStatusFromSummary(typeStr);

        // Create CalendarEvent
        const event: CalendarEvent = {
          id: `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          memberId,
          startDate: startOfDay(startDate),
          endDate: endOfDay(endDate),
          status,
          note: typeStr,
          isImported: true,
        };

        events.push(event);
      } catch (rowError) {
        warnings.push(
          `Ligne ${rowNumber}: ${
            rowError instanceof Error ? rowError.message : String(rowError)
          }`
        );
      }
    }

    // Step 6: Return result
    if (events.length === 0) {
      return {
        success: false,
        events: [],
        errors: ['Aucun événement valide trouvé dans le fichier Excel'],
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    return {
      success: true,
      events,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      events: [],
      errors: [
        `Erreur parsing Excel: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }
}

/**
 * Simple CSV parser helper
 * Parses CSV text into an array of row objects
 *
 * @param {string} text - CSV text content
 * @returns {Array<Record<string, string>>} Array of row objects
 */
function parseSimpleCSV(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  // Parse data rows
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Get value from CSV row with flexible column name matching
 *
 * @param {Record<string, string>} row - CSV row object
 * @param {string[]} possibleNames - Array of possible column names
 * @returns {string | undefined} The value or undefined
 */
function getCSVValue(
  row: Record<string, string>,
  possibleNames: string[]
): string | undefined {
  for (const name of possibleNames) {
    // Try exact match first
    if (row[name]) {
      return row[name];
    }

    // Try case-insensitive match
    const normalizedName = name.toLowerCase();
    for (const key of Object.keys(row)) {
      if (key.toLowerCase() === normalizedName) {
        return row[key];
      }
    }
  }
  return undefined;
}

/**
 * Parse a CSV file and convert it to CalendarEvent objects
 *
 * This function parses CSV files with a simple CSV parser.
 * The same flexible column detection and status mapping is applied as for Excel files.
 *
 * Expected CSV columns (flexible naming):
 * - Date début / Date de début / Start Date / Date / date_debut
 * - Date fin / Date de fin / End Date / date_fin (optional, defaults to start date)
 * - Type / Statut / Status / type (optional, defaults to 'école')
 *
 * @param {File} file - The CSV file to parse
 * @param {string} memberId - ID of the team member this calendar belongs to
 * @returns {Promise<CalendarParseResult>} Parse result with events or errors
 *
 * @example
 * const result = await parseCSVFile(file, 'member-123');
 * if (result.success) {
 *   console.log(`Parsed ${result.events.length} events from CSV`);
 * }
 */
export async function parseCSVFile(
  file: File,
  memberId: string
): Promise<CalendarParseResult> {
  try {
    // Read file as text
    const text = await file.text();

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        events: [],
        errors: ['Le fichier CSV est vide'],
      };
    }

    // Parse CSV
    const rows = parseSimpleCSV(text);

    if (rows.length === 0) {
      return {
        success: false,
        events: [],
        errors: ['Aucune donnée trouvée dans le fichier CSV'],
      };
    }

    // Parse data rows
    const events: CalendarEvent[] = [];
    const warnings: string[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index 0 is row 2 (after header)

      try {
        // Get date début (required)
        const dateDebutValue = getCSVValue(
          row,
          [
            'Date début',
            'Date de début',
            'Start Date',
            'Date',
            'date_debut',
            'Début',
            'debut',
          ]
        );

        if (!dateDebutValue) {
          warnings.push(`Ligne ${rowNumber}: Date de début manquante`);
          return;
        }

        // Get date fin (optional)
        const dateFinValue =
          getCSVValue(
            row,
            ['Date fin', 'Date de fin', 'End Date', 'date_fin', 'Fin', 'fin'],
          ) || dateDebutValue;

        // Get type/statut (optional)
        const typeValue =
          getCSVValue(
            row,
            ['Type', 'type', 'Statut', 'statut', 'Status', 'status', 'État', 'etat'],
          ) || 'école';

        // Convert dates
        const startDate = new Date(dateDebutValue);
        const endDate = new Date(dateFinValue);

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          warnings.push(`Ligne ${rowNumber}: Date invalide`);
          return;
        }

        if (endDate < startDate) {
          warnings.push(`Ligne ${rowNumber}: Date de fin avant date de début`);
          return;
        }

        // Detect status
        const status = detectStatusFromSummary(typeValue);

        // Create event
        const event: CalendarEvent = {
          id: `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          memberId,
          startDate: startOfDay(startDate),
          endDate: endOfDay(endDate),
          status,
          note: typeValue,
          isImported: true,
        };

        events.push(event);
      } catch (rowError) {
        warnings.push(
          `Ligne ${rowNumber}: ${
            rowError instanceof Error ? rowError.message : String(rowError)
          }`
        );
      }
    });

    // Return result
    if (events.length === 0) {
      return {
        success: false,
        events: [],
        errors: ['Aucun événement valide trouvé dans le fichier CSV'],
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    return {
      success: true,
      events,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      events: [],
      errors: [
        `Erreur parsing CSV: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }
}

/**
 * Parse any supported calendar file format (ICS, Excel, CSV)
 *
 * This is the main entry point for parsing calendar files. It automatically
 * detects the file type based on extension and routes to the appropriate parser.
 *
 * Supported formats:
 * - .ics (iCalendar)
 * - .xlsx, .xls (Excel)
 * - .csv (Comma-Separated Values)
 *
 * @param {File} file - The calendar file to parse
 * @param {string} memberId - ID of the team member this calendar belongs to
 * @returns {Promise<CalendarParseResult>} Parse result with events or errors
 *
 * @example
 * const result = await parseCalendarFile(file, 'member-123');
 * if (result.success) {
 *   console.log(`Successfully imported ${result.events.length} events`);
 *   // Add events to store
 *   result.events.forEach(event => store.addEvent(event));
 * } else {
 *   console.error('Import failed:', result.errors);
 * }
 */
export async function parseCalendarFile(
  file: File,
  memberId: string
): Promise<CalendarParseResult> {
  // Get file extension
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension) {
    return {
      success: false,
      events: [],
      errors: ['Impossible de déterminer le format du fichier'],
    };
  }

  // Route to appropriate parser
  switch (extension) {
    case 'ics':
      return parseICSFile(file, memberId);

    case 'xlsx':
    case 'xls':
      return parseExcelFile(file, memberId);

    case 'csv':
      return parseCSVFile(file, memberId);

    default:
      return {
        success: false,
        events: [],
        errors: [
          `Format de fichier non supporté: .${extension}`,
          'Formats supportés: .ics, .xlsx, .xls, .csv',
        ],
      };
  }
}
