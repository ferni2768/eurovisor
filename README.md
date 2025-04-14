# 🎤 Eurovisor v0.1 - Explore Eurovision Song Contest performances
[Link to the Live Demo](https://eurovisor.netlify.app/)

Eurovisor is a web application that celebrates the energy and excitement of the Eurovision Song Contest! It displays performances filtered by year and country using data from the [Eurovision API](https://eurovisionapi.runasp.net/) and brings the magic of live shows right to your screen through the performance videos posted on YouTube. Whether you’re a devoted fan or a curious newcomer, dive in, explore, and enjoy the stunning performances from different eras and nations! 🎧

---

### Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [Technologies](#technologies)
- [Project Structure](#project_structure)
- [Future Enhancements](#future_enhancements)
- [License](#license)

---
<a id="features"></a>

## ✨ Features

- **Dynamic Filtering:**  
  - **Year Filter:** Select a specific year or view multiple years of performances.
  - **Country Filter:** Narrow down performances by country.
  - **Combined Filtering:** Easily mix filters to pinpoint your favorite entries.

- **Dynamic Background:** The background of the app will adapt its colors to fit the displayed content. When a country filter is applied, the background will get the colors from the flag of the country.

- **Responsive Video Display:**  
  - Responsive grid/list view with performance thumbnails.
  - Integration with the React Lite YouTube Embed library for video playback.
  - Lazy loading for improved performance on mobile and desktop.

- **Smooth User Experience:**  
  - Framer Motion works alongside Tailwind for seamless transitions and interactions.
  - Intuitive and minimalistic design focused on content exploration.
  - Built with Next.js 14 and TypeScript for modern, high-performance web development.

---
<a id="screenshots"></a>

## 📷 Screenshots

**Looking for results on Desktop**  
<p align="center">
    <img src="./images/pc.gif" alt="Looking for results on Desktop" />
</p>

**Looking for results on Smartphone**  
<p align="center">
  <img src="./images/phone.gif" alt="Looking for results on Smartphone" width="285" />
</p>

---
<a id="installation"></a>

## Installation

1. **💾 Clone the repository:**

   ```sh
   git clone https://github.com/ferni2768/eurovisor.git
   ```

2. **📂 Navigate to the project directory:**

   ```sh
   cd eurovisor
   ```

3. **📦 Install dependencies:**

   ```sh
   npm install
   ```

4. **▶️ Start the development server:**

   ```sh
   npm start
   ```

---
<a id="usage"></a>

## Usage

### Explore Performances

- **Select Filters:** Choose a year and/or country from the filter options to narrow down the list of performances.

- **Watch Videos:** Click on any video card to launch the embedded YouTube player and enjoy your selected performance.

---
<a id="technologies"></a>

## 🤖 Technologies

- **Next.js**: App Router, server-side rendering, and modern React features.
- **React & React DOM**: Core libraries for building the UI.
- **TypeScript**: Type-safe development for cleaner code.
- **TailwindCSS**: Utility-first CSS framework for fast, responsive styling.
- **SWR**: Data fetching with real-time caching and revalidation.
- **Framer Motion**: Animations and transitions.
- **OverlayScrollbars React**: Customize scrollbar component.
- **React Intersection Observer**: Detects when components enter the viewport.
- **React Lite YouTube Embed**: Lightweight YouTube video embeds.
- **react-world-flags**: Flag icons by ISO country code.
- **Simplex-Noise**: Generates smooth noise (used for background).

---
<a id="project_structure"></a>

## 🏗️ Project Structure

```
eurovisor/
├── public/                          # Static assets
├── src/
│   ├── app/                         # App Router layout and main page
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Main page entrypoint
│   ├── components/
│   │   ├── BackgroundCanvas.js      # Procedural animated background
│   │   ├── CountryFilter.tsx        # Filter by selecting a country
│   │   ├── EntryCard.tsx            # Card displaying a performance
│   │   ├── ErrorCard.tsx            # Shown when API fetch fails
│   │   ├── FilterSection.tsx        # Wrapper for all filters
│   │   ├── FilterStatusMessage.tsx  # Displays active filters
│   │   ├── ResultsList.tsx          # Renders filtered Eurovision entries
│   │   └── YearFilter.tsx           # Filter by selecting a year
│   ├── lib/
│   │   └── dataFetchers.ts          # Data fetching abstraction layer
│   ├── services/
│   │   └── eurovisionService.ts     # Logic for calling the Eurovision API
│   ├── styles/
│   │   └── customPlayButton.css     # Customized play button (invisible)
│   ├── types/
│   │   ├── eurovision.ts            # App data types
│   │   └── react-world-flags.d.ts   # Custom type for flag components
│   └── utils/
│       ├── backgroundHueConfig.tsx  # Flag colors to use in the background
│       ├── colorUtils.tsx           # Helper to determine interface color
│       └── countryUtils.ts          # Country ISO name to country name helper
├── images/                          # Visuals used in this file
├── LICENSE                          # License info
├── package.json                     # Dependencies & scripts
└── README.md                        # Project docs
```

---
<a id="future_enhancements"></a>

## 🔮 Future Enhancements

- **Shareable Links:** Generate shareable links for specific filtered views.
- **Advanced Search Options:** Enable search by performer or song title.
- **Random Performace Button:** A button that will retrieve a performance from a random country in a random year.
- **UI enhancements:** Add more animations and quality of life improvements.
- **Translations:** Support for Swedish and Spanish language.

---
<a id="license"></a>

## 🔑 License

This project is licensed under the [MIT License](LICENSE).