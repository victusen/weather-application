// Api Endpoints
const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// 2. Initial Application State
let state = {
    // Default location (e.g., Berlin)
    latitude: 52.52, 
    longitude: 13.41,
    city: 'Berlin',
    country: 'Germany',
    timezone: 'Europe/Berlin',

    // Unit Preferences (Metric default)
    temp_unit: 'celsius', // 'celsius' or 'fahrenheit'
    wind_unit: 'kmh',    // 'kmh' or 'mph'
    precip_unit: 'mm',   // 'mm' or 'inch'
    
    // Data storage
    weatherData: null,
    selectedDayIndex: 0, // 0 = Today
};

console.log("Initial state configured.");
console.log(encodeURIComponent("Hello I am"))

// 3. DOM Element Selectors
const dom = {
    // Input and Form
    searchForm: document.querySelector('form'),
    searchInput: document.getElementById('search-input'),
    noResult: document.getElementById('no-result-message'),
    suggestionBox: document.getElementById('suggestion-box'),

    // Current Weather Display
    location: document.getElementById('weather-location'),
    date: document.getElementById('current-date'),
    currentIcon: document.getElementById('current-icon'),
    currentTemp: document.getElementById('current-temp'),
    feelsLike: document.getElementById('feels-like-value'),
    humidity: document.getElementById('humidity-value'),
    wind: document.getElementById('wind-value'),
    precip: document.getElementById('precip-value'),

    // Forecast Containers
    dailyContainer: document.getElementById('daily-forecast-container'),
    hourlyContainer: document.getElementById('hourly-forecast-container'),

    // Unit Toggles (for the handleUnitChange function)
    celsiusBtn: document.getElementById('celsius-unit-btn'),
    fahrenheitBtn: document.getElementById('fahrenheit-unit-btn'),
    kmhBtn: document.getElementById('kmh-unit-btn'),
    mphBtn: document.getElementById('mph-unit-btn'),
    mmBtn: document.getElementById('mm-unit-btn'),
    inchBtn: document.getElementById('inch-unit-btn'),

    // Unit Dropdown 
    unitDropdownBtn: document.querySelector('[data-dropdown="units"]'), // Finds the main Units button
    unitDropdown: document.getElementById('js-switch-dropdown'),
    wheelUnits: document.getElementById('wheel-units'),
    unitSwitchText: document.getElementById('unit-switch-text'), // e.g., "Switch to Imperial"

    // Hourly Dropdown
    dayDropdownBtn: document.getElementById('js-day-dropdown-button'),
    dayDropdown: document.getElementById('js-day-dropdown'), // The entire dropdown container
    selectedDayText: document.getElementById('selected-day'), // The text that shows the current day
    dayDropdownButtonsContainer: document.getElementById('js-day-dropdown'), // Alias for the container
};

console.log("DOM elements selected.");



// 4. Geocoding: Converts city name to coordinates
async function geocodeLocation(city) {
    // 1. Build the API URL with the search parameter
    const url = `${GEOCODING_BASE_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=jsosn`;
    
    try {
        // 2. Wait for the API response (The "fetch")
        const response = await fetch(url);

        // Check if the response was successful (HTTP 200-299)
        if (!response.ok) {
            throw new Error('Geocoding API call failed');
        }

        // 3. Wait for the data to be parsed into a JavaScript object (The ".json()")
        const data = await response.json();
        console.log(data);
        
        // 4. Check if any results were found
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
                latitude: result.latitude,
                longitude: result.longitude,
                city: result.name, 
                country: result.country,
                timezone: result.timezone, // Important for accurate time
            };
        } else {
            return null; // No location found
        }
    } catch (error) {
        console.error('Error fetching geocode data:', error);
        return null;
    }
}

// 5. Core Fetch: Gets weather data using coordinates and units
async function fetchWeatherData(lat, lon) {
    // Get unit preferences from the current state
    const tempUnitAPI = state.temp_unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    const windUnitAPI = state.wind_unit === 'mph' ? 'mph' : 'kmh'; 
    const precipUnitAPI = state.precip_unit === 'inch' ? 'inch' : 'mm';

    // Specify ALL the weather variables we need
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation',
        hourly: 'temperature_2m,weather_code',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        temperature_unit: tempUnitAPI,
        wind_speed_unit: windUnitAPI,
        precipitation_unit: precipUnitAPI,
        timezone: state.timezone || 'auto',
        forecast_days: 7 
    });

    const url = `${FORECAST_BASE_URL}?${params.toString()}`;
    console.log("The params is " + params.toString());

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API call failed');
        const data = await response.json();

        // 6. Update the global state with the new data
        state.weatherData = data;
        
        // If successful, proceed to rendering (You'll write this function next!)
        renderWeather(); 

    } catch (error) {
        console.error('Error fetching weather data:', error);
        dom.noResult.classList.remove('hidden'); // Show error
    }
}

// 8. Main Rendering Function (The central dispatcher)
function renderWeather() {
    // Safety check: ensure we have data before trying to access it
    if (!state.weatherData) return;
    
    const data = state.weatherData;
    const current = data.current;
    console.log('====================================');
    console.table(current);
    console.log('====================================');

    // Define symbols based on the current state units
    // This allows the units to update instantly when a unit button is clicked.
    const tempSymbol = state.temp_unit === "fahrenheit" ? "&deg;C" : "&deg;C";
    const windSymbol = state.wind_unit === 'mph' ? 'mph' : 'km/h';
    const precipSymbol = state.precip_unit === 'inch' ? 'in' : 'mm';

    // 1. Update Location and Date (Data from the API)
    dom.location.textContent = `${state.city}, ${state.country}`;
    dom.date.textContent = formatCurrentDate(current.time, data.timezone);

    // 2. Update Main Display Metrics
    dom.currentIcon.src = getWeatherIcon(current.weather_code);
    dom.currentTemp.innerHTML = `${Math.round(current.temperature_2m)}${tempSymbol}`;
    
    // 3. Update Detail Cards
    dom.feelsLike.innerHTML = `${Math.round(current.apparent_temperature)}${tempSymbol}`;
    dom.humidity.textContent = `${current.relative_humidity_2m}%`;
    dom.wind.textContent = `${current.wind_speed_10m} ${windSymbol}`;
    dom.precip.textContent = `${current.precipitation} ${precipSymbol}`;

    // 4. Call the sub-rendering functions
    
    // Renders the 7 small daily forecast cards
    renderDailyForecast(data.daily, tempSymbol);
    
    // Renders the list of day buttons in the hourly dropdown
    renderDayDropdown(data.daily.time, data.timezone);
    
    // Renders the hourly forecast list for the currently selected day
    renderHourlyForecast(data.hourly, data.daily.time, data.timezone, tempSymbol);
}

// Helper functions
/** Formats a timestamp into a display string (e.g., 'Thursday, Oct 9, 2025') */
function formatCurrentDate(isoDate, timezone) {
    const date = new Date(isoDate);
    // Use the timezone from the API for accurate day/time at the location
    const options = {
        weekday: 'long',  // e.g., "Thursday"
        year: 'numeric',
        month: 'short',   // e.g., "Oct"
        day: 'numeric',
        timeZone: timezone, // Crucial: ensures the date/day is correct for the city
    };
    // toLocaleDateString converts the Date object into the desired format
    return date.toLocaleDateString(undefined, options);
}



/** Formats an ISO date string into a short day name (e.g., 'Thu') */
function formatDayName(isoDate, timezone) {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: timezone });
}

/** Formats an ISO date into a long day name (e.g., 'Thursday') */
function formatLongDayName(isoDate, timezone) {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });
}

/** Formats a timestamp into a time string (e.g., '3 PM') */
function formatTime(isoDate, timezone) {
    const date = new Date(isoDate);
    const options = {
        hour: 'numeric',
        hour12: true, // Use 12-hour format (AM/PM)
        timeZone: timezone,
    };
    return date.toLocaleTimeString('en-US', options);
}


/** Converts WMO code to your local image path (Simplified map) */
function getWeatherIcon(code) {
    // 0: Clear sky
    if (code === 0) return 'assets/images/icon-sunny.webp';
    
    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
    if (code >= 1 && code <= 3) return 'assets/images/icon-partly-cloudy.webp'; 
    
    // 45, 48: Fog and depositing rime fog
    if (code === 45 || code === 48) return 'assets/images/icon-fog.webp';

    // 51-55: Drizzle, 61-67: Rain/Freezing Rain
    if (code >= 51 && code <= 67) return 'assets/images/icon-rain.webp';
    
    // 71-75: Snow fall
    if (code >= 71 && code <= 75) return 'assets/images/icon-snow.webp';
    
    // 80-82: Rain showers (we reuse the rain icon)
    if (code >= 80 && code <= 82) return 'assets/images/icon-rain.webp';
    
    // 95, 96, 99: Thunderstorm
    if (code >= 95) return 'assets/images/icon-storm.webp';

    // Default for any unhandled code
    return 'assets/images/icon-overcast.webp'; 
}

// 9. Daily Forecast Rendering
function renderDailyForecast(dailyData, tempSymbol) {
    dom.dailyContainer.innerHTML = ''; // Clear previous content (the placeholder cards)

    dailyData.time.forEach((dateString, index) => {
        // Access the corresponding data point for this specific day (index)
        const maxTemp = Math.round(dailyData.temperature_2m_max[index]);
        const minTemp = Math.round(dailyData.temperature_2m_min[index]);
        const iconSrc = getWeatherIcon(dailyData.weather_code[index]);
        const dayName = formatDayName(dateString, state.timezone); // Helper function usage

        // Build the HTML template string for one card
        const dailyCard = `
            <div class="p-4 rounded-xl item-shadows bg-[#25253f] transition-all hover:bg-[#3c3b5d] cursor-pointer" data-day-index="${index}">
                <p class="text-center">${dayName}</p>
                <img class="mb-2 w-full h-auto" src="${iconSrc}" alt="Weather for ${dayName}">
                <div class="flex justify-between">
                    <p class="font-bold">${maxTemp}${tempSymbol.replace('&deg;', '')}</p>
                    <p class="text-gray-400">${minTemp}${tempSymbol.replace('&deg;', '')}</p>
                </div>
            </div>
        `;
        // Insert the new card HTML into the container
        dom.dailyContainer.insertAdjacentHTML('beforeend', dailyCard);
    });

    // Add click listeners to the newly rendered daily cards so they switch the hourly view
    dom.dailyContainer.querySelectorAll('[data-day-index]').forEach(card => {
        card.addEventListener('click', handleDaySelection); // Reuses the handler for the hourly dropdown
    });
}

// 10. Hourly Forecast Rendering
function renderHourlyForecast(hourlyData, dailyTimes, timezone, tempSymbol) {
    dom.hourlyContainer.innerHTML = ''; // Clear previous content

    // 1. Determine the date string of the selected day from the dailyTimes array
    const selectedDateString = dailyTimes[state.selectedDayIndex];
    
    // 2. Find the starting index (the first hour of the selected day)
    // We match the 'YYYY-MM-DD' part of the time string
    const startIndex = hourlyData.time.findIndex(t => t.startsWith(selectedDateString.substring(0, 10)));
    
    // 3. Find the ending index (the first hour of the NEXT day)
    // We safely handle the last day by using the optional chaining (?) and checking for -1
    let endIndex = hourlyData.time.findIndex(t => t.startsWith(dailyTimes[state.selectedDayIndex + 1]?.substring(0, 10)));

    // If it's the last day, the end index is the end of the entire data array
    if (endIndex === -1) {
        endIndex = hourlyData.time.length; 
    }

    // Set the selected day text in the UI (Today, Tomorrow, Wednesday, etc.)
    if (state.selectedDayIndex === 0) {
        dom.selectedDayText.textContent = 'Today';
    } else {
        dom.selectedDayText.textContent = formatLongDayName(selectedDateString, timezone);
    }

    // 4. Loop through the hourly data between the start and end indices
    for (let i = startIndex; i < endIndex; i++) {
        const timeString = hourlyData.time[i];
        const temp = Math.round(hourlyData.temperature_2m[i]);
        const iconSrc = getWeatherIcon(hourlyData.weather_code[i]);
        const formattedTime = formatTime(timeString, timezone);

        // Build the HTML template string for one hourly item
        const hourlyItem = `
            <div class="flex rounded-md bg-[#2f2f49] items-center justify-between px-2.5 py-2">
                <div class="flex gap-2 items-center box-border">
                    <img class="h-10 w-10" src="${iconSrc}" alt="Weather at ${formattedTime}">
                    <p class="text-white text-lg ">${formattedTime}</p>
                </div>
                <p class="text-white font-medium">${temp}${tempSymbol.replace('&deg;', '')}</p>
            </div>
        `;
        dom.hourlyContainer.insertAdjacentHTML('beforeend', hourlyItem);
    }
}

// 11. Day Dropdown Rendering (for the Hourly Forecast Selector)
function renderDayDropdown(dailyTimes, timezone) {
    dom.dayDropdownButtonsContainer.innerHTML = ''; // Clear previous content

    dailyTimes.slice(0, 7).forEach((dateString, index) => {
        // Use "Today" for the first day, otherwise use the full day name
        const dayName = index === 0 ? 'Today' : formatLongDayName(dateString, timezone);
        
        // Determine if this button should be highlighted as currently selected
        const isActive = index === state.selectedDayIndex ? 'bg-[#3c3b5d]' : '';

        const buttonHTML = `
            <button class="flex items-center justify-between w-full gap-2 py-2 px-4 mb-1 rounded-md hover:cursor-pointer hover:bg-[#3c3b5d75] ${isActive}" data-day-index="${index}">
                <p class="self-start text-md font-medium text-white">${dayName}</p>
            </button>
        `;
        dom.dayDropdownButtonsContainer.insertAdjacentHTML('beforeend', buttonHTML);
    });

    // Attach click listeners to all the newly created buttons
    dom.dayDropdownButtonsContainer.querySelectorAll('[data-day-index]').forEach(button => {
        button.addEventListener('click', handleDaySelection);
    });
}

/** Handles the day selection from the hourly forecast dropdown (and daily cards) */
function handleDaySelection(event) {
    const dayButton = event.currentTarget;
    // Get the index from the button's data attribute (e.g., '0', '1', '2'...)
    const index = parseInt(dayButton.dataset.dayIndex);

    // 1. Update the state
    state.selectedDayIndex = index;

    // 2. Hide the dropdown
    dom.dayDropdown.classList.add('hidden');
    
    // 3. Re-render the entire weather display to update the hourly forecast and the active button highlights
    renderWeather(); 
}

// 12. Unit Change Handler
/** Updates unit state and triggers a re-fetch of weather data */
function handleUnitChange(newTempUnit, newWindUnit, newPrecipUnit) {
    // 1. Update the global state with the new units
    state.temp_unit = newTempUnit;
    state.wind_unit = newWindUnit;
    state.precip_unit = newPrecipUnit;
    
    // 2. Update visual state of the unit buttons (Highlighting active units)

    // Temperature (C/F)
    dom.celsiusBtn.classList.toggle('bg-[#3c3b5d]', newTempUnit === 'celsius');
    document.getElementById('celsius-checkmark').classList.toggle('hidden', newTempUnit === 'fahrenheit');
    
    dom.fahrenheitBtn.classList.toggle('bg-[#3c3b5d]', newTempUnit === 'fahrenheit');
    document.getElementById('fahrenheit-checkmark').classList.toggle('hidden', newTempUnit === 'celsius');

    // Wind (kmh/mph)
    dom.kmhBtn.classList.toggle('bg-[#3c3b5d]', newWindUnit === 'kmh');
    document.getElementById('kmh-checkmark').classList.toggle('hidden', newWindUnit === 'mph');
    
    dom.mphBtn.classList.toggle('bg-[#3c3b5d]', newWindUnit === 'mph');
    document.getElementById('mph-checkmark').classList.toggle('hidden', newWindUnit === 'kmh');
    
    // Precipitation (mm/inch)
    dom.mmBtn.classList.toggle('bg-[#3c3b5d]', newPrecipUnit === 'mm');
    document.getElementById('mm-checkmark').classList.toggle('hidden', newPrecipUnit === 'inch');
    
    dom.inchBtn.classList.toggle('bg-[#3c3b5d]', newPrecipUnit === 'inch');
    document.getElementById('inch-checkmark').classList.toggle('hidden', newPrecipUnit === 'mm');

    // Update the dropdown header text
    dom.unitSwitchText.textContent = `Switch to ${newTempUnit === 'celsius' ? 'Imperial' : 'Metric'}`;

    // 3. Re-fetch data using the new units in the state
    if (state.weatherData) {
        // fetchWeatherData uses state.temp_unit, state.wind_unit, etc.,
        // to request converted data from the Open-Meteo API.
        fetchWeatherData(state.latitude, state.longitude);
    }
    
    // 4. Close the dropdown menu (cleanup)
    dom.unitDropdown.classList.add('hidden');
    dom.wheelUnits.classList.remove('rotate-[-60deg]');
}

// 10. Event Handler: Handles the Search Submission

/** The main function that runs when the user submits the search form */
async function handleSearch(event) {
    // Stops the default browser behavior (reloading the page) when submitting a form
    event.preventDefault(); 
    
    const city = dom.searchInput.value.trim(); 
    if (!city) return; // Stop if the search bar is empty

    // 1. Get Coordinates using the Geocoding API
    const locationData = await geocodeLocation(city);
    
    if (locationData) {
        // 2. Update Global State with new location data
        state.latitude = locationData.latitude;
        state.longitude = locationData.longitude;
        state.city = locationData.city;
        state.country = locationData.country;
        state.timezone = locationData.timezone;
        
        // Hide "No result" message if successful
        dom.noResult.classList.add('hidden'); 

        // 3. Fetch Weather Data and Render the entire UI
        fetchWeatherData(state.latitude, state.longitude);
    } else {
        // Show "No result" message if geocoding failed
        dom.noResult.classList.remove('hidden'); 
    }
}
// New Function: Fetches multiple suggested locations
async function fetchSuggestions(query) {
    if (query.length < 3) return []; // Only search after 3 characters
    
    // Request up to 5 results for the suggestion box
    const url = `${GEOCODING_BASE_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        
        // Return the array of location objects, or an empty array if none found
        return data.results || [];
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
}

// Function to display the suggested locations in the dropdown
function renderSuggestions(locations) {
    const suggestionContainer = dom.suggestionBox;
    suggestionContainer.innerHTML = ''; // Clear previous suggestions
    
    if (locations.length > 0) {
        locations.forEach(location => {
            // Display: City, Admin Area (if available), Country
            const area = location.admin1 ? `, ${location.admin1}` : '';
            const locationName = `${location.name}${area}, ${location.country}`;

            const item = document.createElement('div');
            item.className = "rounded-md px-2.5 py-2 text-white text-md item-start hover:bg-[#3c3b5d] cursor-pointer";
            item.textContent = locationName;
            
            // Store the full location data on the element for easy use later
            item.dataset.lat = location.latitude;
            item.dataset.lon = location.longitude;
            item.dataset.city = location.name;
            item.dataset.country = location.country;
            item.dataset.timezone = location.timezone;

            // Attach click handler
            item.addEventListener('click', handleSuggestionClick);
            
            suggestionContainer.appendChild(item);
        });
        suggestionContainer.classList.remove('hidden'); // Show the box
    } else {
        suggestionContainer.classList.add('hidden'); // Hide the box
    }
}

// Event handler triggered on every key release in the search bar
function handleSearchInput() {
    const query = dom.searchInput.value.trim();
    if (query.length < 3) {
        dom.suggestionBox.classList.add('hidden');
        return;
    }
    
    fetchSuggestions(query)
        .then(renderSuggestions); // Once suggestions arrive, render them
}

// Event handler for clicking a suggested location
function handleSuggestionClick(event) {
    const item = event.currentTarget;
    const locationData = {
        latitude: parseFloat(item.dataset.lat),
        longitude: parseFloat(item.dataset.lon),
        city: item.dataset.city,
        country: item.dataset.country,
        timezone: item.dataset.timezone,
    };
    
    // 1. Update the search bar text
    dom.searchInput.value = item.textContent;
    
    // 2. Update state and fetch weather (simulating the end of handleSearch)
    state.latitude = locationData.latitude;
    state.longitude = locationData.longitude;
    state.city = locationData.city;
    state.country = locationData.country;
    state.timezone = locationData.timezone;

    dom.suggestionBox.classList.add('hidden'); // Hide the suggestions

    fetchWeatherData(state.latitude, state.longitude);
}

// 13. Initializer Function (Complete)
function init() {
    // 1. Attach the main search handler to the form
    dom.searchForm.addEventListener('submit', handleSearch);

    // 2. Attach Unit Change Listeners (Mapping buttons to unit sets)
    
    // Metric Units (Celsius, km/h, mm)
    dom.celsiusBtn.addEventListener('click', () => handleUnitChange('celsius', 'kmh', 'mm'));
    dom.kmhBtn.addEventListener('click', () => handleUnitChange('celsius', 'kmh', 'mm')); 
    dom.mmBtn.addEventListener('click', () => handleUnitChange('celsius', 'kmh', 'mm'));

    // Imperial Units (Fahrenheit, mph, inch)
    dom.fahrenheitBtn.addEventListener('click', () => handleUnitChange('fahrenheit', 'mph', 'inch'));
    dom.mphBtn.addEventListener('click', () => handleUnitChange('fahrenheit', 'mph', 'inch')); 
    dom.inchBtn.addEventListener('click', () => handleUnitChange('fahrenheit', 'mph', 'inch'));

    // 3. Unit Dropdown Toggle (Keep this for opening the dropdown)
    dom.unitDropdownBtn.addEventListener('click', () => {
      dom.wheelUnits.classList.toggle('rotate-[-60deg]');
      dom.unitDropdown.classList.toggle('hidden');
    });
    
    // 4. Day Dropdown Toggle
    dom.dayDropdownBtn.addEventListener('click', () => {
        dom.dayDropdown.classList.toggle('hidden');
    });

    // ⬇️ ADD THIS NEW LISTENER ⬇️
    dom.searchInput.addEventListener('keyup', handleSearchInput); 
    // You might want to use 'input' for better responsiveness, but 'keyup' is safe.

    // 5. Initial weather load (Default location: Berlin)
    // This triggers the whole data flow for the first time
    fetchWeatherData(state.latitude, state.longitude);
} 

// Start the application!
init();