# Google Sheets Integration Setup

Follow these steps to connect your form to Google Sheets:

## Step 1: Open Your Google Sheet
Open this Google Sheet: https://docs.google.com/spreadsheets/d/1OUQw5m-fXsVX7v3NimTvTA5C9qRmoIagb-2VG6V0c2Q/edit

## Step 2: Create Column Headers
In the first row, add these headers:
- A1: Timestamp
- B1: Full Name
- C1: Email
- D1: Phone
- E1: City
- F1: Nature of Business
- G1: Services
- H1: Action

## Step 3: Create Apps Script
1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any existing code
3. Paste this code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.timestamp,
      data.fullName,
      data.email,
      data.phone,
      data.city,
      data.natureOfBusiness,
      data.services,
      data.action
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Save** (💾 icon)
5. Name your project (e.g., "Form Submission Handler")

## Step 4: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - Description: "Form submission endpoint"
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**
6. Click **Authorize access** and allow permissions
7. **Copy the Web App URL** (it looks like: `https://script.google.com/macros/s/...../exec`)

## Step 5: Update Your Application Code
1. Open `src/components/inc/ApplicationForm.tsx`
2. Find line 79: `const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';`
3. Replace `'YOUR_GOOGLE_APPS_SCRIPT_URL'` with your copied URL
4. Save the file

## Testing
1. Submit a test form on your website
2. Check your Google Sheet - a new row should appear with the form data
3. The form will show a "Thank You" message after submission

## Troubleshooting
- If submissions don't appear, check the Apps Script **Executions** tab for errors
- Make sure the Web App is deployed with "Anyone" access
- Verify the URL in your code matches the deployment URL exactly
