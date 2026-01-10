# UK Crime Watch Dashboard

A high-performance, interactive dashboard for visualizing street-level crime data across the UK. Built with React, Leaflet, and Tailwind CSS, this tool allows users to explore crime patterns through dynamic point-based and custom area (polygon) searches.

## 🚀 Features

- **Interactive Map**: A premium dark-themed map (CartoDB) for clear data visualization.
- **Search by Point**: Click any location on the map to see crimes within a 1-mile radius for the selected month.
- **Custom Area Search**: Draw a polygon on the map to fetch all crimes within a specific geographic boundary.
- **Crime Categorization**: Dynamic legend with color-coded markers for different crime types (Violent Crime, Burglary, Drugs, etc.).
- **Historical Data**: Select specific months to view past crime trends.
- **Outcome Status**: View the police outcome for specific crime incidents where available.

## 📸 Walkthrough GIF
*(Insert Walkthrough GIF here)*

---

## 🛠 Technical Implementation

This dashboard integrates with the **[data.police.uk API](https://data.police.uk/docs/)** to fetch live street-level crime data.

### 1. Point-Based Search
When a user clicks on the map in "Point" mode, the application captures the latitude and longitude of the click and sends a GET request to the `crimes-street` endpoint.

**API Endpoint:**
`GET https://data.police.uk/api/crimes-street/all-crime?lat={lat}&lng={lng}&date={YYYY-MM}`

**Implementation:**
```javascript
const fetchPointCrimes = async (lat, lng, date) => {
  const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${date}`;
  const response = await axios.get(url);
  return response.data;
};
```

### 2. Polygon-Based (Area) Search
In "Area" mode, users can define a custom geometry. The application formats the polygon vertices into a colon-separated string of lat/lng pairs as required by the API.

**API Endpoint:**
`GET https://data.police.uk/api/crimes-street/all-crime?poly={p1_lat},{p1_lng}:{p2_lat},{p2_lng}:{p3_lat},{p3_lng}&date={YYYY-MM}`

**Implementation:**
```javascript
const fetchAreaCrimes = async (polyPoints, date) => {
  const polyString = polyPoints.map(p => `${p[0]},${p[1]}`).join(':');
  const url = `https://data.police.uk/api/crimes-street/all-crime?poly=${polyString}&date=${date}`;
  const response = await axios.get(url);
  return response.data;
};
```

> [!NOTE]
> The API has a limit of 10,000 results per request. If a selected area is too dense, a 503 error is returned, and the dashboard prompts the user to select a smaller area.

---

## 🚦 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/zansangeeth/Traffiq.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📜 License
This project is for educational purposes using public data provided by UK Police Force and British Transport Police.
