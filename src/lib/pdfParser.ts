/**
 * PDF Calendar Parser
 *
 * Parses PDF calendar files and converts them to CalendarEvent objects.
 * Uses intelligent text analysis to detect dates, periods, and availability status.
 *
 * Supports:
 * - Date formats: "01/09/2024", "1er septembre 2024", "du 1 au 15 septembre"
 * - Keywords: école, entreprise, vacances, cours, formation, etc.
 * - Multi-line period detection
 */

import { startOfDay, endOfDay, parse, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFParse } from 'pdf-parse';
import {
  CalendarParseResult,
  CalendarEvent,
  AvailabilityStatus,
} from './types';

/**
 * Convert PDF to CSV using pdf-parse getTable()
 * Extracts table data from PDF and converts to CSV format
 *
 * @param file - PDF File object
 * @returns Promise<File> - CSV File object
 */
export async function convertPDFToCSV(file: File): Promise<File> {
  let parser: PDFParse | null = null;

  try {
    // Read PDF file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create parser
    parser = new PDFParse({ data: buffer });

    // Extract table data
    const result = await parser.getTable();

    // Convert tables to CSV lines
    const csvLines: string[] = [];

    // Process each page
    for (const page of result.pages) {
      if (!page.tables || page.tables.length === 0) continue;

      // Process each table on the page
      for (const table of page.tables) {
        // Each row is an object with cell values
        for (const row of table) {
          // Convert row object to array of values
          const values = Object.values(row);

          // Escape and join with commas
          const csvLine = values
            .map(val => {
              const str = String(val || '').trim();
              // Escape quotes and wrap in quotes if contains comma
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(',');

          if (csvLine) {
            csvLines.push(csvLine);
          }
        }
      }
    }

    // If no table data found, fallback to text extraction
    if (csvLines.length === 0) {
      console.warn('No table data found in PDF, falling back to text extraction');
      const textResult = await parser.getText();
      const lines = textResult.text.split('\n').filter(line => line.trim());
      csvLines.push(...lines);
    }

    // Create CSV content
    const csvContent = csvLines.join('\n');

    // Create new File object
    const csvBlob = new Blob([csvContent], { type: 'text/csv; charset=utf-8' });
    const csvFileName = file.name.replace(/\.pdf$/i, '.csv');

    return new File([csvBlob], csvFileName, { type: 'text/csv' });
  } catch (error) {
    throw new Error(
      `Failed to convert PDF to CSV: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}

// Note: PDF parsing is now handled by converting PDF to CSV first
// See convertPDFToCSV() function above, which uses pdf-parse getTable()
// The converted CSV is then parsed using the standard CSV parser
