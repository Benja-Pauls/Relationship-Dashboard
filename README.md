**Goal:**
Create a React frontend for a Relationship Dashboard app designed to live in the kitchen and help a couple track key relationship & household metrics together. The backend will be Notion (or optionally a CSV file for simplicity). The app should also integrate with Plaid API to show finance data.

---

### **Main Features / Requirements:**

**1. Home Screen Metrics Display:**
Show these key metrics with cute, friendly labels and current monthly summary numbers:

* **Intimacy Moments** (e.g. “Cuddle Count” or “Love Sparks”) — number of sexual/intimate encounters tracked monthly.
* **Dishes Done** (“Dish Duty” or “Clean Plate Club”) — count of days dishes cleaned, adherence % for the month.
* **Trash Taken Out** (“Trash Patrol”) — total hours trash stayed full before taken out, adherence % or average for month.
* **Finances Snapshot** — show combined account balances, weekly changes ( + / - ), and maybe a simple bar or line chart summarizing weekly trend. Use Plaid API to pull data.

Each metric should have:

* A big number or progress bar to show current month status.
* A cute icon or emoji representing the metric.
* Easy “+” and “–” buttons next to each metric to add or subtract entries instantly (e.g. logged a dish washed today, or took out trash).

---

**2. Data Storage & Sync:**

* Primary DB: CSV stored locally or on the server, updated immediately on interaction, to simplify and centralize data, especially financial data from Plaid.
* Ensure the UI updates immediately after changes.

---

**3. Side Pages / Tabs:**

* **Progress & Trends:**

  * Line charts or bar charts for each metric over the last 3 months to track progress.
  * KPI highlights: average sex frequency, dishes adherence %, average trash fullness time, financial balance trends.
* **Notes & Messages:**

  * A cute shared message board where either partner can leave notes, love notes, reminders, or encouragement.
  * Messages can be marked as “read” or “favorite.”

---

**4. UI/UX Design:**

* Clean, minimal, warm and inviting color scheme.
* Large touch targets (for kitchen tablet use).
* Responsive but optimized for tablet or desktop screen.
* Friendly microcopy (e.g., “Nice job on the dishes today! 💪”) when users log progress.
* Optional notifications or reminders to update daily.

---

**5. Integration:**

* Plaid API integration to fetch and display finance info (balances + weekly change).
* Maybe something like OpenAI API to generate messages/notes/encouragements of metrics falling short..?

---

### **Metrics to Track (properties in DB or CSV columns):**

| Metric Name     | Friendly Label     | Data Type | Notes                        | Increment/Decrement buttons? | KPI/Trend charts? |
| --------------- | ------------------ | --------- | ---------------------------- | ---------------------------- | ----------------- |
| sexCount        | “Love Sparks”      | Number    | Counts intimate moments      | Yes                          | Yes               |
| dishesDone      | “Dish Duty”        | Number    | Days dishes cleaned          | Yes                          | Yes               |
| trashFullHours  | “Trash Patrol”     | Number    | Hours trash stays full       | Yes                          | Yes               |
| kittyDuties     | “Kitty Duties”     | Number    | Nights cats fed & litter cleaned | Yes                     | Yes               |
| financesBalance | “Finance Snapshot” | Currency  | Combined balance, weekly +/- | No (auto from Plaid)         | Yes               |
| notes           | “Love Notes”       | Text List | Messages between partners    | Add/edit                     | No                |

---

### **Bonus Features Ideas:**

* Mood tracker (happy, stressed, tired) with emoji selection — to correlate with intimacy trends.
* Daily check-in question with quick answers (“How are you feeling today?”) logged alongside notes.
* Customizable badges or rewards for hitting intimacy or chore goals.
* Voice input support to add notes or increment metrics hands-free.
* Maybe a way to add a photo of the day to the notes page?
* Overall, just make the whole expereince cute and gamified -- my partner is a bit of a nerd and I want to make it fun for her to use; I'm also a bit of a nerd and I want to make it fun for me to use.

---

### **Tech Stack Recommendations:**

* React (functional components with hooks)
* Plaid API client for finance data
* Chart.js or Recharts for visualization
* Optional: Tailwind CSS or Material UI for styling

---

### **Deliverables:**

* Complete React app source code with clear README for setup (including Notion & Plaid config).
* Components: Home screen with metrics & buttons, Progress/Trends page, Notes/Messages page.
* API integration code for Plaid.
* Sample data schema for CSV format.