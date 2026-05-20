/**
 * LeadPilot Apps Script Code
 * Instructions:
 * 1. Open Google Sheets
 * 2. Extensions > Apps Script
 * 3. Delete existing code and paste this
 * 4. Deploy > New Deployment > Web App
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 * 7. Copy the Web App URL and add it to your Client settings in LeadPilot.
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
    if (!sheet) {
      throw new Error("Sheet1 not found");
    }
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.name,
      data.phone,
      data.source || "N/A",
      data.propertyType || "N/A",
      data.budget || "N/A",
      data.status || "New",
      data.assignedTo || "Unassigned",
      new Date().toLocaleString(),
      data.clientId || "N/A"
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("LeadPilot API is running");
}
