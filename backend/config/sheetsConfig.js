const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

let auth;
if (process.env.SERVICE_ACCOUNT_JSON) {
  
  const credentials = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}
// const auth = new google.auth.GoogleAuth({
//   keyFile: path.resolve(process.env.SERVICE_ACCOUNT_PATH),
//   scopes: ['https://www.googleapis.com/auth/spreadsheets'],
// });

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const sheetsService = {
  async getPendingSOs() {
    console.log("SPREADSHEET_ID: ",SPREADSHEET_ID);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SO_List!A:D',
    });
    const rows = res.data.values || [];
    console.log("All Rows : ",rows);
    const headers = rows[0];
    return rows.slice(1)
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      })
      .filter(so => so.Status === 'PENDING')
      .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
  },

  async getSODetails(so) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SO_Details!A:E',
    });
    const rows = res.data.values || [];
    const headers = rows[0];
    return rows.slice(1)
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      })
      .filter(r => r.SO === so);
  },


  async updateSOStatus(so, status) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SO_List!A:D',
    });
    const rows = res.data.values || [];
    const rowIndex = rows.findIndex(r => r[1] === so) + 1;
    if (rowIndex < 1) throw new Error('SO not found');

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `SO_List!C${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[status]] },
    });
    return true;
  },


   async getSKUMaster() {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SKU_Master!A:B',
    });
    const rows = res.data.values || [];
    if (rows.length === 0) return [];
 
    const headers = rows[0]; // ['SKU', 'Name']
    return rows.slice(1)
      .filter(r => r[0]) // skip empty rows
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ''; });
        return obj;
      });
    // Returns: [{ SKU: 'ABC123', Name: 'Widget Box' }, ...]
  },

  
  async appendErrors(errors) {
    if (!errors || errors.length === 0) return true;

    // Idempotency check
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Errors!A:F',
    });
    const existingRows = existing.data.values || [];

    const existingKeys = new Set(
      existingRows.slice(1).map(r => `${r[0]}|${r[1]}|${r[4]}`)
    );

    const newErrors = errors.filter(e => {
      const key = `${e.SO}|${e.Location}|${e.ERROR}`;
      return !existingKeys.has(key);
    });

    if (newErrors.length === 0) return true;
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Errors!A:F',
      valueInputOption: 'RAW',
      requestBody: {
        values: newErrors.map(e => [
          e.SO,
          e.Location,
          e.Tag || '',
          e.SKU || '',
          e.ERROR,
          e.Note || ''
        ]),
      },
    });
    return true;
  },

  async updateFinalStatus(so, status) {
    await this.updateSOStatus(so, status);
    return true;
  }
};

module.exports = { sheetsService };